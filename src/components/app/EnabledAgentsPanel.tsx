import { Plus } from 'lucide-react';
import AgentIcon from './agents/AgentIcon';
import { formatToken } from '../../lib/tokenBilling';
import { statusLabel } from '../../lib/homeDashboard';
import type { EnabledAgentSummary } from '../../types/homeDashboard';

interface EnabledAgentsPanelProps {
  agents: EnabledAgentSummary[];
  onUseAgent: (agentId: string) => void;
  onViewTasks: (agentId: string) => void;
  onGoMarket: () => void;
}

export default function EnabledAgentsPanel({
  agents,
  onUseAgent,
  onViewTasks,
  onGoMarket,
}: EnabledAgentsPanelProps) {
  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full space-y-6">
      <section className="space-y-2">
        <h1 className="text-2xl font-bold font-display text-[#1A1A1A]">已启用智能体</h1>
        <p className="text-sm text-black/50 max-w-2xl">
          这些智能体仍然处于启用状态。选择一个智能体，即可重新打开工作台标签。
        </p>
      </section>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {agents.map((agent) => (
          <div
            key={agent.agentId}
            className="bg-white rounded-2xl p-5 border border-black/[0.04] shadow-sm flex flex-col min-h-[260px]"
          >
            <div className="flex items-start gap-3 mb-4">
              <AgentIcon src={agent.iconSrc} alt={agent.name} size="lg" />
              <div className="min-w-0 flex-1">
                <h2 className="text-base font-bold text-[#1A1A1A]">{agent.name}</h2>
                <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                  已启用
                </span>
              </div>
            </div>

            <p className="text-sm text-black/45 leading-relaxed line-clamp-2 mb-3">{agent.description}</p>

            <div className="text-[11px] text-black/45 space-y-1 mb-3">
              <p>本月任务：{agent.monthlyTaskCount} 个</p>
              <p>本月消耗：{formatToken(agent.monthlyTokenUsed)} Token</p>
              {agent.latestTask && (
                <p className="truncate">
                  最近任务：{agent.latestTask.name}，{statusLabel(agent.latestTask.status)}
                </p>
              )}
            </div>

            <div className="flex flex-wrap gap-2 mt-auto pt-3 border-t border-black/[0.04]">
              <button
                type="button"
                onClick={() => onUseAgent(agent.agentId)}
                className="flex-1 py-2 text-xs font-bold bg-black text-white hover:bg-black/85 rounded-lg"
              >
                使用智能体
              </button>
              <button
                type="button"
                onClick={() => onViewTasks(agent.agentId)}
                className="flex-1 py-2 text-xs font-bold border border-black/15 hover:bg-[#F2F0ED] rounded-lg"
              >
                查看任务
              </button>
            </div>
          </div>
        ))}

        <div className="rounded-2xl p-5 border border-dashed border-black/15 bg-[#F2F0ED]/50 flex flex-col items-center justify-center text-center min-h-[260px] gap-3">
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center">
            <Plus className="w-5 h-5 text-black/40" />
          </div>
          <p className="text-sm font-bold text-black/70">启用更多智能体</p>
          <p className="text-xs text-black/45">智能体可随时启用，不消耗 Token。</p>
          <button
            type="button"
            onClick={onGoMarket}
            className="px-4 py-2 text-xs font-bold bg-black text-white hover:bg-black/85 rounded-lg"
          >
            去市场启用更多智能体
          </button>
        </div>
      </div>
    </div>
  );
}
