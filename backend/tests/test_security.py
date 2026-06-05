def test_missing_token_returns_403(client):
    response = client.post("/v1/triage/session", json={})
    assert response.status_code == 403
    assert response.headers.get("www-authenticate") == 'Bearer error="invalid_token"'


def test_invalid_token_returns_403(client, make_token):
    response = client.post(
        "/v1/triage/session",
        json={},
        headers={"Authorization": f"Bearer {make_token(invalid=True)}"},
    )
    assert response.status_code == 403
    assert response.headers.get("www-authenticate") == 'Bearer error="invalid_token"'


def test_empty_tenant_id_returns_403(client, make_token):
    response = client.post(
        "/v1/triage/session",
        json={},
        headers={"Authorization": f"Bearer {make_token(tenant=None)}"},
    )
    assert response.status_code == 403
    assert response.headers.get("www-authenticate") == 'Bearer error="invalid_token"'
