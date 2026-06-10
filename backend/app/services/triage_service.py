"""Triage session workflows, streaming, and emergency handling."""

from __future__ import annotations

import asyncio
import json
from collections.abc import AsyncIterator
from dataclasses import dataclass
from typing import Any, cast

from jose import JWTError

from app.api.metrics import ESCALATIONS
from app.core.config import Settings
from app.core.security import decode_jwt_token
from app.schemas.db import ChatMessage, PatientSessionRow
from app.schemas.triage import CreateSessionResponse, EscalateRequest, TriageMessageRequest
from app.services import supabase_client
from app.services.agent import run_triage_agent
from app.services.emergency_keywords import detect_emergency, get_emergency_response
from app.services.rate_limiter import check_session_rate_limit


class SessionNotFoundError(Exception):
    """Patient session does not exist for this tenant."""


class RateLimitExceededError(Exception):
    """Session exceeded AI request rate limit."""


# WebSocket close codes used by the triage WS endpoint.
WS_CLOSE_UNAUTHORIZED = 4001
WS_CLOSE_NO_TENANT = 4003
WS_CLOSE_SESSION_NOT_FOUND = 4004


@dataclass(frozen=True)
class TriageConnection:
    tenant_id: str
    session: PatientSessionRow


async def create_session(tenant_id: str, metadata: dict | None) -> CreateSessionResponse:
    session = await supabase_client.create_patient_session(tenant_id, metadata)
    return CreateSessionResponse(session_id=session["id"], status=session["status"])


async def get_session(session_id: str, tenant_id: str) -> PatientSessionRow:
    session = await supabase_client.get_patient_session(session_id, tenant_id)
    if session is None:
        raise SessionNotFoundError()
    return session


async def escalate_session(
    session_id: str,
    tenant_id: str,
    request: EscalateRequest,
) -> dict[str, str]:
    session = await get_session(session_id, tenant_id)
    summary = request.ai_summary or session.get("ai_summary") or "Manual escalation by staff"
    await supabase_client.escalate_session(
        session_id=session_id,
        tenant_id=tenant_id,
        ai_summary=summary,
        patient_name=request.patient_name,
    )
    ESCALATIONS.inc()
    return {"session_id": session_id, "status": "escalated_to_human"}


async def ensure_rate_limit(session_id: str) -> None:
    if not await check_session_rate_limit(session_id):
        raise RateLimitExceededError()


async def prepare_message_turn(
    session_id: str,
    tenant_id: str,
    request: TriageMessageRequest,
) -> list[ChatMessage]:
    """Load session, enforce rate limits, and resolve message history."""
    session = await get_session(session_id, tenant_id)
    await ensure_rate_limit(session_id)
    return request.history or session.get("message_history") or []


async def connect_from_bearer(
    session_id: str,
    settings: Settings,
    bearer_token: str,
) -> TriageConnection | int | None:
    """Authenticate via Authorization header and load the session.

    Returns None when no bearer token was supplied so the client can auth on
    the first message instead.
    """
    if not bearer_token:
        return None

    try:
        tenant_id = resolve_tenant_from_bearer(bearer_token, settings)
    except JWTError:
        return WS_CLOSE_UNAUTHORIZED

    if not tenant_id:
        return WS_CLOSE_NO_TENANT

    try:
        session = await get_session(session_id, tenant_id)
    except SessionNotFoundError:
        return WS_CLOSE_SESSION_NOT_FOUND

    return TriageConnection(tenant_id=tenant_id, session=session)


async def connect_from_message(
    session_id: str,
    settings: Settings,
    payload: dict[str, Any],
) -> TriageConnection | int:
    """Authenticate from the first WebSocket message payload."""
    auth_field = payload.get("authorization", "")
    if not auth_field:
        return WS_CLOSE_UNAUTHORIZED

    try:
        tenant_id = resolve_tenant_from_bearer(auth_field, settings)
    except JWTError:
        return WS_CLOSE_UNAUTHORIZED

    if not tenant_id:
        return WS_CLOSE_NO_TENANT

    try:
        session = await get_session(session_id, tenant_id)
    except SessionNotFoundError:
        return WS_CLOSE_SESSION_NOT_FOUND

    return TriageConnection(tenant_id=tenant_id, session=session)


def resolve_tenant_from_bearer(raw_token: str, settings: Settings) -> str | None:
    token = raw_token.removeprefix("Bearer ").strip()
    if not token:
        return None
    payload = decode_jwt_token(token, settings)
    tenant = payload.get("tenant_id") or payload.get("app_metadata", {}).get("tenant_id")
    return str(tenant) if tenant else None


async def _stream_emergency_sse(session_id: str, tenant_id: str, message: str) -> AsyncIterator[str]:
    """Layer 2 authoritative check — bypasses LangGraph and all LLM calls."""
    await supabase_client.flag_emergency_session(session_id, tenant_id, message)
    response = get_emergency_response()
    paragraphs = [p.strip() for p in response.split("\n\n") if p.strip()]
    for i, paragraph in enumerate(paragraphs):
        suffix = "\n\n" if i < len(paragraphs) - 1 else ""
        yield f"data: {paragraph}{suffix}\n\n"
    yield f"data: [META]{json.dumps({'is_emergency': True, 'intent': 'emergency'})}\n\n"
    yield "data: [DONE]\n\n"


async def stream_message_sse(
    session_id: str,
    tenant_id: str,
    message: str,
    history: list[ChatMessage] | None,
    *,
    action: str | None = None,
    selected_slot: str | None = None,
) -> AsyncIterator[str]:
    if detect_emergency(message):
        async for chunk in _stream_emergency_sse(session_id, tenant_id, message):
            yield chunk
        return

    meta: dict[str, Any] = {}
    try:
        async for item in run_triage_agent(
            session_id,
            tenant_id,
            message,
            history,
            action=action,
            selected_slot=selected_slot,
        ):
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


async def stream_greeting_sse(
    session_id: str,
    tenant_id: str,
    history: list[ChatMessage] | None,
) -> AsyncIterator[str]:
    try:
        async for token in run_triage_agent(session_id, tenant_id, "Hello", history):
            if isinstance(token, str):
                yield f"data: {token}\n\n"
    except asyncio.CancelledError:
        await supabase_client.update_session_status(session_id, "abandoned")
        raise
    finally:
        yield "data: [DONE]\n\n"


async def stream_websocket_turn(
    session_id: str,
    tenant_id: str,
    message: str,
    history: list[ChatMessage],
    *,
    action: str | None = None,
    selected_slot: str | None = None,
) -> AsyncIterator[dict[str, Any]]:
    await ensure_rate_limit(session_id)
    async for token in run_triage_agent(
        session_id,
        tenant_id,
        message,
        history,
        action=action,
        selected_slot=selected_slot,
    ):
        if isinstance(token, str):
            yield {"token": token}
        elif isinstance(token, dict):
            yield {"meta": token}
    yield {"done": True}


def parse_message_history(
    raw_history: Any,
    session: PatientSessionRow | None,
) -> list[ChatMessage]:
    return cast(
        list[ChatMessage],
        raw_history or (session.get("message_history") if session else []) or [],
    )


async def mark_session_abandoned(session_id: str) -> None:
    await supabase_client.update_session_status(session_id, "abandoned")
