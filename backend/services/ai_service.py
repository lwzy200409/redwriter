"""DeepSeek API 文案生成服务 — 9 种文案风格"""

import asyncio
from openai import OpenAI
from config import settings

SYSTEM_PROMPT = """你是小红书爆款文案专家，精通多种写作文风。

严格遵守用户指定的风格要求来写，每种风格必须有明显区别。

写完后在文案末尾单独一行输出「---标签---」，然后推荐 5-8 个小红书热门 Hashtag。"""

# ====== 9 种风格 ======
STYLE_USER_PROMPTS = {
    # 1. 种草型
    "grass": """【风格：种草型 🌿】
商品信息：{product_info}

请以「第一人称真实分享」的口吻写一篇小红书种草文案：
1. 开头用痛点/场景引入（「谁懂啊」「终于找到」「救命」）
2. 中间详细描述使用感受和效果，多用 emoji
3. 结尾总结推荐理由，引导评论互动
4. 字数 200-400 字，口语化、像闺蜜安利""",

    # 2. 测评型
    "review": """【风格：测评型 🔍】
商品信息：{product_info}

请以「客观测评博主」的口吻写一篇小红书测评文案：
1. 开头说明测评动机（「用了X天来说真实感受」）
2. 用 ✅ 列优点，❌ 列缺点，逐条分析
3. 和同类产品对比，给出客观评价
4. 结尾总结：适合什么人 / 不适合什么人
5. 字数 300-500 字，理性、不吹不黑""",

    # 3. 干货型
    "knowledge": """【风格：干货型 📚】
商品信息：{product_info}

请以「行业知识博主」的口吻写一篇小红书干货文案：
1. 开头指出常见误区或认知盲区
2. 用「第一…第二…第三…」结构化讲解选购/使用知识
3. 穿插行业 tips 或冷知识
4. 结尾引导收藏 + 讨论
5. 字数 300-500 字，像专业人士分享""",

    # 4. 故事型
    "story": """【风格：故事型 📖】
商品信息：{product_info}

请以「讲故事」的方式写一篇小红书文案：
1. 用一个真实的小故事或场景开头（可以虚构但要有代入感）
2. 故事中自然引出产品，不突兀
3. 中间加入情感共鸣点（「当时就觉得…」「没想到…」）
4. 结尾回到现实，给出结论或感悟
5. 字数 300-500 字，有起承转合，像在看一个迷你vlog""",

    # 5. 对比型
    "compare": """【风格：对比型 ⚖️】
商品信息：{product_info}

请写一篇「前后对比」或「AB对比」的小红书文案：
1. 开头设置对比场景（使用前 vs 使用后 / A产品 vs B产品）
2. 用对比表格或分栏形式展示差异
3. 每个对比点给具体细节，不要笼统
4. 结尾给出选择建议，什么情况选什么
5. 字数 300-500 字，数据感强，有说服力""",

    # 6. 教程型
    "tutorial": """【风格：教程型 🎓】
商品信息：{product_info}

请写一篇「手把手教学」的小红书教程文案：
1. 开头说明这个教程能解决什么问题
2. 按步骤拆解使用流程（Step 1 → Step 2 → Step 3）
3. 每步说明注意事项或小技巧
4. 结尾总结效果 + 引导交作业/打卡
5. 字数 300-500 字，保姆级教学，新手也能跟着做""",

    # 7. Vlog型
    "vlog": """【风格：Vlog型 🎬】
商品信息：{product_info}

请以「Vlog 旁白脚本」的风格写一篇小红书文案：
1. 开头用时间线或场景切换引入（「早上7点…」「出门前…」）
2. 画面感强，每一段像一幕镜头
3. 多用动作描述和感官词汇（看、闻、摸、感受）
4. 节奏轻快，像在看一个短视频
5. 字数 200-400 字，有人物有场景有情绪""",

    # 8. 问答型
    "qa": """【风格：问答型 💬】
商品信息：{product_info}

请写一篇「读者提问 + 我来回答」的小红书文案：
1. 开头用3-5个高频问题引入（「最近很多人问我…」）
2. 逐一回答，每个回答简洁有力
3. 穿插真实使用体验，用「我个人觉得」「实话说」增加可信度
4. 结尾总结 + 鼓励更多提问
5. 字数 300-500 字，形式新颖，信息密度高""",

    # 9. 限时型
    "urgent": """【风格：限时型 ⏰】
商品信息：{product_info}

请写一篇「限时/限量/错过后悔」的小红书文案：
1. 开头制造紧迫感（「姐妹们快冲」「手慢无」「终于补货了」）
2. 说明为什么值得入手（价格优势、品质优势、稀缺性）
3. 加入社交证明（「已经卖了X件」「朋友都在问」）
4. 结尾强化行动号召，明确告诉读者下一步做什么
5. 字数 200-400 字，节奏快，让人想立刻下单""",
}

# 套餐可用的风格
PLAN_STYLES = {
    "free": ["grass", "review", "knowledge"],           # 3 种
    "weekly_trial": ["grass", "review", "knowledge"],   # 3 种
    "weekly": ["grass", "review", "knowledge"],          # 3 种
    "monthly": ["grass", "review", "knowledge", "story", "compare"],  # 5 种
    "pro": ["grass", "review", "knowledge", "story", "compare", "tutorial", "vlog", "qa", "urgent"],  # 9 种
}

STYLE_NAMES = {
    "grass": "种草型",
    "review": "测评型",
    "knowledge": "干货型",
    "story": "故事型",
    "compare": "对比型",
    "tutorial": "教程型",
    "vlog": "Vlog型",
    "qa": "问答型",
    "urgent": "限时型",
}

ALL_STYLES = list(STYLE_USER_PROMPTS.keys())


def build_product_info(product_name: str, selling_points: str, target_audience: str) -> str:
    info = f"商品名称：{product_name}\n核心卖点：{selling_points}"
    if target_audience:
        info += f"\n目标人群：{target_audience}"
    return info


def get_client() -> OpenAI:
    return OpenAI(
        api_key=settings.DEEPSEEK_API_KEY,
        base_url=settings.DEEPSEEK_BASE_URL,
    )


async def generate_copy(
    product_name: str,
    selling_points: str,
    target_audience: str = "",
    style: str = "grass",
) -> dict:
    """生成单篇文案"""
    if not settings.DEEPSEEK_API_KEY:
        return _mock_generate(product_name, selling_points, style)

    client = get_client()
    product_info = build_product_info(product_name, selling_points, target_audience)
    style_template = STYLE_USER_PROMPTS.get(style, STYLE_USER_PROMPTS["grass"])
    user_prompt = style_template.format(product_info=product_info)

    try:
        response = client.chat.completions.create(
            model=settings.DEEPSEEK_MODEL,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            max_tokens=2000,
            temperature=0.95,
        )
        full_text = response.choices[0].message.content or ""
        return _parse_response(full_text)
    except Exception as e:
        return {"content": f"生成失败: {e}", "hashtags": [], "error": str(e)}


async def generate_all_styles(
    product_name: str,
    selling_points: str,
    target_audience: str = "",
    styles: list[str] | None = None,
) -> list[dict]:
    """分批生成多种风格，每批最多 3 种，保证每篇质量

    9 种风格 = 3 批 × 3 种，并发执行，总耗时 ≈ 单次调用
    """
    if styles is None:
        styles = ALL_STYLES

    if not settings.DEEPSEEK_API_KEY:
        return [
            {"style": s, **_mock_generate(product_name, selling_points, s)}
            for s in styles
        ]

    # 每批最多 3 种，避免 prompt 太长模型糊掉
    batch_size = 3
    batches = [styles[i:i+batch_size] for i in range(0, len(styles), batch_size)]

    async def _gen_batch(batch_styles: list[str]) -> list[dict]:
        client = get_client()
        product_info = build_product_info(product_name, selling_points, target_audience)

        style_blocks = []
        for i, s in enumerate(batch_styles):
            name = STYLE_NAMES.get(s, s)
            style_blocks.append(
                f"【第{i+1}篇：{name}】\n"
                + STYLE_USER_PROMPTS[s].format(product_info=product_info)
            )

        combined = (
            f"请为以下商品一次性生成 {len(batch_styles)} 篇风格完全不同的小红书文案。\n\n"
            + "\n\n---\n\n".join(style_blocks)
            + f"\n\n要求：每篇风格必须完全不同，一眼能分辨。每篇写完用「---标签---」输出 Hashtag。每两篇之间用「======」分隔。"
        )

        try:
            response = client.chat.completions.create(
                model=settings.DEEPSEEK_MODEL,
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": combined},
                ],
                max_tokens=4000,
                temperature=0.95,
            )
            text = response.choices[0].message.content or ""
            return _parse_combined_response(text, batch_styles)
        except Exception as e:
            return [
                {"style": s, "content": f"生成失败: {e}", "hashtags": [], "error": str(e)}
                for s in batch_styles
            ]

    # 所有批次并发执行
    batch_results = await asyncio.gather(*[_gen_batch(b) for b in batches])

    # 合并结果
    all_results = []
    for batch in batch_results:
        all_results.extend(batch)
    return all_results


def _parse_combined_response(text: str, styles: list[str]) -> list[dict]:
    parts = text.split("======")
    results = []
    for i, part in enumerate(parts):
        part = part.strip()
        if not part:
            continue
        parsed = _parse_response(part)
        if i < len(styles):
            results.append({"style": styles[i], **parsed})
    while len(results) < len(styles):
        results.append({"style": styles[len(results)], "content": "生成不完整，请重试", "hashtags": []})
    return results[:len(styles)]


def _parse_response(text: str) -> dict:
    if "---标签---" in text:
        parts = text.split("---标签---")
        content = parts[0].strip()
        hashtags_raw = parts[1].strip() if len(parts) > 1 else ""
        hashtags = [t.strip().lstrip("#") for t in hashtags_raw.replace("\n", " ").split() if t.strip()]
    else:
        content = text.strip()
        hashtags = []
    return {"content": content, "hashtags": hashtags}


def _mock_generate(product_name: str, selling_points: str, style: str) -> dict:
    """模拟生成（无 API Key 时）"""
    name = STYLE_NAMES.get(style, style)
    return {
        "content": f"【{name} - 演示模式】\n\n这是一篇关于 {product_name} 的{name}文案。\n\n核心卖点：{selling_points}\n\n配置 DEEPSEEK_API_KEY 后即可获得真实 AI 生成内容～",
        "hashtags": ["好物推荐", "小红书", name, product_name],
    }
