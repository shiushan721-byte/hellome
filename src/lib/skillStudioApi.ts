import type {
  SkillDebugInput,
  SkillDebugResult,
  SkillExecutionConfig,
  SkillExperienceConfig,
  SkillRecord,
  SkillVersionRecord,
} from '../types/skills';

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

export function getSkillRuntimeConfig(skillId: string): Promise<SkillExecutionConfig> {
  return requestJson(`/api/skills/${skillId}/runtime`);
}

export function getSkillExperienceConfig(skillId: string): Promise<SkillExperienceConfig> {
  return requestJson(`/api/skills/${skillId}/experience`);
}
