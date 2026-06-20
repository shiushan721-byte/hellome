# HelloMe × Hermes API、事件回传与数据库增补清单

## 背景

在上一份协议草案中，已经明确了 HelloMe 与 Hermes 的职责边界：

- Web 是账号、词元、任务、发布版 skill 的真相源
- Hermes 是模型调用、本地权限和运行时执行层
- 正式任务只能运行已发布 skill 快照
- Hermes 的学习结果只能回传为待审核 patch

这份文档继续往工程层收紧，目标是直接回答 4 个问题：

1. 当前仓库里已有的服务端骨架应该怎么继续扩
2. Web 和 Hermes 之间到底要交换哪些 API
3. Hermes 必须回传哪些结构化事件
4. 数据库现在缺什么字段和表

## 适用范围

本期只围绕：

- `HelloMe 视频智能体`
- `Creator Studio -> 调试 -> 发布 -> 用户运行`
- `Hermes 本地执行`

不扩展到：

- 多品类智能体生态
- 多 provider 高阶编排器
- 完整长期计费系统
- 复杂多租户权限系统

## 一. 当前仓库里的现有基础

基于当前代码，已经存在这些可继续沿用的服务端对象：

### 1. 任务执行层

- [src/server/ugcTaskService.ts](/Users/feihong/Documents/hellome/src/server/ugcTaskService.ts)
- [src/server/hermesContract.ts](/Users/feihong/Documents/hellome/src/server/hermesContract.ts)
- [src/server/taskStateMachine.ts](/Users/feihong/Documents/hellome/src/server/taskStateMachine.ts)
- [src/server/taskPresenter.ts](/Users/feihong/Documents/hellome/src/server/taskPresenter.ts)

### 2. Hermes 配对与运行时

- [src/server/hermesPairingService.ts](/Users/feihong/Documents/hellome/src/server/hermesPairingService.ts)
- [src/lib/hermesConnection.ts](/Users/feihong/Documents/hellome/src/lib/hermesConnection.ts)
- [src/lib/taskApi.ts](/Users/feihong/Documents/hellome/src/lib/taskApi.ts)

### 3. 计费与数据库

- [src/server/billingService.ts](/Users/feihong/Documents/hellome/src/server/billingService.ts)
- [prisma/schema.prisma](/Users/feihong/Documents/hellome/prisma/schema.prisma)

### 4. 当前已经存在的基础模型

当前 schema 已经具备：

- `User`
- `Task`
- `TaskInput`
- `TaskRun`
- `TaskStep`
- `TaskEvent`
- `TaskArtifact`
- `HermesExecution`
- `UsageLedger`
- `HermesDevice`
- `Skill`
- `SkillVersion`
- `SkillDebugRun`

这意味着：

- 任务系统底座不是问题
- 版本系统底座不是问题
- 现在缺的是“运行协议”和“精确回传”

## 二. 工程目标

这一轮工程协议不追求一步到位做出完整视频平台，而是要先让下面这条链路具备真实性：

1. 创作者在 Web 侧编辑 / 调试视频智能体
2. Web 按已发布 skill 版本创建任务
3. Hermes 获取执行授权并运行该版本
4. Hermes 结构化回传事件、用量、产物和中断信息
5. Web 落库、展示、结算并保留版本一致性

## 三. 系统分层

### 1. Web API 层

负责：

- 账号与配对状态
- skill 版本查询
- 任务创建
- 执行授权下发
- 事件接收
- 用量结算
- patch 提案接收

### 2. Hermes Runtime 层

负责：

- 校验设备与账户
- 拉取 skill 快照
- 校验 checksum
- 本地安装或命中缓存
- 执行 provider / 本地工具 / 浏览器能力
- 回传结构化事件

### 3. Data 层

负责：

- published skill 存档
- debug run 存档
- task execution 存档
- usage 对账
- patch review 流转

## 四. 核心 API 分组

建议把后续接口分成 5 组。

### A. 配对与设备状态

#### `GET /api/hermes/pairing/status`

当前已存在前端调用：

- [src/lib/hermesConnection.ts](/Users/feihong/Documents/hellome/src/lib/hermesConnection.ts)

建议保留，并把返回结构收敛为：

```json
{
  "success": true,
  "data": {
    "status": "connected",
    "device": {
      "id": "device_xxx",
      "deviceName": "Hermes.app",
      "os": "macos",
      "version": "0.2.3",
      "runtimeChannel": "stable",
      "capabilities": ["browser_automation", "file_access"],
      "lastSeenAt": "2026-06-20T10:00:00.000Z"
    }
  }
}
```

#### `POST /api/hermes/pairing/local-pair`

当前也已存在。

建议增加：

- 设备注册
- runtime channel
- capability snapshot

#### `POST /api/hermes/pairing/disconnect`

当前也已存在。

建议在服务端同时：

- 更新 `HermesDevice.status`
- 失效所有未完成 execution grant

### B. Skill 版本分发

#### `GET /api/skills/:skillId/published-runtime`

用途：

- Hermes 获取正式运行的已发布版本快照

请求参数：

- `skillId`
- `version` 可选
- `accountId`
- `deviceId`

返回建议：

```json
{
  "success": true,
  "data": {
    "skillId": "skill_xxx",
    "slug": "media-ugc",
    "versionNumber": 3,
    "versionLabel": "v0.3.0",
    "checksum": "sha256:xxxx",
    "executionManifest": {},
    "modelPolicy": {},
    "publishedAt": "2026-06-20T12:00:00.000Z"
  }
}
```

#### `GET /api/skills/:skillId/draft-runtime`

用途：

- 创作者调试 draft 版本时给 Hermes 拉取

限制：

- 只有 creator 可用
- 不允许普通用户正式任务使用

### C. 执行授权

#### `POST /api/execution-grants`

用途：

- Web 为单次任务生成短期执行授权

请求：

```json
{
  "taskId": "task_xxx",
  "skillId": "skill_xxx",
  "skillVersionId": "version_xxx",
  "deviceId": "device_xxx"
}
```

返回：

```json
{
  "success": true,
  "data": {
    "grantId": "grant_xxx",
    "token": "short_lived_token",
    "expiresAt": "2026-06-20T12:10:00.000Z",
    "allowedProviders": ["openrouter"],
    "allowedModels": ["model_a", "model_b"],
    "tokenBudgetMax": 30000
  }
}
```

#### `POST /api/execution-grants/:id/revoke`

用途：

- 任务取消
- 设备异常
- 高风险中断

### D. 任务调度与回传

#### `POST /api/tasks/ugc`

当前前端已存在调用：

- [src/lib/taskApi.ts](/Users/feihong/Documents/hellome/src/lib/taskApi.ts)

建议继续作为普通用户创建视频任务的主入口。

新增约束：

- 创建时必须绑定 `skillId` 和 `publishedVersion`
- 如果没有已发布版本，不允许普通用户正式执行

#### `POST /api/tasks/:id/runtime-dispatch`

用途：

- Web 在完成冻结 / 校验后，给 Hermes 下发正式执行包

这一步可以由：

- 服务端主动推
- 或 Hermes 轮询拉取

第一阶段推荐：

- Hermes 轮询拉取，工程复杂度更低

#### `POST /api/tasks/:id/events`

用途：

- Hermes 回传结构化事件

说明：

- 这是后续最核心接口之一
- 不能只是日志文本堆积
- 必须承载状态机流转

#### `POST /api/tasks/:id/artifacts`

用途：

- Hermes 回传产物索引

不是直接传大文件，而是：

- 文件标识
- URL
- mimeType
- size
- metadata

#### `POST /api/tasks/:id/usage`

用途：

- Hermes 回传本任务真实模型调用用量

这一步应由 `provider_usage_reported` 事件触发，也可单独拆接口。

第一阶段建议：

- 保留独立接口，便于对账

### E. Creator Patch / 调试接口

#### `POST /api/skills/:skillId/patch-proposals`

用途：

- Hermes 在调试后回传优化建议

#### `GET /api/skills/:skillId/patch-proposals`

用途：

- Creator Studio 拉取可审核 patch

#### `POST /api/skills/:skillId/patch-proposals/:patchId/apply`

用途：

- 把 patch 应用成新 draft version

## 五. Hermes 事件总线格式

当前 [src/server/hermesContract.ts](/Users/feihong/Documents/hellome/src/server/hermesContract.ts) 已经规范了：

- `runState`
- `pauseReasonType`
- `pauseReasonMessage`
- `resumeMode`
- `recoverable`
- `artifactsPreserved`
- `costStatus`

这是很好的起点，但还不够驱动完整商业链路。

建议把 Hermes 回传事件统一成：

```ts
type HermesTaskEventEnvelope = {
  taskId: string;
  executionId: string;
  eventId: string;
  eventType: string;
  createdAt: string;
  payload: Record<string, unknown>;
};
```

### 1. 必需事件

#### `task_received`

表示 Hermes 已接单。

payload 建议：

- `deviceId`
- `skillId`
- `skillVersion`
- `checksumMatched`

#### `skill_resolved`

表示已解析到目标 skill 版本。

payload：

- `skillId`
- `skillVersionId`
- `checksum`
- `source` = `cache | downloaded`

#### `skill_install_started`

#### `skill_install_completed`

用于判断首次安装、更新安装、失败安装。

#### `step_started`

payload：

- `stepKey`
- `stepTitle`
- `stepOrder`

#### `step_completed`

payload：

- `stepKey`
- `tokenUsed`
- `durationMs`

#### `waiting_confirmation`

payload：

- `reasonType`
- `reasonMessage`
- `estimatedTokenMin`
- `estimatedTokenMax`
- `provider`
- `model`
- `willChargeAgain`

#### `provider_called`

payload：

- `provider`
- `model`
- `requestId`
- `stepKey`

#### `provider_usage_reported`

payload：

- `provider`
- `model`
- `requestId`
- `promptTokens`
- `completionTokens`
- `totalTokens`
- `estimatedCost`
- `currency`
- `stepKey`

#### `artifact_created`

payload：

- `artifactType`
- `fileName`
- `url`
- `mimeType`
- `sizeBytes`

#### `task_interrupted`

payload：

- `pauseReasonType`
- `pauseReasonMessage`
- `resumeMode`
- `recoverable`
- `artifactsPreserved`
- `willChargeAgain`

#### `task_failed`

payload：

- `errorCode`
- `message`
- `retryable`

#### `task_completed`

payload：

- `totalTokens`
- `artifactsCount`
- `durationMs`

### 2. 可选事件

#### `preview_progressed`

用于右侧展示舞台更新。

#### `patch_suggested`

用于调试中途生成建议，但不立即入生产。

## 六. Task 状态机与事件映射

建议把前台任务状态和 Hermes 事件做固定映射。

### Web 可展示状态

- `draft`
- `queued`
- `running`
- `waiting_confirmation`
- `completed`
- `failed`
- `cancelled`

### Hermes 事件到 Web 状态的映射

- `task_received` -> `queued -> running`
- `step_started` -> `running`
- `waiting_confirmation` -> `waiting_confirmation`
- `task_interrupted` 且 `recoverable=true` -> `failed` 但展示为可恢复
- `task_failed` -> `failed`
- `task_completed` -> `completed`

### 额外判断

如果 Hermes 回传：

- `pauseReasonType=context_limit`
- `resumeMode=require_creator_fix`

则前台必须标记为：

- 不能仅用户重试
- 需要 Creator Studio 介入

## 七. 数据库增补建议

下面的建议分为：

- 新增表
- 增补字段

## 八. 新增表建议

### 1. `ExecutionGrant`

用途：

- 记录一次任务授权给某个 Hermes 设备执行的短期凭据

建议字段：

- `id`
- `taskId`
- `skillId`
- `skillVersionId`
- `deviceId`
- `grantTokenHash`
- `allowedProviders`
- `allowedModels`
- `tokenBudgetMax`
- `expiresAt`
- `revokedAt`
- `createdAt`

### 2. `SkillPatchProposal`

用途：

- 存 Hermes 的学习结果和优化建议

建议字段：

- `id`
- `skillId`
- `baseVersionId`
- `sourceDebugRunId`
- `summary`
- `patchType`
- `reason`
- `confidence`
- `beforeSnapshot`
- `afterSnapshot`
- `status`
- `reviewedBy`
- `reviewedAt`
- `createdAt`

### 3. `SkillInstallReceipt`

用途：

- 记录某设备安装过哪个 skill 版本

建议字段：

- `id`
- `deviceId`
- `skillId`
- `skillVersionId`
- `checksum`
- `installSource`
- `installedAt`
- `lastVerifiedAt`

### 4. `ProviderUsageRecord`

用途：

- 精确记录 provider 调用

建议字段：

- `id`
- `taskId`
- `executionId`
- `stepKey`
- `provider`
- `model`
- `requestId`
- `promptTokens`
- `completionTokens`
- `totalTokens`
- `estimatedCost`
- `currency`
- `createdAt`

## 九. 增补字段建议

### 1. `SkillVersion`

建议新增：

- `checksum String`
- `sourceType String?`
- `baseVersionId String?`
- `runtimeManifest Json?`
- `modelPolicy Json?`

### 2. `HermesExecution`

建议新增：

- `skillId String?`
- `skillVersionId String?`
- `skillChecksum String?`
- `deviceId String?`
- `providerSummary Json?`
- `grantId String?`

### 3. `HermesDevice`

建议新增：

- `runtimeChannel String?`
- `capabilitySnapshot Json?`
- `lastSkillSyncAt DateTime?`
- `lastHeartbeatAt DateTime?`

### 4. `UsageLedger`

建议新增：

- `providerCost String?`
- `reservedAmount String?`
- `settledAt DateTime?`
- `refundReason String?`

### 5. `Task`

建议新增：

- `skillId String?`
- `skillVersionId String?`
- `executionGrantId String?`
- `lastHeartbeatAt DateTime?`

## 十. 与现有文件的具体映射

### 1. `src/server/hermesContract.ts`

当前职责：

- 规范 Hermes 中断结构

建议扩展为：

- Hermes 事件 envelope 校验器
- provider usage payload 校验器
- patch proposal payload 校验器

### 2. `src/server/ugcTaskService.ts`

当前职责：

- 创建任务
- 维护内存 fallback
- 推进 UGC 任务状态

建议扩展为：

- 绑定 published skill version
- 发放 execution grant
- 接收 Hermes event
- 接收 usage report
- 写入 ProviderUsageRecord

### 3. `src/server/billingService.ts`

当前职责：

- 汇总 token 使用

建议扩展为：

- 预冻结
- 结算
- 退款
- 高成本确认前余额检查

### 4. `src/server/hermesPairingService.ts`

当前职责：

- 本地 Hermes 配对检测

建议扩展为：

- 设备注册落库
- runtime channel 记录
- capability snapshot 回写
- 设备离线心跳管理

## 十一. 第一阶段最小可跑实现

为了不把 demo 做成无限工程，建议按下面顺序推进。

### Step 1. 先做版本不漂移

最小要求：

- `Task` 绑定 `skillId + skillVersionId`
- `SkillVersion` 增加 `checksum`
- Hermes 拉取 skill 时做 checksum 校验

只要这一步做了，就先挡住了最大商业风险。

### Step 2. 再做 execution grant

最小要求：

- 任务启动前生成短期授权
- Hermes 带授权执行
- 中止时授权失效

### Step 3. 再做 usage 回传

最小要求：

- `provider_usage_reported`
- `ProviderUsageRecord`
- `UsageLedger` 更新

### Step 4. 再做 patch proposal

最小要求：

- Hermes 调试后回传 patch
- Creator Studio 可查看
- Creator 可应用成新 draft

## 十二. Demo 阶段允许的简化

允许简化：

- provider 先只接一个
- execution grant 先不做复杂签名，只做短期 token
- artifact 先存本地路径或临时 URL
- heartbeat 先用轮询

不建议继续简化的点：

- 不能没有 `skillVersion + checksum`
- 不能让正式任务直接跑 draft
- 不能让 Hermes 学习结果自动改线上
- 不能只存自然语言日志、不存结构化事件

## 结论

如果只看“能不能跑 demo”，现在的仓库已经有 60% 的基础。

真正还缺的是这几条工程硬约束：

1. `published skill snapshot` 的强绑定
2. `execution grant` 的执行授权
3. `provider usage` 的精确回传
4. `patch proposal` 的学习结果审核化

把这四个点补上之后，HelloMe 的链路就不再只是：

- 前端有页面
- Hermes 能跑点东西

而会升级成：

- 创作者能打磨智能体
- 用户能稳定使用已发布版本
- Hermes 能执行并回传真实状态
- 平台能对账、能回滚、能持续优化
