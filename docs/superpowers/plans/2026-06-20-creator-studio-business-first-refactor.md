# HelloMe 智能体工坊业务导向重构 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 Creator 侧智能体工坊从配置台心智重构成业务导向工作台，并补上可发起真实视频任务的调试验证入口。

**Architecture:** 保持现有 React + Express + Prisma 架构不变，不另起平台。前端将 `CreatorSkillEditorPage` 收敛成“左导航 + 中业务编辑区 + 右呈现区”的单一母版，调试页则在现有系统理解预演基础上增加可直接创建真实视频任务的验证链路。

**Tech Stack:** React, TypeScript, Vite, Express, Prisma, Tailwind CSS

## Global Constraints

- 第一阶段只围绕：`HelloMe 视频智能体`
- `视频` 是产品线入口，不是创建页内部选项
- 创建页只保留：`行业 / 客户类型`、`使用场景`
- Hermes 过程分层：业务过程默认可见，执行过程折叠可查
- 默认心智必须是业务导向，不得退回“参数配置后台”

---

### Task 1: 重构智能体工坊页面骨架

**Files:**
- Create: `/Users/feihong/Documents/hellome/src/components/app/studio/BusinessFlowPreviewPanel.tsx`
- Create: `/Users/feihong/Documents/hellome/src/components/app/studio/BusinessScenarioSelector.tsx`
- Modify: `/Users/feihong/Documents/hellome/src/pages/app/CreatorSkillEditorPage.tsx`
- Modify: `/Users/feihong/Documents/hellome/src/components/app/studio/SkillVisualWorkbenchPreview.tsx`

**Interfaces:**
- Consumes: `SkillRecord`, `SkillDebugResult`, `SkillBusinessFrame`
- Produces: `BusinessScenarioSelector`, `BusinessFlowPreviewPanel` 组件供编辑页使用

- [ ] **Step 1: 梳理现有编辑页职责并写出新骨架**

目标骨架：

```tsx
<AppPage>
  <LeftGlobalNav />
  <CenterBusinessEditor />
  <RightPresentationPanel />
</AppPage>
```

- [ ] **Step 2: 新建业务场景选择组件**

```tsx
export interface BusinessScenarioSelectorProps {
  customerType: string;
  scenario: string;
  onCustomerTypeChange: (value: string) => void;
  onScenarioChange: (value: string) => void;
}
```

- [ ] **Step 3: 新建右侧引擎/前台双视角组件**

```tsx
export interface BusinessFlowPreviewPanelProps {
  mode: 'create' | 'edit';
  preview: {
    title: string;
    caption: string;
    storefrontTitle: string;
    engineSteps: string[];
  };
}
```

- [ ] **Step 4: 在编辑页中替换旧的大配置块**

保留：
- 顶部标题与保存/调试/发布动作
- 中间业务编辑区
- 右侧呈现区

移除默认首屏里的：
- 大段说明文案
- 大面积字段墙
- 重复输入器

- [ ] **Step 5: 运行类型检查**

Run: `npm run lint`
Expected: PASS


### Task 2: 把创建/优化心智收进统一业务编辑区

**Files:**
- Modify: `/Users/feihong/Documents/hellome/src/pages/app/CreatorSkillEditorPage.tsx`
- Modify: `/Users/feihong/Documents/hellome/src/components/app/studio/BusinessFrameEditor.tsx`

**Interfaces:**
- Consumes: `skill.latestVersion.businessFrame`
- Produces: 业务导向的中间编辑区，支持：
  - 当前业务定位展示
  - 业务方向卡片选择
  - 文本优化指令输入
  - sticky 主按钮

- [ ] **Step 1: 把顶部句式卡改成只读动态标题**

示例：

```tsx
<h2>即将为你生成：{customerType}的{scenario}视频智能体</h2>
```

- [ ] **Step 2: 保留卡片网格作为唯一输入源**

不再出现第二套 dropdown / input 控件。

- [ ] **Step 3: 把“本次修改输入预览”改成真实 textarea**

```tsx
<textarea
  value={instruction}
  onChange={(event) => setInstruction(event.target.value)}
/>;
```

- [ ] **Step 4: 删掉大面积“发送前确认”底板，改成 sticky 主按钮**

```tsx
<div className="sticky bottom-0">
  <button>开始生成智能体草稿</button>
</div>
```

- [ ] **Step 5: 运行类型检查**

Run: `npm run lint`
Expected: PASS


### Task 3: 调试页接入真实视频任务验证入口

**Files:**
- Modify: `/Users/feihong/Documents/hellome/src/pages/app/CreatorSkillDebugPage.tsx`
- Modify: `/Users/feihong/Documents/hellome/src/lib/taskApi.ts`
- Test: `/Users/feihong/Documents/hellome/tests/ui/creatorSkillDebugPage.test.ts`

**Interfaces:**
- Consumes: `runStudioSkillDebug(skillId, input)`, `createRemoteUgcTask(input)`
- Produces:
  - “系统理解预演”结果
  - “发起真实视频任务验证”入口
  - 跳转到 `/app/tasks/:id`

- [ ] **Step 1: 为调试页补一个真实任务入口区**

区块应包含：
- 任务输入摘要
- 当前 skillId
- 发起真实视频任务按钮

- [ ] **Step 2: 用现有 `createRemoteUgcTask` 串起真实验证**

```tsx
const task = await createRemoteUgcTask({
  skillId,
  sellingPoint: input.sellingPoint,
  platform: input.platform,
  effectGoal: input.effectGoal,
  referenceUrl: input.referenceDirection,
});
navigate(`/app/tasks/${task.id}`);
```

- [ ] **Step 3: 为按钮补 loading / error 状态**

```tsx
disabled={runningRealTask}
```

- [ ] **Step 4: 写一个 UI 测试，验证真实任务按钮存在**

```tsx
assert.match(renderedText, /发起真实视频任务验证/);
```

- [ ] **Step 5: 运行测试与构建**

Run: `node --import tsx --test tests/ui/creatorSkillDebugPage.test.ts`
Expected: PASS

Run: `npm run build`
Expected: PASS


### Task 4: 文档与迭代记录同步

**Files:**
- Modify: `/Users/feihong/Documents/hellome/docs/iteration-update-log.md`

**Interfaces:**
- Consumes: Task 1-3 完成结果
- Produces: 本轮变更记录，说明业务导向工坊与真实验证入口

- [ ] **Step 1: 记录业务导向页面重构**
- [ ] **Step 2: 记录真实视频任务验证入口**
- [ ] **Step 3: 记录验证命令结果**

