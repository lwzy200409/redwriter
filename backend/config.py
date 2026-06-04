"""应用配置"""

import os


class Settings:
    # 服务配置
    APP_NAME: str = "RedWriter"
    APP_URL: str = os.getenv("APP_URL", "http://localhost:5173")
    DEBUG: bool = os.getenv("DEBUG", "false").lower() == "true"

    # 数据库
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./redwriter.db")

    # JWT
    SECRET_KEY: str = os.getenv("SECRET_KEY", "dev-secret-key-change-in-production-32b")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7

    # DeepSeek API
    DEEPSEEK_API_KEY: str = os.getenv("DEEPSEEK_API_KEY", "")
    DEEPSEEK_BASE_URL: str = os.getenv("DEEPSEEK_BASE_URL", "https://api.deepseek.com")
    DEEPSEEK_MODEL: str = os.getenv("DEEPSEEK_MODEL", "deepseek-chat")

    # 安全
    ACCESS_TOKEN: str = os.getenv("ACCESS_TOKEN", "")
    RATE_LIMIT: int = int(os.getenv("RATE_LIMIT", "30"))

    # 上传限制
    MAX_IMAGE_SIZE_MB: int = 10

    # 订阅套餐配置
    PLANS = {
        "free": {
            "name": "免费试用",
            "quota": 3,
            "daily": 3,
            "price": "¥0",
            "features": ["3次免费生成", "3种文案风格", "图片分析+生图"],
        },
        "weekly_trial": {
            "name": "首周体验",
            "quota": 10,
            "daily": 10,
            "price": "¥9.9/周",
            "features": ["每天10次生成", "3种文案风格", "图片分析+生图", "历史记录保存"],
        },
        "weekly": {
            "name": "周付版",
            "quota": 10,
            "daily": 10,
            "price": "¥19.9/周",
            "features": ["每天10次生成", "3种文案风格", "图片分析+生图", "历史记录保存"],
        },
        "monthly": {
            "name": "月付版",
            "quota": 20,
            "daily": 20,
            "price": "¥59/月",
            "features": ["每天20次生成", "3种文案风格", "图片分析+生图", "历史记录保存", "优先客服支持"],
        },
        "pro": {
            "name": "专业版",
            "quota": 99999,
            "daily": 99999,
            "price": "¥129/月",
            "features": ["无限使用", "所有风格+自定义", "图片分析+生图", "历史记录保存", "优先客服支持", "专属模板"],
        },
    }


settings = Settings()
