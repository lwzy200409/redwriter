"""图片分析 API（需登录 + 配额校验）"""

from fastapi import APIRouter, UploadFile, File, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import Depends

from database import get_db
from auth import get_current_user
from quota import check_and_deduct_quota, log_usage
from services.image_service import analyze_product_image
from models import User

router = APIRouter(prefix="/api", tags=["image"])

MAX_IMAGE_SIZE = 10 * 1024 * 1024
ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}


@router.post("/analyze-image")
async def analyze_image(
    file: UploadFile = File(...),
    request: Request = None,
    user: User = Depends(check_and_deduct_quota),  # 强制登录+扣配额
    db: AsyncSession = Depends(get_db),
):
    """上传产品参考图，AI 分析并自动生成多场景产品图 + 配套文案（需登录，扣 1 次配额）"""
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail=f"不支持的图片格式，支持 JPEG/PNG/WebP/GIF")

    content = await file.read()
    if len(content) > MAX_IMAGE_SIZE:
        raise HTTPException(status_code=400, detail=f"图片不能超过 {MAX_IMAGE_SIZE // 1024 // 1024}MB")
    if len(content) == 0:
        raise HTTPException(status_code=400, detail="图片为空")

    result = await analyze_product_image(content, file.content_type or "image/jpeg")

    if result.get("error"):
        raise HTTPException(status_code=500, detail=result["error"])

    client_ip = request.client.host if request and request.client else ""
    await log_usage(db, user.id, "/api/analyze-image", client_ip)

    return result
