from __future__ import annotations

import asyncio
from datetime import datetime, timedelta, timezone

from app.core.config import get_settings
from app.core.logger import get_logger

logger = get_logger(__name__)

MAX_RETRIES = 3
BACKOFF_BASE = 0.5


async def _retry_with_backoff(coro_factory, label: str):
    last_exc: Exception | None = None
    for attempt in range(MAX_RETRIES):
        try:
            return await coro_factory()
        except Exception as exc:
            last_exc = exc
            delay = BACKOFF_BASE * (2**attempt)
            logger.warning(
                f"Calendar gateway retry {attempt + 1}/{MAX_RETRIES}",
                extra={"extra_data": {"label": label, "error": str(exc)}},
            )
            await asyncio.sleep(delay)
    raise last_exc  # type: ignore[misc]


def _get_calendar_credentials(scopes: list[str]):
    import json

    from google.auth.transport.requests import Request
    from google.oauth2 import service_account
    from google.oauth2.credentials import Credentials

    settings = get_settings()

    if settings.google_oauth_refresh_token and settings.google_oauth_client_id:
        creds = Credentials(
            token=None,
            refresh_token=settings.google_oauth_refresh_token,
            token_uri="https://oauth2.googleapis.com/token",
            client_id=settings.google_oauth_client_id,
            client_secret=settings.google_oauth_client_secret,
            scopes=scopes,
        )
        creds.refresh(Request())
        return creds

    if settings.google_service_account_json:
        return service_account.Credentials.from_service_account_info(
            json.loads(settings.google_service_account_json),
            scopes=scopes,
        )
    return None


async def _fetch_google_slots(tenant_id: str, days_ahead: int, provider: str = "General Practice") -> list[str]:
    settings = get_settings()
    if not settings.google_calendar_id or not settings.google_service_account_json:
        return _generate_mock_slots(days_ahead)

    def _sync_fetch() -> list[str]:
        from googleapiclient.discovery import build

        creds = _get_calendar_credentials(["https://www.googleapis.com/auth/calendar.readonly"])
        if not creds:
            return _generate_mock_slots(days_ahead)
        service = build("calendar", "v3", credentials=creds, cache_discovery=False)
        now = datetime.now(timezone.utc)
        end = now + timedelta(days=days_ahead)
        body = {
            "timeMin": now.isoformat(),
            "timeMax": end.isoformat(),
            "items": [{"id": settings.google_calendar_id}],
        }
        result = service.freebusy().query(body=body).execute()
        busy = result.get("calendars", {}).get(settings.google_calendar_id, {}).get("busy", [])
        return _slots_excluding_busy(now, days_ahead, busy)

    return await asyncio.to_thread(_sync_fetch)


def _generate_mock_slots(days_ahead: int, max_slots: int = 16) -> list[str]:
    slots: list[str] = []
    base = datetime.now(timezone.utc).replace(minute=0, second=0, microsecond=0)
    for day in range(1, days_ahead + 1):
        for hour in (9, 10, 11, 14, 15, 16):
            slot = (base + timedelta(days=day)).replace(hour=hour, minute=0)
            slots.append(slot.isoformat())
            if len(slots) >= max_slots:
                return slots
    return slots


def _slots_excluding_busy(
    start: datetime, days_ahead: int, busy_periods: list[dict]
) -> list[str]:
    candidates = _generate_mock_slots(days_ahead, max_slots=32)
    busy_ranges = []
    for period in busy_periods:
        busy_ranges.append((
            datetime.fromisoformat(period["start"].replace("Z", "+00:00")),
            datetime.fromisoformat(period["end"].replace("Z", "+00:00")),
        ))

    available = []
    for slot_iso in candidates:
        slot_dt = datetime.fromisoformat(slot_iso)
        if not any(b_start <= slot_dt < b_end for b_start, b_end in busy_ranges):
            available.append(slot_iso)
    return available[:8]


async def get_available_slots(
    tenant_id: str, days_ahead: int = 7, provider: str = "General Practice"
) -> list[str]:
    return await _retry_with_backoff(
        lambda: _fetch_google_slots(tenant_id, days_ahead, provider),
        "get_available_slots",
    )


async def create_calendar_event(
    tenant_id: str,
    slot_start: str,
    slot_end: str,
    patient_name: str,
    confirmation_code: str,
    provider: str = "General Practice",
    treatment: str = "consultation",
) -> str | None:
    settings = get_settings()
    if not settings.google_calendar_id or not settings.google_service_account_json:
        return f"mock-event-{confirmation_code}"

    def _sync_create() -> str:
        from googleapiclient.discovery import build

        creds = _get_calendar_credentials(["https://www.googleapis.com/auth/calendar"])
        if not creds:
            return f"mock-event-{confirmation_code}"
        service = build("calendar", "v3", credentials=creds, cache_discovery=False)
        event = {
            "summary": f"{treatment}: {patient_name} ({provider})",
            "description": f"Confirmation: {confirmation_code}",
            "start": {"dateTime": slot_start, "timeZone": "UTC"},
            "end": {"dateTime": slot_end, "timeZone": "UTC"},
        }
        created = (
            service.events()
            .insert(calendarId=settings.google_calendar_id, body=event)
            .execute()
        )
        return created["id"]

    return await _retry_with_backoff(_sync_create, "create_calendar_event")


async def delete_calendar_event(event_id: str) -> None:
    settings = get_settings()
    if event_id.startswith("mock-event-") or not settings.google_calendar_id:
        return

    def _sync_delete() -> None:
        from googleapiclient.discovery import build

        creds = _get_calendar_credentials(["https://www.googleapis.com/auth/calendar"])
        if not creds:
            return
        service = build("calendar", "v3", credentials=creds, cache_discovery=False)
        service.events().delete(calendarId=settings.google_calendar_id, eventId=event_id).execute()

    await _retry_with_backoff(_sync_delete, "delete_calendar_event")
