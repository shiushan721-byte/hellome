import { useEffect, useState } from 'react';
import { adminApi } from '../../lib/adminApi';
import { AdminCard, AdminPageHeader } from '../../components/admin/AdminUi';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Record<string, number | boolean> | null>(null);

  useEffect(() => {
    void adminApi.dashboard().then(setStats).catch(() => setStats(null));
  }, []);

  const cards = [
    { label: '用户数', key: 'users' },
    { label: '任务数', key: 'tasks' },
    { label: '已完成任务', key: 'completedTasks' },
    { label: '充值记录', key: 'topups' },
    { label: 'Gnomic 绑定', key: 'gnomicBindings' },
    { label: '已发布配置', key: 'publishedConfigs' },
  ];

  return (
    <div>
      <AdminPageHeader title="仪表盘" desc="平台运营概览与关键指标" />
      <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
        {cards.map((card) => (
          <AdminCard key={card.key} className="p-4">
            <p className="text-xs text-black/45">{card.label}</p>
            <p className="text-2xl font-bold mt-2">{stats ? String(stats[card.key] ?? 0) : '—'}</p>
          </AdminCard>
        ))}
        <AdminCard className="p-4">
          <p className="text-xs text-black/45">数据库连接</p>
          <p className="text-2xl font-bold mt-2">{stats?.dbConnected ? '已连接' : '离线/演示'}</p>
        </AdminCard>
      </div>
    </div>
  );
}
