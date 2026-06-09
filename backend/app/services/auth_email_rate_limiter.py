"""Redis-backed rate limits for auth email actions — blocks before Supabase."""

from __future__ import annotations

from app.adapters.redis_client import get_redis

EMAIL_COOLDOWN_SECONDS = 60
IP_WINDOW_SECONDS = 3600
IP_MAX_REQUESTS_PER_HOUR = 10


def _normalize_email(email: str) -> str:
    return email.strip().lower()


def _email_key(action: str, email: str) -> str:
    return f"auth:email:{action}:{_normalize_email(email)}"


def _ip_key(action: str, ip: str) -> str:
    return f"auth:ip:{action}:{ip}"


async def acquire_email_slot(action: str, email: str) -> tuple[bool, int]:
    """Return (allowed, retry_after_seconds). Sets a 60s cooldown when allowed."""
    try:
        client = await get_redis()
        key = _email_key(action, email)
        acquired = await client.set(key, "1", nx=True, ex=EMAIL_COOLDOWN_SECONDS)
        if acquired:
            return True, 0
        ttl = await client.ttl(key)
        return False, max(int(ttl), 1)
    except Exception:
        return True, 0


async def check_ip_limit(action: str, ip: str) -> tuple[bool, int]:
    """Return (allowed, retry_after_seconds) for per-IP hourly abuse protection."""
    try:
        client = await get_redis()
        key = _ip_key(action, ip)
        count = await client.incr(key)
        if count == 1:
            await client.expire(key, IP_WINDOW_SECONDS)
        if count <= IP_MAX_REQUESTS_PER_HOUR:
            return True, 0
        ttl = await client.ttl(key)
        return False, max(int(ttl), 1)
    except Exception:
        return True, 0
