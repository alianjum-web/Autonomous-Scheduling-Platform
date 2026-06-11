from pydantic import BaseModel, EmailStr, Field


class StaffInviteCreateRequest(BaseModel):
    email: EmailStr
    role: str = Field(default="doctor", pattern="^(admin|clinic_admin|doctor)$")


class StaffInviteResponse(BaseModel):
    id: str
    email: str
    role: str
    token: str
    expires_at: str
    accepted_at: str | None
    created_at: str


class StaffInviteListResponse(BaseModel):
    invites: list[StaffInviteResponse]


class StaffInviteAcceptRequest(BaseModel):
    token: str


class StaffInviteAcceptResponse(BaseModel):
    tenant_id: str
    message: str


class StaffInvitePreviewResponse(BaseModel):
    clinic_name: str
    email: str
    role: str
    expired: bool


class ProviderResponse(BaseModel):
    id: str
    profile_id: str
    display_name: str
    specialty: str
    is_active: bool
    availability_start: str
    availability_end: str
    slot_duration_minutes: int
    role: str | None = None
    email: str | None = None


class ProviderListResponse(BaseModel):
    providers: list[ProviderResponse]


class ProviderAvailabilityRequest(BaseModel):
    availability_start: str = Field(..., pattern=r"^\d{2}:\d{2}(:\d{2})?$")
    availability_end: str = Field(..., pattern=r"^\d{2}:\d{2}(:\d{2})?$")
    slot_duration_minutes: int = Field(default=30, ge=15, le=120)
    specialty: str | None = Field(default=None, min_length=1, max_length=120)
