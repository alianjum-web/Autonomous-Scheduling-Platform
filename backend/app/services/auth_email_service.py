"""Proxy auth email actions to Supabase with Redis rate limits and structured logging."""

from __future__ import annotations

from typing import Any

import httpx

from app.api.metrics import AUTH_EMAIL_FAILED, AUTH_EMAIL_RATE_LIMITED, AUTH_EMAIL_SENT
from app.core.config import get_settings
from app.core.logger import get_logger
from app.services.auth_email_rate_limiter import acquire_email_slot, check_ip_limit

logger = get_logger(__name__)

_AUTH_HEADERS = {"Content-Type": "application/json"}


def _auth_headers(anon_key: str) -> dict[str, str]:
    return {**_AUTH_HEADERS, "apikey": anon_key, "Authorization": f"Bearer {anon_key}"}


def _email_domain(email: str) -> str:
    parts = email.rsplit("@", 1)
    return parts[1] if len(parts) == 2 else "unknown"


async def _post_auth(path: str, payload: dict[str, Any]) -> tuple[int, dict[str, Any] | None, str | None]:
    settings = get_settings()
    url = f"{settings.supabase_url.rstrip('/')}/auth/v1/{path}"
    headers = _auth_headers(settings.supabase_anon_key)

    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.post(url, json=payload, headers=headers)

    body: dict[str, Any] | None = None
    try:
        body = response.json()
    except Exception:
        body = None

    message = None
    if body and isinstance(body.get("msg"), str):
        message = body["msg"]
    elif body and isinstance(body.get("error_description"), str):
        message = body["error_description"]
    elif body and isinstance(body.get("message"), str):
        message = body["message"]

    return response.status_code, body, message


async def _guard(action: str, email: str, ip: str) -> tuple[bool, int, str | None]:
    ip_ok, ip_retry = await check_ip_limit(action, ip)
    if not ip_ok:
        AUTH_EMAIL_RATE_LIMITED.labels(action=action, reason="ip").inc()
        logger.warning(
            "Auth email rate limited by IP",
            extra={"extra_data": {"action": action, "ip": ip, "retry_after_seconds": ip_retry}},
        )
        return False, ip_retry, "Too many requests from this network. Please try again later."

    email_ok, email_retry = await acquire_email_slot(action, email)
    if not email_ok:
        AUTH_EMAIL_RATE_LIMITED.labels(action=action, reason="email").inc()
        logger.warning(
            "Auth email rate limited by email",
            extra={
                "extra_data": {
                    "action": action,
                    "email_domain": _email_domain(email),
                    "retry_after_seconds": email_retry,
                }
            },
        )
        return False, email_retry, "Please wait before requesting another email."

    return True, 0, None


def _log_sent(action: str, email: str) -> None:
    AUTH_EMAIL_SENT.labels(action=action).inc()
    logger.info(
        "Auth email sent",
        extra={"extra_data": {"action": action, "email_domain": _email_domain(email)}},
    )


def _log_failed(action: str, email: str, status: int, message: str | None) -> None:
    AUTH_EMAIL_FAILED.labels(action=action).inc()
    logger.warning(
        "Auth email failed",
        extra={
            "extra_data": {
                "action": action,
                "email_domain": _email_domain(email),
                "status": status,
                "error": message or "unknown",
            }
        },
    )


async def sign_up_with_email(
    *,
    email: str,
    password: str,
    full_name: str,
    email_redirect_to: str,
    ip: str,
) -> tuple[bool, str, int]:
    allowed, retry_after, detail = await _guard("signup", email, ip)
    if not allowed:
        return False, detail or "Rate limited.", retry_after

    status, _body, message = await _post_auth(
        "signup",
        {
            "email": email,
            "password": password,
            "data": {"full_name": full_name},
            "options": {"email_redirect_to": email_redirect_to},
        },
    )

    if status >= 400:
        _log_failed("signup", email, status, message)
        return False, message or "Sign up failed. Please try again.", 0

    _log_sent("signup", email)
    return True, "Account created. Check your email to confirm.", 0


async def resend_verification_email(
    *,
    email: str,
    email_redirect_to: str,
    ip: str,
) -> tuple[bool, str, int]:
    allowed, retry_after, detail = await _guard("resend", email, ip)
    if not allowed:
        return False, detail or "Rate limited.", retry_after

    status, _body, message = await _post_auth(
        "resend",
        {
            "email": email,
            "type": "signup",
            "options": {"email_redirect_to": email_redirect_to},
        },
    )

    if status >= 400:
        _log_failed("resend", email, status, message)
        return False, message or "Could not resend confirmation email.", 0

    _log_sent("resend", email)
    return True, "Confirmation email sent. Check your inbox and spam folder.", 0


async def send_password_reset_email(
    *,
    email: str,
    redirect_to: str,
    ip: str,
) -> tuple[bool, str, int]:
    allowed, retry_after, detail = await _guard("recover", email, ip)
    if not allowed:
        return False, detail or "Rate limited.", retry_after

    status, _body, message = await _post_auth(
        "recover",
        {"email": email, "redirect_to": redirect_to},
    )

    if status >= 400:
        _log_failed("recover", email, status, message)
        return False, message or "Could not send reset email.", 0

    _log_sent("recover", email)
    return True, "Check your inbox for a password reset link.", 0
