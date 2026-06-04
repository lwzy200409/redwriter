"""数据库模型 — 用户 + 订阅 + 配额"""

import uuid
from datetime import datetime, timezone, date

from sqlalchemy import Column, String, Integer, Text, DateTime, Date, Boolean
from database import Base


def utcnow():
    return datetime.now(timezone.utc)


def gen_uuid():
    return str(uuid.uuid4())


class User(Base):
    """用户表"""
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=gen_uuid)
    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)

    # 订阅
    plan = Column(String, default="free")  # free | basic | pro
    quota_total = Column(Integer, default=3)     # 总配额（free=3次试用）
    quota_used = Column(Integer, default=0)      # 已使用次数
    quota_date = Column(Date, default=date.today) # 配额日期（按天重置用）

    # 状态
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=utcnow)
    last_login = Column(DateTime, default=utcnow)


class Generation(Base):
    """生成记录表"""
    __tablename__ = "generations"

    id = Column(String, primary_key=True, default=gen_uuid)
    user_id = Column(String, nullable=True, index=True)
    product_name = Column(String, nullable=False)
    selling_points = Column(Text, nullable=False)
    target_audience = Column(String, default="")
    style = Column(String, default="grass")
    content = Column(Text, nullable=False)
    hashtags = Column(String, default="")
    created_at = Column(DateTime, default=utcnow)


class UsageLog(Base):
    """API 使用日志"""
    __tablename__ = "usage_logs"

    id = Column(String, primary_key=True, default=gen_uuid)
    user_id = Column(String, nullable=False, index=True)
    endpoint = Column(String, nullable=False)
    ip_address = Column(String, default="")
    created_at = Column(DateTime, default=utcnow)


class VoucherCode(Base):
    """兑换码"""
    __tablename__ = "voucher_codes"

    id = Column(String, primary_key=True, default=gen_uuid)
    code = Column(String, unique=True, nullable=False, index=True)  # 兑换码
    plan = Column(String, nullable=False)     # 对应的套餐
    duration_days = Column(Integer, default=30)  # 有效天数
    is_used = Column(String, default="")     # 空=未使用, 否则=使用者邮箱
    used_by = Column(String, default="")     # 使用者 user_id
    used_at = Column(DateTime, nullable=True)  # 使用时间
    created_at = Column(DateTime, default=utcnow)
