"""Typed row shapes for Supabase tables — mirrors backend/supabase/migrations/*.sql."""

from __future__ import annotations

from typing import Any, Literal, NotRequired, TypedDict

# ── Shared ────────────────────────────────────────────────────────────────────

SessionStatus = Literal["active", "completed", "abandoned"]
AppointmentStatus = Literal["pending", "confirmed", "cancelled", "no_show", "completed"]
IngestionJobStatus = Literal["pending", "processing", "completed", "failed", "partial"]
DocumentCategory = Literal["treatment_protocol", "pricing", "insurance", "faq", "other"]
ClinicRole = Literal["patient", "admin", "clinic_admin", "doctor", "front_desk", "billing"]


class ChatMessage(TypedDict):
    role: Literal["user", "assistant", "system"]
    content: str


class PatientSessionRow(TypedDict):
    id: str
    tenant_id: str
    status: SessionStatus
    metadata: dict[str, Any]
    created_at: str
    updated_at: str
    langgraph_thread_id: NotRequired[str | None]
    current_triage_status: NotRequired[str | None]
    ai_summary: NotRequired[str | None]
    message_history: NotRequired[list[ChatMessage]]
    escalated_at: NotRequired[str | None]
    patient_name: NotRequired[str | None]


class AppointmentRow(TypedDict):
    id: str
    tenant_id: str
    patient_name: str
    slot_start: str
    slot_end: str
    confirmation_code: str
    status: AppointmentStatus
    created_at: str
    session_id: NotRequired[str | None]
    patient_phone: NotRequired[str | None]
    calendar_event_id: NotRequired[str | None]
    provider_name: NotRequired[str | None]
    treatment_type: NotRequired[str | None]
    scheduled_timestamp: NotRequired[str | None]
    duration_minutes: NotRequired[int | None]
    external_event_id: NotRequired[str | None]


class ClinicDocumentRow(TypedDict):
    id: str
    tenant_id: str
    source_filename: str
    category: DocumentCategory
    file_hash: str
    chunk_count: int
    ingested_by: str
    created_at: str


class IngestionJobRow(TypedDict):
    id: str
    tenant_id: str
    filename: str
    category: str
    file_hash: str
    status: IngestionJobStatus
    progress_pct: int
    chunks_total: int
    chunks_done: int
    ingested_by: str
    created_at: str
    updated_at: str
    document_id: NotRequired[str | None]
    error_message: NotRequired[str | None]


class ProfileRow(TypedDict):
    id: str
    tenant_id: str
    role: str
    created_at: str
    updated_at: str
    full_name: NotRequired[str | None]
