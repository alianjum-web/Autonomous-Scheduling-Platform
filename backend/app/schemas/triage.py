from __future__ import annotations

from typing import Literal

from pydantic import BaseModel

from app.schemas.db import ChatMessage

TriageMessageAction = Literal["select_slot", "provide_name"]


class CreateSessionRequest(BaseModel):
    metadata: dict | None = None


class CreateSessionResponse(BaseModel):
    session_id: str
    status: str


class TriageMessageRequest(BaseModel):
    message: str
    history: list[ChatMessage] | None = None
    action: TriageMessageAction | None = None
    selected_slot: str | None = None


class EscalateRequest(BaseModel):
    ai_summary: str | None = None
    patient_name: str | None = None
