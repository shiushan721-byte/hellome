import { useLocation } from 'react-router-dom';
import { getAgentById } from '../../data/agentsCatalog';
import type { AgentEntryState } from '../../types/agentNavigation';
import AgentIcon from '../../components/app/agents/AgentIcon';

interface AgentComingSoonPageProps {
  agentId: string;
}

export default function AgentComingSoonPage({ agentId }: AgentComingSoonPageProps) {
  const location = useLocation();
  const entry = (location.state as AgentEntryState | null) ?? {};
  const agent = getAgentById(agentId);

  if (!agent) {
    return (
      <div className="min-h-full bg-white flex items-center justify-center p-8">
        <p className="text-sm text-black/45">智能体不存在</p>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-white flex items-center justify-center p-8">
      <div className="text-center space-y-4 max-w-sm">
        <AgentIcon src={agent.iconSrc} alt={agent.name} size="lg" className="mx-auto" />
        <div className="space-y-2">
          <h1 className="text-xl font-bold font-display text-[#1A1A1A]">{agent.name}</h1>
          <p className="text-sm text-black/45 leading-relaxed">{agent.desc}</p>
        </div>
        <p className="text-base font-medium text-black/35 tracking-wide">敬请期待</p>
        {entry.from && (
          <p className="text-[11px] text-black/25">工作台预览 · {agentId}</p>
        )}
      </div>
    </div>
  );
}
