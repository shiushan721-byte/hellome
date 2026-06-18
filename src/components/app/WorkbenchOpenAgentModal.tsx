import { X } from 'lucide-react';
import AgentIcon from './agents/AgentIcon';
import { isAgentTabOpen } from '../../lib/workbenchTabs';
import type { EnabledAgentSummary } from '../../types/homeDashboard';

interface WorkbenchOpenAgentModalProps {
  agents: EnabledAgentSummary[];
  onOpen: (agentId: string) => void;
  onClose: () => void;
}

function OpenAgentPickerCard({
  agent,
  alreadyOpen,
  onOpen,
}: {
  agent: EnabledAgentSummary;
  alreadyOpen: boolean;
  onOpen: () => void;
}) {
  return (
    <div
      className={`bg-white rounded-2xl p-4 border shadow-sm flex flex-col h-full min-h-[180px] ${
        alreadyOpen ? 'border-black/[0.04] opacity-55' : 'border-black/[0.04]'
      }`}
    >
      <AgentIcon src={agent.iconSrc} alt={agent.name} size="md" className="mb-3" />
      <h3 className="text-sm font-bold text-[#1A1A1A] mb-1.5">{agent.name}</h3>
      <p className="text-xs text-black/45 leading-relaxed line-clamp-2 flex-1 mb-3">{agent.description}</p>
      <button
        type="button"
        disabled={alreadyOpen}
        onClick={onOpen}
        className={`w-full py-2 text-xs font-bold rounded-lg ${
          alreadyOpen
            ? 'bg-black/10 text-black/40 cursor-not-allowed'
            : 'bg-black text-white hover:bg-black/85'
        }`}
      >
        {alreadyOpen ? '已打开' : '打开智能体'}
      </button>
    </div>
  );
}

export default function WorkbenchOpenAgentModal({
  agents,
  onOpen,
  onClose,
}: WorkbenchOpenAgentModalProps) {
  return (
    <div className="fixed inset-0 z-50 bg-black/25 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="w-full max-w-2xl bg-white border border-black/10 rounded-2xl shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 py-3 border-b border-black/8 flex items-center justify-between">
          <h3 className="text-sm font-semibold">打开智能体</h3>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-md border border-black/10 hover:bg-[#F2F0ED] flex items-center justify-center"
            aria-label="关闭"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="p-4 max-h-[60vh] overflow-auto">
          {agents.length === 0 ? (
            <p className="py-8 text-center text-xs text-black/45">暂无可用智能体</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {agents.map((agent) => (
                <OpenAgentPickerCard
                  key={agent.agentId}
                  agent={agent}
                  alreadyOpen={isAgentTabOpen(agent.agentId)}
                  onOpen={() => onOpen(agent.agentId)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
