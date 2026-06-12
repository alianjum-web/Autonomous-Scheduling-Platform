"""Public patient booking — no workspace membership required."""

import re

from fastapi import APIRouter, Body, Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.api.streaming import sse_response
from app.core.config import Settings, get_settings
from app.core.guest_token import create_guest_token, decode_guest_token
from app.schemas.public import (
    PublicClinicResponse,
    PublicGuestSessionStart,
    PublicIntakeRequest,
    PublicTriageSessionResponse,
)
from app.schemas.schedule import BookRequest, BookResponse
from app.services import scheduling_service
from app.schemas.triage import TriageMessageRequest
from app.services import supabase_client, triage_service
from app.services.compliance import BAARequiredError, require_tenant_baa
from app.services.triage_service import RateLimitExceededError, SessionNotFoundError

router = APIRouter(prefix="/public", tags=["public"])
guest_scheme = HTTPBearer(auto_error=False)

_SLUG_RE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")


def _normalize_slug(raw: str) -> str:
    value = raw.strip().lower()
    if value.startswith("clinic/"):
        value = value.removeprefix("clinic/")
    value = value.strip("/")
    return value


async def _tenant_for_public_booking(slug: str) -> dict:
    normalized = _normalize_slug(slug)
    if not normalized or not _SLUG_RE.match(normalized):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Clinic not found")
    tenant = await supabase_client.get_public_tenant_by_slug(normalized)
    if tenant is not None:
        return tenant
    existing = await supabase_client.get_tenant_by_slug(normalized)
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=(
                "This clinic exists but has not published its booking page yet. "
                "The clinic owner must sign in and publish it under Settings → Public booking page."
            ),
        )
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=(
            f'No clinic registered at "{normalized}". '
            "Use the booking link from your clinic — owners get their URL after sign-up and onboarding."
        ),
    )


async def _guest_context(
    slug: str,
    session_id: str,
    credentials: HTTPAuthorizationCredentials | None,
    settings: Settings,
) -> tuple[str, str]:
    if credentials is None or not credentials.credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Guest token required")
    try:
        claims = decode_guest_token(settings, credentials.credentials)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)) from exc

    if claims["session_id"] != session_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Session mismatch")

    tenant = await _tenant_for_public_booking(slug)
    if str(tenant["id"]) != claims["tenant_id"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Clinic mismatch")

    return str(tenant["id"]), session_id


@router.get("/clinics/{slug}", response_model=PublicClinicResponse)
async def get_public_clinic(slug: str) -> PublicClinicResponse:
    tenant = await _tenant_for_public_booking(slug)
    return PublicClinicResponse(
        slug=str(tenant["slug"]),
        name=str(tenant["name"]),
        welcome_message=tenant.get("booking_welcome_message"),
    )


@router.post("/clinics/{slug}/triage/session", response_model=PublicTriageSessionResponse)
async def create_public_triage_session(
    slug: str,
    body: PublicGuestSessionStart | None = Body(default=None),
    settings: Settings = Depends(get_settings),
) -> PublicTriageSessionResponse:
    tenant = await _tenant_for_public_booking(slug)
    tenant_id = str(tenant["id"])
    try:
        await require_tenant_baa(tenant_id)
    except BAARequiredError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc

    start = body or PublicGuestSessionStart()
    metadata = {
        "guest": True,
        "patient_name": None,
        "patient_phone": None,
        "patient_email": None,
        "chief_complaint": start.chief_complaint,
        "source": "public_booking_page",
        "intake_pending": True,
    }
    session = await triage_service.create_session(tenant_id, metadata)
    guest_token = create_guest_token(settings, tenant_id=tenant_id, session_id=session.session_id)
    return PublicTriageSessionResponse(
        session_id=session.session_id,
        guest_token=guest_token,
        status=session.status,
    )


@router.post("/clinics/{slug}/triage/session/intake", response_model=PublicTriageSessionResponse)
async def complete_public_intake(
    slug: str,
    body: PublicIntakeRequest,
    settings: Settings = Depends(get_settings),
) -> PublicTriageSessionResponse:
    """Legacy: full intake before triage (kept for compatibility)."""
    tenant = await _tenant_for_public_booking(slug)
    tenant_id = str(tenant["id"])
    try:
        await require_tenant_baa(tenant_id)
    except BAARequiredError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc

    metadata = {
        "guest": True,
        "patient_name": body.full_name,
        "patient_phone": body.phone,
        "patient_email": body.email,
        "chief_complaint": body.chief_complaint,
        "source": "public_booking_page",
        "intake_pending": False,
    }
    session = await triage_service.create_session(tenant_id, metadata)
    guest_token = create_guest_token(settings, tenant_id=tenant_id, session_id=session.session_id)
    return PublicTriageSessionResponse(
        session_id=session.session_id,
        guest_token=guest_token,
        status=session.status,
    )


@router.post("/clinics/{slug}/triage/message/{session_id}")
async def send_public_triage_message(
    slug: str,
    session_id: str,
    body: TriageMessageRequest,
    request: Request,
    credentials: HTTPAuthorizationCredentials | None = Depends(guest_scheme),
    settings: Settings = Depends(get_settings),
):
    tenant_id, _ = await _guest_context(slug, session_id, credentials, settings)
    try:
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
    except SessionNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found") from exc
    except RateLimitExceededError as exc:
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail=str(exc)) from exc
    except BAARequiredError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc

    return sse_response(request, stream)


@router.post("/clinics/{slug}/book", response_model=BookResponse)
async def public_book_appointment(
    slug: str,
    body: BookRequest,
    credentials: HTTPAuthorizationCredentials | None = Depends(guest_scheme),
    settings: Settings = Depends(get_settings),
) -> BookResponse:
    if body.session_id is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="session_id required")
    tenant_id, _ = await _guest_context(slug, body.session_id, credentials, settings)
    try:
        await require_tenant_baa(tenant_id)
    except BAARequiredError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc
    return await scheduling_service.book_appointment(tenant_id, body)
