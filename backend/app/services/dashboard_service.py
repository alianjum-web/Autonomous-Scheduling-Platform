"""Clinic dashboard aggregates — owner and doctor overview stats."""

from __future__ import annotations

from datetime import date
from typing import Any

from app.services import provider_service, supabase_client
from app.services.provider_matching import appointment_matches_provider


def _session_metadata(session: dict[str, Any]) -> dict[str, Any]:
    raw = session.get("metadata")
    return raw if isinstance(raw, dict) else {}


def _session_summary(
    session: dict[str, Any],
    appointment_by_session: dict[str, dict[str, Any]] | None = None,
) -> dict[str, str | bool | None]:
    meta = _session_metadata(session)
    patient_name = meta.get("patient_name")
    if isinstance(patient_name, str):
        name = patient_name.strip() or None
    else:
        name = None

    if not name and appointment_by_session:
        appt = appointment_by_session.get(str(session.get("id") or ""))
        if appt:
            appt_name = appt.get("patient_name")
            if isinstance(appt_name, str) and appt_name.strip():
                name = appt_name.strip()

    complaint = meta.get("chief_complaint")
    intake_complete = bool(name) and meta.get("intake_pending") is False
    return {
        "id": str(session["id"]),
        "status": str(session.get("status") or "active"),
        "triage_status": session.get("current_triage_status"),
        "patient_name": name,
        "chief_complaint": str(complaint).strip() if complaint else None,
        "ai_summary": session.get("ai_summary"),
        "source": meta.get("source"),
        "created_at": str(session.get("created_at") or ""),
        "intake_complete": intake_complete,
    }


def _appointment_date(appt: dict[str, Any]) -> str:
    slot = str(appt.get("slot_start") or "")
    return slot[:10] if len(slot) >= 10 else ""


def _is_active_appointment(appt: dict[str, Any]) -> bool:
    return str(appt.get("status") or "") not in {"cancelled", "no_show"}


def _is_upcoming_appointment(appt: dict[str, Any]) -> bool:
    return str(appt.get("status") or "") in {"confirmed", "pending"}


async def get_owner_dashboard(tenant_id: str) -> dict[str, Any]:
    today = date.today().isoformat()
    all_appointments = await supabase_client.list_appointments(tenant_id)
    appointments_today = [a for a in all_appointments if _appointment_date(a) == today]
    upcoming = sorted(
        [
            a
            for a in all_appointments
            if _is_upcoming_appointment(a) and _appointment_date(a) >= today
        ],
        key=lambda row: str(row.get("slot_start") or ""),
    )
    doctors = await supabase_client.list_providers(tenant_id, active_only=True)
    sessions = await supabase_client.list_patient_sessions(tenant_id, limit=100)

    pending = [
        s
        for s in sessions
        if str(s.get("current_triage_status") or "") in {"escalated_to_human", "emergency"}
    ]
    triage_today = [s for s in sessions if str(s.get("created_at") or "").startswith(today)]

    recent_patients: list[dict[str, str | None]] = []
    for appt in upcoming[:10]:
        recent_patients.append(
            {
                "id": str(appt.get("id") or ""),
                "name": str(appt.get("patient_name") or "Unknown"),
                "phone": str(appt.get("patient_phone") or "") or None,
                "slot_start": str(appt.get("slot_start") or "") or None,
                "confirmation_code": str(appt.get("confirmation_code") or "") or None,
            }
        )

    return {
        "todays_appointments": len(appointments_today),
        "upcoming_appointments": len(upcoming),
        "pending_requests": len(pending),
        "active_doctors": len(doctors),
        "triage_sessions_today": len(triage_today),
        "triage_sessions_total": len(sessions),
        "recent_patients": recent_patients[:5],
    }


async def get_doctor_dashboard(tenant_id: str, profile_id: str) -> dict[str, Any]:
    provider = await provider_service.get_my_provider(profile_id)

    today = date.today().isoformat()
    all_appointments = await supabase_client.list_appointments(tenant_id)
    my_upcoming = sorted(
        [
            a
            for a in all_appointments
            if _is_upcoming_appointment(a)
            and appointment_matches_provider(a, provider)
            and _appointment_date(a) >= today
        ],
        key=lambda row: str(row.get("slot_start") or ""),
    )
    my_today = [a for a in my_upcoming if _appointment_date(a) == today]
    sessions = await supabase_client.list_patient_sessions(tenant_id, limit=50)

    pending_reviews = [
        s
        for s in sessions
        if str(s.get("current_triage_status") or "") in {"escalated_to_human", "active", "emergency"}
    ]
    intake_forms = [s for s in sessions if _session_metadata(s).get("patient_name")]

    upcoming = [
        {
            "id": str(a.get("id") or ""),
            "name": str(a.get("patient_name") or "Unknown"),
            "phone": str(a.get("patient_phone") or "") or None,
            "slot_start": str(a.get("slot_start") or "") or None,
            "confirmation_code": str(a.get("confirmation_code") or "") or None,
        }
        for a in my_upcoming
    ][:5]

    return {
        "appointments_today": len(my_today),
        "pending_reviews": len(pending_reviews),
        "upcoming_patients": upcoming,
        "recent_intake_forms": len(intake_forms),
    }


async def list_triage_sessions(
    tenant_id: str,
    *,
    intake_only: bool = False,
    limit: int = 25,
) -> list[dict[str, str | bool | None]]:
    sessions = await supabase_client.list_patient_sessions(tenant_id, limit=limit)
    appointments = await supabase_client.list_appointments(tenant_id)
    appointment_by_session = {
        str(row.get("session_id")): row
        for row in appointments
        if row.get("session_id")
    }
    summaries = [_session_summary(s, appointment_by_session) for s in sessions]
    if intake_only:
        return [s for s in summaries if s.get("patient_name")]
    return summaries
