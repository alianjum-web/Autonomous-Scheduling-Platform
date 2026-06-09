from pydantic import BaseModel, Field


class AIProviderStatus(BaseModel):
    provider: str
    configured: bool
    enabled: bool
    active_for_chat: bool
    active_for_embedding: bool
    ok: bool
    latency_ms: float | None = None
    model: str | None = None
    error: str | None = None


class AIStatusResponse(BaseModel):
    chat_provider: str
    embedding_provider: str
    hot_reload: bool
    providers: list[AIProviderStatus]


class HealthChecks(BaseModel):
    database: bool
    redis: bool
    resend: bool = False
    ai: bool
    ai_provider: str | None = None
    ai_latency_ms: float | None = None
    openai: bool = True
    openai_latency_ms: float | None = None


class HealthResponse(BaseModel):
    status: str = Field(description="healthy | degraded")
    checks: HealthChecks
