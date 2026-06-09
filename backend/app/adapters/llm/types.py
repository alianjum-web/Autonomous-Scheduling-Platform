from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol


@dataclass(frozen=True)
class ProviderProbeResult:
    provider: str
    configured: bool
    enabled: bool
    active_for_chat: bool
    active_for_embedding: bool
    ok: bool
    latency_ms: float | None = None
    model: str | None = None
    error: str | None = None


class ChatMessageDict(Protocol):
    role: str
    content: str


ChatMessages = list[dict[str, str]]
