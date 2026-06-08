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


class AppointmentUpdateRequest(BaseModel):
    model_config = ConfigDict(extra="allow")

    status: str | None = None
    notes: str | None = None

    def to_patch(self) -> dict[str, Any]:
        return self.model_dump(exclude_none=True)
