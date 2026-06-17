import type { PlanEntitlements } from '../types/agentSlots';

const PLANS: Record<string, PlanEntitlements> = {
  体验版: {
    planName: '体验版',
    monthlyTokenLimit: 50_000,
    enabledAgentLimit: 1,
    monthlyInstantSwapLimit: 1,
  },
  专业版: {
    planName: '专业版',
    monthlyTokenLimit: 500_000,
    enabledAgentLimit: 3,
    monthlyInstantSwapLimit: 1,
  },
  团队版: {
    planName: '团队版',
    monthlyTokenLimit: 3_000_000,
    enabledAgentLimit: 8,
    monthlyInstantSwapLimit: 1,
  },
  企业定制: {
    planName: '企业定制',
    monthlyTokenLimit: 10_000_000,
    enabledAgentLimit: 999,
    monthlyInstantSwapLimit: 99,
  },
};

export function getPlanEntitlements(planName: string): PlanEntitlements {
  return PLANS[planName] ?? PLANS['专业版'];
}

export function getEnabledAgentLimit(planName: string): number {
  return getPlanEntitlements(planName).enabledAgentLimit;
}

export const DEBUG_PLAN_OPTIONS = ['体验版', '专业版', '团队版', '企业定制'] as const;
export type DebugPlanName = (typeof DEBUG_PLAN_OPTIONS)[number];
