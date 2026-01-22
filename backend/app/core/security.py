"""Authentication and Clerk JWT verification utilities."""
from __future__ import annotations

import time
from typing import Any

import httpx
from fastapi import Depends, HTTPException, Request, status
from jose import jwt
from sqlalchemy.orm import Session

from app.api.deps import get_session
from app.core.config import get_settings
from app.models.user import User
from app.services.user_service import get_user_by_clerk_id

_JWKS_CACHE: dict[str, Any] | None = None
_JWKS_CACHE_TIME: float | None = None
_JWKS_TTL_SECONDS = 3600


def _get_bearer_token(request: Request) -> str:
    """Extract Bearer token from Authorization header."""
    auth_header = request.headers.get("authorization")
    if not auth_header:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing authorization header")
    scheme, _, token = auth_header.partition(" ")
    if scheme.lower() != "bearer" or not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authorization header")
    return token


def _get_bearer_token_flexible(request: Request) -> str:
    """Extract Bearer token from Authorization header OR query parameter.
    
    This is necessary for Server-Sent Events (EventSource) which doesn't support
    custom headers. For security:
    - Query param tokens should be short-lived
    - Only use this for SSE endpoints
    - Regular endpoints should use header-only authentication
    """
    # Try header first (preferred)
    auth_header = request.headers.get("authorization")
    if auth_header:
        scheme, _, token = auth_header.partition(" ")
        if scheme.lower() == "bearer" and token:
            return token
    
    # Fallback to query parameter for EventSource compatibility
    token = request.query_params.get("token")
    if token:
        return token
    
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED, 
        detail="Missing authentication token. Provide via Authorization header or 'token' query parameter."
    )


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
    """Validate JWT token from Authorization header and return claims."""
    token = _get_bearer_token(request)
    jwks = await _get_jwks()
    settings = get_settings()

    try:
        header = jwt.get_unverified_header(token)
        kid = header.get("kid")
        if not kid:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing key ID in token")

        key = next((k for k in jwks.get("keys", []) if k["kid"] == kid), None)
        if not key:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid key ID")

        # Decode with optional audience verification
        decode_options = {"verify_aud": False} if not settings.clerk_frontend_api else {}
        claims = jwt.decode(
            token, 
            key, 
            algorithms=["RS256"], 
            audience=settings.clerk_frontend_api,
            options=decode_options
        )
        return claims
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=f"Token validation failed: {str(e)}")


async def get_token_claims_flexible(request: Request) -> dict[str, Any]:
    """Validate JWT token from Authorization header OR query parameter.
    
    Use this ONLY for Server-Sent Events endpoints that can't send custom headers.
    Regular endpoints should use get_token_claims() which only accepts header tokens.
    """
    token = _get_bearer_token_flexible(request)
    jwks = await _get_jwks()
    settings = get_settings()
    
    try:
        header = jwt.get_unverified_header(token)
        kid = header.get("kid")
        if not kid:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing key ID in token")

        key = next((k for k in jwks.get("keys", []) if k["kid"] == kid), None)
        if not key:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid key ID")

        # Decode with optional audience verification
        decode_options = {"verify_aud": False} if not settings.clerk_frontend_api else {}
        claims = jwt.decode(
            token, 
            key, 
            algorithms=["RS256"], 
            audience=settings.clerk_frontend_api,
            options=decode_options
        )
        return claims
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=f"Token validation failed: {str(e)}")


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
    """Get current authenticated user from JWT token in Authorization header."""
    clerk_user_id = claims.get("sub")
    if not clerk_user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing subject in token")
    user = get_user_by_clerk_id(session, clerk_user_id=clerk_user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not synced")
    return user


async def get_current_user_flexible(
    session: Session = Depends(get_session),
    claims: dict[str, Any] = Depends(get_token_claims_flexible),
) -> User:
    """Get current authenticated user from JWT token in header OR query parameter.
    
    Use this ONLY for Server-Sent Events endpoints that cannot send custom headers.
    """
    clerk_user_id = claims.get("sub")
    if not clerk_user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing subject in token")
    user = get_user_by_clerk_id(session, clerk_user_id=clerk_user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not synced")
    return user
