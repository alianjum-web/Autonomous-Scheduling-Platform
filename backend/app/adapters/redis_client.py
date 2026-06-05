"""Upstash Redis (serverless) — async distributed locks for slot booking."""

from __future__ import annotations

import redis.asyncio as aioredis

from app.core.config import get_settings

_redis: aioredis.Redis | None = None


async def get_redis() -> aioredis.Redis:
    global _redis
    if _redis is None:
        settings = get_settings()
        url = settings.effective_redis_url
        kwargs: dict = {"encoding": "utf-8", "decode_responses": True}
        if url.startswith("rediss://"):
            kwargs["ssl"] = True
        _redis = aioredis.from_url(url, **kwargs)
    return _redis


async def acquire_lock(key: str, ttl: int = 30) -> bool:
    """Atomic SET key value NX EX ttl — returns True if lock acquired."""
    try:
        client = await get_redis()
        result = await client.set(f"lock:{key}", "1", nx=True, ex=ttl)
        return result is True
    except Exception:
        return False


async def release_lock(key: str) -> None:
    try:
        client = await get_redis()
        await client.delete(f"lock:{key}")
    except Exception:
        pass


async def ping_redis() -> bool:
    try:
        client = await get_redis()
        return (await client.ping()) is True
    except Exception:
        return False
