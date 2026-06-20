# HelloMe 视频智能体一期落地 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 HelloMe 当前的 UGC / 视频智能体 Demo，升级成一条可真实上线演示的“用户下单 -> Hermes 执行 -> 中间确认/中断恢复 -> 结果交付 -> 创作者继续优化智能体”的闭环。

**Architecture:** 继续沿用现有 React + Express + Prisma 架构，不另起平台。第一期只围绕 `HelloMe 视频智能体`，把普通用户侧、任务执行侧、Creator 侧工坊和 Hermes 结构化回包协议统一到同一套任务状态机与展示舞台上。Web 端不承担 AI 层能力，只消费 Hermes 返回的结构化结果与任务状态。

**Tech Stack:** React 19, React Router 7, TypeScript, Express, Prisma + PostgreSQL, Tailwind, Node built-in test runner (`node --test` via `tsx`)

## Global Constraints

- 第一阶段只围绕：`HelloMe 视频智能体`
- 第一阶段不做：通用多品类智能体平台、报告 / 网页 / PPT 等其他大类工坊、开放式大规模第三方智能体生态、任意 workflow builder
- 第一阶段工坊目标是：**把少数几个重点视频智能体打磨到足够强、足够稳、足够能卖**
- 智能体工坊的第一性业务骨架固定为：`目标` / `预算` / `执行方案` / `结果`
- 第一阶段的 web 端不承担任何 AI 层能力
- AI 生成、任务理解、结构化规划全部由 Hermes 负责
- Hermes 首轮结构化结果返回前，web 端不能伪装成已经完成了 AI 理解，也不能依赖任何实时 AI 预演
- 用户原图不得直接作为主舞台全幅主视觉
- 用户原图只允许出现在上传区、素材条、参考抽屉或弱化局部卡
- 除非后续有专门的 Hermes 图像处理结果，否则前台不得把用户原图包装成“成片预览”
- 右侧动态不是为了证明 AI 很强，而是为了证明 HelloMe 的结果组织能力很强
- 任务中间节点必须区分：`自动推进节点` / `确认节点` / `中断节点`
- 正式商业化时，主干流程必须支持：`S3.5 待确认` / `S4.x 已中断待恢复`

---

## File Structure

### Existing files to extend

- Modify: `prisma/schema.prisma`
  - 扩展任务、事件、执行记录、技能版本配置，使其能承载确认点、中断恢复、结果展示舞台配置
- Modify: `server.ts`
  - 继续作为 API 入口，补充视频智能体一期新增的任务字段与 Creator 工坊更新接口
- Modify: `src/types/ugc.ts`
  - 增加任务展示舞台、暂停/恢复、确认点、任务结果方向等类型
- Modify: `src/types/workbench.ts`
  - 扩展 `Task` 的中间态字段，供任务详情页和右侧舞台消费
- Modify: `src/types/skills.ts`
  - 扩展 Creator 工坊里对 `目标 / 预算 / 执行方案 / 结果` 的配置结构
- Modify: `src/lib/taskApi.ts`
  - 对齐新任务字段、新确认/恢复动作、新事件查询
- Modify: `src/lib/skillStudioApi.ts`
  - 对齐 Creator 工坊新增的业务骨架字段
- Modify: `src/pages/app/UgcVideoAgentPage.tsx`
  - 落地用户侧视频智能体页
- Modify: `src/pages/app/TaskRunPage.tsx`
  - 承接远程任务详情、确认、重试、恢复
- Modify: `src/components/app/tasks/TaskRunLayout.tsx`
  - 承接右侧状态脚本、确认态、中断恢复态
- Modify: `src/components/app/tasks/UgcDeliveryPanel.tsx`
  - 承接结果展示舞台、商品条、执行状态轨
- Modify: `src/pages/app/CreatorSkillEditorPage.tsx`
  - 从“配置页”收敛到“智能体工坊”的一期结构
- Modify: `src/components/app/studio/SkillVisualWorkbenchPreview.tsx`
  - 对齐前台结果展示舞台和案例预览
- Modify: `src/server/ugcTaskService.ts`
  - 真正承载视频任务创建、状态推进、确认点和中断恢复
- Modify: `src/server/skillStudioService.ts`
  - 真正承载 Creator 工坊读写和调试

### New files to create

- Create: `src/server/taskStateMachine.ts`
  - 统一定义 `running / waiting_confirmation / interrupted / completed / failed` 的转换规则
- Create: `src/server/taskPresenter.ts`
  - 把 Prisma / Hermes 执行记录映射成前端消费的 `Task` 结构
- Create: `src/server/hermesContract.ts`
  - 统一定义 Hermes 返回的结构化字段与默认兜底
- Create: `src/components/app/tasks/TaskStageRail.tsx`
  - 右侧执行状态轨
- Create: `src/components/app/tasks/TaskShowcaseStage.tsx`
  - 右侧主舞台卡
- Create: `src/components/app/tasks/TaskResultSummaryBar.tsx`
  - 右侧结果商品条
- Create: `src/components/app/studio/BusinessFrameEditor.tsx`
  - Creator 侧 `目标 / 预算 / 执行方案 / 结果` 四块业务骨架编辑器
- Create: `tests/server/hermesContract.test.ts`
- Create: `tests/server/taskStateMachine.test.ts`
- Create: `tests/server/taskPresenter.test.ts`
- Create: `tests/server/skillStudioService.test.ts`
- Create: `tests/ui/taskShowcaseStage.test.ts`

### New interfaces introduced by this plan

- `TaskRunState = 'queued' | 'running' | 'waiting_confirmation' | 'interrupted' | 'completed' | 'failed' | 'cancelled'`
- `TaskPauseReasonType = 'confirmation' | 'context_limit' | 'provider_error' | 'missing_input' | 'timeout'`
- `TaskResumeMode = 'continue' | 'retry_step' | 'require_input' | 'require_creator_fix'`
- `TaskShowcaseStage`
- `TaskResultSummary`
- `TaskRecoveryState`
- `SkillBusinessFrame`

## Task 1: 扩展任务状态机与 Hermes 契约

**Files:**
- Create: `src/server/hermesContract.ts`
- Create: `src/server/taskStateMachine.ts`
- Modify: `src/types/ugc.ts`
- Modify: `src/types/workbench.ts`
- Test: `tests/server/hermesContract.test.ts`
- Test: `tests/server/taskStateMachine.test.ts`

**Interfaces:**
- Consumes: existing `TaskStatus`, `UgcTaskInput`, current Hermes debug/runtime flows
- Produces:
  - `normalizeHermesRunPayload(payload: unknown): HermesStructuredRun`
  - `deriveTaskRunState(input: DeriveTaskRunStateInput): DerivedTaskRunState`
  - `TaskPauseReasonType`
  - `TaskResumeMode`

- [ ] **Step 1: Write the failing Hermes contract test**

```ts
import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeHermesRunPayload } from '../../src/server/hermesContract';

test('normalizeHermesRunPayload returns fallback interrupted payload for malformed input', () => {
  const result = normalizeHermesRunPayload(null);

  assert.equal(result.runState, 'interrupted');
  assert.equal(result.pauseReasonType, 'provider_error');
  assert.equal(result.recoverable, true);
  assert.equal(result.resumeMode, 'retry_step');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --import tsx --test tests/server/hermesContract.test.ts`
Expected: FAIL with `Cannot find module '../../src/server/hermesContract'`

- [ ] **Step 3: Write the failing task state machine test**

```ts
import test from 'node:test';
import assert from 'node:assert/strict';
import { deriveTaskRunState } from '../../src/server/taskStateMachine';

test('deriveTaskRunState maps confirmation pause to waiting_confirmation', () => {
  const result = deriveTaskRunState({
    currentStatus: 'running',
    hermes: {
      runState: 'waiting_confirmation',
      pauseReasonType: 'confirmation',
      recoverable: true,
      resumeMode: 'continue',
    },
  });

  assert.equal(result.status, 'waiting_confirmation');
  assert.equal(result.pendingConfirmation?.action, '确认继续');
});
```

- [ ] **Step 4: Run test to verify it fails**

Run: `node --import tsx --test tests/server/taskStateMachine.test.ts`
Expected: FAIL with `Cannot find module '../../src/server/taskStateMachine'`

- [ ] **Step 5: Add minimal Hermes contract implementation**

```ts
export type HermesStructuredRun = {
  runState: 'running' | 'waiting_confirmation' | 'interrupted' | 'completed' | 'failed';
  pauseReasonType: 'confirmation' | 'context_limit' | 'provider_error' | 'missing_input' | 'timeout';
  pauseReasonMessage: string;
  resumeMode: 'continue' | 'retry_step' | 'require_input' | 'require_creator_fix';
  recoverable: boolean;
  artifactsPreserved: string[];
  costStatus: {
    charged: boolean;
    willChargeAgain: boolean;
  };
};

export function normalizeHermesRunPayload(payload: unknown): HermesStructuredRun {
  if (!payload || typeof payload !== 'object') {
    return {
      runState: 'interrupted',
      pauseReasonType: 'provider_error',
      pauseReasonMessage: '执行结果异常，可从上一步恢复',
      resumeMode: 'retry_step',
      recoverable: true,
      artifactsPreserved: [],
      costStatus: {
        charged: false,
        willChargeAgain: false,
      },
    };
  }
  return payload as HermesStructuredRun;
}
```

- [ ] **Step 6: Add minimal task state machine implementation**

```ts
import type { HermesStructuredRun } from './hermesContract';

type DeriveTaskRunStateInput = {
  currentStatus: 'queued' | 'running' | 'waiting_confirmation' | 'completed' | 'failed' | 'cancelled';
  hermes: Pick<HermesStructuredRun, 'runState' | 'pauseReasonType' | 'recoverable' | 'resumeMode'>;
};

export function deriveTaskRunState(input: DeriveTaskRunStateInput) {
  if (input.hermes.runState === 'waiting_confirmation') {
    return {
      status: 'waiting_confirmation' as const,
      pendingConfirmation: {
        title: '等待确认',
        message: '当前步骤需要你确认后继续。',
        action: '确认继续',
      },
    };
  }

  if (input.hermes.runState === 'interrupted') {
    return {
      status: 'failed' as const,
      pendingConfirmation: undefined,
    };
  }

  return {
    status: input.currentStatus,
    pendingConfirmation: undefined,
  };
}
```

- [ ] **Step 7: Extend shared task types**

```ts
export type TaskPauseReasonType =
  | 'confirmation'
  | 'context_limit'
  | 'provider_error'
  | 'missing_input'
  | 'timeout';

export type TaskResumeMode =
  | 'continue'
  | 'retry_step'
  | 'require_input'
  | 'require_creator_fix';

export interface TaskRecoveryState {
  runState: 'running' | 'waiting_confirmation' | 'interrupted' | 'completed' | 'failed';
  pauseReasonType?: TaskPauseReasonType;
  pauseReasonMessage?: string;
  resumeMode?: TaskResumeMode;
  recoverable?: boolean;
  artifactsPreserved?: string[];
  willChargeAgain?: boolean;
}
```

- [ ] **Step 8: Run both tests to verify they pass**

Run: `node --import tsx --test tests/server/hermesContract.test.ts tests/server/taskStateMachine.test.ts`
Expected: PASS with 2 tests passing

- [ ] **Step 9: Run typecheck**

Run: `npm run lint`
Expected: PASS with no TypeScript errors

- [ ] **Step 10: Commit**

```bash
git add src/server/hermesContract.ts src/server/taskStateMachine.ts src/types/ugc.ts src/types/workbench.ts tests/server/hermesContract.test.ts tests/server/taskStateMachine.test.ts
git commit -m "feat: add hermes run contract and task state machine"
```

## Task 2: 打通服务端视频任务的停顿、恢复与展示映射

**Files:**
- Modify: `prisma/schema.prisma`
- Modify: `src/server/ugcTaskService.ts`
- Create: `src/server/taskPresenter.ts`
- Modify: `server.ts`
- Modify: `src/lib/taskApi.ts`
- Test: `tests/server/taskPresenter.test.ts`

**Interfaces:**
- Consumes:
  - `normalizeHermesRunPayload(payload: unknown): HermesStructuredRun`
  - `deriveTaskRunState(input: DeriveTaskRunStateInput): DerivedTaskRunState`
- Produces:
  - `presentUgcTask(task: PersistedTask): Task`
  - `confirmUgcTask(id: string): Promise<Task>`
  - `retryUgcTask(id: string, input?: UgcTaskInput): Promise<Task>`
  - `getUgcTask(id: string): Promise<Task & { events: UgcTaskEvent[] }>`

- [ ] **Step 1: Write the failing presenter test**

```ts
import test from 'node:test';
import assert from 'node:assert/strict';
import { presentUgcTask } from '../../src/server/taskPresenter';

test('presentUgcTask exposes interrupted recovery state to frontend', () => {
  const task = presentUgcTask({
    id: 'task_1',
    name: '视频智能体任务',
    agentType: 'media',
    status: 'failed',
    estimatedTokenMin: 2000,
    estimatedTokenMax: 8000,
    tokenUsed: 1200,
    createdAt: new Date().toISOString(),
    steps: [],
    logs: [],
    recoveryState: {
      runState: 'interrupted',
      pauseReasonType: 'context_limit',
      pauseReasonMessage: '本轮上下文已满，需要开启新一轮续跑',
      resumeMode: 'continue',
      recoverable: true,
      artifactsPreserved: ['script.md'],
      willChargeAgain: false,
    },
  });

  assert.equal(task.recoveryState?.runState, 'interrupted');
  assert.equal(task.recoveryState?.resumeMode, 'continue');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --import tsx --test tests/server/taskPresenter.test.ts`
Expected: FAIL with `Cannot find module '../../src/server/taskPresenter'`

- [ ] **Step 3: Extend Prisma schema for recovery metadata**

```prisma
model Task {
  // ...
  pauseReasonType    String?
  pauseReasonMessage String?
  resumeMode         String?
  recoverable        Boolean @default(false)
  showcaseStage      Json?
}

model HermesExecution {
  // ...
  pauseReasonType    String?
  pauseReasonMessage String?
  resumeMode         String?
  recoverable        Boolean @default(false)
}
```

- [ ] **Step 4: Push Prisma schema locally**

Run: `npm run prisma:push`
Expected: PASS with schema synced to configured Postgres database

- [ ] **Step 5: Add minimal presenter**

```ts
import type { Task } from '../types/workbench';

export function presentUgcTask(task: any): Task {
  return {
    id: task.id,
    name: task.name,
    agentType: 'media',
    status: task.status,
    createdAt: task.createdAt,
    estimatedTokenMin: task.estimatedTokenMin,
    estimatedTokenMax: task.estimatedTokenMax,
    tokenUsed: task.tokenUsed,
    steps: task.steps ?? [],
    logs: task.logs ?? [],
    recoveryState: task.recoveryState,
  };
}
```

- [ ] **Step 6: Update ugc task service to persist and return recovery metadata**

```ts
const nextStatus = deriveTaskRunState({
  currentStatus: 'running',
  hermes: structuredRun,
});

await prisma.task.update({
  where: { id: task.id },
  data: {
    status: nextStatus.status,
    pauseReasonType: structuredRun.pauseReasonType,
    pauseReasonMessage: structuredRun.pauseReasonMessage,
    resumeMode: structuredRun.resumeMode,
    recoverable: structuredRun.recoverable,
  },
});
```

- [ ] **Step 7: Add API route wiring for recovery-aware responses**

```ts
app.get('/api/tasks/:id', async (req, res) => {
  const data = await getUgcTask(req.params.id);
  res.json({ success: true, data });
});
```

- [ ] **Step 8: Update client task API types**

```ts
export async function getRemoteTask(id: string): Promise<Task & { events: UgcTaskEvent[] }> {
  return requestJson(`/api/tasks/${id}`);
}
```

- [ ] **Step 9: Run presenter test and typecheck**

Run: `node --import tsx --test tests/server/taskPresenter.test.ts && npm run lint`
Expected: PASS

- [ ] **Step 10: Commit**

```bash
git add prisma/schema.prisma server.ts src/server/ugcTaskService.ts src/server/taskPresenter.ts src/lib/taskApi.ts tests/server/taskPresenter.test.ts
git commit -m "feat: persist task recovery state for video tasks"
```

## Task 3: 落地用户侧视频智能体页与任务页的展示舞台

**Files:**
- Modify: `src/pages/app/UgcVideoAgentPage.tsx`
- Modify: `src/pages/app/TaskRunPage.tsx`
- Modify: `src/components/app/tasks/TaskRunLayout.tsx`
- Modify: `src/components/app/tasks/UgcDeliveryPanel.tsx`
- Create: `src/components/app/tasks/TaskShowcaseStage.tsx`
- Create: `src/components/app/tasks/TaskResultSummaryBar.tsx`
- Create: `src/components/app/tasks/TaskStageRail.tsx`

**Interfaces:**
- Consumes:
  - `Task.recoveryState`
  - `Task.pendingConfirmation`
  - `Task.understanding`
  - `Task.routePlan`
- Produces:
  - A stable right-side showcase stage for `待开始 / 自动推进中 / 待确认 / 已中断待恢复 / 已完成`

- [ ] **Step 1: Write a failing component test for recovery CTA rendering**

```ts
import test from 'node:test';
import assert from 'node:assert/strict';
import { buildTaskShowcaseViewModel } from '../../src/components/app/tasks/TaskShowcaseStage';

test('buildTaskShowcaseViewModel returns recovery CTA for interrupted task', () => {
  const viewModel = buildTaskShowcaseViewModel({
    status: 'failed',
    recoveryState: {
      runState: 'interrupted',
      pauseReasonMessage: '执行中断，可从上一步恢复',
      resumeMode: 'continue',
      recoverable: true,
    },
  } as any);

  assert.equal(viewModel.primaryActionLabel, '从这里继续');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --import tsx --test tests/ui/taskShowcaseStage.test.ts`
Expected: FAIL with missing module

- [ ] **Step 3: Add showcase stage view-model helper**

```ts
export function buildTaskShowcaseViewModel(task: any) {
  if (task.recoveryState?.runState === 'interrupted') {
    return {
      headline: '任务已中断待恢复',
      body: task.recoveryState.pauseReasonMessage,
      primaryActionLabel: '从这里继续',
    };
  }

  if (task.status === 'waiting_confirmation') {
    return {
      headline: '等待确认',
      body: task.pendingConfirmation?.message ?? '请确认后继续',
      primaryActionLabel: task.pendingConfirmation?.action ?? '确认继续',
    };
  }

  return {
    headline: '结果正在路上',
    body: '已接收需求，正在组织执行方案',
    primaryActionLabel: '查看进度',
  };
}
```

- [ ] **Step 4: Implement `TaskShowcaseStage`, `TaskResultSummaryBar`, `TaskStageRail`**

```tsx
export default function TaskStageRail({ stages }: { stages: Array<{ label: string; active: boolean }> }) {
  return (
    <div className="flex items-center gap-2">
      {stages.map((stage) => (
        <span key={stage.label} className={stage.active ? 'text-black' : 'text-black/35'}>
          {stage.label}
        </span>
      ))}
    </div>
  );
}
```

- [ ] **Step 5: Refactor `UgcDeliveryPanel` to use the new right-side components**

```tsx
<TaskShowcaseStage task={task} />
<TaskResultSummaryBar task={task} />
<TaskStageRail stages={buildTaskStages(task)} />
```

- [ ] **Step 6: Update task page actions for confirm / retry / resume**

```ts
const handlePrimaryAction = async () => {
  if (task.status === 'waiting_confirmation') {
    await confirmRemoteTask(task.id);
    return;
  }
  if (task.recoveryState?.runState === 'interrupted' && task.recoveryState.resumeMode === 'continue') {
    await retryRemoteTask(task.id);
  }
};
```

- [ ] **Step 7: Update user-side video page pre-submit stage**

```tsx
<TaskShowcaseStage
  task={{
    status: 'queued',
    recoveryState: undefined,
    pendingConfirmation: undefined,
    understanding: undefined,
  }}
/>
```

- [ ] **Step 8: Run UI test, then typecheck and build**

Run: `node --import tsx --test tests/ui/taskShowcaseStage.test.ts && npm run lint && npm run build`
Expected: PASS

- [ ] **Step 9: Commit**

```bash
git add src/pages/app/UgcVideoAgentPage.tsx src/pages/app/TaskRunPage.tsx src/components/app/tasks/TaskRunLayout.tsx src/components/app/tasks/UgcDeliveryPanel.tsx src/components/app/tasks/TaskShowcaseStage.tsx src/components/app/tasks/TaskResultSummaryBar.tsx src/components/app/tasks/TaskStageRail.tsx tests/ui/taskShowcaseStage.test.ts
git commit -m "feat: add video task showcase stage and recovery states"
```

## Task 4: 把 Creator Skill 编辑页收敛成一期智能体工坊

**Files:**
- Modify: `src/types/skills.ts`
- Modify: `src/server/skillStudioService.ts`
- Modify: `src/lib/skillStudioApi.ts`
- Modify: `src/pages/app/CreatorSkillEditorPage.tsx`
- Modify: `src/components/app/studio/SkillVisualWorkbenchPreview.tsx`
- Create: `src/components/app/studio/BusinessFrameEditor.tsx`
- Test: `tests/server/skillStudioService.test.ts`

**Interfaces:**
- Consumes:
  - existing `SkillRecord`, `SkillVersionRecord`
- Produces:
  - `SkillBusinessFrame`
  - Creator-side editing for `目标 / 预算 / 执行方案 / 结果`
  - pause/recovery strategy editing for confirm nodes

- [ ] **Step 1: Write the failing skill business frame test**

```ts
import test from 'node:test';
import assert from 'node:assert/strict';
import { buildDefaultBusinessFrame } from '../../src/server/skillStudioService';

test('buildDefaultBusinessFrame returns four fixed business sections', () => {
  const frame = buildDefaultBusinessFrame();

  assert.deepEqual(Object.keys(frame), ['goal', 'budget', 'executionPlan', 'result']);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --import tsx --test tests/server/skillStudioService.test.ts`
Expected: FAIL with missing export

- [ ] **Step 3: Extend skill types**

```ts
export interface SkillBusinessFrame {
  goal: {
    summary: string;
    scenarios: string[];
  };
  budget: {
    defaultTier: 'basic' | 'standard' | 'premium';
    confirmationRequired: boolean;
  };
  executionPlan: {
    stages: Array<{
      id: string;
      label: string;
      kind: 'auto' | 'confirm';
    }>;
  };
  result: {
    promiseLine: string;
    deliveryLabels: string[];
  };
}
```

- [ ] **Step 4: Add default business frame builder on server**

```ts
export function buildDefaultBusinessFrame(): SkillBusinessFrame {
  return {
    goal: {
      summary: '帮助小团队更快拿到可交付的视频表达',
      scenarios: ['产品介绍', '门店宣传'],
    },
    budget: {
      defaultTier: 'standard',
      confirmationRequired: true,
    },
    executionPlan: {
      stages: [
        { id: 'plan', label: '明确目标', kind: 'auto' },
        { id: 'confirm', label: '确认方向', kind: 'confirm' },
      ],
    },
    result: {
      promiseLine: '快速得到可交付的视频样片',
      deliveryLabels: ['9:16', '带字幕'],
    },
  };
}
```

- [ ] **Step 5: Add `BusinessFrameEditor` and wire it into `CreatorSkillEditorPage`**

```tsx
<BusinessFrameEditor
  value={skill.latestVersion.businessFrame}
  onChange={(businessFrame) =>
    setSkill({
      ...skill,
      latestVersion: {
        ...skill.latestVersion,
        businessFrame,
      },
    })
  }
/>
```

- [ ] **Step 6: Update visual preview to mirror frontstage stage/product bar**

```tsx
<section>
  <p>{skill.latestVersion.businessFrame.result.promiseLine}</p>
  <div>
    {skill.latestVersion.businessFrame.result.deliveryLabels.map((label) => (
      <span key={label}>{label}</span>
    ))}
  </div>
</section>
```

- [ ] **Step 7: Update save/publish APIs**

```ts
latestVersion?: Parameters<typeof updateSkill>[2]['latestVersion'] & {
  businessFrame: SkillBusinessFrame;
};
```

- [ ] **Step 8: Run tests, lint, and build**

Run: `node --import tsx --test tests/server/skillStudioService.test.ts && npm run lint && npm run build`
Expected: PASS

- [ ] **Step 9: Commit**

```bash
git add src/types/skills.ts src/server/skillStudioService.ts src/lib/skillStudioApi.ts src/pages/app/CreatorSkillEditorPage.tsx src/components/app/studio/SkillVisualWorkbenchPreview.tsx src/components/app/studio/BusinessFrameEditor.tsx tests/server/skillStudioService.test.ts
git commit -m "feat: reshape creator editor into intelligence workshop"
```

## Task 5: 文档、迁移验证与一期验收

**Files:**
- Modify: `docs/iteration-update-log.md`
- Modify: `docs/frontstage-design-unification-spec.md`
- Modify: `docs/superpowers/specs/2026-06-20-creator-skill-orchestrator-design.md` (only if implementation decisions require clarifying exact field names)

**Interfaces:**
- Consumes: tasks 1-4 deliverables
- Produces:
  - release-ready implementation notes
  - migration caveats
  - manual verification checklist

- [ ] **Step 1: Add implementation update notes**

```md
## 2026-06-20 视频智能体一期实现

- 任务状态机支持 `waiting_confirmation` / `interrupted`
- 右侧结果展示舞台已接入用户页与任务页
- Creator 工坊已接入 `目标 / 预算 / 执行方案 / 结果`
```

- [ ] **Step 2: Write manual verification checklist**

```md
- 登录普通用户账号，进入 `/app/agents/media-*`
- 提交一个视频任务，确认右侧先显示默认展示舞台
- 模拟 Hermes 返回 `waiting_confirmation`
- 确认任务页出现“确认继续”
- 模拟 Hermes 返回 `interrupted`
- 确认任务页出现“从这里继续”
- 登录 Creator 账号，进入 `/app/studio/skills/media-ugc`
- 修改业务骨架后保存、发布、再回到用户页验证前台同步
```

- [ ] **Step 3: Run final checks**

Run: `npm run lint && npm run build`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add docs/iteration-update-log.md docs/frontstage-design-unification-spec.md docs/superpowers/specs/2026-06-20-creator-skill-orchestrator-design.md
git commit -m "docs: record video intelligence foundation rollout"
```

## Suggested Implementation Order

1. Task 1 — 状态机与 Hermes 契约
2. Task 2 — 服务端任务持久化与展示映射
3. Task 3 — 用户侧展示舞台与恢复动作
4. Task 4 — Creator 智能体工坊骨架
5. Task 5 — 文档与验收

## Acceptance Checklist

- 普通用户进入视频智能体页时，右侧默认显示“结果展示舞台”，而不是解释性说明栏
- Hermes 未返回时，前台不假装已经理解任务
- Hermes 返回首轮规划后，前台可以从默认舞台切到“本次任务结果”
- 视频任务支持 `waiting_confirmation`
- 视频任务支持 `interrupted` 并明确恢复路径
- 任务页能明确告诉用户：为什么停了、停在哪、能不能继续、之前结果还能不能用
- 用户原图不会被直接作为右侧主舞台主视觉
- Creator 侧能编辑 `目标 / 预算 / 执行方案 / 结果`
- Creator 侧能设置确认点与默认预算路线
- Skill 发布后，普通用户页和任务页读取的是同一套前台表达
- `npm run lint` 通过
- `npm run build` 通过
