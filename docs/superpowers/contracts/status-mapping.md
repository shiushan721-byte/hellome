# 状态机映射参考

> 任务状态 + Hermes 回包 → 前台 5 大类外显。
> 阅读本文请配合 `README.md` §4 + 设计稿原文。

---

## 1. 状态机全景

```
┌─────────────────────────────────────────────────────────────────┐
│ 前台 5 大类（用户外显）                                          │
└─────────────────────────────────────────────────────────────────┘

   待开始 ──submit──> 自动推进中 ──stage.confirm──> 待确认
                       │                              │
                       └──stage.auto──┐               │
                                       ▼               ▼
                                     准备执行 ──> 生成中 ──> 整理中 ──> 已完成
                                                                    │
                                                  failed/timeout ──> 已中断待恢复


┌─────────────────────────────────────────────────────────────────┐
│ 内部 TaskStatus（8 类）                                          │
└─────────────────────────────────────────────────────────────────┘

   draft → queued → running → waiting_confirmation → running → ...
                        │                                       │
                        ├─ completed                             │
                        ├─ failed ──(retryable)─> queued         │
                        └─ cancelled                             │
```

---

## 2. 前台 5 大类文案（设计稿规定）

### 2.1 待开始
**触发**：`status === 'draft'` 或 `'queued'`

**前台文案**：
- 标题：「准备开始」
- 副文案：「已收到你的输入，正在准备为你推进」
- 主动作：`开始生成`
- 次动作：`取消`

### 2.2 自动推进中
**触发**：`status === 'running'` + 当前 stage.kind === 'auto'

**前台文案（按 stage 切换）**：
- understand：「正在为你规划」
- structure：「组织交付方式中」
- draft：「生成前台草稿」
- refine：「优化结果表达」
- publish：「正在发布」
- (Wan 2.2 视频生成)：「生成中（视频）」
- (整理交付)：「整理中」

### 2.3 待确认
**触发**：`status === 'running'` + 当前 stage.kind === 'confirm'，或 `status === 'waiting_confirmation'`

**前台文案**：
- 标题：「需要你确认后继续」
- 副文案：直接显示 `pauseReasonMessage`（如「即将开始正式视频生成，预计消耗 13800 tokens」）
- 主动作：`确认继续`
- 次动作：`继续调整` / `先保存`

### 2.4 已中断待恢复
**触发**：`status === 'failed'` + `recoverable === true`，或 `status === 'cancelled'`

**前台文案**：
- 标题：「可从上一步恢复」
- 副文案：显示 `pauseReasonMessage`（如「执行中断：模型返回错误」）
- 列出 `artifactsPreserved`（已保留的中间产物）
- 显示 `willChargeAgain` 字段（是否重复计费）
- 主动作：`从这里继续` / `重试这一段`
- 次动作：`补充信息后继续` / `切换为人工调试`

### 2.5 已完成
**触发**：`status === 'completed'`

**前台文案**：
- 标题：「结果已就绪」
- 副文案：显示 deliverable summary
- 主动作：`查看结果` / `继续优化`
- 次动作：`生成同款` / `沉淀为展示案例`

---

## 3. 前台 → 内部 → 实际事件映射表

| 前台 5 大类 | TaskStatus 取值 | 触发条件（Hermes 回包） | events 特征 |
|---|---|---|---|
| 待开始 | `draft` / `queued` | user 提交后未开始 | `level: 'info', message: '已提交'` |
| 自动推进中 | `running` | currentStage.kind === 'auto' | 含 "正在为你规划" / "生成中" 等文案 |
| 待确认 | `running` + `pauseReasonType === 'confirmation'` | `pauseReasonType === 'confirmation'` | 含 "需要你确认" |
| 已中断待恢复 | `failed` + `recoverable === true` | `pauseReasonType === 'context_limit' \| 'provider_error' \| 'timeout'` | 含 "可恢复" |
| 已完成 | `completed` | 全部 stage 完成 | 含 "结果已就绪" |

**注意**：`currentStageKind` 当前**不直接暴露**在 task API —— 前端需要从 agent.businessFrame.executionPlan.stages 自己推断（按 events 顺序匹配 stage）。

---

## 4. Hermes 回包结构化字段

`/api/tasks/:id` 返回的 `task` 字段包含 Hermes 执行层的结构化结果：

```ts
{
  status: TaskStatus,
  pauseReasonType?: 'confirmation' | 'context_limit' | 'provider_error' | 'missing_input' | 'timeout' | null,
  pauseReasonMessage?: string | null,
  resumeMode?: 'continue' | 'retry_step' | 'require_input' | 'require_creator_fix' | null,
  recoverable?: boolean,
  artifactsPreserved?: string[],     // ['script.md', 'cover-frame.png']
  willChargeAgain?: boolean | null,
  showcaseStage?: unknown,           // 调试快照
}
```

### 4.1 pauseReasonType 语义

| 取值 | 触发场景 | 前台应对 |
|---|---|---|
| `confirmation` | 高成本正式生成前 / 方向可能跑偏前 | 弹确认卡，CTA = `确认继续` |
| `context_limit` | 上下文窗口已满 | 提示「可开启新一轮续跑」 |
| `provider_error` | 模型服务失败 | 提示「稍后重试」 |
| `missing_input` | 素材不足 | 提示「补充信息」 |
| `timeout` | 执行超时 | 提示「可从这里继续」 |

### 4.2 resumeMode 语义

| 取值 | 含义 | 前台 CTA |
|---|---|---|
| `continue` | 可直接继续 | `从这里继续` |
| `retry_step` | 重试当前 stage | `重试这一段` |
| `require_input` | 需要补充输入 | `补充信息后继续` |
| `require_creator_fix` | 需回工坊改智能体 | `切换为人工调试` |

### 4.3 商业化 4 问（前台必须回答）

> 设计稿要求：不论确认还是中断，前台必须能回答这 4 问。

1. **为什么停了？** → `pauseReasonMessage`
2. **停在了哪？** → `status` + 最新 `events[].stepIndex` + 当前 stage
3. **能不能继续？** → `recoverable` + `resumeMode`
4. **之前的结果还能不能用？** → `artifactsPreserved` + `willChargeAgain`

---

## 5. 前端实现建议

### 5.1 右栏展示位布局（设计稿 S0-S5）

```
┌─────────────────────────────────────┐
│  [主舞台卡]                          │  ← AgentStage（封面 + 标题 + 副文案 + 标签）
│  - 智能体名称                       │
│  - 一句话结果承诺                    │
│  - 主视觉案例（默认 / 真实）        │
│  - 标签 × 3                         │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│  [结果商品条]                        │  ← OutcomeBar（场景 + 交付 + 成本档位）
│  适合做什么 × 3                      │
│  通常交付什么 × 4                    │
│  成本属于哪档                         │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│  [执行状态轨]                        │  ← ExecutionTrack（5 状态推进）
│  ● 待开始   ○ 自动推进中   ○ 待确认   ○ 已中断   ○ 已完成 │
└─────────────────────────────────────┘
```

### 5.2 状态切换动效（设计稿要求）

- 大切换**只允许在 S2 → S3 发生一次**（即等待确认 → 自动推进）
- 其他过渡走轻动画（200-300ms）
- 静态底座不能死图：主舞台有"轻微呼吸"（透明度 / scale 极小幅波动）

### 5.3 营销录屏友好规则

- 15 秒内能录到 2-3 次明显状态变化
- 首屏任意时刻截图都不能丑
- 没有 Hermes 返回时也能录出"准备开始"的氛围

---

## 6. 状态机代码参考

服务器侧：`src/server/taskStateMachine.ts` (`deriveTaskRunState`)
Hermes 协议：`src/server/hermesContract.ts`

前端实现时可直接复用 `src/types/ugc.ts` 的 `UgcTaskPauseReasonType` / `UgcTaskResumeMode` / `TaskStatus` 等枚举（已 export）。