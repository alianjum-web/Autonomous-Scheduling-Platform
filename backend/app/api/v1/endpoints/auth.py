"""Public auth email routes — Redis-gated before Supabase."""

from fastapi import APIRouter, HTTPException, Request, status

from app.schemas.auth_email import (
    AuthEmailRateLimited,
    AuthEmailSuccess,
    ForgotPasswordRequest,
    ResendVerificationRequest,
    SignUpEmailRequest,
)
from app.services import auth_email_service

router = APIRouter(prefix="/auth", tags=["auth"])


def _client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    if request.client:
        return request.client.host
    return "unknown"


def _rate_limited(detail: str, retry_after_seconds: int) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
        detail=AuthEmailRateLimited(
            detail=detail,
            retry_after_seconds=retry_after_seconds,
        ).model_dump(),
        headers={"Retry-After": str(retry_after_seconds)},
    )


@router.post("/sign-up", response_model=AuthEmailSuccess)
async def sign_up(body: SignUpEmailRequest, request: Request) -> AuthEmailSuccess:
    ok, message, retry_after = await auth_email_service.sign_up_with_email(
        email=body.email,
        password=body.password,
        full_name=body.full_name,
        email_redirect_to=body.email_redirect_to,
        ip=_client_ip(request),
    )
    if not ok and retry_after > 0:
        raise _rate_limited(message, retry_after)
    if not ok:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=message)
    return AuthEmailSuccess(message=message)


@router.post("/resend-verification", response_model=AuthEmailSuccess)
async def resend_verification(body: ResendVerificationRequest, request: Request) -> AuthEmailSuccess:
    ok, message, retry_after = await auth_email_service.resend_verification_email(
        email=body.email,
        email_redirect_to=body.email_redirect_to,
        ip=_client_ip(request),
    )
    if not ok and retry_after > 0:
        raise _rate_limited(message, retry_after)
    if not ok:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=message)
    return AuthEmailSuccess(message=message)


@router.post("/forgot-password", response_model=AuthEmailSuccess)
async def forgot_password(body: ForgotPasswordRequest, request: Request) -> AuthEmailSuccess:
    ok, message, retry_after = await auth_email_service.send_password_reset_email(
        email=body.email,
        redirect_to=body.redirect_to,
        ip=_client_ip(request),
    )
    if not ok and retry_after > 0:
        raise _rate_limited(message, retry_after)
    if not ok:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=message)
    return AuthEmailSuccess(message=message)
