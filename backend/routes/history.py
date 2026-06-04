"""历史记录 API（需登录）"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from auth import get_current_user
from models import User, Generation

router = APIRouter(prefix="/api", tags=["history"])


@router.get("/history")
async def list_history(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    user: User = Depends(get_current_user),  # 需登录
    db: AsyncSession = Depends(get_db),
):
    """获取当前用户的历史生成记录"""
    offset = (page - 1) * page_size

    result = await db.execute(
        select(Generation)
        .where(Generation.user_id == user.id)
        .order_by(desc(Generation.created_at))
        .offset(offset)
        .limit(page_size)
    )
    generations = result.scalars().all()

    return {
        "items": [
            {
                "id": g.id,
                "product_name": g.product_name,
                "style": g.style,
                "content": g.content[:200] + "..." if len(g.content) > 200 else g.content,
                "hashtags": g.hashtags.split(",") if g.hashtags else [],
                "created_at": g.created_at.isoformat() if g.created_at else "",
            }
            for g in generations
        ],
        "page": page,
        "page_size": page_size,
    }


@router.get("/history/{gen_id}")
async def get_generation(
    gen_id: str,
    user: User = Depends(get_current_user),  # 需登录
    db: AsyncSession = Depends(get_db),
):
    """获取单条生成记录"""
    result = await db.execute(
        select(Generation).where(Generation.id == gen_id, Generation.user_id == user.id)
    )
    gen = result.scalar_one_or_none()
    if not gen:
        return {"error": "记录不存在"}

    return {
        "id": gen.id,
        "product_name": gen.product_name,
        "selling_points": gen.selling_points,
        "target_audience": gen.target_audience,
        "style": gen.style,
        "content": gen.content,
        "hashtags": gen.hashtags.split(",") if gen.hashtags else [],
        "created_at": gen.created_at.isoformat() if gen.created_at else "",
    }
