# HelloMe 智能体工坊 — 对接契约总览

> **本文档面向对接方**（前端 agent / 测试 agent / 集成方）。
> 服务器侧 skill（数据模型 + 业务规则 + API 路由）已经稳定在 `main` 分支。
> 本文档只列出**外部可观测的契约**：类型、端点、字段语义、状态机、错误码。

> ⚠️ **当前 6 个视频智能体已有 AI 配音（Phase A1 TTS ✅），但仍没有唇同步 / 字幕 / 背景音乐**。
> 详见 `audio-extension.md` 路线图（Phase A2 = 唇同步 / A3 = 字幕 / B = BGM / C = 混合）。
>
> 仓库里有一份更长的设计稿：`docs/superpowers/specs/2026-06-20-creator-skill-orchestrator-design.md`，本文档是它的**机器可读精简版**。

---

## 1. 数据模型：4 业务对象

每一个 Skill（"视频智能体"）= 一份 4 业务对象快照 + 1 份基础元数据。

### 1.1 SkillRecord（顶层元数据）

```ts
{
  id: string,                   // "media-seeding" / "media-conversion" ...
  slug: string,                 // URL-safe，同 id
  name: string,                 // "消费品商家 · 产品种草 视频智能体"
  description?: string,         // 业务母句
  category: string,             // 当前全部 "media" 或 "ugc_video"
  status: 'draft' | 'published' | 'archived',
  currentVersion: number,       // 始终是最新已发布版本的 number
  updatedAt: string,            // ISO 8601
  publishedAt?: string,         // ISO 8601
  latestVersion: SkillVersionRecord  // ← 重点：包含完整 4 业务对象
}
```

### 1.2 SkillVersionRecord（一份版本 = 一份 4 对象）

```ts
{
  id: string,                   // "media-seeding-v1"
  versionNumber: number,        // 1, 2, 3 ...
  versionLabel: string,         // "v0.1.0"
  status: 'draft' | 'published' | 'archived',
  title: string,
  summary?: string,
  createdAt: string,
  publishedAt?: string,
  checksum?: string,            // SHA-like，用于 diff

  // 4 业务对象（设计稿第一性骨架）
  businessFrame: {
    goal: {
      summary: string,                // "为 消费品商家 提供 产品种草 类型的视频表达"
      scenarios: string[],            // ["产品种草"]
      industry?: string,              // "消费品商家" (可选，新建的智能体会有)
      businessSentence?: string,      // "我想做一个服务于 消费品商家 的视频智能体，帮我完成 产品种草。"
    },
    budget: {
      defaultTier: 'basic' | 'standard' | 'premium',
      confirmationRequired: boolean,  // 正式生成前是否要用户确认
      notes: string,
      upgradeEnabled?: boolean,       // 用户端是否可升级到更高 tier
    },
    executionPlan: {
      stages: Array<{
        id: string,                    // "understand" / "structure" / "draft" ...
        label: string,                 // "理解业务"
        kind: 'auto' | 'confirm',      // auto=静默推进 / confirm=需要用户确认
        producerSteps?: Array<{ id: string; label: string }>,  // 例如 ["识别受众", "判断视频类型"]
      }>,
    },
    result: {
      promiseLine: string,            // "帮助 消费品商家 在 产品种草 场景中获得更清晰的视频表达"
      deliveryLabels: string[],       // ["30-60 秒视频", "基础字幕版", "横版 / 竖版"]
      showcaseHint: string,
      orientationTags?: string[],      // 1-3 个标签（设计稿：右侧商品条）
    },
  },

  // 元数据字段（不参与业务对象，但前端需要）
  inputConfig: { ... },
  understandingConfig: { ... },
  executionConfig: { ... },
  artifactConfig: Array<{ label: string; fileName: string }>,
}
```

### 1.3 AgentOrchestratorView（API 标准返回）

`GET /api/studio/orchestrator/agents/:id` 返回：

```ts
{
  agentId: string,                  // === SkillRecord.id
  name: string,                     // === SkillRecord.name
  slug: string,                     // === SkillRecord.slug
  status: 'draft' | 'published' | 'archived',
  currentVersion: number,
  updatedAt: string,
  businessFrame: SkillVersionRecord['businessFrame'],   // ← 重点
  stageCount: number,               // businessFrame.executionPlan.stages.length
  confirmationCount: number,       // stages 里 kind === 'confirm' 的数量
}
```

---

## 2. 词汇表（入口 B 业务母句用）

```ts
VOCABULARIES = {
  industries: [
    { id: 'consumer',      label: '消费品商家' },
    { id: 'retail',         label: '本地门店' },
    { id: 'service',        label: '服务型公司' },
    { id: 'manufacturing',  label: '制造业企业' },
    { id: 'channel',        label: '渠道/代理商' },
    { id: 'content',        label: '内容团队' },
  ],
  scenarios: [
    { id: 'seeding',    label: '产品种草' },
    { id: 'review',     label: '测评讲解' },
    { id: 'conversion', label: '带货转化' },
    { id: 'showcase',   label: '宣传介绍' },
    { id: 'demo',       label: '演示视频' },
    { id: 'proposal',   label: '客户提案' },
  ],
}
```

业务母句模板：
> 我想做一个服务于 **[industry]** 的视频智能体，它要帮我完成 **[scenario]**。

---

## 3. API 端点

所有路由前缀：`/api`

### 3.1 智能体工坊（5 个端点）

| 方法 | 路径 | 说明 |
|---|---|---|
| `GET`  | `/api/studio/orchestrator/vocabularies` | 返回 `{ industries, scenarios }`（见 §2）|
| `GET`  | `/api/studio/orchestrator/agents` | 列出全部智能体（带 4 对象）|
| `POST` | `/api/studio/orchestrator/agents/from-spec` | 入口 B 创建（见 §3.2）|
| `GET`  | `/api/studio/orchestrator/agents/:agentId` | 单个详情 |
| `PATCH`| `/api/studio/orchestrator/agents/:agentId/business` | 部分更新 4 对象（见 §3.3）|

**通用响应格式**：
```ts
{ success: true, data: <payload> }     // 成功
{ success: false, error: string }     // 失败
```

### 3.2 创建智能体（POST /from-spec）

请求体：
```json
{
  "industry": "consumer",          // required, 必须是 §2 里的 id
  "scenario": "seeding",            // required, 必须是 §2 里的 id
  "displayName": "可选 - 自定义名称",  // optional, 缺省用 fallback
  "slug": "media-seeding-custom"      // optional, 缺省 `${industry}-${scenario}`
}
```

成功响应（201）：返回 `AgentOrchestratorView`（§1.3）。

错误码：
- `400`：industry 或 scenario 缺失 / 不在词汇表
- `500`：DB 不可用 / Prisma 抛错

### 3.3 部分更新业务对象（PATCH /business）

请求体（**所有字段都可选**，至少传一个）：
```json
{
  "goal": {
    "summary": "新摘要",
    "scenarios": ["产品种草", "测评"],
    "industry": "消费品商家",
    "businessSentence": "..."
  },
  "budget": {
    "defaultTier": "premium",
    "confirmationRequired": true,
    "notes": "...",
    "upgradeEnabled": false
  },
  "executionPlan": {
    "stages": [
      { "id": "understand", "label": "理解业务", "kind": "auto" },
      { "id": "structure",  "label": "组织交付方式", "kind": "auto" },
      { "id": "draft",      "label": "生成前台草稿", "kind": "auto" }
      // 注：只发数组的话会整体替换 stages
    ]
  },
  "result": {
    "promiseLine": "...",
    "deliveryLabels": ["..."],
    "showcaseHint": "...",
    "orientationTags": ["...", "..."]
  }
}
```

合并语义（深度合并，不是整体替换）：
- `goal` 内部字段各自独立 merge
- `budget` 同上
- `executionPlan.stages` 是**整体替换**（数组），传完整列表
- `result` 同 goal/budget

成功响应：返回更新后的 `AgentOrchestratorView`。

### 3.4 旧版 Studio Skills（保留兼容）

如果对接方还在用旧 API：
- `GET /api/studio/skills` → list（不含 4 业务对象，仅元数据）
- `GET /api/studio/skills/:skillId` → 含 latestVersion
- `POST /api/studio/skills/:skillId/publish` → 发布
- `POST /api/studio/skills/:skillId/debug` → 调试验证

这些端点保留是因为 `ugcTaskService` + `skillStudioService` 旧路径还在调用。**新功能请走 §3.1 orchestrator API**。

### 3.5 Skill 全景（跨三层）

`GET /api/admin/skills?layer=business&q=video` — 见 `docs/superpowers/contracts/admin-skills.md`。
返回三层 skill 总览（engineering / business / generation）。本契约不展开。

---

## 4. 状态机（前台展示位 S0-S5 + 5 大类）

设计稿规定 5 大类运行态（前台外显）+ 8 类技术态（内部映射）。前端的右栏展示位应当用 5 大类，**不直接露技术态**。

### 4.1 前台 5 大类（用户外显）

```
待开始       submitted       waiting_confirmation
自动推进中   running         自动推进节点
待确认       waiting_confirmation (confirmation 节点)
已中断待恢复 interrupted / failed
已完成       completed
```

外显文案参考：
- 待开始：「准备开始」
- 自动推进中：「正在为你规划」「生成中」「整理中」
- 待确认：「需要你确认后继续」
- 已中断待恢复：「可从上一步恢复」
- 已完成：「结果已就绪」

### 4.2 内部 8 类（TaskStatus enum）

`/api/tasks/:id` 返回的 `status` 字段：

```ts
type TaskStatus =
  | 'draft'              // 草稿，未提交
  | 'queued'             // 提交后等待执行
  | 'running'            // 正在执行
  | 'waiting_confirmation'  // 等用户确认
  | 'completed'          // 完成
  | 'failed'             // 失败
  | 'cancelled';         // 取消
```

### 4.3 前台 → 内部映射建议

| 前台 5 类 | TaskStatus 取值 | 触发条件 |
|---|---|---|
| 待开始 | `draft` / `queued` | 用户填完输入未提交 / 已提交未开始 |
| 自动推进中 | `running` | 当前 stage.kind === 'auto' |
| 待确认 | `running` + 当前 stage.kind === 'confirm' | 业务阶段要 confirm |
| 已中断待恢复 | `failed` | 失败可恢复 |
| 已完成 | `completed` | 全部 stages 完成 |

**注意**：前台 5 类**不完全**由 status 唯一决定 —— 需要结合 `currentStage.kind` 才能准确判断。任务级 metadata 还没暴露 currentStage，前端需要从 agent.businessFrame.executionPlan.stages 自己推断。

---

## 5. Hermes 执行回包（任务级 structured payload）

`/api/tasks/:id` 返回的字段：

```ts
{
  task: {
    id: string,
    status: TaskStatus,
    pauseReasonType?: 'confirmation' | 'context_limit' | 'provider_error' | 'missing_input' | 'timeout' | null,
    pauseReasonMessage?: string | null,
    resumeMode?: 'continue' | 'retry_step' | 'require_input' | 'require_creator_fix' | null,
    recoverable?: boolean,
    artifactsPreserved?: string[],  // 已保留的中间产物 fileName 列表
    willChargeAgain?: boolean | null,
    showcaseStage?: unknown,        // 调试用的快照
    ...
  },
  events: Array<{
    level: 'info' | 'success' | 'warning' | 'error',
    message: string,
    timestamp: string,
    stepIndex?: number,
  }>,
}
```

Hermes 实际返的字段（参考 `src/server/hermesContract.ts`）：
- `runState`: 'running' | 'waiting_confirmation' | 'interrupted' | 'completed' | 'failed'
- `pauseReasonType` / `pauseReasonMessage` / `resumeMode` / `recoverable` / `artifactsPreserved`

任务状态切换走 `taskStateMachine.ts`。

---

## 6. 错误码与边界情况

| 情况 | HTTP | response |
|---|---|---|
| 智能体不存在 | 404 | `{ success: false, error: "Skill media-xxx not found" }` |
| industry/scenario 不在 vocabularies | 400 | `{ success: false, error: "industry and scenario are required" }` |
| Prisma 不可用 | 500 | `{ success: false, error: "Skill Studio 持久化已启用，但数据库不可用。" }` |
| 部分更新空对象 | 200 | 直接返回当前 frame（不报错）|
| 同时更新 4 个对象 | 200 | 深度合并后返回 |
| executionPlan.stages 整体替换 | 200 | 用新数组替换 |

---

## 7. 集成侧必读

### 7.1 URL / CORS
- 开发：`http://localhost:3000`
- 生产：见 `APP_URL` env
- 已配置 CORS（如有需要，看 `server.ts` `cors()` 调用）

### 7.2 Env（关键）
```bash
DATABASE_URL=postgresql://...             # Postgres
GEMINI_API_KEY=...                       # generateText / Imagen
GRSAI_API_KEY=...                        # grsai 图片
COMFYUI_SKILL_CLI=/.../comfyui-skill     # 本地生图生视频
COMFYUI_SKILL_DIR=/.../.comfyui-skill    # skill 注册目录
MEDIA_PROVIDER=mock|gemini|grsai|local-comfyui
```

### 7.3 数据库要求
- `Skill` + `SkillVersion` 表必须有 owner (User)，用 demo 用户 `13800138002`
- 6 个视频智能体的 seed 数据通过 `npx tsx prisma/seed.ts` 写入

### 7.4 演示数据
6 个视频智能体：
- `media-seeding` (消费品商家 / 产品种草)
- `media-review` (消费品商家 / 测评讲解)
- `media-conversion` (本地门店 / 带货转化)
- `media-showcase` (服务型公司 / 宣传介绍)
- `media-demo` (制造业企业 / 演示视频)
- `media-proposal` (服务型公司 / 客户提案)
- `media-ugc` (旧版默认，published)

---

## 8. 相关文档

- **`contracts/api-reference.md`** — 完整端点 reference（含请求/响应示例 + curl 模板）
- **`contracts/data-types.md`** — TypeScript 类型全集（可 copy 进前端）
- **`contracts/status-mapping.md`** — 状态机详细映射表 + UI 文案参考
- **`contracts/integration-checklist.md`** — 前端 / 测试 agent 集成 checklist

详见 `docs/superpowers/contracts/`。

---

## 9. 服务器侧 skill 范围声明

**本仓库 / 本 skill 团队负责**：
- ✅ 数据模型（4 业务对象 + 状态机）
- ✅ 词汇表（6 行业 × 6 场景）
- ✅ REST API（5 orchestrator + 8 admin + 兼容旧 studio）
- ✅ 持久化（PostgreSQL via Prisma）
- ✅ Demo seed 数据
- ✅ 文档（本文件）

**不负责**：
- ❌ 前端 React 组件 / 路由 / 状态管理
- ❌ UI 文案细节 / 动效设计
- ❌ 单元测试 / E2E 测试
- ❌ 部署 / CI

这些由对接方（前端 agent / 测试 agent / 部署 agent）负责。