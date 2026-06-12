"""Schedule HTTP routes — delegates all workflows to scheduling_service."""

from fastapi import APIRouter, Depends, HTTPException

from app.core.config import Settings, get_settings
from app.core.security import (
    get_tenant_id,
    get_user_id,
    require_clinic_manager,
    require_owner,
    require_staff,
)
from app.schemas.public import BookingPageConfigRequest, BookingPageConfigResponse
from app.schemas.schedule import (
    AppointmentUpdateRequest,
    BookRequest,
    BookResponse,
    CalendarConfigResponse,
    CalendarConfigUpdateRequest,
    CancelResponse,
)
from app.services import scheduling_service, supabase_client

router = APIRouter(prefix="/schedule", tags=["schedule"])


@router.get("/booking-page", response_model=BookingPageConfigResponse)
async def get_booking_page(
    tenant_id: str = Depends(get_tenant_id),
    settings: Settings = Depends(get_settings),
    _manager: dict = Depends(require_clinic_manager),
) -> BookingPageConfigResponse:
    tenant = await supabase_client.get_tenant(tenant_id)
    if tenant is None:
        raise HTTPException(status_code=404, detail="Tenant not found")
    slug = tenant.get("slug")
    enabled = bool(tenant.get("booking_enabled"))
    public_url = f"{settings.frontend_origin}/clinic/{slug}" if slug and enabled else None
    return BookingPageConfigResponse(
        enabled=bool(tenant.get("booking_enabled")),
        welcome_message=tenant.get("booking_welcome_message"),
        public_url=public_url,
        clinic_hours_info=tenant.get("clinic_hours_info"),
        clinic_services=tenant.get("clinic_services"),
    )


@router.put("/booking-page", response_model=BookingPageConfigResponse)
async def update_booking_page(
    body: BookingPageConfigRequest,
    tenant_id: str = Depends(get_tenant_id),
    settings: Settings = Depends(get_settings),
    _manager: dict = Depends(require_clinic_manager),
) -> BookingPageConfigResponse:
    tenant = await supabase_client.update_booking_page(
        tenant_id,
        enabled=body.enabled,
        welcome_message=body.welcome_message,
        clinic_hours_info=body.clinic_hours_info,
        clinic_services=body.clinic_services,
    )
    slug = tenant.get("slug")
    public_url = f"{settings.frontend_origin}/clinic/{slug}" if slug and body.enabled else None
    return BookingPageConfigResponse(
        enabled=bool(tenant.get("booking_enabled")),
        welcome_message=tenant.get("booking_welcome_message"),
        public_url=public_url,
        clinic_hours_info=tenant.get("clinic_hours_info"),
        clinic_services=tenant.get("clinic_services"),
    )


@router.get("/calendar-config", response_model=CalendarConfigResponse)
async def get_calendar_config(
    tenant_id: str = Depends(get_tenant_id),
    _owner: dict = Depends(require_owner),
) -> CalendarConfigResponse:
    return await scheduling_service.get_calendar_config(tenant_id)


@router.put("/calendar-config", response_model=CalendarConfigResponse)
async def update_calendar_config(
    body: CalendarConfigUpdateRequest,
    tenant_id: str = Depends(get_tenant_id),
    user_id: str = Depends(get_user_id),
    _owner: dict = Depends(require_owner),
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
    _staff: dict = Depends(require_staff),
    date: str | None = None,
):
    appointments = await scheduling_service.list_appointments(tenant_id, date=date)
    return {"appointments": appointments}


@router.patch("/appointments/{appointment_id}")
async def update_appointment(
    appointment_id: str,
    body: AppointmentUpdateRequest,
    tenant_id: str = Depends(get_tenant_id),
    _staff: dict = Depends(require_staff),
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
    _staff: dict = Depends(require_staff),
) -> CancelResponse:
    return await scheduling_service.cancel_appointment(appointment_id, tenant_id)
