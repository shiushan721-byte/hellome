import { Link, Navigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { isAuthenticated } from '../lib/auth';
import { getAgentById } from '../data/agentsCatalog';
import { getVideoAgentProfile } from '../config/videoAgentProfiles';
import AgentIcon from '../components/app/agents/AgentIcon';
import { useLoginModal } from '../context/LoginModalProvider';
import PublicMarketLayout from '../layouts/PublicMarketLayout';
import { getPublishedMarketAgent, type PublishedMarketAgent } from '../lib/skillStudioApi';

export default function PublicAgentDetailPage() {
  const { agentId } = useParams<{ agentId: string }>();
  const { openLogin } = useLoginModal();
  const [publishedAgent, setPublishedAgent] = useState<PublishedMarketAgent | null>(null);

  if (isAuthenticated()) {
    return <Navigate to={agentId ? `/app/agents/${agentId}` : '/app/agents'} replace />;
  }

  const agent = agentId ? getAgentById(agentId) : undefined;
  const videoProfile = agentId ? getVideoAgentProfile(agentId) : undefined;
  useEffect(() => {
    if (!agentId) return;
    let cancelled = false;
    void getPublishedMarketAgent(agentId)
      .then((data) => {
        if (cancelled) return;
        setPublishedAgent(data);
      })
      .catch(() => {
        if (cancelled) return;
      });
    return () => {
      cancelled = true;
    };
  }, [agentId]);
  if (!agent) {
    return (
      <PublicMarketLayout>
        <div className="p-8 text-center text-sm text-black/50">未找到该智能体</div>
      </PublicMarketLayout>
    );
  }

  return (
    <PublicMarketLayout>
      <div className="px-4 sm:px-6 lg:px-8 xl:px-10 py-6 lg:py-8 w-full max-w-3xl">
        <Link to="/agents" className="text-xs text-black/45 hover:text-black mb-6 inline-block">
          ← 返回智能体市场
        </Link>

        <div className="bg-white rounded-2xl border border-black/[0.06] p-6 sm:p-8 space-y-6">
          <div className="flex items-start gap-4">
            <AgentIcon src={agent.iconSrc} alt={agent.name} size="lg" />
            <div className="min-w-0">
              <h1 className="text-2xl font-bold font-display">{publishedAgent?.name ?? agent.name}</h1>
              <p className="text-sm text-black/55 mt-2 leading-relaxed">{publishedAgent?.description ?? agent.desc}</p>
              <p className="text-[11px] font-mono text-black/40 mt-3">预计 {publishedAgent?.tokenRange ?? agent.tokenRange}</p>
            </div>
          </div>

          {publishedAgent?.showcaseVideo ? (
            <div className="overflow-hidden rounded-2xl border border-black/[0.06] bg-[#FCFCFD]">
              <video
                src={publishedAgent.showcaseVideo.videoUrl}
                poster={publishedAgent.showcaseVideo.coverUrl}
                controls
                playsInline
                className="aspect-[9/16] w-full bg-black object-cover"
              />
              <div className="space-y-2 px-4 py-4">
                <p className="text-sm font-semibold text-[#1A1A1A]">{publishedAgent.showcaseVideo.title}</p>
                <p className="text-sm leading-6 text-black/55">{publishedAgent.showcaseVideo.summary}</p>
              </div>
            </div>
          ) : null}

          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            <InfoBlock
              title="适合谁"
              text={videoProfile?.audienceSummary ?? '需要该场景自动化能力的个人与团队用户'}
            />
            <InfoBlock title="能做什么" text={agent.desc} />
            <InfoBlock
              title="需要输入什么"
              text={videoProfile?.inputSummary ?? '品牌、产品或任务目标等基础信息'}
            />
            <InfoBlock
              title="最终交付物"
              text={videoProfile?.deliverySummary ?? '可下载、可继续编辑的任务结果与过程记录'}
            />
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            {agent.available ? (
              <button
                type="button"
                onClick={() =>
                  openLogin({
                    agentId: agent.id,
                    action: 'use',
                    redirect: `/agents/${agent.id}`,
                  })
                }
                className="px-4 py-2.5 text-xs font-bold bg-black text-white hover:bg-black/85 rounded-lg"
              >
                {videoProfile?.marketEntryLabel ?? '使用智能体'}
              </button>
            ) : (
              <button
                type="button"
                disabled
                className="px-4 py-2.5 text-xs font-bold bg-black/10 text-black/40 rounded-lg"
              >
                即将开放
              </button>
            )}
          </div>
        </div>
      </div>
    </PublicMarketLayout>
  );
}

function InfoBlock({ title, text }: { title: string; text: string }) {
  return (
    <div className="bg-[#F2F0ED] rounded-lg p-4">
      <p className="text-[10px] font-bold uppercase tracking-wider text-black/40 mb-1">{title}</p>
      <p className="text-xs text-black/60 leading-relaxed">{text}</p>
    </div>
  );
}
