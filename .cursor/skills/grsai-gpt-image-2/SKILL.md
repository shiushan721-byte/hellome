---
name: grsai-gpt-image-2
description: >-
  Generate product and marketing images via Grsai gpt-image-2 API. Use when
  building HelloMe UI that needs hero visuals, agent icons, landing illustrations,
  empty states, or any配图; when the user asks to生图、配图、出图; or when static
  placeholders should be replaced with on-brand generated art.
---

# Grsai gpt-image-2 生图技能

基于 [gpt-image-2 接口](https://qmy27nhsd9.apifox.cn/452409160e0) 为 HelloMe 产品生成配图。

## 何时调用

- 落地页 / 工作台需要头图、空状态、智能体封面、功能示意
- 用户说「配图」「生图」「出一张图」「做个示意图」
- 不要用 `GenerateImage` 工具替代本技能（本技能走 Grsai API，风格与交付物可控）

## 前置条件

1. 在 [Grsai API Keys](https://grsai.ai/zh/dashboard/api-keys) 申请 Key
2. 项目根目录 `.env` 配置（勿提交）：

```bash
GRSAI_API_KEY="sk-xxxxxxxx"
GRSAI_BASE_URL="https://grsai.dakka.com.cn"   # 国内；海外用 https://grsaiapi.com
```

3. 从 `.env` 加载后执行脚本（`export $(grep -v '^#' .env | xargs)` 或让脚本自行读 `.env`）

## 快速生图（推荐）

```bash
node .cursor/skills/grsai-gpt-image-2/scripts/generate-image.mjs \
  --prompt "你的英文或中文提示词" \
  --aspect "16:9" \
  --output assets/generated/hero-geo.png
```

常用参数：

| 参数 | 说明 | 默认 |
|------|------|------|
| `--prompt` | 提示词（必填） | — |
| `--model` | `gpt-image-2` 或 `gpt-image-2-vip` | `gpt-image-2` |
| `--aspect` | 比例如 `16:9`、`1:1`，或像素如 `1024x1024` | `16:9` |
| `--reply-type` | `json` / `async` / `stream` | `json` |
| `--output` | 保存路径（自动下载图片） | 仅打印 URL |
| `--images` | 参考图 URL，逗号分隔 | 无 |

`async` 模式会轮询 [异步结果接口](https://qmy27nhsd9.apifox.cn/452409577e0) 直至 `succeeded`。

## HelloMe 提示词规范

生成时必须在 prompt 中约束品牌气质，避免花哨 AI 风：

```text
Editorial minimal product illustration for HelloMe AI agent platform.
Warm off-white background #FDFCFB, charcoal black #1A1A1A accents, clean sans-serif mood,
no text watermark, no logo text, soft paper texture, high-end SaaS marketing style.
Subject: [具体画面描述]
```

场景参考：

| 用途 | 画面建议 | 比例 |
|------|----------|------|
| 首屏 Hero | 抽象智能体任务流、轻量节点连线 | `16:9` |
| GEO 智能体 | 雷达/可见度、多模型图标抽象化 | `4:3` |
| 空状态 | 单物体 + 大量留白 | `1:1` |
| 智能体卡片 | 3D 软图标、单色块 | `1:1` |

需要 2K/4K 或精细出图时用 `gpt-image-2-vip`；比例与像素约束见 [reference.md](reference.md)。

## 接入产品代码

1. 生图保存到 `assets/generated/`
2. 在组件中引用，例如 Vite：

```tsx
import heroImg from '../../assets/generated/hero-geo.png';
// <img src={heroImg} alt="" className="..." />
```

3. 同一张图多处复用；勿把 API Key 写进前端

## 错误处理

| status | 处理 |
|--------|------|
| `running` | `json` 模式少见；`async` 继续轮询 |
| `succeeded` | 取 `results[0].url` 下载或展示 |
| `failed` | 读 `error`，简化 prompt 重试 |
| `violation` | 违规，改写 prompt 去掉敏感内容 |

API 报错时检查：Key 是否有效、节点是否可达、`aspectRatio` 是否符合模型规则。

## 手工 curl（调试）

```bash
curl -sS -X POST "${GRSAI_BASE_URL}/v1/api/generate" \
  -H "Authorization: Bearer ${GRSAI_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-image-2",
    "prompt": "minimal editorial SaaS hero, warm off-white",
    "images": [],
    "aspectRatio": "16:9",
    "replyType": "json"
  }'
```

## 更多

- 完整比例表与 VIP 像素约束：[reference.md](reference.md)
