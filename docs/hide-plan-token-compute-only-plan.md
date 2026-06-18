# HelloMe 隐藏套餐与算力充值方案

## 一、调整目标

HelloMe 前台不再强调套餐概念。

新的商业逻辑：

> 用户购买和消耗的是算力 Token，智能体可以随时启用和停用。

用户理解路径：

```text
充值算力
启用智能体
发起任务
消耗 Token
查看成果
继续充值
```

前台不再强调：

```text
体验版
专业版
团队版
可启用智能体数量
套餐升级
套餐到期
套餐包含权益
```

前台重点强调：

```text
剩余 Token
预计消耗
实际消耗
充值算力
智能体随时启停
任务和成果长期保留
```

## 二、核心规则

### 2.1 智能体启用规则

智能体可以随时启用。

启用智能体不扣 Token。

启用后：

```text
出现在我的工作台顶部标签栏
可以发起任务
可以查看该智能体历史任务
可以基于历史成果继续生成
```

### 2.2 智能体停用规则

智能体可以随时停用。

停用智能体不退 Token。

停用后：

```text
从我的工作台顶部标签栏移除
不能继续发起该智能体的新任务
历史任务仍可查看
历史成果仍可查看
已生成文件仍可下载
可随时重新启用
```

### 2.3 Token 消耗规则

Token 只在执行任务时消耗。

不消耗 Token：

```text
启用智能体
停用智能体
浏览智能体市场
打开智能体详情
查看历史任务
查看历史成果
复制已有成果
下载已有成果
修改个人资料
```

消耗 Token：

```text
发起新任务
继续生成
重新生成
重新检测
内容改写
基于成果生成新内容
需要模型参与的新格式整理
```

### 2.4 Token 不足规则

Token 不足时：

```text
智能体仍保持启用状态
历史任务可查看
历史成果可查看
不能发起新的消耗型任务
提示充值算力
```

任务开始前展示预计消耗：

```text
预计消耗 8,000-30,000 Token
当前剩余 12,000 Token
余额可能不足，建议先充值
```

任务执行中 Token 不足：

```text
任务暂停
保留已完成步骤
展示已消耗 Token
提示充值后继续
```

## 三、需要调整的产品模块

## 3.1 官网价格区

官网不再展示套餐卡。

调整为算力充值包。

原展示：

```text
体验版
专业版
团队版
可启用 1/3/8 个智能体
每月 Token
升级套餐
```

新展示：

```text
算力充值

新手算力包
50,000 Token
适合体验 GEO 检测和内容生成

标准算力包
500,000 Token
适合持续使用多个智能体

团队算力包
3,000,000 Token
适合团队批量执行任务

企业算力包
定制 Token
适合企业级场景和私有化需求
```

按钮文案：

```text
立即充值
获取算力
联系顾问
```

说明文案：

```text
智能体可随时启用和停用，任务执行按实际 Token 消耗结算。
```

## 3.2 登录后顶部栏

顶部栏保留 Token 信息。

不展示套餐名。

展示：

```text
剩余 Token 3,000,000
充值
```

Token 不足时：

```text
Token 余额不足
充值算力
```

去掉：

```text
当前套餐
升级套餐
套餐状态
智能体名额
```

## 3.3 我的工作台

我的工作台展示已启用智能体标签。

顶部标签栏逻辑：

```text
已启用智能体自动显示为标签
用户可以关闭标签
关闭标签只是不在当前工作台显示
停用智能体需要在智能体市场或智能体详情中操作
```

工作台顶部只展示：

```text
智能体标签
剩余 Token
充值入口
```

不展示：

```text
已启用智能体 1 / 1
可启用数量
升级套餐
```

当所有标签关闭时，展示已启用智能体卡片：

```text
已启用智能体
GEO 智能体
使用智能体
查看任务
停用
```

## 3.4 智能体市场

智能体市场隐藏套餐和名额逻辑。

顶部信息改为：

```text
剩余 Token 3,000,000
充值算力
```

广告位可展示：

```text
GEO 智能体
检测你的品牌在 AI 回答里的可见度
预计消耗 8,000-30,000 Token
立即启用
```

产品位点击逻辑：

```text
对应智能体已启用：打开工作台标签
对应智能体未启用：直接启用并打开工作台标签
Token 不足：允许启用，但发起任务时提示充值
未配对 Hz-Hermes：进入配对流程
未开放智能体：显示即将开放
```

卡片状态：

```text
已启用
可启用
即将开放
内测中
```

去掉状态：

```text
套餐不足
名额已满
可启用 1 / 1
升级套餐
```

按钮文案：

```text
已启用：使用智能体
未启用：启用智能体
即将开放：即将开放
内测中：申请内测
```

## 3.5 智能体详情页

详情页展示：

```text
智能体名称
一句话说明
适合谁
能做什么
需要输入什么
执行过程
最终交付物
预计 Token 消耗
启用 / 使用按钮
```

去掉：

```text
当前套餐是否可用
升级套餐解锁
占用智能体名额
```

启用按钮逻辑：

```text
未启用：启用智能体
已启用：使用智能体
Token 不足：仍可启用，任务开始时提示充值
```

## 3.6 启用确认弹窗

启用确认弹窗简化。

新文案：

```text
启用 GEO 智能体？

启用后会出现在我的工作台顶部标签栏。
启用智能体不消耗 Token，只有执行任务时才会按实际用量消耗 Token。
```

按钮：

```text
确认启用
取消
```

启用成功提示：

```text
已启用 GEO 智能体
```

后续动作：

```text
打开工作台标签
```

## 3.7 停用确认弹窗

停用确认弹窗保留，但去掉释放名额文案。

新文案：

```text
停用 GEO 智能体？

停用后，它将从我的工作台移除，你将不能继续发起 GEO 新任务。
历史任务、成果和已下载文件仍会保留。
你可以随时重新启用。
```

按钮：

```text
取消
确认停用
```

如果有执行中任务：

```text
GEO 智能体当前有执行中的任务。

你可以先查看任务，或取消任务后停用。
取消任务会按已完成部分结算已消耗 Token。
```

按钮：

```text
查看任务
取消任务并停用
```

## 3.8 任务中心

任务中心保留 Token 消耗字段。

字段：

```text
任务名称
使用智能体
创建时间
当前状态
执行耗时
预计 Token
实际消耗 Token
结果类型
```

状态增加：

```text
Token 不足已暂停
等待充值后继续
```

任务详情展示：

```text
原始输入
完整执行过程
中间结果
最终结果
预计 Token
实际 Token
消耗明细
错误日志
关联成果
```

## 3.9 成果中心

成果中心保留成果生成消耗。

成果详情展示：

```text
本成果生成消耗：18,420 Token
```

继续生成时展示：

```text
预计消耗 5,000-12,000 Token
当前剩余 83,200 Token
```

Token 不足时：

```text
当前 Token 不足，充值后可继续生成。
```

按钮：

```text
充值算力
```

## 3.10 用量页面

用量页面改名建议：

```text
算力中心
```

导航也可以从：

```text
智能体驾驶舱
```

改成：

```text
算力中心
```

页面核心展示：

```text
剩余 Token
累计充值 Token
累计消耗 Token
本月消耗 Token
最近消耗记录
智能体消耗排行
充值记录
```

主要按钮：

```text
充值算力
```

不展示：

```text
当前套餐
套餐状态
套餐到期
任务包余额
智能体名额
升级套餐
```

消耗明细字段：

```text
时间
任务名称
智能体
消耗 Token
消耗类型
状态
```

充值记录字段：

```text
充值时间
充值 Token
支付金额
订单状态
发票状态
```

## 3.11 个人设置

个人设置中不展示套餐信息。

可展示：

```text
头像
昵称
账号安全
登录设备
隐私设置
数据删除
```

和算力相关的内容进入算力中心。

## 四、需要调整的数据模型

### 4.1 用户资产模型

保留 Token 资产。

建议结构：

```ts
type UserComputeAccount = {
  userId: string;
  tokenBalance: number;
  lifetimePurchasedTokens: number;
  lifetimeUsedTokens: number;
  lowBalanceThreshold: number;
  updatedAt: string;
};
```

### 4.2 充值包模型

新增充值包。

```ts
type ComputePack = {
  id: string;
  name: string;
  tokenAmount: number;
  priceCents: number;
  bonusTokenAmount?: number;
  description: string;
  recommended?: boolean;
};
```

### 4.3 智能体启用模型

去掉名额限制字段。

```ts
type EnabledAgent = {
  userId: string;
  agentId: string;
  enabledAt: string;
  disabledAt?: string;
  status: 'enabled' | 'disabled';
  monthlyTokenUsed: number;
  totalTokenUsed: number;
  lastUsedAt?: string;
};
```

### 4.4 任务消耗模型

任务记录实际消耗。

```ts
type TaskTokenUsage = {
  taskId: string;
  userId: string;
  agentId: string;
  estimatedTokenMin: number;
  estimatedTokenMax: number;
  actualTokenUsed: number;
  status: 'estimated' | 'settled' | 'paused_insufficient_balance' | 'refunded';
  createdAt: string;
  settledAt?: string;
};
```

## 五、需要调整的代码位置

### 5.1 官网价格区

涉及文件：

```text
src/components/InfoSections.tsx
```

调整内容：

```text
套餐卡改为算力充值包
去掉可启用智能体数量
去掉升级套餐文案
保留 Token 包说明
```

### 5.2 智能体市场

涉及文件：

```text
src/pages/app/AgentsPage.tsx
src/components/app/agents/AgentSlotModals.tsx
src/state/agentSlots.ts
src/data/agentsCatalog.ts
```

调整内容：

```text
去掉名额判断
去掉套餐不足状态
去掉已启用 1 / 1 展示
启用智能体不再检查 slotsRemaining
停用智能体不再释放名额文案
保留 Token 余额不足提示
```

### 5.3 工作台标签栏

涉及文件：

```text
src/components/app/WorkbenchTabsBar.tsx
src/components/app/EnabledAgentsPanel.tsx
src/state/workbenchTabs.ts
```

调整内容：

```text
标签只跟已启用智能体和用户关闭状态有关
不再展示可启用数量
关闭标签不等于停用智能体
停用智能体后从标签栏移除
```

### 5.4 顶部栏

涉及文件：

```text
src/components/app/Topbar.tsx
```

调整内容：

```text
展示剩余 Token
入口文案改为充值
去掉套餐相关文案
```

### 5.5 用量页面

涉及文件：

```text
src/pages/app/UsagePage.tsx
src/state/usageStore.ts
```

调整内容：

```text
页面改为算力中心
展示充值和消耗
去掉套餐名、月度额度、套餐状态
保留 Token 余额、消耗明细、智能体消耗排行
```

### 5.6 路由和导航

涉及文件：

```text
src/components/app/AppShell.tsx
src/App.tsx
```

调整内容：

```text
导航文案从用量/智能体驾驶舱改为算力中心
保留 /app/usage 路由或新增 /app/compute
```

## 六、需要调整的现有文档

以下文档需要按新逻辑更新：

```text
docs/login-workbench-design.md
docs/token-billing-plan.md
docs/agent-slot-quota-plan.md
docs/agents-gallery-management-plan.md
docs/home-enabled-agents-plan.md
docs/agents-market-homepage-layout-plan.md
docs/my-workbench-agent-tabs-plan.md
docs/results-center-plan.md
docs/hermes-download-pairing-plan.md
```

重点替换：

```text
套餐 -> 算力充值
升级套餐 -> 充值算力
当前套餐 -> 当前剩余 Token
可启用智能体数量 -> 已启用智能体
名额已满 -> 无此状态
套餐不足 -> 无此状态
```

## 七、页面文案统一

### 7.1 推荐用语

```text
剩余 Token
充值算力
预计消耗
实际消耗
Token 不足
启用智能体
停用智能体
使用智能体
继续生成
```

### 7.2 不再使用

```text
套餐
升级套餐
套餐到期
套餐状态
可启用智能体数量
智能体名额
名额已满
任务包
月度额度
```

## 八、第一版改造范围

第一版必做：

```text
官网套餐区改成算力充值包
顶部栏只展示剩余 Token 和充值
智能体市场去掉名额和套餐逻辑
启用智能体不再受数量限制
停用文案去掉释放名额
用量页面改成算力中心
任务开始前展示预计 Token
Token 不足时提示充值
```

第一版暂后置：

```text
复杂充值订单系统
发票系统
企业定制算力合同
团队算力池
Token 自动续费
用量预警短信
```

## 九、最终定义

> HelloMe 不卖套餐，卖算力。智能体可以随时启用和停用，用户真正付费和消耗的是任务执行产生的 Token。
