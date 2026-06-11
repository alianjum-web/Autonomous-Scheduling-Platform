"""Provider (doctor) registry — list, availability, remove."""

from __future__ import annotations

from typing import Any

from app.services import supabase_client


class ProviderError(Exception):
    pass


def _row_provider(row: dict[str, Any]) -> dict[str, str | int | bool | None]:
    return {
        "id": str(row["id"]),
        "profile_id": str(row["profile_id"]),
        "display_name": str(row["display_name"]),
        "specialty": str(row.get("specialty") or "General Practice"),
        "is_active": bool(row.get("is_active", True)),
        "availability_start": str(row.get("availability_start") or "09:00"),
        "availability_end": str(row.get("availability_end") or "17:00"),
        "slot_duration_minutes": int(row.get("slot_duration_minutes") or 30),
        "email": str(row.get("email") or ""),
    }


async def list_doctors(tenant_id: str) -> list[dict[str, str | int | bool | None]]:
    rows = await supabase_client.list_providers(tenant_id, active_only=True)
    enriched: list[dict[str, str | int | bool | None]] = []
    for row in rows:
        item = _row_provider(row)
        profile_id = str(row["profile_id"])
        role = await supabase_client.get_profile_role(profile_id)
        item["role"] = role or "doctor"
        enriched.append(item)
    return enriched


async def remove_doctor(tenant_id: str, profile_id: str) -> None:
    provider = await supabase_client.get_provider_by_profile(profile_id)
    if provider is None or str(provider.get("tenant_id")) != tenant_id:
        raise ProviderError("Doctor not found in this clinic")
    await supabase_client.deactivate_provider(tenant_id, profile_id)


async def update_my_availability(
    profile_id: str,
    *,
    availability_start: str,
    availability_end: str,
    slot_duration_minutes: int,
    specialty: str | None = None,
) -> dict[str, str | int | bool | None]:
    provider = await supabase_client.get_provider_by_profile(profile_id)
    if provider is None:
        raise ProviderError("Doctor profile not linked to a provider record")
    row = await supabase_client.update_provider_availability(
        profile_id,
        availability_start=availability_start,
        availability_end=availability_end,
        slot_duration_minutes=slot_duration_minutes,
        specialty=specialty,
    )
    return _row_provider(row)


async def get_my_provider(profile_id: str) -> dict[str, str | int | bool | None]:
    provider = await supabase_client.get_provider_by_profile(profile_id)
    if provider is None:
        raise ProviderError("Doctor provider record not found")
    return _row_provider(provider)
