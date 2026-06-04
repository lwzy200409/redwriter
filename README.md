# ✍️ RedWriter — 小红书AI文案生成工具

输入商品信息，一键生成 3 种风格的小红书爆款文案。

## 功能

- 🌿 **种草型** — 第一人称真实分享
- 🔍 **测评型** — 客观优缺点测评
- 📚 **干货型** — 知识科普+选购指南
- 📋 **一键复制** — 直接粘贴到小红书
- 🏷️ **自动标签** — AI 推荐热门 Hashtag
- 📚 **历史记录** — 保存所有生成记录

## 快速开始

### 1. 配置 API Key

```bash
# 获取 Key: https://platform.deepseek.com/
# PowerShell:
$env:DEEPSEEK_API_KEY="sk-..."
# Linux/Mac:
export DEEPSEEK_API_KEY="sk-..."
```

### 2. 启动后端

```bash
cd backend
pip install -r requirements.txt
python main.py
# → http://localhost:8000
# → API 文档: http://localhost:8000/docs
```

### 3. 启动前端

```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

### 使用 Docker 一键启动

```bash
export DEEPSEEK_API_KEY="sk-..."
docker-compose up -d
# → 前端: http://localhost:3000
# → 后端: http://localhost:8000
```

## 运行测试

```bash
cd backend
pytest tests/ -v
```

## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | React 18 + TailwindCSS + Vite |
| 后端 | Python FastAPI |
| AI | DeepSeek API (OpenAI 兼容) |
| 数据库 | SQLite (异步) |
| 部署 | Docker + Nginx |

## 定价建议

| 套餐 | 价格 | 次数 |
|---|---|---|
| 免费试用 | ¥0 | 3 次 |
| 基础版 | ¥99/月 | 10次/天 |
| 专业版 | ¥199/月 | 无限 |

## 项目结构

```
redwriter/
├── backend/           # FastAPI 后端
│   ├── main.py        # 应用入口
│   ├── config.py      # 配置
│   ├── models.py      # 数据模型
│   ├── database.py    # 数据库
│   ├── routes/        # API 路由
│   ├── services/      # AI 服务
│   └── tests/         # 测试
├── frontend/          # React 前端
│   └── src/
│       ├── components/ # 组件
│       └── pages/      # 页面
└── docker-compose.yml # Docker 部署
```

## 获取客户

1. **小红书发帖** — 用自己工具生成的文案发小红书，文末引流
2. **朋友圈** — 发给做电商的朋友试用
3. **即刻/V2EX** — 在技术社区分享工具
4. **闲鱼** — 上架「小红书文案生成」服务
