from __future__ import annotations

import asyncio
from collections.abc import AsyncIterator
from typing import Literal

from langgraph.checkpoint.sqlite.aio import AsyncSqliteSaver
from langgraph.graph import END, StateGraph
from typing_extensions import TypedDict

from app.adapters.calendar_gateway import get_available_slots
from app.adapters.openai_client import get_openai_client_optional, phi_safe_chat_kwargs
from app.core.config import get_settings
from app.core.logger import get_logger
from app.services import supabase_client
from app.services.emergency_keywords import (
    detect_emergency,
    get_emergency_response,
    load_keywords_from_db,
)
from app.services.rag import retrieve_context

logger = get_logger(__name__)

_graph = None
_checkpointer: AsyncSqliteSaver | None = None
_stream_queues: dict[str, asyncio.Queue[str | None]] = {}

IntentType = Literal[
    "faq",
    "booking_request",
    "slot_confirmation",
    "cancellation",
    "emergency",
    "escalation",
    "unknown",
]


class AgentState(TypedDict, total=False):
    session_id: str
    tenant_id: str
    messages: list[dict]
    latest_user_message: str
    intent: IntentType
    rag_context: list[dict]
    available_slots: list[str]
    selected_slot: str | None
    final_response: str
    should_escalate: bool
    is_emergency: bool
    token_stream: list[str]


def _get_stream_queue(session_id: str) -> asyncio.Queue[str | None]:
    if session_id not in _stream_queues:
        _stream_queues[session_id] = asyncio.Queue()
    return _stream_queues[session_id]


async def emergency_interceptor(state: AgentState) -> AgentState:
    """Layer 2: Deterministic regex — NO LLM. First node; terminates graph on match."""
    msg = state.get("latest_user_message", "")
    if detect_emergency(msg):
        response = get_emergency_response()
        await supabase_client.flag_emergency_session(
            state["session_id"], state["tenant_id"], msg
        )
        queue = _get_stream_queue(state["session_id"])
        for word in response.split():
            await queue.put(word + " ")
        await queue.put(None)
        return {
            **state,
            "is_emergency": True,
            "intent": "emergency",
            "final_response": response,
            "token_stream": response.split(),
        }
    return {**state, "is_emergency": False}


async def intent_classifier(state: AgentState) -> AgentState:
    msg = state.get("latest_user_message", "").lower()
    client = get_openai_client_optional()

    if client:
        try:
            settings = get_settings()
            response = await client.chat.completions.create(
                model=settings.openai_chat_model,
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "Classify patient intent. Output ONLY one of: "
                            "faq | booking_request | slot_confirmation | cancellation | "
                            "escalation | unknown"
                        ),
                    },
                    {"role": "user", "content": state["latest_user_message"]},
                ],
                max_tokens=10,
                temperature=0,
                **phi_safe_chat_kwargs(),
            )
            raw = (response.choices[0].message.content or "unknown").strip().lower()
            valid = {
                "faq", "booking_request", "slot_confirmation",
                "cancellation", "escalation", "unknown",
            }
            intent: IntentType = raw if raw in valid else "unknown"  # type: ignore[assignment]
            return {**state, "intent": intent}
        except Exception as exc:
            logger.warning("LLM intent classification failed", extra={"extra_data": {"error": str(exc)}})

    if any(w in msg for w in ("book", "appointment", "schedule", "slot", "available")):
        intent = "booking_request"
    elif any(w in msg for w in ("confirm", "yes", "that time", "works for me")):
        intent = "slot_confirmation"
    elif any(w in msg for w in ("cancel", "reschedule")):
        intent = "cancellation"
    elif any(w in msg for w in ("human", "person", "staff", "coordinator", "speak to")):
        intent = "escalation"
    elif any(w in msg for w in ("?", "what", "how", "when", "cost", "price", "insurance")):
        intent = "faq"
    else:
        intent = "unknown"
    return {**state, "intent": intent}


async def rag_retriever(state: AgentState) -> AgentState:
    category_filter = None
    intent = state.get("intent", "unknown")
    if intent == "faq":
        category_filter = None
    elif "price" in state.get("latest_user_message", "").lower():
        category_filter = "pricing"
    elif "insurance" in state.get("latest_user_message", "").lower():
        category_filter = "insurance"

    try:
        docs = await retrieve_context(
            query=state.get("latest_user_message", ""),
            tenant_id=state["tenant_id"],
            category_filter=category_filter,
            match_count=5,
        )
    except Exception as exc:
        logger.warning("RAG retrieval failed", extra={"extra_data": {"error": str(exc)}})
        docs = []
    return {**state, "rag_context": docs}


async def slot_checker(state: AgentState) -> AgentState:
    slots = await get_available_slots(tenant_id=state["tenant_id"], days_ahead=7)
    return {**state, "available_slots": slots[:8]}


async def response_generator(state: AgentState) -> AgentState:
    rag_text = "\n\n".join(
        f"[{d.get('category', 'INFO').upper()}] {d.get('content_payload', '')}"
        for d in state.get("rag_context", [])
    ) or "No clinic documents available."
    slots_text = "\n".join(state.get("available_slots", [])) or "No slots currently available."

    system = f"""You are a warm, professional patient intake assistant for a high-end medical clinic.
Use ONLY the clinic information below to answer. Never invent medical advice.
If unsure, say you will connect the patient with a team member.

CLINIC KNOWLEDGE:
{rag_text}

AVAILABLE APPOINTMENT SLOTS:
{slots_text}

Rules:
- Be concise, empathetic, and professional
- Never diagnose or prescribe
- If asked for a specific slot, confirm it and ask for patient name and phone
- If patient seems distressed, offer to connect with a human staff member
- For out-of-scope medical advice, politely decline and offer to connect with clinical staff"""

    messages = [{"role": "system", "content": system}] + state.get("messages", [])
    tokens: list[str] = []
    queue = _get_stream_queue(state["session_id"])
    client = get_openai_client_optional()

    if client:
        try:
            settings = get_settings()
            stream = await client.chat.completions.create(
                model=settings.openai_chat_model,
                messages=messages,
                stream=True,
                temperature=0.4,
                max_tokens=500,
                **phi_safe_chat_kwargs(),
            )
            async for chunk in stream:
                token = chunk.choices[0].delta.content or ""
                if token:
                    tokens.append(token)
                    await queue.put(token)
        except Exception as exc:
            logger.warning("LLM streaming failed", extra={"extra_data": {"error": str(exc)}})

    if not tokens:
        fallback = _fallback_response(state)
        for word in fallback.split():
            await queue.put(word + " ")
        tokens = fallback.split()
        final = fallback
    else:
        final = "".join(tokens)

    await queue.put(None)
    return {**state, "final_response": final, "token_stream": tokens}


def _fallback_response(state: AgentState) -> str:
    intent = state.get("intent", "unknown")
    slots = state.get("available_slots", [])
    rag = state.get("rag_context", [])

    if intent == "booking_request" and slots:
        formatted = "\n".join(f"• {s}" for s in slots[:5])
        return (
            f"I found these available appointment times:\n{formatted}\n\n"
            "Which slot works best for you?"
        )
    if rag:
        snippet = rag[0].get("content_payload", "")[:300]
        return f"Based on our clinic information: {snippet}\n\nHow else can I help you today?"
    if intent == "unknown":
        return (
            "I'm not able to provide specific medical advice, but I can help with scheduling, "
            "clinic policies, and connecting you with our care team. What would you like help with?"
        )
    return (
        "Thank you for reaching out. I'm here to help with scheduling and clinic questions. "
        "Would you like to book an appointment or learn about our services?"
    )


async def escalation_trigger(state: AgentState) -> AgentState:
    response = (
        "I'm connecting you with one of our care coordinators right now. "
        "They will be with you shortly. Please stay in this chat."
    )
    queue = _get_stream_queue(state["session_id"])
    for word in response.split():
        await queue.put(word + " ")
    await queue.put(None)

    summary = "\n".join(
        f"{m['role']}: {m['content']}" for m in state.get("messages", [])[-6:]
    )
    await supabase_client.escalate_session(
        session_id=state["session_id"],
        tenant_id=state["tenant_id"],
        ai_summary=summary,
    )
    return {
        **state,
        "should_escalate": True,
        "final_response": response,
        "token_stream": response.split(),
    }


def route_after_emergency(state: AgentState) -> str:
    return END if state.get("is_emergency") else "intent_classifier"


def route_after_intent(state: AgentState) -> str:
    intent = state.get("intent", "unknown")
    if intent == "escalation":
        return "escalation_trigger"
    if intent == "booking_request":
        return "slot_checker"
    if intent in ("faq", "unknown"):
        return "rag_retriever"
    if intent == "slot_confirmation":
        return "response_generator"
    return "response_generator"


def route_after_slot(_state: AgentState) -> str:
    return "rag_retriever"


async def _get_checkpointer() -> AsyncSqliteSaver:
    global _checkpointer
    if _checkpointer is None:
        _checkpointer = AsyncSqliteSaver.from_conn_string("checkpoints.db")
        await _checkpointer.setup()
    return _checkpointer


def build_triage_graph():
    graph = StateGraph(AgentState)
    graph.add_node("emergency_interceptor", emergency_interceptor)
    graph.add_node("intent_classifier", intent_classifier)
    graph.add_node("rag_retriever", rag_retriever)
    graph.add_node("slot_checker", slot_checker)
    graph.add_node("response_generator", response_generator)
    graph.add_node("escalation_trigger", escalation_trigger)

    graph.set_entry_point("emergency_interceptor")
    graph.add_conditional_edges(
        "emergency_interceptor",
        route_after_emergency,
        {"intent_classifier": "intent_classifier", END: END},
    )
    graph.add_conditional_edges(
        "intent_classifier",
        route_after_intent,
        {
            "escalation_trigger": "escalation_trigger",
            "slot_checker": "slot_checker",
            "rag_retriever": "rag_retriever",
            "response_generator": "response_generator",
        },
    )
    graph.add_conditional_edges("slot_checker", route_after_slot, {"rag_retriever": "rag_retriever"})
    graph.add_edge("rag_retriever", "response_generator")
    graph.add_edge("response_generator", END)
    graph.add_edge("escalation_trigger", END)
    return graph


async def get_triage_graph():
    global _graph
    if _graph is None:
        checkpointer = await _get_checkpointer()
        _graph = build_triage_graph().compile(checkpointer=checkpointer)
    return _graph


async def warm_triage_graph() -> None:
    await load_keywords_from_db()
    await get_triage_graph()
    logger.info("LangGraph triage graph pre-warmed")


async def run_triage_agent(
    session_id: str,
    tenant_id: str,
    message: str,
    history: list[dict] | None = None,
) -> AsyncIterator[str]:
    graph = await get_triage_graph()
    queue = _get_stream_queue(session_id)

    while not queue.empty():
        try:
            queue.get_nowait()
        except asyncio.QueueEmpty:
            break

    config = {"configurable": {"thread_id": session_id}}
    initial_state: AgentState = {
        "session_id": session_id,
        "tenant_id": tenant_id,
        "messages": (history or []) + [{"role": "user", "content": message}],
        "latest_user_message": message,
        "intent": "unknown",
        "rag_context": [],
        "available_slots": [],
        "selected_slot": None,
        "final_response": "",
        "should_escalate": False,
        "is_emergency": False,
        "token_stream": [],
    }

    await supabase_client.save_session_thread(
        session_id=session_id,
        tenant_id=tenant_id,
        thread_id=session_id,
        message_history=initial_state["messages"],
    )

    graph_task = asyncio.create_task(graph.ainvoke(initial_state, config=config))

    while True:
        token = await queue.get()
        if token is None:
            break
        yield token

    result = await graph_task

    assistant_reply = result.get("final_response", "")
    updated_messages = (history or []) + [
        {"role": "user", "content": message},
        {"role": "assistant", "content": assistant_reply},
    ]

    if result.get("is_emergency"):
        triage_status = "emergency"
    elif result.get("should_escalate"):
        triage_status = "escalated_to_human"
    else:
        triage_status = "active"

    await supabase_client.update_session_agent_state(
        session_id=session_id,
        tenant_id=tenant_id,
        triage_status=triage_status,
        message_history=updated_messages,
        available_slots=result.get("available_slots", []),
    )

    if not result.get("token_stream") and assistant_reply:
        for word in assistant_reply.split():
            yield word + " "

    yield {
        "available_slots": result.get("available_slots", []),
        "should_escalate": result.get("should_escalate", False),
        "is_emergency": result.get("is_emergency", False),
        "intent": result.get("intent", "unknown"),
    }

    _stream_queues.pop(session_id, None)
