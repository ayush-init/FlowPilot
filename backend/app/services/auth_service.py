import urllib.parse
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any
import jwt
import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.config import settings
from backend.app.models.user import User


class AuthService:
    @staticmethod
    def create_session_token(user: User) -> str:
        """Creates a signed, expiration-bound JWT session token."""
        now = datetime.now(timezone.utc)
        payload = {
            "sub": user.id,
            "email": user.email,
            "name": user.name,
            "avatar_url": user.avatar_url,
            "auth_provider": user.auth_provider,
            "iat": int(now.timestamp()),
            "exp": int((now + timedelta(seconds=settings.SESSION_MAX_AGE_SECONDS)).timestamp()),
        }
        return jwt.encode(payload, settings.SESSION_SECRET, algorithm="HS256")

    @staticmethod
    def verify_session_token(token: str) -> Optional[Dict[str, Any]]:
        """Verifies and decodes a signed session token."""
        try:
            payload = jwt.decode(
                token,
                settings.SESSION_SECRET,
                algorithms=["HS256"],
                options={"verify_exp": True}
            )
            return payload
        except Exception:
            return None

    @staticmethod
    async def get_user_by_id(db: AsyncSession, user_id: str) -> Optional[User]:
        """Fetch user by primary key ID."""
        result = await db.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()

    @staticmethod
    async def get_user_by_email(db: AsyncSession, email: str) -> Optional[User]:
        """Fetch user by unique email."""
        result = await db.execute(select(User).where(User.email == email.strip().lower()))
        return result.scalar_one_or_none()

    @staticmethod
    async def find_or_create_email_user(
        db: AsyncSession, email: str, name: Optional[str] = None
    ) -> User:
        """Finds existing email user or creates a new one for lightweight POC auth."""
        clean_email = email.strip().lower()
        user = await AuthService.get_user_by_email(db, clean_email)
        if not user:
            user_name = name.strip() if name and name.strip() else clean_email.split("@")[0].replace(".", " ").title()
            user = User(
                email=clean_email,
                name=user_name,
                auth_provider="email",
                avatar_url=None,
            )
            db.add(user)
            await db.commit()
            await db.refresh(user)
        elif name and name.strip() and user.name != name.strip():
            user.name = name.strip()
            await db.commit()
            await db.refresh(user)
        return user

    @staticmethod
    def get_google_auth_url(state: str = "flowpilot_auth") -> Optional[str]:
        """Constructs Google OAuth 2.0 authorization redirect URL."""
        if not settings.GOOGLE_CLIENT_ID:
            return None
        
        params = {
            "client_id": settings.GOOGLE_CLIENT_ID,
            "redirect_uri": settings.GOOGLE_REDIRECT_URI,
            "response_type": "code",
            "scope": "openid email profile",
            "access_type": "online",
            "state": state,
            "prompt": "select_account",
        }
        return f"https://accounts.google.com/o/oauth2/v2/auth?{urllib.parse.urlencode(params)}"

    @staticmethod
    async def exchange_google_code(db: AsyncSession, code: str) -> Optional[User]:
        """Exchanges Google authorization code for user profile and creates/updates user."""
        if not settings.GOOGLE_CLIENT_ID or not settings.GOOGLE_CLIENT_SECRET:
            raise ValueError("Google OAuth credentials are not configured on the server.")

        token_url = "https://oauth2.googleapis.com/token"
        token_data = {
            "code": code,
            "client_id": settings.GOOGLE_CLIENT_ID,
            "client_secret": settings.GOOGLE_CLIENT_SECRET,
            "redirect_uri": settings.GOOGLE_REDIRECT_URI,
            "grant_type": "authorization_code",
        }

        async with httpx.AsyncClient(timeout=10.0) as client:
            token_res = await client.post(token_url, data=token_data)
            if token_res.status_code != 200:
                raise ValueError(f"Failed to exchange Google OAuth code: {token_res.text}")
            
            tokens = token_res.json()
            access_token = tokens.get("access_token")
            if not access_token:
                raise ValueError("No access token returned from Google OAuth.")

            userinfo_res = await client.get(
                "https://www.googleapis.com/oauth2/v2/userinfo",
                headers={"Authorization": f"Bearer {access_token}"}
            )
            if userinfo_res.status_code != 200:
                raise ValueError("Failed to fetch Google user profile information.")

            user_info = userinfo_res.json()
            email = user_info.get("email")
            name = user_info.get("name") or email.split("@")[0]
            picture = user_info.get("picture")

            if not email:
                raise ValueError("No email address provided by Google account.")

            clean_email = email.strip().lower()
            user = await AuthService.get_user_by_email(db, clean_email)
            if not user:
                user = User(
                    email=clean_email,
                    name=name,
                    avatar_url=picture,
                    auth_provider="google",
                )
                db.add(user)
                await db.commit()
                await db.refresh(user)
            else:
                user.name = name
                if picture:
                    user.avatar_url = picture
                user.auth_provider = "google"
                await db.commit()
                await db.refresh(user)

            return user
