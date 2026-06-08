"""Verify Supabase access tokens — JWKS (ECC/RS256) with legacy HS256 fallback."""

from __future__ import annotations

import time

import httpx
from jose import JWTError, jwk, jwt

from app.core.config import Settings

_JWKS_CACHE: dict[str, tuple[float, dict]] = {}
_JWKS_TTL_SECONDS = 600


def jwks_url(settings: Settings) -> str:
    return f"{settings.supabase_url.rstrip('/')}/auth/v1/.well-known/jwks.json"


def _fetch_jwks(settings: Settings) -> dict:
    url = jwks_url(settings)
    now = time.time()
    cached = _JWKS_CACHE.get(url)
    if cached and now - cached[0] < _JWKS_TTL_SECONDS:
        return cached[1]

    response = httpx.get(url, timeout=10.0)
    response.raise_for_status()
    data = response.json()
    _JWKS_CACHE[url] = (now, data)
    return data


def _decode_hs256(token: str, settings: Settings) -> dict:
    return jwt.decode(
        token,
        settings.supabase_jwt_secret,
        algorithms=["HS256"],
        options={"verify_aud": False},
    )


def _decode_jwks(token: str, settings: Settings) -> dict:
    header = jwt.get_unverified_header(token)
    kid = header.get("kid")
    alg = header.get("alg")
    if not kid or not alg:
        raise JWTError("Token missing kid or alg header for JWKS verification")

    keys = _fetch_jwks(settings).get("keys", [])
    jwk_data = next((item for item in keys if item.get("kid") == kid), None)
    if jwk_data is None:
        raise JWTError("No matching JWK for token kid")

    key = jwk.construct(jwk_data)
    return jwt.decode(
        token,
        key,
        algorithms=[alg],
        options={"verify_aud": False},
    )


def decode_supabase_jwt(token: str, settings: Settings) -> dict:
    """Decode a Supabase user access token (HS256 legacy or asymmetric JWKS)."""
    try:
        header = jwt.get_unverified_header(token)
    except JWTError:
        raise

    alg = header.get("alg", "HS256")
    if alg == "HS256":
        return _decode_hs256(token, settings)
    return _decode_jwks(token, settings)
