import secrets
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from app.adapters.calendar_gateway import (
    create_calendar_event,
    delete_calendar_event,
    get_available_slots,
)
from app.adapters.redis_client import acquire_lock, release_lock
from app.api.metrics import BOOKINGS
from app.core.security import get_tenant_id, require_admin
from app.services import supabase_client
from app.services.supabase_client import AppointmentConflictError

router = APIRouter(prefix="/schedule", tags=["schedule"])


class BookRequest(BaseModel):
    session_id: str | None = None
    slot_start: str
    selected_slot: str | None = None
    patient_name: str = Field(min_length=1)
    patient_phone: str | None = None
    provider_name: str = "General Practice"
    treatment_type: str = "consultation"


class BookResponse(BaseModel):
    appointment: dict
    confirmation_code: str
    slot_start: str
    slot_end: str
    status: str


class CancelResponse(BaseModel):
    appointment_id: str
    status: str


@router.get("/slots")
async def list_available_slots(
    tenant_id: str = Depends(get_tenant_id),
    days_ahead: int = 7,
    provider_name: str = "General Practice",
):
    slots = await get_available_slots(tenant_id=tenant_id, days_ahead=days_ahead, provider=provider_name)
    return {"slots": slots}


@router.get("/appointments")
async def list_appointments(
    tenant_id: str = Depends(get_tenant_id),
    _admin: dict = Depends(require_admin),
    date: str | None = None,
):
    appointments = await supabase_client.list_appointments(tenant_id, date=date)
    return {"appointments": appointments}


@router.patch("/appointments/{appointment_id}")
async def update_appointment(
    appointment_id: str,
    body: dict,
    tenant_id: str = Depends(get_tenant_id),
    _admin: dict = Depends(require_admin),
):
    updated = await supabase_client.update_appointment(appointment_id, tenant_id, body)
    if not updated:
        raise HTTPException(status_code=404, detail="Appointment not found")
    return {"appointment": updated}


@router.post("/book", response_model=BookResponse)
async def book_appointment(
    body: BookRequest,
    tenant_id: str = Depends(get_tenant_id),
):
    slot_start = body.selected_slot or body.slot_start
    lock_key = f"slot:{tenant_id}:{body.provider_name}:{slot_start}"

    locked = await acquire_lock(lock_key, ttl=30)
    if not locked:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This time slot is currently being booked. Please select another.",
        )

    try:
        existing = await supabase_client.find_conflicting_appointment(
            tenant_id, body.provider_name, slot_start
        )
        if existing:
            raise HTTPException(status_code=409, detail="Slot no longer available.")

        start_dt = datetime.fromisoformat(slot_start.replace("Z", "+00:00"))
        end_dt = start_dt + timedelta(minutes=30)
        confirmation_code = secrets.token_hex(4).upper()

        calendar_event_id = await create_calendar_event(
            tenant_id=tenant_id,
            slot_start=slot_start,
            slot_end=end_dt.isoformat(),
            patient_name=body.patient_name,
            confirmation_code=confirmation_code,
            provider=body.provider_name,
            treatment=body.treatment_type,
        )

        try:
            appointment = await supabase_client.create_appointment(
                tenant_id=tenant_id,
                session_id=body.session_id,
                patient_name=body.patient_name,
                patient_phone=body.patient_phone,
                slot_start=slot_start,
                slot_end=end_dt.isoformat(),
                confirmation_code=confirmation_code,
                calendar_event_id=calendar_event_id,
                provider_name=body.provider_name,
                treatment_type=body.treatment_type,
            )
        except AppointmentConflictError:
            if calendar_event_id:
                await delete_calendar_event(calendar_event_id)
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Slot no longer available.",
            )

        if body.session_id:
            await supabase_client.update_session_triage_status(
                body.session_id, tenant_id, "confirmed"
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


@router.delete("/cancel/{appointment_id}", response_model=CancelResponse)
async def cancel_appointment(
    appointment_id: str,
    tenant_id: str = Depends(get_tenant_id),
    _admin: dict = Depends(require_admin),
):
    appointment = await supabase_client.get_appointment(appointment_id, tenant_id)
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")

    lock_key = f"slot:{tenant_id}:{appointment.get('provider_name', 'General Practice')}:{appointment.get('slot_start')}"
    await release_lock(lock_key)

    event_id = appointment.get("external_event_id") or appointment.get("calendar_event_id")
    if event_id:
        await delete_calendar_event(event_id)

    await supabase_client.cancel_appointment(appointment_id, tenant_id)
    return CancelResponse(appointment_id=appointment_id, status="cancelled")
