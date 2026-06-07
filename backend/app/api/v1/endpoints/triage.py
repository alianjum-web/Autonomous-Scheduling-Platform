import asyncio
import json

from fastapi import APIRouter, Depends, HTTPException, Request, WebSocket, WebSocketDisconnect, status
from fastapi.responses import StreamingResponse
from jose import JWTError
from pydantic import BaseModel

from app.api.metrics import ESCALATIONS
from app.core.security import decode_jwt_token, get_settings, get_tenant_id, require_admin
from app.services import supabase_client
from app.services.agent import run_triage_agent
from app.services.emergency_keywords import detect_emergency, get_emergency_response
from app.services.rate_limiter import check_session_rate_limit

router = APIRouter(prefix="/triage", tags=["triage"])


class CreateSessionRequest(BaseModel):
    metadata: dict | None = None


class CreateSessionResponse(BaseModel):
    session_id: str
    status: str


class TriageMessageRequest(BaseModel):
    message: str
    history: list[dict] | None = None


class EscalateRequest(BaseModel):
    ai_summary: str | None = None
    patient_name: str | None = None


async def _stream_emergency_response(session_id: str, tenant_id: str, message: str):
    """Layer 2 authoritative check — bypasses LangGraph and all LLM calls."""
    await supabase_client.flag_emergency_session(session_id, tenant_id, message)
    response = get_emergency_response()
    paragraphs = [p.strip() for p in response.split("\n\n") if p.strip()]
    for i, paragraph in enumerate(paragraphs):
        suffix = "\n\n" if i < len(paragraphs) - 1 else ""
        yield f"data: {paragraph}{suffix}\n\n"
    yield f"data: [META]{json.dumps({'is_emergency': True, 'intent': 'emergency'})}\n\n"
    yield "data: [DONE]\n\n"


async def _stream_response(session_id: str, tenant_id: str, message: str, history: list[dict] | None):
    if detect_emergency(message):
        async for chunk in _stream_emergency_response(session_id, tenant_id, message):
            yield chunk
        return

    meta: dict = {}
    try:
        async for item in run_triage_agent(session_id, tenant_id, message, history):
            if isinstance(item, dict):
                meta = item
            else:
                yield f"data: {item}\n\n"
    except asyncio.CancelledError:
        await supabase_client.update_session_status(session_id, "abandoned")
        raise
    finally:
        if meta:
            yield f"data: [META]{json.dumps(meta)}\n\n"
        yield "data: [DONE]\n\n"


@router.post("/session", response_model=CreateSessionResponse)
async def create_session(
    body: CreateSessionRequest,
    tenant_id: str = Depends(get_tenant_id),
) -> CreateSessionResponse:
    session = await supabase_client.create_patient_session(tenant_id, body.metadata)
    return CreateSessionResponse(session_id=session["id"], status=session["status"])


@router.post("/escalate/{session_id}")
async def escalate_session_manual(
    session_id: str,
    body: EscalateRequest,
    tenant_id: str = Depends(get_tenant_id),
    _admin: dict = Depends(require_admin),
):
    session = await supabase_client.get_patient_session(session_id, tenant_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found")

    summary = body.ai_summary or session.get("ai_summary") or "Manual escalation by staff"
    await supabase_client.escalate_session(
        session_id=session_id,
        tenant_id=tenant_id,
        ai_summary=summary,
        patient_name=body.patient_name,
    )
    ESCALATIONS.inc()
    return {"session_id": session_id, "status": "escalated_to_human"}


@router.post("/message/{session_id}")
async def send_triage_message(
    session_id: str,
    body: TriageMessageRequest,
    request: Request,
    tenant_id: str = Depends(get_tenant_id),
):
    session = await supabase_client.get_patient_session(session_id, tenant_id)
    if session is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    if not await check_session_rate_limit(session_id):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded: max 3 AI requests per minute",
        )

    history = body.history or session.get("message_history") or []

    async def event_generator():
        async for chunk in _stream_response(session_id, tenant_id, body.message, history):
            if await request.is_disconnected():
                break
            yield chunk

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@router.get("/stream/{session_id}")
async def stream_triage(
    session_id: str,
    request: Request,
    tenant_id: str = Depends(get_tenant_id),
):
    session = await supabase_client.get_patient_session(session_id, tenant_id)
    if session is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    async def event_generator():
        try:
            async for token in run_triage_agent(
                session_id, tenant_id, "Hello", session.get("message_history")
            ):
                if isinstance(token, str):
                    if await request.is_disconnected():
                        break
                    yield f"data: {token}\n\n"
        except asyncio.CancelledError:
            await supabase_client.update_session_status(session_id, "abandoned")
            raise
        finally:
            yield "data: [DONE]\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@router.websocket("/ws/{session_id}")
async def triage_websocket(websocket: WebSocket, session_id: str):
    await websocket.accept()
    settings = get_settings()

    def tenant_from_bearer(raw_token: str) -> str | None:
        token = raw_token.removeprefix("Bearer ").strip()
        if not token:
            return None
        payload = decode_jwt_token(token, settings)
        tenant = payload.get("tenant_id") or payload.get("app_metadata", {}).get("tenant_id")
        return str(tenant) if tenant else None

    try:
        tenant_id: str | None = None
        header_auth = websocket.headers.get("authorization", "")
        if header_auth:
            try:
                tenant_id = tenant_from_bearer(header_auth)
            except JWTError:
                await websocket.close(code=4001)
                return

        session = None
        pending_first_message: dict | None = None

        if tenant_id:
            session = await supabase_client.get_patient_session(session_id, tenant_id)
            if session is None:
                await websocket.close(code=4004)
                return

        while True:
            if pending_first_message is not None:
                data = pending_first_message
                pending_first_message = None
            else:
                raw = await websocket.receive_text()
                data = json.loads(raw)

            if tenant_id is None:
                auth_field = data.get("authorization", "")
                if not auth_field:
                    await websocket.close(code=4001)
                    return
                try:
                    tenant_id = tenant_from_bearer(auth_field)
                except JWTError:
                    await websocket.close(code=4001)
                    return
                if not tenant_id:
                    await websocket.close(code=4003)
                    return
                session = await supabase_client.get_patient_session(session_id, tenant_id)
                if session is None:
                    await websocket.close(code=4004)
                    return

            message = data.get("message", "")
            history = data.get("history") or (session.get("message_history") if session else []) or []

            if not await check_session_rate_limit(session_id):
                await websocket.send_json({"error": "rate_limited"})
                continue

            async for token in run_triage_agent(session_id, tenant_id, message, history):
                if isinstance(token, str):
                    await websocket.send_json({"token": token})
                elif isinstance(token, dict):
                    await websocket.send_json({"meta": token})
            await websocket.send_json({"done": True})

    except WebSocketDisconnect:
        await supabase_client.update_session_status(session_id, "abandoned")
