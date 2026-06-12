"""Baseline clinic facts for AI triage — hours, services, doctors (no PDF required)."""

from __future__ import annotations

from typing import Any

from app.services import supabase_client


def _format_hour(hour: int) -> str:
    if hour == 0:
        return "12:00 AM"
    if hour < 12:
        return f"{hour}:00 AM"
    if hour == 12:
        return "12:00 PM"
    return f"{hour - 12}:00 PM"


async def build_clinic_baseline(tenant_id: str) -> str:
    """Plain-text facts injected into every triage turn (before vector RAG)."""
    tenant = await supabase_client.get_tenant(tenant_id)
    if tenant is None:
        return ""

    lines: list[str] = []
    name = str(tenant.get("name") or "This clinic").strip()
    lines.append(f"Clinic name: {name}")

    welcome = tenant.get("booking_welcome_message")
    if isinstance(welcome, str) and welcome.strip():
        lines.append(f"About: {welcome.strip()}")

    hours_info = tenant.get("clinic_hours_info")
    if isinstance(hours_info, str) and hours_info.strip():
        lines.append(f"Clinic hours: {hours_info.strip()}")
    else:
        start = int(tenant.get("business_hours_start") or 9)
        end = int(tenant.get("business_hours_end") or 17)
        lines.append(
            f"Default clinic hours: {_format_hour(start)} to {_format_hour(end)} (local time), "
            "Monday through Friday unless stated otherwise."
        )

    services = tenant.get("clinic_services")
    if isinstance(services, str) and services.strip():
        lines.append(f"Services offered: {services.strip()}")

    providers = await supabase_client.list_providers(tenant_id, active_only=True)
    if providers:
        lines.append("Doctors on staff:")
        for provider in providers[:8]:
            display = str(provider.get("display_name") or "Doctor")
            specialty = str(provider.get("specialty") or "General Practice")
            avail_start = str(provider.get("availability_start") or "")[:5]
            avail_end = str(provider.get("availability_end") or "")[:5]
            slot = f", bookable {avail_start}–{avail_end}" if avail_start and avail_end else ""
            lines.append(f"  • {display} — {specialty}{slot}")

    lines.append(
        "If a service is not listed above or in uploaded clinic documents, tell the patient "
        "you are not sure and offer to connect them with the front desk — do not invent services."
    )
    return "\n".join(lines)


async def baseline_rag_chunks(tenant_id: str) -> list[dict[str, Any]]:
    text = await build_clinic_baseline(tenant_id)
    if not text.strip():
        return []
    return [{"category": "faq", "content_payload": text, "source": "clinic_settings"}]
