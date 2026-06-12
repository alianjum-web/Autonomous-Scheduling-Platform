from __future__ import annotations

import asyncio
from collections.abc import AsyncIterator
from typing import Any, Literal, cast

import aiosqlite
from langchain_core.runnables import RunnableConfig
from langgraph.checkpoint.sqlite.aio import AsyncSqliteSaver
from langgraph.graph import END, StateGraph
from typing_extensions import NotRequired, TypedDict

from app.schemas.db import ChatMessage
from app.schemas.schedule import BookRequest

from app.adapters.calendar_gateway import get_available_slots
from app.adapters.llm import chat_complete, is_chat_available, stream_chat
from app.core.feature_flags import get_feature_flags
from app.core.logger import get_logger
from app.services import supabase_client
from app.services.emergency_keywords import (
    detect_emergency,
    get_emergency_response,
    load_keywords_from_db,
)
from app.services.rag import retrieve_context
from app.services.clinic_knowledge_service import baseline_rag_chunks
from app.services.booking_intent import (
    ISO_SLOT_RE,
    extract_patient_name,
    extract_patient_phone,
    looks_like_name,
    match_slot_from_message,
)
from app.services.scheduling_service import (
    SlotLockError,
    SlotUnavailableError,
    book_appointment,
)

logger = get_logger(__name__)

_graph = None
_checkpointer: AsyncSqliteSaver | None = None
_checkpointer_conn: aiosqlite.Connection | None = None
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


class AgentState(TypedDict):
    session_id: str
    tenant_id: str
    latest_user_message: str
    messages: list[dict[str, str]]
    intent: IntentType
    rag_context: list[dict[str, Any]]
    available_slots: list[str]
    final_response: str
    should_escalate: bool
    is_emergency: bool
    token_stream: list[str]
    selected_slot: NotRequired[str | None]
    booking_confirmed: NotRequired[bool]
    confirmation_code: NotRequired[str | None]
    booked_slot: NotRequired[str | None]
    force_slot_flow: NotRequired[bool]


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
            "token_stream": list(response.split()),
        }
    return {**state, "is_emergency": False}


async def intent_classifier(state: AgentState) -> AgentState:
    msg = state.get("latest_user_message", "")
    msg_lower = msg.lower()
    if state.get("force_slot_flow") or ISO_SLOT_RE.search(msg):
        return {**state, "intent": "slot_confirmation"}
    flags = get_feature_flags()

    if flags.features.triage.intent_classifier_enabled and is_chat_available():
        try:
            raw = await chat_complete(
                [
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
            )
            raw = raw.strip().lower()
            valid = {
                "faq", "booking_request", "slot_confirmation",
                "cancellation", "escalation", "unknown",
            }
            intent: IntentType = raw if raw in valid else "unknown"  # type: ignore[assignment]
            return {**state, "intent": intent}
        except Exception as exc:
            logger.warning("LLM intent classification failed", extra={"extra_data": {"error": str(exc)}})

    if any(w in msg_lower for w in ("book", "appointment", "schedule", "slot", "available")):
        intent = "booking_request"
    elif any(w in msg_lower for w in ("confirm", "yes", "that time", "works for me")):
        intent = "slot_confirmation"
    elif any(w in msg_lower for w in ("cancel", "reschedule")):
        intent = "cancellation"
    elif any(w in msg_lower for w in ("human", "person", "staff", "coordinator", "speak to")):
        intent = "escalation"
    elif any(
        w in msg_lower
        for w in (
            "?", "what", "how", "when", "where", "cost", "price", "insurance",
            "service", "offer", "provide", "facility", "blood", "test", "lab",
            "timing", "hour", "hours", "open", "close", "available",
        )
    ):
        intent = "faq"
    else:
        intent = "unknown"
    return {**state, "intent": intent}


async def rag_retriever(state: AgentState) -> AgentState:
    category_filter = None
    msg_lower = state.get("latest_user_message", "").lower()
    if "price" in msg_lower or "cost" in msg_lower:
        category_filter = "pricing"
    elif "insurance" in msg_lower:
        category_filter = "insurance"
    elif any(w in msg_lower for w in ("treatment", "protocol", "procedure")):
        category_filter = "treatment_protocol"

    baseline = await baseline_rag_chunks(state["tenant_id"])

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

    if category_filter:
        docs = baseline + [d for d in docs if d.get("category") == category_filter]
    else:
        docs = baseline + docs

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
Answer clinic questions (hours, services, pricing, insurance) using ONLY the CLINIC KNOWLEDGE below.
Never invent services, prices, or medical advice. If the knowledge does not mention something, say clearly
that you do not have that information and offer to connect the patient with the front desk or to book a visit.

CLINIC KNOWLEDGE:
{rag_text}

AVAILABLE APPOINTMENT SLOTS:
{slots_text}

Rules:
- Be concise, empathetic, and professional
- For "what services" or "do you offer X" questions, quote relevant lines from CLINIC KNOWLEDGE
- For clinic hours, state the hours from CLINIC KNOWLEDGE exactly
- Never diagnose or prescribe
- If asked for a specific slot, confirm it and ask for patient name and phone
- If patient seems distressed, offer to connect with a human staff member
- For out-of-scope medical advice, politely decline and offer to connect with clinical staff"""

    messages: list[dict[str, str]] = [
        {"role": "system", "content": system},
        *state.get("messages", []),
    ]
    tokens: list[str] = []
    queue = _get_stream_queue(state["session_id"])

    if is_chat_available():
        try:
            async for token in stream_chat(messages, temperature=0.4, max_tokens=500):
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


async def _stream_text_to_queue(session_id: str, text: str) -> list[str]:
    queue = _get_stream_queue(session_id)
    tokens: list[str] = []
    for word in text.split():
        token = word + " "
        tokens.append(token)
        await queue.put(token)
    await queue.put(None)
    return tokens


async def booking_executor(state: AgentState) -> AgentState:
    """Autonomous booking — Redis lock + calendar + DB insert when patient confirms a slot."""
    slots = state.get("available_slots", [])
    message = state.get("latest_user_message", "")
    messages = state.get("messages", [])
    selected = state.get("selected_slot") or match_slot_from_message(message, slots)
    patient_name = extract_patient_name(messages)
    patient_phone = extract_patient_phone(messages)

    if not selected:
        response = (
            "I'd be happy to confirm your appointment. Which of the available times works best "
            "for you? You can reply with the day and time."
        )
        if slots:
            formatted = "\n".join(f"• {s}" for s in slots[:5])
            response = f"{response}\n\nAvailable times:\n{formatted}"
        tokens = await _stream_text_to_queue(state["session_id"], response)
        return {
            **state,
            "final_response": response,
            "token_stream": tokens,
            "booking_confirmed": False,
        }

    if not patient_name:
        response = (
            f"Great — I'll book {selected} for you. What name should I put the appointment under?"
        )
        tokens = await _stream_text_to_queue(state["session_id"], response)
        return {
            **state,
            "selected_slot": selected,
            "final_response": response,
            "token_stream": tokens,
            "booking_confirmed": False,
        }

    try:
        result = await book_appointment(
            state["tenant_id"],
            BookRequest(
                session_id=state["session_id"],
                slot_start=selected,
                selected_slot=selected,
                patient_name=patient_name,
                patient_phone=patient_phone,
            ),
        )
        response = (
            f"You're all set, {patient_name}! Your appointment is confirmed for {selected}. "
            f"Confirmation code: {result.confirmation_code}. "
            "We look forward to seeing you."
        )
        tokens = await _stream_text_to_queue(state["session_id"], response)
        return {
            **state,
            "selected_slot": selected,
            "booking_confirmed": True,
            "confirmation_code": result.confirmation_code,
            "booked_slot": selected,
            "final_response": response,
            "token_stream": tokens,
        }
    except SlotLockError:
        response = (
            "Someone else is booking that slot right now. Please wait a moment and try again, "
            "or choose another time."
        )
    except SlotUnavailableError:
        response = (
            "That slot was just taken. Here are other options — reply with a time that works:\n"
            + "\n".join(f"• {s}" for s in slots[:5])
        )
    except Exception as exc:
        logger.warning("Autonomous booking failed", extra={"extra_data": {"error": str(exc)}})
        response = (
            "I couldn't complete the booking automatically. A care coordinator can help you "
            "finish scheduling — would you like me to connect you with our team?"
        )
        tokens = await _stream_text_to_queue(state["session_id"], response)
        return {
            **state,
            "selected_slot": selected,
            "final_response": response,
            "token_stream": tokens,
            "booking_confirmed": False,
            "should_escalate": True,
        }

    tokens = await _stream_text_to_queue(state["session_id"], response)
    return {
        **state,
        "selected_slot": selected,
        "final_response": response,
        "token_stream": tokens,
        "booking_confirmed": False,
        "should_escalate": False,
    }


def _fallback_response(state: AgentState) -> str:
    intent = state.get("intent", "unknown")
    slots = state.get("available_slots", [])
    rag = state.get("rag_context", [])
    msg_lower = state.get("latest_user_message", "").lower()

    if intent == "booking_request" and slots:
        formatted = "\n".join(f"• {s}" for s in slots[:5])
        return (
            f"I found these available appointment times:\n{formatted}\n\n"
            "Which slot works best for you?"
        )

    if rag:
        combined = "\n".join(
            str(d.get("content_payload") or "") for d in rag if d.get("content_payload")
        )
        if any(w in msg_lower for w in ("hour", "timing", "time", "open", "close", "when")):
            for line in combined.splitlines():
                if "hour" in line.lower() or "bookable" in line.lower():
                    return f"{line.strip()}\n\nWould you like to book an appointment?"
        if any(w in msg_lower for w in ("service", "offer", "provide", "blood", "test", "lab")):
            for line in combined.splitlines():
                if "service" in line.lower() or "doctor" in line.lower():
                    return (
                        f"{line.strip()}\n\n"
                        "If you need a specific test or treatment, I can help you book a visit "
                        "so our team can confirm availability."
                    )
        snippet = combined[:600].strip()
        if snippet:
            return f"Here is what I have from our clinic information:\n\n{snippet}\n\nHow else can I help you?"

    if intent == "unknown":
        return (
            "I'm not able to provide specific medical advice, but I can help with scheduling, "
            "clinic policies, and connecting you with our care team. What would you like help with?"
        )
    return (
        "I don't have detailed clinic information loaded yet. Your clinic owner can add hours and "
        "services under Settings, or upload FAQ documents under Clinic Docs. "
        "Would you like to book an appointment or speak with our team?"
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
        "token_stream": list(response.split()),
    }


def route_after_emergency(state: AgentState) -> str:
    if state.get("is_emergency"):
        return END
    if state.get("force_slot_flow"):
        return "slot_checker"
    selected = state.get("selected_slot")
    if selected and looks_like_name(state.get("latest_user_message", "")):
        return "booking_executor"
    return "intent_classifier"


def route_after_intent(state: AgentState) -> str:
    intent = state.get("intent", "unknown")
    if intent == "escalation":
        return "escalation_trigger"
    if intent == "booking_request":
        return "slot_checker"
    if intent in ("faq", "unknown"):
        return "rag_retriever"
    if intent == "slot_confirmation":
        return "slot_checker"
    return "response_generator"


def route_after_slot(state: AgentState) -> str:
    if state.get("intent") == "slot_confirmation" or state.get("force_slot_flow"):
        return "booking_executor"
    return "rag_retriever"


async def _get_checkpointer() -> AsyncSqliteSaver:
    global _checkpointer, _checkpointer_conn
    if _checkpointer is None:
        _checkpointer_conn = await aiosqlite.connect("checkpoints.db")
        _checkpointer = AsyncSqliteSaver(_checkpointer_conn)
        await _checkpointer.setup()
    return _checkpointer


def build_triage_graph():
    graph = StateGraph(AgentState)
    graph.add_node("emergency_interceptor", emergency_interceptor)
    graph.add_node("intent_classifier", intent_classifier)
    graph.add_node("rag_retriever", rag_retriever)
    graph.add_node("slot_checker", slot_checker)
    graph.add_node("response_generator", response_generator)
    graph.add_node("booking_executor", booking_executor)
    graph.add_node("escalation_trigger", escalation_trigger)

    graph.set_entry_point("emergency_interceptor")
    graph.add_conditional_edges(
        "emergency_interceptor",
        route_after_emergency,
        {
            "intent_classifier": "intent_classifier",
            "slot_checker": "slot_checker",
            "booking_executor": "booking_executor",
            END: END,
        },
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
    graph.add_conditional_edges(
        "slot_checker",
        route_after_slot,
        {"booking_executor": "booking_executor", "rag_retriever": "rag_retriever"},
    )
    graph.add_edge("rag_retriever", "response_generator")
    graph.add_edge("response_generator", END)
    graph.add_edge("booking_executor", END)
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
    history: list[ChatMessage] | None = None,
    *,
    action: str | None = None,
    selected_slot: str | None = None,
) -> AsyncIterator[str | dict[str, Any]]:
    graph = await get_triage_graph()
    queue = _get_stream_queue(session_id)

    while not queue.empty():
        try:
            queue.get_nowait()
        except asyncio.QueueEmpty:
            break

    config: RunnableConfig = {"configurable": {"thread_id": session_id}}
    prev_state = await graph.aget_state(config)
    prev_values = prev_state.values if prev_state else {}

    resolved_slot = selected_slot or prev_values.get("selected_slot")
    prev_slots = prev_values.get("available_slots") or []

    initial_state: AgentState = {
        "session_id": session_id,
        "tenant_id": tenant_id,
        "messages": cast(
            list[dict[str, str]],
            (history or []) + [{"role": "user", "content": message}],
        ),
        "latest_user_message": message,
        "intent": "unknown",
        "rag_context": [],
        "available_slots": prev_slots,
        "final_response": "",
        "should_escalate": False,
        "is_emergency": False,
        "token_stream": [],
        "selected_slot": resolved_slot,
        "force_slot_flow": action == "select_slot" and bool(selected_slot),
    }
    if action == "select_slot" and selected_slot:
        initial_state["intent"] = "slot_confirmation"
        initial_state["selected_slot"] = selected_slot

    await supabase_client.save_session_thread(
        session_id=session_id,
        tenant_id=tenant_id,
        thread_id=session_id,
        message_history=cast(list[dict], initial_state["messages"]),
    )

    async def _run_graph() -> AgentState:
        try:
            return cast(AgentState, await graph.ainvoke(initial_state, config=config))
        except Exception as exc:
            logger.warning("Triage graph failed", extra={"extra_data": {"error": str(exc)}})
            fallback_state: AgentState = {
                **initial_state,
                "intent": "booking_request" if "book" in message.lower() or "appointment" in message.lower() else "unknown",
            }
            fallback = _fallback_response(fallback_state)
            if not fallback_state.get("available_slots"):
                fallback = (
                    "I'm having trouble reaching our AI assistant right now. "
                    "Please try again in a moment, or contact the clinic directly."
                )
            tokens = await _stream_text_to_queue(session_id, fallback)
            return {
                **fallback_state,
                "final_response": fallback,
                "token_stream": tokens,
            }

    graph_task = asyncio.create_task(_run_graph())

    while True:
        token = await queue.get()
        if token is None:
            break
        yield token

    result = await graph_task

    assistant_reply = result.get("final_response", "")
    updated_messages: list[ChatMessage] = (history or []) + [
        {"role": "user", "content": message},
        {"role": "assistant", "content": assistant_reply},
    ]

    if result.get("is_emergency"):
        triage_status = "emergency"
    elif result.get("should_escalate"):
        triage_status = "escalated_to_human"
    elif result.get("booking_confirmed"):
        triage_status = "confirmed"
    else:
        triage_status = "active"

    await supabase_client.update_session_agent_state(
        session_id=session_id,
        tenant_id=tenant_id,
        triage_status=triage_status,
        message_history=cast(list[dict], updated_messages),
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
        "booking_confirmed": result.get("booking_confirmed", False),
        "confirmation_code": result.get("confirmation_code"),
        "booked_slot": result.get("booked_slot"),
    }

    _stream_queues.pop(session_id, None)
