import type {
  SkillDebugInput,
  SkillDebugResult,
  SkillExecutionConfig,
  SkillExperienceConfig,
  SkillRecord,
  SkillShowcaseVideo,
  SkillVersionRecord,
} from '../types/skills';

export type StudioModelCatalog = {
  text: {
    provider: string;
    models: Array<{ id: string; provider: string; label: string; configured: boolean }>;
  };
  media: {
    provider: string;
    tasks: string[];
    models: Array<{ id: string; provider: string; task: string; label: string; configured: boolean }>;
  };
  audio: {
    provider: string;
    models: Array<{ id: string; provider: string; language: string; label: string; configured: boolean }>;
  };
};

export type PublishedMarketAgent = {
  agentId: string;
  skillId: string;
  name: string;
  description: string;
  status: 'published';
  entryLabel: string;
  tokenRange: string;
  category: 'content';
  iconUrl?: string;
  showcaseVideo?: SkillShowcaseVideo;
};

type JsonResponse<T> = {
  success: boolean;
  data: T;
  error?: string;
};

async function requestJson<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const response = await fetch(input, init);
  const json = (await response.json()) as JsonResponse<T>;
  if (!response.ok || !json.success) {
    throw new Error(json.error || '请求失败');
  }
  return json.data;
}

export function listStudioSkills(): Promise<SkillRecord[]> {
  return requestJson('/api/studio/skills');
}

export function getStudioSkill(skillId: string): Promise<SkillRecord> {
  return requestJson(`/api/studio/skills/${skillId}`);
}

export function updateStudioSkill(
  skillId: string,
  payload: {
    name: string;
    description?: string;
    latestVersion: SkillVersionRecord;
  },
): Promise<SkillRecord> {
  return requestJson(`/api/studio/skills/${skillId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export function listStudioSkillVersions(skillId: string): Promise<SkillVersionRecord[]> {
  return requestJson(`/api/studio/skills/${skillId}/versions`);
}

export function publishStudioSkill(skillId: string): Promise<SkillRecord> {
  return requestJson(`/api/studio/skills/${skillId}/publish`, {
    method: 'POST',
  });
}

export function runStudioSkillDebug(skillId: string, input: SkillDebugInput): Promise<SkillDebugResult> {
  return requestJson(`/api/studio/skills/${skillId}/debug`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
}

export function getStudioModelCatalog(): Promise<StudioModelCatalog> {
  return requestJson('/api/studio/model-catalog');
}

export function getPublishedMarketAgents(): Promise<PublishedMarketAgent[]> {
  return requestJson('/api/published-market/agents');
}

export function getPublishedMarketAgent(agentId: string): Promise<PublishedMarketAgent> {
  return requestJson(`/api/published-market/agents/${agentId}`);
}

export function getSkillRuntimeConfig(skillId: string): Promise<SkillExecutionConfig> {
  return requestJson(`/api/skills/${skillId}/runtime`);
}

export function getSkillExperienceConfig(skillId: string): Promise<SkillExperienceConfig> {
  return requestJson(`/api/skills/${skillId}/experience`);
}
