"""图片分析 + 多场景生成 + 免费生图 (DeepSeek 视觉 + Pollinations.ai)"""

import base64
import urllib.parse
from openai import OpenAI
from config import settings

# Pollinations.ai — 完全免费，无需 API Key
# 文档: https://pollinations.ai/
IMAGE_GEN_BASE = "https://image.pollinations.ai/prompt"

ANALYSIS_PROMPT = """你是一个专业的电商产品摄影师和视觉设计师。

请仔细分析这张产品图片，然后输出以下内容（用 JSON 格式）：

1. 产品识别：产品类型、颜色、材质、风格、包装特点
2. 适合这个产品的 3 个不同拍摄场景，每个场景包含：
   - name: 场景名称（中文）
   - description: 场景描述，包含角度、光线、背景、道具等（中文）
   - image_prompt: AI 生图提示词，必须是纯英文，描述要具体到构图、光线、色彩、风格。格式要求：开头写 "high quality product photography," 然后描述场景。不要写 --ar 等参数后缀，不要写品牌名。
   - copywriting: 配套小红书香文案（中文，80-150字）

输出必须是合法的 JSON，不要包含 ```json 标记。格式如下：
{
  "product_analysis": {"type": "", "color": "", "material": "", "style": "", "features": ""},
  "scenes": [
    {"name": "", "description": "", "image_prompt": "", "copywriting": ""}
  ]
}"""


def get_client() -> OpenAI:
    return OpenAI(
        api_key=settings.DEEPSEEK_API_KEY,
        base_url=settings.DEEPSEEK_BASE_URL,
    )


def make_image_url(prompt: str, width: int = 1024, height: int = 1024) -> str:
    """用 Pollinations.ai 生成免费的产品图 URL

    Pollinations.ai 完全免费，无需注册，无需 API Key。
    模型: flux (当前质量最好的免费模型)
    """
    encoded = urllib.parse.quote(prompt, safe="")
    return f"{IMAGE_GEN_BASE}/{encoded}?width={width}&height={height}&model=flux&nologo=true"


async def analyze_product_image(image_bytes: bytes, mime_type: str = "image/jpeg") -> dict:
    """分析产品图片，自动生成多场景图 + 配套文案

    Returns:
        dict: 包含产品分析，每个场景附带真实生图 URL
    """
    if not settings.DEEPSEEK_API_KEY:
        return _mock_analysis()

    client = get_client()
    image_b64 = base64.b64encode(image_bytes).decode("utf-8")
    data_url = f"data:{mime_type};base64,{image_b64}"

    try:
        response = client.chat.completions.create(
            model=settings.DEEPSEEK_MODEL,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "image_url", "image_url": {"url": data_url}},
                        {"type": "text", "text": ANALYSIS_PROMPT},
                    ],
                }
            ],
            max_tokens=3000,
            temperature=0.8,
        )

        text = response.choices[0].message.content or ""

        # 提取 JSON
        import json
        if "```json" in text:
            start = text.index("```json") + 7
            end = text.index("```", start)
            text = text[start:end].strip()
        elif "```" in text:
            start = text.index("```") + 3
            end = text.index("```", start)
            text = text[start:end].strip()

        result = json.loads(text)

        # 为每个场景自动生成图片 URL
        for scene in result.get("scenes", []):
            prompt = scene.get("image_prompt", "")
            if prompt:
                scene["image_url"] = make_image_url(prompt)
                # 也提供竖版（适合小红书 3:4）
                scene["image_url_portrait"] = make_image_url(prompt, width=768, height=1024)

        return result

    except json.JSONDecodeError:
        return {"product_analysis": {}, "scenes": [], "error": "AI 返回格式异常，请重试"}
    except Exception as e:
        return {"product_analysis": {}, "scenes": [], "error": str(e)}


def _mock_analysis() -> dict:
    """模拟分析（演示用）"""
    scenes = [
        {
            "name": "极简工作室光",
            "description": "纯白背景，自然光45度侧打，产品放在大理石台面上，旁边点缀绿植，极简高级感",
            "image_prompt": "high quality product photography, luxury skincare serum bottle, amber glass with gold dropper cap on white marble surface, natural sunlight from left window, one green eucalyptus branch, minimalist aesthetic, soft shadows, clean composition",
            "copywriting": "第一眼就被颜值吸引住了✨ 琥珀色瓶身配金色盖子，放梳妆台上就是一道风景。滴管设计取量精准不浪费。用了一周皮肤状态肉眼可见变好，姐妹们真的可以冲！",
        },
        {
            "name": "温暖晨光场景",
            "description": "早晨阳光透窗，产品放木质托盘上，旁边咖啡杯和翻开的书，生活氛围感",
            "image_prompt": "high quality product photography, skincare serum bottle on wooden tray, morning sunlight through window, next to coffee cup and open book, cozy lifestyle, warm tones, soft bokeh background, hygge aesthetic",
            "copywriting": "早间护肤仪式感拉满🌅 起床第一件事就是用它，淡淡植物香唤醒皮肤。配一杯咖啡翻开喜欢的书，这就是理想早晨。好皮肤是日积月累，这瓶值得加入日常～",
        },
        {
            "name": "专业影棚光",
            "description": "黑色背景，硬光从正上方打，瓶身与水珠结合，高速抓拍，突出质感和科技感",
            "image_prompt": "high quality product photography, skincare serum bottle splashing with water droplets, black background, dramatic overhead studio lighting, high speed capture, sharp details, luxury cosmetic advertisement style",
            "copywriting": "成分党看过来🔬 核心成分浓度真的能打！实验室数据支撑的抗老配方，滴管精准取量。好多姐妹问我皮肤怎么变好的，秘诀就是它！科学护肤不走弯路，从这瓶开始。",
        },
    ]

    # 注入图片 URL
    for s in scenes:
        s["image_url"] = make_image_url(s["image_prompt"])
        s["image_url_portrait"] = make_image_url(s["image_prompt"], width=768, height=1024)

    return {
        "product_analysis": {
            "type": "护肤品精华液",
            "color": "琥珀色瓶身，金色盖子",
            "material": "玻璃瓶，金属盖",
            "style": "简约高端",
            "features": "滴管设计，30ml规格",
        },
        "scenes": scenes,
    }
