from fastapi import APIRouter

from app.api.v1.endpoints import ai, auth, compliance, ingest, public, schedule, staff, triage

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(ai.router)
api_router.include_router(compliance.router)
api_router.include_router(public.router)
api_router.include_router(staff.router)
api_router.include_router(triage.router)
api_router.include_router(ingest.router)
api_router.include_router(schedule.router)
