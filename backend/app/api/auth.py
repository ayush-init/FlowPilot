from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.config import settings
from backend.app.db.session import get_db
from backend.app.models.user import User
from backend.app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["Authentication"])


class EmailLoginRequest(BaseModel):
    email: str
    name: Optional[str] = None


async def get_current_user_optional(
    request: Request,
    db: AsyncSession = Depends(get_db)
) -> Optional[User]:
    """
    Extracts session token from HttpOnly cookie or Authorization Bearer header.
    Returns User if valid session exists, None otherwise.
    """
    token = request.cookies.get(settings.SESSION_COOKIE_NAME)
    if not token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ", 1)[1]

    if not token:
        return None

    payload = AuthService.verify_session_token(token)
    if not payload or "sub" not in payload:
        return None

    user = await AuthService.get_user_by_id(db, payload["sub"])
    return user


async def require_current_user(
    user: Optional[User] = Depends(get_current_user_optional)
) -> User:
    """Dependency that enforces active authentication."""
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please sign in to FlowPilot."
        )
    return user


@router.post("/login")
async def email_login(
    payload: EmailLoginRequest,
    response: Response,
    db: AsyncSession = Depends(get_db)
):
    """
    Lightweight email-based session login for interview POC.
    Finds or creates the user and sets a secure signed session cookie.
    """
    try:
        user = await AuthService.find_or_create_email_user(
            db=db,
            email=payload.email,
            name=payload.name
        )
        token = AuthService.create_session_token(user)

        # Set HttpOnly session cookie
        is_prod = settings.ENV == "production"
        response.set_cookie(
            key=settings.SESSION_COOKIE_NAME,
            value=token,
            max_age=settings.SESSION_MAX_AGE_SECONDS,
            httponly=True,
            samesite="none" if is_prod else "lax",
            secure=is_prod,
            path="/"
        )

        return {
            "status": "authenticated",
            "token": token,
            "user": user.to_dict()
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Login failed: {str(e)}"
        )


@router.get("/google/url")
async def get_google_auth_url():
    """Returns Google OAuth 2.0 authorization URL or config status."""
    url = AuthService.get_google_auth_url()
    return {
        "configured": bool(settings.GOOGLE_CLIENT_ID and settings.GOOGLE_CLIENT_SECRET),
        "url": url,
    }


@router.get("/google/callback")
async def google_oauth_callback(
    code: Optional[str] = None,
    error: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """
    Handles Google OAuth redirect callback, exchanges auth code for profile,
    and sets signed session cookie before redirecting to dashboard.
    """
    if error or not code:
        return RedirectResponse(
            url=f"{settings.FRONTEND_URL}/?auth_error={error or 'cancelled'}",
            status_code=status.HTTP_302_FOUND
        )

    try:
        user = await AuthService.exchange_google_code(db, code)
        token = AuthService.create_session_token(user)

        is_prod = settings.ENV == "production"
        redirect_res = RedirectResponse(
            url=f"{settings.FRONTEND_URL}/?auth_success=1&token={token}",
            status_code=status.HTTP_302_FOUND
        )
        redirect_res.set_cookie(
            key=settings.SESSION_COOKIE_NAME,
            value=token,
            max_age=settings.SESSION_MAX_AGE_SECONDS,
            httponly=True,
            samesite="none" if is_prod else "lax",
            secure=is_prod,
            path="/"
        )
        return redirect_res
    except Exception as e:
        return RedirectResponse(
            url=f"{settings.FRONTEND_URL}/?auth_error={str(e)}",
            status_code=status.HTTP_302_FOUND
        )


@router.get("/me")
async def get_current_user_profile(
    user: Optional[User] = Depends(get_current_user_optional)
):
    """
    Lightweight current-user endpoint returning user profile and session status.
    """
    if not user:
        return {
            "authenticated": False,
            "user": None
        }

    return {
        "authenticated": True,
        "user": user.to_dict()
    }


@router.post("/logout")
async def logout(response: Response):
    """
    Clears the application session cookie and terminates active session.
    """
    response.delete_cookie(
        key=settings.SESSION_COOKIE_NAME,
        path="/"
    )
    return {"status": "logged_out"}
