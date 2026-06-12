"""Map service-layer domain exceptions to HTTP responses.

Routers raise domain errors from services; handlers here convert them once
for the whole application so route modules stay thin and consistent.
"""

from __future__ import annotations

from typing import cast

import httpx
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from starlette.responses import Response
from starlette.types import ExceptionHandler

from app.services.ingestion_service import (
    DocumentAlreadyIngestedError,
    EmptyFileError,
    FileTooLargeError,
    IngestionJobNotFoundError,
    InvalidCategoryError,
    UnsupportedFileTypeError,
)
from app.services.scheduling_service import (
    AppointmentNotFoundError,
    SlotLockError,
    SlotUnavailableError,
)
from app.services.compliance import BAARequiredError
from app.services.triage_service import RateLimitExceededError, SessionNotFoundError


def _json_error(status_code: int, detail: str | dict) -> JSONResponse:
    return JSONResponse(status_code=status_code, content={"detail": detail})


async def _session_not_found(_request: Request, _exc: SessionNotFoundError) -> JSONResponse:
    return _json_error(status.HTTP_404_NOT_FOUND, "Session not found")


async def _rate_limit_exceeded(_request: Request, _exc: RateLimitExceededError) -> JSONResponse:
    return _json_error(
        status.HTTP_429_TOO_MANY_REQUESTS,
        "Rate limit exceeded: max 3 AI requests per minute",
    )


def _slowapi_rate_limit_exceeded(request: Request, exc: RateLimitExceeded) -> Response:
    """HTTP middleware rate limits (slowapi) — separate from triage RateLimitExceededError."""
    return _rate_limit_exceeded_handler(request, exc)


async def _slot_lock(_request: Request, _exc: SlotLockError) -> JSONResponse:
    return _json_error(
        status.HTTP_409_CONFLICT,
        "This time slot is currently being booked. Please select another.",
    )


async def _slot_unavailable(_request: Request, _exc: SlotUnavailableError) -> JSONResponse:
    return _json_error(status.HTTP_409_CONFLICT, "Slot no longer available.")


async def _appointment_not_found(_request: Request, _exc: AppointmentNotFoundError) -> JSONResponse:
    return _json_error(status.HTTP_404_NOT_FOUND, "Appointment not found")


async def _invalid_category(_request: Request, _exc: InvalidCategoryError) -> JSONResponse:
    return _json_error(status.HTTP_400_BAD_REQUEST, "Invalid category")


async def _unsupported_file(_request: Request, _exc: UnsupportedFileTypeError) -> JSONResponse:
    return _json_error(status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, "Only PDF and DOCX files are accepted")


async def _file_too_large(_request: Request, exc: FileTooLargeError) -> JSONResponse:
    return _json_error(status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, str(exc))


async def _empty_file(_request: Request, _exc: EmptyFileError) -> JSONResponse:
    return _json_error(status.HTTP_400_BAD_REQUEST, "Empty file")


async def _duplicate_document(_request: Request, exc: DocumentAlreadyIngestedError) -> JSONResponse:
    return _json_error(
        status.HTTP_409_CONFLICT,
        {"message": "Document already ingested", "document_id": exc.document_id},
    )


async def _ingestion_job_not_found(_request: Request, _exc: IngestionJobNotFoundError) -> JSONResponse:
    return _json_error(status.HTTP_404_NOT_FOUND, "Job not found")


async def _baa_required(_request: Request, exc: BAARequiredError) -> JSONResponse:
    return _json_error(
        status.HTTP_403_FORBIDDEN,
        {"message": str(exc), "code": "baa_required"},
    )


async def _upstream_unavailable(_request: Request, _exc: Exception) -> JSONResponse:
    return _json_error(
        status.HTTP_503_SERVICE_UNAVAILABLE,
        "Upstream service temporarily unavailable. Please retry.",
    )


async def _supabase_runtime_error(_request: Request, _exc: RuntimeError) -> JSONResponse:
    return _json_error(
        status.HTTP_503_SERVICE_UNAVAILABLE,
        "Database temporarily unavailable. Please retry.",
    )


def _register(app: FastAPI, exc_type: type[Exception], handler: object) -> None:
    """Register a typed handler (Pyright-safe cast for FastAPI's ExceptionHandler union)."""
    app.add_exception_handler(exc_type, cast(ExceptionHandler, handler))


def register_exception_handlers(app: FastAPI) -> None:
    for exc_type, handler in (
        (RateLimitExceeded, _slowapi_rate_limit_exceeded),
        (SessionNotFoundError, _session_not_found),
        (RateLimitExceededError, _rate_limit_exceeded),
        (SlotLockError, _slot_lock),
        (SlotUnavailableError, _slot_unavailable),
        (AppointmentNotFoundError, _appointment_not_found),
        (InvalidCategoryError, _invalid_category),
        (UnsupportedFileTypeError, _unsupported_file),
        (FileTooLargeError, _file_too_large),
        (EmptyFileError, _empty_file),
        (DocumentAlreadyIngestedError, _duplicate_document),
        (IngestionJobNotFoundError, _ingestion_job_not_found),
        (BAARequiredError, _baa_required),
        (httpx.RemoteProtocolError, _upstream_unavailable),
        (httpx.ReadError, _upstream_unavailable),
        (httpx.ConnectError, _upstream_unavailable),
        (RuntimeError, _supabase_runtime_error),
    ):
        _register(app, exc_type, handler)
