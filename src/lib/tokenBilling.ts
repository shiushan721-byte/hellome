import type { DetectionDepth, GeoTaskInput } from '../types/workbench';
import { DEPTH_CONFIG } from '../types/workbench';

export interface TokenEstimate {
  min: number;
  max: number;
}

export function formatToken(n: number): string {
  return n.toLocaleString('zh-CN');
}

export function formatTokenRange(est: TokenEstimate): string {
  return `${formatToken(est.min)}-${formatToken(est.max)}`;
}

export function estimateGeoTokens(input: GeoTaskInput): TokenEstimate {
  const cfg = DEPTH_CONFIG[input.depth];
  const extraModels = Math.max(0, input.models.length - 3);
  const competitors = input.competitors
    .split(/[,，、]/)
    .map((s) => s.trim())
    .filter(Boolean).length;
  const keywordBonus = input.keywords.trim() ? 800 : 0;

  return {
    min: cfg.estimatedTokenMin + extraModels * 1500 + competitors * 1500 + keywordBonus,
    max: cfg.estimatedTokenMax + extraModels * 2500 + competitors * 2000 + keywordBonus,
  };
}

export function estimateStandardGeoTaskCount(tokenBalance: number): number {
  const avg = (DEPTH_CONFIG.standard.estimatedTokenMin + DEPTH_CONFIG.standard.estimatedTokenMax) / 2;
  return Math.max(0, Math.floor(tokenBalance / avg));
}

/** Deterministic actual consumption within estimate range */
export function computeActualTokenUsage(
  taskId: string,
  min: number,
  max: number,
): number {
  const hash = taskId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const ratio = 0.55 + (hash % 35) / 100;
  return Math.round(min + (max - min) * ratio);
}

const STEP_WEIGHTS = [0.08, 0.35, 0.1, 0.08, 0.1, 0.1, 0.09, 0.1];

export function distributeStepTokens(total: number, stepCount: number): number[] {
  const weights = STEP_WEIGHTS.slice(0, stepCount);
  const sum = weights.reduce((a, b) => a + b, 0);
  return weights.map((w) => Math.round((total * w) / sum));
}

export function depthLabel(depth: DetectionDepth): string {
  return DEPTH_CONFIG[depth].label;
}
