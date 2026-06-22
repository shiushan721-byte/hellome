import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import { CATEGORIES, type AgentCategory } from '../../data/agentsCatalog';
import type { MarketMediumBannerConfig, MarketProductSpot } from '../../data/agentsMarketHome';
import { getPublishedMarketAgents, type PublishedMarketAgent } from '../../lib/skillStudioApi';
import { getUsage, isLowBalance, subscribeUsage } from '../../lib/usageStore';
import { isHermesConnected } from '../../lib/firstRunOnboarding';
import { subscribeHermesConnection, getHermesConnection, refreshHermesConnection } from '../../lib/hermesConnection';
import { getAgentsPageData, getGuestAgentsPageData, mergePublishedMarketAgents, resolveAgentsTabFromPath } from '../../lib/agentsPageData';
import type { AgentMarketCard } from '../../types/agentsPage';
import MarketCard from '../../components/app/agents/MarketCard';
import MarketHomeBanner from '../../components/app/agents/MarketHomeBanner';
import MarketProductSpots from '../../components/app/agents/MarketProductSpots';
import HermesActionModal from '../../components/app/HermesActionModal';
import { useLoginModal } from '../../context/LoginModalProvider';
import { parseMarketCategory } from '../../lib/sidebarNav';
import { tryUseAgent } from '../../lib/useAgentAccess';
import { replayPendingIntent } from '../../lib/pendingAgentIntent';
import { getAgentWorkspacePath } from '../../lib/openAgentWorkspace';

type AgentsPageProps = {
  variant?: 'public' | 'app';
};

export default function AgentsPage({ variant = 'app' }: AgentsPageProps) {
  const isPublic = variant === 'public';
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = resolveAgentsTabFromPath(location.pathname, searchParams.get('tab'));

  const [category, setCategoryState] = useState<AgentCategory>(() =>
    parseMarketCategory(location.search),
  );
  const [query, setQuery] = useState('');
  const [publishedAgents, setPublishedAgents] = useState<PublishedMarketAgent[]>([]);
  const { openLogin } = useLoginModal();
  const [showHermesModal, setShowHermesModal] = useState(false);
  const [pendingAgentId, setPendingAgentId] = useState<string | null>(null);

  useSyncExternalStore(subscribeUsage, getUsage, getUsage);
  const hermesConnected = useSyncExternalStore(
    subscribeHermesConnection,
    isHermesConnected,
    isHermesConnected,
  );
  const hermes = useSyncExternalStore(subscribeHermesConnection, getHermesConnection, getHermesConnection);

  useEffect(() => {
    setCategoryState(parseMarketCategory(location.search));
  }, [location.search]);

  useEffect(() => {
    let cancelled = false;
    void getPublishedMarketAgents()
      .then((data) => {
        if (cancelled) return;
        setPublishedAgents(data);
      })
      .catch(() => {
        if (cancelled) return;
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const setCategory = (next: AgentCategory) => {
    setCategoryState(next);
    setSearchParams(
      (prev) => {
        const params = new URLSearchParams(prev);
        if (next === 'all') params.delete('category');
        else params.set('category', next);
        return params;
      },
      { replace: true },
    );
  };

  const pageData = isPublic ? getGuestAgentsPageData() : getAgentsPageData(activeTab);
  const marketCards = useMemo(
    () => mergePublishedMarketAgents(pageData.marketAgents, publishedAgents),
    [pageData.marketAgents, publishedAgents],
  );
  const usage = getUsage();
  const lowBalance = isLowBalance(usage);

  const runUseAgent = (agentId: string) => {
    const result = tryUseAgent(agentId, { guestMode: isPublic, lowBalance: isPublic ? false : lowBalance });

    if (result.reason === 'login') {
      openLogin({
        agentId,
        action: 'use',
        redirect: isPublic ? `/agents/${agentId}` : `/app/agents/${agentId}`,
      });
      return;
    }
    if (result.reason === 'hermes') {
      setPendingAgentId(agentId);
      setShowHermesModal(true);
      return;
    }
    if (result.reason === 'recharge') {
      navigate('/app/usage/recharge');
      return;
    }
    if (result.ok) {
      navigate(getAgentWorkspacePath(agentId));
    }
  };

  const filteredMarket = useMemo(() => {
    const q = query.trim().toLowerCase();
    return marketCards.filter((card) => {
      const matchCategory = category === 'all' || card.category === category;
      const matchQuery =
        !q ||
        card.name.toLowerCase().includes(q) ||
        card.description.toLowerCase().includes(q) ||
        card.creator.toLowerCase().includes(q);
      return matchCategory && matchQuery;
    });
  }, [marketCards, category, query]);

  const handleHeroAction = () => runUseAgent('geo');

  const handleMediumAction = (banner: MarketMediumBannerConfig) => {
    if (banner.displayStatus === 'coming_soon' || banner.displayStatus === 'beta') return;
    runUseAgent(banner.agentId);
  };

  const handleProductSpot = (spot: MarketProductSpot) => {
    runUseAgent(spot.agentId);
  };

  return (
    <div className="min-h-full bg-[#F5F5F7] px-4 sm:px-6 lg:px-8 xl:px-10 pt-4 pb-6 lg:pt-5 lg:pb-8">
      <div className="w-full space-y-8">
        {!isPublic && lowBalance && (
          <p className="text-xs text-amber-700">Token 余额不足，充值后即可继续发起任务。</p>
        )}

        <MarketHomeBanner
          marketCards={marketCards}
          lowBalance={isPublic ? false : lowBalance}
          guestMode={isPublic}
          onHeroAction={handleHeroAction}
          onMediumAction={handleMediumAction}
        />

        <MarketProductSpots
          marketCards={marketCards}
          guestMode={isPublic}
          onUseSpot={handleProductSpot}
        />

        <MarketAgentGrid
          category={category}
          setCategory={setCategory}
          query={query}
          setQuery={setQuery}
          cards={filteredMarket}
          lowBalance={isPublic ? false : lowBalance}
          guestMode={isPublic}
          onUseAgent={runUseAgent}
          onViewDetail={(id) => navigate(isPublic ? `/agents/${id}` : `/app/agents/${id}`)}
        />
      </div>

      {showHermesModal && !isPublic && (
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
              const target = replayPendingIntent();
              navigate(target);
              setPendingAgentId(null);
            } else if (pendingAgentId) {
              refreshHermesConnection();
            }
          }}
        />
      )}
    </div>
  );
}

function MarketAgentGrid({
  category,
  setCategory,
  query,
  setQuery,
  cards,
  lowBalance,
  guestMode = false,
  onUseAgent,
  onViewDetail,
}: {
  category: AgentCategory;
  setCategory: (c: AgentCategory) => void;
  query: string;
  setQuery: (q: string) => void;
  cards: AgentMarketCard[];
  lowBalance: boolean;
  guestMode?: boolean;
  onUseAgent: (id: string) => void;
  onViewDetail: (id: string) => void;
}) {
  return (
    <section className="space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1">
          {CATEGORIES.map((cat) => {
            const active = category === cat.id;
            return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategory(cat.id)}
              className={`shrink-0 px-4 py-2 text-sm rounded-full transition-colors ${
                active
                  ? 'bg-[#1A1A1A] text-white font-medium'
                  : 'bg-white text-black/55 hover:text-black/75 border border-black/[0.04]'
              }`}
            >
              {cat.label}
            </button>
            );
          })}
        </div>
        <div className="relative w-full lg:w-72 shrink-0">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/30" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索智能体"
            className="w-full pl-11 pr-4 py-2.5 text-sm bg-white rounded-full border border-black/6 outline-none focus:ring-2 focus:ring-black/5 shadow-sm"
          />
        </div>
      </div>

      {cards.length === 0 ? (
        <p className="text-sm text-black/40 py-16 text-center">未找到匹配的智能体</p>
      ) : (
        <div id="agent-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 w-full">
          {cards.map((card) => (
            <MarketCard
              key={card.id}
              card={card}
              lowBalance={lowBalance}
              guestMode={guestMode}
              onEnter={() => onUseAgent(card.id)}
              onViewDetail={() => onViewDetail(card.id)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
