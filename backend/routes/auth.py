"""用户认证 API"""

from datetime import datetime, timezone, date

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from config import settings
from models import User
from auth import hash_password, verify_password, create_token, get_current_user

router = APIRouter(prefix="/api/auth", tags=["auth"])


class RegisterRequest(BaseModel):
    email: str = Field(..., min_length=5, max_length=100)
    password: str = Field(..., min_length=6, max_length=100)


class LoginRequest(BaseModel):
    email: str = Field(..., min_length=1)
    password: str = Field(..., min_length=1)


class AuthResponse(BaseModel):
    token: str
    user: dict


@router.post("/register")
async def register(req: RegisterRequest, db: AsyncSession = Depends(get_db)):
    """用户注册"""
    # 检查邮箱是否已被注册
    existing = await db.execute(select(User).where(User.email == req.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="该邮箱已被注册")

    # 创建用户
    user = User(
        email=req.email,
        password_hash=hash_password(req.password),
        plan="free",
        quota_total=3,  # 免费试用 3 次
        quota_used=0,
        quota_date=date.today(),
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    token = create_token(user.id, user.email)
    return AuthResponse(token=token, user=_user_info(user))


@router.post("/login")
async def login(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    """用户登录"""
    result = await db.execute(select(User).where(User.email == req.email))
    user = result.scalar_one_or_none()

    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(status_code=401, detail="邮箱或密码错误")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="账号已被禁用，请联系客服")

    # 更新最后登录时间
    user.last_login = datetime.now(timezone.utc)
    await db.commit()

    token = create_token(user.id, user.email)
    return AuthResponse(token=token, user=_user_info(user))


@router.get("/me")
async def me(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """获取当前用户信息和配额"""
    # 检查是否需要日重置（basic 用户每天重置配额）
    today = date.today()
    if user.plan == "basic" and user.quota_date != today:
        user.quota_used = 0
        user.quota_date = today
        await db.commit()

    return _user_info(user)


@router.get("/quota")
async def quota(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """查询当前配额"""
    today = date.today()
    if user.plan == "basic" and user.quota_date != today:
        user.quota_used = 0
        user.quota_date = today
        await db.commit()

    remaining = max(0, user.quota_total - user.quota_used)
    return {
        "plan": user.plan,
        "quota_total": user.quota_total,
        "quota_used": user.quota_used,
        "quota_remaining": remaining,
        "is_unlimited": user.plan == "pro",
    }


@router.get("/plans")
async def plans():
    """获取所有套餐信息"""
    return settings.PLANS


def _user_info(user: User) -> dict:
    today = date.today()
    remaining = max(0, user.quota_total - user.quota_used)
    plan_config = settings.PLANS.get(user.plan, {})
    return {
        "id": user.id,
        "email": user.email,
        "plan": user.plan,
        "plan_name": plan_config.get("name", user.plan),
        "plan_price": plan_config.get("price", ""),
        "quota_total": user.quota_total,
        "quota_used": user.quota_used,
        "quota_remaining": remaining,
        "is_unlimited": user.plan == "pro",
        "created_at": user.created_at.isoformat() if user.created_at else "",
    }
