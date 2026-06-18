# HelloMe 与 Hz-Hermes 强制配对准入方案

## 1. 核心前提

HelloMe 登录后的所有智能体能力都依赖 Hz-Hermes。

因此，能使用 HelloMe 登录后平台的首要前提是：

```text
用户必须先下载并安装 Hz-Hermes
用户必须在 Hz-Hermes 中登录同一个 HelloMe 账号
用户必须完成 HelloMe 与 Hz-Hermes 的一键配对
配对成功后，才允许进入 HelloMe 工作台和智能体能力
```

这不是一个可选设置，也不是任务执行前才提示的条件。

它是平台准入门槛：

> 未完成 Hz-Hermes 配对，就不能进入我的工作台、智能体市场、任务中心和智能体执行链路。

## 2. 产品定位

### 2.1 HelloMe

HelloMe 是智能体前台，负责：

```text
账号体系
套餐与 Token
智能体市场
我的工作台
任务发起
过程展示
结果展示
用量统计
```

### 2.2 Hz-Hermes

Hz-Hermes 是执行器，负责：

```text
本地执行环境
浏览器自动化
网页和平台连接
消息平台连接
文件访问
技能执行
任务桥接
本地状态同步
```

### 2.3 两者关系

```text
HelloMe 发起任务
Hz-Hermes 执行任务
HelloMe 展示过程和结果
```

所以：

```text
没有 Hz-Hermes 配对，就没有可用的智能体执行环境。
```

## 3. 用户准入流程

登录后流程应该是：

```text
用户登录 HelloMe
系统检查是否已完成 Hz-Hermes 配对
未配对：进入 Hz-Hermes 配对引导页
已配对且在线：进入我的工作台
已配对但离线：进入 Hz-Hermes 状态页，提示打开 Hz-Hermes
```

流程图：

```text
HelloMe 登录
  ↓
检查 Hz-Hermes 配对状态
  ↓
未配对 ─→ Hz-Hermes 配对引导页
  ↓
已配对
  ↓
检查 Hz-Hermes 在线状态
  ↓
在线 ─→ 我的工作台
  ↓
离线 ─→ Hz-Hermes 状态页 / 打开 Hz-Hermes 引导
```

## 4. 准入页设计

未完成配对时，用户登录后不进入 `/app` 主工作台，而是进入准入页。

推荐路由：

```text
/connect-hermes
```

或登录后内部路由：

```text
/app/connect-hermes
```

页面标题：

```text
连接 Hz-Hermes 后开始使用 HelloMe
```

说明：

```text
HelloMe 的智能体需要通过 Hz-Hermes 执行。请下载 Hz-Hermes，并使用同一个 HelloMe 账号登录后点击一键配对。
```

步骤：

```text
1. 下载并安装 Hz-Hermes
2. 打开 Hz-Hermes
3. 使用当前 HelloMe 账号登录 Hz-Hermes
4. 在 Hz-Hermes 中点击“一键配对”
5. 配对成功后自动进入 HelloMe 工作台
```

按钮：

```text
[下载 Hz-Hermes]
[我已安装，打开 Hz-Hermes]
[重新检测配对状态]
```

不显示：

```text
智能体市场
我的工作台
任务中心
用量主页面
```

## 5. Hz-Hermes 端一键配对

根据 Hz-Hermes 截图，Hz-Hermes 里已有：

```text
一键配对 GEO
WebChat 桥接 URL
WebChat 实例 key
应用 / 保存
```

建议 Hz-Hermes 端文案改为更通用：

```text
一键配对 HelloMe
```

如果当前模块确实是 GEO 专用，也可以写：

```text
一键配对 HelloMe GEO
```

说明文案：

```text
使用当前 Hz-Hermes 登录账号自动获取 HelloMe 连接凭证，并写入桥接配置。请确保 Hz-Hermes 与 HelloMe 登录的是同一个账号。
```

按钮：

```text
一键配对
```

配对成功：

```text
配对成功
已连接到 HelloMe
```

配对失败：

```text
配对失败
请确认 Hz-Hermes 与 HelloMe 登录的是同一个账号。
```

## 6. 同账号规则

配对必须依赖同一个账号。

允许：

```text
HelloMe 当前账号：user@example.com
Hz-Hermes 当前账号：user@example.com
允许一键配对
```

不允许：

```text
HelloMe 当前账号：user@example.com
Hz-Hermes 当前账号：other@example.com
不允许配对
```

提示：

```text
账号不一致，无法配对

请在 Hz-Hermes 中切换为当前 HelloMe 账号，或在 HelloMe 中登录 Hz-Hermes 使用的账号。
```

## 7. 配对成功后的跳转

配对成功后，HelloMe 应自动进入：

```text
/app
```

也就是我的工作台。

如果用户已有启用智能体：

```text
直接打开默认智能体工作台
```

例如：

```text
/app?agent=geo
```

如果用户还没有启用任何智能体：

```text
进入智能体市场，引导启用第一个智能体
```

推荐：

```text
/app/agents?mode=first-agent
```

## 8. 已配对但 Hz-Hermes 离线

这是和“未配对”不同的状态。

用户已经完成配对，但 Hz-Hermes 当前未在线。

此时可以允许用户进入一个有限状态页，但不应进入完整可操作工作台。

页面：

```text
Hz-Hermes 当前离线
```

说明：

```text
请打开 Hz-Hermes 客户端，并确认已登录当前 HelloMe 账号。Hz-Hermes 在线后即可继续使用智能体。
```

按钮：

```text
[打开 Hz-Hermes]
[重新检测]
```

可以允许查看：

```text
历史结果
用量概览
配对设备信息
```

不允许：

```text
发起新任务
启用需要立即执行的流程
继续执行任务
```

如果产品希望更严格，也可以把离线状态同样挡在准入页，只保留“打开 Hz-Hermes / 重新检测”。

## 9. 平台访问控制

未配对状态下，用户访问以下页面时都应重定向到 Hz-Hermes 准入页：

```text
/app
/app/agents
/app/tasks
/app/usage
/app/settings
```

例外页面：

```text
/connect-hermes
/login
/logout
官网公开页
帮助文档
下载 Hz-Hermes 页面
```

访问控制逻辑：

```text
if not logged in:
  redirect /login

if logged in and not hermes_paired:
  redirect /connect-hermes

if logged in and hermes_paired but hermes_offline:
  redirect /connect-hermes?status=offline

if logged in and hermes_connected:
  allow /app
```

## 10. 配对状态展示

配对成功后，HelloMe 顶部应展示 Hz-Hermes 状态。

状态：

```text
Hz-Hermes 已连接
Hz-Hermes 离线
Hz-Hermes 版本过低
Hz-Hermes 能力缺失
```

示例：

```text
Hz-Hermes 已连接 · Hz-Hermes v0.2.3
```

如果离线：

```text
Hz-Hermes 离线
[重新检测]
```

## 11. 配对设备信息

配对成功后保存：

```text
Hz-Hermes 实例 ID
设备名称
设备系统
Hz-Hermes 版本
登录账号
配对时间
最后在线时间
连接状态
支持能力
```

示例：

```text
设备：Shiushan 的 Windows 电脑
Hz-Hermes 版本：v0.2.3
状态：已连接
最后在线：刚刚
支持能力：WebChat、浏览器自动化、文件访问
```

## 12. 多设备策略

MVP 建议：

```text
个人版：允许 1 台 Hz-Hermes 作为当前执行设备
团队版：允许多台设备，但任务执行时选择 1 台
```

如果用户在第二台设备配对：

```text
检测到已有 Hz-Hermes 设备

当前账号已配对：Shiushan 的 Windows 电脑
是否将任务执行设备切换到当前 Hz-Hermes？

[取消] [切换到当前设备]
```

## 13. 对现有页面的影响

### 13.1 我的工作台

只有 Hz-Hermes 已连接时才进入。

```text
已连接：直接展示默认智能体工作台
未配对：重定向到 Hz-Hermes 配对页
离线：重定向到 Hz-Hermes 离线页
```

### 13.2 智能体市场

只有 Hz-Hermes 已连接时才进入。

不再支持：

```text
未配对时浏览智能体市场
未配对时启用智能体
```

原因：

```text
产品使用前提就是 Hz-Hermes 已配对。
智能体市场是登录后能力的一部分，不是公开商城。
```

### 13.3 任务中心

只有 Hz-Hermes 已连接时进入完整任务中心。

如果 Hz-Hermes 离线：

```text
可选：只允许查看历史任务和结果
不允许继续执行
```

MVP 可先统一重定向到 Hz-Hermes 离线页。

### 13.4 用量页面

已配对后进入。

如果未配对：

```text
重定向到 Hz-Hermes 配对页
```

## 14. 状态枚举

HelloMe 侧建议定义：

```ts
type HermesConnectionStatus =
  | 'not_paired'
  | 'pairing'
  | 'connected'
  | 'offline'
  | 'account_mismatch'
  | 'version_unsupported'
  | 'capability_missing';
```

配对设备：

```ts
interface HermesDevice {
  id: string;
  deviceName: string;
  os: 'windows' | 'macos' | 'linux';
  version: string;
  accountEmail: string;
  pairedAt: string;
  lastSeenAt: string;
  status: HermesConnectionStatus;
  capabilities: Array<
    | 'browser_automation'
    | 'webchat_bridge'
    | 'file_access'
    | 'message_platforms'
  >;
}
```

## 15. 推荐落地顺序

### P0

```text
新增 Hz-Hermes 准入页
登录后先检查 Hz-Hermes 配对状态
未配对时重定向到准入页
Hz-Hermes 端支持一键配对
同账号校验
配对成功后进入 /app
顶部展示 Hz-Hermes 已连接状态
```

### P1

```text
Hz-Hermes 离线状态页
重新检测连接
打开 Hz-Hermes 客户端
设备信息展示
重新配对
解绑设备
版本校验
```

### P2

```text
多设备切换
团队设备管理
自动唤起 Hz-Hermes
能力缺失诊断
深度故障排查
```

## 16. 用户文案

### 16.1 准入页说明

```text
连接 Hz-Hermes 后开始使用 HelloMe

HelloMe 的智能体需要通过 Hz-Hermes 执行。请下载 Hz-Hermes，并使用同一个账号登录后点击一键配对。
```

### 16.2 按钮文案

```text
下载 Hz-Hermes
打开 Hz-Hermes
重新检测配对状态
```

### 16.3 账号不一致

```text
账号不一致，无法配对

请确认 HelloMe 与 Hz-Hermes 登录的是同一个账号。
```

### 16.4 配对成功

```text
Hz-Hermes 已连接

现在可以进入 HelloMe 工作台。
```

## 17. 最终表达

> 使用 HelloMe 登录后平台的首要前提是完成 Hz-Hermes 配对。用户必须先下载 Hz-Hermes，并用同一个账号一键配对；未配对时只展示配对引导，不进入工作台、智能体市场或任务中心。配对成功后，HelloMe 才进入完整可用状态。
