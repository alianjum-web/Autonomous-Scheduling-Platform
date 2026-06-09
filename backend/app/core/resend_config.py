"""Resend SMTP + API settings — single source of truth for email delivery."""

from __future__ import annotations

from pydantic import BaseModel, Field

from app.core.config import Settings, get_settings

# Supabase custom SMTP uses these Resend relay values (https://resend.com/docs/send-with-supabase-smtp)
DEFAULT_SMTP_HOST = "smtp.resend.com"
DEFAULT_SMTP_PORT = 465
DEFAULT_SMTP_USERNAME = "resend"
DEFAULT_MIN_INTERVAL_SECONDS = 60


class ResendSmtpProfile(BaseModel):
    """Values to paste into Supabase → Authentication → Emails → SMTP Settings."""

    host: str = DEFAULT_SMTP_HOST
    port: int = DEFAULT_SMTP_PORT
    username: str = DEFAULT_SMTP_USERNAME
    password: str = Field(description="Resend API key")
    from_email: str
    from_name: str
    min_interval_seconds: int = DEFAULT_MIN_INTERVAL_SECONDS

    @property
    def configured(self) -> bool:
        return bool(self.password and self.from_email)


class ResendConfig(BaseModel):
    api_key: str = ""
    from_email: str = ""
    from_name: str = "Autonomous Scheduling Platform"
    smtp_host: str = DEFAULT_SMTP_HOST
    smtp_port: int = DEFAULT_SMTP_PORT
    smtp_username: str = DEFAULT_SMTP_USERNAME
    min_interval_seconds: int = DEFAULT_MIN_INTERVAL_SECONDS

    @property
    def configured(self) -> bool:
        return bool(self.api_key and self.from_email)

    def smtp_profile(self) -> ResendSmtpProfile:
        return ResendSmtpProfile(
            host=self.smtp_host,
            port=self.smtp_port,
            username=self.smtp_username,
            password=self.api_key,
            from_email=self.from_email,
            from_name=self.from_name,
            min_interval_seconds=self.min_interval_seconds,
        )


def get_resend_config() -> ResendConfig:
    settings = get_settings()
    return ResendConfig(
        api_key=settings.resend_api_key,
        from_email=settings.resend_from_email,
        from_name=settings.resend_from_name,
        smtp_host=settings.resend_smtp_host,
        smtp_port=settings.resend_smtp_port,
        smtp_username=settings.resend_smtp_username,
        min_interval_seconds=settings.resend_min_interval_seconds,
    )


def resend_config_from_settings(settings: Settings) -> ResendConfig:
    return ResendConfig(
        api_key=settings.resend_api_key,
        from_email=settings.resend_from_email,
        from_name=settings.resend_from_name,
        smtp_host=settings.resend_smtp_host,
        smtp_port=settings.resend_smtp_port,
        smtp_username=settings.resend_smtp_username,
        min_interval_seconds=settings.resend_min_interval_seconds,
    )
