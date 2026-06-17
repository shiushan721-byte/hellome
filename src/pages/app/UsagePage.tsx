import { useSyncExternalStore } from 'react';
import { Link } from 'react-router-dom';
import { getUsage, getLedger, isLowBalance, subscribeUsage } from '../../lib/usageStore';
import { formatTime } from '../../components/app/tasks/TaskStatusBadge';
import { formatToken, formatTokenRange } from '../../lib/tokenBilling';
import { getPlanEntitlements } from '../../lib/planEntitlements';
import {
  getActiveAgents,
  getOccupiedSlotCount,
  subscribeAgentSlots,
} from '../../lib/agentSlotStore';
import { getAgentById } from '../../data/agentsCatalog';

const STATUS_LABEL: Record<string, string> = {
  settled: '已完成',
  reserved: '预占中',
  refunded: '已退回',
  failed: '失败',
};

export default function UsagePage() {
  useSyncExternalStore(subscribeAgentSlots, () => getOccupiedSlotCount(), () => 0);
  useSyncExternalStore(subscribeUsage, getUsage, getUsage);

  const usage = getUsage();
  const ledger = getLedger();
  const low = isLowBalance(usage);
  const plan = getPlanEntitlements(usage.planName);
  const occupied = getOccupiedSlotCount();
  const activeAgents = getActiveAgents();
  const progressPct =
    usage.monthlyTokenLimit > 0
      ? Math.min(100, (usage.monthlyTokenUsed / usage.monthlyTokenLimit) * 100)
      : 0;

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold font-display">用量与套餐</h1>
        <p className="text-sm text-black/50 mt-1">查看 Token 余额、套餐额度和任务消耗明细</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card label="当前套餐" value={usage.planName} />
        <Card label="剩余 Token" value={formatToken(usage.tokenBalance)} highlight={low} />
        <Card label="本月已用" value={formatToken(usage.monthlyTokenUsed)} />
        <Card label="本月总额度" value={formatToken(usage.monthlyTokenLimit)} />
      </div>

      <section className="space-y-4 p-5 bg-[#F2F0ED]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-black/45">已启用智能体</h2>
          <span className="font-mono font-bold text-sm">
            {occupied} / {plan.enabledAgentLimit}
          </span>
        </div>
        <p className="text-xs text-black/50 leading-relaxed">
          套餐内可同时启用 {plan.enabledAgentLimit} 个智能体。启用后可在该智能体内发起任务，任务按 Token 计费。
          停用后立即释放名额，已消耗 Token 不会退回。
        </p>
        {activeAgents.length > 0 && (
          <ul className="space-y-2">
            {activeAgents.map((a) => {
              const name = getAgentById(a.agentId)?.name ?? a.agentId;
              return (
                <li key={a.agentId} className="flex justify-between text-xs bg-white px-3 py-2">
                  <span className="font-medium">{name}</span>
                  <span className="text-black/45">
                    任务 {a.completedTaskCount} · {formatToken(a.tokenUsed)} Token
                  </span>
                </li>
              );
            })}
          </ul>
        )}
        <Link to="/app/agents/mine" className="inline-block text-xs font-bold underline text-black/60 hover:text-black">
          我的智能体 →
        </Link>
      </section>

      <section className="space-y-3">
        <div className="flex justify-between text-xs">
          <span className="font-bold text-black/50 uppercase tracking-wider">本月 Token 使用进度</span>
          <span className="font-mono font-bold">
            {formatToken(usage.monthlyTokenUsed)} / {formatToken(usage.monthlyTokenLimit)}
          </span>
        </div>
        <div className="h-2.5 bg-[#F2F0ED] rounded-full overflow-hidden">
          <div
            className="h-full bg-black transition-all rounded-full"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        {low && (
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2">
            剩余 Token 低于 10%，建议及时充值，避免任务中断。
            <Link to="/login" className="ml-2 font-bold underline">
              充值 Token
            </Link>
          </p>
        )}
      </section>

      <section>
        <h2 className="text-xs font-bold uppercase tracking-wider text-black/45 mb-4">
          Token 消耗明细
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
                  <th className="pb-3 text-left pr-4">消耗 Token</th>
                  <th className="pb-3 text-left pr-4">预估 Token</th>
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
