from __future__ import annotations

from collections.abc import AsyncGenerator

from app.adapters.llm.providers import BaseLLMProvider, build_provider
from app.adapters.llm.types import ProviderProbeResult
from app.core.feature_flags import (
    ProviderId,
    get_chat_provider,
    get_embedding_provider,
    get_feature_flags,
)
from app.core.logger import get_logger

logger = get_logger(__name__)


def _resolve_provider(kind: str) -> BaseLLMProvider:
    flags = get_feature_flags()
    provider_id: ProviderId = get_chat_provider() if kind == "chat" else get_embedding_provider()
    config = flags.providers.get(provider_id)
    if config is None:
        from app.core.feature_flags import ProviderConfig

        config = ProviderConfig()
    provider = build_provider(provider_id, config)
    if not config.enabled:
        raise RuntimeError(f"Provider {provider_id!r} is disabled in feature-flags.json")
    if not provider.is_configured():
        raise RuntimeError(f"Provider {provider_id!r} is not configured (check .env secrets)")
    return provider


def is_chat_available() -> bool:
    try:
        return _resolve_provider("chat").is_configured()
    except RuntimeError:
        return False


def is_embedding_available() -> bool:
    try:
        return _resolve_provider("embedding").is_configured()
    except RuntimeError:
        return False


async def chat_complete(
    messages: list[dict[str, str]],
    *,
    max_tokens: int = 500,
    temperature: float = 0.4,
) -> str:
    provider = _resolve_provider("chat")
    flags = get_feature_flags()
    logger.debug(
        "LLM chat completion",
        extra={
            "extra_data": {
                "provider": provider.provider_id,
                "model": provider.chat_model(),
                "hot_reload": flags.hot_reload,
            }
        },
    )
    return await provider.chat_complete(
        messages,
        max_tokens=max_tokens,
        temperature=temperature,
    )


async def stream_chat(
    messages: list[dict[str, str]],
    *,
    max_tokens: int = 500,
    temperature: float = 0.4,
) -> AsyncGenerator[str, None]:
    flags = get_feature_flags()
    if not flags.features.triage.streaming_enabled:
        text = await chat_complete(
            messages,
            max_tokens=max_tokens,
            temperature=temperature,
        )
        for token in text.split():
            yield token + " "
        return

    provider = _resolve_provider("chat")
    logger.debug(
        "LLM stream chat",
        extra={
            "extra_data": {
                "provider": provider.provider_id,
                "model": provider.chat_model(),
            }
        },
    )
    async for token in provider.stream_chat(
        messages,
        max_tokens=max_tokens,
        temperature=temperature,
    ):
        yield token


async def embed_texts(texts: list[str]) -> list[list[float]]:
    provider = _resolve_provider("embedding")
    logger.debug(
        "LLM embed batch",
        extra={
            "extra_data": {
                "provider": provider.provider_id,
                "model": provider.embedding_model(),
                "count": len(texts),
            }
        },
    )
    return await provider.embed(texts)


async def probe_provider(provider_id: ProviderId) -> ProviderProbeResult:
    flags = get_feature_flags()
    config = flags.providers.get(provider_id)
    if config is None:
        from app.core.feature_flags import ProviderConfig

        config = ProviderConfig()
    provider = build_provider(provider_id, config)
    return await provider.probe(
        active_for_chat=get_chat_provider() == provider_id,
        active_for_embedding=get_embedding_provider() == provider_id,
    )


async def probe_all_providers() -> list[ProviderProbeResult]:
    results: list[ProviderProbeResult] = []
    for provider_id in ("ollama", "openai", "gemini", "grok"):
        results.append(await probe_provider(provider_id))  # type: ignore[arg-type]
    return results
