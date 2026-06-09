from app.core.config import Settings
from app.core.resend_config import ResendConfig, resend_config_from_settings


def test_resend_configured_when_key_and_from_set():
    settings = Settings(
        supabase_url="https://test.supabase.co",
        supabase_anon_key="anon",
        supabase_service_role_key="service",
        supabase_jwt_secret="secret",
        resend_api_key="re_test",
        resend_from_email="noreply@example.com",
    )
    config = resend_config_from_settings(settings)
    assert config.configured is True
    profile = config.smtp_profile()
    assert profile.host == "smtp.resend.com"
    assert profile.port == 465
    assert profile.username == "resend"
    assert profile.password == "re_test"
    assert profile.from_email == "noreply@example.com"


def test_resend_not_configured_without_from_email():
    config = ResendConfig(api_key="re_test", from_email="")
    assert config.configured is False
