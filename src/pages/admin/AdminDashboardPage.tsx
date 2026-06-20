import { AlertTriangle, BarChart3, Coins, Users } from 'lucide-react';

const cards = [
  { label: '活跃用户', value: '128', icon: Users },
  { label: '本周视频任务', value: '42', icon: BarChart3 },
  { label: '本周消耗 Token', value: '286,000', icon: Coins },
  { label: '待协助异常', value: '3', icon: AlertTriangle },
] as const;

export default function AdminDashboardPage() {
  return (
    <div className="min-h-screen bg-[#F7F7F8] text-[#1A1A1A] p-4 sm:p-6 lg:p-8 space-y-6">
      <header className="bg-white border border-black/8 rounded-[28px] p-6 sm:p-8 space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-black/40">Boss Admin</p>
        <h1 className="text-2xl sm:text-3xl font-bold font-display">HelloMe 管理后台</h1>
        <p className="text-sm text-black/55 max-w-3xl">
          这里负责数据、审核、异常协助和成本管理，不承担创作者日常交付配置与调试。
        </p>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-white border border-black/8 rounded-[24px] p-5 space-y-3">
              <div className="w-11 h-11 rounded-2xl bg-[#F2F0ED] flex items-center justify-center">
                <Icon className="w-5 h-5 text-black/65" />
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.16em] text-black/40">{card.label}</p>
                <p className="text-2xl font-bold mt-2">{card.value}</p>
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}
