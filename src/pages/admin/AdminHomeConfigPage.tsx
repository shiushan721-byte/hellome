import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { adminApi } from '../../lib/adminApi';
import { getDefaultHomePageConfig } from '../../lib/homePageConfigDefaults';
import { normalizeHomePageConfigPayload } from '../../lib/homePageConfigNormalize';
import { uploadTaskFile } from '../../lib/taskApi';
import { getHeroAdAspectRatio, getHeroAdImageSizeHint } from '../../lib/homeHeroAds';
import { filterAgentsForMarketCategory } from '../../lib/agentMarketCategories';
import { listHomeAgentOptions, resolveHomeAgentMeta } from '../../lib/homePageAgentMeta';
import {
  HOME_RECOMMEND_DESC_MAX,
  HOME_RECOMMEND_TITLE_MAX,
  clampHomeRecommendText,
} from '../../lib/homePageRecommendLimits';
import AdminDrawer from '../../components/admin/AdminDrawer';
import {
  AdminCard,
  AdminPageHeader,
  AdminTable,
  adminInputClass,
  adminLinkClass,
  adminTabClass,
} from '../../components/admin/AdminUi';
import type { AdminAgentRecord } from '../../types/adminAgent';
import type {
  AdminHomeConfigState,
  HomeAgentRecommendationConfig,
  HomeAgentShowcaseCard,
  HomeAgentShowcaseTab,
  HomeButtonAction,
  HomeHeroAdConfig,
  HomePageConfigPayload,
} from '../../types/homePageConfig';

type ConfigTab = 'hero' | 'recommend' | 'showcase';

/** 智能体推荐位后台暂未开放，隐藏对应 Tab */
const SHOW_AGENT_RECOMMEND_TAB = false;

type HomeConfigDrawer =
  | { kind: 'hero'; id: string }
  | { kind: 'recommend'; id: string }
  | { kind: 'showcase-tab'; id: string };

const CONFIG_TABS: Array<{ id: ConfigTab; label: string }> = [
  { id: 'hero', label: '首屏图片广告' },
  ...(SHOW_AGENT_RECOMMEND_TAB ? [{ id: 'recommend' as const, label: '智能体推荐位' }] : []),
  { id: 'showcase', label: '标签管理' },
];

const BUTTON_ACTIONS: HomeButtonAction[] = [
  'login',
  'use_agent',
  'open_market',
  'open_workbench',
  'open_url',
  'open_gnomic',
  'open_agentsyun',
];

function newId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}`;
}

function showcaseAgentMeta(agentId: string, onlineAgents: AdminAgentRecord[]) {
  const online = onlineAgents.find((agent) => agent.slug === agentId);
  if (online) {
    return {
      agentId: online.slug,
      name: online.name,
      description: online.description,
      iconUrl: online.iconUrl,
    };
  }
  const catalog = resolveHomeAgentMeta(agentId);
  if (!catalog) return null;
  return {
    agentId: catalog.agentId,
    name: catalog.name,
    description: catalog.description,
    iconUrl: catalog.iconUrl,
  };
}

export default function AdminHomeConfigPage() {
  const [tab, setTab] = useState<ConfigTab>('hero');
  const [meta, setMeta] = useState<AdminHomeConfigState | null>(null);
  const [config, setConfig] = useState<HomePageConfigPayload>(() => getDefaultHomePageConfig());
  const [drawer, setDrawer] = useState<HomeConfigDrawer | null>(null);
  const [loading, setLoading] = useState(true);
  const agentOptions = useMemo(() => listHomeAgentOptions(), []);
  const [onlineAgents, setOnlineAgents] = useState<AdminAgentRecord[]>([]);
  const onlineAgentOptions = useMemo(
    () => onlineAgents.filter((agent) => agent.status === 'online'),
    [onlineAgents],
  );
  const [message, setMessage] = useState('');
  const [heroImageUploading, setHeroImageUploading] = useState(false);
  const [persisting, setPersisting] = useState(false);
  const skipPersistRef = useRef(true);

  const persistConfig = useCallback(async (next: HomePageConfigPayload, configId?: string | null) => {
    setPersisting(true);
    setMessage('');
    try {
      const saved = await adminApi.saveHomeConfig({
        configId: configId ?? meta?.configId ?? null,
        config: next,
      });
      setMeta((prev) =>
        prev
          ? {
              ...prev,
              configId: saved.configId,
              status: 'published',
              version: saved.version,
              updatedAt: saved.updatedAt,
            }
          : null,
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '保存失败');
    } finally {
      setPersisting(false);
    }
  }, [meta?.configId]);

  const load = useCallback(async () => {
    setLoading(true);
    setMessage('');
    skipPersistRef.current = true;
    try {
      const [data, agents] = await Promise.all([adminApi.homeConfig(), adminApi.agents()]);
      const nextConfig = normalizeHomePageConfigPayload(data.config);
      setMeta(data);
      setConfig(nextConfig);
      setOnlineAgents(agents);
    } catch (error) {
      setConfig(getDefaultHomePageConfig());
      setMessage(
        error instanceof Error
          ? `${error.message}（已加载本地默认配置，请确认管理员已登录）`
          : '加载失败，已使用本地默认配置',
      );
    } finally {
      setLoading(false);
      window.setTimeout(() => {
        skipPersistRef.current = false;
      }, 0);
    }
  }, []);

  useEffect(() => {
    if (!SHOW_AGENT_RECOMMEND_TAB && tab === 'recommend') {
      setTab('hero');
    }
  }, [tab]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (loading || skipPersistRef.current) return;
    const timer = window.setTimeout(() => {
      void persistConfig(config, meta?.configId);
    }, 600);
    return () => window.clearTimeout(timer);
  }, [config, loading, meta?.configId, persistConfig]);

  const updateHero = (id: string, patch: Partial<HomeHeroAdConfig>) => {
    setConfig((prev) =>
      prev
        ? {
            ...prev,
            heroAds: prev.heroAds.map((item) => (item.id === id ? { ...item, ...patch } : item)),
          }
        : prev,
    );
  };

  const updateRec = (id: string, patch: Partial<HomeAgentRecommendationConfig>) => {
    setConfig((prev) =>
      prev
        ? {
            ...prev,
            agentRecommendations: prev.agentRecommendations.map((item) =>
              item.id === id ? { ...item, ...patch } : item,
            ),
          }
        : prev,
    );
  };

  const updateShowcaseTab = (tabId: string, patch: Partial<HomeAgentShowcaseTab>) => {
    setConfig((prev) =>
      prev
        ? {
            ...prev,
            agentShowcase: {
              ...prev.agentShowcase,
              tabs: prev.agentShowcase.tabs.map((item) =>
                item.id === tabId ? { ...item, ...patch } : item,
              ),
            },
          }
        : prev,
    );
  };

  const shelfShowcaseTab = (tabId: string) => {
    updateShowcaseTab(tabId, { enabled: false });
  };

  const onlineShowcaseTab = (tabId: string) => {
    updateShowcaseTab(tabId, { enabled: true });
    setDrawer((current) => (current?.kind === 'showcase-tab' && current.id === tabId ? null : current));
  };

  const openShowcaseTabDrawer = (tabId: string) => {
    const target = config.agentShowcase.tabs.find((item) => item.id === tabId);
    if (!target || target.enabled) return;
    setDrawer({ kind: 'showcase-tab', id: tabId });
  };

  const updateShowcaseCard = (tabId: string, cardId: string, patch: Partial<HomeAgentShowcaseCard>) => {
    setConfig((prev) =>
      prev
        ? {
            ...prev,
            agentShowcase: {
              ...prev.agentShowcase,
              tabs: prev.agentShowcase.tabs.map((tabItem) =>
                tabItem.id === tabId
                  ? {
                      ...tabItem,
                      agents: tabItem.agents.map((card) => (card.id === cardId ? { ...card, ...patch } : card)),
                    }
                  : tabItem,
              ),
            },
          }
        : prev,
    );
  };

  const addAgentToShowcaseTab = (tabId: string, agentSlug: string) => {
    if (!agentSlug) return;
    setConfig((prev) => {
      if (!prev) return prev;
      const tabItem = prev.agentShowcase.tabs.find((item) => item.id === tabId);
      if (!tabItem || tabItem.agents.some((card) => card.agentId === agentSlug)) return prev;
      const card: HomeAgentShowcaseCard = {
        id: newId('card'),
        agentId: agentSlug,
        buttonLabel: prev.agentShowcase.defaultButtonLabel || '使用智能体',
        visible: true,
        sortOrder: tabItem.agents.length,
      };
      return {
        ...prev,
        agentShowcase: {
          ...prev.agentShowcase,
          tabs: prev.agentShowcase.tabs.map((item) =>
            item.id === tabId ? { ...item, agents: [...item.agents, card] } : item,
          ),
        },
      };
    });
  };

  const removeShowcaseCard = (tabId: string, cardId: string) => {
    setConfig((prev) =>
      prev
        ? {
            ...prev,
            agentShowcase: {
              ...prev.agentShowcase,
              tabs: prev.agentShowcase.tabs.map((tabItem) =>
                tabItem.id === tabId
                  ? { ...tabItem, agents: tabItem.agents.filter((card) => card.id !== cardId) }
                  : tabItem,
              ),
            },
          }
        : prev,
    );
  };

  if (loading && !meta) {
    return <p className="text-sm text-black/50 p-6">加载中…</p>;
  }

  const drawerHero =
    drawer?.kind === 'hero' ? (config.heroAds.find((item) => item.id === drawer.id) ?? null) : null;
  const drawerRec =
    drawer?.kind === 'recommend'
      ? (config.agentRecommendations.find((item) => item.id === drawer.id) ?? null)
      : null;
  const drawerShowcaseTab =
    drawer?.kind === 'showcase-tab'
      ? (config.agentShowcase.tabs.find((item) => item.id === drawer.id) ?? null)
      : null;
  const canEditShowcaseTab = Boolean(drawerShowcaseTab && !drawerShowcaseTab.enabled);
  const showcaseTabAvailableAgents =
    drawerShowcaseTab && canEditShowcaseTab
      ? filterAgentsForMarketCategory(onlineAgentOptions, drawerShowcaseTab.tabKey as never, {
          onlineOnly: true,
        }).filter((agent) => !drawerShowcaseTab.agents.some((card) => card.agentId === agent.slug))
      : [];

  return (
    <div className="space-y-5">
      <AdminPageHeader title="首页配置" />

      {message ? <p className="text-xs text-rose-600">{message}</p> : null}
      {persisting ? <p className="text-xs text-black/40">正在保存…</p> : null}

      <div className="flex flex-wrap gap-2">
        {CONFIG_TABS.map((item) => (
          <button key={item.id} type="button" onClick={() => setTab(item.id)} className={adminTabClass(tab === item.id)}>
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'hero' ? (
        <AdminCard>
          <AdminTable
            rows={config.heroAds}
            empty="暂无广告位"
            columns={[
              { key: 'name', label: '广告位' },
              {
                key: 'media',
                label: '预览',
                render: (row) => {
                  const url = (row.media as { url?: string } | undefined)?.url;
                  if (!url) return <span className="text-black/35">未上传</span>;
                  return (
                    <div
                      className="w-20 rounded overflow-hidden bg-[#f5f5f5] border border-[#eee]"
                      style={{ aspectRatio: String(getHeroAdAspectRatio(row)) }}
                    >
                      <img src={url} alt="" className="w-full h-full object-cover" />
                    </div>
                  );
                },
              },
              {
                key: 'primaryButton',
                label: '点击动作',
                render: (row) => String((row.primaryButton as { action?: string })?.action ?? '—'),
              },
              {
                key: 'id',
                label: '操作',
                render: (row) => (
                  <button
                    type="button"
                    className={adminLinkClass}
                    onClick={() => setDrawer({ kind: 'hero', id: String(row.id) })}
                  >
                    编辑
                  </button>
                ),
              },
            ]}
          />
        </AdminCard>
      ) : null}

      {SHOW_AGENT_RECOMMEND_TAB && tab === 'recommend' ? (
        <AdminCard>
          <div className="px-4 py-3 border-b border-[#f0f0f0] flex items-center justify-between">
            <span className="text-sm font-semibold">推荐位列表</span>
            <button
              type="button"
              className={adminLinkClass}
              onClick={() => {
                const item: HomeAgentRecommendationConfig = {
                  id: newId('rec'),
                  enabled: true,
                  sortOrder: config.agentRecommendations.length,
                  agentId: 'geo',
                  title: '新推荐',
                  description: '',
                  status: 'open',
                  cta: { label: '使用智能体', action: 'use_agent' },
                };
                setConfig({ ...config, agentRecommendations: [...config.agentRecommendations, item] });
                setDrawer({ kind: 'recommend', id: item.id });
              }}
            >
              新增
            </button>
          </div>
          <AdminTable
            rows={config.agentRecommendations}
            empty="暂无推荐位"
            columns={[
              {
                key: 'agentId',
                label: '智能体',
                render: (row) => resolveHomeAgentMeta(String(row.agentId))?.name ?? String(row.agentId),
              },
              {
                key: 'title',
                label: '标题',
                render: (row) => (
                  <input
                    className={`${adminInputClass} min-w-[120px] max-w-[180px] text-xs py-1.5`}
                    value={String(row.title ?? '')}
                    maxLength={HOME_RECOMMEND_TITLE_MAX}
                    placeholder="最多 20 字"
                    onChange={(e) =>
                      updateRec(String(row.id), {
                        title: clampHomeRecommendText(e.target.value, HOME_RECOMMEND_TITLE_MAX),
                      })
                    }
                  />
                ),
              },
              {
                key: 'description',
                label: '简介',
                render: (row) => (
                  <input
                    className={`${adminInputClass} min-w-[140px] max-w-[220px] text-xs py-1.5`}
                    value={String(row.description ?? '')}
                    maxLength={HOME_RECOMMEND_DESC_MAX}
                    placeholder="最多 20 字"
                    onChange={(e) =>
                      updateRec(String(row.id), {
                        description: clampHomeRecommendText(e.target.value, HOME_RECOMMEND_DESC_MAX),
                      })
                    }
                  />
                ),
              },
              { key: 'badge', label: '标签' },
              {
                key: 'id',
                label: '操作',
                render: (row) => {
                  const id = String(row.id);
                  const enabled = Boolean(row.enabled);
                  return (
                    <div className="flex items-center gap-3 whitespace-nowrap">
                      <button
                        type="button"
                        className={adminLinkClass}
                        onClick={() => setDrawer({ kind: 'recommend', id })}
                      >
                        编辑
                      </button>
                      {enabled ? (
                        <button
                          type="button"
                          className="text-xs text-rose-700 hover:underline"
                          onClick={() => updateRec(id, { enabled: false })}
                        >
                          下架
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="text-xs text-emerald-700 hover:underline"
                          onClick={() => updateRec(id, { enabled: true })}
                        >
                          上架
                        </button>
                      )}
                    </div>
                  );
                },
              },
            ]}
          />
        </AdminCard>
      ) : null}

      {tab === 'showcase' ? (
        <div className="space-y-4">
          <AdminCard>
            <div className="px-4 py-3 border-b border-[#f0f0f0]">
              <p className="text-sm font-semibold">标签管理</p>
              <p className="text-xs text-black/45 mt-1">
                标签与智能体市场页分类一致，不可新增或改名；需先下架才能编辑。标签内仅可选择已上架且属于该分类的智能体。
              </p>
              {onlineAgentOptions.length === 0 ? (
                <p className="text-xs text-amber-700 mt-2">
                  当前没有已上架智能体，请先在「智能体管理」中上架后再配置标签。
                </p>
              ) : null}
            </div>
            <div className="px-4 py-3 border-b border-[#f0f0f0]">
              <span className="text-sm font-medium text-black/70">标签列表</span>
            </div>
            <AdminTable
              rows={config.agentShowcase.tabs}
              empty="暂无标签"
              columns={[
                { key: 'tabLabel', label: '标签名称' },
                {
                  key: 'enabled',
                  label: '状态',
                  render: (row) => (row.enabled ? '已上架' : '已下架'),
                },
                {
                  key: 'agents',
                  label: '已选智能体',
                  render: (row) => {
                    const cards = (row.agents as HomeAgentShowcaseCard[] | undefined) ?? [];
                    const visible = cards.filter((card) => card.visible && card.agentId?.trim());
                    return String(visible.length);
                  },
                },
                {
                  key: 'id',
                  label: '操作',
                  render: (row) => {
                    const id = String(row.id);
                    const enabled = Boolean(row.enabled);
                    return (
                      <div className="flex items-center gap-3 whitespace-nowrap">
                        {enabled ? (
                          <button
                            type="button"
                            className="text-xs text-rose-700 hover:underline"
                            onClick={() => shelfShowcaseTab(id)}
                          >
                            下架
                          </button>
                        ) : (
                          <>
                            <button
                              type="button"
                              className={adminLinkClass}
                              onClick={() => openShowcaseTabDrawer(id)}
                            >
                              编辑
                            </button>
                            <button
                              type="button"
                              className="text-xs text-emerald-700 hover:underline"
                              onClick={() => onlineShowcaseTab(id)}
                            >
                              上架
                            </button>
                          </>
                        )}
                      </div>
                    );
                  },
                },
              ]}
            />
          </AdminCard>
        </div>
      ) : null}

      <AdminDrawer
        open={drawer?.kind === 'hero' && Boolean(drawerHero)}
        title={drawerHero?.name || '编辑首屏广告'}
        desc={drawerHero ? `固定比例 · ${getHeroAdImageSizeHint(drawerHero)}` : undefined}
        onClose={() => setDrawer(null)}
        widthClass="max-w-xl"
      >
        {drawerHero && drawer?.kind === 'hero' ? (
          <div className="space-y-4">
            <div
              className="w-full rounded-xl overflow-hidden bg-[#f5f5f5] border border-[#eee] flex items-center justify-center"
              style={{ aspectRatio: String(getHeroAdAspectRatio(drawerHero)) }}
            >
              {drawerHero.media?.url ? (
                <img src={drawerHero.media.url} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs text-black/35">请上传 {getHeroAdImageSizeHint(drawerHero)} 图片</span>
              )}
            </div>

            <label className="block space-y-1">
              <span className="text-xs text-black/50">广告图片 *</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                disabled={heroImageUploading}
                className="text-sm"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setHeroImageUploading(true);
                  void uploadTaskFile(file)
                    .then((uploaded) => {
                      updateHero(drawer.id, {
                        media: { type: 'image', url: uploaded.url },
                      });
                    })
                    .catch((error) => {
                      setMessage(error instanceof Error ? error.message : '图片上传失败');
                    })
                    .finally(() => setHeroImageUploading(false));
                }}
              />
              <p className="text-[11px] text-black/40">
                {heroImageUploading ? '上传中…' : `建议 ${getHeroAdImageSizeHint(drawerHero)}`}
              </p>
            </label>

            <label className="block space-y-1">
              <span className="text-xs text-black/50">点击动作</span>
              <select
                className={adminInputClass}
                value={drawerHero.primaryButton.action}
                onChange={(e) =>
                  updateHero(drawer.id, {
                    primaryButton: { ...drawerHero.primaryButton, action: e.target.value as HomeButtonAction },
                  })
                }
              >
                {BUTTON_ACTIONS.map((action) => (
                  <option key={action} value={action}>
                    {action}
                  </option>
                ))}
              </select>
            </label>

            {drawerHero.primaryButton.action === 'use_agent' ? (
              <label className="block space-y-1">
                <span className="text-xs text-black/50">关联智能体 ID</span>
                <input
                  className={adminInputClass}
                  value={drawerHero.primaryButton.agentId ?? ''}
                  onChange={(e) =>
                    updateHero(drawer.id, { primaryButton: { ...drawerHero.primaryButton, agentId: e.target.value } })
                  }
                />
              </label>
            ) : null}

            {drawerHero.primaryButton.action === 'open_url' ? (
              <label className="block space-y-1">
                <span className="text-xs text-black/50">跳转链接</span>
                <input
                  className={adminInputClass}
                  value={drawerHero.primaryButton.target ?? ''}
                  onChange={(e) =>
                    updateHero(drawer.id, { primaryButton: { ...drawerHero.primaryButton, target: e.target.value } })
                  }
                  placeholder="https://"
                />
              </label>
            ) : null}

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={drawerHero.enabled}
                onChange={(e) => updateHero(drawer.id, { enabled: e.target.checked })}
              />
              启用此广告位
            </label>
          </div>
        ) : null}
      </AdminDrawer>

      <AdminDrawer
        open={drawer?.kind === 'recommend' && Boolean(drawerRec)}
        title={resolveHomeAgentMeta(drawerRec?.agentId ?? '')?.name || '编辑推荐位'}
        desc={drawerRec?.badge || '智能体推荐位'}
        onClose={() => setDrawer(null)}
        widthClass="max-w-xl"
      >
        {drawerRec && drawer?.kind === 'recommend' ? (
          <div className="space-y-3">
            <label className="block space-y-1">
              <span className="text-xs text-black/50">关联智能体</span>
              <select
                className={adminInputClass}
                value={drawerRec.agentId}
                onChange={(e) => updateRec(drawer.id, { agentId: e.target.value })}
              >
                {agentOptions.map((agent) => (
                  <option key={agent.agentId} value={agent.agentId}>
                    {agent.name} ({agent.agentId})
                  </option>
                ))}
              </select>
            </label>
            {resolveHomeAgentMeta(drawerRec.agentId) ? (
              <div className="rounded-lg border border-[#f0f0f0] bg-[#fafafa] p-3 text-xs text-black/55 space-y-1">
                <p className="font-medium text-black/70">智能体资料（只读，来自智能体管理）</p>
                <p>名称：{resolveHomeAgentMeta(drawerRec.agentId)?.name}</p>
                <p>简介：{resolveHomeAgentMeta(drawerRec.agentId)?.description}</p>
              </div>
            ) : null}
            <label className="block space-y-1">
              <span className="text-xs text-black/50">展示标题（最多 {HOME_RECOMMEND_TITLE_MAX} 字）</span>
              <input
                className={adminInputClass}
                value={drawerRec.title}
                maxLength={HOME_RECOMMEND_TITLE_MAX}
                onChange={(e) =>
                  updateRec(drawer.id, {
                    title: clampHomeRecommendText(e.target.value, HOME_RECOMMEND_TITLE_MAX),
                  })
                }
              />
            </label>
            <label className="block space-y-1">
              <span className="text-xs text-black/50">展示简介（最多 {HOME_RECOMMEND_DESC_MAX} 字）</span>
              <input
                className={adminInputClass}
                value={drawerRec.description}
                maxLength={HOME_RECOMMEND_DESC_MAX}
                onChange={(e) =>
                  updateRec(drawer.id, {
                    description: clampHomeRecommendText(e.target.value, HOME_RECOMMEND_DESC_MAX),
                  })
                }
              />
            </label>
            <label className="block space-y-1">
              <span className="text-xs text-black/50">推荐标签</span>
              <input
                className={adminInputClass}
                value={String(drawerRec.badge ?? '')}
                onChange={(e) => updateRec(drawer.id, { badge: e.target.value })}
              />
            </label>
            <label className="block space-y-1">
              <span className="text-xs text-black/50">展示状态</span>
              <select
                className={adminInputClass}
                value={drawerRec.status}
                onChange={(e) =>
                  updateRec(drawer.id, { status: e.target.value as HomeAgentRecommendationConfig['status'] })
                }
              >
                {['open', 'coming_soon', 'beta', 'hidden'].map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
          </div>
        ) : null}
      </AdminDrawer>

      <AdminDrawer
        open={drawer?.kind === 'showcase-tab' && Boolean(drawerShowcaseTab) && canEditShowcaseTab}
        title={drawerShowcaseTab?.tabLabel || '编辑标签'}
        desc="从已上架智能体中选择本标签要展示的智能体"
        onClose={() => setDrawer(null)}
        widthClass="max-w-2xl"
      >
        {drawerShowcaseTab && drawer?.kind === 'showcase-tab' && canEditShowcaseTab ? (
          <div className="space-y-5">
            <div className="space-y-3">
              <div className="block space-y-1">
                <span className="text-xs text-black/50">标签名称</span>
                <p className="text-sm font-medium text-black/80">{drawerShowcaseTab.tabLabel}</p>
              </div>
            </div>

            <div className="border-t border-[#f0f0f0] pt-4 space-y-3">
              <div>
                <h3 className="text-sm font-semibold">已选智能体</h3>
                <p className="text-[11px] text-black/40 mt-0.5">从下拉框选择即可添加，列表内可直接修改</p>
              </div>
              <label className="block space-y-1">
                <span className="text-xs text-black/50">添加智能体</span>
                <select
                  className={adminInputClass}
                  value=""
                  disabled={showcaseTabAvailableAgents.length === 0}
                  onChange={(e) => {
                    const slug = e.target.value;
                    if (!slug || drawer?.kind !== 'showcase-tab') return;
                    addAgentToShowcaseTab(drawer.id, slug);
                  }}
                >
                  <option value="">
                    {showcaseTabAvailableAgents.length === 0
                      ? onlineAgentOptions.length === 0
                        ? '暂无已上架智能体'
                        : '已添加该分类下全部已上架智能体'
                      : '选择智能体…'}
                  </option>
                  {showcaseTabAvailableAgents.map((agent) => (
                    <option key={agent.slug} value={agent.slug}>
                      {agent.name}
                    </option>
                  ))}
                </select>
              </label>
              <AdminTable
                rows={drawerShowcaseTab.agents}
                empty="暂未选择智能体"
                columns={[
                  {
                    key: 'agentId',
                    label: '智能体',
                    render: (row) => {
                      const meta = showcaseAgentMeta(String(row.agentId), onlineAgents);
                      const online = onlineAgents.some(
                        (agent) => agent.slug === row.agentId && agent.status === 'online',
                      );
                      return (
                        <span className={online ? '' : 'text-rose-600'}>
                          {meta?.name ?? String(row.agentId)}
                          {!online ? ' · 未上架' : ''}
                        </span>
                      );
                    },
                  },
                  {
                    key: 'buttonLabel',
                    label: '按钮文案',
                    render: (row) => (
                      <input
                        className={`${adminInputClass} min-w-[100px] text-xs py-1.5`}
                        value={String(row.buttonLabel ?? '')}
                        onChange={(e) =>
                          drawer?.kind === 'showcase-tab' &&
                          updateShowcaseCard(drawer.id, String(row.id), { buttonLabel: e.target.value })
                        }
                      />
                    ),
                  },
                  {
                    key: 'sortOrder',
                    label: '排序',
                    render: (row) => (
                      <input
                        className={`${adminInputClass} w-16 text-xs py-1.5`}
                        type="number"
                        value={Number(row.sortOrder ?? 0)}
                        onChange={(e) =>
                          drawer?.kind === 'showcase-tab' &&
                          updateShowcaseCard(drawer.id, String(row.id), {
                            sortOrder: Number(e.target.value) || 0,
                          })
                        }
                      />
                    ),
                  },
                  {
                    key: 'visible',
                    label: '展示',
                    render: (row) => (
                      <input
                        type="checkbox"
                        checked={Boolean(row.visible)}
                        onChange={(e) =>
                          drawer?.kind === 'showcase-tab' &&
                          updateShowcaseCard(drawer.id, String(row.id), { visible: e.target.checked })
                        }
                      />
                    ),
                  },
                  {
                    key: 'id',
                    label: '操作',
                    render: (row) => (
                      <button
                        type="button"
                        className="text-xs text-rose-700 hover:underline"
                        onClick={() =>
                          drawer?.kind === 'showcase-tab' &&
                          removeShowcaseCard(drawer.id, String(row.id))
                        }
                      >
                        移除
                      </button>
                    ),
                  },
                ]}
              />
            </div>
          </div>
        ) : null}
      </AdminDrawer>
    </div>
  );
}
