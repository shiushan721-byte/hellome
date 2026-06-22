# HelloMe 接入 Gnomic 模板市场实现方案

## 一、目标

HelloMe 接入 Gnomic 模板市场。

用户在 HelloMe 内点击 Gnomic 模板后，不需要重新登录 Gnomic。

目标体验：

```text
用户已登录 HelloMe
点击 Gnomic 模板
如果该账号已注册 Gnomic：直接进入已登录的 Gnomic 页面
如果该账号未注册 Gnomic：自动创建 Gnomic 账号后进入已登录页面
```

未登录 HelloMe 时：

```text
点击 Gnomic 模板
弹出 HelloMe 登录
登录成功后继续跳转 Gnomic
```

## 二、当前项目现状

项目中已有 Gnomic 工作流市场雏形。

相关文件：

```text
src/data/workflowMarket.ts
src/components/app/workflows/WorkflowMarketSection.tsx
src/components/app/workflows/WorkflowMarketCard.tsx
```

当前逻辑：

```text
WorkflowMarketCard 点击后直接 window.open Gnomic URL
```

后续要改成：

```text
点击模板
检查 HelloMe 登录态
调用 HelloMe 后端 SSO 接口
由 HelloMe 后端完成 Gnomic 账号查找/创建/绑定
跳转到 Gnomic SSO 登录地址
Gnomic 设置登录态后进入目标模板页
```

## 三、整体架构

推荐采用：

```text
账号映射 + 服务端 SSO + 一次性 ticket
```

流程：

```text
HelloMe 前端
  ↓
HelloMe 后端 /api/gnomic/sso/start
  ↓
Gnomic 后端账号接口
  ↓
HelloMe 生成或请求 SSO ticket
  ↓
跳转 Gnomic SSO 地址
  ↓
Gnomic 校验 ticket 并设置登录态
  ↓
进入 Gnomic workspace / 模板详情 / 制作同款页面
```

## 四、账号绑定规则

### 4.1 绑定优先级

点击 Gnomic 模板时，按以下顺序处理：

```text
1. 使用 hellomeUserId 查询是否已有 Gnomic 绑定
2. 如果已有绑定，直接使用绑定的 gnomicUserId
3. 如果没有绑定，用 HelloMe 手机号查询 Gnomic 是否已有账号
4. 如果 Gnomic 已有该手机号账号，建立绑定
5. 如果 Gnomic 没有该手机号账号，自动创建 Gnomic 账号
6. 创建成功后建立绑定
```

### 4.2 绑定表

建议新增账号绑定表：

```ts
type GnomicAccountBinding = {
  id: string;
  hellomeUserId: string;
  gnomicUserId: string;
  phone?: string;
  status: 'active' | 'disabled';
  createdAt: string;
  updatedAt: string;
};
```

唯一索引：

```text
hellomeUserId 唯一
gnomicUserId 唯一
phone 可索引
```

### 4.3 自动创建 Gnomic 账号字段

HelloMe 创建 Gnomic 用户时传入：

```ts
type CreateGnomicUserPayload = {
  hellomeUserId: string;
  phone: string;
  nickname: string;
  avatarUrl?: string;
  source: 'hellome';
};
```

不传：

```text
HelloMe 密码
短信验证码
登录 Token
敏感凭证
```

Gnomic 新用户默认：

```text
手机号：HelloMe 手机号
昵称：HelloMe 昵称
头像：HelloMe 头像
来源：hellome
登录方式：SSO
```

## 五、SSO Ticket 机制

### 5.1 Ticket 特性

SSO ticket 必须满足：

```text
一次性使用
短有效期
服务端签发
服务端校验
不可重复消费
绑定目标用户
绑定跳转目标
```

建议有效期：

```text
60 秒 - 180 秒
```

### 5.2 Ticket 数据结构

```ts
type GnomicSsoTicket = {
  ticket: string;
  hellomeUserId: string;
  gnomicUserId: string;
  redirectPath: string;
  used: boolean;
  expiresAt: string;
  createdAt: string;
};
```

### 5.3 Ticket 消费地址

Gnomic 提供：

```text
GET https://www.gnomic.cn/sso/hellome?ticket=xxx&redirect=/workspace?template=xxx
```

Gnomic 后端处理：

```text
1. 校验 ticket
2. 确认 ticket 未过期
3. 确认 ticket 未使用
4. 获取 gnomicUserId
5. 设置 Gnomic 登录 Cookie
6. 标记 ticket 已使用
7. 跳转 redirect
```

## 六、后端接口设计

## 6.1 HelloMe：发起 Gnomic SSO

接口：

```http
POST /api/gnomic/sso/start
```

请求：

```ts
type StartGnomicSsoRequest = {
  templateId?: string;
  action?: 'view' | 'experience' | 'clone';
  redirectPath?: string;
};
```

示例：

```json
{
  "templateId": "smart-matting",
  "action": "experience",
  "redirectPath": "/workspace?template=smart-matting&action=experience"
}
```

响应：

```ts
type StartGnomicSsoResponse = {
  ok: true;
  redirectUrl: string;
};
```

示例：

```json
{
  "ok": true,
  "redirectUrl": "https://www.gnomic.cn/sso/hellome?ticket=xxx&redirect=%2Fworkspace%3Ftemplate%3Dsmart-matting%26action%3Dexperience"
}
```

错误响应：

```ts
type StartGnomicSsoError = {
  ok: false;
  code:
    | 'UNAUTHENTICATED'
    | 'GNOMIC_ACCOUNT_BIND_FAILED'
    | 'GNOMIC_CREATE_USER_FAILED'
    | 'GNOMIC_SERVICE_UNAVAILABLE'
    | 'INVALID_REDIRECT';
  message: string;
};
```

## 6.2 HelloMe 调 Gnomic：查询手机号账号

接口建议：

```http
POST /internal/hellome/users/find-by-phone
```

请求：

```json
{
  "phone": "13800138000"
}
```

响应：

```json
{
  "exists": true,
  "gnomicUserId": "gnomic_user_123"
}
```

## 6.3 HelloMe 调 Gnomic：创建账号

接口建议：

```http
POST /internal/hellome/users/create
```

请求：

```json
{
  "hellomeUserId": "hellome_user_123",
  "phone": "13800138000",
  "nickname": "哈基米ABCDEF",
  "avatarUrl": "https://...",
  "source": "hellome"
}
```

响应：

```json
{
  "gnomicUserId": "gnomic_user_456"
}
```

## 6.4 HelloMe 调 Gnomic：创建 SSO Ticket

接口建议：

```http
POST /internal/hellome/sso/tickets
```

请求：

```json
{
  "hellomeUserId": "hellome_user_123",
  "gnomicUserId": "gnomic_user_456",
  "redirectPath": "/workspace?template=smart-matting&action=experience"
}
```

响应：

```json
{
  "ticket": "sso_ticket_xxx",
  "expiresAt": "2026-06-22T12:00:00.000Z"
}
```

## 七、前端改造方案

### 7.1 数据层调整

当前 `workflowMarket.ts` 中已有：

```text
href
cloneHref
```

建议保留展示用字段，同时增加结构化字段：

```ts
type WorkflowMarketItem = {
  id: string;
  title: string;
  templateId: string;
  category: WorkflowCategory;
  actionPath: {
    view: string;
    experience: string;
    clone: string;
  };
};
```

示例：

```ts
{
  id: 'smart-matting',
  title: '一键智能抠图',
  templateId: 'smart-matting',
  actionPath: {
    view: '/workspace?template=smart-matting&action=view',
    experience: '/workspace?template=smart-matting&action=experience',
    clone: '/workspace?template=smart-matting&action=clone',
  },
}
```

### 7.2 新增前端工具函数

建议新增：

```text
src/lib/gnomicSso.ts
```

职责：

```text
检查 HelloMe 登录态
未登录时打开登录弹窗
已登录时调用 /api/gnomic/sso/start
打开返回的 redirectUrl
处理错误提示
```

函数：

```ts
type GnomicAction = 'view' | 'experience' | 'clone';

type OpenGnomicTemplateOptions = {
  templateId: string;
  action: GnomicAction;
  redirectPath: string;
};

export async function openGnomicTemplate(options: OpenGnomicTemplateOptions): Promise<void> {
  // 1. 检查 HelloMe 登录态
  // 2. 未登录：打开登录弹窗并缓存 intent
  // 3. 已登录：调用后端 SSO start
  // 4. window.open(response.redirectUrl)
}
```

### 7.3 修改 WorkflowMarketCard

当前逻辑：

```ts
window.open(item.href, '_blank', 'noopener,noreferrer');
```

改为：

```ts
openGnomicTemplate({
  templateId: item.templateId,
  action: 'experience',
  redirectPath: item.actionPath.experience,
});
```

制作同款：

```ts
openGnomicTemplate({
  templateId: item.templateId,
  action: 'clone',
  redirectPath: item.actionPath.clone,
});
```

### 7.4 未登录弹窗

未登录时弹 HelloMe 登录弹窗。

弹窗文案：

```text
登录后继续使用 Gnomic 模板

登录 HelloMe 后，可直接跳转到已登录的 Gnomic 工作台使用模板。
```

按钮：

```text
立即登录
继续浏览
```

登录成功后：

```text
继续刚才点击的 Gnomic 模板动作
```

## 八、跳转目标

模板卡片点击：

```text
体验：/workspace?template={templateId}&action=experience
制作同款：/workspace?template={templateId}&action=clone
查看：/workspace?template={templateId}&action=view
```

跳转必须走 HelloMe SSO：

```text
/api/gnomic/sso/start
```

不要从前端直接打开：

```text
https://www.gnomic.cn/workspace?template=xxx
```

## 九、安全要求

### 9.1 Redirect 白名单

后端必须校验 redirectPath。

允许：

```text
/workspace
/workspace?template=xxx
/workspace?template=xxx&action=experience
/workspace?template=xxx&action=clone
```

拒绝：

```text
完整外链
javascript:
//evil.com
带非法协议的 URL
```

### 9.2 内部接口鉴权

HelloMe 调 Gnomic 内部接口需要服务端鉴权。

建议：

```text
服务端 API Key
HMAC 签名
请求时间戳
重放保护
IP 白名单，后置
```

### 9.3 Ticket 安全

Ticket 要求：

```text
随机不可预测
短有效期
一次性
服务端存储或可验证签名
消费后立即失效
```

## 十、异常处理

### 10.1 HelloMe 未登录

处理：

```text
弹 HelloMe 登录
缓存 Gnomic 跳转意图
登录成功后继续 SSO
```

### 10.2 Gnomic 已有手机号但绑定失败

提示：

```text
该手机号已存在 Gnomic 账号，暂时无法自动绑定，请联系客服处理。
```

### 10.3 Gnomic 创建用户失败

提示：

```text
暂时无法创建 Gnomic 账号，请稍后重试。
```

### 10.4 Ticket 过期

处理：

```text
重新发起 /api/gnomic/sso/start
```

### 10.5 Gnomic 服务不可用

提示：

```text
Gnomic 服务暂时不可用，请稍后再试。
```

## 十一、状态与埋点

建议记录事件：

```text
gnomic_template_click
gnomic_sso_start
gnomic_account_binding_found
gnomic_account_created
gnomic_sso_ticket_created
gnomic_sso_redirect
gnomic_sso_failed
```

字段：

```text
hellomeUserId
templateId
action
hasBinding
createdGnomicUser
errorCode
timestamp
```

## 十二、第一版实现范围

第一版做：

```text
HelloMe 登录态校验
Gnomic 账号绑定表
按手机号查询 Gnomic 账号
自动创建 Gnomic 账号
创建一次性 SSO ticket
Gnomic 消费 ticket 并设置登录态
WorkflowMarketCard 改为走 SSO
未登录时弹 HelloMe 登录
登录后继续原 Gnomic 模板动作
错误提示
```

第一版后置：

```text
用户手动解除绑定
多个 Gnomic 账号选择
企业组织映射
Gnomic 权限同步
Gnomic 算力余额同步
模板收藏同步
模板使用记录回流 HelloMe
```

## 十三、最终流程示例

### 13.1 已有 Gnomic 账号

```text
用户登录 HelloMe
点击「一键智能抠图」体验
HelloMe 后端查绑定
没有绑定则按手机号查 Gnomic
Gnomic 返回已有用户
HelloMe 建立绑定
HelloMe 创建 SSO ticket
跳转 Gnomic SSO 地址
Gnomic 设置登录态
进入模板体验页
```

### 13.2 没有 Gnomic 账号

```text
用户登录 HelloMe
点击「制作同款」
HelloMe 后端查绑定
没有绑定
按手机号查 Gnomic
Gnomic 无账号
HelloMe 请求 Gnomic 创建账号
HelloMe 建立绑定
HelloMe 创建 SSO ticket
跳转 Gnomic SSO 地址
Gnomic 设置登录态
进入制作同款页
```

### 13.3 未登录 HelloMe

```text
游客点击 Gnomic 模板
弹 HelloMe 登录
登录成功
继续 Gnomic SSO
进入已登录的 Gnomic 模板页
```

## 十四、最终定义

> HelloMe 是统一入口，Gnomic 是模板执行平台。用户从 HelloMe 点击 Gnomic 模板时，系统通过账号映射和一次性 SSO ticket 自动完成 Gnomic 登录；已有 Gnomic 账号直接登录，没有账号则自动注册后登录。
