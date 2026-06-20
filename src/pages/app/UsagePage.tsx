import { useEffect, useSyncExternalStore } from 'react';
import { Link } from 'react-router-dom';
import {
  getComputeStats,
  getLedger,
  getUsage,
  isLowBalance,
  subscribeUsage,
  syncUsageState,
} from '../../lib/usageStore';
import { formatTime } from '../../components/app/tasks/TaskStatusBadge';
import { formatToken, formatTokenRange } from '../../lib/tokenBilling';

const STATUS_LABEL: Record<string, string> = {
  settled: '已完成',
  reserved: '预占中',
  refunded: '已退回',
  failed: '失败',
};

export default function UsagePage() {
  useSyncExternalStore(subscribeUsage, getUsage, getUsage);

  useEffect(() => {
    void syncUsageState();
  }, []);

  const usage = getUsage();
  const stats = getComputeStats(usage);
  const ledger = getLedger();
  const low = isLowBalance(usage);

  const agentRanking = Object.entries(
    ledger.reduce<Record<string, number>>((acc, entry) => {
      acc[entry.agent] = (acc[entry.agent] ?? 0) + entry.tokenUsed;
      return acc;
    }, {}),
  )
    .map(([agent, tokenUsed]) => ({ agent, tokenUsed }))
    .sort((a, b) => b.tokenUsed - a.tokenUsed)
    .slice(0, 5);

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display">算力中心</h1>
          <p className="text-sm text-black/50 mt-1">查看 Token 余额、消耗明细与智能体用量。</p>
        </div>
        <Link
          to="/login"
          className="inline-flex justify-center px-5 py-2.5 text-xs font-bold bg-black text-white hover:bg-black/85 rounded-lg"
        >
          充值算力
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card label="剩余 Token" value={formatToken(usage.tokenBalance)} highlight={low} />
        <Card label="累计充值 Token" value={formatToken(stats.lifetimePurchasedTokens)} />
        <Card label="累计消耗 Token" value={formatToken(stats.lifetimeUsedTokens)} />
        <Card label="本月消耗 Token" value={formatToken(stats.monthlyUsed)} />
      </div>

      {low && (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2">
          Token 余额不足，建议及时充值算力，避免任务中断。
        </p>
      )}

      <section className="space-y-4 p-5 bg-[#F2F0ED]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-black/45">智能体使用说明</h2>
        </div>
        <p className="text-xs text-black/50 leading-relaxed">
          所有已开放智能体均可直接使用。任务执行前会展示预计 Token 消耗，完成后按实际用量结算。
        </p>
        <Link to="/app/agents" className="inline-block text-xs font-bold underline text-black/60 hover:text-black">
          智能体市场 →
        </Link>
      </section>

      {agentRanking.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-black/45">智能体消耗排行</h2>
          <ul className="space-y-2">
            {agentRanking.map((a, index) => (
                <li key={a.agent} className="flex justify-between text-xs bg-[#F2F0ED] px-3 py-2">
                  <span className="font-medium">
                    {index + 1}. {a.agent}
                  </span>
                  <span className="font-mono font-bold">{formatToken(a.tokenUsed)}</span>
                </li>
              ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="text-xs font-bold uppercase tracking-wider text-black/45 mb-4">最近消耗记录</h2>
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
                  <th className="pb-3 text-left pr-4">消耗 Token</th>
                  <th className="pb-3 text-left pr-4">预计 Token</th>
                  <th className="pb-3 text-left">状态</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/8">
                {ledger.map((entry) => (
                  <tr key={entry.id}>
                    <td className="py-3 pr-4 text-xs text-black/45 whitespace-nowrap">
                      {formatTime(entry.time)}
                    </td>
                    <td className="py-3 pr-4">{entry.taskName}</td>
                    <td className="py-3 pr-4 text-black/55 text-xs">{entry.agent}</td>
                    <td className="py-3 pr-4 font-mono text-xs font-bold">
                      {formatToken(entry.tokenUsed)}
                    </td>
                    <td className="py-3 pr-4 font-mono text-xs text-black/45">
                      {formatTokenRange({ min: entry.estimatedTokenMin, max: entry.estimatedTokenMax })}
                    </td>
                    <td className="py-3 text-xs text-black/55">
                      {STATUS_LABEL[entry.status] ?? entry.status}
                    </td>
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

function Card({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className={`p-5 ${highlight ? 'bg-amber-50 border border-amber-200' : 'bg-[#F2F0ED]'}`}>
      <p className="text-[10px] text-black/45 uppercase tracking-wider">{label}</p>
      <p className="text-xl font-bold font-display mt-2">{value}</p>
    </div>
  );
}
