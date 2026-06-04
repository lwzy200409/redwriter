"""配额强制校验 —— 支持多级订阅"""

from datetime import date

from fastapi import HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from auth import get_current_user
from models import User, UsageLog
from config import settings


async def check_and_deduct_quota(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> User:
    """检查并扣除配额。支持 daily 重置（weekly/monthly 套餐）"""
    today = date.today()

    # 每日配额重置（weekly_trial, weekly, monthly 套餐）
    daily_plans = ("weekly_trial", "weekly", "monthly")
    if user.plan in daily_plans and user.quota_date != today:
        plan_config = settings.PLANS.get(user.plan, {})
        user.quota_total = plan_config.get("daily", 10)
        user.quota_used = 0
        user.quota_date = today

    # Pro 无限
    if user.plan == "pro":
        return user

    # 检查剩余
    remaining = user.quota_total - user.quota_used
    if remaining <= 0:
        plan_name = settings.PLANS.get(user.plan, {}).get("name", user.plan)
        if user.plan == "free":
            raise HTTPException(
                status_code=429,
                detail="免费试用次数已用完！升级首周体验仅需 ¥9.9，每天可用 10 次",
            )
        else:
            raise HTTPException(
                status_code=429,
                detail=f"今日配额已用完（{plan_name}：每天 {user.quota_total} 次），明天自动重置。或升级专业版享无限使用",
            )

    user.quota_used += 1
    await db.commit()
    return user


async def log_usage(db: AsyncSession, user_id: str, endpoint: str, ip_address: str = ""):
    """审计日志"""
    log = UsageLog(user_id=user_id, endpoint=endpoint, ip_address=ip_address)
    db.add(log)
    await db.commit()
