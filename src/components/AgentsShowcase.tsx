import { useMemo, useState } from 'react';
import { ArrowRight, CheckCircle2, Terminal, ArrowUpRight, ShieldCheck } from 'lucide-react';
import type { HomeAgentShowcaseConfig, HomeAgentShowcaseTab } from '../types/homePageConfig';
import type { HomeActionContext } from '../lib/homePageActions';
import { executeHomeButtonAction, executeShowcaseTaskAction } from '../lib/homePageActions';

interface AgentsShowcaseProps {
  config: HomeAgentShowcaseConfig;
  activeAgentId?: string;
  onSelectAgent?: (agentId: string) => void;
  actionContext: HomeActionContext;
}

export default function AgentsShowcase({
  config,
  activeAgentId: controlledAgentId,
  onSelectAgent,
  actionContext,
}: AgentsShowcaseProps) {
  const tabs = useMemo(
    () => [...config.tabs].filter((tab) => tab.enabled).sort((a, b) => a.sortOrder - b.sortOrder),
    [config.tabs],
  );

  const defaultAgentId = tabs.some((tab) => tab.agentId === config.defaultAgentId)
    ? config.defaultAgentId
    : tabs[0]?.agentId ?? 'geo';

  const [internalAgentId, setInternalAgentId] = useState(defaultAgentId);
  const activeAgentId = controlledAgentId ?? internalAgentId;

  const setActiveAgentId = (agentId: string) => {
    if (controlledAgentId === undefined) setInternalAgentId(agentId);
    onSelectAgent?.(agentId);
  };

  if (!config.enabled || tabs.length === 0) return null;

  const currentAgent: HomeAgentShowcaseTab =
    tabs.find((tab) => tab.agentId === activeAgentId) ?? tabs[0];

  const handleActivate = () => {
    executeHomeButtonAction(currentAgent.cta.action === 'view_agent' ? 'use_agent' : 'use_agent', actionContext, {
      agentId: currentAgent.agentId,
    });
    const el = document.getElementById('agents-list-view');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative w-full py-16 lg:py-24" id="agents-list-view">
      <div className="mb-12 lg:mb-16 text-center space-y-6">
        <div className="max-w-xl mx-auto space-y-3">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-display text-black">
            {config.title}
          </h2>
          <p className="text-sm text-black/60">{config.subtitle}</p>
        </div>

        <div className="flex flex-wrap justify-center gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveAgentId(tab.agentId)}
              className={`px-3 py-2 text-[10px] sm:text-xs font-bold transition-all rounded-sm ${
                activeAgentId === tab.agentId
                  ? 'bg-black text-white'
                  : 'bg-[#F2F0ED] text-black hover:bg-[#E8E6E3]'
              }`}
            >
              {tab.shortName}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch text-left">
        <div className="lg:col-span-7 bg-white p-6 sm:p-8 flex flex-col justify-between">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <span className="inline-flex px-3 py-1 bg-[#F2F0ED] text-[10px] font-bold text-black">
                {currentAgent.badge}
              </span>
              <span className="text-[10px] font-mono text-black/40 uppercase tracking-widest">SCENARIO CORE</span>
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-extrabold font-display text-black">{currentAgent.name}</h3>
              <p className="text-sm font-semibold text-black/70">{currentAgent.tagline}</p>
              <p className="text-xs text-black/55 leading-relaxed pt-2">{currentAgent.description}</p>
            </div>

            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold text-black uppercase tracking-wider">核心执行子模块</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {currentAgent.coreScenarios.map((cs, i) => (
                  <div key={i} className="flex gap-2 text-xs text-black/70 items-start">
                    <CheckCircle2 className="w-4 h-4 text-black shrink-0 mt-0.5" />
                    <span>{cs}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-8 mt-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-1.5">
              <Terminal className="w-4 h-4 text-black/50" />
              <span className="text-xs text-black/50">底层完全适配 Hz-Hermes 执行内核</span>
            </div>
            <button
              onClick={handleActivate}
              className="py-2.5 px-4 text-xs font-bold text-white bg-black hover:bg-black/85 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>{currentAgent.cta.label}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="lg:col-span-5 bg-[#F2F0ED] p-6 sm:p-8 flex flex-col justify-between">
          <div className="space-y-6">
            <div className="pb-3">
              <h4 className="text-xs font-bold text-black uppercase tracking-wider">该智能体搭载的项目工单</h4>
              <p className="text-[11px] text-black/45 mt-0.5">常用秒级可调度的预设方案列表</p>
            </div>

            <div className="space-y-2">
              {currentAgent.quickTasks.map((qt, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() =>
                    executeShowcaseTaskAction(qt.action, actionContext, {
                      agentId: currentAgent.agentId,
                      target: qt.target,
                    })
                  }
                  className="w-full p-3 bg-white hover:bg-white/80 transition-colors flex items-center justify-between group text-left"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono font-bold text-black/35">0{i + 1}</span>
                    <span className="text-xs text-black font-medium">{qt.title}</span>
                  </div>
                  <ArrowUpRight className="w-3.5 h-3.5 text-black/30 group-hover:text-black group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                </button>
              ))}
            </div>
          </div>

          {config.footerText ? (
            <div className="pt-6 mt-6">
              <div className="flex items-center gap-2 bg-white p-3">
                <ShieldCheck className="w-4 h-4 text-black/50" />
                <span className="text-[10px] text-black/55">{config.footerText}</span>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
