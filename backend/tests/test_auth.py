import pytest
from httpx import AsyncClient, ASGITransport
from backend.main import app


@pytest.mark.asyncio
async def test_auth_lifecycle():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Initially unauthenticated
        res = await client.get("/api/auth/me")
        assert res.status_code == 200
        data = res.json()
        assert data["authenticated"] is False
        assert data["user"] is None

        # 2. Login with email
        login_res = await client.post(
            "/api/auth/login",
            json={"email": "ayush@flowpilot.ai", "name": "Ayush Sharma"}
        )
        assert login_res.status_code == 200
        login_data = login_res.json()
        assert login_data["status"] == "authenticated"
        assert login_data["user"]["email"] == "ayush@flowpilot.ai"
        assert login_data["user"]["name"] == "Ayush Sharma"
        assert "flowpilot_session" in login_res.cookies

        # 3. Check current user profile with session cookie
        me_res = await client.get("/api/auth/me", cookies=login_res.cookies)
        assert me_res.status_code == 200
        me_data = me_res.json()
        assert me_data["authenticated"] is True
        assert me_data["user"]["email"] == "ayush@flowpilot.ai"

        # 4. Check Google OAuth URL endpoint
        google_res = await client.get("/api/auth/google/url")
        assert google_res.status_code == 200
        assert "configured" in google_res.json()

        # 5. Logout
        logout_res = await client.post("/api/auth/logout", cookies=login_res.cookies)
        assert logout_res.status_code == 200
        assert logout_res.json()["status"] == "logged_out"
