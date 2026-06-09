"""Hot-reloadable feature flags loaded from feature-flags.json.

Switch AI providers by editing ``features.ai.chat_provider`` (or ``embedding_provider``)
to one of: ``ollama``, ``openai``, ``gemini``, ``grok``. API keys stay in ``.env``; model
names and enablement live here for easy client-side rollout.
"""

from __future__ import annotations

import json
import threading
from pathlib import Path
from typing import Any, Literal

from pydantic import BaseModel, Field

from app.core.config import get_settings

ProviderId = Literal["ollama", "openai", "gemini", "grok"]

_VALID_PROVIDERS: frozenset[str] = frozenset({"ollama", "openai", "gemini", "grok"})


class AIFeatureFlags(BaseModel):
    chat_provider: ProviderId = "ollama"
    embedding_provider: ProviderId = "ollama"


class TriageFeatureFlags(BaseModel):
    streaming_enabled: bool = True
    intent_classifier_enabled: bool = True


class ComplianceFeatureFlags(BaseModel):
    baa_enforcement: bool = False


class FeatureBlock(BaseModel):
    ai: AIFeatureFlags = Field(default_factory=AIFeatureFlags)
    triage: TriageFeatureFlags = Field(default_factory=TriageFeatureFlags)
    compliance: ComplianceFeatureFlags | None = Field(default_factory=ComplianceFeatureFlags)


class ProviderConfig(BaseModel):
    enabled: bool = True
    chat_model: str = ""
    embedding_model: str = ""


class FeatureFlagsDocument(BaseModel):
    version: int = 1
    hot_reload: bool = True
    features: FeatureBlock = Field(default_factory=FeatureBlock)
    providers: dict[str, ProviderConfig] = Field(default_factory=dict)


def _default_flags_path() -> Path:
    settings = get_settings()
    if settings.feature_flags_path:
        return Path(settings.feature_flags_path)
    return Path(__file__).resolve().parents[2] / "feature-flags.json"


def _normalize_provider(raw: str) -> ProviderId:
    value = raw.strip().lower()
    if value not in _VALID_PROVIDERS:
        raise ValueError(
            f"Unknown AI provider {raw!r}. Expected one of: {', '.join(sorted(_VALID_PROVIDERS))}"
        )
    return value  # type: ignore[return-value]


class FeatureFlagsStore:
    """Thread-safe, mtime-based hot reload for feature-flags.json."""

    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._path: Path | None = None
        self._mtime_ns: int | None = None
        self._document: FeatureFlagsDocument | None = None

    def _resolve_path(self) -> Path:
        if self._path is None:
            self._path = _default_flags_path()
        return self._path

    def _load_from_disk(self, path: Path) -> FeatureFlagsDocument:
        if not path.exists():
            return FeatureFlagsDocument()
        raw: dict[str, Any] = json.loads(path.read_text(encoding="utf-8"))
        return FeatureFlagsDocument.model_validate(raw)

    def get(self, *, force_reload: bool = False) -> FeatureFlagsDocument:
        path = self._resolve_path()
        with self._lock:
            try:
                mtime_ns = path.stat().st_mtime_ns
            except FileNotFoundError:
                mtime_ns = None

            should_reload = (
                force_reload
                or self._document is None
                or self._mtime_ns != mtime_ns
            )
            if should_reload:
                self._document = self._load_from_disk(path)
                self._mtime_ns = mtime_ns
            return self._document

    def chat_provider(self) -> ProviderId:
        doc = self.get()
        return _normalize_provider(doc.features.ai.chat_provider)

    def embedding_provider(self) -> ProviderId:
        doc = self.get()
        return _normalize_provider(doc.features.ai.embedding_provider)

    def provider_config(self, provider_id: ProviderId) -> ProviderConfig:
        doc = self.get()
        return doc.providers.get(provider_id, ProviderConfig())

    def is_provider_enabled(self, provider_id: ProviderId) -> bool:
        return self.provider_config(provider_id).enabled

    def reload(self) -> FeatureFlagsDocument:
        return self.get(force_reload=True)


_store = FeatureFlagsStore()


def get_feature_flags(*, force_reload: bool = False) -> FeatureFlagsDocument:
    return _store.get(force_reload=force_reload)


def get_chat_provider() -> ProviderId:
    return _store.chat_provider()


def get_embedding_provider() -> ProviderId:
    return _store.embedding_provider()


def reload_feature_flags() -> FeatureFlagsDocument:
    return _store.reload()
