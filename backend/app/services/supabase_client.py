from __future__ import annotations

import asyncio
from typing import Any
from uuid import uuid4

from supabase import Client, create_client

from app.core.config import get_settings
from app.core.logger import get_logger

logger = get_logger(__name__)


class AppointmentConflictError(Exception):
    """Raised when the DB unique index rejects a duplicate provider/time booking."""


_client: Client | None = None


def get_supabase_client() -> Client:
    global _client
    if _client is None:
        settings = get_settings()
        _client = create_client(settings.supabase_url, settings.supabase_service_role_key)
    return _client


async def warm_supabase_pool() -> None:
    await asyncio.to_thread(get_supabase_client)
    logger.info("Supabase client pool warmed")


# ── Patient sessions (Sprint 1) ─────────────────────────────────────────────


async def create_patient_session(tenant_id: str, metadata: dict[str, Any] | None = None) -> dict[str, Any]:
    session_id = str(uuid4())
    row = {
        "id": session_id,
        "tenant_id": tenant_id,
        "status": "active",
        "metadata": metadata or {},
    }

    def _insert() -> dict[str, Any]:
        client = get_supabase_client()
        result = client.table("patient_sessions").insert(row).execute()
        return result.data[0]

    return await asyncio.to_thread(_insert)


async def get_patient_session(session_id: str, tenant_id: str) -> dict[str, Any] | None:
    def _fetch() -> dict[str, Any] | None:
        client = get_supabase_client()
        result = (
            client.table("patient_sessions")
            .select("*")
            .eq("id", session_id)
            .eq("tenant_id", tenant_id)
            .maybe_single()
            .execute()
        )
        return result.data

    return await asyncio.to_thread(_fetch)


async def update_session_status(session_id: str, status: str) -> None:
    def _update() -> None:
        client = get_supabase_client()
        client.table("patient_sessions").update({"status": status}).eq("id", session_id).execute()

    await asyncio.to_thread(_update)
    logger.info("Session status updated", extra={"extra_data": {"session_id": session_id, "status": status}})


async def save_session_thread(
    session_id: str,
    tenant_id: str,
    thread_id: str,
    message_history: list[dict],
) -> None:
    def _update() -> None:
        client = get_supabase_client()
        client.table("patient_sessions").update({
            "langgraph_thread_id": thread_id,
            "message_history": message_history,
        }).eq("id", session_id).eq("tenant_id", tenant_id).execute()
        client.table("langgraph_checkpoints").upsert({
            "thread_id": thread_id,
            "tenant_id": tenant_id,
            "session_id": session_id,
            "checkpoint_data": {"thread_id": thread_id},
        }).execute()

    await asyncio.to_thread(_update)


async def update_session_agent_state(
    session_id: str,
    tenant_id: str,
    triage_status: str,
    message_history: list[dict],
    available_slots: list[str] | None = None,
) -> None:
    metadata_patch: dict = {"available_slots": available_slots or []}

    def _update() -> None:
        client = get_supabase_client()
        client.table("patient_sessions").update({
            "current_triage_status": triage_status,
            "message_history": message_history,
            "metadata": metadata_patch,
        }).eq("id", session_id).eq("tenant_id", tenant_id).execute()

    await asyncio.to_thread(_update)


async def load_emergency_keyword_patterns() -> list[str]:
    def _fetch() -> list[str]:
        client = get_supabase_client()
        result = (
            client.table("emergency_keyword_config")
            .select("pattern")
            .eq("is_active", True)
            .execute()
        )
        patterns = [row["pattern"] for row in (result.data or []) if row.get("pattern")]
        return patterns

    return await asyncio.to_thread(_fetch)


async def flag_emergency_session(
    session_id: str,
    tenant_id: str,
    message_snippet: str,
) -> None:
    from datetime import datetime, timezone

    def _update() -> None:
        client = get_supabase_client()
        client.table("patient_sessions").update({
            "current_triage_status": "emergency",
            "status": "active",
            "escalated_at": datetime.now(timezone.utc).isoformat(),
            "ai_summary": f"EMERGENCY DETECTED: {message_snippet[:200]}",
        }).eq("id", session_id).eq("tenant_id", tenant_id).execute()

    await asyncio.to_thread(_update)
    logger.warning(
        "Emergency session flagged",
        extra={"extra_data": {"session_id": session_id, "tenant_id": tenant_id}},
    )


async def escalate_session(
    session_id: str,
    tenant_id: str,
    ai_summary: str,
    patient_name: str | None = None,
) -> None:
    from datetime import datetime, timezone

    patch: dict[str, Any] = {
        "current_triage_status": "escalated_to_human",
        "ai_summary": ai_summary,
        "status": "active",
        "escalated_at": datetime.now(timezone.utc).isoformat(),
    }
    if patient_name:
        patch["patient_name"] = patient_name

    def _update() -> None:
        client = get_supabase_client()
        client.table("patient_sessions").update(patch).eq("id", session_id).eq("tenant_id", tenant_id).execute()

    await asyncio.to_thread(_update)
    logger.info("Session escalated", extra={"extra_data": {"session_id": session_id}})


async def update_session_triage_status(session_id: str, tenant_id: str, triage_status: str) -> None:
    def _update() -> None:
        client = get_supabase_client()
        client.table("patient_sessions").update({
            "current_triage_status": triage_status,
        }).eq("id", session_id).eq("tenant_id", tenant_id).execute()

    await asyncio.to_thread(_update)


async def ping_supabase() -> bool:
    def _ping() -> bool:
        try:
            client = get_supabase_client()
            client.table("tenants").select("id").limit(1).execute()
            return True
        except Exception:
            return False

    return await asyncio.to_thread(_ping)


async def create_appointment(
    tenant_id: str,
    session_id: str | None,
    patient_name: str,
    patient_phone: str | None,
    slot_start: str,
    slot_end: str,
    confirmation_code: str,
    calendar_event_id: str | None,
    provider_name: str = "General Practice",
    treatment_type: str = "consultation",
) -> dict[str, Any]:
    row = {
        "tenant_id": tenant_id,
        "session_id": session_id,
        "patient_name": patient_name,
        "patient_phone": patient_phone,
        "slot_start": slot_start,
        "slot_end": slot_end,
        "scheduled_timestamp": slot_start,
        "confirmation_code": confirmation_code,
        "calendar_event_id": calendar_event_id,
        "external_event_id": calendar_event_id,
        "provider_name": provider_name,
        "treatment_type": treatment_type,
        "duration_minutes": 30,
        "status": "confirmed",
    }

    def _insert() -> dict[str, Any]:
        client = get_supabase_client()
        try:
            result = client.table("appointments").insert(row).execute()
            return result.data[0]
        except Exception as exc:
            err = str(exc).lower()
            if "23505" in err or "duplicate key" in err or "unique constraint" in err:
                raise AppointmentConflictError() from exc
            raise

    return await asyncio.to_thread(_insert)


async def list_appointments(tenant_id: str, date: str | None = None) -> list[dict[str, Any]]:
    def _fetch() -> list[dict[str, Any]]:
        client = get_supabase_client()
        query = client.table("appointments").select("*").eq("tenant_id", tenant_id)
        if date:
            query = query.gte("slot_start", f"{date}T00:00:00").lte("slot_start", f"{date}T23:59:59")
        result = query.order("slot_start").execute()
        return result.data or []

    return await asyncio.to_thread(_fetch)


async def get_appointment(appointment_id: str, tenant_id: str) -> dict[str, Any] | None:
    def _fetch() -> dict[str, Any] | None:
        client = get_supabase_client()
        result = (
            client.table("appointments")
            .select("*")
            .eq("id", appointment_id)
            .eq("tenant_id", tenant_id)
            .maybe_single()
            .execute()
        )
        return result.data

    return await asyncio.to_thread(_fetch)


async def find_conflicting_appointment(
    tenant_id: str, provider_name: str, slot_start: str
) -> dict[str, Any] | None:
    """Pre-check aligned with idx_appt_provider_time partial unique index."""

    def _fetch() -> dict[str, Any] | None:
        client = get_supabase_client()
        result = (
            client.table("appointments")
            .select("id")
            .eq("tenant_id", tenant_id)
            .eq("provider_name", provider_name)
            .eq("scheduled_timestamp", slot_start)
            .not_.in_("status", ["cancelled", "no_show"])
            .maybe_single()
            .execute()
        )
        return result.data

    return await asyncio.to_thread(_fetch)


async def update_appointment(
    appointment_id: str, tenant_id: str, fields: dict[str, Any]
) -> dict[str, Any] | None:
    def _update() -> dict[str, Any] | None:
        client = get_supabase_client()
        result = (
            client.table("appointments")
            .update(fields)
            .eq("id", appointment_id)
            .eq("tenant_id", tenant_id)
            .execute()
        )
        return result.data[0] if result.data else None

    return await asyncio.to_thread(_update)


async def cancel_appointment(appointment_id: str, tenant_id: str) -> None:
    def _update() -> None:
        client = get_supabase_client()
        client.table("appointments").update({"status": "cancelled"}).eq("id", appointment_id).eq(
            "tenant_id", tenant_id
        ).execute()

    await asyncio.to_thread(_update)


# ── Clinic documents & RAG (Sprint 2) ───────────────────────────────────────


async def find_document_by_hash(tenant_id: str, file_hash: str) -> dict[str, Any] | None:
    def _fetch() -> dict[str, Any] | None:
        client = get_supabase_client()
        result = (
            client.table("clinic_documents")
            .select("*")
            .eq("tenant_id", tenant_id)
            .eq("file_hash", file_hash)
            .maybe_single()
            .execute()
        )
        return result.data

    return await asyncio.to_thread(_fetch)


async def create_clinic_document(
    tenant_id: str,
    source_filename: str,
    category: str,
    file_hash: str,
    chunk_count: int,
    ingested_by: str,
) -> dict[str, Any]:
    row = {
        "tenant_id": tenant_id,
        "source_filename": source_filename,
        "category": category,
        "file_hash": file_hash,
        "chunk_count": chunk_count,
        "ingested_by": ingested_by,
    }

    def _insert() -> dict[str, Any]:
        client = get_supabase_client()
        result = client.table("clinic_documents").insert(row).execute()
        return result.data[0]

    return await asyncio.to_thread(_insert)


async def bulk_insert_protocols(records: list[dict[str, Any]]) -> None:
    def _insert() -> None:
        client = get_supabase_client()
        client.table("clinic_protocols").insert(records).execute()

    await asyncio.to_thread(_insert)


async def list_clinic_documents(tenant_id: str) -> list[dict[str, Any]]:
    def _fetch() -> list[dict[str, Any]]:
        client = get_supabase_client()
        result = (
            client.table("clinic_documents")
            .select("*")
            .eq("tenant_id", tenant_id)
            .order("created_at", desc=True)
            .execute()
        )
        return result.data or []

    return await asyncio.to_thread(_fetch)


async def get_document_chunks(document_id: str, tenant_id: str, limit: int = 3) -> list[dict[str, Any]]:
    def _fetch() -> list[dict[str, Any]]:
        client = get_supabase_client()
        result = (
            client.table("clinic_protocols")
            .select("id, chunk_index, content_payload, category, token_count")
            .eq("document_id", document_id)
            .eq("tenant_id", tenant_id)
            .order("chunk_index")
            .limit(limit)
            .execute()
        )
        return result.data or []

    return await asyncio.to_thread(_fetch)


async def delete_clinic_document(document_id: str, tenant_id: str) -> None:
    def _delete() -> None:
        client = get_supabase_client()
        client.table("clinic_protocols").delete().eq("document_id", document_id).eq(
            "tenant_id", tenant_id
        ).execute()
        client.table("clinic_documents").delete().eq("id", document_id).eq(
            "tenant_id", tenant_id
        ).execute()

    await asyncio.to_thread(_delete)


async def match_clinic_protocols(
    query_embedding: list[float],
    tenant_id: str,
    match_threshold: float = 0.78,
    match_count: int = 5,
) -> list[dict[str, Any]]:
    def _rpc() -> list[dict[str, Any]]:
        client = get_supabase_client()
        result = client.rpc(
            "match_clinic_protocols",
            {
                "query_embedding": query_embedding,
                "match_tenant_id": tenant_id,
                "match_threshold": match_threshold,
                "match_count": match_count,
            },
        ).execute()
        return result.data or []

    return await asyncio.to_thread(_rpc)


# ── Ingestion jobs ────────────────────────────────────────────────────────────


async def create_ingestion_job(
    tenant_id: str,
    filename: str,
    category: str,
    file_hash: str,
    ingested_by: str,
) -> dict[str, Any]:
    row = {
        "tenant_id": tenant_id,
        "filename": filename,
        "category": category,
        "file_hash": file_hash,
        "ingested_by": ingested_by,
        "status": "pending",
    }

    def _insert() -> dict[str, Any]:
        client = get_supabase_client()
        result = client.table("ingestion_jobs").insert(row).execute()
        return result.data[0]

    return await asyncio.to_thread(_insert)


async def get_ingestion_job(job_id: str, tenant_id: str) -> dict[str, Any] | None:
    def _fetch() -> dict[str, Any] | None:
        client = get_supabase_client()
        result = (
            client.table("ingestion_jobs")
            .select("*")
            .eq("id", job_id)
            .eq("tenant_id", tenant_id)
            .maybe_single()
            .execute()
        )
        return result.data

    return await asyncio.to_thread(_fetch)


async def update_ingestion_job(job_id: str, fields: dict[str, Any]) -> None:
    def _update() -> None:
        client = get_supabase_client()
        client.table("ingestion_jobs").update(fields).eq("id", job_id).execute()

    await asyncio.to_thread(_update)
