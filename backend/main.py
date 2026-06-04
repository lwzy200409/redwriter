"""RedWriter — 小红书AI文案生成工具"""

import time
import logging
from contextlib import asynccontextmanager
from collections import defaultdict

import os
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from starlette.middleware.base import BaseHTTPMiddleware

from config import settings
from database import init_db
from routes.generate import router as generate_router
from routes.history import router as history_router
from routes.image import router as image_router
from routes.auth import router as auth_router
from routes.voucher import router as voucher_router

# 日志
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("redwriter")

# ===== 简易限流器 =====
class RateLimiter:
    """基于 IP 的滑动窗口限流"""

    def __init__(self, max_requests: int = 30, window_seconds: int = 60):
        self.max_requests = max_requests
        self.window = window_seconds
        self._store: dict[str, list[float]] = defaultdict(list)

    def _clean(self, ip: str, now: float):
        cutoff = now - self.window
        self._store[ip] = [t for t in self._store[ip] if t > cutoff]

    def is_allowed(self, ip: str) -> bool:
        now = time.time()
        self._clean(ip, now)
        if len(self._store[ip]) >= self.max_requests:
            return False
        self._store[ip].append(now)
        return True

    def remaining(self, ip: str) -> int:
        now = time.time()
        self._clean(ip, now)
        return max(0, self.max_requests - len(self._store[ip]))


rate_limiter = RateLimiter(max_requests=settings.RATE_LIMIT, window_seconds=60)


# ===== 安全中间件 =====
class SecurityMiddleware(BaseHTTPMiddleware):
    """安全中间件：限流 + Token 校验 + 安全头"""

    async def dispatch(self, request: Request, call_next):
        # 跳过：健康检查、文档、静态资源、前端页面
        path = request.url.path
        if path in ("/", "/health", "/docs", "/openapi.json", "/redoc"):
            return await call_next(request)
        if path.startswith("/assets/") or path.endswith((".js", ".css", ".png", ".jpg", ".svg", ".ico", ".woff", ".woff2")):
            return await call_next(request)

        # 限流
        client_ip = request.client.host if request.client else "unknown"
        if not rate_limiter.is_allowed(client_ip):
            logger.warning(f"Rate limit exceeded: {client_ip}")
            raise HTTPException(status_code=429, detail="请求过于频繁，请稍后再试")

        # 可选附加 Access Token（不设置则跳过，JWT 已提供足够保护）
        access_token = request.headers.get("X-Access-Token", "")
        expected_token = settings.ACCESS_TOKEN
        if expected_token and access_token != expected_token:
            # 但如果请求路径是 /api/auth/*，允许不带 Access Token（注册/登录不需要）
            if not request.url.path.startswith("/api/auth/"):
                logger.warning(f"Invalid access token from {client_ip}")
                raise HTTPException(status_code=403, detail="访问被拒绝")

        response = await call_next(request)

        # 安全响应头
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-RateLimit-Remaining"] = str(rate_limiter.remaining(client_ip))

        return response


# ===== 应用生命周期 =====
@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    logger.info("RedWriter 服务已启动")
    yield


app = FastAPI(
    title=settings.APP_NAME,
    description="小红书AI文案生成工具 — 输入商品信息，一键生成爆款文案",
    version="1.1.0",
    lifespan=lifespan,
)

# CORS（生产环境应限制为具体域名）
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "https://redwriter-q89s.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

# 安全中间件
app.add_middleware(SecurityMiddleware)

# 注册路由
app.include_router(auth_router)
app.include_router(voucher_router)
app.include_router(generate_router)
app.include_router(history_router)
app.include_router(image_router)


STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.get("/")
async def serve_index():
    """首页"""
    return FileResponse(os.path.join(STATIC_DIR, "index.html"))


# SPA 兜底：非 API 的 GET 请求返回 index.html（让 React Router 处理）
@app.middleware("http")
async def spa_fallback(request: Request, call_next):
    response = await call_next(request)
    if response.status_code == 404 and not request.url.path.startswith("/api/") and not request.url.path.startswith("/docs") and not request.url.path.startswith("/openapi"):
        file_path = os.path.join(STATIC_DIR, request.url.path.lstrip("/"))
        if os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(STATIC_DIR, "index.html"))
    return response


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
