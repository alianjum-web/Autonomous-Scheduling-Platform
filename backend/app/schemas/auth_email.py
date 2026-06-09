from pydantic import BaseModel, EmailStr, Field


class SignUpEmailRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    full_name: str = Field(min_length=1, max_length=120)
    email_redirect_to: str


class ResendVerificationRequest(BaseModel):
    email: EmailStr
    email_redirect_to: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr
    redirect_to: str


class AuthEmailSuccess(BaseModel):
    ok: bool = True
    message: str


class AuthEmailRateLimited(BaseModel):
    detail: str
    retry_after_seconds: int
