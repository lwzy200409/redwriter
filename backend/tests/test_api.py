"""后端 API 测试（含登录认证）"""

import pytest
from httpx import ASGITransport, AsyncClient
from main import app
from database import init_db, engine, Base
from models import User
from auth import hash_password


@pytest.fixture(autouse=True)
async def setup_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest.fixture
async def client():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac


@pytest.fixture
async def auth_client(client):
    """已登录的客户端"""
    # 注册
    await client.post("/api/auth/register", json={
        "email": "test@redwriter.com", "password": "test123456",
    })
    # 登录
    resp = await client.post("/api/auth/login", json={
        "email": "test@redwriter.com", "password": "test123456",
    })
    token = resp.json()["token"]

    # 返回带 Authorization 头的客户端
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
        headers={"Authorization": f"Bearer {token}"},
    ) as ac:
        yield ac


class TestHealth:
    async def test_root(self, client):
        resp = await client.get("/")
        assert resp.status_code == 200
        assert resp.json()["name"] == "RedWriter"

    async def test_health(self, client):
        resp = await client.get("/health")
        assert resp.status_code == 200


class TestAuth:
    async def test_register(self, client):
        resp = await client.post("/api/auth/register", json={
            "email": "new@test.com", "password": "mypassword",
        })
        assert resp.status_code == 200
        data = resp.json()
        assert "token" in data
        assert data["user"]["plan"] == "free"
        assert data["user"]["quota_remaining"] == 3

    async def test_register_duplicate(self, client):
        await client.post("/api/auth/register", json={
            "email": "dup@test.com", "password": "123456",
        })
        resp = await client.post("/api/auth/register", json={
            "email": "dup@test.com", "password": "123456",
        })
        assert resp.status_code == 409

    async def test_login(self, auth_client):
        resp = await auth_client.get("/api/auth/me")
        assert resp.status_code == 200
        assert resp.json()["email"] == "test@redwriter.com"

    async def test_login_wrong_password(self, client):
        await client.post("/api/auth/register", json={
            "email": "wrong@test.com", "password": "correct",
        })
        resp = await client.post("/api/auth/login", json={
            "email": "wrong@test.com", "password": "wrongpassword",
        })
        assert resp.status_code == 401

    async def test_quota(self, auth_client):
        resp = await auth_client.get("/api/auth/quota")
        assert resp.status_code == 200
        assert resp.json()["plan"] == "free"
        assert resp.json()["quota_remaining"] == 3


class TestGenerateWithAuth:
    async def test_generate_requires_login(self, client):
        resp = await client.post("/api/generate", json={
            "product_name": "test", "selling_points": "test",
        })
        assert resp.status_code == 401

    async def test_generate_deducts_quota(self, auth_client):
        # 首次生成
        resp = await auth_client.post("/api/generate", json={
            "product_name": "测试商品", "selling_points": "测试卖点", "style": "grass",
        })
        assert resp.status_code == 200

        # 检查配额已减少
        quota_resp = await auth_client.get("/api/auth/quota")
        assert quota_resp.json()["quota_remaining"] == 2  # 3 - 1 = 2

    async def test_generate_all_deducts_quota(self, auth_client):
        resp = await auth_client.post("/api/generate-all", json={
            "product_name": "测试", "selling_points": "测试",
        })
        assert resp.status_code == 200
        data = resp.json()
        assert len(data["results"]) == 3

    async def test_quota_exhausted(self, auth_client):
        # 用光 3 次免费配额
        for _ in range(3):
            await auth_client.post("/api/generate", json={
                "product_name": "x", "selling_points": "x",
            })

        # 第 4 次应该被拒绝
        resp = await auth_client.post("/api/generate", json={
            "product_name": "x", "selling_points": "x",
        })
        assert resp.status_code == 429  # quota exceeded

    async def test_history_requires_login(self, client):
        resp = await client.get("/api/history")
        assert resp.status_code == 401

    async def test_history_with_auth(self, auth_client):
        resp = await auth_client.get("/api/history")
        assert resp.status_code == 200
