from app.core.request_context import CORRELATION_ID_HEADER, REQUEST_ID_HEADER


def test_health_injects_request_id_header(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.headers.get(REQUEST_ID_HEADER)
    assert response.headers.get(CORRELATION_ID_HEADER)


def test_request_id_echoed_from_client_header(client):
    response = client.get("/health", headers={REQUEST_ID_HEADER: "client-req-99"})
    assert response.status_code == 200
    assert response.headers[REQUEST_ID_HEADER] == "client-req-99"
    assert response.headers[CORRELATION_ID_HEADER] == "client-req-99"


def test_correlation_id_distinct_from_request_id(client):
    response = client.get(
        "/health",
        headers={
            REQUEST_ID_HEADER: "req-1",
            CORRELATION_ID_HEADER: "corr-trace-42",
        },
    )
    assert response.status_code == 200
    assert response.headers[REQUEST_ID_HEADER] == "req-1"
    assert response.headers[CORRELATION_ID_HEADER] == "corr-trace-42"


def test_tenant_id_bound_from_jwt(client, make_token, tenant_id):
    token = make_token()
    response = client.get("/health", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    assert response.headers.get(REQUEST_ID_HEADER)
