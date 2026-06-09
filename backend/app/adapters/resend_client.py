"""Resend REST API client — transactional email + connectivity probe."""

from __future__ import annotations

import httpx

from app.core.logger import get_logger
from app.core.resend_config import get_resend_config

logger = get_logger(__name__)

RESEND_API_BASE = "https://api.resend.com"


async def ping_resend() -> bool:
    """Return True when API key is set and Resend accepts the request."""
    config = get_resend_config()
    if not config.api_key:
        return False

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                f"{RESEND_API_BASE}/domains",
                headers={"Authorization": f"Bearer {config.api_key}"},
            )
        return response.status_code in (200, 403)
    except httpx.HTTPError:
        return False


async def send_email(
    *,
    to: str | list[str],
    subject: str,
    html: str,
    text: str | None = None,
    reply_to: str | None = None,
) -> str | None:
    """
    Send a transactional email via Resend API.
    Returns Resend message id, or None if not configured / failed.
    Auth emails (signup, verify, reset) are sent by Supabase using SMTP — not this function.
    """
    config = get_resend_config()
    if not config.configured:
        logger.warning("Resend send skipped — RESEND_API_KEY or RESEND_FROM_EMAIL not set")
        return None

    recipients = [to] if isinstance(to, str) else to
    payload: dict = {
        "from": f"{config.from_name} <{config.from_email}>",
        "to": recipients,
        "subject": subject,
        "html": html,
    }
    if text:
        payload["text"] = text
    if reply_to:
        payload["reply_to"] = reply_to

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(
                f"{RESEND_API_BASE}/emails",
                json=payload,
                headers={"Authorization": f"Bearer {config.api_key}"},
            )
        if response.status_code >= 400:
            logger.warning(
                "Resend send failed",
                extra={"extra_data": {"status": response.status_code, "body": response.text[:200]}},
            )
            return None
        data = response.json()
        message_id = data.get("id") if isinstance(data, dict) else None
        logger.info("Resend email sent", extra={"extra_data": {"message_id": message_id}})
        return message_id if isinstance(message_id, str) else None
    except httpx.HTTPError as exc:
        logger.warning("Resend send error", extra={"extra_data": {"error": str(exc)}})
        return None
