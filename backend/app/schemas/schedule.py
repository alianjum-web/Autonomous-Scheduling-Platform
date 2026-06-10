from __future__ import annotations

from typing import Any

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.db import AppointmentRow


class BookRequest(BaseModel):
    session_id: str | None = None
    slot_start: str
    selected_slot: str | None = None
    patient_name: str = Field(min_length=1)
    patient_phone: str | None = None
    provider_name: str = "General Practice"
    treatment_type: str = "consultation"


class BookResponse(BaseModel):
    appointment: AppointmentRow
    confirmation_code: str
    slot_start: str
    slot_end: str
    status: str


class CancelResponse(BaseModel):
    appointment_id: str
    status: str


class CalendarConfigResponse(BaseModel):
    timezone: str
    calendar_provider: str
    google_calendar_id: str | None = None
    business_hours_start: int = 9
    business_hours_end: int = 17
    slot_duration_minutes: int = 30
    google_connected: bool = False
    uses_mock_slots: bool = True


class CalendarConfigUpdateRequest(BaseModel):
    timezone: str = "America/New_York"
    calendar_provider: str = Field(pattern="^(none|google|mock)$")
    google_calendar_id: str | None = None
    business_hours_start: int = Field(ge=0, le=23, default=9)
    business_hours_end: int = Field(ge=1, le=24, default=17)
    slot_duration_minutes: int = Field(ge=15, le=120, default=30)


class AppointmentUpdateRequest(BaseModel):
    model_config = ConfigDict(extra="allow")

    status: str | None = None
    notes: str | None = None

    def to_patch(self) -> dict[str, Any]:
        return self.model_dump(exclude_none=True)
