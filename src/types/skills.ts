import type { TaskExecutionMode } from './ugc';

export type SkillStatus = 'draft' | 'published' | 'archived';

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

export interface SkillModelSelectionConfig {
  imageModel: string;
  videoModel: string;
  audioModel: string;
  audioEnabled: boolean;
}

export interface SkillExecutionConfig {
  mode: TaskExecutionMode;
  debugMode: TaskExecutionMode;
  videoProvider: string;
  requireConfirmation: boolean;
  routingMode: 'auto' | 'fixed';
  defaultPlanId: string;
  availablePlans: SkillRoutePlan[];
  modelSelection: SkillModelSelectionConfig;
}

export interface SkillArtifactTemplate {
  label: string;
  fileName: string;
}

export interface SkillShowcaseVideo {
  title: string;
  summary: string;
  videoUrl: string;
  coverUrl?: string;
  posterText?: string;
}

export interface SkillBusinessFrame {
  goal: {
    summary: string;
    scenarios: string[];
    /** Optional — set when the agent was built from the entry-point B spec. */
    industry?: string;
    /** "我想做一个服务于 [industry] 的视频智能体，帮我完成 [scenario]" */
    businessSentence?: string;
  };
  budget: {
    defaultTier: 'basic' | 'standard' | 'premium';
    confirmationRequired: boolean;
    notes: string;
    /** Allow user to upgrade tier at runtime (e.g. pay more for higher quality). */
    upgradeEnabled?: boolean;
  };
  executionPlan: {
    stages: Array<{
      id: string;
      label: string;
      kind: 'auto' | 'confirm';
      /** Producer-side labels — Hermes execution chain is opaque by default. */
      producerSteps?: Array<{ id: string; label: string }>;
    }>;
  };
  result: {
    promiseLine: string;
    deliveryLabels: string[];
    showcaseHint: string;
    /** Tags used by the right-side product bar (1-3 orientation tags, 2-4 delivery tags). */
    orientationTags?: string[];
    showcaseVideo?: SkillShowcaseVideo;
    /** 市场卡片 / 详情页展示用图标 URL */
    marketIconSrc?: string;
  };
}

/**
 * Partial update payload — every field is optional so a single endpoint
 * (`POST /api/studio/agents/:id/business`) can mutate any subset of the
 * four business objects in one round-trip.
 */
export interface SkillBusinessFrameUpdate {
  goal?: Partial<SkillBusinessFrame['goal']>;
  budget?: Partial<SkillBusinessFrame['budget']>;
  executionPlan?: {
    stages?: SkillBusinessFrame['executionPlan']['stages'];
  };
  result?: Partial<SkillBusinessFrame['result']>;
}

export interface SkillVersionRecord {
  id: string;
  versionNumber: number;
  versionLabel: string;
  status: SkillStatus;
  title: string;
  summary?: string;
  inputConfig: SkillInputConfig;
  understandingConfig: SkillUnderstandingConfig;
  executionConfig: SkillExecutionConfig;
  businessFrame: SkillBusinessFrame;
  artifactConfig: SkillArtifactTemplate[];
  createdAt: string;
  publishedAt?: string;
  checksum?: string;
}

export interface SkillRecord {
  id: string;
  slug: string;
  name: string;
  description?: string;
  category: string;
  status: SkillStatus;
  currentVersion: number;
  updatedAt: string;
  publishedAt?: string;
  latestVersion: SkillVersionRecord;
}

export interface SkillDebugInput {
  sellingPoint: string;
  platform: string;
  effectGoal: string;
  referenceDirection?: string;
}

export interface SkillDebugResult {
  runId: string;
  input: SkillDebugInput;
  understanding: {
    targetAudience: string;
    videoStyle: string;
    coreAngle: string;
    outputGoal: string;
    draftScript: string;
  };
  logs: Array<{
    level: 'info' | 'success' | 'warning' | 'error';
    message: string;
  }>;
  provider: string;
  model: string;
  source: 'provider' | 'fallback';
}

export interface SkillExperienceConfig {
  id: string;
  name: string;
  description?: string;
  title: string;
  summary?: string;
  inputConfig: SkillInputConfig;
  understandingConfig: SkillUnderstandingConfig;
  executionConfig: SkillExecutionConfig;
  businessFrame: SkillBusinessFrame;
  artifactConfig: SkillArtifactTemplate[];
}
