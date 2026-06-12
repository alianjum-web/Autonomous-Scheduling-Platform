from pydantic import BaseModel, Field


class RecentPatientSummary(BaseModel):
    id: str
    name: str
    phone: str | None = None
    slot_start: str | None = None
    confirmation_code: str | None = None


class OwnerDashboardResponse(BaseModel):
    todays_appointments: int
    upcoming_appointments: int = 0
    pending_requests: int
    active_doctors: int
    triage_sessions_today: int
    triage_sessions_total: int
    recent_patients: list[RecentPatientSummary] = Field(default_factory=list)


class DoctorDashboardResponse(BaseModel):
    appointments_today: int
    pending_reviews: int
    upcoming_patients: list[RecentPatientSummary] = Field(default_factory=list)
    recent_intake_forms: int


class TriageSessionSummary(BaseModel):
    id: str
    status: str
    triage_status: str | None = None
    patient_name: str | None = None
    chief_complaint: str | None = None
    ai_summary: str | None = None
    source: str | None = None
    created_at: str
    intake_complete: bool = False


class TriageSessionListResponse(BaseModel):
    sessions: list[TriageSessionSummary]
