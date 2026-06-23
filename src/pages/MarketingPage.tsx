import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap } from 'lucide-react';
import HeroPortal from '../components/HeroPortal';
import AgentRecommendations from '../components/AgentRecommendations';
import AgentsShowcase from '../components/AgentsShowcase';
import HermesSection from '../components/HermesSection';
import InfoSections from '../components/InfoSections';
import HermesActionModal from '../components/app/HermesActionModal';
import { useLoginModal } from '../context/LoginModalProvider';
import { fetchHomePageConfig } from '../lib/homePageConfigApi';
import { getDefaultHomePageConfig } from '../lib/homePageConfigDefaults';
import type { HomeActionContext } from '../lib/homePageActions';
import type { HomePageOperationConfig } from '../types/homePageConfig';
import { isAuthenticated } from '../lib/auth';
import { isHermesConnected } from '../lib/firstRunOnboarding';
import { getHermesConnection, refreshHermesConnection, subscribeHermesConnection } from '../lib/hermesConnection';
import { replayPendingIntent } from '../lib/pendingAgentIntent';

export default function MarketingPage() {
  const navigate = useNavigate();
  const { openLogin } = useLoginModal();
  const [config, setConfig] = useState<HomePageOperationConfig | null>(null);
  const [selectedAgentId, setSelectedAgentId] = useState('geo');
  const [showHermesModal, setShowHermesModal] = useState(false);
  const [pendingAgentId, setPendingAgentId] = useState<string | null>(null);
  const guestMode = !isAuthenticated();
  const hermes = useSyncExternalStore(subscribeHermesConnection, getHermesConnection, getHermesConnection);

  useEffect(() => {
    void fetchHomePageConfig().then((data) => {
      setConfig(data);
      setSelectedAgentId(data.agentShowcase.defaultAgentId || data.agentShowcase.tabs[0]?.agentId || 'geo');
    });
  }, []);

  const actionContext: HomeActionContext = useMemo(
    () => ({
      guestMode: guestMode,
      openLogin,
      navigate,
      onHermesRequired: (agentId) => {
        setPendingAgentId(agentId ?? null);
        setShowHermesModal(true);
      },
    }),
    [guestMode, navigate, openLogin],
  );

  const pageConfig = config ?? {
    ...getDefaultHomePageConfig(),
    version: 0,
    updatedAt: new Date().toISOString(),
  };

  const heroAd = pageConfig.heroAds[0] ?? null;

  return (
    <div className="min-h-screen bg-[#FDFCFB] text-[#1A1A1A] font-sans selection:bg-black/10 selection:text-black relative">
      <header className="sticky top-0 z-40 bg-[#FDFCFB]/95 backdrop-blur-md transition-all font-sans">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <div className="w-10 h-10 bg-black flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5 text-white fill-white" />
            </div>
            <div className="flex flex-col justify-center gap-1 py-0.5">
              <span className="text-xl font-bold font-display tracking-tight text-black leading-none">
                Hello<span className="font-serif italic font-semibold">Me</span>
              </span>
              <span className="text-[11px] font-medium text-black/45 tracking-[0.18em] leading-none">哈啰蜜</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => openLogin({ redirect: '/welcome' })}
            className="px-4 py-2 bg-black text-white text-xs font-bold uppercase tracking-wider hover:bg-black/85 transition-all"
          >
            立即使用
          </button>
        </div>
      </header>

      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <section className="relative z-10 min-h-[calc(100dvh-5rem)] flex items-center justify-center">
          <HeroPortal ad={heroAd} actionContext={actionContext} />
        </section>
        <AgentRecommendations items={pageConfig.agentRecommendations} actionContext={actionContext} />
        <AgentsShowcase
          config={pageConfig.agentShowcase}
          activeAgentId={selectedAgentId}
          onSelectAgent={setSelectedAgentId}
          actionContext={actionContext}
        />
        <HermesSection />
        <InfoSections />
      </main>

      {showHermesModal && !guestMode ? (
        <HermesActionModal
          variant="pairing"
          status={hermes.status}
          onClose={() => {
            setShowHermesModal(false);
            setPendingAgentId(null);
          }}
          onOpenHermes={() => refreshHermesConnection()}
          onPairedComplete={() => {
            if (isHermesConnected()) {
              setShowHermesModal(false);
              navigate(replayPendingIntent());
              setPendingAgentId(null);
            } else if (pendingAgentId) {
              refreshHermesConnection();
            }
          }}
        />
      ) : null}
    </div>
  );
}
