import type { HomeHeroAdConfig } from '../types/homePageConfig';
import type { HomeActionContext } from '../lib/homePageActions';
import { executeHomeButtonAction } from '../lib/homePageActions';

type HeroPortalProps = {
  ad?: HomeHeroAdConfig | null;
  actionContext: HomeActionContext;
};

export default function HeroPortal({ ad, actionContext }: HeroPortalProps) {
  const brandText = ad?.brandText ?? 'HelloMe';
  const title = ad?.title ?? '让智能体完成复杂任务';
  const subtitle = ad?.subtitle ?? '选择场景，输入目标。过程看得见，结果可交付。';
  const primary = ad?.primaryButton ?? { label: '立即使用', action: 'login' as const };
  const secondary = ad?.secondaryButton;

  const brandParts = brandText.includes('Me')
    ? brandText.split(/(Me)/)
    : [brandText];

  return (
    <div className="w-full" id="hero-portal-view">
      <div className="w-full max-w-2xl mx-auto space-y-8 px-2 sm:px-0 text-center">
        <div className="space-y-5">
          <p className="text-2xl sm:text-3xl font-bold font-display tracking-tight text-black">
            {brandParts[0]}
            {brandParts[1] === 'Me' ? (
              <span className="font-serif italic font-semibold">Me</span>
            ) : null}
            {brandParts.slice(2).join('')}
          </p>

          <div className="space-y-3">
            <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-extrabold font-display tracking-tight leading-[1.08] text-black">
              {title}
            </h1>
            <p className="text-sm sm:text-base text-black/55 leading-relaxed whitespace-pre-line">
              {subtitle}
            </p>
          </div>

          <div className="flex items-center justify-center gap-3 pt-1 flex-wrap">
            <button
              type="button"
              onClick={() =>
                executeHomeButtonAction(primary.action, actionContext, {
                  agentId: primary.agentId,
                  target: primary.target,
                })
              }
              className="px-6 py-2.5 bg-black text-white text-xs font-bold tracking-wide hover:bg-black/85 transition-all"
              id="hero-use-btn"
            >
              {primary.label}
            </button>
            {secondary?.label ? (
              <button
                type="button"
                onClick={() =>
                  executeHomeButtonAction(secondary.action, actionContext, {
                    agentId: secondary.agentId,
                    target: secondary.target,
                  })
                }
                className="px-6 py-2.5 border border-black/15 text-black text-xs font-bold tracking-wide hover:bg-black/5 transition-all"
              >
                {secondary.label}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
