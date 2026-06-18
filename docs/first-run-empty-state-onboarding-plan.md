# HelloMe 首次进入空状态与 Hz-Hermes 引导方案

## 1. 背景

新用户第一次进入 HelloMe 时，可能还没有：

```text
已配对 Hz-Hermes
已启用智能体
历史任务
Token 消耗记录
任何结果
```

如果直接展示空白工作台、智能体标签栏或技术配置页，普通用户会不知道下一步做什么。

因此需要一个首次进入空状态页，完成三件事：

```text
解释 HelloMe 是什么
解释为什么叫 HelloMe
引导用户安装并配对 Hz-Hermes
```

## 2. 核心解释

面向普通用户，建议用这套表达：

> HelloMe 是你的智能体入口。Me 代表你的个人执行引擎，也就是 Hz-Hermes。你在 HelloMe 里选择智能体、发起任务；Hz-Hermes 负责在你的电脑上执行任务。

进一步拆开：

```text
Hello = 你向智能体发起任务
Me = 属于你的执行引擎 Hz-Hermes
```

一句话：

> HelloMe，就是对你的个人智能引擎说一声：开始帮我做事。

注意：

```text
不要向普通用户解释 WebSocket、bridge URL、实例 key、FastAPI、自动化内核等技术词。
```

## 3. 首次进入页面目标

页面目标：

```text
让用户明白 HelloMe 与 Hz-Hermes 的关系
让用户知道必须先安装 Hz-Hermes
让用户知道需要使用同一个账号登录
让用户完成一键配对
让用户配对成功后进入工作台
```

不做：

```text
不展示复杂市场
不展示空任务列表
不展示空用量明细
不展示技术配置项
不要求用户理解 Hermes 内部设置
```

## 4. 页面出现时机

首次进入页出现条件：

```text
用户已登录 HelloMe
用户没有完成 Hz-Hermes 配对
```

访问以下页面时应进入该引导：

```text
/app
/app/agents
/app/tasks
/app/usage
/app/settings
```

推荐路由：

```text
/connect-hermes
```

或：

```text
/app/connect-hermes
```

配对成功后：

```text
如果已有启用智能体 -> 进入我的工作台
如果没有启用智能体 -> 进入智能体市场，引导启用第一个智能体
```

## 5. 页面结构

推荐结构：

```text
┌──────────────────────────────────────────────┐
│ HelloMe                                      │
│ 连接你的个人智能引擎 Hz-Hermes                │
│                                              │
│ HelloMe 是发起任务的入口，Hz-Hermes 是执行任务 │
│ 的引擎。安装并配对后，你就可以开始使用智能体。 │
│                                              │
│ [下载 Hz-Hermes] [我已安装，去配对]            │
├──────────────────────────────────────────────┤
│ 三步开始                                      │
│ 1 下载 Hz-Hermes                              │
│ 2 用同一个账号登录                             │
│ 3 点击一键配对                                │
├──────────────────────────────────────────────┤
│ 配对状态：未连接 / 检测中 / 已连接              │
└──────────────────────────────────────────────┘
```

## 6. 首屏文案

### 6.1 标题

推荐：

```text
连接你的个人智能引擎
```

副标题：

```text
HelloMe 负责发起任务，Hz-Hermes 负责在你的电脑上执行任务。
```

解释段落：

```text
HelloMe 的 Me，代表你的个人执行引擎 Hz-Hermes。安装并配对后，你可以在 HelloMe 里选择智能体、发起任务、查看过程和结果。
```

更口语版本：

```text
你在 HelloMe 里告诉智能体要做什么，Hz-Hermes 会在你的电脑上帮你把任务跑起来。
```

### 6.2 主按钮

```text
下载 Hz-Hermes
```

次按钮：

```text
我已安装，打开 Hz-Hermes
```

辅助入口：

```text
查看配对步骤
```

## 7. 三步引导

面向普通用户，用明确步骤：

### 第一步：下载 Hz-Hermes

```text
下载并安装 Hz-Hermes。
```

按钮：

```text
下载 Windows 版
```

如果 macOS / Linux 尚未支持：

```text
macOS 和 Linux 版本即将推出
```

### 第二步：登录同一个账号

```text
打开 Hz-Hermes，并使用当前 HelloMe 账号登录。
```

强调：

```text
两个地方必须是同一个账号。
```

### 第三步：一键配对

```text
在 Hz-Hermes 里点击“一键配对 HelloMe”。
```

说明：

```text
配对成功后，HelloMe 会自动识别你的 Hz-Hermes。
```

## 8. 状态设计

### 8.1 未安装 / 未检测到

```text
尚未连接 Hz-Hermes

请先下载并安装 Hz-Hermes，然后使用同一个账号登录。
```

按钮：

```text
[下载 Hz-Hermes] [我已安装，重新检测]
```

### 8.2 等待配对

```text
等待 Hz-Hermes 配对

请在 Hz-Hermes 中点击“一键配对 HelloMe”。
```

按钮：

```text
[打开 Hz-Hermes] [重新检测]
```

### 8.3 账号不一致

```text
账号不一致，无法配对

请确认 HelloMe 和 Hz-Hermes 登录的是同一个账号。
```

按钮：

```text
[我已切换账号，重新检测]
```

### 8.4 已配对但离线

```text
Hz-Hermes 当前未在线

请打开 Hz-Hermes，确认已登录当前账号。
```

按钮：

```text
[打开 Hz-Hermes] [重新检测]
```

### 8.5 配对成功

```text
Hz-Hermes 已连接

现在可以开始使用智能体。
```

按钮：

```text
[进入工作台]
```

## 9. 普通用户版 FAQ

页面底部可以放 3 个简单问题。

### 9.1 为什么需要安装 Hz-Hermes？

```text
因为很多智能体任务需要在你的电脑上打开网页、连接平台或处理本地文件。Hz-Hermes 就是负责执行这些动作的引擎。
```

### 9.2 HelloMe 和 Hz-Hermes 是什么关系？

```text
HelloMe 是你发起任务和查看结果的地方，Hz-Hermes 是帮你执行任务的本地引擎。
```

### 9.3 一键配对安全吗？

```text
配对只会把当前 HelloMe 账号和你的 Hz-Hermes 连接起来。执行高风险动作前，系统仍会要求你确认。
```

## 10. 视觉建议

面向普通用户，视觉要简单、明确。

建议：

```text
左侧：一句话解释 HelloMe 和 Hz-Hermes
右侧：三步引导卡片
底部：配对状态和 FAQ
```

不要：

```text
大段技术说明
配置表单
bridge URL
实例 key
WebSocket 地址
调试日志
```

可以使用的图形：

```text
HelloMe 云端入口
Hz-Hermes 本地电脑
中间一条连接线
```

但文案仍然要保持普通用户可读。

## 11. 与其他页面的关系

### 11.1 我的工作台

未配对时：

```text
不进入工作台
跳转首次引导页
```

配对后：

```text
直接打开默认智能体工作台
```

### 11.2 智能体市场

未配对时：

```text
不进入市场
跳转首次引导页
```

配对后：

```text
可以浏览、启用和停用智能体
```

### 11.3 任务中心

未配对时：

```text
不进入任务中心
跳转首次引导页
```

配对后：

```text
可以查看任务和结果
```

## 12. 技术状态判断

状态枚举：

```ts
type FirstRunHermesStatus =
  | 'not_connected'
  | 'waiting_pairing'
  | 'account_mismatch'
  | 'offline'
  | 'connected';
```

页面数据：

```ts
interface FirstRunOnboardingState {
  helloMeAccountId: string;
  helloMeDisplayName: string;
  hermesStatus: FirstRunHermesStatus;
  hermesVersion?: string;
  deviceName?: string;
  lastCheckedAt?: string;
}
```

## 13. 转化路径

主路径：

```text
下载 Hz-Hermes
登录同账号
一键配对
进入工作台
```

配对成功后，如果用户没有启用智能体：

```text
进入智能体市场
推荐启用 GEO 智能体
```

配对成功后，如果用户已有启用智能体：

```text
进入我的工作台
直接打开默认智能体
```

## 14. MVP 范围

### P0

```text
首次进入空状态页
解释 HelloMe 和 Hz-Hermes
下载 Hz-Hermes 按钮
同账号登录提示
一键配对提示
重新检测配对状态
未配对时拦截 /app、/app/agents、/app/tasks
配对成功后跳转工作台或智能体市场
```

### P1

```text
自动打开 Hz-Hermes
账号不一致检测
离线状态检测
配对成功动效
FAQ
```

### P2

```text
视频教程
自动检测安装状态
多设备选择
故障诊断
```

## 15. 验收标准

完成后应满足：

```text
新用户第一次进入不会看到空白工作台
用户能理解 HelloMe 和 Hz-Hermes 的关系
用户知道为什么必须安装 Hz-Hermes
用户知道两个地方必须登录同一个账号
用户知道在哪里点击一键配对
未配对时不能进入工作台、市场和任务中心
配对成功后可以进入下一步
页面不出现 bridge URL、实例 key 等技术词
```

## 16. 最终表达

> HelloMe 的 Me 代表你的个人执行引擎 Hz-Hermes。第一次使用时，用户需要先安装 Hz-Hermes，并用同一个账号一键配对。配对成功后，HelloMe 才进入工作台和智能体能力。
