# 集成 Checklist

> 另一台 agent（前端 / 测试）启动前，先按这个清单走一遍。
> 估算：**30-60 分钟**就能把所有契约 + demo 数据 + env 配齐。

---

## 0. 前提

- [ ] 已读 `README.md`（数据模型 + 词汇表 + 状态机）
- [ ] 已读 `api-reference.md`（端点清单 + curl 模板）
- [ ] 已读 `data-types.md`（TypeScript 类型全集）
- [ ] 已读 `status-mapping.md`（5 大类前台外显）

---

## 1. 后端环境（一次性）

- [ ] PostgreSQL 跑着：`docker compose up -d postgres`
- [ ] 数据库 schema 应用：`npx prisma db push`
- [ ] Demo 数据入库：`npx tsx prisma/seed.ts`（应有 7+ 个 skill 写入：1 个 media-ugc + 6 个 media-*）
- [ ] 启动 server：`npx tsx server.ts` 或 `npm run dev`
- [ ] 健康检查：`curl http://localhost:3000/api/studio/orchestrator/vocabularies` 返 200

### 1.1 验证后端

```bash
# 词汇表（应有 6 行业 + 6 场景）
curl -s http://localhost:3000/api/studio/orchestrator/vocabularies | python3 -m json.tool

# 智能体列表（应有 7+ 个）
curl -s http://localhost:3000/api/studio/orchestrator/agents | python3 -c "
import sys, json
d = json.load(sys.stdin)['data']
print(f'total: {len(d)}')
for a in d[:8]:
    print(f\"  {a['agentId']:24} v{a['currentVersion']} ({a['status']}) {a['businessFrame']['goal']['summary']}\")
"

# Skill 全景（business 层）
curl -s 'http://localhost:3000/api/admin/skills?layer=business' | python3 -c "
import sys, json
d = json.load(sys.stdin)['data']
print(f'total business: {d[\"total\"]}')
"
```

---

## 2. 前端集成（按顺序做）

### 2.1 数据模型
- [ ] 复制 `data-types.md` 里所有 TypeScript 类型到前端 `src/types/orchestrator.ts`
- [ ] 加 zod / valibot schema 做请求体校验
- [ ] 导出 `AgentOrchestratorView` / `SkillBusinessFrame` / `Vocabularies` / `TaskStatus`

### 2.2 API 客户端封装
- [ ] 创建 `src/lib/orchestratorApi.ts`：
  - `getVocabularies()` → vocabularies
  - `listAgents()` → AgentOrchestratorView[]
  - `getAgent(id)` → AgentOrchestratorView
  - `createAgentFromSpec(input)` → AgentOrchestratorView
  - `updateAgentBusiness(id, patch)` → AgentOrchestratorView
- [ ] 创建 `src/lib/tasksApi.ts`：
  - `submitUgcTask(input)` → taskId
  - `getTask(id)` → UgcTaskDetailResponse
  - `confirmTask(id)` / `cancelTask(id)` / `retryTask(id)`
- [ ] 复用现有 `/api/tasks` 端点（详见 `api-reference.md` §4）

### 2.3 入口 B 创建页
- [ ] 路由：`/app/studio/create` 或 `/app/create-agent`
- [ ] 组件：`CreateAgentPage`：
  - 加载 `vocabularies`（getVocabularies）
  - 渲染 6 行业 × 6 场景**双卡片选择器**
  - 显示实时业务母句预览：`我想做一个服务于 [industry] 的视频智能体，它要帮我完成 [scenario]。`
  - 用户点「创建」→ `createAgentFromSpec` → 跳转 `/app/studio/agents/:id`

### 2.4 统一编排页（Agent Orchestrator）
- [ ] 路由：`/app/studio/agents/:id`
- [ ] 组件：`AgentOrchestratorPage`：
  - 加载 `getAgent(id)` → 显示完整 4 对象
  - **中间对话框**（AI 编辑入口）—— 用户输入自然语言描述修改意图，前端组装 `SkillBusinessFrameUpdate` 调 PATCH
  - **右侧展示舞台**（3 组件）—— 见下

### 2.5 右侧展示舞台组件（3 个）

#### AgentStage（主舞台卡）
- [ ] 显示：智能体名 + promiseLine + 主视觉占位（默认静态图 / 真实成片图）
- [ ] 状态切换动效：S0 默认 / S1 已接收 / S2 规划中 / S3 已规划 / S4 执行中 / S5 已完成
- [ ] 文案参考：`status-mapping.md` §2

#### OutcomeBar（结果商品条）
- [ ] 显示：orientationTags（1-3）+ deliveryLabels（2-4）+ budget.defaultTier
- [ ] 如果 `budget.upgradeEnabled === true`，显示"可升级到 premium 档"提示

#### ExecutionTrack（执行状态轨）
- [ ] 显示 5 大类状态（待开始/自动推进中/待确认/已中断/已完成）
- [ ] 当前状态高亮，其他灰色
- [ ] 已完成状态打勾
- [ ] 轮询 `/api/tasks/:id` 5 秒一次更新
### 2.6 任务提交 + 状态展示

- [ ] 用户在智能体详情页填输入 → 提交 `POST /api/tasks/ugc`
- [ ] 跳转 `/app/tasks/:id` 显示任务进度
- [ ] 右栏展示 ExecutionTrack（实时更新）
- [ ] 当 `status === 'waiting_confirmation'` 时显示「确认继续」CTA → `POST /api/tasks/:id/confirm`
- [ ] 当 `status === 'failed'` + `recoverable === true` 时显示「从这里继续」→ `POST /api/tasks/:id/retry`
- [ ] 当 `status === 'completed'` 时展示 `task.artifacts[].url`（视频/图片下载链接）

### 2.7 Audio 配音集成（Phase A1）

- [ ] 复制 `data-types.md §5.5` 的 audio 类型到 `src/types/audio.ts`
- [ ] 在 `ugcTaskService.ts` step 4 后插 step 4.5：
  ```ts
  import { generateAudio } from './adapters/audioAdapter';
  const audio = await generateAudio({
    prompt: scriptText,
    language: 'English',
    seed: 42,
    timeoutMs: 60_000,
  });
  task.artifacts.push({
    id: `${taskId}-voiceover`,
    type: 'audio',
    label: '配音音频',
    fileName: path.basename(audio.url),
    mimeType: audio.mimeType,
    url: audio.url,
  });
  ```
- [ ] 右栏 OutcomeBar 加「AI 配音」徽章（来自 `result.deliveryLabels`）
- [ ] artifact 列表显示 audio 类型（带 ▶ 播放按钮）
- [ ] 任务面板 phase 文字加「配音合成中...」

**端到端验证（必跑）**：
```bash
# 1. 真实生成（ChatterBox 引擎）
npx tsx scripts/test_audio_adapter.ts
# → sizeBytes ≥ 100000, source='provider'

# 2. 真 vs 假检测
grep -c "ChatterBox" public/media/audio-*.flac  # → ≥ 1（真）
grep -c "98304000" public/media/audio-*.flac    # → 0（无 mock）
```

---

## 3. 测试 agent Checklist

### 3.1 单元测试
- [ ] `SkillBusinessFrame` 类型校验（必填 / 可选字段）
- [ ] PATCH 合并语义：4 对象深度合并 + executionPlan.stages 整体替换
- [ ] vocabularies 完整性：6 行业 + 6 场景 ID 不重复

### 3.2 集成测试（按 `api-reference.md` §6 curl 模板）

```bash
# 创建 → 查询 → 修改 → 删除（如果实现删除）
TEST_ID="test-$(date +%s)"

curl -X POST http://localhost:3000/api/studio/orchestrator/agents/from-spec \
  -H 'Content-Type: application/json' \
  -d "{\"industry\":\"consumer\",\"scenario\":\"seeding\",\"slug\":\"$TEST_ID\"}" | jq

curl -X PATCH "http://localhost:3000/api/studio/orchestrator/agents/$TEST_ID/business" \
  -H 'Content-Type: application/json' \
  -d '{"budget":{"defaultTier":"premium"}}' | jq

curl "http://localhost:3000/api/studio/orchestrator/agents/$TEST_ID" | jq '.data.businessFrame.budget.defaultTier'
# 应返回 "premium"

# 错误路径
curl -X POST http://localhost:3000/api/studio/orchestrator/agents/from-spec \
  -H 'Content-Type: application/json' \
  -d '{"industry":"INVALID","scenario":"seeding"}'
# 应返回 400

curl http://localhost:3000/api/studio/orchestrator/agents/NONEXISTENT
# 应返回 404
```

### 3.3 E2E 测试（业务流）
- [ ] 创建智能体（入口 B） → 详情 → 修改 4 对象 → 提交 UGC 任务 → 轮询状态 → 完成
- [ ] 任务失败 → 重试 → 完成
- [ ] 任务确认节点 → 用户确认 → 继续完成

### 3.4 兼容测试
- [ ] 旧版 `/api/studio/skills` 端点仍可用（ugcTaskService 旧路径还在用）
- [ ] `/api/admin/skills` 跨三层 skill 总览正常

---

## 4. 部署 Checklist

### 4.1 Env
```bash
DATABASE_URL=postgresql://...
APP_URL=https://your-domain
GEMINI_API_KEY=***        # 可选
GRSAI_API_KEY=***         # 可选
OPENAI_API_KEY=***        # 可选
MEDIA_PROVIDER=mock|gemini|grsai|local-comfyui
```

### 4.2 数据库
- 跑 `npx prisma db push`（或 migrations）
- 跑 `npx tsx prisma/seed.ts` 初始化 demo 数据

### 4.3 静态资源
- `public/media/` 目录可写（comfyui-skill 生成文件落到这）
- 配 nginx / CDN 服务静态文件

---

## 5. 不属于本 skill 的工作（由对接方自决）

- ❌ 前端 React 组件
- ❌ UI 文案细节
- ❌ 单元/E2E 测试（提供模板，详见 §3）
- ❌ 部署 / CI
- ❌ 用户输入校验规则（推荐用 `data-types.md` §7 zod schema）
- ❌ 实际视频/图片生成（`MEDIA_PROVIDER` 配置决定走哪条路）

---

## 6. 关键不变量

前端做集成时**必须**保证：

1. **业务母句始终显示**：每个智能体必须有 `goal.businessSentence`（新建的有，旧的没填）
2. **4 对象始终可改**：PATCH 永远走 4 业务对象，不直接改 Skill/SkillVersion 表
3. **状态机 5 大类**：前台右栏**不直接露技术态**（status enum），要走映射
4. **artifacts[].url 生成后才填**：未生成时为空，不要预设占位
5. **recoverable 区分**：只有 `recoverable === true` 时才显示「重试」按钮
6. **预算 tier 三档**：basic / standard / premium，前端按此显示徽章颜色

---

## 7. 失败回退

如果 server 启动报错：

1. 检查 `.env` 的 `DATABASE_URL` 是否正确
2. 跑 `docker compose ps` 看 postgres 是否 healthy
3. 跑 `npx prisma db push` 看 schema 是否应用
4. 看 `src/server/db/runtime.ts` 的 `isFallbackAllowed()` —— 如果 fallback 模式启动，DB 不可用，走 memoryStore

如果对接方发现某字段缺失或不显示：

1. 检查 demo seed 是否跑过 `npx tsx prisma/seed.ts`
2. 6 个新视频智能体的 4 业务对象是**新建的**，旧 skill（media-ugc）可能字段缺失
3. 跑 `npx tsx scripts/check_skills.ts` 看 DB 实际内容

---

## 8. 联系

本 skill 仓库：`/Users/feihong/Documents/hellome`

文档位置：
- `docs/superpowers/contracts/README.md` — 入口
- `docs/superpowers/contracts/api-reference.md` — API
- `docs/superpowers/contracts/data-types.md` — 类型
- `docs/superpowers/contracts/status-mapping.md` — 状态机

源代码（不必读，但要找的话）：
- `src/server/agentOrchestratorService.ts` — 数据访问层
- `src/server/skillStudioService.ts` — Skill / SkillVersion CRUD
- `src/server/ugcTaskService.ts` — UGC 任务流程
- `src/server/hermesContract.ts` — Hermes 协议结构化字段
- `src/types/skills.ts` — TypeScript 类型源头
- `src/types/ugc.ts` — 任务 + 暂停 + 恢复类型源头