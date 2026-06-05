from unittest.mock import AsyncMock, patch

import pytest


def _admin_headers(make_token):
    return {"Authorization": f"Bearer {make_token(clinic_role='admin')}"}


def test_reject_non_pdf_docx(client, make_token):
    response = client.post(
        "/v1/ingest/document",
        data={"category": "faq"},
        files={"file": ("notes.txt", b"hello", "text/plain")},
        headers=_admin_headers(make_token),
    )
    assert response.status_code == 415


def test_reject_oversized_file(client, make_token):
    big = b"x" * (50 * 1024 * 1024 + 1)
    response = client.post(
        "/v1/ingest/document",
        data={"category": "faq"},
        files={"file": ("big.pdf", big, "application/pdf")},
        headers=_admin_headers(make_token),
    )
    assert response.status_code == 413


def test_non_admin_returns_403(client, make_token):
    response = client.post(
        "/v1/ingest/document",
        data={"category": "faq"},
        files={"file": ("doc.pdf", b"%PDF-1.4", "application/pdf")},
        headers={"Authorization": f"Bearer {make_token(clinic_role='patient')}"},
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_duplicate_returns_409(client, make_token, tenant_id):
    existing = {"id": "doc-1", "source_filename": "policy.pdf"}

    with patch(
        "app.api.v1.endpoints.ingest.supabase_client.find_document_by_hash",
        AsyncMock(return_value=existing),
    ):
        response = client.post(
            "/v1/ingest/document",
            data={"category": "insurance"},
            files={"file": ("policy.pdf", b"%PDF-1.4 fake", "application/pdf")},
            headers=_admin_headers(make_token),
        )

    assert response.status_code == 409
