"""Appointment booking, cancellation, and slot workflows."""

from __future__ import annotations

import secrets
from datetime import datetime, timedelta

from app.adapters.calendar_gateway import (
    create_calendar_event,
    delete_calendar_event,
    get_available_slots,
    resolve_tenant_calendar_config,
)
from app.adapters.redis_client import acquire_lock, release_lock
from app.api.metrics import BOOKINGS
from app.schemas.db import AppointmentRow
from app.schemas.schedule import (
    BookRequest,
    BookResponse,
    CalendarConfigResponse,
    CalendarConfigUpdateRequest,
    CancelResponse,
)
from app.services import supabase_client
from app.services.supabase_client import AppointmentConflictError


class SlotLockError(Exception):
    """Another client is currently booking this slot."""


class SlotUnavailableError(Exception):
    """Slot is no longer available."""


class AppointmentNotFoundError(Exception):
    """Appointment does not exist for this tenant."""


async def list_slots(
    tenant_id: str,
    *,
    days_ahead: int = 7,
    provider_name: str = "General Practice",
) -> list[str]:
    return await get_available_slots(
        tenant_id=tenant_id, days_ahead=days_ahead, provider=provider_name
    )


async def list_appointments(tenant_id: str, *, date: str | None = None) -> list[AppointmentRow]:
    return await supabase_client.list_appointments(tenant_id, date=date)


async def update_appointment(
    appointment_id: str,
    tenant_id: str,
    patch: dict,
) -> AppointmentRow:
    updated = await supabase_client.update_appointment(appointment_id, tenant_id, patch)
    if not updated:
        raise AppointmentNotFoundError()
    return updated


async def book_appointment(tenant_id: str, request: BookRequest) -> BookResponse:
    slot_start = request.selected_slot or request.slot_start
    lock_key = f"slot:{tenant_id}:{request.provider_name}:{slot_start}"

    locked = await acquire_lock(lock_key, ttl=30)
    if not locked:
        raise SlotLockError()

    try:
        existing = await supabase_client.find_conflicting_appointment(
            tenant_id, request.provider_name, slot_start
        )
        if existing:
            raise SlotUnavailableError()

        start_dt = datetime.fromisoformat(slot_start.replace("Z", "+00:00"))
        end_dt = start_dt + timedelta(minutes=30)
        confirmation_code = secrets.token_hex(4).upper()

        calendar_event_id = await create_calendar_event(
            tenant_id=tenant_id,
            slot_start=slot_start,
            slot_end=end_dt.isoformat(),
            patient_name=request.patient_name,
            confirmation_code=confirmation_code,
            provider=request.provider_name,
            treatment=request.treatment_type,
        )

        try:
            appointment = await supabase_client.create_appointment(
                tenant_id=tenant_id,
                session_id=request.session_id,
                patient_name=request.patient_name,
                patient_phone=request.patient_phone,
                slot_start=slot_start,
                slot_end=end_dt.isoformat(),
                confirmation_code=confirmation_code,
                calendar_event_id=calendar_event_id,
                provider_name=request.provider_name,
                treatment_type=request.treatment_type,
            )
        except AppointmentConflictError:
            if calendar_event_id:
                await delete_calendar_event(tenant_id, calendar_event_id)
            raise SlotUnavailableError() from None

        if request.session_id:
            await supabase_client.update_session_triage_status(
                request.session_id, tenant_id, "confirmed"
            )

        BOOKINGS.inc()
        return BookResponse(
            appointment=appointment,
            confirmation_code=confirmation_code,
            slot_start=slot_start,
            slot_end=end_dt.isoformat(),
            status="confirmed",
        )
    finally:
        await release_lock(lock_key)


async def cancel_appointment(appointment_id: str, tenant_id: str) -> CancelResponse:
    appointment = await supabase_client.get_appointment(appointment_id, tenant_id)
    if not appointment:
        raise AppointmentNotFoundError()

    lock_key = (
        f"slot:{tenant_id}:{appointment.get('provider_name', 'General Practice')}:"
        f"{appointment.get('slot_start')}"
    )
    await release_lock(lock_key)

    event_id = appointment.get("external_event_id") or appointment.get("calendar_event_id")
    if event_id:
        await delete_calendar_event(tenant_id, event_id)

    await supabase_client.cancel_appointment(appointment_id, tenant_id)
    return CancelResponse(appointment_id=appointment_id, status="cancelled")


async def get_calendar_config(tenant_id: str) -> CalendarConfigResponse:
    config = await resolve_tenant_calendar_config(tenant_id)
    return CalendarConfigResponse(
        timezone=config.timezone,
        calendar_provider=config.calendar_provider,
        google_calendar_id=config.google_calendar_id,
        business_hours_start=config.business_hours_start,
        business_hours_end=config.business_hours_end,
        slot_duration_minutes=config.slot_duration_minutes,
        google_connected=config.uses_google,
        uses_mock_slots=not config.uses_google,
    )


async def update_calendar_config(
    tenant_id: str,
    user_id: str,
    body: CalendarConfigUpdateRequest,
) -> CalendarConfigResponse:
    await supabase_client.update_tenant_calendar_config(
        tenant_id,
        timezone=body.timezone,
        calendar_provider=body.calendar_provider,
        google_calendar_id=body.google_calendar_id,
        business_hours_start=body.business_hours_start,
        business_hours_end=body.business_hours_end,
        slot_duration_minutes=body.slot_duration_minutes,
    )
    await supabase_client.insert_audit_log(
        tenant_id=tenant_id,
        actor_id=user_id,
        action="calendar_config_updated",
        resource_type="tenant",
        resource_id=tenant_id,
        metadata=body.model_dump(),
    )
    return await get_calendar_config(tenant_id)
