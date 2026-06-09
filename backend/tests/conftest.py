import os
from datetime import datetime, timedelta, timezone

import pytest
from fastapi.testclient import TestClient
from jose import jwt

_CI_DEFAULTS = {
    "SUPABASE_URL": "https://test.supabase.co",
    "SUPABASE_ANON_KEY": "test-anon-key",
    "SUPABASE_SERVICE_ROLE_KEY": "test-service-key",
    "SUPABASE_JWT_SECRET": "test-jwt-secret-for-unit-tests-only",
    "FRONTEND_ORIGIN": "http://localhost:3000",
    "REDIS_URL": "redis://localhost:6379/0",
}

for _key, _value in _CI_DEFAULTS.items():
    if not os.environ.get(_key):
        os.environ[_key] = _value

from app.main import create_app  # noqa: E402


@pytest.fixture
def jwt_secret() -> str:
    return os.environ["SUPABASE_JWT_SECRET"]


@pytest.fixture
def tenant_id() -> str:
    return "11111111-1111-1111-1111-111111111111"


@pytest.fixture
def make_token(jwt_secret: str, tenant_id: str):
    def _make(
        *,
        tenant: str | None = tenant_id,
        clinic_role: str | None = None,
        expired: bool = False,
        invalid: bool = False,
    ) -> str:
        if invalid:
            return "not-a-valid-jwt"
        exp = datetime.now(timezone.utc) + (timedelta(hours=-1) if expired else timedelta(hours=1))
        payload: dict = {"sub": "user-123", "exp": exp}
        if tenant:
            payload["tenant_id"] = tenant
        if clinic_role:
            payload["clinic_role"] = clinic_role
        return jwt.encode(payload, jwt_secret, algorithm="HS256")

    return _make


@pytest.fixture
def client():
    return TestClient(create_app())
