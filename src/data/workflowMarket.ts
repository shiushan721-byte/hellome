/** Gnomic 工作流模板市场数据 — 点击后走 HelloMe SSO 跳转 */

export type WorkflowCategory =
  | 'all'
  | 'content'
  | 'data'
  | 'office'
  | 'marketing'
  | 'design'
  | 'dev'
  | 'life';

export type WorkflowGnomicAction = 'view' | 'experience' | 'clone';

export interface WorkflowMarketAuthor {
  name: string;
  avatarLabel: string;
  avatarBg: string;
}

export interface WorkflowMarketItem {
  id: string;
  title: string;
  templateId: string;
  category: Exclude<WorkflowCategory, 'all'>;
  coverGradient: string;
  coverLabel: string;
  author: WorkflowMarketAuthor;
  publishedAt: string;
  pricePerRun: number;
  actionPath: {
    view: string;
    experience: string;
    clone: string;
  };
}

export const WORKFLOW_CATEGORIES: Array<{ id: WorkflowCategory; label: string }> = [
  { id: 'all', label: '全部' },
  { id: 'content', label: '内容创作' },
  { id: 'data', label: '数据处理' },
  { id: 'office', label: '办公自动化' },
  { id: 'marketing', label: '营销推广' },
  { id: 'design', label: '设计创意' },
  { id: 'dev', label: '开发工具' },
  { id: 'life', label: '生活服务' },
];

function buildActionPath(templateId: string): WorkflowMarketItem['actionPath'] {
  const viewParams = new URLSearchParams({ template: templateId, action: 'view' });
  const experienceParams = new URLSearchParams({ template: templateId, action: 'experience' });
  const cloneParams = new URLSearchParams({ template: templateId, action: 'clone' });
  return {
    view: `/workspace?${viewParams.toString()}`,
    experience: `/workspace?${experienceParams.toString()}`,
    clone: `/workspace?${cloneParams.toString()}`,
  };
}

function createWorkflowItem(
  item: Omit<WorkflowMarketItem, 'templateId' | 'actionPath'> & { id: string },
): WorkflowMarketItem {
  const templateId = item.id;
  return {
    ...item,
    templateId,
    actionPath: buildActionPath(templateId),
  };
}

export const WORKFLOW_MARKET_ITEMS: WorkflowMarketItem[] = [
  createWorkflowItem({
    id: 'smart-matting',
    title: '一键智能抠图',
    category: 'design',
    coverGradient: 'from-violet-200 via-fuchsia-100 to-rose-200',
    coverLabel: '抠图',
    author: { name: 'Gnomic官方', avatarLabel: 'G', avatarBg: '#3861FB' },
    publishedAt: '2026.03.23',
    pricePerRun: 23,
  }),
  createWorkflowItem({
    id: 'festival-poster',
    title: '节日海报生成工作流',
    category: 'marketing',
    coverGradient: 'from-amber-100 via-orange-100 to-rose-200',
    coverLabel: '海报',
    author: { name: 'Gnomic官方', avatarLabel: 'G', avatarBg: '#3861FB' },
    publishedAt: '2026.03.23',
    pricePerRun: 23,
  }),
  createWorkflowItem({
    id: 'photo-restore',
    title: '老照片修复工作流',
    category: 'design',
    coverGradient: 'from-sky-100 via-indigo-100 to-violet-200',
    coverLabel: '修复',
    author: { name: 'Gnomic官方', avatarLabel: 'G', avatarBg: '#3861FB' },
    publishedAt: '2026.03.23',
    pricePerRun: 28,
  }),
  createWorkflowItem({
    id: 'province-ai-report',
    title: '省份AI产业新闻检索与政府报告生成',
    category: 'data',
    coverGradient: 'from-slate-200 via-blue-100 to-cyan-100',
    coverLabel: '报告',
    author: { name: 'Gnomic官方', avatarLabel: 'G', avatarBg: '#3861FB' },
    publishedAt: '2026.03.23',
    pricePerRun: 75,
  }),
  createWorkflowItem({
    id: 'news-daily-email',
    title: '新闻日报生成与邮件发布',
    category: 'office',
    coverGradient: 'from-emerald-100 via-teal-100 to-cyan-100',
    coverLabel: '日报',
    author: { name: 'Gnomic官方', avatarLabel: 'G', avatarBg: '#3861FB' },
    publishedAt: '2026.03.23',
    pricePerRun: 45,
  }),
  createWorkflowItem({
    id: 'hot-poster',
    title: '热点海报生成工作流',
    category: 'marketing',
    coverGradient: 'from-rose-100 via-red-100 to-orange-200',
    coverLabel: '热点',
    author: { name: 'Gnomic官方', avatarLabel: 'G', avatarBg: '#3861FB' },
    publishedAt: '2026.03.23',
    pricePerRun: 38,
  }),
  createWorkflowItem({
    id: 'wechat-layout',
    title: '公众号智能排版工作流',
    category: 'content',
    coverGradient: 'from-lime-100 via-green-100 to-emerald-100',
    coverLabel: '排版',
    author: { name: '月醉', avatarLabel: '月', avatarBg: '#7C6AE8' },
    publishedAt: '2025.12.04',
    pricePerRun: 12,
  }),
  createWorkflowItem({
    id: 'taobao-pick',
    title: '淘宝选品工作流',
    category: 'marketing',
    coverGradient: 'from-yellow-100 via-amber-100 to-orange-100',
    coverLabel: '选品',
    author: { name: '好运连连', avatarLabel: '运', avatarBg: '#F59E0B' },
    publishedAt: '2025.09.22',
    pricePerRun: 16,
  }),
  createWorkflowItem({
    id: 'doc-summary',
    title: '长文档智能摘要工作流',
    category: 'office',
    coverGradient: 'from-blue-100 via-sky-100 to-indigo-100',
    coverLabel: '摘要',
    author: { name: 'Gnomic官方', avatarLabel: 'G', avatarBg: '#3861FB' },
    publishedAt: '2026.02.18',
    pricePerRun: 18,
  }),
  createWorkflowItem({
    id: 'meeting-minutes',
    title: '会议纪要自动生成',
    category: 'office',
    coverGradient: 'from-indigo-100 via-violet-100 to-purple-100',
    coverLabel: '纪要',
    author: { name: 'Gnomic官方', avatarLabel: 'G', avatarBg: '#3861FB' },
    publishedAt: '2026.01.12',
    pricePerRun: 20,
  }),
  createWorkflowItem({
    id: 'data-clean',
    title: '表格数据清洗与标准化',
    category: 'data',
    coverGradient: 'from-cyan-100 via-sky-100 to-blue-100',
    coverLabel: '清洗',
    author: { name: 'Gnomic官方', avatarLabel: 'G', avatarBg: '#3861FB' },
    publishedAt: '2025.11.08',
    pricePerRun: 32,
  }),
  createWorkflowItem({
    id: 'travel-plan',
    title: '旅行攻略一键生成',
    category: 'life',
    coverGradient: 'from-teal-100 via-emerald-100 to-lime-100',
    coverLabel: '旅行',
    author: { name: '小鹿', avatarLabel: '鹿', avatarBg: '#10B981' },
    publishedAt: '2025.10.15',
    pricePerRun: 14,
  }),
];

export function filterWorkflowMarketItems(
  items: WorkflowMarketItem[],
  category: WorkflowCategory,
  query: string,
): WorkflowMarketItem[] {
  const q = query.trim().toLowerCase();
  return items.filter((item) => {
    const matchCategory = category === 'all' || item.category === category;
    const matchQuery =
      !q ||
      item.title.toLowerCase().includes(q) ||
      item.author.name.toLowerCase().includes(q);
    return matchCategory && matchQuery;
  });
}
