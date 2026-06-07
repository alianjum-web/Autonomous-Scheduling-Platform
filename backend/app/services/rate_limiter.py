"""Per-session triage rate limiting backed by shared Redis client."""

from __future__ import annotations

import time

from app.adapters.redis_client import get_redis

MAX_REQUESTS_PER_MINUTE = 3
WINDOW_SECONDS = 60


async def check_session_rate_limit(session_id: str) -> bool:
    """Return True if request is allowed, False if rate limited."""
    try:
        client = await get_redis()
        key = f"rate:triage:{session_id}"
        now = int(time.time())
        window_start = now - WINDOW_SECONDS

        pipe = client.pipeline()
        pipe.zremrangebyscore(key, 0, window_start)
        pipe.zadd(key, {str(now): now})
        pipe.zcard(key)
        pipe.expire(key, WINDOW_SECONDS)
        results = await pipe.execute()
        count = results[2]
        return count <= MAX_REQUESTS_PER_MINUTE
    except Exception:
        return True
