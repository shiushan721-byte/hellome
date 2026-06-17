import type { Task } from '../types/workbench';

export interface GeoWorkbenchStats {
  pendingCount: number;
  queuedCount: number;
  runningCount: number;
  completedToday: number;
  totalPublished: number;
  publishedToday: number;
  articlesGenerated: number;
  keywordsHit: number;
  keywordsHitDelta: string;
  platformHitRate: number;
  brandMentionRate: number;
  platformDistribution: Array<{ name: string; pct: number }>;
  trendData: Array<{ label: string; publish: number; indexed: number }>;
  pendingTasks: Task[];
}

function isToday(iso: string): boolean {
  return new Date(iso).toDateString() === new Date().toDateString();
}

function dayKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export function buildGeoWorkbenchStats(tasks: Task[]): GeoWorkbenchStats {
  const geo = tasks.filter((t) => t.agentType === 'geo');
  const pendingTasks = geo.filter((t) => t.status === 'waiting_confirmation');
  const running = geo.filter((t) => t.status === 'running');
  const completed = geo.filter((t) => t.status === 'completed');
  const completedToday = completed.filter((t) => t.completedAt && isToday(t.completedAt));

  const withResult = completed.filter((t) => t.result);
  const latest = withResult[0];

  const avgVisibility =
    withResult.length > 0
      ? Math.round(
          withResult.reduce((sum, t) => sum + (t.result?.visibilityRate ?? 0), 0) / withResult.length,
        )
      : 0;
  const avgRecommendation =
    withResult.length > 0
      ? Math.round(
          withResult.reduce((sum, t) => sum + (t.result?.recommendationRate ?? 0), 0) /
            withResult.length,
        )
      : 0;

  const keywordsHit = latest?.result?.visibilityRate ?? avgVisibility;

  const trendMap = new Map<string, { publish: number; indexed: number }>();
  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    trendMap.set(`${d.getMonth() + 1}/${d.getDate()}`, { publish: 0, indexed: 0 });
  }
  for (const t of completed) {
    const key = dayKey(t.completedAt ?? t.createdAt);
    const bucket = trendMap.get(key);
    if (!bucket) continue;
    bucket.publish += 1;
    if (t.result) bucket.indexed += 1;
  }

  return {
    pendingCount: pendingTasks.length,
    queuedCount: 0,
    runningCount: running.length,
    completedToday: completedToday.length,
    totalPublished: completed.length,
    publishedToday: completedToday.length,
    articlesGenerated: withResult.length,
    keywordsHit,
    keywordsHitDelta: withResult.length > 0 ? '近 7 天 +0%' : '近 7 天 —',
    platformHitRate: latest?.result?.visibilityRate ?? avgVisibility,
    brandMentionRate: latest?.result?.recommendationRate ?? avgRecommendation,
    platformDistribution:
      latest?.result?.visibilityDetails?.map((d) => ({ name: d.modelName, pct: d.score })) ?? [],
    trendData: [...trendMap.entries()].map(([label, v]) => ({ label, ...v })),
    pendingTasks,
  };
}
