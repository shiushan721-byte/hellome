# HelloMe 公开首页、登录与 Hz-Hermes 使用流程方案

## 一、调整目标

HelloMe 的访问逻辑统一为：

> 用户不登录可以浏览首页和智能体内容；点击实际功能时提示登录；登录后如未完成 Hz-Hermes 配对，则弹出下载和配对引导；配对完成后直接使用智能体。

本次调整同时取消智能体启用和停用逻辑。

新的核心规则：

```text
所有智能体默认可用
不需要启用
不需要停用
不展示已启用状态
不展示智能体名额
不展示套餐
使用任务时按 Token 消耗
```

## 二、最终用户路径

### 2.1 未登录用户

用户打开网页：

```text
进入首页
可以浏览首页内容
可以浏览智能体市场
可以查看智能体基础介绍
```

点击任何实际功能：

```text
提示登录
```

实际功能包括：

```text
使用智能体
立即生成
开始任务
继续生成
查看工作台
查看任务中心
查看成果中心
充值算力
下载需要登录的文件
```

登录弹窗文案：

```text
登录后继续使用

登录 HelloMe 后，你可以使用智能体、连接 Hz-Hermes，并让智能体在你的电脑上执行任务。
```

按钮：

```text
立即登录
继续浏览
```

### 2.2 已登录但未配对 Hz-Hermes

用户登录后仍停留在原浏览路径。

首页不直接展示未配对页面。

当用户再次点击实际功能时，弹出 Hz-Hermes 下载和配对引导。

弹窗标题：

```text
连接你的个人智能引擎
```

弹窗说明：

```text
HelloMe 负责发起任务，Hz-Hermes 负责在你的电脑上执行任务。
使用智能体前，请先下载 Hz-Hermes，并用当前 HelloMe 账号完成一键配对。
```

弹窗内容：

```text
1. 下载 Hz-Hermes
2. 使用同一个账号登录 Hz-Hermes
3. 在 Hz-Hermes 中点击一键配对
```

按钮：

```text
下载 Hz-Hermes
我已完成配对
打开 Hz-Hermes
稍后再说
```

配对完成后：

```text
继续执行用户刚才点击的功能
```

### 2.3 已登录且已配对 Hz-Hermes

用户点击功能时直接进入对应智能体工作台。

示例：

```text
点击 GEO 智能体
直接打开 GEO 工作台
填写任务信息
展示预计 Token
开始执行任务
查看过程和结果
```

## 三、首页规则

首页是公开页面。

首页展示：

```text
品牌介绍
核心价值
智能体推荐
场景入口
产品能力
算力说明
Hz-Hermes 简要说明
登录入口
```

首页不展示：

```text
未配对整页引导
已启用智能体
停用智能体
智能体数量限制
套餐权益
任务中心数据
成果中心数据
用户个人信息
```

首页按钮逻辑：

```text
未登录：提示登录
已登录未配对：弹出 Hz-Hermes 下载和配对引导
已登录已配对：进入对应功能
```

## 四、智能体市场规则

智能体市场可以公开浏览。

市场展示：

```text
广告位
产品位
分类导航
搜索
智能体卡片
智能体详情
预计 Token 消耗
示例成果
```

市场不展示：

```text
启用按钮
停用按钮
已启用状态
智能体名额
套餐状态
升级套餐
```

卡片按钮统一为：

```text
使用智能体
```

即将开放智能体：

```text
即将开放
```

内测智能体：

```text
申请内测
```

点击“使用智能体”的逻辑：

```text
未登录：提示登录
已登录未配对：弹出 Hz-Hermes 下载和配对引导
已登录已配对：打开对应智能体工作台
```

## 五、取消启用和停用逻辑

本次调整后，智能体没有启用状态。

取消以下概念：

```text
启用智能体
停用智能体
已启用智能体
未启用智能体
智能体名额
可启用数量
释放名额
启用确认弹窗
停用确认弹窗
我的智能体管理
```

保留以下概念：

```text
使用智能体
打开智能体工作台
关闭工作台标签
最近使用智能体
常用智能体
收藏智能体，后置
```

按钮文案统一：

```text
使用智能体
打开工作台
开始任务
继续生成
```

## 六、我的工作台规则

我的工作台只面向已登录用户。

未登录访问：

```text
跳转首页
或提示登录后进入工作台
```

已登录未配对访问：

```text
进入工作台时不强制展示整页未配对
点击具体智能体或任务动作时弹出 Hz-Hermes 配对引导
```

已登录已配对访问：

```text
正常使用工作台
```

工作台顶部标签逻辑：

```text
用户点击某个智能体后打开对应标签
标签类似浏览器标签页
关闭标签只关闭当前视图
关闭标签不影响智能体可用性
```

当没有打开任何智能体标签：

```text
展示常用智能体 / 推荐智能体卡片
点击使用智能体后打开标签
```

不再展示：

```text
已启用智能体列表
停用按钮
启用状态
```

## 七、Hz-Hermes 配对交互

Hz-Hermes 配对不再作为首页直接展示的整页状态。

配对引导出现时机：

```text
用户已登录
用户未配对 Hz-Hermes
用户点击需要执行任务的功能
```

配对引导形式：

```text
弹窗
或右侧抽层
```

推荐第一版使用弹窗。

弹窗内容与原配对页保持一致：

```text
HelloMe 与 Hz-Hermes 的关系
三步开始
当前账号
配对状态
下载 Hz-Hermes
重新检测
我已完成配对
打开 Hz-Hermes
常见问题入口
```

配对完成后：

```text
关闭弹窗
继续用户刚才的动作
打开对应智能体工作台
```

## 八、登录后跳转规则

### 8.1 从首页功能点击登录

流程：

```text
首页点击功能
提示登录
用户登录
回到首页或原功能上下文
用户再次点击功能
弹出 Hz-Hermes 配对引导
完成配对
进入对应功能
```

### 8.2 从智能体市场点击登录

流程：

```text
市场点击使用智能体
提示登录
用户登录
返回该智能体
再次点击使用智能体
弹出 Hz-Hermes 配对引导
完成配对
打开该智能体工作台
```

### 8.3 用户主动登录

流程：

```text
用户点击登录
登录成功
进入首页
```

如果用户此前有明确 redirect：

```text
登录成功后回到 redirect 页面
```

## 九、退出登录规则

用户退出登录后：

```text
清除登录态
停留或跳转到首页
```

退出登录后不进入：

```text
登录页
配对页
工作台
```

如果退出前在登录后页面：

```text
跳转首页
```

如果退出前已经在首页：

```text
停留首页
```

退出登录后首页展示游客态。

## 十、路由建议

公开路由：

```text
/                  首页
/agents            智能体市场
/agents/:agentId   智能体详情
/login             登录
```

登录后路由：

```text
/app               我的工作台
/app/agents/:id    智能体工作台
/app/tasks         任务中心
/app/results       成果中心
/app/usage         算力中心
/app/settings      设置
```

配对页处理：

```text
/connect-hermes    保留为独立页面备用
```

第一版主体验：

```text
未配对提示优先使用弹窗
首页不直接展示 /connect-hermes 页面
```

## 十一、状态判断

用户状态：

```text
visitor：未登录
logged_in_unpaired：已登录未配对
logged_in_paired：已登录已配对
```

功能点击判断：

```ts
function handleFeatureClick(feature) {
  if (!isLoggedIn) {
    openLoginModal({ feature });
    return;
  }

  if (!isHermesPaired) {
    openHermesPairingModal({ feature });
    return;
  }

  openFeature(feature);
}
```

## 十二、前端需要调整的位置

### 12.1 路由

涉及：

```text
src/App.tsx
src/components/ProtectedRoute.tsx
```

调整：

```text
首页保持公开
智能体市场保持公开
登录后页面继续保护
/connect-hermes 不作为首页默认状态
```

### 12.2 首页

涉及：

```text
src/pages/MarketingPage.tsx
```

调整：

```text
首页功能按钮接入统一 handleFeatureClick
未登录弹登录提示
已登录未配对弹 Hz-Hermes 引导
已登录已配对进入功能
不展示未配对整页
```

### 12.3 公开智能体市场

涉及：

```text
src/pages/PublicAgentsPage.tsx
src/pages/PublicAgentDetailPage.tsx
```

调整：

```text
按钮统一改为使用智能体
取消登录后启用文案
未登录提示登录
已登录未配对弹配对引导
已登录已配对进入工作台
```

### 12.4 登录后智能体市场

涉及：

```text
src/pages/app/AgentsPage.tsx
src/components/app/agents/AgentSlotModals.tsx
src/state/agentSlots.ts
```

调整：

```text
移除启用/停用状态
移除名额判断
移除套餐不足状态
卡片按钮统一为使用智能体
点击后直接打开对应工作台
```

### 12.5 我的工作台

涉及：

```text
src/pages/app/AppHomePage.tsx
src/components/app/WorkbenchTabsBar.tsx
src/components/app/EnabledAgentsPanel.tsx
src/state/workbenchTabs.ts
```

调整：

```text
工作台标签改为最近打开智能体
取消依赖已启用智能体
空状态展示推荐/常用智能体
点击卡片直接打开智能体标签
```

### 12.6 Hz-Hermes 引导

涉及：

```text
src/pages/ConnectHermesPage.tsx
src/components/app/HermesActionModal.tsx
src/lib/hermesConnection.ts
```

调整：

```text
保留完整配对说明
优先以弹窗形式在功能点击时出现
配对完成后回放用户原始功能动作
```

### 12.7 退出登录

涉及：

```text
src/lib/auth.ts
src/components/app/Topbar.tsx
```

调整：

```text
退出登录后跳转首页
不跳转登录页
清除用户态后展示游客首页
```

## 十三、需要废弃或重写的旧文档逻辑

以下旧逻辑不再作为准则：

```text
智能体启用和停用
我的智能体管理
智能体名额
套餐限制
未配对时首页直接展示配对整页
登录后必须立即进入配对页
```

需要更新的文档：

```text
docs/public-agent-market-login-pairing-flow-plan.md
docs/hide-plan-token-compute-only-plan.md
docs/agents-market-homepage-layout-plan.md
docs/agents-market-hero-product-style-spec.md
docs/workbench-tab-empty-state-plan.md
docs/my-workbench-agent-tabs-plan.md
docs/sidebar-navigation-interaction-spec.md
```

## 十四、第一版实现范围

第一版必做：

```text
首页公开浏览
首页功能点击登录提示
登录后未配对点击功能弹 Hz-Hermes 配对引导
首页不展示未配对整页
公开智能体市场可浏览
智能体按钮统一为使用智能体
取消启用/停用逻辑
工作台标签不依赖已启用智能体
退出登录回首页
```

第一版后置：

```text
收藏智能体
最近使用智能体排序
游客浏览记录
智能体个性化推荐
多设备配对管理
```

## 十五、最终定义

> HelloMe 的公开页面负责展示和引导，登录只在用户准备操作时出现；Hz-Hermes 配对只在用户准备执行任务时提示。所有智能体默认可直接使用，真正的商业闭环来自任务执行产生的 Token 消耗。
