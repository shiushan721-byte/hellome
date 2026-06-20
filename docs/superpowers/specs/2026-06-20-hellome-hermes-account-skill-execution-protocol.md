# HelloMe × Hermes 账户、Skill 与执行回传协议草案

## 背景

HelloMe 当前已经明确了第一阶段的真实产品方向：

- 前台卖的是 `视频智能体`
- 普通用户在 `我的工作台` 使用智能体
- 创作者在 `HelloMe 智能体工坊` 生产和优化智能体
- Hermes 负责 AI 执行、本地权限和模型调用

同时，当前也已经暴露出一个关键风险：

- 如果让 Hermes 既负责执行，又直接负责“改写生产中的 skill”，那么线上前台、创作者调试结果和最终交付结果会逐步失真

因此，这份协议的目标不是讨论页面，而是定义：

1. 账号与词元如何统一
2. API key 和模型权限应该放在哪里
3. skill 的真相源到底是谁
4. Hermes 如何安装、执行和回传 skill
5. Hermes 的学习结果如何变成“可审核优化”，而不是“线上漂移”

## 目标

这份协议只解决第一阶段 `HelloMe 视频智能体` 的执行一致性问题。

重点要保证：

1. 创作者调试通过的智能体，普通用户正式运行时仍然是同一个逻辑
2. Hermes 可以继续承担 AI 层和本地执行层
3. Web 可以继续承担账号、任务、计费、展示和发布层
4. Hermes 的学习能力不会直接污染线上已发布 skill
5. 任务消耗、模型调用和交付回传可以对账

## 非目标

这份协议不覆盖：

- 完整 provider 选型结论
- 视频模型质量评测方法
- 多租户 creator marketplace
- 通用 workflow builder
- 长期对象存储与冷存策略细节

## 一. 顶层职责划分

### 1. HelloMe Web

HelloMe Web 是以下内容的唯一真相源：

- 用户账号
- 词元账户
- 钱包与使用台账
- 已发布 skill 版本
- 任务单与任务状态
- 交付资产索引
- 创作者调试记录

Web 不直接承担：

- 最终模型推理
- 本地权限调用
- 浏览器自动化
- 设备级 AI 运行时

### 2. Hermes

Hermes 是运行时和执行器，负责：

- 拉取已授权的发布版 skill
- 安装或缓存 skill 运行快照
- 调用模型与工具
- 处理本地文件、浏览器、桌面环境
- 上报任务事件、用量和产物结果
- 在调试中提出 skill 优化建议

Hermes 不是：

- 生产 skill 的最终真相源
- 线上发布中心
- 钱包与计费的最终真相源

### 3. Creator Studio

Creator Studio 是创作者和 Hermes 共同打磨智能体的工作台。

它负责：

- 组织业务目标
- 发起调试
- 查看调试结果
- 审核 Hermes 返回的优化建议
- 生成新的 draft 版本
- 发布新版本

它不应该直接绕过版本体系，把本地学习结果直接变成线上结果。

## 二. 核心判断

### 1. 三端可以共用一个 HelloMe 账户

可以共用同一个 HelloMe 账户体系：

- Web
- Creator Studio
- Hermes

这样做的好处是：

- 用户身份统一
- 词元账户统一
- 任务归属统一
- 设备与调试记录可追踪

### 2. 三端不应该长期共用同一个明文 API key

第一阶段 demo 可以临时这么做，但正式链路不建议这么做。

原因：

- 本地设备容易泄露 key
- 用户能脱离平台直接复用 key
- 多设备共享长期 key 难以做细粒度风控
- 无法限制某次任务只访问允许的模型集合

因此推荐结构为：

- Web 保存主授权关系
- Hermes 每次执行前向 Web 申请一次短期执行授权
- Hermes 只拿到本任务所需的最小模型权限

### 3. 已发布 skill 只能从 Web 数据库发版

线上任务只能运行：

- Web 中存在的
- 已发布的
- 有版本号的
- 有 checksum 的
- 可回滚的 skill 快照

这条必须是商业化铁律。

## 三. Skill 三层模型

为避免 Hermes 自学习导致生产漂移，skill 必须拆成三层：

### 1. Published Skill

这是对外正式运行版本。

特征：

- 存在于 Web 数据库
- 绑定 `skillId + versionNumber + checksum`
- 只能由创作者发布产生
- 普通用户正式任务只可运行这个版本

### 2. Runtime Overlay

这是 Hermes 本地运行时附着层。

包含：

- 本地缓存
- 工具执行偏好
- 临时素材路径
- 设备能力差异
- 非结构化短期记忆

它可以影响运行效率，但不能改写 published skill 本体。

### 3. Learned Patch

这是 Hermes 在调试或运行中沉淀出的优化建议。

它不是立即生效版本，而是：

- 一份 patch
- 一份结构化建议
- 一份待审核改写

它只能进入：

- `draft`
- `review`
- `accepted -> new version`
- `rejected`

不能直接跳过 Creator Studio 进入生产。

## 四. 版本一致性规则

### 1. 正式任务只按版本快照运行

Web 派发任务给 Hermes 时，不发送“请运行某个 skill 名字”，而发送：

- `skill_slug`
- `skill_version`
- `skill_checksum`
- `execution_manifest`

Hermes 收到后先做本地判断：

1. 本地是否已有相同 `version + checksum`
2. 如果有，直接运行
3. 如果没有，先下载安装该快照
4. 如果 checksum 不匹配，拒绝执行并回传异常

### 2. 创作者调试与用户正式运行必须分流

创作者调试可以运行：

- draft skill
- test overlay
- learned patch

普通用户正式运行只能运行：

- latest published skill snapshot

### 3. 任何“自学习改写”必须显式落成新版本

Hermes 调试后如果认为：

- 业务目标理解更准了
- 步骤更合理了
- 模型路线更优了
- 提示词结构更稳了

只能把这些内容作为 patch 回传 Web。

Web 再决定：

- 是否生成新的 draft version
- 是否允许创作者合并
- 是否发布为 `vNext`

## 五. 账户、词元与授权协议

### 1. 账户统一

HelloMe 账户应作为三端统一身份：

- `user.externalId`
- email / phone
- workspace
- creator role / consumer role

Hermes 配对后，本质上是：

- `HelloMe User <-> Hermes Device`

当前库里已有：

- `User`
- `HermesDevice`

这条方向是对的。

### 2. 词元账户统一

词元余额应只认 Web 钱包。

原因：

- 最终计费台账要能对账
- 顶栏显示、账单、冻结、退款都要统一
- Hermes 只能上报真实消耗，不适合做最终余额真相源

### 3. 推荐授权方式

推荐增加一层 `Execution Grant` 概念。

一次任务执行时：

1. Web 校验用户账户和余额
2. Web 冻结本次任务允许消耗额度
3. Web 向 Hermes 下发短期授权
4. Hermes 用短期授权换取可调用模型配置
5. 任务完成后 Hermes 回传真实消耗
6. Web 执行结算 / 退款 / 差额冻结释放

### 4. 第一阶段 demo 允许的简化

如果为了尽快跑通 demo，可以先做：

- 账户在 Web 登录
- Hermes 用同一账户配对
- Hermes 执行时从 Web 拉取模型配置
- Web 先信任 Hermes 的 usage 回传

但必须在代码和文档中明确：

- 这是 demo 授权方案
- 不是正式生产授权方案

## 六. Skill 下发与安装协议

### 1. Web 到 Hermes 的下发内容

最小下发包建议包含：

- `task_id`
- `skill_id`
- `skill_slug`
- `skill_version`
- `skill_checksum`
- `execution_manifest`
- `task_input_payload`
- `model_policy`
- `execution_grant`

### 2. execution_manifest 内容

建议至少包含：

- 智能体的业务目标摘要
- 输入结构定义
- 允许使用的模型组
- 默认执行链
- 确认节点规则
- 高成本步骤声明
- 交付物定义
- 事件回传要求

### 3. Hermes 本地安装逻辑

Hermes 本地对 skill 的处理建议为：

1. 查缓存
2. 校验 checksum
3. 不存在则安装
4. 存在旧版但 checksum 不同则强制替换或并存版本目录
5. 安装成功后才允许进入执行

不要只按 skill 名称覆盖安装，否则必然出现：

- 本地新版覆盖线上旧版
- 调试版污染生产版
- 执行结果无法复现

## 七. Hermes 学习与回传协议

### 1. Hermes 可以学习，但不能直接改生产

Hermes 的自主进化能力是加分项，但只能工作在：

- 本地调试
- 试运行
- patch 建议

不能直接工作在：

- 已发布 skill 的生产执行

### 2. Hermes 应回传结构化 patch

建议新增一类回传对象：

- `SkillPatchProposal`

最小字段建议：

- `skillId`
- `baseVersion`
- `patchType`
- `summary`
- `changedBlocks`
- `beforeSnapshot`
- `afterSnapshot`
- `reason`
- `confidence`
- `sourceRunId`

### 3. patchType 建议

- `goal_refine`
- `input_refine`
- `execution_refine`
- `model_policy_refine`
- `confirmation_rule_refine`
- `artifact_refine`

### 4. Web 侧处理

Web 收到 patch 后：

1. 存为待审核建议
2. 允许创作者预览差异
3. 允许一键合并为 draft
4. 允许拒绝
5. 允许基于 patch 创建新版本

## 八. 任务执行与用量回传协议

### 1. 任务状态真相源

任务状态的真相源仍然应是 Web 数据库。

Hermes 负责上报，Web 负责落库和对外展示。

当前已有数据模型基础：

- `Task`
- `TaskRun`
- `TaskStep`
- `TaskEvent`
- `TaskArtifact`
- `HermesExecution`
- `UsageLedger`

方向是正确的。

### 2. Hermes 至少要回传这些事件

- `task_received`
- `skill_resolved`
- `skill_installed`
- `step_started`
- `step_completed`
- `waiting_confirmation`
- `provider_called`
- `provider_usage_reported`
- `artifact_created`
- `task_failed`
- `task_completed`

### 3. provider_usage_reported 最小字段

- `provider`
- `model`
- `request_id`
- `prompt_tokens`
- `completion_tokens`
- `total_tokens`
- `estimated_cost`
- `currency`
- `step_key`

### 4. Web 如何处理回传

Web 接收后要同步写入：

- `TaskEvent`
- `TaskStep.tokenUsed`
- `Task.currentTokenUsed`
- `Task.tokenUsed`
- `UsageLedger`
- `HermesExecution.metadata`

这样顶栏词元、任务详情和账单才能对上。

## 九. 高成本确认与恢复机制

视频任务不是所有步骤都应该静默推进。

### 1. 高成本前必须停顿

当 Hermes 进入高成本视频生成前，必须回传：

- `waiting_confirmation`
- 预计成本区间
- 本轮将调用的模型
- 是否会再次收费

Web 再决定：

- 用户确认继续
- 服务商人工兜底修改
- 取消

### 2. 可恢复中断要显式结构化

Hermes 如果中断，不应只回传一段报错文本，而应回传：

- `recoverable`
- `pauseReasonType`
- `pauseReasonMessage`
- `resumeMode`
- `artifactsPreserved`
- `willChargeAgain`

这样前台才能做真正可商业化的恢复页面。

## 十. 对现有库结构的建议补充

当前 schema 已经有不错的基础，但还缺几类对象。

### 1. 建议新增

- `ApiCredentialGrant`
  - 执行期短期授权
- `SkillPatchProposal`
  - Hermes 学习后的待审核 patch
- `SkillInstallReceipt`
  - 某设备装过哪个 skill 版本、checksum 是否一致
- `ProviderUsageRecord`
  - 更细粒度模型调用记录

### 2. 建议增强

#### `HermesExecution`

建议补充：

- `skillId`
- `skillVersionId`
- `skillChecksum`
- `deviceId`
- `providerSummary`

#### `SkillVersion`

建议补充：

- `checksum`
- `sourceType`
- `baseVersionId`

#### `HermesDevice`

建议补充：

- `runtimeChannel`
- `capabilitySnapshot`
- `lastSkillSyncAt`

## 十一. 对当前前端实现的直接提醒

当前前端里 Hermes 连接态仍有 `localStorage` 逻辑，这对于 demo 没问题，但不能作为正式链路真相源。

正式上线必须逐步迁移为：

- Hermes 配对状态来自服务端
- 设备信息来自 `HermesDevice`
- task 与 usage 来自数据库
- published skill 来自服务端版本查询

`localStorage` 只能继续承担：

- 临时 UI 态
- 草稿态缓存
- 非真相源交互优化

## 十二. 第一阶段推荐落地顺序

### Phase 1

先把“版本不漂移”做对：

1. published skill snapshot
2. checksum 校验
3. Hermes 按版本安装
4. 正式任务只跑 published version

### Phase 2

再把“账和任务跑通”做对：

1. usage 回传
2. ledger 对账
3. waiting_confirmation
4. recoverable failure

### Phase 3

最后再把“学习能力产品化”做出来：

1. patch proposal
2. diff review
3. draft merge
4. republish

## 结论

这套链路可以成立，但必须建立在下面这条铁律上：

**Hermes 是执行层，不是线上 skill 真相源。**

更完整地说：

- Web 是账号、钱包、任务、发布版本的真相源
- Hermes 是模型调用、本地权限和执行过程的运行时
- Hermes 的学习结果只能作为 `待审核 patch`
- 正式任务只能运行 `已发布 skill 快照`

只有这样，HelloMe 才能同时做到：

- 早期靠 Hermes 快速跑通 demo
- 中期让创作者持续优化智能体
- 后期让线上结果稳定、可追踪、可回滚、可对账
