import type { GeoResultData } from '../types';
import type { GeoTaskInput, Task, TaskStep } from '../types/workbench';
import { GEO_STEPS } from '../types/workbench';
import { setAgentUsageStats } from './agentSlotStore';

const TASKS_KEY = 'hellome_tasks';
const SEEDED_KEY = 'hellome_tasks_demo_seeded';

function daysAgo(days: number, hour = 10): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, 30, 0, 0);
  return d.toISOString();
}

function completedSteps(tokenTotal: number): TaskStep[] {
  const per = Math.floor(tokenTotal / GEO_STEPS.length);
  return GEO_STEPS.map((name, i) => ({
    id: `step-${i}`,
    name,
    status: 'completed' as const,
    tokenUsed: i === GEO_STEPS.length - 1 ? tokenTotal - per * (GEO_STEPS.length - 1) : per,
  }));
}

function sampleResult(brand: string, visibility: number): GeoResultData {
  return {
    visibilityRate: visibility,
    recommendationRate: Math.round(visibility * 0.62),
    competitorShare: Math.round(100 - visibility * 0.85),
    visibilityDetails: [
      { modelName: 'DeepSeek', score: visibility + 4 },
      { modelName: '豆包', score: visibility - 2 },
      { modelName: 'Kimi', score: visibility - 6 },
      { modelName: '通义', score: visibility - 3 },
    ],
    keyCompetitors: ['行业头部品牌', '新锐竞品'],
    brandMentions: [
      {
        context: `在「${brand} 怎么样」类问题中，模型多次提及该品牌并提供正向评价。`,
        sentiment: 'positive',
      },
      {
        context: '对比问答场景下，品牌出现在推荐列表第二位。',
        sentiment: 'neutral',
      },
    ],
    dynamicAnalysis: `${brand} 在主流大模型中的整体可见度为 ${visibility}%，推荐率仍有提升空间。DeepSeek 与豆包渠道表现最好，建议优先补充 FAQ 与结构化数据。`,
    actionableSuggestions: [
      {
        title: '补充官网 FAQ 与 LLMs.txt',
        description: '针对高频问答场景输出结构化内容，提升 AI 召回率。',
        priority: 'High',
      },
      {
        title: '优化品牌对比类内容',
        description: '在官网增加与头部竞品的客观对比页，争取首推位。',
        priority: 'Medium',
      },
    ],
  };
}

function geoInput(brand: string, keywords: string): GeoTaskInput {
  return {
    brandName: brand,
    websiteUrl: `https://www.${brand.toLowerCase().replace(/\s/g, '')}.com`,
    keywords,
    competitors: '行业头部品牌, 新锐竞品',
    models: ['DeepSeek', '豆包', 'Kimi', '通义'],
    depth: 'standard',
  };
}

function buildDemoTasks(): Task[] {
  const logs = (entries: Array<[string, 'info' | 'success' | 'warning' | 'error']>) =>
    entries.map(([message, level], i) => ({
      id: `demo-log-${i}`,
      timestamp: '10:32',
      message,
      level,
    }));

  return [
    {
      id: 'demo-task-hellome-001',
      name: 'HelloMe AI 可见度检测',
      agentType: 'geo',
      status: 'completed',
      createdAt: daysAgo(1, 14),
      completedAt: daysAgo(1, 14),
      durationMs: 4 * 60 * 1000 + 12000,
      estimatedTokenMin: 12000,
      estimatedTokenMax: 25000,
      tokenUsed: 18_420,
      input: geoInput('HelloMe', 'AI 营销, GEO 优化'),
      steps: completedSteps(18_420),
      logs: logs([
        ['已连接 DeepSeek、豆包、Kimi 等 4 个模型', 'info'],
        ['完成 36 组检测问题采样', 'info'],
        ['品牌出现率 71%，推荐率 44%', 'success'],
        ['报告已生成', 'success'],
      ]),
      result: sampleResult('HelloMe', 71),
    },
    {
      id: 'demo-task-yueji-002',
      name: '悦己美妆 GEO 检测',
      agentType: 'geo',
      status: 'completed',
      createdAt: daysAgo(4, 11),
      completedAt: daysAgo(4, 11),
      durationMs: 3 * 60 * 1000 + 8000,
      estimatedTokenMin: 12000,
      estimatedTokenMax: 25000,
      tokenUsed: 15_680,
      input: geoInput('悦己美妆', '美妆护肤, 国货彩妆'),
      steps: completedSteps(15_680),
      logs: logs([
        ['开始标准检测（4 模型 × 标准深度）', 'info'],
        ['竞品占位分析完成', 'info'],
        ['任务完成', 'success'],
      ]),
      result: sampleResult('悦己美妆', 58),
    },
    {
      id: 'demo-task-dengta-003',
      name: '灯塔科技 品牌可见度检测',
      agentType: 'geo',
      status: 'completed',
      createdAt: daysAgo(8, 16),
      completedAt: daysAgo(8, 16),
      durationMs: 5 * 60 * 1000 + 5000,
      estimatedTokenMin: 12000,
      estimatedTokenMax: 25000,
      tokenUsed: 21_350,
      input: geoInput('灯塔科技', '企业 SaaS, 数据分析'),
      steps: completedSteps(21_350),
      logs: logs([
        ['生成 48 组行业对比问题', 'info'],
        ['Kimi 渠道可见度偏低，已标记优化建议', 'warning'],
        ['报告已生成', 'success'],
      ]),
      result: sampleResult('灯塔科技', 63),
    },
    {
      id: 'demo-task-yunfan-004',
      name: '云帆 SaaS 竞品占位分析',
      agentType: 'geo',
      status: 'failed',
      createdAt: daysAgo(3, 9),
      completedAt: daysAgo(3, 9),
      durationMs: 2 * 60 * 1000 + 3000,
      estimatedTokenMin: 12000,
      estimatedTokenMax: 25000,
      tokenUsed: 4_120,
      input: geoInput('云帆 SaaS', '协同办公, 项目管理'),
      steps: GEO_STEPS.map((name, i) => ({
        id: `step-${i}`,
        name,
        status: i < 2 ? ('completed' as const) : i === 2 ? ('failed' as const) : ('pending' as const),
        tokenUsed: i < 2 ? 2060 : undefined,
      })),
      logs: logs([
        ['开始调用模型检测', 'info'],
        ['通义接口超时，已重试 2 次', 'warning'],
        ['任务失败：模型调用异常', 'error'],
      ]),
    },
    {
      id: 'demo-task-shengxin-005',
      name: '省心家政 AI 推荐率检测',
      agentType: 'geo',
      status: 'waiting_confirmation',
      createdAt: daysAgo(0, 10),
      estimatedTokenMin: 12000,
      estimatedTokenMax: 25000,
      tokenUsed: 9_800,
      currentTokenUsed: 9_800,
      input: geoInput('省心家政', '家政服务, 保洁上门'),
      steps: GEO_STEPS.map((name, i) => ({
        id: `step-${i}`,
        name,
        status: i < 5 ? ('completed' as const) : i === 5 ? ('active' as const) : ('pending' as const),
        tokenUsed: i < 5 ? 1960 : undefined,
      })),
      logs: logs([
        ['已完成品牌出现率与推荐率分析', 'info'],
        ['检测到敏感行业词，需确认后继续生成报告', 'warning'],
      ]),
      pendingConfirmation: {
        title: '继续生成完整报告？',
        message: '检测涉及家政类目敏感表述，确认后将生成完整优化建议与报告。',
        action: '确认并继续',
      },
    },
    {
      id: 'demo-task-qinghe-006',
      name: '青禾教育 GEO 快速检测',
      agentType: 'geo',
      status: 'completed',
      createdAt: daysAgo(12, 15),
      completedAt: daysAgo(12, 15),
      durationMs: 2 * 60 * 1000 + 10000,
      estimatedTokenMin: 5000,
      estimatedTokenMax: 10000,
      tokenUsed: 8_240,
      input: { ...geoInput('青禾教育', 'K12 教育, 在线课程'), depth: 'quick' },
      steps: completedSteps(8_240),
      logs: logs([
        ['快速检测模式：2 模型采样', 'info'],
        ['任务完成', 'success'],
      ]),
      result: sampleResult('青禾教育', 49),
    },
  ];
}

function syncGeoStatsFromTasks(tasks: Task[]): void {
  const month = new Date();
  const monthKey = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`;
  const geoDone = tasks.filter(
    (t) =>
      t.agentType === 'geo' &&
      t.status === 'completed' &&
      t.createdAt.startsWith(monthKey),
  );
  if (geoDone.length === 0) return;
  setAgentUsageStats('geo', {
    completedTaskCount: geoDone.length,
    tokenUsed: geoDone.reduce((sum, t) => sum + t.tokenUsed, 0),
  });
}

/** 首次进入且无任务记录时注入演示数据 */
export function ensureDemoTasks(): void {
  if (localStorage.getItem(SEEDED_KEY)) return;

  const raw = localStorage.getItem(TASKS_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as unknown[];
      if (Array.isArray(parsed) && parsed.length > 0) return;
    } catch {
      // 损坏数据，继续写入演示任务
    }
  }

  const tasks = buildDemoTasks();
  localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
  localStorage.setItem(SEEDED_KEY, '1');
  syncGeoStatsFromTasks(tasks);
}
