"""Authentication and Clerk JWT verification utilities."""
from __future__ import annotations

import time
from typing import Any

import httpx
from fastapi import Depends, HTTPException, Request, status
from jose import jwt
from sqlmodel import Session

from app.api.deps import get_session
from app.core.config import get_settings
from app.models.user import User
from app.services.user_service import get_user_by_clerk_id

_JWKS_CACHE: dict[str, Any] | None = None
_JWKS_CACHE_TIME: float | None = None
_JWKS_TTL_SECONDS = 3600


def _get_bearer_token(request: Request) -> str:
    auth_header = request.headers.get("authorization")
    if not auth_header:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing authorization header")
    scheme, _, token = auth_header.partition(" ")
    if scheme.lower() != "bearer" or not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authorization header")
    return token


async def _get_jwks() -> dict[str, Any]:
    global _JWKS_CACHE, _JWKS_CACHE_TIME
    now = time.time()
    if _JWKS_CACHE and _JWKS_CACHE_TIME and now - _JWKS_CACHE_TIME < _JWKS_TTL_SECONDS:
        return _JWKS_CACHE

    settings = get_settings()
    if not settings.clerk_jwks_url:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Clerk JWKS URL not configured")

    async with httpx.AsyncClient(timeout=10) as client:
        response = await client.get(settings.clerk_jwks_url)
        response.raise_for_status()
        _JWKS_CACHE = response.json()
        _JWKS_CACHE_TIME = now
        return _JWKS_CACHE


async def get_token_claims(request: Request) -> dict[str, Any]:
    token = _get_bearer_token(request)
    jwks = await _get_jwks()
    header = jwt.get_unverified_header(token)
    kid = header.get("kid")
    keys = jwks.get("keys", [])
    key = next((item for item in keys if item.get("kid") == kid), None)
    if not key:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token key")

    try:
        return jwt.decode(
            token,
            key,
            algorithms=["RS256"],
            options={"verify_aud": False},
        )
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token") from exc


def extract_email_from_claims(claims: dict[str, Any]) -> str | None:
    for key in ("email", "email_address", "primary_email_address"):
        value = claims.get(key)
        if isinstance(value, str) and value:
            return value
    return None


async def get_current_user(
    session: Session = Depends(get_session),
    claims: dict[str, Any] = Depends(get_token_claims),
) -> User:
    clerk_user_id = claims.get("sub")
    if not clerk_user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing subject in token")
    user = get_user_by_clerk_id(session, clerk_user_id=clerk_user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not synced")
    return user
