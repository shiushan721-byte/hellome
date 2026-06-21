# 数据类型 Reference

> TypeScript 类型全集，可直接 copy 进前端项目。
> 数据源：`src/types/skills.ts`、`src/server/agentOrchestratorService.ts`。

---

## 1. SkillRecord

```ts
export type SkillStatus = 'draft' | 'published' | 'archived';

export interface SkillRecord {
  id: string;                  // "media-seeding"
  slug: string;                // URL-safe
  name: string;                // "为 消费品商家 提供 产品种草 类型的视频表达"
  description?: string;
  category: string;            // "media" | "ugc_video"
  status: SkillStatus;
  currentVersion: number;
  updatedAt: string;            // ISO 8601
  publishedAt?: string;
  latestVersion: SkillVersionRecord;
}
```

---

## 2. SkillVersionRecord

```ts
export interface SkillInputConfig {
  sellingPointLabel: string;
  sellingPointPlaceholder: string;
  productImageHint: string;
  talentImageHint: string;
  referenceUrlHint: string;
}

export interface SkillUnderstandingConfig {
  prompt: string;
  confirmationMessage: string;
}

export interface SkillRoutePlan {
  id: string;
  label: string;
  description: string;
  providerHint: string;
  fitPlatforms: string[];
}

export interface SkillExecutionConfig {
  mode: 'backend_silent' | 'local_debug';
  debugMode: 'backend_silent' | 'local_debug';
  videoProvider: string;
  requireConfirmation: boolean;
  routingMode: 'auto' | 'fixed';
  defaultPlanId: string;
  availablePlans: SkillRoutePlan[];
}

export interface SkillArtifactTemplate {
  label: string;
  fileName: string;
}

// ===== 4 业务对象（设计稿核心） =====

export interface SkillBusinessFrame {
  goal: {
    summary: string;                           // 一句话目标
    scenarios: string[];                       // 场景标签数组
    /** Optional — 新创建的智能体会带 */
    industry?: string;
    /** Optional — 业务母句 */
    businessSentence?: string;
  };
  budget: {
    defaultTier: 'basic' | 'standard' | 'premium';
    confirmationRequired: boolean;
    notes: string;
    /** Optional — 是否允许用户端升级 */
    upgradeEnabled?: boolean;
  };
  executionPlan: {
    stages: Array<{
      id: string;
      label: string;
      kind: 'auto' | 'confirm';                // auto=静默 / confirm=需用户确认
      /** Optional — producer-side steps (e.g. ["识别受众", "判断视频类型"]) */
      producerSteps?: Array<{ id: string; label: string }>;
    }>;
  };
  result: {
    promiseLine: string;                       // 一句话结果承诺
    deliveryLabels: string[];
    showcaseHint: string;
    /** Optional — 右侧商品条标签 */
    orientationTags?: string[];
  };
}

export interface SkillVersionRecord {
  id: string;                                  // "media-seeding-v1"
  versionNumber: number;
  versionLabel: string;
  status: SkillStatus;
  title: string;
  summary?: string;
  inputConfig: SkillInputConfig;
  understandingConfig: SkillUnderstandingConfig;
  executionConfig: SkillExecutionConfig;
  businessFrame: SkillBusinessFrame;          // ← 4 业务对象在这里
  artifactConfig: SkillArtifactTemplate[];
  createdAt: string;
  publishedAt?: string;
  checksum?: string;
}

// ===== Partial update 类型 =====

export interface SkillBusinessFrameUpdate {
  goal?: Partial<SkillBusinessFrame['goal']>;
  budget?: Partial<SkillBusinessFrame['budget']>;
  executionPlan?: {
    /** 整体替换，不是 merge */
    stages?: SkillBusinessFrame['executionPlan']['stages'];
  };
  result?: Partial<SkillBusinessFrame['result']>;
}
```

---

## 3. AgentOrchestratorView

API 标准返回（`/api/studio/orchestrator/agents/:id`）：

```ts
export interface AgentOrchestratorView {
  agentId: string;
  name: string;
  slug: string;
  status: SkillStatus;
  currentVersion: number;
  updatedAt: string;
  businessFrame: SkillBusinessFrame;          // ← 与 SkillVersionRecord.businessFrame 同结构
  /** stageCount = businessFrame.executionPlan.stages.length */
  stageCount: number;
  /** confirmationCount = stages 里 kind === 'confirm' 的数量 */
  confirmationCount: number;
}
```

---

## 4. Vocabularies

```ts
export const VOCABULARIES = {
  industries: [
    { id: 'consumer',      label: '消费品商家' },
    { id: 'retail',         label: '本地门店' },
    { id: 'service',        label: '服务型公司' },
    { id: 'manufacturing',  label: '制造业企业' },
    { id: 'channel',        label: '渠道/代理商' },
    { id: 'content',        label: '内容团队' },
  ],
  scenarios: [
    { id: 'seeding',    label: '产品种草' },
    { id: 'review',     label: '测评讲解' },
    { id: 'conversion', label: '带货转化' },
    { id: 'showcase',   label: '宣传介绍' },
    { id: 'demo',       label: '演示视频' },
    { id: 'proposal',   label: '客户提案' },
  ],
};
```

业务母句模板（前端展示给用户）：
> 我想做一个服务于 **[industry.label]** 的视频智能体，它要帮我完成 **[scenario.label]**。

---

## 5. 任务 / Hermes 类型

```ts
export type TaskStatus =
  | 'draft'
  | 'queued'
  | 'running'
  | 'waiting_confirmation'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface UgcTaskArtifact {
  id: string;
  type: 'video' | 'image' | 'script' | 'report';
  label: string;
  fileName: string;
  mimeType?: string;
  url?: string;                                 // 生成后才填
}

export interface UgcTaskEvent {
  level: 'info' | 'success' | 'warning' | 'error';
  message: string;
  timestamp: string;
  stepIndex?: number;
}

export interface UgcTaskPauseReasonType {
  type: 'confirmation' | 'context_limit' | 'provider_error' | 'missing_input' | 'timeout';
  message: string;
}

export interface UgcTaskResumeMode {
  mode: 'continue' | 'retry_step' | 'require_input' | 'require_creator_fix';
}

export interface Task {
  id: string;
  status: TaskStatus;
  skillId?: string;
  skillVersionId?: string;
  executionMode: 'backend_silent' | 'local_debug';
  pauseReasonType?: UgcTaskPauseReasonType['type'] | null;
  pauseReasonMessage?: string | null;
  resumeMode?: UgcTaskResumeMode['mode'] | null;
  recoverable: boolean;
  artifactsPreserved?: string[];
  willChargeAgain?: boolean | null;
  showcaseStage?: unknown;
  artifacts: UgcTaskArtifact[];
  estimatedTokenMin: number;
  tokenUsed: number;
  currentTokenUsed: number;
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  completedAt?: string;
}

export interface UgcTaskDetailResponse {
  task: Task;
  events: UgcTaskEvent[];
}
```

---

## 5.5 Audio（配音）类型

```ts
export type AudioProvider = 'local-comfyui' | 'mock';

export interface GenerateAudioInput {
  prompt: string;
  voice?: string;
  language?: 'English' | 'German' | 'French' | 'Japanese' | 'Korean' | 'Chinese' | string;
  speed?: number;
  seed?: number;
  workflow?: string;        // default: 'tts_chatterbox_api'
  timeoutMs?: number;       // default: 180000
}

export interface GenerateAudioOutput {
  url: string;
  mimeType: 'audio/wav' | 'audio/flac' | 'audio/mpeg';
  provider: AudioProvider;
  model: string;
  workflow?: string;
  promptId?: string;
  elapsedMs?: number;
  durationMs?: number;
  sampleRate?: number;
  channels?: number;
  source: 'provider' | 'fallback';   // ← 区分真实 vs mock
  sizeBytes?: number;
}

export interface AudioModelDescriptor {
  id: string;
  provider: AudioProvider;
  language: string;
  label: string;
  configured: boolean;
}

// UgcTaskArtifact.type 新增 'audio' 值
export interface UgcTaskArtifact {
  id: string;
  type: 'video' | 'image' | 'script' | 'report' | 'audio';   // ← 加 audio
  label: string;
  fileName: string;
  mimeType?: string;
  url?: string;
}
```

详见 `audio-extension.md`。

---

## 6. 前端集成示例（TypeScript）

```ts
// ============= 1. 创建智能体（入口 B） =============

const createAgent = async (industry: string, scenario: string) => {
  const res = await fetch('/api/studio/orchestrator/agents/from-spec', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ industry, scenario }),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error);
  return json.data as AgentOrchestratorView;
};

// ============= 2. 修改 4 对象（自然语言驱动后落地） =============

const updateAgent = async (
  agentId: string,
  patch: SkillBusinessFrameUpdate
) => {
  const res = await fetch(`/api/studio/orchestrator/agents/${agentId}/business`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error);
  return json.data as AgentOrchestratorView;
};

// ============= 3. 提交 UGC 任务 =============

const submitTask = async (input: {
  skillId: string;
  sellingPoint: string;
  platform: string;
  effectGoal: string;
  referenceUrl?: string;
  productImageUrl?: string;
  talentImageUrl?: string;
}) => {
  const res = await fetch('/api/tasks/ugc', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ input }),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error);
  return json.data.taskId as string;
};

// ============= 4. 轮询任务（5 秒一次） =============

const pollTask = async (taskId: string): Promise<UgcTaskDetailResponse> => {
  const res = await fetch(`/api/tasks/${taskId}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error);
  return json.data;
};

// ============= 5. 任务状态映射（5 大类前台外显） =============

const mapStatusToUi = (task: Task, currentStageKind?: 'auto' | 'confirm'): 'idle' | 'auto-running' | 'awaiting-confirm' | 'interrupted' | 'completed' => {
  switch (task.status) {
    case 'draft':
    case 'queued':
      return 'idle';
    case 'running':
      return currentStageKind === 'confirm' ? 'awaiting-confirm' : 'auto-running';
    case 'failed':
      return 'interrupted';
    case 'completed':
      return 'completed';
    case 'waiting_confirmation':
      return 'awaiting-confirm';
    case 'cancelled':
      return 'interrupted';
  }
};
```

---

## 7. 类型校验（zod / valibot 推荐）

```ts
import { z } from 'zod';

export const VocabIdSchema = z.enum([
  'consumer', 'retail', 'service', 'manufacturing', 'channel', 'content',
  'seeding', 'review', 'conversion', 'showcase', 'demo', 'proposal',
]);

export const CreateAgentRequestSchema = z.object({
  industry: VocabIdSchema,
  scenario: VocabIdSchema,
  displayName: z.string().min(1).max(60).optional(),
  slug: z.string().regex(/^[a-z0-9-]+$/).max(40).optional(),
});

export const BusinessFramePatchSchema = z.object({
  goal: z.object({
    summary: z.string().max(200).optional(),
    scenarios: z.array(z.string()).max(10).optional(),
    industry: z.string().max(40).optional(),
    businessSentence: z.string().max(200).optional(),
  }).optional(),
  budget: z.object({
    defaultTier: z.enum(['basic', 'standard', 'premium']).optional(),
    confirmationRequired: z.boolean().optional(),
    notes: z.string().max(200).optional(),
    upgradeEnabled: z.boolean().optional(),
  }).optional(),
  executionPlan: z.object({
    stages: z.array(z.object({
      id: z.string(),
      label: z.string(),
      kind: z.enum(['auto', 'confirm']),
      producerSteps: z.array(z.object({ id: z.string(), label: z.string() })).optional(),
    })).optional(),
  }).optional(),
  result: z.object({
    promiseLine: z.string().max(200).optional(),
    deliveryLabels: z.array(z.string()).max(8).optional(),
    showcaseHint: z.string().max(200).optional(),
    orientationTags: z.array(z.string()).max(5).optional(),
  }).optional(),
});
```