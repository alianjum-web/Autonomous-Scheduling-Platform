from __future__ import annotations

import redis.asyncio as aioredis

from app.core.config import get_settings

_redis: aioredis.Redis | None = None
LOCK_TTL_SECONDS = 120


async def get_redis() -> aioredis.Redis:
    global _redis
    if _redis is None:
        settings = get_settings()
        _redis = aioredis.from_url(settings.redis_url, decode_responses=True)
    return _redis


async def acquire_slot_lock(lock_key: str) -> bool:
    try:
        client = await get_redis()
        return bool(await client.set(f"lock:slot:{lock_key}", "1", nx=True, ex=LOCK_TTL_SECONDS))
    except Exception:
        return True


async def release_slot_lock(lock_key: str) -> None:
    try:
        client = await get_redis()
        await client.delete(f"lock:slot:{lock_key}")
    except Exception:
        pass
