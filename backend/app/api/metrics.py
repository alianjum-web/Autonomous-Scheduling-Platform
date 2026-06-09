from fastapi import APIRouter, Response
from prometheus_client import CONTENT_TYPE_LATEST, Counter, Histogram, generate_latest

router = APIRouter(tags=["metrics"])

REQUEST_COUNT = Counter("http_requests_total", "Total HTTP requests", ["method", "endpoint", "status"])
REQUEST_LATENCY = Histogram("http_request_duration_seconds", "HTTP request latency", ["endpoint"])
TRIAGE_SESSIONS = Counter("triage_sessions_total", "Triage sessions created")
BOOKINGS = Counter("appointments_booked_total", "Appointments booked")
ESCALATIONS = Counter("escalations_total", "Patient escalations")
AUTH_EMAIL_SENT = Counter("auth_email_sent_total", "Auth emails proxied to Supabase", ["action"])
AUTH_EMAIL_FAILED = Counter("auth_email_failed_total", "Auth email proxy failures", ["action"])
AUTH_EMAIL_RATE_LIMITED = Counter(
    "auth_email_rate_limited_total",
    "Auth email requests blocked before Supabase",
    ["action", "reason"],
)


@router.get("/metrics")
async def metrics():
    return Response(content=generate_latest(), media_type=str(CONTENT_TYPE_LATEST))
