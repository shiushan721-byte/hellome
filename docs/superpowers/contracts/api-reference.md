# API Reference

> 完整路由清单 + curl 模板 + 请求/响应示例。
> 阅读本文请配合 `README.md`（数据模型 + 词汇表）。

---

## 1. 智能体工坊（5 个核心端点）

### 1.1 GET /api/studio/orchestrator/vocabularies

**用途**：前端做"入口 B"卡片选择时获取行业 × 场景字典。

**请求**：
```bash
curl http://localhost:3000/api/studio/orchestrator/vocabularies
```

**响应 200**：
```json
{
  "success": true,
  "data": {
    "industries": [
      { "id": "consumer", "label": "消费品商家" },
      { "id": "retail", "label": "本地门店" },
      { "id": "service", "label": "服务型公司" },
      { "id": "manufacturing", "label": "制造业企业" },
      { "id": "channel", "label": "渠道/代理商" },
      { "id": "content", "label": "内容团队" }
    ],
    "scenarios": [
      { "id": "seeding", "label": "产品种草" },
      { "id": "review", "label": "测评讲解" },
      { "id": "conversion", "label": "带货转化" },
      { "id": "showcase", "label": "宣传介绍" },
      { "id": "demo", "label": "演示视频" },
      { "id": "proposal", "label": "客户提案" }
    ]
  }
}
```

---

### 1.2 GET /api/studio/orchestrator/agents

**用途**：列出全部视频智能体（含 4 业务对象视图）。

**请求**：
```bash
curl http://localhost:3000/api/studio/orchestrator/agents
```

**响应 200**：
```json
{
  "success": true,
  "data": [
    {
      "agentId": "media-seeding",
      "name": "为 消费品商家 提供 产品种草 类型的视频表达",
      "slug": "media-seeding",
      "status": "published",
      "currentVersion": 1,
      "updatedAt": "2026-06-20T12:00:00.000Z",
      "businessFrame": {
        "goal": {
          "summary": "为 消费品商家 提供 产品种草 类型的视频表达",
          "scenarios": ["产品种草"],
          "industry": "消费品商家",
          "businessSentence": "我想做一个服务于 消费品商家 的视频智能体，它要帮我完成 产品种草。"
        },
        "budget": {
          "defaultTier": "standard",
          "confirmationRequired": true,
          "notes": "默认标准档，正式生成前需要确认。",
          "upgradeEnabled": true
        },
        "executionPlan": {
          "stages": [
            { "id": "understand", "label": "理解业务", "kind": "auto" },
            { "id": "structure",  "label": "组织交付方式", "kind": "auto" },
            { "id": "draft",      "label": "生成前台草稿", "kind": "auto" },
            { "id": "refine",     "label": "优化结果表达", "kind": "auto" },
            { "id": "publish",    "label": "发布智能体", "kind": "auto" }
          ]
        },
        "result": {
          "promiseLine": "帮助 消费品商家 在 产品种草 场景中获得更清晰的视频表达",
          "deliveryLabels": ["30-60 秒视频", "基础字幕版", "横版 / 竖版"],
          "showcaseHint": "适合作为客户演示 / 内部对齐 / 短视频平台首发素材",
          "orientationTags": ["产品种草", "消费品商家", "视频智能体"]
        }
      },
      "stageCount": 5,
      "confirmationCount": 0
    }
  ]
}
```

**注意**：
- `stageCount` = `businessFrame.executionPlan.stages.length`
- `confirmationCount` = stages 里 `kind === 'confirm'` 的数量
- `industry` / `businessSentence` / `upgradeEnabled` / `orientationTags` 是新加的字段，可能为 undefined（旧 seed 数据没填）

---

### 1.3 POST /api/studio/orchestrator/agents/from-spec

**用途**：入口 B — 用业务母句创建新智能体。

**请求**：
```bash
curl -X POST http://localhost:3000/api/studio/orchestrator/agents/from-spec \
  -H 'Content-Type: application/json' \
  -d '{
    "industry": "consumer",
    "scenario": "conversion",
    "displayName": "消费品商家 · 直播带货 智能体",
    "slug": "media-live-commerce"
  }'
```

**请求体 schema**：
```ts
{
  industry: string,       // required, 必须是 §1.1 industries 里的 id
  scenario: string,       // required, 必须是 §1.1 scenarios 里的 id
  displayName?: string,   // optional, 缺省 = "${industry} · ${scenario} 视频智能体"
  slug?: string,          // optional, 缺省 = "${industry}-${scenario}"
}
```

**响应 201**：
```json
{
  "success": true,
  "data": { ...AgentOrchestratorView... }
}
```

**错误**：
- `400` — 字段缺失
- `500` — DB 不可用 / Prisma 抛错 / owner 用户找不到（需要先跑 seed）

**实际行为**：
1. 查找 owner（demo creator user, phone=13800138002）
2. 调 `buildDefaultBusinessFrame({industry, scenario, displayName})` 生成完整 4 对象
3. 在 `Skill` + `SkillVersion` 表各 upsert 一行
4. 返回 `AgentOrchestratorView`

**生成逻辑**（`agentOrchestratorService.buildDefaultBusinessFrame`）：
- goal.summary = `为 ${industryLabel} 提供 ${scenarioLabel} 类型的视频表达`
- goal.businessSentence = `我想做一个服务于 ${industryLabel} 的视频智能体，它要帮我完成 ${scenarioLabel}。`
- budget = standard / confirm=True / upgrade=True
- executionPlan.stages = 5 个默认阶段（理解业务/组织交付方式/生成前台草稿/优化结果表达/发布智能体），每个 kind=auto
- result.promiseLine = `帮助 ${industry} 在 ${scenario} 场景中获得更清晰的视频表达`
- result.orientationTags = [scenario, industry, '视频智能体']

---

### 1.4 GET /api/studio/orchestrator/agents/:agentId

**用途**：单个详情。

**请求**：
```bash
curl http://localhost:3000/api/studio/orchestrator/agents/media-seeding
```

**响应 200**：同 §1.2 单元素。

**错误**：
- `404` — skillId 不存在
- `500` — 抛错

---

### 1.5 PATCH /api/studio/orchestrator/agents/:agentId/business

**用途**：自然语言改智能体后落地 4 业务对象的部分更新。

**请求**：
```bash
curl -X PATCH http://localhost:3000/api/studio/orchestrator/agents/media-seeding/business \
  -H 'Content-Type: application/json' \
  -d '{
    "goal": {
      "summary": "为消费品商家提供更聚焦的产品种草视频表达"
    },
    "budget": {
      "defaultTier": "premium",
      "upgradeEnabled": false
    },
    "result": {
      "promiseLine": "30 天内做出 3 条可投流的种草视频",
      "orientationTags": ["投流导向", "30 天承诺"]
    }
  }'
```

**请求体 schema**（**所有字段都可选**，至少传 1 个对象）：
```ts
{
  goal?: {
    summary?: string,
    scenarios?: string[],
    industry?: string,
    businessSentence?: string,
  },
  budget?: {
    defaultTier?: 'basic' | 'standard' | 'premium',
    confirmationRequired?: boolean,
    notes?: string,
    upgradeEnabled?: boolean,
  },
  executionPlan?: {
    stages?: Array<{           // ← 整体替换，不是 merge
      id: string,
      label: string,
      kind: 'auto' | 'confirm',
      producerSteps?: Array<{ id: string; label: string }>,
    }>,
  },
  result?: {
    promiseLine?: string,
    deliveryLabels?: string[],
    showcaseHint?: string,
    orientationTags?: string[],
  },
}
```

**合并语义**：
- `goal` / `budget` / `result`：**深度合并**（每个子字段独立更新）
- `executionPlan.stages`：**整体替换**（数组，传完整列表）

**响应 200**：返回更新后的 `AgentOrchestratorView`。

**错误**：
- `404` — skillId 不存在
- `500` — DB 不可用 / Prisma 抛错 / 字段类型不匹配

---

## 2. 兼容旧 API（保留）

| 方法 | 路径 | 说明 |
|---|---|---|
| `GET` | `/api/studio/skills` | 旧版 list（仅元数据，不含 4 对象） |
| `GET` | `/api/studio/skills/:skillId` | 旧版详情（含 latestVersion） |
| `GET` | `/api/studio/skills/:skillId/versions` | 版本历史 |
| `POST` | `/api/studio/skills/:skillId/publish` | 发布当前 draft 版本 |
| `POST` | `/api/studio/skills/:skillId/debug` | 调试验证（生成脚本草案） |

**新功能请走 §1 orchestrator API**。旧 API 是为 `ugcTaskService` + `skillStudioService` 旧路径保留。

---

## 3. Skill 全景（admin）

`GET /api/admin/skills?layer=business&q=video` — 跨三层 skill 总览（engineering/business/generation）。
详见 `admin-skills.md`。

---

## 4. 任务 / Hermes 端点（前端核心流程）

### 4.1 POST /api/tasks/ugc

提交 UGC 视频任务。

**请求**：
```json
{
  "input": {
    "skillId": "media-seeding",
    "sellingPoint": "新款保湿喷雾",
    "platform": "抖音",
    "effectGoal": "更像真人种草",
    "referenceUrl": "https://example.com/ref",
    "productImageUrl": "https://...",
    "talentImageUrl": "https://..."
  }
}
```

**响应 201**：
```json
{
  "success": true,
  "data": {
    "taskId": "cm123abc..."
  }
}
```

### 4.2 GET /api/tasks/:id

**响应 200**：
```json
{
  "success": true,
  "data": {
    "task": {
      "id": "cm123abc...",
      "status": "running",                          // TaskStatus enum
      "skillId": "media-seeding",
      "skillVersionId": "media-seeding-v1",
      "executionMode": "backend_silent",
      "pauseReasonType": null,
      "pauseReasonMessage": null,
      "resumeMode": null,
      "recoverable": false,
      "artifactsPreserved": ["script.md"],
      "willChargeAgain": null,
      "artifacts": [
        {
          "id": "cm123abc-video",
          "type": "video",
          "label": "样片视频",
          "fileName": "sample-video.mp4",
          "mimeType": "video/mp4",
          "url": "public/media/comfyui-XXX.webm"        // ← 真实文件路径（生成后才有）
        }
      ],
      "estimatedTokenMin": 22600,
      "tokenUsed": 13800,
      "currentTokenUsed": 13800,
      "createdAt": "...",
      "updatedAt": "...",
      "startedAt": "...",
      "completedAt": null
    },
    "events": [
      { "level": "info", "message": "已读取 Skill 配置", "timestamp": "...", "stepIndex": 0 },
      { "level": "info", "message": "视频生成完成（local-comfyui / local/txt2video · 116s · source=provider）", "stepIndex": 4 }
    ]
  }
}
```

**重要字段语义**：
- `status`: TaskStatus enum (见 README §4.2)
- `pauseReasonType`: 'confirmation' | 'context_limit' | 'provider_error' | 'missing_input' | 'timeout' | null
- `recoverable`: true = 可恢复，false = 需重做
- `artifacts[].url`: **生成后才填**，未生成时为空
- `events[]`: 任务执行日志，可驱动右栏状态轨

### 4.3 GET /api/tasks/:id/events

仅获取事件流（轮询用）：
```bash
curl http://localhost:3000/api/tasks/{id}/events
```

### 4.4 POST /api/tasks/:id/confirm

确认继续（针对 `waiting_confirmation` 状态）：
```bash
curl -X POST http://localhost:3000/api/tasks/{id}/confirm
```

### 4.5 POST /api/tasks/:id/cancel

取消任务（任何状态可取消）：
```bash
curl -X POST http://localhost:3000/api/tasks/{id}/cancel
```

### 4.6 POST /api/tasks/:id/retry

重试任务（仅 failed + recoverable）：
```bash
curl -X POST http://localhost:3000/api/tasks/{id}/retry
```

---

## 4.7 Audio（配音）端点

### 4.7.1 Audio adapter 调用模式

**音频（TTS）调用是**直接在 TS 代码里调 `modelAdapter.generateAudio()`，**不通过 HTTP 端点**。
对接方从 `ugcTaskService` 里调即可。

```typescript
import { generateAudio } from '../adapters/audioAdapter';

// ugcTaskService.ts step 4.5 (illustrative)
const scriptText = extractTextFromScript(scriptMd);
const audio = await generateAudio({
  prompt: scriptText,
  language: 'English',
  seed: 42,
  timeoutMs: 60_000,
});
// audio.url: 'public/media/audio-XXX.flac'
// audio.source: 'provider' | 'fallback'（关键：判断真假）
// audio.sizeBytes: ~188 KB（真实）/ ~9 KB（mock fallback）
```

### 4.7.2 响应字段语义

| 字段 | 类型 | 说明 |
|---|---|---|
| `url` | string | 产物本地路径（`public/media/audio-XXX.flac`）|
| `mimeType` | `'audio/wav' \| 'audio/flac' \| 'audio/mpeg'` | 实际格式 |
| `provider` | `'local-comfyui' \| 'mock'` | 哪个 provider |
| `model` | string | workflow ID（如 `tts_chatterbox_api`）|
| `promptId` | string | ComfyUI prompt ID（调试用）|
| `elapsedMs` | number | 实际生成耗时（首次 ~60s 含模型下载，之后 ~7s）|
| `source` | `'provider' \| 'fallback'` | **关键**：区分真实生成 vs 1 秒静音 mock |
| `sizeBytes` | number | 真实 ~188 KB / mock ~9 KB |

### 4.7.3 curl 模板（绕过 TS，直接调 comfyui-skill）

```bash
~/comfy/.venv/bin/comfyui-skill \
  --dir ~/Documents/hellome/.comfyui-skill \
  --json run tts_chatterbox_api \
  --args '{
    "prompt": "Hello, this is a TTS test.",
    "language": "English"
  }'
# → {"status":"success","outputs":[{"local_path":"...flac"}]}
```

### 4.7.4 验证「真」vs「mock」

```bash
# 真实 ChatterBox 产物：vendor tag 含 "ChatterBox"
grep -c "ChatterBox" public/media/audio-*.flac   # → ≥ 1

# mock fallback 产物：异常 sample_rate
grep -c "98304000" public/media/audio-*.flac     # → 0
```

详见 `audio-extension.md` §0 + §11。

---

## 5. 调试 / 创作辅助

### 5.1 POST /api/llm/generate

通用文本生成（Gemini / OpenAI / OpenRouter / mock）。

**请求**：
```json
{ "prompt": "为这个智能体写一段话", "system": "你是创作者助手" }
```

**响应**：
```json
{
  "success": true,
  "data": {
    "text": "...",
    "provider": "gemini",
    "model": "gemini-2.5-flash",
    "source": "provider"     // "provider" 真实 / "fallback" mock
  }
}
```

### 5.2 GET /api/models

返回当前 `MODEL_PROVIDER` 配置和可用模型清单。

### 5.3 GET /api/admin/skills?layer=business&q=video

跨三层 skill 总览。详见 `admin-skills.md`。

---

## 6. curl 模板汇总

```bash
# 列出词汇表
curl http://localhost:3000/api/studio/orchestrator/vocabularies

# 列出所有智能体
curl http://localhost:3000/api/studio/orchestrator/agents

# 创建智能体（入口 B）
curl -X POST http://localhost:3000/api/studio/orchestrator/agents/from-spec \
  -H 'Content-Type: application/json' \
  -d '{"industry":"consumer","scenario":"seeding"}'

# 获取详情
curl http://localhost:3000/api/studio/orchestrator/agents/media-seeding

# 修改 4 对象
curl -X PATCH http://localhost:3000/api/studio/orchestrator/agents/media-seeding/business \
  -H 'Content-Type: application/json' \
  -d '{"budget":{"defaultTier":"premium"}}'

# 提交任务
curl -X POST http://localhost:3000/api/tasks/ugc \
  -H 'Content-Type: application/json' \
  -d '{"input":{"skillId":"media-seeding","sellingPoint":"产品","platform":"抖音","effectGoal":"更像真人种草"}}'

# 轮询任务状态
curl http://localhost:3000/api/tasks/{taskId}

# 确认/取消/重试
curl -X POST http://localhost:3000/api/tasks/{taskId}/confirm
curl -X POST http://localhost:3000/api/tasks/{taskId}/cancel
curl -X POST http://localhost:3000/api/tasks/{taskId}/retry
```