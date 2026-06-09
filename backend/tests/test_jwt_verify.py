from datetime import datetime, timedelta, timezone
from unittest.mock import patch

from jose import jwt

from app.core.config import Settings
from app.core.jwt_verify import decode_supabase_jwt, jwks_url


def _settings() -> Settings:
    return Settings(
        supabase_url="https://test.supabase.co",
        supabase_service_role_key="test-key",
        supabase_jwt_secret="test-jwt-secret-for-unit-tests-only",
    )


def test_jwks_url_derived_from_supabase_url():
    assert jwks_url(_settings()) == "https://test.supabase.co/auth/v1/.well-known/jwks.json"


def test_decode_hs256_legacy_token():
    settings = _settings()
    token = jwt.encode(
        {"sub": "user-1", "exp": datetime.now(timezone.utc) + timedelta(hours=1)},
        settings.supabase_jwt_secret,
        algorithm="HS256",
    )
    payload = decode_supabase_jwt(token, settings)
    assert payload["sub"] == "user-1"


def test_decode_jwks_es256_token():
    settings = _settings()
    jwks = {
        "keys": [
            {
                "kty": "EC",
                "kid": "test-kid",
                "alg": "ES256",
                "crv": "P-256",
                "x": "MKBCTNI6KZRKW4fhlEo0w41IncLqv24TDBkM_sW_Zg",
                "y": "4Etl6SRW2YiLUrN5vfvVHuhp7x8PxltmWWlbbMfgIFM",
            }
        ]
    }

    # python-jose cannot sign ES256 without a real private key; mock JWKS path with HS256
    # mislabeled header to ensure routing — instead mock _decode_jwks return.
    token = jwt.encode(
        {"sub": "jwks-user"},
        settings.supabase_jwt_secret,
        algorithm="HS256",
        headers={"kid": "test-kid", "alg": "ES256"},
    )

    with patch("app.core.jwt_verify._fetch_jwks", return_value=jwks):
        with patch("app.core.jwt_verify.jwk.construct") as mock_construct:
            mock_construct.return_value = settings.supabase_jwt_secret
            with patch("app.core.jwt_verify.jwt.decode") as mock_decode:
                mock_decode.return_value = {"sub": "jwks-user"}
                payload = decode_supabase_jwt(token, settings)
    assert payload["sub"] == "jwks-user"


def test_fetch_jwks_uses_cache():
    settings = _settings()

    class FakeResponse:
        def raise_for_status(self):
            return None

        def json(self):
            return {"keys": []}

    with patch("app.core.jwt_verify.httpx.get", return_value=FakeResponse()) as mock_get:
        from app.core import jwt_verify

        jwt_verify._JWKS_CACHE.clear()
        jwt_verify._fetch_jwks(settings)
        jwt_verify._fetch_jwks(settings)
        assert mock_get.call_count == 1
