import time

from fastapi import APIRouter

from app.adapters.openai_client import get_openai_client_optional
from app.adapters.redis_client import ping_redis
from app.core.config import get_settings
from app.services.supabase_client import ping_supabase

router = APIRouter(tags=["health"])


@router.get("/health")
async def health_check():
    settings = get_settings()
    db_ok = await ping_supabase()
    redis_ok = await ping_redis()

    openai_latency_ms: float | None = None
    openai_ok = True
    client = get_openai_client_optional()
    if client:
        start = time.perf_counter()
        try:
            await client.models.list()
            openai_latency_ms = round((time.perf_counter() - start) * 1000, 1)
        except Exception:
            openai_ok = False

    status = "healthy" if db_ok and redis_ok else "degraded"
    return {
        "status": status,
        "checks": {
            "database": db_ok,
            "redis": redis_ok,
            "openai": openai_ok,
            "openai_latency_ms": openai_latency_ms,
        },
    }
