from unittest.mock import AsyncMock, patch

from app.adapters.llm.types import ProviderProbeResult


def test_ai_status_endpoint(client):
    mock_probe = ProviderProbeResult(
        provider="ollama",
        configured=True,
        enabled=True,
        active_for_chat=True,
        active_for_embedding=True,
        ok=True,
        latency_ms=12.3,
        model="llama3.2",
    )
    with patch(
        "app.api.v1.endpoints.ai.probe_all_providers",
        new=AsyncMock(return_value=[mock_probe]),
    ):
        response = client.get("/v1/ai/status")
    assert response.status_code == 200
    data = response.json()
    assert data["chat_provider"] == "ollama"
    assert len(data["providers"]) == 1
    assert data["providers"][0]["provider"] == "ollama"
    assert data["providers"][0]["ok"] is True


def test_health_includes_ai_checks(client):
    with patch("app.api.health.is_chat_available", return_value=False):
        response = client.get("/health")
    assert response.status_code == 200
    checks = response.json()["checks"]
    assert "ai" in checks
    assert checks["ai"] is False
