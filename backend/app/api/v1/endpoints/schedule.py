"""Schedule HTTP routes — delegates all workflows to scheduling_service."""

from fastapi import APIRouter, Depends

from app.core.security import get_tenant_id, get_user_id, require_admin
from app.schemas.schedule import (
    AppointmentUpdateRequest,
    BookRequest,
    BookResponse,
    CalendarConfigResponse,
    CalendarConfigUpdateRequest,
    CancelResponse,
)
from app.services import scheduling_service

router = APIRouter(prefix="/schedule", tags=["schedule"])


@router.get("/calendar-config", response_model=CalendarConfigResponse)
async def get_calendar_config(
    tenant_id: str = Depends(get_tenant_id),
    _admin: dict = Depends(require_admin),
) -> CalendarConfigResponse:
    return await scheduling_service.get_calendar_config(tenant_id)


@router.put("/calendar-config", response_model=CalendarConfigResponse)
async def update_calendar_config(
    body: CalendarConfigUpdateRequest,
    tenant_id: str = Depends(get_tenant_id),
    user_id: str = Depends(get_user_id),
    _admin: dict = Depends(require_admin),
) -> CalendarConfigResponse:
    return await scheduling_service.update_calendar_config(tenant_id, user_id, body)


@router.get("/slots")
async def list_available_slots(
    tenant_id: str = Depends(get_tenant_id),
    days_ahead: int = 7,
    provider_name: str = "General Practice",
):
    slots = await scheduling_service.list_slots(
        tenant_id, days_ahead=days_ahead, provider_name=provider_name
    )
    return {"slots": slots}


@router.get("/appointments")
async def list_appointments(
    tenant_id: str = Depends(get_tenant_id),
    _admin: dict = Depends(require_admin),
    date: str | None = None,
):
    appointments = await scheduling_service.list_appointments(tenant_id, date=date)
    return {"appointments": appointments}


@router.patch("/appointments/{appointment_id}")
async def update_appointment(
    appointment_id: str,
    body: AppointmentUpdateRequest,
    tenant_id: str = Depends(get_tenant_id),
    _admin: dict = Depends(require_admin),
):
    appointment = await scheduling_service.update_appointment(
        appointment_id, tenant_id, body.to_patch()
    )
    return {"appointment": appointment}


@router.post("/book", response_model=BookResponse)
async def book_appointment(
    body: BookRequest,
    tenant_id: str = Depends(get_tenant_id),
) -> BookResponse:
    return await scheduling_service.book_appointment(tenant_id, body)


@router.delete("/cancel/{appointment_id}", response_model=CancelResponse)
async def cancel_appointment(
    appointment_id: str,
    tenant_id: str = Depends(get_tenant_id),
    _admin: dict = Depends(require_admin),
) -> CancelResponse:
    return await scheduling_service.cancel_appointment(appointment_id, tenant_id)
