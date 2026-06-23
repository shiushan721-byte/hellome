import type { ArtifactType, GnomicBindingStatus, LedgerStatus, TaskStatus } from '@prisma/client';
import { buildDemoProfile } from './demoSeedHelpers';

export type AdminFixtureDevice = {
  id: string;
  deviceName: string;
  os: string;
  version: string;
  status: 'connected' | 'offline';
  debugEnabled?: boolean;
};

export type AdminFixtureGnomic = {
  gnomicUserId: string;
  status: GnomicBindingStatus;
};

export type AdminFixtureTopup = {
  tokenAmount: number;
  note: string;
};

export type AdminFixtureLedger = {
  taskKey?: string;
  tokenUsed: number;
  status: LedgerStatus;
  videoCost?: string;
};

export type AdminFixtureArtifact = {
  type: ArtifactType;
  label: string;
  fileName: string;
  url?: string;
  mimeType?: string;
  sizeBytes?: number;
};

export type AdminFixtureTask = {
  key: string;
  name: string;
  agentType: string;
  status: TaskStatus;
  tokenUsed: number;
  requiresConfirm?: boolean;
  sellingPoint: string;
  platform: string;
  effectGoal: string;
  artifacts?: AdminFixtureArtifact[];
};

export type AdminFixtureUser = {
  phone: string;
  name: string;
  email: string;
  status: 'active' | 'disabled';
  disabledReason?: string;
  tags?: string[];
  lastLoginAt?: string;
  hermesDevices?: AdminFixtureDevice[];
  gnomic?: AdminFixtureGnomic;
  topups?: AdminFixtureTopup[];
  ledgers?: AdminFixtureLedger[];
  tasks?: AdminFixtureTask[];
};

/** 8 个后台测试用户，覆盖 Hermes / Gnomic / 充值 / 余额 / 禁用 / 任务状态等组合 */
export function buildAdminUserFixtures(): AdminFixtureUser[] {
  return [
    {
      phone: '13800138011',
      name: '哈基米baseline',
      email: 'baseline@hellome.ai',
      status: 'active',
      tags: ['测试账号'],
      lastLoginAt: '2026-06-20T08:00:00.000Z',
    },
    {
      phone: '13800138012',
      name: '哈基米fullvip',
      email: 'fullvip@hellome.ai',
      status: 'active',
      tags: ['重点客户', '高价值用户'],
      lastLoginAt: '2026-06-22T10:30:00.000Z',
      hermesDevices: [
        {
          id: 'seed-device-12-connected',
          deviceName: 'MacBook Pro · Hz-Hermes',
          os: 'macOS',
          version: '15.4',
          status: 'connected',
        },
      ],
      gnomic: { gnomicUserId: 'gnomic-user-12', status: 'active' },
      topups: [
        { tokenAmount: 100_000, note: '企业首充' },
        { tokenAmount: 20_000, note: '活动赠送' },
      ],
      tasks: [
        {
          key: 'fixture-task-12-completed',
          name: '新品种草视频 · 抖音',
          agentType: 'media-seeding',
          status: 'completed',
          tokenUsed: 18_600,
          sellingPoint: '轻薄防晒，通勤一整天也不闷',
          platform: '抖音',
          effectGoal: '更像真人种草',
          artifacts: [
            {
              type: 'video',
              label: '样片视频',
              fileName: 'sample-video.mp4',
              url: '/media/showcase/media-seeding-sample.webm',
              mimeType: 'video/webm',
              sizeBytes: 2_400_000,
            },
            {
              type: 'script',
              label: '脚本草案',
              fileName: 'script.md',
              mimeType: 'text/markdown',
              sizeBytes: 2048,
            },
          ],
        },
      ],
      ledgers: [
        { taskKey: 'fixture-task-12-completed', tokenUsed: 18_600, status: 'settled', videoCost: '样片+合成' },
      ],
    },
    {
      phone: '13800138013',
      name: '哈基米hermesoff',
      email: 'hermesoff@hellome.ai',
      status: 'active',
      tags: ['售后处理中'],
      lastLoginAt: '2026-06-21T14:00:00.000Z',
      hermesDevices: [
        {
          id: 'seed-device-13-offline',
          deviceName: 'Windows PC · Hz-Hermes',
          os: 'Windows',
          version: '11',
          status: 'offline',
          debugEnabled: false,
        },
      ],
      tasks: [
        {
          key: 'fixture-task-13-running',
          name: '测评讲解视频 · 小红书',
          agentType: 'media-review',
          status: 'running',
          tokenUsed: 3200,
          sellingPoint: '三秒起泡，敏感肌也能放心用',
          platform: '小红书',
          effectGoal: '更像测评讲解',
        },
      ],
      ledgers: [{ taskKey: 'fixture-task-13-running', tokenUsed: 3200, status: 'reserved' }],
    },
    {
      phone: '13800138014',
      name: '哈基米gnomonly',
      email: 'gnomonly@hellome.ai',
      status: 'active',
      lastLoginAt: '2026-06-19T16:20:00.000Z',
      gnomic: { gnomicUserId: 'gnomic-user-14', status: 'active' },
      topups: [{ tokenAmount: 30_000, note: '客服补偿充值' }],
      tasks: [
        {
          key: 'fixture-task-14-failed',
          name: '带货转化视频 · 抖音',
          agentType: 'media-conversion',
          status: 'failed',
          tokenUsed: 8600,
          sellingPoint: '限时第二件半价',
          platform: '抖音',
          effectGoal: '更像带货转化',
        },
      ],
      ledgers: [{ taskKey: 'fixture-task-14-failed', tokenUsed: 8600, status: 'failed' }],
    },
    {
      phone: '13800138015',
      name: '哈基米lowbal',
      email: 'lowbal@hellome.ai',
      status: 'active',
      tags: ['风险用户'],
      lastLoginAt: '2026-06-22T06:00:00.000Z',
      tasks: [
        {
          key: 'fixture-task-15-waiting',
          name: '宣传介绍视频 · 视频号',
          agentType: 'media-showcase',
          status: 'waiting_confirmation',
          tokenUsed: 4200,
          requiresConfirm: true,
          sellingPoint: '门店周年庆全场八折',
          platform: '视频号',
          effectGoal: '更像真人种草',
        },
      ],
      ledgers: [
        { tokenUsed: 19_200, status: 'settled', videoCost: '历史任务消耗' },
        { taskKey: 'fixture-task-15-waiting', tokenUsed: 4200, status: 'reserved' },
      ],
    },
    {
      phone: '13800138016',
      name: '哈基米disabled',
      email: 'disabled@hellome.ai',
      status: 'disabled',
      disabledReason: '异常使用，客服确认后临时禁用',
      tags: ['风险用户'],
      topups: [{ tokenAmount: 10_000, note: '历史充值' }],
      tasks: [
        {
          key: 'fixture-task-16-cancelled',
          name: '演示视频 · 已取消',
          agentType: 'media-demo',
          status: 'cancelled',
          tokenUsed: 0,
          sellingPoint: '工厂产线自动化演示',
          platform: '抖音',
          effectGoal: '更像测评讲解',
        },
      ],
    },
    {
      phone: '13800138017',
      name: '哈基米multistat',
      email: 'multistat@hellome.ai',
      status: 'active',
      tags: ['企业客户', '内部账号'],
      lastLoginAt: '2026-06-22T11:45:00.000Z',
      hermesDevices: [
        {
          id: 'seed-device-17-connected',
          deviceName: 'Mac Studio · Hz-Hermes',
          os: 'macOS',
          version: '15.4',
          status: 'connected',
        },
      ],
      gnomic: { gnomicUserId: 'gnomic-user-17', status: 'active' },
      topups: [
        { tokenAmount: 50_000, note: '企业套餐' },
        { tokenAmount: -5000, note: '错误修正扣减' },
      ],
      tasks: [
        {
          key: 'fixture-task-17-draft',
          name: '草稿任务',
          agentType: 'geo',
          status: 'draft',
          tokenUsed: 0,
          sellingPoint: 'GEO 优化方案',
          platform: '抖音',
          effectGoal: '更像真人种草',
        },
        {
          key: 'fixture-task-17-queued',
          name: '排队中任务',
          agentType: 'media-proposal',
          status: 'queued',
          tokenUsed: 0,
          sellingPoint: '招商加盟短视频',
          platform: '抖音',
          effectGoal: '更像带货转化',
        },
        {
          key: 'fixture-task-17-completed',
          name: '已完成招商视频',
          agentType: 'media-proposal',
          status: 'completed',
          tokenUsed: 15_200,
          sellingPoint: '加盟政策一页讲清',
          platform: '抖音',
          effectGoal: '更像带货转化',
          artifacts: [
            {
              type: 'video',
              label: '招商样片',
              fileName: 'proposal.mp4',
              url: '/media/showcase/media-seeding-sample.webm',
              mimeType: 'video/webm',
            },
          ],
        },
      ],
      ledgers: [
        { taskKey: 'fixture-task-17-completed', tokenUsed: 15_200, status: 'settled' },
        { tokenUsed: 2000, status: 'refunded', videoCost: '失败任务退款' },
      ],
    },
    {
      phone: '13800138018',
      name: '哈基米gnomicoff',
      email: 'gnomicoff@hellome.ai',
      status: 'active',
      lastLoginAt: '2026-06-18T20:00:00.000Z',
      hermesDevices: [
        {
          id: 'seed-device-18-offline',
          deviceName: 'iMac · Hz-Hermes',
          os: 'macOS',
          version: '14.7',
          status: 'offline',
        },
      ],
      gnomic: { gnomicUserId: 'gnomic-user-18', status: 'disabled' },
      topups: [{ tokenAmount: 5000, note: '体验包' }],
      tasks: [
        {
          key: 'fixture-task-18-completed',
          name: '低消耗完成任务',
          agentType: 'media-seeding',
          status: 'completed',
          tokenUsed: 1200,
          sellingPoint: '小样本测试',
          platform: '小红书',
          effectGoal: '更像真人种草',
        },
      ],
      ledgers: [{ taskKey: 'fixture-task-18-completed', tokenUsed: 1200, status: 'settled' }],
    },
  ];
}

export function buildAdminFixtureProfiles() {
  return buildAdminUserFixtures().map((fixture) =>
    buildDemoProfile({
      phone: fixture.phone,
      name: fixture.name,
      email: fixture.email,
      workspace: `${fixture.name} 空间`,
      role: 'user',
    }),
  );
}
