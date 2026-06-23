# HelloMe 后台用户管理功能详细方案

## 一、模块定位

后台用户管理用于查看、检索、诊断和处理 HelloMe 用户的完整生命周期。

核心目标：

> 运营、客服、财务和技术人员可以围绕一个用户，快速看到账号资料、算力余额、订单充值、任务成果、Hermes 配对、第三方绑定和操作记录，并完成必要的人工处理。

当前项目已有基础：

```text
User
UsageLedger
BillingTopup
Task
TaskArtifact
HermesDevice
GnomicAccountBinding
后台 /api/admin/users
后台 /api/admin/users/:id
后台 /api/admin/users/:id/token-adjustments
```

需要补齐：

```text
用户状态
用户筛选搜索
用户详情完整聚合
订单与算力调整
设备与第三方绑定管理
禁用/解禁
客服备注
操作日志
数据导出
```

## 二、用户管理导航

后台用户管理建议作为一级模块：

```text
用户管理
```

二级页面：

```text
用户列表
用户详情
算力调整记录
第三方绑定
设备配对
用户操作日志
```

也可以在用户详情中整合成 Tab：

```text
基础信息
算力与订单
任务记录
成果记录
设备与配对
第三方绑定
操作日志
客服备注
```

## 三、用户列表

### 3.1 列表字段

用户列表展示：

```text
用户 ID
手机号
昵称
头像
注册时间
最近登录时间
Token 余额
累计充值 Token
累计消耗 Token
任务数
成果数
Hermes 状态
Gnomic 绑定
用户状态
操作
```

第一版字段：

```text
手机号
昵称
注册时间
Token 余额
任务数
Hermes 状态
Gnomic 绑定
用户状态
操作
```

### 3.2 用户状态

用户状态：

```text
正常
禁用
```

状态含义：

```text
正常：可登录、可使用智能体、可充值、可执行任务
禁用：不可登录，不可发起任务
```

### 3.3 搜索能力

支持搜索：

```text
手机号
用户 ID
externalId
昵称
订单号
任务 ID
Gnomic 用户 ID
设备 ID
```

搜索框 placeholder：

```text
搜索手机号、用户ID、订单号、任务ID
```

### 3.4 筛选能力

筛选项：

```text
用户状态
注册时间
最近登录时间
Token 余额区间
是否配对 Hermes
是否绑定 Gnomic
是否有充值
是否有任务
任务状态
```

常用快捷筛选：

```text
今日新增
近 7 天新增
Token 余额不足
已充值用户
未配对 Hermes
有失败任务
高消耗用户
```

### 3.5 列表操作

单个用户操作：

```text
查看详情
调整 Token
查看任务
查看订单
查看成果
禁用用户
添加备注
```

批量操作：

```text
导出用户
批量打标签
批量添加备注
批量发送通知，后置
```

## 四、用户详情页

用户详情页采用：

```text
顶部用户摘要 + 下方 Tab
```

### 4.1 顶部用户摘要

展示：

```text
头像
昵称
手机号
用户 ID
注册时间
最近登录时间
用户状态
Token 余额
累计充值
累计消耗
任务数
成果数
```

状态标签：

```text
正常
禁用
Token 余额不足
Hermes 已配对
Gnomic 已绑定
```

顶部快捷操作：

```text
调整 Token
禁用 / 解禁
添加备注
查看操作日志
```

## 五、基础信息 Tab

### 5.1 基础字段

展示：

```text
内部用户 ID
externalId
手机号
昵称
头像
邮箱，当前可为空
注册时间
更新时间
最近登录时间
登录来源
用户状态
```

结合当前产品规则：

```text
登录方式：手机号
邮箱：无邮箱登录，字段可隐藏或显示为空
默认昵称：哈基米 + 6 个随机字母
可编辑字段：头像、昵称
```

### 5.2 可编辑能力

后台可编辑：

```text
昵称
头像
用户状态
客服备注
用户标签
```

后台不可直接编辑：

```text
手机号
externalId
注册时间
Token 消耗账本
任务执行记录
```

手机号变更建议后置，需要单独安全流程。

### 5.3 用户标签

可添加标签：

```text
重点客户
测试账号
内部账号
高价值用户
风险用户
售后处理中
企业客户
```

标签用于筛选和运营。

## 六、算力与订单 Tab

### 6.1 算力账户摘要

展示：

```text
当前 Token 余额
累计充值 Token
累计赠送 Token
累计消耗 Token
本月消耗 Token
最近一次充值时间
最近一次消耗时间
```

### 6.2 充值记录

当前已有：

```text
BillingTopup
```

列表字段：

```text
充值记录 ID
Token 数量
备注
创建时间
操作来源
操作人
关联订单，后置
```

### 6.3 消耗账本

当前已有：

```text
UsageLedger
```

列表字段：

```text
时间
任务 ID
任务名称
智能体
消耗 Token
状态
账本类型
```

状态：

```text
reserved
settled
refunded
failed
```

### 6.4 Token 人工调整

入口：

```text
调整 Token
```

调整类型：

```text
补发
赠送
客服补偿
活动奖励
测试发放
扣减
退款回收
错误修正
```

表单字段：

```text
调整类型
Token 数量
调整原因
备注
是否通知用户
```

规则：

```text
正数表示增加 Token
负数表示扣减 Token
扣减后余额不能小于 0
高金额调整需要二次确认
所有调整必须写入操作日志
```

确认弹窗：

```text
确认调整该用户 Token？

用户：13800138000
调整数量：+50,000 Token
原因：客服补偿

该操作会影响用户算力余额，并记录到后台操作日志。
```

## 七、任务记录 Tab

### 7.1 任务列表

展示该用户全部任务。

字段：

```text
任务 ID
任务名称
智能体
任务状态
创建时间
开始时间
完成时间
预计 Token
实际 Token
是否需要确认
Hermes 执行状态
```

任务状态：

```text
draft
queued
running
waiting_confirmation
completed
failed
cancelled
```

### 7.2 任务操作

支持：

```text
查看任务详情
查看执行步骤
查看事件日志
查看 Hermes 日志
查看成果
取消任务
重试任务
导出任务日志
```

高风险操作：

```text
取消运行中任务
重试失败任务
人工标记失败
```

需要记录操作日志。

### 7.3 任务详情抽屉

展示：

```text
任务基础信息
原始输入
执行步骤
事件日志
HermesExecution
ExecutionGrant
Token 消耗
生成成果
错误信息
```

## 八、成果记录 Tab

### 8.1 成果列表

基于：

```text
TaskArtifact
```

字段：

```text
成果 ID
成果名称
成果类型
来源任务
文件名
文件大小
MIME 类型
创建时间
状态
```

成果类型：

```text
文档
表格
PPT
网页/代码
图片
视频
音频
其他
```

### 8.2 成果操作

支持：

```text
预览
下载
查看来源任务
隐藏成果
恢复成果
删除成果，谨慎
```

第一版建议只做：

```text
预览
下载
查看来源任务
```

删除和隐藏后置。

## 九、设备与配对 Tab

### 9.1 Hermes 设备

基于：

```text
HermesDevice
```

字段：

```text
设备 ID
设备名称
系统
版本
状态
最后在线时间
调试开关
创建时间
更新时间
```

状态：

```text
connected
offline
revoked
unknown
```

### 9.2 设备操作

支持：

```text
查看设备详情
解除绑定
关闭调试
查看最近任务
查看事件回传
```

解除绑定确认：

```text
确认解除该用户的 Hermes 设备绑定？

解除后用户需要重新在 Hz-Hermes 中一键配对。
```

### 9.3 ExecutionGrant

展示该用户相关授权：

```text
Grant ID
任务 ID
Skill
设备 ID
Token 预算
过期时间
撤销时间
创建时间
```

操作：

```text
撤销 Grant
查看关联任务
```

## 十、第三方绑定 Tab

### 10.1 Gnomic 绑定

基于：

```text
GnomicAccountBinding
```

展示：

```text
绑定 ID
HelloMe 用户 ID
Gnomic 用户 ID
手机号
绑定状态
创建时间
更新时间
最近 SSO 时间，后置
```

操作：

```text
解除绑定
重新绑定
查看 SSO 记录
测试跳转
```

解除绑定确认：

```text
确认解除 Gnomic 绑定？

解除后用户下次从 HelloMe 进入 Gnomic 时，会重新进行账号查找和绑定。
```

### 10.2 AgentYun 绑定

展示：

```text
AgentYun 用户 ID
绑定状态
最近跳转
失败记录
```

操作：

```text
解除绑定
重新绑定
测试跳转
```

## 十一、操作日志 Tab

展示与该用户有关的后台操作。

字段：

```text
时间
操作人
模块
动作
目标对象
修改前
修改后
IP
备注
```

典型动作：

```text
调整 Token
禁用用户
解禁用户
修改昵称
修改头像
解除设备绑定
解除 Gnomic 绑定
取消任务
重试任务
添加备注
```

## 十二、客服备注 Tab

用于客服和运营记录用户情况。

备注字段：

```text
备注内容
备注类型
创建人
创建时间
是否置顶
```

备注类型：

```text
普通备注
投诉
退款
技术问题
重点客户
风险提醒
```

展示规则：

```text
置顶备注展示在用户详情顶部
所有备注按时间倒序
备注不可物理删除，只能隐藏或作废
```

## 十三、用户状态管理

### 13.1 禁用用户

禁用后：

```text
不能登录
不能发起任务
不能充值
保留历史任务和成果
后台仍可查看
```

禁用表单：

```text
禁用原因
备注
是否通知用户
```

### 13.2 解禁用户

解禁后：

```text
恢复登录
恢复使用
恢复充值
```

## 十四、用户数据导出

支持导出：

```text
用户列表
用户充值记录
用户消耗记录
用户任务记录
用户成果记录
```

导出格式：

```text
CSV
XLSX，后置
```

导出必须记录操作日志。

## 十五、后台接口建议

### 15.1 用户列表

```http
GET /api/admin/users
```

Query：

```text
q
status
hasHermes
hasGnomic
hasTopup
lowBalance
createdFrom
createdTo
page
pageSize
```

### 15.2 用户详情

```http
GET /api/admin/users/:id
```

返回：

```text
profile
usage
topups
ledgers
tasks
artifacts
devices
gnomicBinding
agentsyunBinding
notes
auditLogs
```

### 15.3 更新用户状态

```http
PUT /api/admin/users/:id/status
```

Body：

```json
{
  "status": "disabled",
  "reason": "异常使用",
  "note": "客服确认后临时禁用"
}
```

### 15.4 调整 Token

当前已有：

```http
POST /api/admin/users/:id/token-adjustments
```

建议 Body：

```json
{
  "type": "compensation",
  "tokenAmount": 50000,
  "reason": "客服补偿",
  "note": "任务失败补偿",
  "notifyUser": false
}
```

### 15.5 用户任务

```http
GET /api/admin/users/:id/tasks
```

### 15.6 用户成果

```http
GET /api/admin/users/:id/artifacts
```

### 15.7 用户设备

```http
GET /api/admin/users/:id/devices
POST /api/admin/users/:id/devices/:deviceId/revoke
```

### 15.8 第三方绑定

```http
GET  /api/admin/users/:id/integrations
POST /api/admin/users/:id/integrations/gnomic/unbind
POST /api/admin/users/:id/integrations/agentsyun/unbind
```

### 15.9 用户备注

```http
GET  /api/admin/users/:id/notes
POST /api/admin/users/:id/notes
PUT  /api/admin/users/:id/notes/:noteId
```

## 十六、数据模型补充

当前 User 模型缺少状态、最近登录、标签等后台管理字段。

建议新增：

```prisma
model UserProfileAdminMeta {
  id             String   @id @default(cuid())
  userId         String   @unique
  status         String   @default("active")
  tags           Json?
  lastLoginAt    DateTime?
  disabledAt     DateTime?
  disabledReason String?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}
```

用户备注：

```prisma
model UserAdminNote {
  id          String   @id @default(cuid())
  userId      String
  type        String
  content     String
  pinned      Boolean  @default(false)
  hidden      Boolean  @default(false)
  createdBy   String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([userId, createdAt])
}
```

Token 调整记录：

```prisma
model TokenAdjustment {
  id              String   @id @default(cuid())
  userId          String
  type            String
  tokenAmount     Int
  balanceBefore   Int
  balanceAfter    Int
  reason          String
  note            String?
  createdBy       String
  createdAt       DateTime @default(now())

  @@index([userId, createdAt])
}
```

## 十七、权限控制

用户管理权限：

```text
user.view
user.edit_profile
user.edit_status
user.adjust_token
user.view_orders
user.view_tasks
user.view_artifacts
user.manage_devices
user.manage_integrations
user.export
user.add_note
```

角色建议：

```text
客服：查看用户、任务、成果、添加备注
财务：查看订单、调整 Token、导出充值记录
运营：查看用户、打标签、查看任务成果
技术：查看设备、Grant、日志、第三方绑定
超级管理员：全部权限
```

## 十八、第一版实现范围

第一版必做：

```text
用户列表
用户搜索
用户详情
算力摘要
充值记录
消耗账本
任务记录
成果记录
Hermes 设备
Gnomic 绑定
Token 人工调整
操作日志
```

第一版后置：

```text
用户禁用/解禁
用户标签
客服备注
批量导出
AgentYun 绑定管理
设备解绑
成果隐藏/删除
任务重试/取消
```

## 十九、最终定义

> 后台用户管理不是只看用户资料，而是围绕单个用户聚合账号、算力、订单、任务、成果、设备、第三方绑定和后台操作记录，让运营、客服、财务和技术都能在一个页面完成用户问题定位和处理。
