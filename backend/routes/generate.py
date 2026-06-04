"""文案生成 API（需登录 + 配额校验 + 按套餐限制风格）"""

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from auth import get_current_user
from quota import check_and_deduct_quota, log_usage
from services.ai_service import (
    generate_copy, generate_all_styles,
    PLAN_STYLES, STYLE_NAMES, ALL_STYLES,
)
from models import User, Generation

router = APIRouter(prefix="/api", tags=["generate"])

# 所有 9 种风格的正则
VALID_STYLES = "|".join(ALL_STYLES)


class GenerateRequest(BaseModel):
    product_name: str = Field(..., min_length=1, max_length=100)
    selling_points: str = Field(..., min_length=1, max_length=1000)
    target_audience: str = Field(default="", max_length=200)
    style: str = Field(default="grass")


class GenerateAllRequest(BaseModel):
    product_name: str = Field(..., min_length=1, max_length=100)
    selling_points: str = Field(..., min_length=1, max_length=1000)
    target_audience: str = Field(default="", max_length=200)
    styles: list[str] | None = None  # 为空则使用用户套餐允许的全部风格


class GenerateResponse(BaseModel):
    id: str
    content: str
    hashtags: list[str]
    style: str


class GenerateAllResponse(BaseModel):
    results: list[GenerateResponse]


@router.get("/styles")
async def available_styles(user: User = Depends(get_current_user)):
    """获取当前套餐可用的文案风格列表"""
    allowed = PLAN_STYLES.get(user.plan, PLAN_STYLES["free"])
    return {
        "plan": user.plan,
        "styles": [{"id": s, "name": STYLE_NAMES.get(s, s)} for s in allowed],
        "all_styles": [{"id": s, "name": STYLE_NAMES.get(s, s)} for s in ALL_STYLES],
    }


async def _save(db, req, style, content, hashtags, user_id=None):
    gen = Generation(
        user_id=user_id,
        product_name=req.product_name,
        selling_points=req.selling_points,
        target_audience=req.target_audience,
        style=style,
        content=content,
        hashtags=",".join(hashtags),
    )
    db.add(gen)
    await db.commit()
    await db.refresh(gen)
    return gen


@router.post("/generate", response_model=GenerateResponse)
async def generate(
    req: GenerateRequest,
    request: Request,
    user: User = Depends(check_and_deduct_quota),
    db: AsyncSession = Depends(get_db),
):
    """生成单篇文案"""
    # 校验风格是否在套餐允许范围内
    allowed = PLAN_STYLES.get(user.plan, PLAN_STYLES["free"])
    if req.style not in ALL_STYLES:
        raise HTTPException(status_code=400, detail=f"未知风格: {req.style}")
    if req.style not in allowed:
        raise HTTPException(status_code=400, detail=f"你的套餐不支持此风格，请升级套餐")

    result = await generate_copy(
        product_name=req.product_name, selling_points=req.selling_points,
        target_audience=req.target_audience, style=req.style,
    )
    if result.get("error"):
        raise HTTPException(status_code=500, detail=result["error"])

    gen = await _save(db, req, req.style, result["content"], result["hashtags"], user_id=user.id)
    await log_usage(db, user.id, "/api/generate", request.client.host if request.client else "")
    return GenerateResponse(id=gen.id, content=result["content"], hashtags=result["hashtags"], style=req.style)


@router.post("/generate-all", response_model=GenerateAllResponse)
async def generate_all(
    req: GenerateAllRequest,
    request: Request,
    user: User = Depends(check_and_deduct_quota),
    db: AsyncSession = Depends(get_db),
):
    """一次生成多种风格（默认使用套餐允许的全部风格）"""
    allowed = PLAN_STYLES.get(user.plan, PLAN_STYLES["free"])

    # 如果请求指定了风格，校验
    if req.styles:
        for s in req.styles:
            if s not in allowed:
                raise HTTPException(status_code=400, detail=f"你的套餐不支持「{STYLE_NAMES.get(s, s)}」，请升级套餐")
        styles = req.styles
    else:
        styles = allowed

    results = await generate_all_styles(
        product_name=req.product_name, selling_points=req.selling_points,
        target_audience=req.target_audience, styles=styles,
    )

    responses = []
    for r in results:
        if r.get("error"):
            raise HTTPException(status_code=500, detail=r["error"])
        gen = await _save(db, req, r["style"], r["content"], r.get("hashtags", []), user_id=user.id)
        responses.append(GenerateResponse(id=gen.id, content=r["content"], hashtags=r.get("hashtags", []), style=r["style"]))

    await log_usage(db, user.id, "/api/generate-all", request.client.host if request.client else "")
    return GenerateAllResponse(results=responses)
