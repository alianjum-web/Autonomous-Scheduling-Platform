from fastapi import APIRouter

from app.adapters.llm import probe_all_providers
from app.core.feature_flags import get_feature_flags, reload_feature_flags
from app.schemas.health import AIProviderStatus, AIStatusResponse

router = APIRouter(prefix="/ai", tags=["ai"])


@router.get("/status", response_model=AIStatusResponse)
async def ai_provider_status() -> AIStatusResponse:
    """Probe every configured AI provider — switch active ones in feature-flags.json."""
    flags = get_feature_flags()
    probes = await probe_all_providers()
    return AIStatusResponse(
        chat_provider=flags.features.ai.chat_provider,
        embedding_provider=flags.features.ai.embedding_provider,
        hot_reload=flags.hot_reload,
        providers=[
            AIProviderStatus(
                provider=p.provider,
                configured=p.configured,
                enabled=p.enabled,
                active_for_chat=p.active_for_chat,
                active_for_embedding=p.active_for_embedding,
                ok=p.ok,
                latency_ms=p.latency_ms,
                model=p.model,
                error=p.error,
            )
            for p in probes
        ],
    )


@router.post("/reload-flags", response_model=AIStatusResponse)
async def reload_ai_feature_flags() -> AIStatusResponse:
    """Force-reload feature-flags.json (also auto-reloads on file change when hot_reload is true)."""
    reload_feature_flags()
    return await ai_provider_status()
