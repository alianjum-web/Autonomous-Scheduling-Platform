from pydantic import BaseModel, Field


class HealthChecks(BaseModel):
    database: bool
    redis: bool
    openai: bool
    openai_latency_ms: float | None = None


class HealthResponse(BaseModel):
    status: str = Field(description="healthy | degraded")
    checks: HealthChecks
