# HelloMe 工作台标签关闭后的空状态方案

## 1. 背景

我的工作台采用类似浏览器标签页的交互：

```text
顶部标签 = 当前打开的智能体工作台
关闭标签 = 从工作台关闭显示
停用智能体 = 释放套餐名额
```

因此需要明确：

> 用户关闭所有智能体标签时，不代表停用了所有智能体。页面应该展示“已启用智能体”的卡片列表，让用户重新打开标签。

## 2. 核心规则

### 2.1 关闭标签

```text
关闭标签只是关闭当前工作区里的显示。
不释放智能体名额。
不影响智能体启用状态。
不删除任务和结果。
```

### 2.2 打开标签

以下动作都会打开智能体标签：

```text
在工作台空状态点击“使用智能体”
在智能体市场点击“使用智能体”
从任务结果点击“进入智能体”
从最近任务点击“继续任务”
```

### 2.3 停用智能体

停用仍然是独立动作：

```text
停用智能体 = 释放套餐名额
```

停用不通过关闭标签完成。

## 3. 标签全部关闭时的页面

当用户关闭工作台里的所有智能体标签时，页面主体展示已启用智能体卡片。

不是跳转智能体市场。

不是展示空白页。

页面结构：

```text
┌──────────────────────────────────────────────┐
│ 置顶导航栏                                    │
├──────────────────────────────────────────────┤
│ 智能体标签栏                                  │
│ [+ 添加智能体]                                │
├──────────────────────────────────────────────┤
│ 已启用智能体                                  │
│ 选择一个智能体打开工作台                       │
│                                              │
│ [GEO 智能体卡片] [自媒体智能体卡片]             │
└──────────────────────────────────────────────┘
```

标题：

```text
已启用智能体
```

说明：

```text
这些智能体仍然处于启用状态。点击“使用智能体”即可重新打开标签。
```

## 4. 已启用智能体卡片

卡片字段：

```text
智能体图标
智能体名称
一句话说明
当前状态
本月任务数
本月 Token 消耗
最近任务
主按钮：使用智能体
次按钮：查看任务
```

示例：

```text
GEO 智能体
检测品牌在 AI 搜索和大模型回答中的可见度。

本月任务：12
本月消耗：238,000 Token
最近任务：HelloMe AI 可见度检测，已完成

[使用智能体]
[查看任务]
```

点击：

```text
使用智能体 -> 打开 GEO 标签，并切换到 GEO 工作台
查看任务 -> 进入任务中心并筛选 GEO 智能体
```

## 5. 工作台空状态与未启用状态的区别

需要区分两种情况。

### 5.1 已启用，但标签全关闭

状态：

```text
enabledAgents.length > 0
visibleTabs.length === 0
```

页面展示：

```text
已启用智能体卡片列表
```

主操作：

```text
使用智能体
```

### 5.2 没有启用任何智能体

状态：

```text
enabledAgents.length === 0
```

页面展示：

```text
你还没有启用任何智能体
```

主操作：

```text
去智能体市场
```

文案：

```text
先去智能体市场启用一个智能体，开始你的第一个任务。
```

## 6. 智能体市场里的“使用智能体”

智能体市场中，已启用智能体卡片应显示：

```text
状态：已启用
[使用智能体]
[停用]
```

点击“使用智能体”：

```text
如果该智能体标签已打开 -> 切换到该标签
如果该智能体标签已关闭 -> 重新打开标签并切换过去
如果该智能体被隐藏 -> 设为 visible=true，并切换过去
```

然后进入：

```text
/app?agent=geo
```

页面主体直接显示 GEO 工作台。

## 7. 打开标签规则

打开一个智能体标签时：

```text
检查智能体是否已启用
如果未启用：提示先启用
如果已启用：设置标签 visible=true
如果标签不存在：创建标签
如果标签存在但隐藏：恢复显示
将该标签设为 active
更新 URL agent 参数
```

伪代码：

```ts
function openAgentTab(agentId: string) {
  assertAgentEnabled(agentId);
  const tab = findTab(agentId);

  if (!tab) {
    createTab({ agentId, visible: true });
  } else {
    tab.visible = true;
  }

  setActiveAgent(agentId);
  navigate(`/app?agent=${agentId}`);
}
```

## 8. 关闭标签规则

关闭一个智能体标签时：

```text
设置 visible=false
不修改 enabled 状态
不释放智能体名额
不清空任务
```

如果关闭的是当前激活标签：

```text
优先切换到右侧相邻标签
如果没有右侧标签，切换到左侧相邻标签
如果没有任何可见标签，显示已启用智能体卡片列表
```

伪代码：

```ts
function closeAgentTab(agentId: string) {
  const tab = findTab(agentId);
  tab.visible = false;

  const nextTab = findNextVisibleTab(agentId);
  if (nextTab) {
    setActiveAgent(nextTab.agentId);
  } else {
    setActiveAgent(undefined);
    showEnabledAgentsPanel();
  }
}
```

## 9. “+ 添加智能体”按钮

标签栏末尾保留：

```text
[+ 添加智能体]
```

点击后进入：

```text
/app/agents
```

用途：

```text
启用新的智能体
停用已有智能体
查看智能体市场
```

如果用户已启用智能体但全部关闭，标签栏仍然显示：

```text
[+ 添加智能体]
```

页面主体显示已启用智能体卡片列表。

## 10. 数据结构建议

工作台标签：

```ts
interface WorkbenchAgentTab {
  agentId: string;
  title: string;
  visible: boolean;
  pinned: boolean;
  order: number;
  status: 'idle' | 'running' | 'waiting_confirmation' | 'failed';
  latestTaskId?: string;
}
```

工作台状态：

```ts
interface MyWorkbenchState {
  activeAgentId?: string;
  tabs: WorkbenchAgentTab[];
  enabledAgents: EnabledAgentSummary[];
}
```

状态判断：

```ts
const visibleTabs = tabs.filter((tab) => tab.visible);
const shouldShowEnabledAgentsPanel =
  enabledAgents.length > 0 && visibleTabs.length === 0;
const shouldShowNoAgentsEmptyState = enabledAgents.length === 0;
```

## 11. 页面文案

### 11.1 标签全关闭

```text
已启用智能体

这些智能体仍然处于启用状态。选择一个智能体，即可重新打开工作台标签。
```

按钮：

```text
使用智能体
```

### 11.2 没有启用智能体

```text
还没有启用智能体

先去智能体市场启用一个智能体，开始你的第一个任务。
```

按钮：

```text
去智能体市场
```

## 12. 与停用的关系

标签关闭和智能体停用必须区分。

```text
关闭标签：只是从工作台隐藏，不释放名额
停用智能体：释放套餐名额，不能继续使用该智能体
```

如果用户想释放名额：

```text
去智能体市场点击“停用”
```

不建议在标签关闭时弹出停用确认。

## 13. MVP 范围

### P0

```text
关闭标签设置 visible=false
标签全关闭时展示已启用智能体卡片
卡片点击“使用智能体”重新打开标签
智能体市场“使用智能体”打开或切换标签
没有启用智能体时展示去市场的空状态
```

### P1

```text
关闭标签后的撤销提示
标签排序保留
已启用智能体卡片展示最近任务
从任务中心继续任务时打开标签
```

### P2

```text
标签分组
快捷键切换标签
跨设备同步标签可见状态
```

## 14. 验收标准

完成后应满足：

```text
关闭标签不会停用智能体
关闭所有标签后不会空白
关闭所有标签后展示已启用智能体卡片
点击“使用智能体”会重新打开对应标签
智能体市场点击“使用智能体”会打开或切换对应标签
没有启用任何智能体时才展示去市场引导
停用智能体仍然只在智能体市场完成
```

## 15. 最终表达

> 工作台标签像浏览器标签页。关闭标签只是关掉当前视图，不等于停用智能体；当所有标签都关闭时，工作台展示已启用智能体卡片，用户点击“使用智能体”即可重新打开对应标签。
