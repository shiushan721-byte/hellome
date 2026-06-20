# HelloMe Iteration Update Log

## 2026-06-19 独立 HTML 设计预览稿

### 本轮完成

- 新增独立预览文件：
  - [docs/ui-prototypes/frontstage-design-preview.html](/Users/feihong/Documents/hellome/docs/ui-prototypes/frontstage-design-preview.html)
- 这次不走项目路由，不依赖当前前端页面结构，单独用 HTML + CSS + 少量 JS 做了可预览稿
- 预览稿当前包含：
  - 色彩规范
  - 字体规范
  - 核心组件样式
  - 按需展开交互示意
  - 左中右三栏完整工作台示意

### 二次收敛

- 按评审反馈重构了整张独立 HTML 原型：
  - 补齐 `hover / active / focus-visible / disabled` 交互状态
  - 提升次级文本对比度
  - 收敛字体栈为 `Plus Jakarta Sans + Playfair Display + JetBrains Mono`
  - 建立 spacing token
  - 新增 `success / warning / danger / info` 语义色
  - 将边框、阴影统一 token 化，为暗黑模式预留结构
  - 收紧内部控件圆角，降低过度消费级气质
  - 将移动端三栏降级逻辑改成“预览固定在前 + 输入/预览/导出切换”

### 三次收敛

- 按“AI 视频任务交付平台”的方向继续扩展了独立 HTML 规范稿：
  - 新增 B 端 / 服务商导向的顶部 KPI 区
  - 新增资金风控组件群：
    - 钱包状态条
    - 预估成本表达
    - 高风险冻结确认弹窗
    - 待人工确认的任务时间轴
  - 新增人工兜底组件群：
    - 脚本 / 分镜内联编辑器
    - 智能重试与 Debug 面板
  - 新增白牌交付组件群：
    - 多格式资产画廊
    - 脱敏交付开关
  - 新增 3 个核心商业页面蓝图：
    - 短视频 Agent 下单页
    - 执行与人工兜底页
    - 服务商客户交付包页

### 四次收敛

- 继续将独立 HTML 规范稿升级为“多模态 Universal Workbench”底座：
  - 新增统一链路抽象：
    - `Brief -> Outline -> Draft -> Render -> Delivery`
  - 新增多模态底座组件：
    - JSON Schema 驱动的动态表单引擎
    - 多模态中心画布
    - 泛化资产管理器
    - 版本控制列表
  - 新增 4 种中心画布模式示意：
    - 视频模式
    - 文档模式
    - PPT 模式
    - 网页 / UI 模式
  - 新增可插拔 Workflow 规范：
    - Auto
    - HITL
    - High-Cost
  - 新增多模态客户 Portal 示意与批注回流逻辑
  - 新增 3 个压力测试场景与 4 个原子级通用动作定义

### 五次收敛

- 将独立 HTML 规范稿继续升级为可执行的 `UX Constitution`：
  - 新增 7 个交互决策维度：
    - 容器与空间
    - 数据录入与选择
    - 状态与反馈
    - 导航与结构
    - 数据展示
    - 动作指令
    - AI 产品专属范式
  - 每个维度都加入：
    - 何时使用
    - 不该怎么用
    - HelloMe 对应场景
  - 新增“决策灵魂三问”作为产品、设计、研发协作时的统一判断框架

## 2026-06-19 两张独立高保真业务页拆分

### 本轮完成

- 新增独立高保真原型页 A：
  - [docs/ui-prototypes/page-a-multimodal-order.html](/Users/feihong/Documents/hellome/docs/ui-prototypes/page-a-multimodal-order.html)
  - 主题：多模态 Agent 下单页
  - 结构：
    - 左栏输入需求
    - 中栏成功案例与预期结果
    - 右栏交付、成本、钱包与主交易动作
- 新增独立高保真原型页 B：
  - [docs/ui-prototypes/page-b-execution-hitl.html](/Users/feihong/Documents/hellome/docs/ui-prototypes/page-b-execution-hitl.html)
  - 主题：执行与人工兜底页
  - 结构：
    - 左栏任务步骤与 Pending Approval
    - 中栏脚本 / 分镜编辑工作区
    - 右栏高成本确认、当前产物、日志与重试

### 当前收益

- 规范总览页不再承担所有业务表达压力。
- 现在已经有两张更接近真实上线页的静态高保真原型，可以直接继续往正式前端落。
- Page A 和 Page B 已经分别承接：
  - 下单与交易
  - 执行与人工兜底

## 2026-06-19 第三张独立高保真业务页补齐

### 本轮完成

- 新增独立高保真原型页 C：
  - [docs/ui-prototypes/page-c-client-portal.html](/Users/feihong/Documents/hellome/docs/ui-prototypes/page-c-client-portal.html)
  - 主题：服务商客户交付 Portal
  - 结构：
    - 左栏交付分区与多模态资产入口
    - 中栏白牌外发展示与在线预览
    - 右栏内部视角 / 外部视角切分、客户批注回流、返修入口

### 当前收益

- 现在三张核心业务页原型已经闭环：
  - Page A：下单与交易
  - Page B：执行与人工兜底
  - Page C：白牌交付与复购闭环
- 后续如果开始落正式前端，可以按这三张页直接拆开发任务，不再需要先从规范页反推业务。

## 2026-06-19 三张原型统一为同一套导航与视觉母版

### 本轮完成

- 为三张独立业务页统一加入同一套产品壳：
  - 左侧导航
  - 顶栏状态区
  - 工作台标签栏
  - 统一品牌头部
- 三张页之间现在可以直接互相跳转：
  - `page-a-multimodal-order.html`
  - `page-b-execution-hitl.html`
  - `page-c-client-portal.html`
- 每张页只保留当前页面的激活状态差异：
  - 下单页高亮“下单页”
  - 执行页高亮“执行页”
  - 交付页高亮“交付页”

### 当前收益

- 现在看到的是“同一个产品里的三张页面”，而不是三张彼此独立的静态稿。
- 后续从原型转正式前端时，可以先实现统一壳层，再逐页接入业务内容。

### 当前收益

- 现在可以先独立确认设计方向，不需要先动真实业务页。
- 规范确认后，再把它回收进正式前端会更稳，不容易边做边漂。

## 2026-06-19 前台设计规范预览页

### 本轮完成

- 新增 [src/pages/app/FrontstageDesignSpecPage.tsx](/Users/feihong/Documents/hellome/src/pages/app/FrontstageDesignSpecPage.tsx)
- 新增 Creator 可访问路由：
  - `/app/studio/design-spec`
- 在 [src/pages/app/CreatorStudioPage.tsx](/Users/feihong/Documents/hellome/src/pages/app/CreatorStudioPage.tsx) 增加“查看规范页面”入口
- 预览页当前已直接可视化展示：
  - 色彩规范
  - 字体规范
  - 核心组件样式
  - 模块层级
  - 左中右三栏完整工作台示意

### 当前收益

- 现在不用先改真实业务页，就能先在前端直接确认设计规范。
- 后续收敛 `/app/agents/media`、`/app/tasks/:id`、`/connect-hermes` 时有了可对照的统一页面。
- Creator Studio 里也有了一个固定入口，避免后面规范只停留在文档里。

## 2026-06-19 前台设计统一规范沉淀

### 本轮完成

- 新增 [docs/frontstage-design-unification-spec.md](/Users/feihong/Documents/hellome/docs/frontstage-design-unification-spec.md)
- 将前台产品的核心设计判断沉淀为统一规范：
  - 用户为结果买单
  - 默认展示结果
  - 默认隐藏过程
  - 用户主动触发才展开信息
  - 左中右三栏职责明确
- 规范中明确了：
  - 页面层级
  - 布局职责
  - 信息收敛规则
  - 注释规则
  - 中间过程展示规则
  - UGC 工作台专项规则
  - Creator Studio 例外边界
  - 当前页面问题清单

### 当前收益

- 后续页面不再边做边漂，而是有统一的前台设计准绳。
- 这为下一步系统性收敛 `/app/agents/media`、`/app/tasks/:id` 和 `Creator Studio` 提供了明确边界。

## 2026-06-19 UGC 工作台呈现层优化

### 本轮完成

- 优化 [src/pages/app/UgcVideoAgentPage.tsx](/Users/feihong/Documents/hellome/src/pages/app/UgcVideoAgentPage.tsx) 的信息层级：
  - 弱化解释性注释
  - 将“系统理解”并入右侧核心交付区
  - 把“脚本草案 + 分镜预演”前置展示
- 新增分镜预演模块：
  - 开场抓眼球
  - 真人试用 / 产品展示

## 2026-06-20 智能体工坊 Spec 增补：右侧结果展示舞台

### 本轮完成

- 更新 [docs/superpowers/specs/2026-06-20-creator-skill-orchestrator-design.md](/Users/feihong/Documents/hellome/docs/superpowers/specs/2026-06-20-creator-skill-orchestrator-design.md)
- 在既有 `HelloMe 智能体工坊` 设计稿中，新增并收敛了面向普通用户前台的右侧核心展示逻辑：
  - `前台结果展示舞台`
  - `主舞台卡`
  - `结果商品条`
  - `执行状态轨`
  - `Hermes 未返回 / 已返回首轮规划` 双态规则
  - `文生视频 / 图生视频` 的展示差异
  - 用户丑图兜底规则
  - `S0-S5` 完整状态脚本

### 当前收益

- 明确了早期 web 端不承担 AI 层能力时，右侧仍然可以稳定成立的展示方案。
- 统一了老板关心的“核心展示卡”与产品逻辑之间的关系，避免后面回退成解释型右栏。
- 为后续前端实现、动效实现和营销录屏素材制作提供了统一状态脚本。

## 2026-06-20 智能体工坊 Spec 增补：任务停顿、确认与恢复系统

### 本轮完成

- 继续更新 [docs/superpowers/specs/2026-06-20-creator-skill-orchestrator-design.md](/Users/feihong/Documents/hellome/docs/superpowers/specs/2026-06-20-creator-skill-orchestrator-design.md)
- 新增面向正式商业化的任务中间态设计：
  - `自动推进节点`
  - `确认节点`
  - `中断节点`
- 新增商业化必须解释清楚的 4 个恢复问题：
  - 为什么停了
  - 停在了哪
  - 能不能继续
  - 之前结果还能不能用
- 新增右侧展示舞台的两个关键中间态：
  - `待确认`
  - `已中断待恢复`
- 新增对 Hermes 执行层的结构化回包要求：
  - `run_state`
  - `pause_reason_type`
  - `pause_reason_message`
  - `resume_mode`
  - `recoverable`
  - `artifacts_preserved`
  - `cost_status`

### 当前收益

- 设计稿不再只覆盖“理想成功链路”，而是把商业化必须面对的停顿、恢复与确认流程纳入主设计。
- 后续不管是普通用户侧、创作者工坊还是 Hermes 对接，都有了统一的任务中间态约束。
- 为正式实现任务恢复、断点续跑、确认后继续和失败兜底提供了明确产品边界。

## 2026-06-19 Page A 母版正式落进真实前端

### 本轮完成

- 将 [docs/ui-prototypes/page-a-multimodal-order.html](/Users/feihong/Documents/hellome/docs/ui-prototypes/page-a-multimodal-order.html) 的核心结构正式映射到真实页面：
  - 落地到 [src/pages/app/UgcVideoAgentPage.tsx](/Users/feihong/Documents/hellome/src/pages/app/UgcVideoAgentPage.tsx)
- 当前 `/app/agents/media` 已从“表单 + 结果堆叠”重排为更接近真实上线的三栏下单页：
  - 左栏：输入需求
  - 中栏：成功案例与样片预期
  - 右栏：钱包、成本、交付与主交易动作
- 保留原有真实任务逻辑不变：
  - 文件上传
  - 创建远程 UGC 任务
  - Hermes 本地调试
  - Skill runtime / experience 配置读取
- 新增一组更贴近统一母版的真实前端组件表达：
  - `WorkbenchPanel`
  - `TopMetaCard`
  - `WalletCard`
  - `InfoCard`
  - `StrategyRow`
  - `ConfigRow`
- 信息表达进一步收敛：
  - 头部先表达“工作台定位 + 当前模式”
  - 中栏默认先展示结果和样片预期，而不是先灌输流程
  - 右栏把执行、成本、交付和 CTA 合并成单一交易决策区

### 当前收益

- 真实前端第一页已经开始对齐统一母版，而不是继续停留在原型和正式页割裂的状态。
- 这版更符合“用户为结果买单”的产品方向：
  - 默认看结果
  - 输入收敛
  - 交易动作集中
  - 过程不再喧宾夺主

## 2026-06-19 Page B 母版正式落进真实前端

### 本轮完成

- 将 [docs/ui-prototypes/page-b-execution-hitl.html](/Users/feihong/Documents/hellome/docs/ui-prototypes/page-b-execution-hitl.html) 的核心结构正式映射到真实执行页：
  - 主体落地到 [src/components/app/tasks/TaskRunLayout.tsx](/Users/feihong/Documents/hellome/src/components/app/tasks/TaskRunLayout.tsx)
  - 外层容器同步调整到 [src/pages/app/TaskRunPage.tsx](/Users/feihong/Documents/hellome/src/pages/app/TaskRunPage.tsx)
- 真实 `/app/tasks/:id` 已从旧的“双栏后台页”重排为更接近统一母版的三栏执行工作台：
  - 左栏：任务步骤、Token 消耗、当前阶段
  - 中栏：执行工作区 / UGC 交付面板
  - 右栏：人工确认、高成本提示、Hermes 日志
- 收紧并统一了执行页核心组件风格：
  - [src/components/app/tasks/TaskTimeline.tsx](/Users/feihong/Documents/hellome/src/components/app/tasks/TaskTimeline.tsx)
  - [src/components/app/tasks/ConfirmationNode.tsx](/Users/feihong/Documents/hellome/src/components/app/tasks/ConfirmationNode.tsx)
  - [src/components/app/tasks/HermesLogPanel.tsx](/Users/feihong/Documents/hellome/src/components/app/tasks/HermesLogPanel.tsx)
- 保留现有真实逻辑不变：
  - 远程任务轮询
  - 人工确认继续
  - 取消 / 重试
  - UGC 修改后重跑

### 当前收益

- 下单页和执行页现在开始共享同一套产品叙事，不再像两个分裂的系统。
- `HITL`、风控确认、日志与交付被明确分区，真实执行链路更接近你要的 B 端交付工作台。
- 这也为下一步继续把 `Page C` 交付页落进真实前端打下了结构基础。

## 2026-06-19 前端去解释化收敛

### 本轮完成

- 收敛 [src/pages/app/UgcVideoAgentPage.tsx](/Users/feihong/Documents/hellome/src/pages/app/UgcVideoAgentPage.tsx)
  - 删除面向团队的说明性文案
  - 保留用户决策所需的标题、状态、金额、文件信息
  - 将部分长描述压缩为短状态词
- 收敛 [src/components/app/tasks/TaskRunLayout.tsx](/Users/feihong/Documents/hellome/src/components/app/tasks/TaskRunLayout.tsx)
  - 去掉“为什么这么设计”的解释
  - 将执行页头部和右侧风控区改为更短的任务状态表达
- 收敛 [src/components/app/tasks/UgcDeliveryPanel.tsx](/Users/feihong/Documents/hellome/src/components/app/tasks/UgcDeliveryPanel.tsx)
  - 去掉“系统理解”“前端展示的是服务端落库后的产物”等说明性句子
  - 保留输入快照、脚本、分镜、文件列表等必要业务信息

### 当前收益

- 真实前端更像产品页，而不是评审说明页。
- 页面噪音明显下降，用户只会看到：
  - 现在是什么
  - 要填什么
  - 进行到哪
  - 会拿到什么

## 2026-06-19 前台文案白名单落地

### 本轮完成

- 继续收敛 [src/pages/app/UgcVideoAgentPage.tsx](/Users/feihong/Documents/hellome/src/pages/app/UgcVideoAgentPage.tsx)
  - 去掉头部描述
  - 压缩顶部卡片、右栏信息区、进度区标题
  - 将部分栏目名收口为更短的用户词汇
- 继续收敛 [src/components/app/tasks/UgcDeliveryPanel.tsx](/Users/feihong/Documents/hellome/src/components/app/tasks/UgcDeliveryPanel.tsx)
  - 将“本次输入 / 修改后重新生成 / 脚本与设定 / 交付内容”继续压缩为更短标签
  - 将样片状态文案压缩为 `可预览 / 待确认 / 生成中`
- 继续收敛 [src/components/app/tasks/TaskRunLayout.tsx](/Users/feihong/Documents/hellome/src/components/app/tasks/TaskRunLayout.tsx)
  - 统一改短顶部 badge、右栏标题和成本文案
- 在 [docs/frontstage-design-unification-spec.md](/Users/feihong/Documents/hellome/docs/frontstage-design-unification-spec.md) 新增“前台文案白名单”规则：
  - 标题
  - 状态
  - 金额 / 时间
  - 文件 / 结果名
  - 动作按钮

### 当前收益

- 前台页面开始从“少解释”进一步进入“默认不解释”。
- 后续只要是普通用户页，我会默认按白名单写文案，不再把团队讨论语言带进真实前端。

## 2026-06-19 UGC 前台按角色分层与按需展开

### 本轮完成

- 在 [src/pages/app/UgcVideoAgentPage.tsx](/Users/feihong/Documents/hellome/src/pages/app/UgcVideoAgentPage.tsx) 增加前台角色分层：
  - 读取当前登录角色
  - `creator / admin` 默认展开更多细节
  - `user` 默认折叠脚本、分镜、进度
- 新增普通用户首屏按需展开交互：
  - `查看脚本与分镜`
  - `查看执行步骤`
- 将 `Hermes 调试` 按钮从普通用户首屏移除，只对创作者和管理员显示
- 在 [src/components/app/tasks/UgcDeliveryPanel.tsx](/Users/feihong/Documents/hellome/src/components/app/tasks/UgcDeliveryPanel.tsx) 增加可折叠功能块：
  - `查看输入`
  - `修改后重新生成`
  - `查看脚本`
- 任务详情页现在也开始按角色区分默认信息密度，而不再所有人都看到同样深的内容

### 当前收益

- 普通用户前台终于开始接近“首屏只下单”的产品目标。
- 创作者和管理员仍然保留足够深的调试与修正入口，不需要单独维护第二套前端。
- 这让当前 demo 更接近真实线上双层产品：
  - 用户层看结果
  - 专业层看细节

## 2026-06-19 UGC 预览改为多方案先选后生成

### 本轮完成

- 改造 [src/pages/app/UgcVideoAgentPage.tsx](/Users/feihong/Documents/hellome/src/pages/app/UgcVideoAgentPage.tsx)
  - 中栏新增 3 个可切换方案卡：
    - 真人种草版
    - 测评讲解版
    - 带货转化版
  - 用户点击方案卡后会直接切换：
    - 当前预览样式
    - 当前效果目标
    - 脚本与分镜联动内容
  - 保持原有提交接口不变，最终仍按当前选中的方案创建任务
- 新增 `buildPreviewOptions()`，将“先选结果方向再生成”的逻辑正式落入真实前端，而不只是停留在口头方案

### 当前收益

- `/app/agents/media` 现在更符合“用户先看结果，再决定是否生成”的主线。
- 普通用户不需要先理解抽象参数，而是可以先在结果卡之间做选择。
- 这为后续继续扩展“更多预览方案 / 更多 skill 方向”留下了直接可复用的前端结构。

## 2026-06-20 UGC 方案选择升级为 1 主 2 弱

### 本轮完成

- 继续优化 [src/pages/app/UgcVideoAgentPage.tsx](/Users/feihong/Documents/hellome/src/pages/app/UgcVideoAgentPage.tsx)
  - 将原来的三张平权方案卡改为：
    - 1 个主推荐方案大卡
    - 2 个弱化备选小卡
  - 主推荐方案支持直接点击：
    - `按此方案生成`
  - 备选方案卡只承担切换职责，不再抢主视觉
- 新增自动推荐逻辑：
  - `recommendPreviewEffect()`
  - 会根据卖点文案与平台特征，优先推荐：
    - 带货转化
    - 测评讲解
    - 真人种草
  - 用户一旦手动选择方案，就不再被自动推荐覆盖

### 当前收益

- 当前中栏更接近“先给一个最优答案，再保留两个备选”的真实产品体验。
- 用户注意力会先落在一个最推荐结果上，而不是被三个同权卡片分散。
- 这更符合 HelloMe 的核心方向：
  - 结果先行
  - 减少选择负担
  - 小白用户默认拿推荐答案

## 2026-06-20 UGC 主推方案视觉进一步拉开

### 本轮完成

- 继续增强 [src/pages/app/UgcVideoAgentPage.tsx](/Users/feihong/Documents/hellome/src/pages/app/UgcVideoAgentPage.tsx)
  - 主推荐方案增加更强的推荐态：
    - `推荐 · 标签`
    - `最适合当前需求`
    - 更重的主 CTA
  - 两个备选方案新增缩略视觉块，不再只是文字卡
  - 不同方案现在有更明确的视觉差异：
    - 背景渐变
    - 标签色
    - 缩略色块

### 当前收益

- 用户现在更容易一眼看出：
  - 哪个是主推
  - 哪两个只是备选
  - 三种方向之间不是只换了一句文案
  - 记忆点收束
- 调整右侧预览区结构：
  - 样片预览
  - 系统理解摘要
  - 脚本草案
  - 分镜预演
  - 纠偏入口
- 前台页面现在更符合“少输入、看结果、看中间产物”的使用节奏。

### 当前收益

- 用户不再被过多说明文案打断。
- 脚本和分镜中间结果已经在提交前可视化呈现。
- 更符合你要的重交付逻辑，而不是表单堆叠逻辑。

## 2026-06-19 Skill 配置到前台工作台的映射打通

### 本轮完成

- 新增 Skill 前台体验配置结构与接口：
  - [src/types/skills.ts](/Users/feihong/Documents/hellome/src/types/skills.ts) 新增 `SkillExperienceConfig`
  - [src/server/skillStudioService.ts](/Users/feihong/Documents/hellome/src/server/skillStudioService.ts) 新增 `getSkillExperienceConfig()`
  - [server.ts](/Users/feihong/Documents/hellome/server.ts) 新增 `GET /api/skills/:skillId/experience`
  - [src/lib/skillStudioApi.ts](/Users/feihong/Documents/hellome/src/lib/skillStudioApi.ts) 新增前端读取方法
- [src/pages/app/UgcVideoAgentPage.tsx](/Users/feihong/Documents/hellome/src/pages/app/UgcVideoAgentPage.tsx) 现在会读取 Skill 配置来驱动前台：
  - 顶部标题
  - 描述文案
  - 产品图 / 人物图上传提示
  - 一句话卖点 label 和 placeholder
  - 参考链接 placeholder
  - 交付文件清单
  - 高成本确认前的说明文案
- [src/server/ugcTaskService.ts](/Users/feihong/Documents/hellome/src/server/ugcTaskService.ts) 执行阶段开始读取 Skill 配置中的确认文案，不再只用写死文本。

### 当前收益

- Creator Studio 改配置后，普通用户前台已经能直接感知到变化。
- UGC 工作台不再只是“写死页面 + 后台假配置”，而开始具备真正的配置驱动能力。
- 这为后续接真实视频 provider 和更复杂的多 Skill 路由提供了稳定骨架。

## 2026-06-19 UGC 多 Skill 内部路由落地

### 本轮完成

- 扩展 Skill 执行配置结构：
  - [src/types/skills.ts](/Users/feihong/Documents/hellome/src/types/skills.ts) 新增
    - `routingMode`
    - `defaultPlanId`
    - `availablePlans`
- 在 [src/server/skillStudioService.ts](/Users/feihong/Documents/hellome/src/server/skillStudioService.ts) 落地多视频方案默认配置，并新增：
  - `getSkillRuntimeConfig()`
  - `resolveSkillRoutePlan()`
- UGC 任务现在会在创建和重试时自动选择执行方案：
  - [src/server/ugcTaskService.ts](/Users/feihong/Documents/hellome/src/server/ugcTaskService.ts)
  - 选型会根据人物图有无、平台和效果目标自动路由
- 新增公开运行时配置接口：
  - [server.ts](/Users/feihong/Documents/hellome/server.ts)
  - `GET /api/skills/:skillId/runtime`
- 前台 UGC 工作台现在只展示“系统自动选择执行方案”，不暴露 Skill 市场心智：
  - [src/pages/app/UgcVideoAgentPage.tsx](/Users/feihong/Documents/hellome/src/pages/app/UgcVideoAgentPage.tsx)
- 任务详情页增加“系统选择的执行方案”展示：
  - [src/components/app/tasks/UgcDeliveryPanel.tsx](/Users/feihong/Documents/hellome/src/components/app/tasks/UgcDeliveryPanel.tsx)
- Creator Studio 可编辑视频 Provider、默认方案和可用方案列表：
  - [src/pages/app/CreatorSkillEditorPage.tsx](/Users/feihong/Documents/hellome/src/pages/app/CreatorSkillEditorPage.tsx)

### 当前收益

- 普通用户仍按“我要什么结果”使用，不需要理解 skill。
- Creator 可以开始配置视频执行方案与路由策略。
- UGC 主线已经从“单一路径假执行”升级为“多方案内部路由”的真实产品骨架。

## 2026-06-19 UGC 输入语义修正与重新生成链路

### 本轮完成

- 修正 [src/pages/app/UgcVideoAgentPage.tsx](/Users/feihong/Documents/hellome/src/pages/app/UgcVideoAgentPage.tsx) 中“系统理解”的语义：
  - 不再误导成页面打开即开始 AI / Hermes 分析
  - 改为“提交后系统会生成”
  - 明确这是提交任务后由 Skill 工作流生成的理解结果示意
- 增强 [src/components/app/tasks/UgcDeliveryPanel.tsx](/Users/feihong/Documents/hellome/src/components/app/tasks/UgcDeliveryPanel.tsx)：
  - 新增“修改后重新生成”表单
  - 支持直接修改卖点、平台、效果目标、参考链接
  - 以结果纠偏心智重跑任务，而不是要求用户理解底层 skill
- 扩展任务重试链路：
  - [src/lib/taskApi.ts](/Users/feihong/Documents/hellome/src/lib/taskApi.ts) 新增带输入覆盖的重试请求
  - [server.ts](/Users/feihong/Documents/hellome/server.ts) 支持 `POST /api/tasks/:id/retry` 接收更新后的输入
  - [src/server/ugcTaskService.ts](/Users/feihong/Documents/hellome/src/server/ugcTaskService.ts) 支持按新输入重置并重新生成任务
- [src/components/app/tasks/TaskRunLayout.tsx](/Users/feihong/Documents/hellome/src/components/app/tasks/TaskRunLayout.tsx) 与 [src/pages/app/TaskRunPage.tsx](/Users/feihong/Documents/hellome/src/pages/app/TaskRunPage.tsx) 同步接入新的重新生成动作。

### 当前收益

- 前台输入页不会再把“预设参数”和“系统理解结果”混为一谈。
- 任务详情页开始具备真实的纠偏与再生成能力。
- 这更符合 HelloMe 的主线：用户只修正结果方向，系统负责重新组织 skill 执行。

## 2026-06-19 UGC 任务详情页交付感增强

### 本轮完成

- 强化 [src/components/app/tasks/UgcDeliveryPanel.tsx](/Users/feihong/Documents/hellome/src/components/app/tasks/UgcDeliveryPanel.tsx)：
  - 新增“样片预览”状态区
  - 新增“用户输入快照”
  - 新增“系统理解”纠偏标签
  - 新增 `waiting_confirmation` 阶段的高成本确认提示
  - 将产品图 / 人物图回显到样片预览卡片中
- 调整 [src/components/app/tasks/TaskRunLayout.tsx](/Users/feihong/Documents/hellome/src/components/app/tasks/TaskRunLayout.tsx) 头部文案：
  - UGC 任务不再显示通用的 `Hz-Hermes 任务执行看板`
  - 改为更贴近产品语义的 `UGC 视频样片交付看板`

### 当前收益

- 任务详情页更符合“重交付、轻输入”的产品方向。
- 用户能更直观看到：
  - 本次输入依据
  - 系统如何理解需求
  - 当前是否已经走到高成本确认节点
  - 最终会交付什么

## 2026-06-19 登录注册能力沉淀为可复用组件库

### 本轮完成

- 新增项目根目录级复用资产目录：
  - [复用组件库/README.md](/Users/feihong/Documents/hellome/复用组件库/README.md)
  - [复用组件库/auth-login-kit/README.md](/Users/feihong/Documents/hellome/复用组件库/auth-login-kit/README.md)
- 将当前登录注册方案沉淀为可直接复制的真实代码：
  - `auth-types.ts`
  - `frontend-auth-core.ts`
  - `login-modal-core.tsx`
  - `server-auth-kit.ts`
- 当前项目已经接线到这套复用库：
  - [src/lib/auth.ts](/Users/feihong/Documents/hellome/src/lib/auth.ts)
  - [src/components/LoginModal.tsx](/Users/feihong/Documents/hellome/src/components/LoginModal.tsx)
  - [server.ts](/Users/feihong/Documents/hellome/server.ts)
- 这套组件库保留了当前 HelloMe 已验证的关键能力：
  - 动态验证码
  - 测试环境自动回填
  - Session Cookie
  - 首次登录自动注册
  - `user / creator / admin` 角色分流

### 当前收益

- 后续新项目不需要再从零写一遍手机号登录链路。
- 可以直接复制整个 `复用组件库/auth-login-kit` 目录，再按说明接入。
- 当前项目已经变成“复用库 + HelloMe 适配层”的结构，后续维护成本更低。

## 2026-06-19 动态验证码与自动回填优化

### 本轮完成

- 服务端模拟验证码从“固定 `123456`”改成“每次发送动态生成 6 位验证码”。
- 测试环境下，`/api/auth/send-code` 会返回本次真实生成的验证码，便于前端无感联调。
- 登录弹窗改成收到验证码后自动回填输入框：
  - 点击 `获取验证码`
  - 服务端生成动态验证码
  - 前端自动填入验证码输入框
  - 用户可直接点击 `登录`
- 演示身份卡保留手机号快捷填充，但不再误导性地携带固定验证码。
- 更新登录提示文案，明确这是“动态验证码 + 自动回填”的测试环境方案。

### 影响文件

- [server.ts](/Users/feihong/Documents/hellome/server.ts)
- [src/lib/auth.ts](/Users/feihong/Documents/hellome/src/lib/auth.ts)
- [src/components/LoginModal.tsx](/Users/feihong/Documents/hellome/src/components/LoginModal.tsx)
- [docs/iteration-update-log.md](/Users/feihong/Documents/hellome/docs/iteration-update-log.md)

### 当前收益

- 登录体验更像真实产品测试环境，而不是写死口令。
- 联调仍然足够快，但假感明显降低。
- 后续接真实短信网关时，前端交互几乎不用再改，只要去掉测试环境回填即可。

## 2026-06-19 登录验证码模拟发送 + 注册落库改造

### 本轮完成

- 服务端新增 `POST /api/auth/send-code`，改成更接近线上环境的验证码发送链路：
  - 校验 11 位手机号
  - 60 秒发送冷却
  - 5 分钟验证码有效期
  - 测试环境固定返回模拟验证码 `123456`
- 登录接口不再只认 3 个写死 demo 账号，改成：
  - 先发送验证码
  - 再校验验证码登录
  - 任意合法手机号都可首次登录即注册
- 登录时会自动执行注册落库：
  - `User` 自动创建或更新
  - `Workspace` 自动创建或同步名称
- 补齐 Prisma 数据源配置：
  - [prisma/schema.prisma](/Users/feihong/Documents/hellome/prisma/schema.prisma) 增加 `url = env("DATABASE_URL")`
  - [.env.example](/Users/feihong/Documents/hellome/.env.example) 增加 `DATABASE_URL` 示例
- 服务端鉴别层现在会明确判断 `DATABASE_URL`：
  - 已配置时走 Postgres/Prisma
  - 未配置时退回 Demo 内存模式，不再抛出误导性的 Prisma 初始化异常
- 特殊演示手机号仍保留角色映射：
  - 普通用户
  - 创作者
  - 管理员
- 登录弹窗前端改成真实交互：
  - 不再默认预填验证码
  - “获取验证码”改成真实请求服务端
  - 返回测试环境提示文案
  - 仍保留角色身份卡，方便本地联调不同权限页面

### 影响文件

- [server.ts](/Users/feihong/Documents/hellome/server.ts)
- [src/lib/auth.ts](/Users/feihong/Documents/hellome/src/lib/auth.ts)
- [src/components/LoginModal.tsx](/Users/feihong/Documents/hellome/src/components/LoginModal.tsx)
- [docs/iteration-update-log.md](/Users/feihong/Documents/hellome/docs/iteration-update-log.md)

### 当前收益

- 登录链路从“前端写死验证码”升级为“服务端模拟发送 + 首次登录注册落库”。
- 更符合你要的“Demo 阶段也按真实上线结构设计”的目标。
- 不同手机号现在能形成真实用户记录，为后续 Postgres / Prisma 账号体系扩展打下基础。
- 本机暂未配置 Postgres 时，Demo 仍可继续跑；一旦补上 `DATABASE_URL`，当前登录层就能直接切到真实落库。

### 待继续项

- 下一步可以继续把 `UserProfile`、`Workspace`、角色策略彻底收口到 Prisma 服务层，而不是继续散在 `server.ts`。
- 如果后续接正式短信网关，只需要替换 `send-code` 的发送实现，不需要再改前端交互。

## 2026-06-19 Demo Auth + Model Proxy

### 本轮完成

- 服务端新增 Demo 登录会话接口：
  - `POST /api/auth/login`
  - `GET /api/auth/me`
  - `POST /api/auth/logout`
- 服务端新增模型转接接口：
  - `GET /api/models`
  - `POST /api/llm/generate`
  - `POST /api/llm/chat`
- 接入 `src/server/adapters/modelAdapter.ts`，支持：
  - `OpenRouter`
  - `OpenAI`
  - `Gemini`
  - `Mock fallback`
- 前端登录弹窗改成真实请求登录，不再只走本地同步校验。
- 顶栏退出登录改成真实调用服务端退出接口。
- `AppShell` 启动时自动同步登录会话与 Hermes 连接状态。
- 更新 `.env.example`，补充 Demo 账号与模型代理配置。

### 影响文件

- [server.ts](/Users/feihong/Documents/hellome/server.ts)
- [src/server/adapters/modelAdapter.ts](/Users/feihong/Documents/hellome/src/server/adapters/modelAdapter.ts)
- [src/lib/auth.ts](/Users/feihong/Documents/hellome/src/lib/auth.ts)
- [src/components/LoginModal.tsx](/Users/feihong/Documents/hellome/src/components/LoginModal.tsx)
- [src/components/app/Topbar.tsx](/Users/feihong/Documents/hellome/src/components/app/Topbar.tsx)
- [src/components/app/AppShell.tsx](/Users/feihong/Documents/hellome/src/components/app/AppShell.tsx)
- [.env.example](/Users/feihong/Documents/hellome/.env.example)

### 当前收益

- Demo 已从“纯 localStorage 登录”升级为“前端缓存 + 服务端会话”模式。
- 真实部署时可以先不接正式账号体系，也能保持一个接近上线的结构。
- 模型调用已经抽象成统一后端出口，后续可替换成你自己的中转站或正式网关。

### 待继续项

- 把 UGC 工作台中的“系统理解”优先切到 `/api/llm/generate`，减少前端模拟逻辑。
- 为模型转接补充调用日志、限流和错误分级。
- 后续从 Demo 会话过渡到正式账号体系时，把当前 `DemoSession` 替换为数据库或外部认证服务。

### 验证要求

- `npm run lint`
- `npm run build`
- 联调登录、退出、`/api/models`、`/api/llm/generate`

## 2026-06-19 Hermes 无感准备交互重构

### 本轮完成

- 将 Hermes 弹窗从“教程式三步说明”改成“系统自动准备环境”模式。
- 将原先的多个显式动作：
  - 下载 Hz-Hermes
  - 打开 Hz-Hermes
  - 我已完成配对
  收敛为一个主动作：`启动智能体`
- 弹窗内新增环境准备进度：
  - 登录 HelloMe
  - 准备 Hermes 环境
  - 连接当前账号
  - 启动智能体
- `HermesActionModal` 现在会根据状态自动执行：
  - 未安装时打开下载页并继续检测
  - 离线时继续检测运行状态
  - 未配对时尝试本机静默配对
- `ConnectHermesPage` 同步改成与弹窗一致的产品心智：
  - 标题改为“启动你的个人智能体环境”
  - 强调“登录即注册”
  - 不再要求用户先理解“下载-登录-配对”的完整流程
  - 主按钮统一改成 `启动智能体`

### 影响文件

- [src/components/app/HermesActionModal.tsx](/Users/feihong/Documents/hellome/src/components/app/HermesActionModal.tsx)
- [src/pages/ConnectHermesPage.tsx](/Users/feihong/Documents/hellome/src/pages/ConnectHermesPage.tsx)
- [docs/iteration-update-log.md](/Users/feihong/Documents/hellome/docs/iteration-update-log.md)

### 当前收益

- 用户从“先理解安装流程”切换到“先启动智能体，系统再准备环境”。
- 交互更符合 HelloMe 的重交付方向，Hermes 从前台产品动作退回到后台运行时角色。
- 后续如果接入真实客户端唤起能力，只需要替换 `onOpenHermes` 的执行方式，不需要再改产品心智。

### 待继续项

- 将顶部 Hermes 状态入口的文案从“去配对 / 启动应用”进一步统一成“智能体环境待准备”。
- 如果后续拿到官方 Hermes 唤起协议或 CLI，需要把当前“打开下载页 + 轮询检测”升级为真实安装/启动探测。
- 将任务发起前的 Hermes 准备态与具体任务上下文绑定，做到准备完成后自动回到对应智能体步骤。

### 验证要求

- `npm run lint`
- `npm run build`
- 本地验证 `/app/agents` 和 `/connect-hermes` 的弹窗与按钮语义

## 2026-06-19 Hermes 状态语义修正

### 本轮完成

- 修正 Hermes 主动作按钮的状态语义，不再让 `启动智能体` 承担“跳去下载”的含义。
- 统一为四种用户可理解状态：
  - `安装 Hermes 并继续`
  - `启动智能体`
  - `连接智能体`
  - `开始使用智能体`
- 弹窗标题与状态提示同步改成按真实状态解释：
  - 未安装
  - 未启动
  - 未连接
  - 已连接
- 连接页状态文案同步更新，不再使用“未配对 / 去配对”作为主心智。
- 顶栏 Hermes 状态入口文案同步更新：
  - `未安装 Hermes · 去安装`
  - `Hermes 未启动 · 去启动`
  - `Hermes 未连接 · 去连接`
  - `Hermes 已连接`

### 影响文件

- [src/components/app/HermesActionModal.tsx](/Users/feihong/Documents/hellome/src/components/app/HermesActionModal.tsx)
- [src/pages/ConnectHermesPage.tsx](/Users/feihong/Documents/hellome/src/pages/ConnectHermesPage.tsx)
- [src/components/app/Topbar.tsx](/Users/feihong/Documents/hellome/src/components/app/Topbar.tsx)
- [docs/iteration-update-log.md](/Users/feihong/Documents/hellome/docs/iteration-update-log.md)

### 当前收益

- “启动智能体”重新回到“启动已安装环境”的正确语义。
- 未安装用户不会再被误导成“已经开始执行任务”。
- 交互更接近真实商业产品的状态表达，而不是技术流程表达。

## 2026-06-19 Hermes 检测误判修正

### 本轮完成

- 修正前端 Hermes 状态回退逻辑：
  - 以前：`/api/hermes/pairing/status` 调用失败时，直接回退成 `capability_missing`
  - 现在：接口失败会回退成新的 `api_unavailable`
- 新增面向页面的状态映射：
  - `api_unavailable -> service_unavailable`
- 更新多个入口的文案与跳转：
  - 顶栏显示 `Hermes 检测异常 · 去重试`
  - 连接页显示“检测服务暂时不可用，这不等于未安装”
  - 弹窗主动作会变成 `重新检测 Hermes`
  - `ProtectedRoute` 会把异常态引导到 `/connect-hermes?status=service_unavailable`

### 影响文件

- [src/lib/hermesConnection.ts](/Users/feihong/Documents/hellome/src/lib/hermesConnection.ts)
- [src/lib/firstRunOnboarding.ts](/Users/feihong/Documents/hellome/src/lib/firstRunOnboarding.ts)
- [src/components/ProtectedRoute.tsx](/Users/feihong/Documents/hellome/src/components/ProtectedRoute.tsx)
- [src/components/app/Topbar.tsx](/Users/feihong/Documents/hellome/src/components/app/Topbar.tsx)
- [src/components/app/HermesActionModal.tsx](/Users/feihong/Documents/hellome/src/components/app/HermesActionModal.tsx)
- [src/pages/ConnectHermesPage.tsx](/Users/feihong/Documents/hellome/src/pages/ConnectHermesPage.tsx)
- [docs/iteration-update-log.md](/Users/feihong/Documents/hellome/docs/iteration-update-log.md)

### 当前收益

- 接口异常不再伪装成“未安装 Hermes”。
- 页面状态和机器真实状态更加一致。
- 更方便后续区分：
  - 本机确实没装
  - Hermes 已装但未连接
  - 开发服务或检测接口异常

## 2026-06-19 Usage 从 localStorage 迁移到服务端主账本

### 本轮完成

- 新增服务端算力接口：
  - `GET /api/billing/usage`
  - `GET /api/billing/ledger`
- 新增 [src/server/billingService.ts](/Users/feihong/Documents/hellome/src/server/billingService.ts)，通过 `Postgres + Prisma` 聚合：
  - `UsageLedger`
  - 关联 `Task`
  - 当前登录用户的月度用量
- 重构 [src/lib/usageStore.ts](/Users/feihong/Documents/hellome/src/lib/usageStore.ts)：
  - 改为“服务端优先，本地缓存兜底”
  - 新增 `syncUsageFromServer()`
  - 新增 `syncUsageLedgerFromServer()`
  - 新增 `syncUsageState()`
- 登录后和 AppShell 启动时会自动同步服务端余额。
- 算力中心页打开时会主动刷新服务端账本，不再只看 localStorage。

### 影响文件

- [server.ts](/Users/feihong/Documents/hellome/server.ts)
- [src/server/billingService.ts](/Users/feihong/Documents/hellome/src/server/billingService.ts)
- [src/lib/usageStore.ts](/Users/feihong/Documents/hellome/src/lib/usageStore.ts)
- [src/lib/auth.ts](/Users/feihong/Documents/hellome/src/lib/auth.ts)
- [src/components/app/AppShell.tsx](/Users/feihong/Documents/hellome/src/components/app/AppShell.tsx)
- [src/pages/app/UsagePage.tsx](/Users/feihong/Documents/hellome/src/pages/app/UsagePage.tsx)
- [docs/iteration-update-log.md](/Users/feihong/Documents/hellome/docs/iteration-update-log.md)

### 当前收益

- 余额和账本开始从数据库口径返回，而不是前端本地状态主导。
- 页面刷新、换页面后，Topbar / 首页 / 算力页的余额来源更接近真实上线结构。
- localStorage 仍保留缓存，但已经从“真相来源”降级成“离线兜底”。

### 待继续项

- `taskStore` 仍有旧 Demo 兼容逻辑，下一步要继续把任务列表完全收回服务端。
- `settleTaskTokens()` 还在服务端未覆盖的 GEO Demo 链路中保留本地兼容逻辑。
- 后续需要引入正式的 `Subscription / UsageAccount / ApiKeyConnection` 模型，而不是只用 `UsageLedger` 聚合月度余额。

## 2026-06-19 UGC 三层架构与 Creator Studio 定位补充

### 本轮完成

- 新增 [docs/ugc-creator-studio-three-layer-plan.md](/Users/feihong/Documents/hellome/docs/ugc-creator-studio-three-layer-plan.md)
- 明确 HelloMe 的三层结构：
  - 用户前台
  - 创作者前台工作台
  - Boss 后台
- 明确创作者工作台必须放在当前前台，通过权限控制入口显示，而不是单独做第二套重产品。
- 明确 Boss 后台只做：
  - 数据
  - 审核
  - 异常协助
  - 成本与运营管理
- 明确 Boss 后台不做：
  - 重交付
  - 日常 Skill 配置
  - Prompt 调试
- 给出 Creator Studio 的最小信息架构、角色模型、路由建议和开发顺序。

### 当前收益

- 把“用户前台”和“创作者前台”统一在同一套 HelloMe 产品壳内，降低后续维护复杂度。
- 避免把 Boss 后台做成另一个重交付平台。
- 为后续角色权限、Studio 路由、Skill 数据模型改造提供了明确边界。

## 2026-06-19 Creator Studio Phase 1 权限与路由落地

### 本轮完成

- 在登录态中补充角色字段：
  - `user`
  - `creator`
  - `admin`
- Demo 登录返回的用户对象已支持 `role`，并通过 `.env` 中的 `DEMO_ADMIN_ROLE` 控制。
- 前端新增权限判断：
  - `canAccessStudio()`
  - `canAccessAdmin()`
- 当前前台侧边栏已支持按角色显示 `Creator Studio` 入口。
- 新增前台 Creator Studio 路由：
  - `/app/studio`
  - `/app/studio/skills/:skillId`
  - `/app/studio/skills/:skillId/debug`
  - `/app/studio/skills/:skillId/versions`
- 新增 Boss 后台壳：
  - `/admin`
- Boss 后台保持轻量，只展示数据看板，不承载重交付工作流。

### 新增页面

- [src/pages/app/CreatorStudioPage.tsx](/Users/feihong/Documents/hellome/src/pages/app/CreatorStudioPage.tsx)
- [src/pages/app/CreatorSkillEditorPage.tsx](/Users/feihong/Documents/hellome/src/pages/app/CreatorSkillEditorPage.tsx)
- [src/pages/app/CreatorSkillDebugPage.tsx](/Users/feihong/Documents/hellome/src/pages/app/CreatorSkillDebugPage.tsx)
- [src/pages/app/CreatorSkillVersionsPage.tsx](/Users/feihong/Documents/hellome/src/pages/app/CreatorSkillVersionsPage.tsx)
- [src/pages/admin/AdminDashboardPage.tsx](/Users/feihong/Documents/hellome/src/pages/admin/AdminDashboardPage.tsx)

### 影响文件

- [src/lib/auth.ts](/Users/feihong/Documents/hellome/src/lib/auth.ts)
- [server.ts](/Users/feihong/Documents/hellome/server.ts)
- [.env.example](/Users/feihong/Documents/hellome/.env.example)
- [src/lib/sidebarNav.ts](/Users/feihong/Documents/hellome/src/lib/sidebarNav.ts)
- [src/components/app/AppSidebar.tsx](/Users/feihong/Documents/hellome/src/components/app/AppSidebar.tsx)
- [src/components/ProtectedRoute.tsx](/Users/feihong/Documents/hellome/src/components/ProtectedRoute.tsx)
- [src/App.tsx](/Users/feihong/Documents/hellome/src/App.tsx)
- [docs/iteration-update-log.md](/Users/feihong/Documents/hellome/docs/iteration-update-log.md)

### 当前收益

- 创作者功能已经进入当前前台产品壳，不需要另做第二套重前端。
- Boss 后台已被明确收窄为管理与协助处理层。
- 后续可以直接在 Studio 路由内接 Skill 数据模型与真实调试接口。

## 2026-06-19 Creator Studio Phase 2 数据模型与接口落地

### 本轮完成

- 在 Prisma schema 中补充 UGC 创作者层模型：
  - `Skill`
  - `SkillVersion`
  - `SkillDebugRun`
- 新增 [src/types/skills.ts](/Users/feihong/Documents/hellome/src/types/skills.ts)
  - 统一 Skill、Version、Debug 类型
- 新增 [src/server/skillStudioService.ts](/Users/feihong/Documents/hellome/src/server/skillStudioService.ts)
  - Skill 列表
  - Skill 详情
  - Skill 保存
  - Skill 版本列表
  - Skill 发布
  - Skill 调试
- 服务端新增 Creator Studio API：
  - `GET /api/studio/skills`
  - `GET /api/studio/skills/:skillId`
  - `PUT /api/studio/skills/:skillId`
  - `GET /api/studio/skills/:skillId/versions`
  - `POST /api/studio/skills/:skillId/publish`
  - `POST /api/studio/skills/:skillId/debug`
- 新增 [src/lib/skillStudioApi.ts](/Users/feihong/Documents/hellome/src/lib/skillStudioApi.ts)
- Creator Studio 页面已接入真实接口：
  - 列表页读 Skill 列表
  - 编辑页读写当前 Skill
  - 调试页运行真实 debug 接口
  - 版本页读取版本并支持发布

### 当前收益

- UGC 创作者工作台已经不只是静态壳，而是有真实前后端数据链路。
- 后续接真实视频 provider 时，可以直接把调试结果和执行配置挂到当前 SkillVersion 上。
- 现在已经具备“先配置 Skill，再调试 Skill，再发布版本”的最小闭环。

### 技术说明

- 当前 Prisma Client 还未重新生成，因此新增 Skill 模型在服务层先用了兼容写法。
- 等正式数据库迁移时，执行 `prisma generate` 后即可切回完整强类型访问。

## 2026-06-19 多用户登录与角色前台补全

### 本轮完成

- Demo 登录不再只有一个默认账号，新增三种身份预设：
  - `普通用户`
  - `创作者`
  - `管理员`
- 登录弹窗支持直接选择身份卡并自动填充手机号与验证码。
- 服务端登录接口支持多账号匹配，不再只识别单一管理员账号。
- 侧边栏已根据角色展示不同入口：
  - `user`：不显示 Studio / Admin
  - `creator`：显示 Creator Studio
  - `admin`：显示 Creator Studio + Boss Admin
- 顶栏增加角色徽标，设置页增加当前权限展示。

### 影响文件

- [src/lib/auth.ts](/Users/feihong/Documents/hellome/src/lib/auth.ts)
- [server.ts](/Users/feihong/Documents/hellome/server.ts)
- [.env.example](/Users/feihong/Documents/hellome/.env.example)
- [src/components/LoginModal.tsx](/Users/feihong/Documents/hellome/src/components/LoginModal.tsx)
- [src/lib/sidebarNav.ts](/Users/feihong/Documents/hellome/src/lib/sidebarNav.ts)
- [src/components/app/AppSidebar.tsx](/Users/feihong/Documents/hellome/src/components/app/AppSidebar.tsx)
- [src/components/app/Topbar.tsx](/Users/feihong/Documents/hellome/src/components/app/Topbar.tsx)
- [src/pages/app/SettingsPage.tsx](/Users/feihong/Documents/hellome/src/pages/app/SettingsPage.tsx)
- [docs/iteration-update-log.md](/Users/feihong/Documents/hellome/docs/iteration-update-log.md)

### 当前收益

- 现在可以直接从登录入口切换不同角色视角测试当前前台。
- Creator Studio 和 Boss Admin 的可见性不再停留在代码逻辑层，而是能在真实前台体验里直接验证。
- 为后续补用户级 Skill 数据隔离、Workspace 隔离和真实权限体系打下了基础。

## 2026-06-20 UGC 前台拆分为 3 个独立 Skill 入口

### 本轮完成

- 将原本单一的 `UGC 视频广告生成` 前台入口拆成 3 个独立 skill：
  - `真人种草视频`
  - `测评讲解视频`
  - `带货转化视频`
- 更新智能体目录与广场卡片数据：
  - `/app/agents/media-seeding`
  - `/app/agents/media-review`
  - `/app/agents/media-conversion`
- 原有 `/app/agents/media` 保留为兼容入口，默认落到 `media-seeding`，避免旧链接失效。
- UGC 前台页会根据当前 skill 路由自动切换：
  - 默认目标效果
  - 推荐主方案
  - 页面标题与技能语义
- 首页推荐与工作台 onboarding 已同步改为识别 3 个独立 UGC skill，不再只暴露一个泛 `media` 入口。

### 当前收益

- 前台感知上，HelloMe 的视频能力不再像“一个大 skill 里选模式”，而是更像“已经打磨好的 3 个成品能力”。
- 对小白用户更友好：
  - 先选离自己目标最近的 skill
  - 再做少量输入
  - 不必先理解“同一个 skill 里三种视频方向”的内部结构
- 对后续真实接 API 更稳：
  - 前台可以继续拆更多 skill
  - 后端仍然共用 `media-ugc` 任务链和任务数据模型
  - 不会因为前台扩 skill 数量而把执行架构拆碎

### 技术说明

- 这次拆分目前是“前台 skill 拆分、后端工作流共用”的结构：
  - 前台 agent id 已拆分
  - 后端 `Task.agentType = 'media'` 与 `media-ugc` 执行链暂时不变
- 这样可以先把产品形态做对，再在后续按真实 provider / plan 路由继续细化执行层。

## 2026-06-20 Creator Studio 可视化编辑闭环补全

### 本轮完成

- 完成 `media-ugc` 的可视化编辑页，不再只是配置表单：
  - 左侧编辑 skill 的前台输入文案、系统理解和执行配置
  - 右侧实时展示用户前台会看到的工作台效果
  - 可直接输入一组测试卖点，运行一次系统理解预演
  - 可直接保存草稿、发布到前台
- 新增 Studio 统一导航母版：
  - `可视化编辑`
  - `调试验证`
  - `发布版本`
  - `查看前台`
- 调试页与版本页已经接入统一导航，Creator Studio 三个核心页进入同一套结构。

### 当前收益

- 创作者现在不需要只在 Hermes 里黑盒调 skill。
- skill 的“创作 -> 预览效果 -> 调试验证 -> 发布上线 -> 前台使用”链路已经在 HelloMe 当前前台壳里跑通。
- 后续接真实 provider 时，创作者可以先在 Studio 中把前台体验和系统理解调顺，再去联调真实视频生成。

### 技术说明

- 这次优先补的是 Studio 可视化编辑层，没有改动 UGC 后端任务主链。
- 目前采用“编辑页内快速预演 + 独立调试页深调 + 独立版本页发布”的三段式结构：
  - 编辑页负责所见即所得
  - 调试页负责看系统理解与日志
  - 版本页负责发布控制

## 2026-06-20 已发布 Skill 配置正式接入 UGC 前台

### 本轮完成

- 修正前台 skill 配置读取逻辑：
  - `/api/skills/:skillId/runtime`
  - `/api/skills/:skillId/experience`
  现在默认读取 `已发布版本`，不再直接把 Studio 草稿暴露给用户前台。
- 为 3 个 UGC 前台 skill 建立公开映射：
  - `media-seeding`
  - `media-review`
  - `media-conversion`
  它们共用 `media-ugc` 这条 skill 底座，但会按前台路由注入不同的标题、摘要与默认执行偏好。
- UGC 前台页不再写死读取 `media-ugc`，而是按当前路由读取对应公开 skill 配置。
- 创建任务时，前台会把当前 skill id 一起提交到后端。
- 后端任务创建、系统理解确认、重试路由也已改成按当前 skill id 读取配置与执行方案。

### 当前收益

- Creator Studio 里“发布版本”后，`/app/agents/media-*` 前台终于会真实读取发布后的 skill 配置。
- 现在前台、任务执行、Studio 发布三层已经统一：
  - 前台看的是发布版
  - Studio 改的是草稿
  - 提交任务时会保留用户实际使用的是哪一个 skill 方向
- 对后续真实 provider 接入更稳，因为“skill 展示层”和“skill 执行层”已经不再脱节。

### 技术说明

- 当前仍然采用“一个 `media-ugc` skill 底座 + 三个公开前台 skill 变体”的结构。
- 这样可以同时满足：
  - 前台看起来是 3 个独立 skill
  - Creator Studio 暂时只维护 1 套核心 skill 配置
  - 后续如果某个方向要独立成单独 skill，再拆数据库模型也不会推翻现有前台结构

## 2026-06-20 Creator Skill 编辑页白屏修复与真编辑能力补全

### 本轮完成

- 修复 `media-ugc` 编辑页运行时白屏：
  - 原因是旧 skill 数据或发布后返回数据不完整时，前端直接对 `availablePlans` 调用了 `.find()`
  - 现在编辑页与可视化预览页都会先做 skill 草稿归一化，再渲染
- 新增 [src/lib/skillDraft.ts](/Users/feihong/Documents/hellome/src/lib/skillDraft.ts)
  - 统一补齐默认：
    - 输入配置
    - 系统理解配置
    - 执行配置
    - 可用执行方案
    - 交付模板
- 编辑页不再只是“看起来能改”的假字段：
  - `执行模式` 现在是可保存的真实下拉选择
  - `调试模式` 现在是可保存的真实下拉选择
  - `路由策略` 现在是可保存的真实下拉选择
  - `默认执行方案` 现在是从当前执行方案列表中真实选择

### 当前收益

- 现在 Creator Studio 的 skill 编辑页不再因为历史数据缺字段直接白屏。
- Studio 已经从“静态原型页”更接近真正可工作的配置台：
  - 能打开
  - 能改
  - 能保存
  - 能继续用于前台发布链路

### 技术说明

- 这次优先补的是前端编辑层的数据安全和可编辑性。
- 后续如果要把“新增方案 / 删除方案 / 改交付模板文件名 / 改 fitPlatforms”也做成可视化操作，可以继续在当前归一化底座上往前推进，不需要再重构这页。

## 2026-06-20 智能体工坊业务骨架正式接入

### 本轮完成

- 为 Creator Studio 的 skill 版本结构补上统一 `businessFrame`：
  - `目标`
  - `预算`
  - `执行方案`
  - `结果`
- `businessFrame` 已贯通：
  - 前端类型定义
  - skill 草稿归一化
  - `skillStudioService` 默认值、保存、读取
  - Prisma `SkillVersion.businessFrame`
  - 创作者编辑页可视化编辑
  - 右侧前台效果预览
- 新增 `BusinessFrameEditor`，创作者现在可以直接调整：
  - 一句话目标
  - 适用场景
  - 默认预算档
  - 是否需要确认
  - 阶段执行结构
  - 结果承诺与交付标签
- 右侧可视化预览已同步展示这套业务骨架，不再只看字段配置：
  - 结果承诺
  - 目标摘要
  - 交付标签
  - 预算策略

### 当前收益

- 智能体工坊现在开始从“参数配置台”转向“业务智能体编辑台”。
- 创作者编辑的内容不再只影响输入控件，也开始直接影响：
  - 用户端会看到的结果承诺
  - 智能体的预算与确认节奏
  - 智能体对外展示的交付心智
- 这为后续继续补：
  - 需求驱动编辑
  - Hermes 指令改 skill
  - 成功案例设为展示案例
  提供了稳定的数据骨架。

### 验证结果

- `node --import tsx --test tests/server/skillStudioService.test.ts tests/server/taskPresenter.test.ts tests/server/hermesContract.test.ts tests/server/taskStateMachine.test.ts tests/ui/taskShowcaseStage.test.ts`
  已通过
- `npm run lint`
  已通过
- `npm run build`
  已通过

### 技术说明

- 当前 `businessFrame` 先接在 `SkillVersion` 上，而不是单独拆新表，目的是让 demo 阶段改动更轻、上线链路更短。
- 后续如果要把“业务目标 -> Hermes 编辑指令 -> skill 结构改写 -> 展示案例沉淀”做成真正工作流，可以继续沿这套版本结构往上长，不需要推翻这次的数据定义。
