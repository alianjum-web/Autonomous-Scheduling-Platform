from pathlib import Path
from unittest.mock import MagicMock, patch

from app.adapters.openai_client import phi_safe_chat_kwargs
from app.core.config import Settings


def test_phi_safe_chat_kwargs_includes_store_false():
    mock = MagicMock()
    mock.openai_zero_data_retention = True
    with patch("app.adapters.openai_client.get_settings", return_value=mock):
        assert phi_safe_chat_kwargs() == {"store": False}


def test_phi_safe_chat_kwargs_disabled_when_flag_off():
    mock = MagicMock()
    mock.openai_zero_data_retention = False
    with patch("app.adapters.openai_client.get_settings", return_value=mock):
        assert phi_safe_chat_kwargs() == {}


def test_settings_default_zero_data_retention_enabled():
    settings = Settings(
        supabase_url="https://test.supabase.co",
        supabase_service_role_key="key",
        supabase_jwt_secret="secret",
    )
    assert settings.openai_zero_data_retention is True


def test_compliance_scripts_exist():
    root = Path(__file__).resolve().parents[2]
    scripts = root / "scripts/compliance"
    assert (scripts / "scan-logs-for-phi.sh").exists()
    assert (scripts / "scan-codebase-for-phi-logging.sh").exists()
    assert (scripts / "verify-audit-triggers.sql").exists()
