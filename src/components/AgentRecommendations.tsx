import { ArrowRight, Sparkles } from 'lucide-react';
import type { HomeAgentRecommendationConfig } from '../types/homePageConfig';
import type { HomeActionContext } from '../lib/homePageActions';
import { executeHomeButtonAction } from '../lib/homePageActions';

type AgentRecommendationsProps = {
  items: HomeAgentRecommendationConfig[];
  actionContext: HomeActionContext;
};

const STATUS_LABEL: Record<HomeAgentRecommendationConfig['status'], string> = {
  open: '开放',
  coming_soon: '即将开放',
  beta: '内测中',
  hidden: '隐藏',
};

export default function AgentRecommendations({ items, actionContext }: AgentRecommendationsProps) {
  if (items.length === 0) return null;

  const handleClick = (item: HomeAgentRecommendationConfig) => {
    if (item.status === 'coming_soon') {
      window.alert('该智能体即将开放，敬请期待');
      return;
    }
    if (item.status === 'beta') {
      window.alert('该智能体处于内测阶段，请联系运营申请体验');
      return;
    }
    if (item.cta.action === 'view_agent') {
      executeHomeButtonAction('use_agent', actionContext, { agentId: item.agentId });
      return;
    }
    executeHomeButtonAction('use_agent', actionContext, { agentId: item.agentId });
  };

  return (
    <section className="py-12 lg:py-16">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item) => (
          <article
            key={item.id}
            className="bg-white border border-[#f0f0f0] p-5 flex flex-col gap-4 hover:border-black/15 transition-colors"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="w-10 h-10 bg-[#F2F0ED] flex items-center justify-center shrink-0">
                {item.iconUrl ? (
                  <img src={item.iconUrl} alt="" className="w-8 h-8 object-cover" />
                ) : (
                  <Sparkles className="w-5 h-5 text-black/60" />
                )}
              </div>
              {item.badge ? (
                <span className="text-[10px] font-bold px-2 py-1 bg-[#F2F0ED] text-black">{item.badge}</span>
              ) : null}
            </div>
            <div className="space-y-2 flex-1">
              <h3 className="text-base font-bold text-black">{item.title}</h3>
              <p className="text-xs text-black/55 leading-relaxed">{item.description}</p>
              {item.tokenHint ? <p className="text-[11px] text-black/40">{item.tokenHint}</p> : null}
            </div>
            <div className="flex items-center justify-between gap-2 pt-2">
              <span className="text-[10px] font-mono text-black/35 uppercase">{STATUS_LABEL[item.status]}</span>
              <button
                type="button"
                onClick={() => handleClick(item)}
                className="text-xs font-bold text-black inline-flex items-center gap-1 hover:gap-2 transition-all"
              >
                {item.cta.label}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
