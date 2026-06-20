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

export interface SkillExecutionConfig {
  mode: TaskExecutionMode;
  debugMode: TaskExecutionMode;
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

export interface SkillBusinessFrame {
  goal: {
    summary: string;
    scenarios: string[];
  };
  budget: {
    defaultTier: 'basic' | 'standard' | 'premium';
    confirmationRequired: boolean;
    notes: string;
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
    showcaseHint: string;
  };
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
