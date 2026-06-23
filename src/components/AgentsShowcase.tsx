import { useMemo, useState } from 'react';
import type { HomeAgentShowcaseConfig, HomeAgentShowcaseTab } from '../types/homePageConfig';
import type { HomeActionContext } from '../lib/homePageActions';
import { executeHomeButtonAction } from '../lib/homePageActions';
import { resolveHomeAgentMeta } from '../lib/homePageAgentMeta';
import AgentIcon from './app/agents/AgentIcon';

interface AgentsShowcaseProps {
  config: HomeAgentShowcaseConfig;
  actionContext: HomeActionContext;
}

export default function AgentsShowcase({ config, actionContext }: AgentsShowcaseProps) {
  const tabs = useMemo(
    () => [...config.tabs].filter((tab) => tab.enabled).sort((a, b) => a.sortOrder - b.sortOrder),
    [config.tabs],
  );

  const defaultTabKey = tabs.some((tab) => tab.tabKey === config.defaultTabKey)
    ? config.defaultTabKey
    : tabs[0]?.tabKey ?? 'all';

  const [activeTabKey, setActiveTabKey] = useState(defaultTabKey);

  const currentTab: HomeAgentShowcaseTab | null =
    tabs.find((tab) => tab.tabKey === activeTabKey) ?? tabs[0] ?? null;

  const cards = useMemo(() => {
    if (!currentTab) return [];
    return [...currentTab.agents]
      .filter((item) => item.visible)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((item) => {
        const meta = resolveHomeAgentMeta(item.agentId);
        if (!meta) return null;
        return {
          ...item,
          meta,
          buttonLabel: item.buttonLabel || config.defaultButtonLabel || '使用智能体',
        };
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item));
  }, [currentTab, config.defaultButtonLabel]);

  if (!config.enabled || tabs.length === 0) return null;

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
              type="button"
              onClick={() => setActiveTabKey(tab.tabKey)}
              className={`px-3 py-2 text-[10px] sm:text-xs font-bold transition-all rounded-sm ${
                activeTabKey === tab.tabKey
                  ? 'bg-black text-white'
                  : 'bg-[#F2F0ED] text-black hover:bg-[#E8E6E3]'
              }`}
            >
              {tab.tabLabel}
            </button>
          ))}
        </div>
      </div>

      {cards.length === 0 ? (
        <p className="text-center text-sm text-black/40 py-12">当前标签下暂无展示智能体</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {cards.map((item) => (
            <article
              key={item.id}
              className="bg-white border border-[#f0f0f0] p-5 flex flex-col gap-4 hover:border-black/15 transition-colors cursor-pointer"
              onClick={() =>
                executeHomeButtonAction('use_agent', actionContext, { agentId: item.agentId })
              }
            >
              <div className="flex items-start gap-3">
                <AgentIcon src={item.meta.iconUrl} alt={item.meta.name} size="md" />
                <div className="min-w-0 flex-1 space-y-1">
                  <h3 className="text-sm font-bold text-black truncate">{item.meta.name}</h3>
                  <p className="text-[11px] text-black/45">{item.meta.tokenRange}</p>
                </div>
              </div>
              <p className="text-xs text-black/55 leading-relaxed line-clamp-3 flex-1">
                {item.meta.description}
              </p>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  executeHomeButtonAction('use_agent', actionContext, { agentId: item.agentId });
                }}
                className="w-full py-2.5 text-xs font-bold text-white bg-black hover:bg-black/85 transition-all"
              >
                {item.buttonLabel}
              </button>
            </article>
          ))}
        </div>
      )}

      {config.footerText ? (
        <p className="text-center text-[11px] text-black/40 mt-10">{config.footerText}</p>
      ) : null}
    </section>
  );
}
