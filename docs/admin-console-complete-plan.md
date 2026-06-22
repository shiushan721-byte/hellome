# HelloMe 后台管理系统完整方案

## 一、后台定位

HelloMe 后台是整个平台的运营配置和业务管理中心。

核心定位：

> 所有前台展示内容、智能体、工作流、用户、订单、算力、任务、成果和第三方平台打通，都应该能在后台配置和管理。

后台不只是管理数据，还要控制前台展示。

前台展示来源：

```text
首页展示
智能体市场
广告位
产品位
智能体卡片
工作流模板市场
成果中心分类
算力充值包
帮助文案
侧边导航
更多菜单
```

都应该逐步从静态代码配置迁移到后台配置。

## 二、当前项目基础

项目当前已有这些能力，可以复用：

```text
React + Vite 前端
Express 后端
Prisma + PostgreSQL
用户登录 auth kit
任务 Task / TaskStep / TaskArtifact
成果 Results
算力 UsageLedger / BillingTopup
Skill / SkillVersion
HermesDevice / ExecutionGrant
Gnomic SSO
AgentYun SSO
公开智能体市场
工作流模板市场雏形
```

已有相关文件：

```text
src/App.tsx
src/components/app/AppSidebar.tsx
src/lib/sidebarNav.ts
src/data/agentsCatalog.ts
src/data/agentsMarketHome.ts
src/data/workflowMarket.ts
src/server/publishedMarketService.ts
src/server/skillStudioService.ts
src/server/adminSkillService.ts
src/server/billingService.ts
src/server/gnomic/gnomicSsoService.ts
prisma/schema.prisma
```

当前需要补齐：

```text
后台管理页面
后台权限体系
前台展示配置表
订单管理
用户管理
运营配置发布流程
操作审计
配置版本管理
```

## 三、后台整体模块

后台建议分为 10 个一级模块：

```text
1. 仪表盘
2. 前台配置
3. 智能体管理
4. 工作流模板管理
5. 用户管理
6. 订单与算力
7. 任务与成果
8. Hermes 设备与授权
9. 第三方平台打通
10. 系统设置与审计
```

导航结构：

```text
后台首页
前台配置
  首页配置
  智能体市场配置
  工作流市场配置
  导航与菜单配置
  文案配置

智能体管理
  智能体列表
  智能体详情
  Skill 版本
  发布审核

工作流模板
  Gnomic 模板
  模板分类
  模板推荐位

用户管理
  用户列表
  用户详情
  设备与配对
  SSO 绑定

订单与算力
  订单列表
  充值记录
  算力账户
  消耗账本
  退款/补偿

任务与成果
  任务列表
  任务详情
  成果列表
  文件与附件

系统设置
  管理员账号
  角色权限
  操作日志
  发布记录
```

## 四、后台角色权限

### 4.1 角色设计

建议后台角色：

```text
超级管理员
运营管理员
内容管理员
财务管理员
客服管理员
技术管理员
只读观察员
```

### 4.2 权限矩阵

```text
超级管理员：
全部权限

运营管理员：
前台配置、智能体市场、工作流模板、发布配置

内容管理员：
智能体内容、Banner、产品位、文案、模板上下架

财务管理员：
订单、充值、算力调整、发票、退款

客服管理员：
用户查询、任务查询、成果查询、设备状态、SSO 绑定查询

技术管理员：
Skill、模型、Hermes、ExecutionGrant、系统日志

只读观察员：
只能查看，不能修改
```

### 4.3 权限动作

基础权限动作：

```text
view
create
edit
publish
unpublish
delete
export
refund
grant_tokens
revoke
```

所有后台写操作必须记录操作日志。

## 五、前台配置中心

前台配置中心是后台最重要的模块。

目标：

> 前台所有展示内容都能由后台配置，不再写死在 `src/data/*` 里。

### 5.1 首页配置

可配置内容：

```text
首页 Hero
主标题
副标题
主按钮
副按钮
智能体推荐区
热门场景
Hz-Hermes 说明区
算力 Token 说明
FAQ
底部信息
```

字段：

```text
模块名称
模块类型
排序
展示状态
标题
副标题
图片/视频
按钮文案
按钮跳转
生效时间
失效时间
目标人群
```

### 5.2 智能体市场配置

当前代码里智能体市场由这些静态文件控制：

```text
src/data/agentsCatalog.ts
src/data/agentsMarketHome.ts
src/data/marketBannerImages.ts
```

后台需要接管：

```text
顶部 Banner
中 Banner
产品位
分类导航
智能体卡片
智能体详情
推荐排序
即将开放状态
内测状态
```

Banner 配置字段：

```text
Banner 名称
位置
标题
副标题
视觉图
背景色/渐变
关联智能体
按钮文案
按钮动作
排序
状态
开始时间
结束时间
```

产品位配置字段：

```text
产品位名称
一句话说明
图标
关联智能体
展示状态
排序
点击动作
```

智能体卡片配置字段：

```text
智能体 ID
智能体名称
一句话说明
分类
图标
预计 Token
状态：开放 / 即将开放 / 内测 / 下架
标签
推荐权重
详情页配置
工作台路由
```

### 5.3 工作流模板市场配置

当前项目已有：

```text
src/data/workflowMarket.ts
src/components/app/workflows/WorkflowMarketSection.tsx
src/components/app/workflows/WorkflowMarketCard.tsx
```

后台需要管理：

```text
Gnomic 模板列表
模板分类
模板封面
模板标题
模板作者
发布时间
单次价格
推荐排序
体验入口
制作同款入口
上下架
```

模板字段：

```text
templateId
标题
分类
封面图
作者
价格
发布时间
状态
排序
Gnomic 跳转参数
是否推荐
```

### 5.4 导航与菜单配置

当前导航在：

```text
src/lib/sidebarNav.ts
```

后台可配置：

```text
游客态导航
登录态导航
更多菜单
底部协议链接
社交媒体链接
API 入口
教程入口
```

第一版可以先保留代码配置，P1 再后台化。

### 5.5 文案配置

需要后台配置的文案：

```text
登录弹窗
Hz-Hermes 配对弹窗
Token 不足提示
任务确认提示
错误提示
空状态文案
FAQ
协议链接
隐私政策链接
```

## 六、智能体管理

智能体管理包括展示智能体和真实可执行 Skill。

### 6.1 智能体列表

字段：

```text
智能体 ID
名称
分类
状态
前台是否展示
工作台路由
关联 Skill
当前版本
预计 Token
创建时间
更新时间
发布状态
```

状态：

```text
草稿
已发布
即将开放
内测
已下架
归档
```

### 6.2 智能体详情

可编辑：

```text
名称
图标
一句话说明
详情介绍
适合谁
能做什么
需要输入什么
执行过程
最终交付物
预计 Token 区间
分类
标签
排序权重
```

### 6.3 Skill 版本管理

复用当前：

```text
Skill
SkillVersion
SkillDebugRun
```

后台能力：

```text
查看 Skill 版本
编辑业务配置
调试运行
发布新版本
回滚版本
归档版本
查看 checksum
```

### 6.4 发布流程

推荐流程：

```text
草稿
预览
提交审核
审核通过
发布
下架 / 回滚
```

发布时生成：

```text
发布记录
配置快照
操作人
发布时间
变更说明
```

## 七、工作流模板管理

用于管理 Gnomic 模板市场在 HelloMe 内的展示。

### 7.1 模板列表

字段：

```text
模板 ID
模板名称
分类
作者
价格
状态
推荐权重
Gnomic templateId
体验跳转
制作同款跳转
创建时间
更新时间
```

### 7.2 模板操作

```text
新增模板
编辑模板
上架
下架
推荐
取消推荐
预览跳转
同步 Gnomic 信息
```

### 7.3 Gnomic SSO 管理

展示：

```text
绑定用户数
今日跳转次数
自动注册数
SSO 失败数
模板点击排行
```

可查询：

```text
HelloMe 用户
Gnomic 用户
绑定状态
最近跳转时间
失败原因
```

## 八、用户管理

### 8.1 用户列表

字段：

```text
用户 ID
手机号
昵称
头像
注册时间
最近登录时间
Token 余额
累计充值
累计消耗
Hermes 配对状态
Gnomic 绑定状态
任务数
状态
```

用户状态：

```text
正常
禁用
风控
注销中
已注销
```

### 8.2 用户详情

展示：

```text
基础资料
登录记录
Token 账户
充值订单
消耗账本
任务记录
成果记录
Hermes 设备
Gnomic 绑定
AgentYun 绑定
操作日志
```

### 8.3 用户操作

```text
修改昵称
重置头像
禁用用户
解禁用户
补发 Token
扣减 Token
解除第三方绑定
查看任务
查看成果
```

高风险操作必须二次确认。

## 九、订单与算力管理

当前已有：

```text
BillingTopup
UsageLedger
```

后台需要补齐订单概念。

### 9.1 订单列表

字段：

```text
订单号
用户
订单类型
支付金额
Token 数量
支付渠道
订单状态
创建时间
支付时间
退款状态
```

订单状态：

```text
待支付
已支付
已取消
已关闭
已退款
部分退款
```

### 9.2 算力账户

展示：

```text
当前余额
累计充值
累计消耗
冻结 Token
赠送 Token
过期 Token，后置
```

### 9.3 充值包管理

可配置：

```text
充值包名称
Token 数量
售价
赠送 Token
是否推荐
是否上架
排序
适用人群
```

### 9.4 人工调整 Token

操作类型：

```text
补发 Token
扣减 Token
赠送 Token
退款回收
活动奖励
客服补偿
```

必须记录：

```text
操作人
调整原因
调整前余额
调整数量
调整后余额
关联订单
备注
```

## 十、任务与成果管理

### 10.1 任务管理

字段：

```text
任务 ID
用户
智能体
状态
创建时间
开始时间
完成时间
预计 Token
实际 Token
Hermes 状态
错误信息
```

操作：

```text
查看详情
查看执行步骤
查看日志
取消任务
重试任务
标记失败
导出日志
```

### 10.2 成果管理

当前已有：

```text
TaskArtifact
ResultsPage
resultsCenter
```

后台展示：

```text
成果 ID
用户
来源任务
成果类型
文件名
文件大小
生成时间
下载次数
状态
```

操作：

```text
预览
下载
隐藏
删除
恢复
查看来源任务
```

## 十一、Hermes 设备与授权管理

当前已有：

```text
HermesDevice
ExecutionGrant
HermesExecution
Hermes pairing API
```

后台管理：

```text
设备列表
设备状态
最后在线时间
版本号
用户绑定关系
调试开关
授权记录
ExecutionGrant
事件回传日志
```

操作：

```text
解除设备绑定
关闭调试
撤销 Grant
查看任务执行日志
```

## 十二、第三方平台打通管理

第三方包括：

```text
Gnomic
AgentYun
后续其他平台
```

### 12.1 Gnomic 管理

展示：

```text
HelloMe 用户
Gnomic 用户 ID
手机号
绑定状态
创建方式
最近 SSO 时间
失败记录
```

操作：

```text
解除绑定
重新绑定
查看 SSO 日志
重新发起同步
```

### 12.2 AgentYun 管理

展示：

```text
HelloMe 用户
AgentYun 用户 ID
绑定状态
最近跳转
失败记录
```

## 十三、系统设置与审计

### 13.1 管理员账号

字段：

```text
管理员 ID
姓名
手机号
角色
状态
最近登录
创建时间
```

操作：

```text
新增管理员
修改角色
禁用管理员
重置登录
```

### 13.2 操作日志

所有后台写操作必须记录。

字段：

```text
操作人
操作模块
操作动作
目标对象
修改前
修改后
IP
User Agent
时间
```

### 13.3 发布记录

记录前台配置和智能体配置发布。

字段：

```text
发布 ID
发布模块
版本号
发布人
发布时间
变更说明
配置快照
回滚状态
```

## 十四、数据模型建议

在现有 Prisma 基础上新增以下模型。

### 14.1 AdminUser

```prisma
model AdminUser {
  id          String   @id @default(cuid())
  phone       String   @unique
  name        String
  roleId      String
  status      String   @default("active")
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### 14.2 AdminRole

```prisma
model AdminRole {
  id          String   @id @default(cuid())
  name        String
  code        String   @unique
  permissions Json
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### 14.3 FrontendConfig

```prisma
model FrontendConfig {
  id          String   @id @default(cuid())
  key         String
  name        String
  scope       String
  version     Int      @default(1)
  status      String   @default("draft")
  payload     Json
  publishedAt DateTime?
  createdBy   String?
  updatedBy   String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@unique([key, version])
  @@index([scope, status])
}
```

scope 示例：

```text
home
agent_market
workflow_market
navigation
copywriting
recharge
```

### 14.4 PublishRecord

```prisma
model PublishRecord {
  id          String   @id @default(cuid())
  module      String
  targetKey   String
  version     Int
  title       String
  diff        Json?
  snapshot    Json
  publishedBy String
  createdAt   DateTime @default(now())
}
```

### 14.5 AuditLog

```prisma
model AuditLog {
  id          String   @id @default(cuid())
  actorId     String
  actorName   String?
  module      String
  action      String
  targetType  String
  targetId    String?
  before      Json?
  after       Json?
  ip          String?
  userAgent   String?
  createdAt   DateTime @default(now())

  @@index([actorId, createdAt])
  @@index([module, createdAt])
}
```

### 14.6 Order

```prisma
model Order {
  id          String   @id @default(cuid())
  orderNo     String   @unique
  userId      String
  type        String
  amountCents Int
  tokenAmount Int
  channel     String?
  status      String
  paidAt      DateTime?
  refundedAt  DateTime?
  metadata    Json?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### 14.7 RechargePack

```prisma
model RechargePack {
  id          String   @id @default(cuid())
  name        String
  tokenAmount Int
  bonusTokens Int      @default(0)
  priceCents  Int
  status      String   @default("draft")
  recommended Boolean  @default(false)
  sortOrder   Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### 14.8 WorkflowTemplate

```prisma
model WorkflowTemplate {
  id          String   @id @default(cuid())
  templateId  String   @unique
  title       String
  category    String
  coverUrl    String?
  authorName  String?
  pricePerRun Int?
  gnomicPath  String
  status      String   @default("draft")
  sortOrder   Int      @default(0)
  recommended Boolean  @default(false)
  metadata    Json?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

## 十五、后台接口规划

后台接口统一前缀：

```text
/api/admin
```

### 15.1 前台配置接口

```text
GET    /api/admin/frontend-configs
GET    /api/admin/frontend-configs/:id
POST   /api/admin/frontend-configs
PUT    /api/admin/frontend-configs/:id
POST   /api/admin/frontend-configs/:id/publish
POST   /api/admin/frontend-configs/:id/rollback
```

前台读取已发布配置：

```text
GET /api/public/configs/:scope
```

### 15.2 智能体管理接口

可复用：

```text
/api/studio/skills
/api/studio/orchestrator/agents
/api/published-market/agents
```

新增后台：

```text
GET  /api/admin/agents
PUT  /api/admin/agents/:id/display
POST /api/admin/agents/:id/publish
POST /api/admin/agents/:id/unpublish
```

### 15.3 用户接口

```text
GET  /api/admin/users
GET  /api/admin/users/:id
PUT  /api/admin/users/:id/status
POST /api/admin/users/:id/token-adjustments
GET  /api/admin/users/:id/tasks
GET  /api/admin/users/:id/orders
GET  /api/admin/users/:id/ledgers
```

### 15.4 订单接口

```text
GET  /api/admin/orders
GET  /api/admin/orders/:id
POST /api/admin/orders/:id/refund
GET  /api/admin/recharge-packs
POST /api/admin/recharge-packs
PUT  /api/admin/recharge-packs/:id
```

### 15.5 任务和成果接口

```text
GET  /api/admin/tasks
GET  /api/admin/tasks/:id
POST /api/admin/tasks/:id/cancel
POST /api/admin/tasks/:id/retry
GET  /api/admin/artifacts
GET  /api/admin/artifacts/:id
PUT  /api/admin/artifacts/:id/status
```

### 15.6 第三方接口

```text
GET  /api/admin/integrations/gnomic/bindings
GET  /api/admin/integrations/gnomic/tickets
POST /api/admin/integrations/gnomic/bindings/:id/disable
GET  /api/admin/integrations/agentsyun/bindings
```

## 十六、后台页面设计

后台使用独立路由：

```text
/admin
```

页面：

```text
/admin/dashboard
/admin/frontend/home
/admin/frontend/agent-market
/admin/frontend/workflow-market
/admin/agents
/admin/workflows
/admin/users
/admin/orders
/admin/billing
/admin/tasks
/admin/results
/admin/hermes
/admin/integrations
/admin/settings
/admin/audit-logs
```

后台布局：

```text
左侧导航
顶部搜索
右侧管理员信息
主体内容
```

后台 UI 风格：

```text
信息密度高
表格为主
抽屉详情
弹窗确认
状态标签
筛选搜索
批量操作
```

## 十七、前台读取后台配置的方式

第一版可以采用：

```text
前台启动时请求已发布配置
没有配置时使用本地静态兜底
```

读取流程：

```text
GET /api/public/configs/agent_market
成功：使用后台配置
失败：使用 src/data/agentsMarketHome.ts 兜底
```

需要支持缓存：

```text
ETag
version
updatedAt
localStorage 缓存，后置
```

发布配置后：

```text
前台下一次刷新生效
或后台触发缓存刷新，后置
```

## 十八、实现优先级

### P0：后台基础能力

```text
后台登录与角色权限
后台基础布局
用户列表和用户详情
订单/充值记录
算力账户和人工调整 Token
任务列表和任务详情
成果列表
操作日志
```

### P1：前台展示配置

```text
智能体市场 Banner 配置
产品位配置
智能体卡片配置
工作流模板配置
充值包配置
前台读取已发布配置
配置发布和回滚
```

### P2：智能体与工作流运营

```text
Skill 版本管理
智能体发布审核
Gnomic 模板同步
推荐排序
AB 测试
灰度发布
```

### P3：企业级能力

```text
多管理员组织
细粒度权限
批量导入导出
数据报表
风控系统
工单系统
```

## 十九、第一版建议范围

第一版后台建议先做：

```text
1. 用户管理
2. 订单与算力管理
3. 任务与成果查看
4. 智能体市场展示配置
5. 工作流模板展示配置
6. 操作日志
```

第一版先不做：

```text
复杂审核流
AB 测试
灰度发布
多组织权限
自动风控
复杂数据看板
```

## 二十、最终定义

> HelloMe 后台是前台展示、智能体运营、工作流模板、用户、订单、算力、任务和成果的统一管理中心。前台只负责展示和使用，后台负责配置、发布、管理和审计。
