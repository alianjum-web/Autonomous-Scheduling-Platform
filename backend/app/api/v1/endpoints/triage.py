"""Triage HTTP routes — delegates all workflows to triage_service."""

import json

from fastapi import APIRouter, Depends, Request, WebSocket, WebSocketDisconnect

from app.api.streaming import sse_response
from app.core.security import get_settings, get_tenant_id, require_admin
from app.schemas.triage import (
    CreateSessionRequest,
    CreateSessionResponse,
    EscalateRequest,
    TriageMessageRequest,
)
from app.services import triage_service
from app.services.compliance import BAARequiredError, require_tenant_baa
from app.services.triage_service import RateLimitExceededError, TriageConnection

router = APIRouter(prefix="/triage", tags=["triage"])


@router.post("/session", response_model=CreateSessionResponse)
async def create_session(
    body: CreateSessionRequest,
    tenant_id: str = Depends(get_tenant_id),
) -> CreateSessionResponse:
    await require_tenant_baa(tenant_id)
    return await triage_service.create_session(tenant_id, body.metadata)


@router.post("/escalate/{session_id}")
async def escalate_session_manual(
    session_id: str,
    body: EscalateRequest,
    tenant_id: str = Depends(get_tenant_id),
    _admin: dict = Depends(require_admin),
):
    return await triage_service.escalate_session(session_id, tenant_id, body)


@router.post("/message/{session_id}")
async def send_triage_message(
    session_id: str,
    body: TriageMessageRequest,
    request: Request,
    tenant_id: str = Depends(get_tenant_id),
):
    await require_tenant_baa(tenant_id)
    history = await triage_service.prepare_message_turn(session_id, tenant_id, body)
    stream = triage_service.stream_message_sse(
        session_id,
        tenant_id,
        body.message,
        history,
        action=body.action,
        selected_slot=body.selected_slot,
    )
    return sse_response(request, stream)


@router.get("/stream/{session_id}")
async def stream_triage(
    session_id: str,
    request: Request,
    tenant_id: str = Depends(get_tenant_id),
):
    await require_tenant_baa(tenant_id)
    session = await triage_service.get_session(session_id, tenant_id)
    stream = triage_service.stream_greeting_sse(session_id, tenant_id, session.get("message_history"))
    return sse_response(request, stream)


@router.websocket("/ws/{session_id}")
async def triage_websocket(websocket: WebSocket, session_id: str):
    await websocket.accept()
    settings = get_settings()

    try:
        connection: TriageConnection | None = None
        initial = await triage_service.connect_from_bearer(
            session_id,
            settings,
            websocket.headers.get("authorization", ""),
        )
        if isinstance(initial, int):
            await websocket.close(code=initial)
            return
        connection = initial

        while True:
            data = json.loads(await websocket.receive_text())

            if connection is None:
                resolved = await triage_service.connect_from_message(session_id, settings, data)
                if isinstance(resolved, int):
                    await websocket.close(code=resolved)
                    return
                connection = resolved

            message = data.get("message", "")
            history = triage_service.parse_message_history(data.get("history"), connection.session)

            try:
                await require_tenant_baa(connection.tenant_id)
            except BAARequiredError as exc:
                await websocket.send_json({"error": "baa_required", "detail": str(exc)})
                await websocket.close(code=4003)
                return

            try:
                async for payload in triage_service.stream_websocket_turn(
                    session_id, connection.tenant_id, message, history
                ):
                    await websocket.send_json(payload)
            except RateLimitExceededError:
                await websocket.send_json({"error": "rate_limited"})

    except WebSocketDisconnect:
        await triage_service.mark_session_abandoned(session_id)
