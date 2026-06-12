from __future__ import annotations

import asyncio
import time
from datetime import datetime, timezone as dt_timezone
from typing import Any, Callable, TypeVar, cast
from uuid import uuid4

import httpx
from supabase import Client, create_client

from app.core.config import get_settings
from app.core.logger import get_logger
from app.schemas.db import (
    AppointmentRow,
    ClinicDocumentRow,
    IngestionJobRow,
    PatientSessionRow,
)

logger = get_logger(__name__)

T = TypeVar("T")
_TRANSIENT_UPSTREAM_ERRORS = (httpx.RemoteProtocolError, httpx.ReadError, httpx.ConnectError)


def _run_with_retry(fn: Callable[[], T], *, attempts: int = 3) -> T:
    """Retry transient Supabase/HTTP2 disconnects (common under parallel dev requests)."""
    last_exc: Exception | None = None
    for attempt in range(attempts):
        try:
            return fn()
        except _TRANSIENT_UPSTREAM_ERRORS as exc:
            last_exc = exc
            if attempt + 1 >= attempts:
                break
            time.sleep(0.15 * (attempt + 1))
            logger.warning("Supabase request retry", extra={"extra_data": {"attempt": attempt + 1}})
    assert last_exc is not None
    raise last_exc


def _row(data: Any) -> dict[str, Any]:
    if not isinstance(data, dict):
        raise TypeError(f"Expected dict row from Supabase, got {type(data)!r}")
    return data


def _optional_row(data: Any) -> dict[str, Any] | None:
    if data is None:
        return None
    return _row(data)


def _rows(data: Any) -> list[dict[str, Any]]:
    if not data:
        return []
    if not isinstance(data, list):
        raise TypeError(f"Expected list of rows from Supabase, got {type(data)!r}")
    return [_row(item) for item in data]


def _response_data(response: Any) -> Any:
    if response is None:
        raise RuntimeError("Supabase query returned no response")
    return response.data


def _maybe_single_row(response: Any) -> dict[str, Any] | None:
    """maybe_single().execute() returns None when zero rows match."""
    if response is None:
        return None
    return _optional_row(_response_data(response))


def _metadata_dict(value: Any) -> dict[str, Any]:
    if isinstance(value, dict):
        return cast(dict[str, Any], value)
    return {}


def _inserted_row(response: Any) -> dict[str, Any]:
    rows = _rows(_response_data(response))
    if not rows:
        raise RuntimeError("Supabase insert returned no rows")
    return rows[0]


class AppointmentConflictError(Exception):
    """Raised when the DB unique index rejects a duplicate provider/time booking."""


class SupabaseService:
    """Single Supabase data-access service — all tenant-scoped CRUD and RPC."""

    def __init__(self) -> None:
        self._client: Client | None = None

    def get_client(self) -> Client:
        if self._client is None:
            settings = get_settings()
            self._client = create_client(settings.supabase_url, settings.supabase_service_role_key)
        return self._client

    @staticmethod
    async def _run(fn):
        return await asyncio.to_thread(lambda: _run_with_retry(fn))

    async def warm_pool(self) -> None:
        await self._run(self.get_client)
        logger.info("Supabase client pool warmed")

    async def ping(self) -> bool:
        def _ping() -> bool:
            try:
                self.get_client().table("tenants").select("id").limit(1).execute()
                return True
            except Exception:
                return False

        return await self._run(_ping)

    # ── Tenants / compliance ───────────────────────────────────────────────────

    async def get_tenant(self, tenant_id: str) -> dict[str, Any] | None:
        def _fetch() -> dict[str, Any] | None:
            def _query() -> dict[str, Any] | None:
                result = (
                    self.get_client()
                    .table("tenants")
                    .select(
                        "id, slug, name, hipaa_baa_signed_at, hipaa_baa_signed_by, created_at, "
                        "timezone, calendar_provider, google_calendar_id, "
                        "business_hours_start, business_hours_end, slot_duration_minutes, "
                        "booking_enabled, booking_welcome_message, "
                        "clinic_hours_info, clinic_services"
                    )
                    .eq("id", tenant_id)
                    .limit(1)
                    .execute()
                )
                rows = _rows(_response_data(result))
                return rows[0] if rows else None

            return _run_with_retry(_query)

        return await self._run(_fetch)

    async def get_public_tenant_by_slug(self, slug: str) -> dict[str, Any] | None:
        def _fetch() -> dict[str, Any] | None:
            result = (
                self.get_client()
                .table("tenants")
                .select("id, slug, name, booking_enabled, booking_welcome_message, hipaa_baa_signed_at")
                .eq("slug", slug)
                .eq("booking_enabled", True)
                .limit(1)
                .execute()
            )
            rows = _rows(_response_data(result))
            return rows[0] if rows else None

        return await self._run(_fetch)

    async def get_tenant_by_slug(self, slug: str) -> dict[str, Any] | None:
        def _fetch() -> dict[str, Any] | None:
            result = (
                self.get_client()
                .table("tenants")
                .select("id, slug, name, booking_enabled, booking_welcome_message")
                .eq("slug", slug)
                .limit(1)
                .execute()
            )
            rows = _rows(_response_data(result))
            return rows[0] if rows else None

        return await self._run(_fetch)

    async def update_booking_page(
        self,
        tenant_id: str,
        *,
        enabled: bool,
        welcome_message: str | None,
        clinic_hours_info: str | None = None,
        clinic_services: str | None = None,
    ) -> dict[str, Any]:
        patch: dict[str, Any] = {
            "booking_enabled": enabled,
            "booking_welcome_message": welcome_message,
            "updated_at": datetime.now(dt_timezone.utc).isoformat(),
        }
        if clinic_hours_info is not None:
            patch["clinic_hours_info"] = clinic_hours_info
        if clinic_services is not None:
            patch["clinic_services"] = clinic_services

        def _update() -> dict[str, Any]:
            result = (
                self.get_client()
                .table("tenants")
                .update(patch)
                .eq("id", tenant_id)
                .execute()
            )
            rows = _rows(_response_data(result))
            if not rows:
                raise RuntimeError("Tenant not found for booking page update")
            return rows[0]

        return await self._run(_update)

    async def list_staff_invites(self, tenant_id: str) -> list[dict[str, Any]]:
        def _fetch() -> list[dict[str, Any]]:
            result = (
                self.get_client()
                .table("staff_invites")
                .select("id, email, role, token, expires_at, accepted_at, created_at")
                .eq("tenant_id", tenant_id)
                .order("created_at", desc=True)
                .execute()
            )
            return _rows(_response_data(result))

        return await self._run(_fetch)

    async def get_staff_invite_by_email(
        self, tenant_id: str, email: str
    ) -> dict[str, Any] | None:
        def _fetch() -> dict[str, Any] | None:
            result = (
                self.get_client()
                .table("staff_invites")
                .select("*")
                .eq("tenant_id", tenant_id)
                .eq("email", email)
                .limit(1)
                .execute()
            )
            rows = _rows(_response_data(result))
            return rows[0] if rows else None

        return await self._run(_fetch)

    async def get_staff_invite_by_token(self, token: str) -> dict[str, Any] | None:
        def _fetch() -> dict[str, Any] | None:
            result = (
                self.get_client()
                .table("staff_invites")
                .select("*")
                .eq("token", token)
                .limit(1)
                .execute()
            )
            rows = _rows(_response_data(result))
            return rows[0] if rows else None

        return await self._run(_fetch)

    async def create_staff_invite(
        self,
        *,
        tenant_id: str,
        email: str,
        role: str,
        invited_by: str,
    ) -> dict[str, Any]:
        row = {
            "tenant_id": tenant_id,
            "email": email,
            "role": role,
            "invited_by": invited_by,
            "token": str(uuid4()),
        }

        def _insert() -> dict[str, Any]:
            result = self.get_client().table("staff_invites").insert(row).execute()
            return _inserted_row(result)

        return await self._run(_insert)

    async def list_providers(self, tenant_id: str, *, active_only: bool = True) -> list[dict[str, Any]]:
        def _fetch() -> list[dict[str, Any]]:
            query = (
                self.get_client()
                .table("providers")
                .select(
                    "id, tenant_id, profile_id, display_name, specialty, is_active, "
                    "availability_start, availability_end, slot_duration_minutes, created_at"
                )
                .eq("tenant_id", tenant_id)
                .order("display_name")
            )
            if active_only:
                query = query.eq("is_active", True)
            result = query.execute()
            return _rows(_response_data(result))

        return await self._run(_fetch)

    async def get_provider_by_profile(self, profile_id: str) -> dict[str, Any] | None:
        def _fetch() -> dict[str, Any] | None:
            result = (
                self.get_client()
                .table("providers")
                .select("*")
                .eq("profile_id", profile_id)
                .eq("is_active", True)
                .limit(1)
                .execute()
            )
            rows = _rows(_response_data(result))
            return rows[0] if rows else None

        return await self._run(_fetch)

    async def update_provider_availability(
        self,
        profile_id: str,
        *,
        availability_start: str,
        availability_end: str,
        slot_duration_minutes: int,
        specialty: str | None = None,
    ) -> dict[str, Any]:
        def _update() -> dict[str, Any]:
            payload: dict[str, Any] = {
                "availability_start": availability_start,
                "availability_end": availability_end,
                "slot_duration_minutes": slot_duration_minutes,
                "updated_at": datetime.now(dt_timezone.utc).isoformat(),
            }
            if specialty is not None:
                payload["specialty"] = specialty
            result = (
                self.get_client()
                .table("providers")
                .update(payload)
                .eq("profile_id", profile_id)
                .execute()
            )
            rows = _rows(_response_data(result))
            if not rows:
                raise RuntimeError("Provider not found")
            return rows[0]

        return await self._run(_update)

    async def deactivate_provider(self, tenant_id: str, profile_id: str) -> None:
        def _deactivate() -> None:
            self.get_client().table("providers").update(
                {"is_active": False, "updated_at": datetime.now(dt_timezone.utc).isoformat()}
            ).eq("tenant_id", tenant_id).eq("profile_id", profile_id).execute()
            self.get_client().table("profiles").update(
                {"tenant_id": None, "role": "patient", "updated_at": datetime.now(dt_timezone.utc).isoformat()}
            ).eq("id", profile_id).eq("tenant_id", tenant_id).execute()

        await self._run(_deactivate)

    async def get_profile_tenant_id(self, user_id: str) -> str | None:
        """Resolve tenant from profiles when JWT hook has not injected tenant_id yet."""

        def _fetch() -> str | None:
            result = (
                self.get_client()
                .table("profiles")
                .select("tenant_id")
                .eq("id", user_id)
                .limit(1)
                .execute()
            )
            rows = _rows(_response_data(result))
            if not rows:
                return None
            tenant_id = rows[0].get("tenant_id")
            return str(tenant_id) if tenant_id else None

        return await self._run(_fetch)

    async def get_profile_role(self, user_id: str) -> str | None:
        """Resolve clinic role from profiles when JWT hook has not injected clinic_role yet."""

        def _fetch() -> str | None:
            result = (
                self.get_client()
                .table("profiles")
                .select("role")
                .eq("id", user_id)
                .limit(1)
                .execute()
            )
            rows = _rows(_response_data(result))
            if not rows:
                return None
            role = rows[0].get("role")
            return str(role) if role else None

        return await self._run(_fetch)

    async def update_tenant_calendar_config(
        self,
        tenant_id: str,
        *,
        timezone: str,
        calendar_provider: str,
        google_calendar_id: str | None,
        business_hours_start: int,
        business_hours_end: int,
        slot_duration_minutes: int,
    ) -> dict[str, Any]:
        now = datetime.now(dt_timezone.utc).isoformat()
        patch = {
            "timezone": timezone,
            "calendar_provider": calendar_provider,
            "google_calendar_id": google_calendar_id,
            "business_hours_start": business_hours_start,
            "business_hours_end": business_hours_end,
            "slot_duration_minutes": slot_duration_minutes,
            "updated_at": now,
        }

        def _update() -> dict[str, Any]:
            result = (
                self.get_client()
                .table("tenants")
                .update(patch)
                .eq("id", tenant_id)
                .execute()
            )
            rows = _rows(_response_data(result))
            if not rows:
                raise RuntimeError("Tenant not found for calendar config update")
            return rows[0]

        return await self._run(_update)

    async def list_audit_logs(
        self,
        tenant_id: str,
        *,
        actions: list[str] | None = None,
        limit: int = 25,
    ) -> list[dict[str, Any]]:
        def _fetch() -> list[dict[str, Any]]:
            query = (
                self.get_client()
                .table("audit_logs")
                .select("id, action, actor_id, resource_type, resource_id, created_at, metadata")
                .eq("tenant_id", tenant_id)
                .order("created_at", desc=True)
                .limit(limit)
            )
            if actions:
                query = query.in_("action", actions)
            result = query.execute()
            return _rows(_response_data(result))

        return await self._run(_fetch)

    async def acknowledge_tenant_baa(self, tenant_id: str, user_id: str) -> dict[str, Any]:
        now = datetime.now(dt_timezone.utc).isoformat()

        def _update() -> dict[str, Any]:
            result = (
                self.get_client()
                .table("tenants")
                .update({
                    "hipaa_baa_signed_at": now,
                    "hipaa_baa_signed_by": user_id,
                    "updated_at": now,
                })
                .eq("id", tenant_id)
                .execute()
            )
            rows = _rows(_response_data(result))
            if not rows:
                raise RuntimeError("Tenant not found for BAA acknowledgement")
            return rows[0]

        return await self._run(_update)

    async def insert_audit_log(
        self,
        *,
        tenant_id: str,
        action: str,
        resource_type: str,
        resource_id: str,
        actor_id: str | None = None,
        metadata: dict[str, Any] | None = None,
    ) -> None:
        row = {
            "tenant_id": tenant_id,
            "actor_id": actor_id,
            "action": action,
            "resource_type": resource_type,
            "resource_id": resource_id,
            "metadata": metadata or {},
        }

        def _insert() -> None:
            self.get_client().table("audit_logs").insert(row).execute()

        await self._run(_insert)

    # ── Patient sessions ──────────────────────────────────────────────────────

    async def create_patient_session(
        self, tenant_id: str, metadata: dict[str, Any] | None = None
    ) -> PatientSessionRow:
        session_id = str(uuid4())
        row = {
            "id": session_id,
            "tenant_id": tenant_id,
            "status": "active",
            "metadata": metadata or {},
        }

        def _insert() -> PatientSessionRow:
            result = self.get_client().table("patient_sessions").insert(row).execute()
            return cast(PatientSessionRow, _inserted_row(result))

        return await self._run(_insert)

    async def get_patient_session(self, session_id: str, tenant_id: str) -> PatientSessionRow | None:
        def _fetch() -> PatientSessionRow | None:
            result = (
                self.get_client()
                .table("patient_sessions")
                .select("*")
                .eq("id", session_id)
                .eq("tenant_id", tenant_id)
                .maybe_single()
                .execute()
            )
            return cast(PatientSessionRow | None, _maybe_single_row(result))

        return await self._run(_fetch)

    async def list_patient_sessions(
        self, tenant_id: str, *, limit: int = 25
    ) -> list[dict[str, Any]]:
        def _fetch() -> list[dict[str, Any]]:
            result = (
                self.get_client()
                .table("patient_sessions")
                .select(
                    "id, tenant_id, status, metadata, current_triage_status, ai_summary, created_at, updated_at"
                )
                .eq("tenant_id", tenant_id)
                .order("created_at", desc=True)
                .limit(limit)
                .execute()
            )
            return _rows(_response_data(result))

        return await self._run(_fetch)

    async def update_session_status(self, session_id: str, status: str) -> None:
        def _update() -> None:
            self.get_client().table("patient_sessions").update({"status": status}).eq(
                "id", session_id
            ).execute()

        await self._run(_update)
        logger.info(
            "Session status updated",
            extra={"extra_data": {"session_id": session_id, "status": status}},
        )

    async def save_session_thread(
        self,
        session_id: str,
        tenant_id: str,
        thread_id: str,
        message_history: list[dict],
    ) -> None:
        def _update() -> None:
            client = self.get_client()
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

        await self._run(_update)

    async def update_session_agent_state(
        self,
        session_id: str,
        tenant_id: str,
        triage_status: str,
        message_history: list[dict],
        available_slots: list[str] | None = None,
    ) -> None:
        def _update() -> None:
            client = self.get_client()
            existing = (
                client.table("patient_sessions")
                .select("metadata")
                .eq("id", session_id)
                .eq("tenant_id", tenant_id)
                .maybe_single()
                .execute()
            )
            row = _maybe_single_row(existing) or {}
            prior = _metadata_dict(row.get("metadata"))
            merged = {**prior, "available_slots": available_slots or []}
            client.table("patient_sessions").update({
                "current_triage_status": triage_status,
                "message_history": message_history,
                "metadata": merged,
            }).eq("id", session_id).eq("tenant_id", tenant_id).execute()

        await self._run(_update)

    async def merge_session_metadata(
        self,
        session_id: str,
        tenant_id: str,
        patch: dict[str, Any],
    ) -> None:
        def _update() -> None:
            client = self.get_client()
            existing = (
                client.table("patient_sessions")
                .select("metadata")
                .eq("id", session_id)
                .eq("tenant_id", tenant_id)
                .maybe_single()
                .execute()
            )
            row = _maybe_single_row(existing) or {}
            prior = _metadata_dict(row.get("metadata"))
            client.table("patient_sessions").update({
                "metadata": {**prior, **patch},
            }).eq("id", session_id).eq("tenant_id", tenant_id).execute()

        await self._run(_update)

    async def load_emergency_keyword_patterns(self) -> list[str]:
        def _fetch() -> list[str]:
            result = (
                self.get_client()
                .table("emergency_keyword_config")
                .select("pattern")
                .eq("is_active", True)
                .execute()
            )
            patterns: list[str] = []
            for row in _rows(_response_data(result)):
                pattern = row.get("pattern")
                if isinstance(pattern, str):
                    patterns.append(pattern)
            return patterns

        return await self._run(_fetch)

    async def flag_emergency_session(
        self,
        session_id: str,
        tenant_id: str,
        message_snippet: str,
    ) -> None:
        def _update() -> None:
            self.get_client().table("patient_sessions").update({
                "current_triage_status": "emergency",
                "status": "active",
                "escalated_at": datetime.now(dt_timezone.utc).isoformat(),
                "ai_summary": f"EMERGENCY DETECTED: {message_snippet[:200]}",
            }).eq("id", session_id).eq("tenant_id", tenant_id).execute()

        await self._run(_update)
        logger.warning(
            "Emergency session flagged",
            extra={"extra_data": {"session_id": session_id, "tenant_id": tenant_id}},
        )

    async def escalate_session(
        self,
        session_id: str,
        tenant_id: str,
        ai_summary: str,
        patient_name: str | None = None,
    ) -> None:
        patch: dict[str, Any] = {
            "current_triage_status": "escalated_to_human",
            "ai_summary": ai_summary,
            "status": "active",
            "escalated_at": datetime.now(dt_timezone.utc).isoformat(),
        }
        if patient_name:
            patch["patient_name"] = patient_name

        def _update() -> None:
            self.get_client().table("patient_sessions").update(patch).eq("id", session_id).eq(
                "tenant_id", tenant_id
            ).execute()

        await self._run(_update)
        logger.info("Session escalated", extra={"extra_data": {"session_id": session_id}})

    async def update_session_triage_status(
        self, session_id: str, tenant_id: str, triage_status: str
    ) -> None:
        def _update() -> None:
            self.get_client().table("patient_sessions").update({
                "current_triage_status": triage_status,
            }).eq("id", session_id).eq("tenant_id", tenant_id).execute()

        await self._run(_update)

    # ── Appointments ──────────────────────────────────────────────────────────

    async def create_appointment(
        self,
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
    ) -> AppointmentRow:
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

        def _insert() -> AppointmentRow:
            try:
                result = self.get_client().table("appointments").insert(row).execute()
                return cast(AppointmentRow, _inserted_row(result))
            except Exception as exc:
                err = str(exc).lower()
                if "23505" in err or "duplicate key" in err or "unique constraint" in err:
                    raise AppointmentConflictError() from exc
                raise

        return await self._run(_insert)

    async def list_appointments(self, tenant_id: str, date: str | None = None) -> list[AppointmentRow]:
        def _fetch() -> list[AppointmentRow]:
            query = self.get_client().table("appointments").select("*").eq("tenant_id", tenant_id)
            if date:
                query = query.gte("slot_start", f"{date}T00:00:00").lte("slot_start", f"{date}T23:59:59")
            result = query.order("slot_start").execute()
            return [cast(AppointmentRow, row) for row in _rows(_response_data(result))]

        return await self._run(_fetch)

    async def get_appointment(self, appointment_id: str, tenant_id: str) -> AppointmentRow | None:
        def _fetch() -> AppointmentRow | None:
            result = (
                self.get_client()
                .table("appointments")
                .select("*")
                .eq("id", appointment_id)
                .eq("tenant_id", tenant_id)
                .maybe_single()
                .execute()
            )
            return cast(AppointmentRow | None, _maybe_single_row(result))

        return await self._run(_fetch)

    async def find_conflicting_appointment(
        self, tenant_id: str, provider_name: str, slot_start: str
    ) -> dict[str, Any] | None:
        def _fetch() -> dict[str, Any] | None:
            result = (
                self.get_client()
                .table("appointments")
                .select("id")
                .eq("tenant_id", tenant_id)
                .eq("provider_name", provider_name)
                .eq("scheduled_timestamp", slot_start)
                .not_.in_("status", ["cancelled", "no_show"])
                .maybe_single()
                .execute()
            )
            return _maybe_single_row(result)

        return await self._run(_fetch)

    async def update_appointment(
        self, appointment_id: str, tenant_id: str, fields: dict[str, Any]
    ) -> dict[str, Any] | None:
        def _update() -> dict[str, Any] | None:
            result = (
                self.get_client()
                .table("appointments")
                .update(fields)
                .eq("id", appointment_id)
                .eq("tenant_id", tenant_id)
                .execute()
            )
            rows = _rows(_response_data(result)) if result is not None else []
            return rows[0] if rows else None

        return await self._run(_update)

    async def cancel_appointment(self, appointment_id: str, tenant_id: str) -> None:
        def _update() -> None:
            self.get_client().table("appointments").update({"status": "cancelled"}).eq(
                "id", appointment_id
            ).eq("tenant_id", tenant_id).execute()

        await self._run(_update)

    # ── Clinic documents & RAG ────────────────────────────────────────────────

    async def find_document_by_hash(self, tenant_id: str, file_hash: str) -> ClinicDocumentRow | None:
        def _fetch() -> ClinicDocumentRow | None:
            result = (
                self.get_client()
                .table("clinic_documents")
                .select("*")
                .eq("tenant_id", tenant_id)
                .eq("file_hash", file_hash)
                .maybe_single()
                .execute()
            )
            return cast(ClinicDocumentRow | None, _maybe_single_row(result))

        return await self._run(_fetch)

    async def create_clinic_document(
        self,
        tenant_id: str,
        source_filename: str,
        category: str,
        file_hash: str,
        chunk_count: int,
        ingested_by: str,
    ) -> ClinicDocumentRow:
        row = {
            "tenant_id": tenant_id,
            "source_filename": source_filename,
            "category": category,
            "file_hash": file_hash,
            "chunk_count": chunk_count,
            "ingested_by": ingested_by,
        }

        def _insert() -> ClinicDocumentRow:
            result = self.get_client().table("clinic_documents").insert(row).execute()
            return cast(ClinicDocumentRow, _inserted_row(result))

        return await self._run(_insert)

    async def bulk_insert_protocols(self, records: list[dict[str, Any]]) -> None:
        def _insert() -> None:
            self.get_client().table("clinic_protocols").insert(records).execute()

        await self._run(_insert)

    async def list_clinic_documents(self, tenant_id: str) -> list[ClinicDocumentRow]:
        def _fetch() -> list[ClinicDocumentRow]:
            result = (
                self.get_client()
                .table("clinic_documents")
                .select("*")
                .eq("tenant_id", tenant_id)
                .order("created_at", desc=True)
                .execute()
            )
            return [cast(ClinicDocumentRow, row) for row in _rows(_response_data(result))]

        return await self._run(_fetch)

    async def get_document_chunks(
        self, document_id: str, tenant_id: str, limit: int = 3
    ) -> list[dict[str, Any]]:
        def _fetch() -> list[dict[str, Any]]:
            result = (
                self.get_client()
                .table("clinic_protocols")
                .select("id, chunk_index, content_payload, category, token_count")
                .eq("document_id", document_id)
                .eq("tenant_id", tenant_id)
                .order("chunk_index")
                .limit(limit)
                .execute()
            )
            return _rows(_response_data(result))

        return await self._run(_fetch)

    async def delete_clinic_document(self, document_id: str, tenant_id: str) -> None:
        def _delete() -> None:
            client = self.get_client()
            client.table("clinic_protocols").delete().eq("document_id", document_id).eq(
                "tenant_id", tenant_id
            ).execute()
            client.table("clinic_documents").delete().eq("id", document_id).eq(
                "tenant_id", tenant_id
            ).execute()

        await self._run(_delete)

    async def match_clinic_protocols(
        self,
        query_embedding: list[float],
        tenant_id: str,
        match_threshold: float = 0.78,
        match_count: int = 5,
    ) -> list[dict[str, Any]]:
        def _rpc() -> list[dict[str, Any]]:
            result = self.get_client().rpc(
                "match_clinic_protocols",
                {
                    "query_embedding": query_embedding,
                    "match_tenant_id": tenant_id,
                    "match_threshold": match_threshold,
                    "match_count": match_count,
                },
            ).execute()
            return _rows(_response_data(result))

        return await self._run(_rpc)

    # ── Ingestion jobs ────────────────────────────────────────────────────────

    async def create_ingestion_job(
        self,
        tenant_id: str,
        filename: str,
        category: str,
        file_hash: str,
        ingested_by: str,
    ) -> IngestionJobRow:
        row = {
            "tenant_id": tenant_id,
            "filename": filename,
            "category": category,
            "file_hash": file_hash,
            "ingested_by": ingested_by,
            "status": "pending",
        }

        def _insert() -> IngestionJobRow:
            result = self.get_client().table("ingestion_jobs").insert(row).execute()
            return cast(IngestionJobRow, _inserted_row(result))

        return await self._run(_insert)

    async def get_ingestion_job(self, job_id: str, tenant_id: str) -> IngestionJobRow | None:
        def _fetch() -> IngestionJobRow | None:
            result = (
                self.get_client()
                .table("ingestion_jobs")
                .select("*")
                .eq("id", job_id)
                .eq("tenant_id", tenant_id)
                .maybe_single()
                .execute()
            )
            return cast(IngestionJobRow | None, _maybe_single_row(result))

        return await self._run(_fetch)

    async def update_ingestion_job(self, job_id: str, fields: dict[str, Any]) -> None:
        def _update() -> None:
            self.get_client().table("ingestion_jobs").update(fields).eq("id", job_id).execute()

        await self._run(_update)


supabase_service = SupabaseService()

# Backward-compatible aliases — existing code imports these names
supabase_client = supabase_service
warm_supabase_pool = supabase_service.warm_pool
ping_supabase = supabase_service.ping
get_tenant = supabase_service.get_tenant
get_public_tenant_by_slug = supabase_service.get_public_tenant_by_slug
get_tenant_by_slug = supabase_service.get_tenant_by_slug
get_profile_tenant_id = supabase_service.get_profile_tenant_id
get_profile_role = supabase_service.get_profile_role
update_tenant_calendar_config = supabase_service.update_tenant_calendar_config
update_booking_page = supabase_service.update_booking_page
list_providers = supabase_service.list_providers
get_provider_by_profile = supabase_service.get_provider_by_profile
deactivate_provider = supabase_service.deactivate_provider
update_provider_availability = supabase_service.update_provider_availability
list_staff_invites = supabase_service.list_staff_invites
get_staff_invite_by_email = supabase_service.get_staff_invite_by_email
create_staff_invite = supabase_service.create_staff_invite
get_staff_invite_by_token = supabase_service.get_staff_invite_by_token
list_audit_logs = supabase_service.list_audit_logs
acknowledge_tenant_baa = supabase_service.acknowledge_tenant_baa
insert_audit_log = supabase_service.insert_audit_log
get_supabase_client = supabase_service.get_client

create_patient_session = supabase_service.create_patient_session
get_patient_session = supabase_service.get_patient_session
list_patient_sessions = supabase_service.list_patient_sessions
update_session_status = supabase_service.update_session_status
save_session_thread = supabase_service.save_session_thread
update_session_agent_state = supabase_service.update_session_agent_state
load_emergency_keyword_patterns = supabase_service.load_emergency_keyword_patterns
flag_emergency_session = supabase_service.flag_emergency_session
escalate_session = supabase_service.escalate_session
update_session_triage_status = supabase_service.update_session_triage_status

create_appointment = supabase_service.create_appointment
list_appointments = supabase_service.list_appointments
get_appointment = supabase_service.get_appointment
find_conflicting_appointment = supabase_service.find_conflicting_appointment
update_appointment = supabase_service.update_appointment
cancel_appointment = supabase_service.cancel_appointment

find_document_by_hash = supabase_service.find_document_by_hash
create_clinic_document = supabase_service.create_clinic_document
bulk_insert_protocols = supabase_service.bulk_insert_protocols
list_clinic_documents = supabase_service.list_clinic_documents
get_document_chunks = supabase_service.get_document_chunks
delete_clinic_document = supabase_service.delete_clinic_document
match_clinic_protocols = supabase_service.match_clinic_protocols

create_ingestion_job = supabase_service.create_ingestion_job
get_ingestion_job = supabase_service.get_ingestion_job
update_ingestion_job = supabase_service.update_ingestion_job
