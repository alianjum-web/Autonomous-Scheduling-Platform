from __future__ import annotations

import asyncio
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo

from app.core.config import get_settings
from app.core.logger import get_logger
from app.services import supabase_client

logger = get_logger(__name__)

MAX_RETRIES = 3
BACKOFF_BASE = 0.5


@dataclass(frozen=True)
class TenantCalendarConfig:
    tenant_id: str
    timezone: str
    calendar_provider: str
    google_calendar_id: str | None
    business_hours_start: int
    business_hours_end: int
    slot_duration_minutes: int

    @property
    def uses_google(self) -> bool:
        settings = get_settings()
        has_creds = bool(
            settings.google_service_account_json
            or settings.google_oauth_refresh_token
        )
        return (
            self.calendar_provider == "google"
            and bool(self.google_calendar_id)
            and has_creds
        )


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


async def resolve_tenant_calendar_config(tenant_id: str) -> TenantCalendarConfig:
    settings = get_settings()
    tenant = await supabase_client.get_tenant(tenant_id)
    if tenant is None:
        return TenantCalendarConfig(
            tenant_id=tenant_id,
            timezone="America/New_York",
            calendar_provider="mock",
            google_calendar_id=settings.google_calendar_id,
            business_hours_start=9,
            business_hours_end=17,
            slot_duration_minutes=30,
        )

    provider = tenant.get("calendar_provider") or "none"
    calendar_id = tenant.get("google_calendar_id") or settings.google_calendar_id
    if provider == "none" and calendar_id and settings.google_service_account_json:
        provider = "google"

    return TenantCalendarConfig(
        tenant_id=tenant_id,
        timezone=tenant.get("timezone") or "America/New_York",
        calendar_provider=provider if provider != "none" else "mock",
        google_calendar_id=calendar_id,
        business_hours_start=int(tenant.get("business_hours_start") or 9),
        business_hours_end=int(tenant.get("business_hours_end") or 17),
        slot_duration_minutes=int(tenant.get("slot_duration_minutes") or 30),
    )


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


def _generate_tenant_slots(config: TenantCalendarConfig, days_ahead: int, max_slots: int = 16) -> list[str]:
    slots: list[str] = []
    try:
        tz = ZoneInfo(config.timezone)
    except Exception:
        tz = ZoneInfo("America/New_York")

    now_local = datetime.now(tz)
    duration = timedelta(minutes=config.slot_duration_minutes)

    for day_offset in range(1, days_ahead + 1):
        day = (now_local + timedelta(days=day_offset)).date()
        slot_local = datetime(
            day.year, day.month, day.day, config.business_hours_start, 0, tzinfo=tz
        )
        end_of_day = datetime(
            day.year, day.month, day.day, config.business_hours_end, 0, tzinfo=tz
        )
        while slot_local + duration <= end_of_day:
            if slot_local > now_local:
                slots.append(slot_local.astimezone(timezone.utc).isoformat())
                if len(slots) >= max_slots:
                    return slots
            slot_local += duration
    return slots


def _slots_excluding_busy(
    candidates: list[str], busy_periods: list[dict]
) -> list[str]:
    busy_ranges = []
    for period in busy_periods:
        busy_ranges.append((
            datetime.fromisoformat(period["start"].replace("Z", "+00:00")),
            datetime.fromisoformat(period["end"].replace("Z", "+00:00")),
        ))

    available = []
    for slot_iso in candidates:
        slot_dt = datetime.fromisoformat(slot_iso.replace("Z", "+00:00"))
        if not any(b_start <= slot_dt < b_end for b_start, b_end in busy_ranges):
            available.append(slot_iso)
    return available[:8]


async def _fetch_google_slots(config: TenantCalendarConfig, days_ahead: int) -> list[str]:
    calendar_id = config.google_calendar_id
    if not calendar_id or not config.uses_google:
        return _generate_tenant_slots(config, days_ahead)

    def _sync_fetch() -> list[str]:
        from googleapiclient.discovery import build

        creds = _get_calendar_credentials(["https://www.googleapis.com/auth/calendar.readonly"])
        if not creds:
            return _generate_tenant_slots(config, days_ahead)
        service = build("calendar", "v3", credentials=creds, cache_discovery=False)
        now = datetime.now(timezone.utc)
        end = now + timedelta(days=days_ahead)
        body = {
            "timeMin": now.isoformat(),
            "timeMax": end.isoformat(),
            "items": [{"id": calendar_id}],
        }
        result = service.freebusy().query(body=body).execute()
        busy = result.get("calendars", {}).get(calendar_id, {}).get("busy", [])
        candidates = _generate_tenant_slots(config, days_ahead, max_slots=32)
        return _slots_excluding_busy(candidates, busy)

    return await asyncio.to_thread(_sync_fetch)


async def get_available_slots(
    tenant_id: str, days_ahead: int = 7, provider: str = "General Practice"
) -> list[str]:
    config = await resolve_tenant_calendar_config(tenant_id)
    if config.uses_google:
        return await _retry_with_backoff(
            lambda: _fetch_google_slots(config, days_ahead),
            "get_available_slots",
        )
    return _generate_tenant_slots(config, days_ahead)


async def create_calendar_event(
    tenant_id: str,
    slot_start: str,
    slot_end: str,
    patient_name: str,
    confirmation_code: str,
    provider: str = "General Practice",
    treatment: str = "consultation",
) -> str | None:
    config = await resolve_tenant_calendar_config(tenant_id)
    if not config.uses_google or not config.google_calendar_id:
        return f"mock-event-{confirmation_code}"

    calendar_id = config.google_calendar_id

    def _sync_create() -> str:
        from googleapiclient.discovery import build

        creds = _get_calendar_credentials(["https://www.googleapis.com/auth/calendar"])
        if not creds:
            return f"mock-event-{confirmation_code}"
        service = build("calendar", "v3", credentials=creds, cache_discovery=False)
        event = {
            "summary": f"{treatment}: {patient_name} ({provider})",
            "description": f"Confirmation: {confirmation_code}",
            "start": {"dateTime": slot_start, "timeZone": config.timezone},
            "end": {"dateTime": slot_end, "timeZone": config.timezone},
        }
        created = (
            service.events()
            .insert(calendarId=calendar_id, body=event)
            .execute()
        )
        return created["id"]

    return await _retry_with_backoff(_sync_create, "create_calendar_event")


async def delete_calendar_event(tenant_id: str, event_id: str) -> None:
    if event_id.startswith("mock-event-"):
        return

    config = await resolve_tenant_calendar_config(tenant_id)
    calendar_id = config.google_calendar_id
    if not calendar_id or not config.uses_google:
        return

    def _sync_delete() -> None:
        from googleapiclient.discovery import build

        creds = _get_calendar_credentials(["https://www.googleapis.com/auth/calendar"])
        if not creds:
            return
        service = build("calendar", "v3", credentials=creds, cache_discovery=False)
        service.events().delete(calendarId=calendar_id, eventId=event_id).execute()

    await _retry_with_backoff(_sync_delete, "delete_calendar_event")
