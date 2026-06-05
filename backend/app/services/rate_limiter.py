from __future__ import annotations

import time

import redis.asyncio as aioredis

from app.core.config import get_settings

_redis: aioredis.Redis | None = None

MAX_REQUESTS_PER_MINUTE = 3
WINDOW_SECONDS = 60


async def get_redis() -> aioredis.Redis:
    global _redis
    if _redis is None:
        settings = get_settings()
        _redis = aioredis.from_url(settings.redis_url, decode_responses=True)
    return _redis


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
