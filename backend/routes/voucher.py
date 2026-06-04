"""兑换码系统 API"""

import random
import string
from datetime import datetime, timezone, timedelta

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from auth import get_current_user
from models import User, VoucherCode
from config import settings

router = APIRouter(prefix="/api", tags=["voucher"])

PLAN_MAP = {
    "weekly_trial": "首周体验",
    "weekly": "周付版",
    "monthly": "月付版",
    "pro": "专业版",
}


class RedeemRequest(BaseModel):
    code: str = Field(..., min_length=15, max_length=20)


@router.post("/redeem")
async def redeem(
    req: RedeemRequest,
    request: Request,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """用户输入兑换码升级套餐"""
    code_str = req.code.strip().upper()

    # 查码
    result = await db.execute(
        select(VoucherCode).where(VoucherCode.code == code_str)
    )
    voucher = result.scalar_one_or_none()

    if not voucher:
        raise HTTPException(status_code=404, detail="兑换码无效，请检查是否输入正确")
    if voucher.is_used:
        raise HTTPException(status_code=400, detail=f"该兑换码已被使用（{voucher.is_used}）")

    # 标记使用
    voucher.is_used = user.email
    voucher.used_by = user.id
    voucher.used_at = datetime.now(timezone.utc)

    # 升级用户套餐
    user.plan = voucher.plan
    plan_cfg = settings.PLANS.get(voucher.plan, {})
    user.quota_total = plan_cfg.get("daily", 10)
    user.quota_used = 0

    await db.commit()

    plan_name = PLAN_MAP.get(voucher.plan, voucher.plan)
    return {
        "success": True,
        "message": f"兑换成功！已升级为 {plan_name}，有效期 {voucher.duration_days} 天",
        "plan": voucher.plan,
        "plan_name": plan_name,
        "quota": user.quota_total,
    }


# ====== 管理员生成兑换码 ======

class GenerateRequest(BaseModel):
    plan: str = Field(..., description="weekly_trial | weekly | monthly | pro")
    count: int = Field(default=1, ge=1, le=100)
    duration_days: int = Field(default=30, ge=1, le=365)


def _gen_code() -> str:
    """生成 15 位兑换码，排除易混淆字符"""
    chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"  # 去掉 0O1I
    return "".join(random.choices(chars, k=15))


@router.post("/admin/generate-codes")
async def generate_codes(
    req: GenerateRequest,
    request: Request,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """管理员生成兑换码（仅限 pro 用户操作，或者本地操作）"""
    # 简单权限：只有 pro 用户可以生成
    if user.plan != "pro":
        raise HTTPException(status_code=403, detail="仅限管理员操作")

    if req.plan not in PLAN_MAP:
        raise HTTPException(status_code=400, detail=f"无效的套餐: {req.plan}")

    plan_name = PLAN_MAP[req.plan]
    codes = []
    for _ in range(req.count):
        # 去重
        for _ in range(10):
            code = _gen_code()
            existing = await db.execute(
                select(VoucherCode).where(VoucherCode.code == code)
            )
            if not existing.scalar_one_or_none():
                break

        voucher = VoucherCode(
            code=code,
            plan=req.plan,
            duration_days=req.duration_days,
        )
        db.add(voucher)
        codes.append(code)

    await db.commit()

    return {
        "generated": len(codes),
        "plan": plan_name,
        "duration_days": req.duration_days,
        "codes": codes,
    }


@router.get("/admin/codes")
async def list_codes(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """查看兑换码列表（管理员）"""
    if user.plan != "pro":
        raise HTTPException(status_code=403, detail="仅限管理员操作")

    result = await db.execute(
        select(VoucherCode).order_by(VoucherCode.created_at.desc()).limit(200)
    )
    rows = result.scalars().all()

    return {
        "total": len(rows),
        "codes": [
            {
                "code": r.code,
                "plan": PLAN_MAP.get(r.plan, r.plan),
                "duration_days": r.duration_days,
                "is_used": bool(r.is_used),
                "used_by": r.is_used or "",
                "used_at": r.used_at.isoformat() if r.used_at else "",
                "created_at": r.created_at.isoformat() if r.created_at else "",
            }
            for r in rows
        ],
    }
