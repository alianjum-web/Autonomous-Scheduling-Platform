from pydantic import BaseModel, Field


class BAAStatusResponse(BaseModel):
    tenant_id: str
    baa_signed: bool
    signed_at: str | None = None
    enforcement_enabled: bool = Field(
        description="When true, unsigned tenants cannot use AI triage or document embedding.",
    )
    environment: str
    ai_features_available: bool = Field(
        description="True when BAA is signed or enforcement is disabled for this environment.",
    )


class BAAAcknowledgeResponse(BAAStatusResponse):
    message: str = "HIPAA BAA acknowledged — AI features enabled for this clinic."
