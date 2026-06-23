import { useCallback, useEffect, useMemo, useState } from 'react';
import { adminApi } from '../../lib/adminApi';
import { getDefaultHomePageConfig } from '../../lib/homePageConfigDefaults';
import { normalizeHomePageConfigPayload } from '../../lib/homePageConfigNormalize';
import { uploadTaskFile } from '../../lib/taskApi';
import { getHeroAdAspectRatio, getHeroAdImageSizeHint } from '../../lib/homeHeroAds';
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
  adminBtnPrimaryClass,
  adminInputClass,
  adminLinkClass,
  adminTabClass,
} from '../../components/admin/AdminUi';
import type {
  AdminHomeConfigState,
  HomeAgentRecommendationConfig,
  HomeAgentShowcaseCard,
  HomeAgentShowcaseTab,
  HomeButtonAction,
  HomeHeroAdConfig,
  HomePageConfigPayload,
} from '../../types/homePageConfig';

type ConfigTab = 'hero' | 'recommend' | 'showcase' | 'publish';

/** 智能体推荐位后台暂未开放，隐藏对应 Tab */
const SHOW_AGENT_RECOMMEND_TAB = false;

type HomeConfigDrawer =
  | { kind: 'hero'; id: string }
  | { kind: 'recommend'; id: string }
  | { kind: 'showcase-tab'; id: string }
  | { kind: 'showcase-card'; tabId: string; cardId: string };

const CONFIG_TABS: Array<{ id: ConfigTab; label: string }> = [
  { id: 'hero', label: '首屏图片广告' },
  ...(SHOW_AGENT_RECOMMEND_TAB ? [{ id: 'recommend' as const, label: '智能体推荐位' }] : []),
  { id: 'showcase', label: '智能体展示页' },
  { id: 'publish', label: '发布记录' },
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

export default function AdminHomeConfigPage() {
  const [tab, setTab] = useState<ConfigTab>('hero');
  const [meta, setMeta] = useState<AdminHomeConfigState | null>(null);
  const [config, setConfig] = useState<HomePageConfigPayload>(() => getDefaultHomePageConfig());
  const [publishRows, setPublishRows] = useState<Array<Record<string, unknown>>>([]);
  const [drawer, setDrawer] = useState<HomeConfigDrawer | null>(null);
  const [loading, setLoading] = useState(true);
  const agentOptions = useMemo(() => listHomeAgentOptions(), []);
  const [message, setMessage] = useState('');
  const [heroImageUploading, setHeroImageUploading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setMessage('');
    try {
      const data = await adminApi.homeConfig();
      const nextConfig = normalizeHomePageConfigPayload(data.config);
      setMeta(data);
      setConfig(nextConfig);
    } catch (error) {
      setConfig(getDefaultHomePageConfig());
      setMessage(
        error instanceof Error
          ? `${error.message}（已加载本地默认配置，请确认管理员已登录）`
          : '加载失败，已使用本地默认配置',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const loadPublishRecords = useCallback(async () => {
    try {
      setPublishRows(await adminApi.homePublishRecords());
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '加载发布记录失败');
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
    if (tab === 'publish') void loadPublishRecords();
  }, [tab, loadPublishRecords]);

  const saveDraft = async () => {
    if (!config) return;
    setLoading(true);
    setMessage('');
    try {
      const saved = await adminApi.saveHomeConfig({ draftId: meta?.draftId, config });
      setMeta((prev) =>
        prev
          ? {
              ...prev,
              draftId: saved.draftId,
              status: 'draft',
              version: saved.version,
              updatedAt: saved.updatedAt,
              config,
            }
          : null,
      );
      setMessage('草稿已保存');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '保存失败');
    } finally {
      setLoading(false);
    }
  };

  const publish = async () => {
    if (!meta?.draftId) {
      await saveDraft();
    }
    const draftId = meta?.draftId;
    if (!draftId && !config) return;

    setLoading(true);
    setMessage('');
    try {
      let id = draftId;
      if (!id) {
        const saved = await adminApi.saveHomeConfig({ draftId: null, config: config! });
        id = saved.draftId;
        setMeta((prev) => (prev ? { ...prev, draftId: id } : null));
      }
      await adminApi.publishHomeConfig(id!);
      setMessage('发布成功');
      await load();
      if (tab === 'publish') await loadPublishRecords();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '发布失败');
    } finally {
      setLoading(false);
    }
  };

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
    drawer?.kind === 'showcase-tab' || drawer?.kind === 'showcase-card'
      ? (config.agentShowcase.tabs.find((item) => item.id === (drawer.kind === 'showcase-tab' ? drawer.id : drawer.tabId)) ??
        null)
      : null;
  const drawerShowcaseCard =
    drawer?.kind === 'showcase-card' && drawerShowcaseTab
      ? (drawerShowcaseTab.agents?.find((item) => item.id === drawer.cardId) ?? null)
      : null;

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="首页配置"
        desc="配置首屏广告与智能体展示页内容，保存草稿后发布生效"
        action={
          <div className="flex items-center gap-2">
            <a href="/welcome" target="_blank" rel="noreferrer" className={adminLinkClass}>
              预览前台
            </a>
            <button type="button" disabled={loading} onClick={() => void saveDraft()} className={adminBtnPrimaryClass}>
              保存草稿
            </button>
            <button type="button" disabled={loading} onClick={() => void publish()} className={adminBtnPrimaryClass}>
              发布
            </button>
          </div>
        }
      />

      {message ? <p className="text-xs text-rose-600">{message}</p> : null}

      <div className="flex flex-wrap gap-2">
        {CONFIG_TABS.map((item) => (
          <button key={item.id} type="button" onClick={() => setTab(item.id)} className={adminTabClass(tab === item.id)}>
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'hero' ? (
        <AdminCard>
          <div className="px-4 py-3 border-b border-[#f0f0f0]">
            <p className="text-sm font-semibold">首屏图片广告位（固定 4 个）</p>
            <p className="text-xs text-black/45 mt-1">
              广告位 1 为 16:9 主 Banner，广告位 2–4 为 1:1 方图。仅展示已启用且已上传图片的广告位。
            </p>
          </div>
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
          <AdminCard className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="block space-y-1">
              <span className="text-xs text-black/50">模块标题</span>
              <input
                className={adminInputClass}
                value={config.agentShowcase.title}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    agentShowcase: { ...config.agentShowcase, title: e.target.value },
                  })
                }
              />
            </label>
            <label className="block space-y-1">
              <span className="text-xs text-black/50">默认标签（tabKey）</span>
              <input
                className={adminInputClass}
                value={config.agentShowcase.defaultTabKey}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    agentShowcase: { ...config.agentShowcase, defaultTabKey: e.target.value },
                  })
                }
              />
            </label>
            <label className="block space-y-1 md:col-span-2">
              <span className="text-xs text-black/50">模块副标题</span>
              <input
                className={adminInputClass}
                value={config.agentShowcase.subtitle}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    agentShowcase: { ...config.agentShowcase, subtitle: e.target.value },
                  })
                }
              />
            </label>
            <label className="block space-y-1 md:col-span-2">
              <span className="text-xs text-black/50">卡片默认按钮文案</span>
              <input
                className={adminInputClass}
                value={config.agentShowcase.defaultButtonLabel ?? ''}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    agentShowcase: { ...config.agentShowcase, defaultButtonLabel: e.target.value },
                  })
                }
              />
            </label>
            <label className="block space-y-1 md:col-span-2">
              <span className="text-xs text-black/50">底部说明</span>
              <input
                className={adminInputClass}
                value={config.agentShowcase.footerText ?? ''}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    agentShowcase: { ...config.agentShowcase, footerText: e.target.value },
                  })
                }
              />
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={config.agentShowcase.enabled}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    agentShowcase: { ...config.agentShowcase, enabled: e.target.checked },
                  })
                }
              />
              启用展示页模块
            </label>
          </AdminCard>

          <AdminCard>
            <div className="px-4 py-3 border-b border-[#f0f0f0] flex items-center justify-between">
              <span className="text-sm font-semibold">标签列表</span>
              <button
                type="button"
                className={adminLinkClass}
                onClick={() => {
                  const item: HomeAgentShowcaseTab = {
                    id: newId('tab'),
                    tabLabel: '新标签',
                    tabKey: `tab-${config.agentShowcase.tabs.length}`,
                    enabled: true,
                    sortOrder: config.agentShowcase.tabs.length,
                    agents: [],
                  };
                  setConfig({
                    ...config,
                    agentShowcase: {
                      ...config.agentShowcase,
                      tabs: [...config.agentShowcase.tabs, item],
                    },
                  });
                  setDrawer({ kind: 'showcase-tab', id: item.id });
                }}
              >
                新增标签
              </button>
            </div>
            <AdminTable
              rows={config.agentShowcase.tabs}
              empty="暂无标签"
              columns={[
                { key: 'tabLabel', label: '标签' },
                { key: 'tabKey', label: '编码' },
                {
                  key: 'agents',
                  label: '卡片数',
                  render: (row) => String((row.agents as HomeAgentShowcaseCard[] | undefined)?.length ?? 0),
                },
                {
                  key: 'id',
                  label: '操作',
                  render: (row) => (
                    <button
                      type="button"
                      className={adminLinkClass}
                      onClick={() => setDrawer({ kind: 'showcase-tab', id: String(row.id) })}
                    >
                      编辑
                    </button>
                  ),
                },
              ]}
            />
          </AdminCard>
        </div>
      ) : null}

      {tab === 'publish' ? (
        <AdminCard>
          <AdminTable
            rows={publishRows}
            empty="暂无发布记录"
            columns={[
              { key: 'title', label: '配置' },
              { key: 'version', label: '版本' },
              { key: 'publishedBy', label: '发布人' },
              {
                key: 'createdAt',
                label: '发布时间',
                render: (row) => (row.createdAt ? new Date(String(row.createdAt)).toLocaleString() : '—'),
              },
            ]}
          />
        </AdminCard>
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
        open={drawer?.kind === 'showcase-tab' && Boolean(drawerShowcaseTab)}
        title={drawerShowcaseTab?.tabLabel || '编辑标签'}
        desc={`标签编码：${drawerShowcaseTab?.tabKey ?? '—'}`}
        onClose={() => setDrawer(null)}
        widthClass="max-w-2xl"
      >
        {drawerShowcaseTab && drawer?.kind === 'showcase-tab' ? (
          <div className="space-y-5">
            <div className="space-y-3">
              {[
                ['tabLabel', '标签名称'],
                ['tabKey', '标签编码'],
              ].map(([key, label]) => (
                <label key={key} className="block space-y-1">
                  <span className="text-xs text-black/50">{label}</span>
                  <input
                    className={adminInputClass}
                    value={String(drawerShowcaseTab[key as keyof HomeAgentShowcaseTab] ?? '')}
                    onChange={(e) =>
                      updateShowcaseTab(drawer.id, { [key]: e.target.value } as Partial<HomeAgentShowcaseTab>)
                    }
                  />
                </label>
              ))}
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={drawerShowcaseTab.enabled}
                  onChange={(e) => updateShowcaseTab(drawer.id, { enabled: e.target.checked })}
                />
                启用此标签
              </label>
            </div>

            <div className="border-t border-[#f0f0f0] pt-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold">智能体卡片</h3>
                <button
                  type="button"
                  className={adminLinkClass}
                  onClick={() => {
                    const card: HomeAgentShowcaseCard = {
                      id: newId('card'),
                      agentId: agentOptions[0]?.agentId ?? 'geo',
                      buttonLabel: config.agentShowcase.defaultButtonLabel || '使用智能体',
                      visible: true,
                      sortOrder: drawerShowcaseTab.agents.length,
                    };
                    updateShowcaseTab(drawer.id, { agents: [...drawerShowcaseTab.agents, card] });
                    setDrawer({ kind: 'showcase-card', tabId: drawer.id, cardId: card.id });
                  }}
                >
                  添加卡片
                </button>
              </div>
              <AdminTable
                rows={drawerShowcaseTab.agents}
                empty="暂无智能体卡片"
                columns={[
                  {
                    key: 'agentId',
                    label: '智能体',
                    render: (row) => {
                      const agentMeta = resolveHomeAgentMeta(String(row.agentId));
                      return agentMeta ? `${agentMeta.name} (${row.agentId})` : String(row.agentId);
                    },
                  },
                  {
                    key: 'visible',
                    label: '展示',
                    render: (row) => (row.visible ? '是' : '隐藏'),
                  },
                  { key: 'sortOrder', label: '排序' },
                  {
                    key: 'id',
                    label: '操作',
                    render: (row) => (
                      <button
                        type="button"
                        className={adminLinkClass}
                        onClick={() =>
                          setDrawer({ kind: 'showcase-card', tabId: drawer.id, cardId: String(row.id) })
                        }
                      >
                        编辑
                      </button>
                    ),
                  },
                ]}
              />
            </div>
          </div>
        ) : null}
      </AdminDrawer>

      <AdminDrawer
        open={drawer?.kind === 'showcase-card' && Boolean(drawerShowcaseCard)}
        title={resolveHomeAgentMeta(drawerShowcaseCard?.agentId ?? '')?.name || '编辑卡片'}
        desc={drawerShowcaseTab ? `标签：${drawerShowcaseTab.tabLabel}` : undefined}
        onClose={() =>
          setDrawer(
            drawer?.kind === 'showcase-card' ? { kind: 'showcase-tab', id: drawer.tabId } : null,
          )
        }
        widthClass="max-w-xl"
      >
        {drawerShowcaseCard && drawer?.kind === 'showcase-card' ? (
          <div className="space-y-3">
            <label className="block space-y-1">
              <span className="text-xs text-black/50">关联智能体</span>
              <select
                className={adminInputClass}
                value={drawerShowcaseCard.agentId}
                onChange={(e) => updateShowcaseCard(drawer.tabId, drawer.cardId, { agentId: e.target.value })}
              >
                {agentOptions.map((agent) => (
                  <option key={agent.agentId} value={agent.agentId}>
                    {agent.name} ({agent.agentId})
                  </option>
                ))}
              </select>
            </label>
            {resolveHomeAgentMeta(drawerShowcaseCard.agentId) ? (
              <div className="rounded-lg border border-[#f0f0f0] bg-[#fafafa] p-3 text-xs text-black/55 space-y-1">
                <p className="font-medium text-black/70">智能体资料（只读）</p>
                <p>名称：{resolveHomeAgentMeta(drawerShowcaseCard.agentId)?.name}</p>
                <p>简介：{resolveHomeAgentMeta(drawerShowcaseCard.agentId)?.description}</p>
              </div>
            ) : null}
            <label className="block space-y-1">
              <span className="text-xs text-black/50">按钮文案</span>
              <input
                className={adminInputClass}
                value={drawerShowcaseCard.buttonLabel}
                onChange={(e) =>
                  updateShowcaseCard(drawer.tabId, drawer.cardId, { buttonLabel: e.target.value })
                }
              />
            </label>
            <label className="block space-y-1">
              <span className="text-xs text-black/50">排序</span>
              <input
                className={adminInputClass}
                type="number"
                value={drawerShowcaseCard.sortOrder}
                onChange={(e) =>
                  updateShowcaseCard(drawer.tabId, drawer.cardId, {
                    sortOrder: Number(e.target.value) || 0,
                  })
                }
              />
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={drawerShowcaseCard.visible}
                onChange={(e) =>
                  updateShowcaseCard(drawer.tabId, drawer.cardId, { visible: e.target.checked })
                }
              />
              展示此卡片
            </label>
          </div>
        ) : null}
      </AdminDrawer>
    </div>
  );
}
