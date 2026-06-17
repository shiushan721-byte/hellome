import type { GeoResultData } from '../types';

export type TaskStatus =
  | 'running'
  | 'waiting_confirmation'
  | 'completed'
  | 'failed'
  | 'cancelled';

export type AgentType = 'geo' | 'media' | 'sales';

export type StepStatus = 'pending' | 'active' | 'completed' | 'failed';

export type DetectionDepth = 'quick' | 'standard' | 'deep';

export interface TaskStep {
  id: string;
  name: string;
  status: StepStatus;
}

export interface HermesLogEntry {
  id: string;
  timestamp: string;
  message: string;
  level: 'info' | 'success' | 'warning' | 'error';
}

export interface GeoTaskInput {
  brandName: string;
  websiteUrl: string;
  keywords: string;
  competitors: string;
  models: string[];
  depth: DetectionDepth;
}

export interface Task {
  id: string;
  name: string;
  agentType: AgentType;
  status: TaskStatus;
  createdAt: string;
  completedAt?: string;
  durationMs?: number;
  costType: string;
  costAmount: number;
  input?: GeoTaskInput;
  steps: TaskStep[];
  logs: HermesLogEntry[];
  result?: GeoResultData;
  pendingConfirmation?: {
    title: string;
    message: string;
    action: string;
  };
}

export interface UsageSnapshot {
  planName: string;
  tokenBalance: number;
  monthlySpend: number;
  geoUsed: number;
  geoLimit: number;
  contentUsed: number;
  contentLimit: number;
  salesUsed: number;
  salesLimit: number;
}

export interface UsageLedgerEntry {
  id: string;
  time: string;
  taskName: string;
  agent: string;
  costType: string;
  costAmount: number;
}

export interface AuthStatus {
  browserAutomation: boolean;
  localFileAccess: boolean;
  wechatOfficial: boolean;
  xiaohongshu: boolean;
  feishu: boolean;
  email: boolean;
}

export const GEO_STEPS = [
  '生成检测问题',
  '调用模型检测',
  '分析品牌出现率',
  '分析 AI 推荐率',
  '分析竞品占位',
  '识别内容缺口',
  '生成优化建议',
  '生成报告',
] as const;

export const DEFAULT_GEO_MODELS = [
  'DeepSeek',
  '豆包',
  'Kimi',
  '通义',
  '文心',
  '腾讯元宝',
];

export const DEPTH_CONFIG: Record<
  DetectionDepth,
  { label: string; desc: string; duration: string; cost: number }
> = {
  quick: { label: '快速检测', desc: '约 1-2 分钟，消耗低', duration: '1-2 分钟', cost: 1 },
  standard: { label: '标准检测', desc: '约 3-5 分钟，推荐', duration: '3-5 分钟', cost: 1 },
  deep: { label: '深度检测', desc: '约 8-15 分钟，结果更完整', duration: '8-15 分钟', cost: 2 },
};
