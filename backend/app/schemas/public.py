from pydantic import BaseModel, Field


class PublicClinicResponse(BaseModel):
    slug: str
    name: str
    welcome_message: str | None = None


class PublicIntakeRequest(BaseModel):
    full_name: str = Field(min_length=2, max_length=120)
    phone: str = Field(min_length=7, max_length=32)
    email: str = Field(min_length=5, max_length=254)
    chief_complaint: str = Field(min_length=3, max_length=2000)


class PublicGuestSessionStart(BaseModel):
    """Start AI triage before patient details — intake collected after slot selection."""

    chief_complaint: str | None = Field(default=None, max_length=2000)


class PublicTriageSessionResponse(BaseModel):
    session_id: str
    guest_token: str
    status: str


class BookingPageConfigResponse(BaseModel):
    enabled: bool
    welcome_message: str | None = None
    public_url: str | None = None


class BookingPageConfigRequest(BaseModel):
    enabled: bool
    welcome_message: str | None = None
