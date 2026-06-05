from fastapi import APIRouter

from app.api.v1.endpoints import ingest, schedule, triage

api_router = APIRouter()
api_router.include_router(triage.router)
api_router.include_router(ingest.router)
api_router.include_router(schedule.router)
