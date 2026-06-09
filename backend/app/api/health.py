import time

from fastapi import APIRouter

from app.adapters.llm import is_chat_available, probe_provider
from app.adapters.redis_client import ping_redis
from app.core.feature_flags import get_chat_provider, get_feature_flags
from app.schemas.health import HealthChecks, HealthResponse
from app.services.supabase_client import ping_supabase

router = APIRouter(tags=["health"])


@router.get("/")
async def root() -> dict[str, str]:
    """Render and uptime probes often hit `/`; point them at the real health endpoint."""
    return {"status": "ok", "health": "/health", "ready": "/ready"}


@router.get("/health", response_model=HealthResponse)
async def health_check() -> HealthResponse:
    db_ok = await ping_supabase()
    redis_ok = await ping_redis()

    ai_latency_ms: float | None = None
    ai_ok = True
    ai_provider: str | None = None

    if is_chat_available():
        flags = get_feature_flags()
        ai_provider = flags.features.ai.chat_provider
        start = time.perf_counter()
        try:
            probe = await probe_provider(get_chat_provider())
            ai_ok = probe.ok
            ai_latency_ms = probe.latency_ms
        except Exception:
            ai_ok = False
            ai_latency_ms = round((time.perf_counter() - start) * 1000, 1)
    else:
        ai_ok = False

    status = "healthy" if db_ok and redis_ok else "degraded"
    return HealthResponse(
        status=status,
        checks=HealthChecks(
            database=db_ok,
            redis=redis_ok,
            ai=ai_ok,
            ai_provider=ai_provider,
            ai_latency_ms=ai_latency_ms,
            openai=ai_ok,
            openai_latency_ms=ai_latency_ms,
        ),
    )


@router.get("/ready")
async def readiness_check() -> dict:
    """Kubernetes/Railway readiness probe — core dependencies only."""
    db_ok = await ping_supabase()
    redis_ok = await ping_redis()
    if not db_ok or not redis_ok:
        return {"status": "not_ready", "database": db_ok, "redis": redis_ok}
    return {"status": "ready", "database": True, "redis": True}
