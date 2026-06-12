"""Match appointments to a provider record (handles legacy General Practice bookings)."""

from __future__ import annotations

from typing import Any

_UNASSIGNED_LABELS = frozenset({"", "General Practice", "Provider"})


def _base_specialty(specialty: str) -> str:
    return specialty.split("·")[0].strip()


def appointment_matches_provider(appt: dict[str, Any], provider: dict[str, Any]) -> bool:
    pname = str(appt.get("provider_name") or "General Practice").strip()
    display = str(provider.get("display_name") or "").strip()
    specialty = str(provider.get("specialty") or "General Practice").strip()
    base = _base_specialty(specialty)

    if pname == display:
        return True
    if pname in {specialty, base}:
        return True
    if pname in _UNASSIGNED_LABELS:
        return True
    return False
