# HelloMe 智能体市场最终交互优化方案

## 一、当前状态

当前项目已经完成智能体市场首页化。

现有结构：

```text
/agents
公开智能体市场

/app/agents
登录后智能体市场

页面结构：
顶部 Banner
产品位
分类搜索
智能体卡片流
```

当前页面结构可以保留。

需要重点优化的是行为逻辑。

## 二、核心调整

智能体市场不再使用启用和停用逻辑。

统一为：

> 所有开放智能体默认可直接使用。用户真正的门槛只有两个：是否登录、是否完成 Hz-Hermes 配对。

取消以下概念：

```text
启用智能体
停用智能体
我的智能体
已启用智能体
未启用智能体
可启用数量
智能体名额
释放名额
启用确认
停用确认
```

保留以下概念：

```text
使用智能体
打开工作台
最近使用
常用智能体
收藏智能体，后置
```

## 三、市场页最终结构

智能体市场继续保持首页化布局：

```text
顶部 Banner
产品位
分类导航
搜索
智能体卡片流
```

所有开放智能体入口按钮统一为：

```text
使用智能体
```

智能体状态：

```text
开放：使用智能体
即将开放：即将开放
内测中：申请内测
Token 不足：充值算力
```

不再展示：

```text
启用智能体
登录后启用
停用
已启用
名额已满
套餐不足
```

## 四、点击使用智能体的统一判断

所有入口都使用同一套判断逻辑。

入口包括：

```text
首页功能按钮
智能体市场顶部 Banner
智能体市场产品位
智能体卡片
智能体详情页
任务中心继续任务
成果中心继续生成
```

判断流程：

```text
未登录
→ 弹登录提示

已登录但未配对 Hz-Hermes
→ 弹 Hz-Hermes 下载和配对引导

已登录且已配对 Hz-Hermes
→ 直接打开对应智能体工作台
```

伪代码：

```ts
function handleUseAgent(agentId: string) {
  if (!isLoggedIn) {
    openLoginModal({ intent: 'use_agent', agentId });
    return;
  }

  if (!isHermesPaired) {
    openHermesPairingModal({ intent: 'use_agent', agentId });
    return;
  }

  openAgentWorkspace(agentId);
}
```

## 五、登录后的处理

登录成功后，不强制跳转配对页。

推荐规则：

```text
用户从哪里触发登录，就回到哪里
```

示例：

```text
游客在 GEO 智能体卡片点击使用智能体
弹出登录提示
用户完成登录
回到 GEO 智能体上下文
用户继续使用
如果未配对 Hz-Hermes，再弹出配对引导
```

登录后的首页不展示未配对整页。

未配对提示只在用户点击实际功能时出现。

## 六、Hz-Hermes 配对引导

原有完整配对页内容可以保留。

第一版推荐展示形式：

```text
弹窗
```

后续可扩展：

```text
右侧抽层
独立配对页
```

出现时机：

```text
用户已登录
用户未配对 Hz-Hermes
用户点击使用智能体 / 开始任务 / 继续生成
```

弹窗标题：

```text
连接你的个人智能引擎
```

弹窗说明：

```text
HelloMe 负责发起任务，Hz-Hermes 负责在你的电脑上执行任务。
使用智能体前，请先下载 Hz-Hermes，并用当前 HelloMe 账号完成一键配对。
```

三步说明：

```text
1. 下载 Hz-Hermes
2. 使用同一个账号登录
3. 一键配对
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
关闭弹窗
继续刚才的动作
打开对应智能体工作台
```

## 七、我的工作台规则

我的工作台不再基于已启用智能体。

新的工作台模型：

```text
最近打开的智能体标签
```

标签来源：

```text
首页点击使用智能体
市场点击使用智能体
任务中心继续任务
成果中心继续生成
```

标签关闭逻辑：

```text
关闭标签 = 关闭当前视图
不影响智能体可用性
```

当所有标签关闭：

```text
展示常用智能体 / 推荐智能体卡片
```

卡片按钮：

```text
使用智能体
```

不再展示：

```text
已启用智能体列表
停用按钮
启用状态
```

## 八、首页规则

首页公开可浏览。

首页展示：

```text
品牌介绍
智能体推荐
热门场景
GEO 能力
Hz-Hermes 简要说明
算力 Token 说明
```

首页所有功能按钮统一走同一套判断：

```text
未登录：登录弹窗
已登录未配对：Hz-Hermes 配对弹窗
已登录已配对：打开功能
```

首页不展示：

```text
未配对整页
等待 Hz-Hermes 配对的大页面
已启用智能体
智能体名额
套餐
```

## 九、退出登录规则

退出登录后统一回首页。

流程：

```text
用户点击退出登录
清除登录态
跳转 /
展示游客态首页
```

退出登录后不跳转：

```text
登录页
配对页
工作台
```

如果用户退出前已经在首页：

```text
停留首页
刷新为游客态
```

## 十、前端需要清理的旧逻辑

后续改代码时，优先清理：

```text
activateAgent
deactivateAgent
canEnableAgent
canDeactivateAgent
isAgentActive
agentSlots
EnabledAgentsPanel
EnableAgentModal
DeactivateAgentModal
已启用状态
停用按钮
名额判断
```

替换为：

```text
openAgentWorkspace(agentId)
openHermesPairingModal(intent)
openLoginModal(intent)
recentAgentTabs
favoriteAgents，后置
```

## 十一、当前代码重点调整位置

### 11.1 智能体市场页

涉及：

```text
src/pages/app/AgentsPage.tsx
src/pages/PublicAgentsPage.tsx
src/components/app/agents/MarketHomeBanner.tsx
src/components/app/agents/MarketProductSpots.tsx
src/components/app/agents/MarketCard.tsx
src/data/agentsMarketHome.ts
```

调整：

```text
按钮文案统一为使用智能体
移除启用/停用判断
移除 active 状态展示
游客态点击使用智能体弹登录提示
登录未配对点击使用智能体弹 Hz-Hermes 配对引导
登录已配对点击使用智能体打开工作台
```

### 11.2 工作台

涉及：

```text
src/pages/app/AppHomePage.tsx
src/components/app/WorkbenchTabsBar.tsx
src/components/app/EnabledAgentsPanel.tsx
src/components/app/WorkbenchOpenAgentModal.tsx
src/state/workbenchTabs.ts
```

调整：

```text
标签改为最近打开智能体
取消对已启用智能体的依赖
空状态展示推荐智能体
关闭标签不影响智能体可用性
```

### 11.3 Hz-Hermes 引导

涉及：

```text
src/pages/ConnectHermesPage.tsx
src/components/app/HermesActionModal.tsx
src/lib/hermesConnection.ts
```

调整：

```text
保留完整配对说明
功能点击时以弹窗方式展示
配对完成后回放用户原始动作
首页不直接展示未配对整页
```

### 11.4 登录和退出

涉及：

```text
src/pages/LoginPage.tsx
src/lib/auth.ts
src/components/app/Topbar.tsx
src/components/ProtectedRoute.tsx
```

调整：

```text
登录后回到原上下文
不强制进入配对页
退出登录后跳转首页
```

## 十二、优先级

### P0

第一阶段先改主链路：

```text
市场按钮文案改成使用智能体
去掉启用/停用按钮
统一点击判断：登录 / 配对 / 使用
退出登录回首页
首页不展示未配对整页
```

### P1

第二阶段改工作台：

```text
标签不依赖已启用智能体
空状态展示常用/推荐智能体
任务中心继续任务直接打开智能体标签
成果中心继续生成直接打开智能体标签
```

### P2

第三阶段做增强：

```text
最近使用智能体
收藏智能体
智能体使用历史
智能体推荐排序
```

## 十三、最终定义

> 用户看到智能体就可以点使用，系统只判断是否登录、是否配对 Hz-Hermes，真正计费发生在任务执行消耗 Token 时。
