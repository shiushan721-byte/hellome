# Media-Seeding Result And State Repair Design

## Goal

把 `media-seeding` 当前“案例能看但交付链路不可信”的状态修到可验收，重点解决三类问题：

1. 真实视频没有被稳定地产出并识别为主结果
2. 成果中心 / 任务详情把附件当成主结果展示，结果表达很差
3. 生成中的状态文案和阶段卡片没有反映真实业务进度

本次仍然只修 `media-seeding` 这一条真实样板链路，但改法要能复用到后续视频智能体。

## Current Problems

### 1. “完成”不等于“拿到真实主视频”

当前 `ugcTaskService` 在进入交付整理阶段后，只要目录里有一批产物，就可能把任务标记为 `completed`。这会导致：

- fallback 音频也进入正式交付列表
- 视频产物与封面产物混在一起时，主结果选择不稳定
- Hermes 返回 `webm` / `webp` / 多输出时，前端仍可能按旧假设消费
- 用户看到“已完成”，但没有一个明确、可播放、可信的主视频

### 2. 成果页像“文件柜”，不像“结果页”

当前任务详情和成果表达的优先级是：

- 先展示抽象状态卡
- 再展示文件列表
- 真正的视频结果只是在文件中被动出现

结果是：

- 第一眼看不到主视频
- fallback 音频会抢到上方可见区域
- “封面 / 脚本 / 摘要”与“样片视频”没有主次
- 完成页缺少“结果概览 + 主结果 + 附件”的结构

### 3. 状态链路没有反映真实业务进度

现在 UI 里有多套互相独立的状态表达：

- `task.status`
- `task.steps`
- `TaskShowcaseStage` 自己推导的 headline / hero 文案
- `TaskRunLayout` 里另一套“当前阶段”文案

它们没有围绕同一个业务阶段模型工作，导致：

- 等待确认时文案不聚焦“为何确认”
- 真生成中只显示泛化的“系统正在推进”
- 已完成后没有“正式结果已交付”的明确切换
- 恢复态 / 失败态与正式完成态边界不清楚

## Scope

本次范围：

- 修正 `media-seeding` 的正式完成条件
- 为视频任务建立“主结果优先”的展示模型
- 重做任务详情页中部结果舞台和右侧说明的状态文案逻辑
- 修正成果中心摘要逻辑，使其优先描述主视频交付
- 重新生成并替换 `media-seeding` 的展示案例视频

本次不做：

- 全量重设计任务中心所有 agent 类型
- 重做整个全站视觉风格
- 一次性修完所有 TTS provider
- 建立完整视频质检后台

## Recommended Approaches

### Approach A: 只修前端展示

只在前端隐藏 fallback 音频，强行把视频卡片抬到最上面。

优点：

- 快

缺点：

- 任务仍可能在没有真实主视频时被标成完成
- 问题只是被遮住，不是真修复

### Approach B: 只修后端完成条件

先保证任务只有在真实主视频可用时才完成，前端保持现状。

优点：

- 数据真实性提升

缺点：

- 页面仍然难看
- 状态表达仍然混乱

### Approach C: 两条一起做，但分两个连续小迭代

第一小迭代先修真实结果：

- 统一主视频选择规则
- 完成条件绑定到真实主视频
- 选择更稳的视频模型重新出片
- 成果页和任务详情先按“主视频优先”展示

第二小迭代再修状态体验：

- 抽出统一业务阶段模型
- 让舞台区、左侧进度、右侧说明都读取同一套阶段状态

优点：

- 先解决真假问题，再解决体验问题
- 每一步都可独立验证
- 风险最可控

缺点：

- 需要同时改 server + UI

## Decision

采用 **Approach C**。

## Architecture

### 1. Introduce A “Primary Delivery” Rule

对视频任务增加“主交付物”概念。

主交付物必须满足：

- 类型是 `video`
- 文件存在且可公开访问
- MIME / 后缀可被识别为真实可播放视频
- 不是中间封面、音轨、脚本、摘要

任务只有在主交付物成立后，才允许进入正式 `completed`。

### 2. Split Delivery Artifacts Into Two Presentation Tiers

正式交付结果分成两层：

- `primaryArtifact`
  - 主视频
- `supportingArtifacts`
  - 配音
  - 封面
  - 脚本
  - 摘要

前端不再把全部 `artifacts` 平铺处理，而是先显示主结果，再显示附件列表。

### 3. Add A Unified Media Task Stage Model

新增一层业务阶段推导，不直接靠散落文案判断。

推荐阶段：

- `queued`
- `understanding`
- `route_planning`
- `waiting_confirmation`
- `rendering_video`
- `packaging_delivery`
- `completed`
- `recoverable_error`
- `failed`

所有这些阶段都从现有任务事实推导：

- `task.status`
- `task.steps`
- `task.pendingConfirmation`
- `task.recoveryState`
- `task.artifacts`

### 4. Rebuild Result-Centric Panels Around The Same Model

三个区域都读同一套阶段模型：

- 左栏：阶段进度
- 中栏：结果舞台 / 主视频 / 进行中说明
- 右栏：为什么停在这里、下一步是什么、当前结果可信度如何

这样任务详情才能一致。

## Backend Design

### Primary Artifact Resolution

在 `ugcTaskService` 内新增一组交付判断规则：

- 视频产物优先按 Hermes output `type` 识别
- 如果输出后缀与真实格式不一致，先规范化路径和 MIME
- 如果出现多个候选视频，按以下优先级选主视频：
  1. `type === video`
  2. 可播放视频 MIME
  3. 体积更大者优先
  4. 非封面 / 非静态图

### Completion Gate

任务完成条件改为：

- 已拿到主视频
- 已生成基础交付文本
- 封面可选，不阻塞完成
- 音频若是 fallback，不阻塞完成，但必须以 warning / 降级附件身份写入

如果没有主视频：

- 任务不能标记为 `completed`
- 进入 `recoverable_error` 或 `failed`
- 保留现有中间产物供重试

### Model Strategy

当前问题说明 `wan22-5b` 质量虽可，但输出稳定性和耗时需要重新评估。

本次策略：

- 保留 `wan22-5b` 作为高质量 / 图生视频选项
- 为 `media-seeding` 默认正式案例生成增加更稳的优先策略
- 如果当前输入是人物参考图驱动，但 `wan22-5b` 输出结构仍不稳定，则允许切到更稳的文本转视频或其他本地可用模型作为案例生成路径

这里不把策略写死到所有技能，只先收在 `media-seeding` 的默认执行选择中。

## Frontend Design

### Task Detail Page

中栏重排为：

1. 结果舞台
   - 生成中：显示当前阶段卡 + 预期结果
   - 已完成：显示主视频播放器
   - 可恢复：显示保留结果 + 恢复动作
2. 结果说明
   - 为什么当前停在这里
   - 系统已经完成了什么
   - 下一步是什么
3. 附件区
   - 配音 / 封面 / 脚本 / 摘要

已完成态下：

- 主视频必须始终在最上方
- 音频不允许抢占第一屏主结果位置

### Results Page

成果中心条目摘要改成结果导向：

- 有主视频：`1 条样片视频 + N 个交付附件`
- 只有文档：`N 个交付附件`
- 不再简单显示 `N 项交付物`

卡片上的标签优先使用：

- 平台
- 效果目标
- 完成状态

### Running State

生成中页面不再只说“系统正在推进”，而是根据阶段显示不同文案：

- 理解阶段：说明系统在整理方向与受众
- 等确认：说明为什么必须确认
- 真生成：说明正在出样片，预计产出主视频
- 打包交付：说明视频已出，正在整理附件

## Data Model Changes

新增只读派生模型，不强改数据库结构：

- `derivedStage`
- `primaryArtifact`
- `supportingArtifacts`
- `hasFallbackAudio`
- `deliveryReadiness`

优先在 presenter / UI model 层派生，避免数据库迁移。

## Error Handling

### Video Missing But Other Artifacts Exist

- 状态不能显示为 `completed`
- UI 显示“主视频未生成成功”
- 可保留封面 / 脚本 / 音频并允许重试

### Fallback Audio Present

- 允许任务完成
- 附件区显示“降级音轨”或 warning
- 不允许作为主结果区域内容

### Unsupported Output Format

- server 先做格式识别和路径规范化
- UI 不直接猜测文件类型

## Testing

至少覆盖：

1. 多产物情况下能正确选出主视频
2. 只有封面 / 音频 / 文本时不会误判为完成
3. fallback 音频不会成为主展示结果
4. 任务详情页已完成态优先渲染主视频
5. 不同阶段能推导出正确的统一状态文案
6. 成果中心摘要能区分“主视频 + 附件”与“只有附件”

## Rollout

第一步：

- 修 `media-seeding`
- 重新生成一条新的正式案例视频
- 替换市场展示资源

第二步：

- 把同一套“主结果优先 + 统一阶段模型”复用到其他视频智能体
