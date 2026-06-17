# HelloMe Token 计费与套餐方案

## 1. 背景

当前产品方案里存在两种计费口径：

```text
任务次数：例如 GEO 检测 18 / 20、内容生成 7 / 10
Token 余额：例如 Token 余额 ¥83.20
```

这两种口径会让用户和产品逻辑都变复杂。

HelloMe 的底层消耗来自模型调用、网页访问、内容生成、文件处理和自动化执行过程。一次任务能否满足用户目标，取决于任务深度、输入规模、执行步骤、模型调用次数和结果迭代次数。因此不适合用“按次”作为核心套餐口径。

新的计费原则：

> 套餐包含一定数量 Token，用户发起任务时预估 Token，任务执行时按实际消耗扣 Token，用量页面以剩余 Token 为主。

## 2. 计费口径调整

### 2.1 旧口径

```text
GEO 检测次数：18 / 20
内容生成次数：7 / 10
销售线索分析：120 / 500
Token 余额：¥83.20
```

问题：

- 用户会以为一次任务一定能得到满意结果。
- 不同任务复杂度差异很大，按次不公平。
- 同一个智能体内，快速检测、深度检测、重新生成、继续优化的成本不同。
- 后续支持长文、PPT、批量客户分析后，次数口径会越来越难解释。

### 2.2 新口径

```text
当前套餐：专业版
剩余 Token：183,240
本月已用：316,760
本月总额度：500,000
预计可完成：约 36 次标准 GEO 检测
```

说明：

- “剩余 Token”是主指标。
- “预计可完成多少任务”只是辅助估算，不作为权益承诺。
- 任务开始前展示预计 Token 区间。
- 任务完成后展示实际 Token 消耗。

## 3. Token 的产品含义

建议在产品里把 Token 解释为：

> Token 是 HelloMe 执行智能体任务时消耗的计算额度。智能体读取输入、调用模型、分析网页、生成内容和整理结果都会消耗 Token。

不建议在前台过度解释技术细节，比如输入 token、输出 token、模型倍率、工具倍率等。用户需要知道的是：

```text
还剩多少
本次预计花多少
实际花了多少
为什么这次消耗较高
```

## 4. 套餐设计

官网套餐应从“按任务付费”改为“按 Token 额度付费”。

### 4.1 套餐结构

建议第一版保留 3 档：

```text
体验版
专业版
团队版
```

也可以保留企业定制，但不要在第一版官网上堆太多权益。

### 4.2 套餐示例

#### 体验版

```text
¥49
包含 50,000 Token
适合：首次体验 GEO 检测、短内容生成、小规模任务
```

权益：

```text
GEO 快速检测
基础内容生成
任务过程可视化
结果保存 7 天
```

辅助说明：

```text
约可完成 3-5 次快速 GEO 检测，实际消耗以任务复杂度为准。
```

#### 专业版

```text
¥199 / 月
包含 500,000 Token / 月
适合：品牌运营、自媒体创作者、销售个人用户
```

权益：

```text
GEO 标准检测
自媒体内容生成
销售话术生成
任务历史长期保存
报告导出
```

辅助说明：

```text
约可完成 30-50 次标准任务，实际消耗以任务复杂度为准。
```

#### 团队版

```text
¥999 / 月
包含 3,000,000 Token / 月
适合：营销团队、销售团队、内容团队
```

权益：

```text
团队共享 Token
成员用量统计
GEO 深度检测
批量客户分析
报告导出
团队任务共享
```

辅助说明：

```text
约可完成 150-300 次标准任务，实际消耗以任务复杂度为准。
```

#### 企业定制

```text
定制额度
适合：大型品牌、代理商、私有化部署或 API 场景
```

权益：

```text
专属 Token 额度
自定义智能体
私有模型或私有工具接入
企业权限
白标报告
专属支持
```

## 5. 官网套餐页修改方案

当前官网价格区应从：

```text
按任务付费，弹性灵活
单次任务包
GEO 主流大模型评分测试 5 次
自媒体合规错字安全审计 10 次
销售获客智能外联邮件生成 500 封/月
```

调整为：

```text
按 Token 额度使用，任务复杂度决定消耗
体验版 / 专业版 / 团队版
每档展示包含 Token 数
用“约可完成”解释任务数量，不承诺固定次数
```

官网套餐卡字段：

```text
套餐名称
价格
包含 Token
适合人群
核心权益
约可完成的任务范围
购买或开始使用按钮
```

官网文案建议：

```text
按 Token 额度使用
每次任务根据输入规模、检测深度和生成内容长度消耗 Token。
开始任务前会显示预估消耗，完成后展示实际消耗。
```

套餐卡示例：

```text
专业版
¥199 / 月
包含 500,000 Token

适合持续做 GEO 检测、内容生成和销售触达的个人或小团队。

- GEO 标准检测
- 自媒体文章生成
- 销售话术生成
- 报告导出
- 任务历史保存

约可完成 30-50 次标准任务
实际消耗以任务复杂度为准
```

## 6. 工作台用量逻辑修改

工作台顶部、首页、任务页和用量页都要统一到 Token 口径。

### 6.1 顶部栏

当前顶部栏不应该再展示：

```text
Token ¥83.20 | GEO 2/20
```

建议改为：

```text
剩余 Token 183,240
```

余额不足时：

```text
剩余 Token 8,420
```

并用颜色或提示强调低余额。

### 6.2 登录后首页

首页用量概览应展示：

```text
剩余 Token
本月已用 Token
本月总额度
近 7 天消耗
```

可以增加辅助估算：

```text
预计还可完成约 36 次标准 GEO 检测
```

注意：“预计还可完成”不能作为主权益。

### 6.3 智能体卡片

智能体卡片里的“预计消耗”从次数改为 Token 区间：

```text
GEO 智能体
预计消耗：8,000-30,000 Token
```

不同深度：

```text
快速检测：约 5,000-10,000 Token
标准检测：约 12,000-25,000 Token
深度检测：约 30,000-80,000 Token
```

自媒体智能体：

```text
短文生成：约 2,000-6,000 Token
公众号长文：约 8,000-20,000 Token
文章转 PPT：约 15,000-50,000 Token
```

销售获客智能体：

```text
单个客户分析：约 3,000-8,000 Token
批量客户分析：按客户数量和网页内容累加
```

### 6.4 任务启动前

用户点击“开始任务”前，必须展示消耗预估。

示例：

```text
预计消耗：12,000-25,000 Token
当前余额：183,240 Token
预计任务完成后剩余：约 158,240-171,240 Token
```

文案：

```text
实际消耗会根据网页内容、模型调用次数和生成结果长度浮动。
```

按钮：

```text
[开始任务]
```

如果余额不足：

```text
当前余额不足以启动该任务，请充值或降低检测深度。
[降低为快速检测] [充值 Token]
```

### 6.5 任务执行中

任务执行页左侧可以显示实时消耗：

```text
预计消耗：12,000-25,000 Token
当前已消耗：8,430 Token
```

在每个步骤中记录消耗：

```text
生成检测问题：1,200 Token
调用模型检测：9,800 Token
分析竞品占位：2,100 Token
生成报告：4,600 Token
```

### 6.6 任务完成后

结果页顶部展示：

```text
实际消耗：21,640 Token
预估区间：12,000-25,000 Token
完成时间：4 分 32 秒
```

任务中心列表字段改为：

```text
任务名称
智能体
状态
创建时间
执行耗时
Token 消耗
结果类型
操作
```

## 7. 用量页面设计

用量页面目标：

> 让用户清楚知道剩余 Token、本月消耗、消耗趋势和任务明细。

页面标题：

```text
用量与套餐
```

页面副标题：

```text
查看 Token 余额、套餐额度和任务消耗明细
```

顶部卡片：

```text
当前套餐：专业版
剩余 Token：183,240
本月已用：316,760
本月总额度：500,000
```

进度条：

```text
本月 Token 使用进度
316,760 / 500,000
```

低余额提示：

```text
剩余 Token 低于 10%，建议及时充值，避免任务中断。
```

消耗明细字段：

```text
时间
任务名称
智能体
消耗 Token
预估 Token
状态
```

明细示例：

```text
2026-06-17 14:22
检测 HelloMe 的 AI 可见度
GEO 智能体
21,640 Token
预估 12,000-25,000
已完成
```

## 8. 数据模型建议

当前 `UsageSnapshot` 里有次数字段：

```text
geoUsed
geoLimit
contentUsed
contentLimit
salesUsed
salesLimit
```

建议调整为 Token 账户模型：

```ts
interface UsageSnapshot {
  planName: string;
  tokenBalance: number;
  monthlyTokenLimit: number;
  monthlyTokenUsed: number;
  resetAt: string;
  lowBalanceThreshold: number;
}
```

如果需要保留人民币余额，可单独建字段，不要和 Token 余额混用：

```ts
interface BillingSnapshot {
  cashBalanceCents: number;
  autoRechargeEnabled: boolean;
}
```

任务模型建议增加：

```ts
interface Task {
  estimatedTokenMin: number;
  estimatedTokenMax: number;
  tokenUsed: number;
}
```

消耗明细模型建议：

```ts
interface UsageLedgerEntry {
  id: string;
  time: string;
  taskId: string;
  taskName: string;
  agent: string;
  estimatedTokenMin: number;
  estimatedTokenMax: number;
  tokenUsed: number;
  status: 'reserved' | 'settled' | 'refunded' | 'failed';
}
```

步骤消耗可选：

```ts
interface TaskStep {
  id: string;
  name: string;
  status: StepStatus;
  tokenUsed?: number;
}
```

## 9. Token 预估规则

第一版可以用简单规则，不需要一开始做复杂实时计费。

### 9.1 GEO 智能体预估

按检测深度：

```text
快速检测：5,000-10,000 Token
标准检测：12,000-25,000 Token
深度检测：30,000-80,000 Token
```

影响因素：

```text
检测模型数量
关键词数量
竞品数量
官网页面抓取量
报告生成长度
是否继续生成 FAQ、LLMs.txt、官网文案
```

可以先用公式：

```text
基础消耗 + 模型数量 * 单模型检测消耗 + 竞品数量 * 竞品分析消耗 + 结果生成消耗
```

示例：

```text
标准检测基础消耗：6,000
每个模型检测：2,000
竞品分析：2,000
报告生成：4,000

6 个模型标准检测约：
6,000 + 6 * 2,000 + 2,000 + 4,000 = 24,000 Token
```

### 9.2 自媒体智能体预估

```text
标题生成：500-2,000 Token
短文生成：2,000-6,000 Token
公众号长文：8,000-20,000 Token
文章转 PPT：15,000-50,000 Token
多平台改写：按平台数量累加
```

### 9.3 销售获客智能体预估

```text
单个客户官网分析：3,000-8,000 Token
生成私信：1,000-3,000 Token
生成邮件：1,500-4,000 Token
批量分析：按客户数量累加
```

## 10. 扣费逻辑建议

### 10.1 MVP 阶段

MVP 可以采用简单扣费：

```text
任务开始前检查余额是否大于预估上限
任务完成后按实际消耗扣 Token
任务失败时不扣或只扣已实际消耗部分
```

实现简单，用户也容易理解。

### 10.2 更稳妥的生产逻辑

后续可以采用预占 + 结算：

```text
任务开始前预占预估上限 Token
任务执行中记录实际消耗
任务完成后按实际消耗结算
未使用部分退回余额
任务失败时按规则退回
```

示例：

```text
预估消耗：12,000-25,000 Token
启动任务时预占：25,000 Token
实际消耗：21,640 Token
任务完成后退回：3,360 Token
```

页面文案：

```text
系统将先预留本次任务的最高预估 Token，任务完成后按实际消耗结算，未使用部分会自动退回。
```

## 11. 余额不足与任务中断

### 11.1 启动前余额不足

提示：

```text
当前余额不足以启动该任务。
```

可选操作：

```text
降低检测深度
减少检测模型
充值 Token
升级套餐
```

### 11.2 执行中余额不足

如果 MVP 不做预占，可能出现执行中余额不足。

提示：

```text
Token 余额不足，任务已暂停。你可以充值后继续，或结束任务并保留已生成结果。
```

操作：

```text
充值并继续
结束任务
导出当前结果
```

建议生产逻辑用“预占上限”避免这个问题。

## 12. 结果继续操作的计费

结果页里的继续操作都应单独预估和扣费。

例如 GEO 结果操作：

```text
生成 FAQ：约 3,000-8,000 Token
生成 LLMs.txt：约 2,000-6,000 Token
生成官网优化文案：约 5,000-15,000 Token
导出报告：0-1,000 Token
重新运行：按新任务重新预估
```

按钮旁可展示小字：

```text
生成 FAQ
约 3,000-8,000 Token
```

## 13. 免费额度与赠送 Token

新用户可以赠送 Token，而不是赠送次数。

示例：

```text
注册赠送 20,000 Token
可用于体验 GEO 快速检测和基础内容生成
```

官网注册区文案从：

```text
现在注册立即获赠 3 次免费 GEO 全通道诊断体检额度
```

改为：

```text
现在注册立即获赠 20,000 Token，可用于体验 GEO 检测、内容生成和销售线索分析。
```

## 14. 当前项目需要修改的地方

### 14.1 官网价格区

文件：

```text
src/components/InfoSections.tsx
```

需要修改：

```text
pricingTiers 数据结构
“按任务付费，弹性灵活”标题
“单次任务包”套餐名
所有按次数描述的权益
注册赠送 3 次 GEO 的文案
```

改成：

```text
按 Token 额度使用
体验版 / 专业版 / 团队版 / 企业定制
包含 Token 数
约可完成任务范围
实际消耗以任务复杂度为准
```

### 14.2 Topbar

文件：

```text
src/components/app/Topbar.tsx
```

当前：

```text
Token ¥83.20 | GEO 2/20
```

建议：

```text
剩余 Token 183,240
```

### 14.3 用量状态

文件：

```text
src/lib/usageStore.ts
src/types/workbench.ts
```

移除或后置：

```text
geoUsed / geoLimit
contentUsed / contentLimit
salesUsed / salesLimit
```

新增：

```text
tokenBalance
monthlyTokenLimit
monthlyTokenUsed
resetAt
lowBalanceThreshold
```

### 14.4 用量页面

文件：

```text
src/pages/app/UsagePage.tsx
```

当前：

```text
Token 余额 ¥83.20
剩余任务次数
GEO 检测次数
内容生成次数
销售线索分析
```

建议：

```text
剩余 Token
本月已用 Token
本月总额度
本月 Token 使用进度
Token 消耗明细
```

### 14.5 任务模型和任务中心

文件：

```text
src/types/workbench.ts
src/pages/app/TasksPage.tsx
src/pages/app/TaskRunPage.tsx
```

当前任务字段：

```text
costType
costAmount
```

建议改为：

```text
estimatedTokenMin
estimatedTokenMax
tokenUsed
```

任务中心列名从：

```text
消耗额度
```

改为：

```text
Token 消耗
```

### 14.6 GEO 表单

文件：

```text
src/pages/app/GeoAgentPage.tsx
src/types/workbench.ts
```

当前检测深度配置里 `cost` 是次数：

```ts
quick: { cost: 1 }
standard: { cost: 1 }
deep: { cost: 2 }
```

建议改成 Token 区间：

```ts
quick: { estimatedTokenMin: 5000, estimatedTokenMax: 10000 }
standard: { estimatedTokenMin: 12000, estimatedTokenMax: 25000 }
deep: { estimatedTokenMin: 30000, estimatedTokenMax: 80000 }
```

## 15. 推荐实施顺序

### 第一步：统一文案与数据口径

```text
官网套餐改为 Token 套餐
工作台顶部改为剩余 Token
用量页改为 Token 用量页
任务中心改为 Token 消耗
```

### 第二步：改数据模型

```text
UsageSnapshot 改为 Token 账户
Task 增加预估 Token 和实际 Token
UsageLedgerEntry 改为 Token 明细
```

### 第三步：改任务启动逻辑

```text
GEO 表单根据检测深度、模型数量、竞品数量计算预估 Token
开始任务前检查余额
余额不足时提示降低深度或充值
```

### 第四步：改任务执行与结算逻辑

```text
MVP 先按任务完成后扣实际 Token
后续升级为预占上限 + 完成结算 + 未用退回
```

### 第五步：补充结果页继续操作计费

```text
生成 FAQ
生成 LLMs.txt
生成官网优化文案
重新运行
```

## 16. 产品验收标准

完成后，产品里不再出现主计费口径为“任务次数”的表达。

应满足：

```text
官网套餐以包含 Token 为主
工作台顶部展示剩余 Token
首页用量概览展示 Token 余额和本月消耗
智能体卡片展示预计 Token 区间
任务开始前展示预计 Token 消耗
任务执行页展示预计消耗和当前消耗
任务完成后展示实际 Token 消耗
任务中心展示 Token 消耗
用量页面展示 Token 余额、月额度、消耗进度和明细
余额不足时可降低任务规格或充值
```

最终用户理解应是：

> 我买的是一段智能体执行额度，不是固定次数。任务越复杂消耗越多，开始前能看到预估，完成后能看到实际扣了多少。
