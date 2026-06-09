"""Multi-provider LLM adapters selected via feature-flags.json."""

from app.adapters.llm.service import (
    chat_complete,
    embed_texts,
    is_chat_available,
    is_embedding_available,
    probe_all_providers,
    probe_provider,
    stream_chat,
)

__all__ = [
    "chat_complete",
    "stream_chat",
    "embed_texts",
    "is_chat_available",
    "is_embedding_available",
    "probe_provider",
    "probe_all_providers",
]
