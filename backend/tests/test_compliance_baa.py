from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.services.compliance import BAARequiredError, baa_enforcement_enabled, require_tenant_baa


@pytest.mark.asyncio
async def test_require_tenant_baa_skipped_when_disabled(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setattr("app.services.compliance.baa_enforcement_enabled", lambda: False)
    await require_tenant_baa("tenant-1")


@pytest.mark.asyncio
async def test_require_tenant_baa_raises_when_unsigned(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setattr("app.services.compliance.baa_enforcement_enabled", lambda: True)
    with patch(
        "app.services.compliance.tenant_has_baa",
        new=AsyncMock(return_value=False),
    ):
        with pytest.raises(BAARequiredError):
            await require_tenant_baa("tenant-1")


def test_production_enforces_baa_even_when_feature_flag_off(monkeypatch: pytest.MonkeyPatch):
    mock_settings = MagicMock()
    mock_settings.baa_enforcement = True
    mock_settings.environment = "production"

    mock_flags = MagicMock()
    mock_flags.features.compliance.baa_enforcement = False

    with patch("app.services.compliance.get_settings", return_value=mock_settings):
        with patch("app.services.compliance.get_feature_flags", return_value=mock_flags):
            assert baa_enforcement_enabled() is True


def test_dev_respects_feature_flag_off(monkeypatch: pytest.MonkeyPatch):
    mock_settings = MagicMock()
    mock_settings.baa_enforcement = True
    mock_settings.environment = "development"

    mock_flags = MagicMock()
    mock_flags.features.compliance.baa_enforcement = False

    with patch("app.services.compliance.get_settings", return_value=mock_settings):
        with patch("app.services.compliance.get_feature_flags", return_value=mock_flags):
            assert baa_enforcement_enabled() is False


def test_baa_status_endpoint(client, make_token):
    with (
        patch("app.services.compliance.baa_enforcement_enabled", return_value=True),
        patch("app.services.compliance.tenant_has_baa", new=AsyncMock(return_value=True)),
        patch(
            "app.services.compliance.supabase_client.get_tenant",
            new=AsyncMock(
                return_value={
                    "id": "t1",
                    "hipaa_baa_signed_at": "2026-01-01T00:00:00+00:00",
                }
            ),
        ),
        patch(
            "app.services.compliance.get_settings",
            return_value=MagicMock(environment="production", baa_enforcement=True),
        ),
    ):
        response = client.get(
            "/v1/compliance/baa/status",
            headers={"Authorization": f"Bearer {make_token(clinic_role='admin')}"},
        )
    assert response.status_code == 200
    data = response.json()
    assert data["baa_signed"] is True
    assert data["enforcement_enabled"] is True
    assert data["ai_features_available"] is True
