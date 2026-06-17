import { getUsage, getLedger } from '../../lib/usageStore';
import { formatTime } from '../../components/app/tasks/TaskStatusBadge';

export default function UsagePage() {
  const usage = getUsage();
  const ledger = getLedger();

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold font-display">用量与套餐</h1>
        <p className="text-sm text-black/50 mt-1">查看剩余额度与任务消耗明细</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card label="当前套餐" value={usage.planName} />
        <Card label="Token 余额" value={`¥${usage.tokenBalance.toFixed(2)}`} />
        <Card label="本月消耗" value={`¥${usage.monthlySpend.toFixed(2)}`} />
        <Card
          label="剩余任务次数"
          value={`${usage.geoLimit - usage.geoUsed + usage.contentLimit - usage.contentUsed}`}
        />
      </div>

      <section className="space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-black/45">额度使用</h2>
        <UsageBar label="GEO 检测次数" used={usage.geoUsed} limit={usage.geoLimit} />
        <UsageBar label="内容生成次数" used={usage.contentUsed} limit={usage.contentLimit} />
        <UsageBar label="销售线索分析" used={usage.salesUsed} limit={usage.salesLimit} />
      </section>

      <section>
        <h2 className="text-xs font-bold uppercase tracking-wider text-black/45 mb-4">
          任务消耗明细
        </h2>
        {ledger.length === 0 ? (
          <p className="text-sm text-black/40">暂无消耗记录</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] font-bold uppercase tracking-wider text-black/40 border-b border-black/10">
                  <th className="pb-3 text-left pr-4">时间</th>
                  <th className="pb-3 text-left pr-4">任务名称</th>
                  <th className="pb-3 text-left pr-4">智能体</th>
                  <th className="pb-3 text-left pr-4">消耗类型</th>
                  <th className="pb-3 text-left">消耗数量</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/8">
                {ledger.map((entry) => (
                  <tr key={entry.id}>
                    <td className="py-3 pr-4 text-xs text-black/45">{formatTime(entry.time)}</td>
                    <td className="py-3 pr-4">{entry.taskName}</td>
                    <td className="py-3 pr-4 text-black/55 text-xs">{entry.agent}</td>
                    <td className="py-3 pr-4 text-black/55 text-xs">{entry.costType}</td>
                    <td className="py-3 font-mono text-xs">{entry.costAmount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[#F2F0ED] p-5">
      <p className="text-[10px] text-black/45 uppercase tracking-wider">{label}</p>
      <p className="text-xl font-bold font-display mt-2">{value}</p>
    </div>
  );
}

function UsageBar({ label, used, limit }: { label: string; used: number; limit: number }) {
  const pct = limit > 0 ? Math.min(100, (used / limit) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-xs mb-1.5">
        <span className="text-black/60">{label}</span>
        <span className="font-mono font-bold">
          {used} / {limit}
        </span>
      </div>
      <div className="h-2 bg-[#F2F0ED]">
        <div className="h-full bg-black transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
