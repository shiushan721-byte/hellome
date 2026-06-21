# HelloMe 智能体工坊 — Skill 交付包

> 本目录是服务器侧 skill 团队的对外契约。
> 前端 agent / 测试 agent 看完这 5 份文档就能开工。

---

## 快速导航

| 文档 | 适合谁 | 内容 |
|---|---|---|
| **[README.md](./README.md)** | 所有人 | 总览：4 业务对象模型 + 词汇表 + 状态机 + 5 大类 + 集成边界 |
| **[api-reference.md](./api-reference.md)** | 前端 / 测试 | 完整端点清单 + 请求/响应示例 + curl 模板 |
| **[data-types.md](./data-types.md)** | 前端 | TypeScript 类型全集 + zod schema + 集成示例代码 |
| **[status-mapping.md](./status-mapping.md)** | 前端 | 状态机映射 + 前台 5 大类文案 + Hermes 回包字段语义 |
| **[integration-checklist.md](./integration-checklist.md)** | 集成 / 测试 | 集成清单 + 测试模板 + 失败回退 |
| **[admin-skills.md](./admin-skills.md)** | 前端 / ops | `/api/admin/skills` 跨三层 skill 总览契约 |
| **[audio-extension.md](./audio-extension.md)** | 后端 / 第三方 | **音频 / 配音 / 唇同步 扩展契约（Phase A1 TTS ✅ 完成）** |

---

## 阅读顺序建议

**前端 agent（接需求 5 分钟读完）**：
1. `README.md` — 知道 4 业务对象 + 5 大类
2. `data-types.md` — copy 类型到项目
3. `api-reference.md` — 看端点形状
4. `status-mapping.md` — 看状态机映射
5. `integration-checklist.md` §2 — 按顺序做集成

**测试 agent（接需求 3 分钟读完）**：
1. `api-reference.md` §1 + §6 — 端点 + curl 模板
2. `integration-checklist.md` §3 — 测试模板

**ops / debug agent（接需求 2 分钟读完）**：
1. `admin-skills.md` — 跨三层 skill 列表
2. `README.md` §3 — 状态机
3. `integration-checklist.md` §4 — 部署清单

---

## 服务器侧 skill 范围

**本 skill 团队负责**（已完成）：
- ✅ 数据模型（4 业务对象）
- ✅ 词汇表（6 行业 × 6 场景）
- ✅ REST API（5 orchestrator + 5 admin/legacy + 6 task）
- ✅ 持久化（PostgreSQL via Prisma）
- ✅ Demo seed（6 视频智能体）
- ✅ 本契约文档

**对接方负责**：
- 前端 React 组件 / 路由 / 状态管理
- UI 文案细节 / 动效
- 单元 / E2E 测试
- 部署 / CI

---

## 已交付功能清单

### 数据
- `src/types/skills.ts` — SkillRecord + SkillVersionRecord + SkillBusinessFrame（含 goal/budget/executionPlan/result 四对象）
- `src/types/ugc.ts` — TaskStatus / UgcTaskArtifact / UgcTaskEvent / pauseReason / resumeMode

### 服务
- `src/server/agentOrchestratorService.ts` — getAgentView / listAgentViews / updateAgentBusinessFrame / createAgentFromSpec
- `src/server/skillStudioService.ts` — Skill / SkillVersion CRUD + 持久化
- `src/server/ugcTaskService.ts` — UGC 任务状态机
- `src/server/adminSkillService.ts` — 三层 skill 总览

### API
- `GET  /api/studio/orchestrator/vocabularies`
- `GET  /api/studio/orchestrator/agents`
- `POST /api/studio/orchestrator/agents/from-spec`
- `GET  /api/studio/orchestrator/agents/:agentId`
- `PATCH /api/studio/orchestrator/agents/:agentId/business`
- `GET  /api/admin/skills?layer=&q=`
- `GET  /api/studio/skills/:skillId` (legacy)
- `POST /api/tasks/ugc`
- `GET  /api/tasks/:id`
- `POST /api/tasks/:id/{confirm,cancel,retry}`

### Demo
- 6 个视频智能体 seed（产品种草/测评讲解/带货转化/宣传介绍/演示视频/客户提案）
- 1 个默认 media-ugc（兼容旧版）

---

## 版本

- 文档版本：1.0（2026-06-20）
- 对应 skill 代码版本：基于设计稿 `2026-06-20-creator-skill-orchestrator-design.md`

---

## 相关链接

- 设计稿：`docs/superpowers/specs/2026-06-20-creator-skill-orchestrator-design.md`
- 仓库：`/Users/feihong/Documents/hellome`