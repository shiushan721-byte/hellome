import { useCallback, useEffect, useState } from 'react';
import { adminApi } from '../../lib/adminApi';
import { getDefaultHomePageConfig } from '../../lib/homePageConfigDefaults';
import {
  AdminCard,
  AdminPageHeader,
  AdminTable,
  StatusBadge,
  adminBtnPrimaryClass,
  adminInputClass,
  adminLinkClass,
  adminTabClass,
} from '../../components/admin/AdminUi';
import type {
  AdminHomeConfigState,
  HomeAgentRecommendationConfig,
  HomeAgentShowcaseTab,
  HomeButtonAction,
  HomeHeroAdConfig,
  HomePageConfigPayload,
} from '../../types/homePageConfig';

type ConfigTab = 'hero' | 'recommend' | 'showcase' | 'publish';

const CONFIG_TABS: Array<{ id: ConfigTab; label: string }> = [
  { id: 'hero', label: '首页广告位' },
  { id: 'recommend', label: '智能体推荐位' },
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
  const [selectedHeroId, setSelectedHeroId] = useState<string | null>(null);
  const [selectedRecId, setSelectedRecId] = useState<string | null>(null);
  const [selectedTabId, setSelectedTabId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setMessage('');
    try {
      const data = await adminApi.homeConfig();
      setMeta(data);
      setConfig(data.config ?? getDefaultHomePageConfig());
      setSelectedHeroId((prev) => prev ?? data.config.heroAds[0]?.id ?? null);
      setSelectedRecId((prev) => prev ?? data.config.agentRecommendations[0]?.id ?? null);
      setSelectedTabId((prev) => prev ?? data.config.agentShowcase.tabs[0]?.id ?? null);
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

  if (loading && !meta) {
    return <p className="text-sm text-black/50 p-6">加载中…</p>;
  }

  const selectedHero = config.heroAds.find((item) => item.id === selectedHeroId) ?? config.heroAds[0] ?? null;
  const selectedRec = config.agentRecommendations.find((item) => item.id === selectedRecId) ?? config.agentRecommendations[0] ?? null;
  const selectedShowcaseTab = config.agentShowcase.tabs.find((item) => item.id === selectedTabId) ?? config.agentShowcase.tabs[0] ?? null;

  const updateHero = (patch: Partial<HomeHeroAdConfig>) => {
    if (!selectedHeroId) return;
    setConfig((prev) =>
      prev
        ? {
            ...prev,
            heroAds: prev.heroAds.map((item) => (item.id === selectedHeroId ? { ...item, ...patch } : item)),
          }
        : prev,
    );
  };

  const updateRec = (patch: Partial<HomeAgentRecommendationConfig>) => {
    if (!selectedRecId) return;
    setConfig((prev) =>
      prev
        ? {
            ...prev,
            agentRecommendations: prev.agentRecommendations.map((item) =>
              item.id === selectedRecId ? { ...item, ...patch } : item,
            ),
          }
        : prev,
    );
  };

  const updateShowcaseTab = (patch: Partial<HomeAgentShowcaseTab>) => {
    if (!selectedTabId) return;
    setConfig((prev) =>
      prev
        ? {
            ...prev,
            agentShowcase: {
              ...prev.agentShowcase,
              tabs: prev.agentShowcase.tabs.map((item) =>
                item.id === selectedTabId ? { ...item, ...patch } : item,
              ),
            },
          }
        : prev,
    );
  };

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="首页配置"
        desc="配置首屏广告、智能体推荐与展示页内容，保存草稿后发布生效"
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

      <div className="flex items-center gap-2 text-xs text-black/45">
        <span>状态：{meta?.status ?? 'default'}</span>
        <span>·</span>
        <span>版本：{meta?.version ?? 0}</span>
        {meta?.publishedVersion ? <span>（已发布 v{meta.publishedVersion}）</span> : null}
      </div>

      {message ? <p className="text-xs text-rose-600">{message}</p> : null}

      <div className="flex flex-wrap gap-2">
        {CONFIG_TABS.map((item) => (
          <button key={item.id} type="button" onClick={() => setTab(item.id)} className={adminTabClass(tab === item.id)}>
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'hero' ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <AdminCard>
            <div className="px-4 py-3 border-b border-[#f0f0f0] flex items-center justify-between">
              <span className="text-sm font-semibold">广告列表</span>
              <button
                type="button"
                className={adminLinkClass}
                onClick={() => {
                  const ad: HomeHeroAdConfig = {
                    id: newId('hero'),
                    name: '新广告',
                    enabled: true,
                    sortOrder: config.heroAds.length,
                    brandText: 'HelloMe',
                    title: '',
                    subtitle: '',
                    primaryButton: { label: '立即使用', action: 'login' },
                    media: { type: 'none' },
                  };
                  setConfig({ ...config, heroAds: [...config.heroAds, ad] });
                  setSelectedHeroId(ad.id);
                }}
              >
                新增
              </button>
            </div>
            <AdminTable
              rows={config.heroAds}
              empty="暂无广告"
              columns={[
                { key: 'name', label: '名称' },
                { key: 'title', label: '主标题' },
                {
                  key: 'primaryButton',
                  label: '按钮',
                  render: (row) => String((row.primaryButton as { action?: string })?.action ?? '—'),
                },
                {
                  key: 'enabled',
                  label: '状态',
                  render: (row) => <StatusBadge value={row.enabled ? 'enabled' : 'disabled'} />,
                },
                {
                  key: 'id',
                  label: '操作',
                  render: (row) => (
                    <button type="button" className={adminLinkClass} onClick={() => setSelectedHeroId(String(row.id))}>
                      编辑
                    </button>
                  ),
                },
              ]}
            />
          </AdminCard>

          {selectedHero ? (
            <AdminCard className="p-4 space-y-3">
              <h3 className="text-sm font-semibold">编辑广告</h3>
              {[
                ['name', '广告位名称'],
                ['brandText', '品牌文案'],
                ['title', '主标题'],
                ['subtitle', '副标题'],
              ].map(([key, label]) => (
                <label key={key} className="block space-y-1">
                  <span className="text-xs text-black/50">{label}</span>
                  <input
                    className={adminInputClass}
                    value={String(selectedHero[key as keyof HomeHeroAdConfig] ?? '')}
                    onChange={(e) => updateHero({ [key]: e.target.value } as Partial<HomeHeroAdConfig>)}
                  />
                </label>
              ))}
              <label className="block space-y-1">
                <span className="text-xs text-black/50">主按钮文案</span>
                <input
                  className={adminInputClass}
                  value={selectedHero.primaryButton.label}
                  onChange={(e) =>
                    updateHero({ primaryButton: { ...selectedHero.primaryButton, label: e.target.value } })
                  }
                />
              </label>
              <label className="block space-y-1">
                <span className="text-xs text-black/50">主按钮动作</span>
                <select
                  className={adminInputClass}
                  value={selectedHero.primaryButton.action}
                  onChange={(e) =>
                    updateHero({
                      primaryButton: { ...selectedHero.primaryButton, action: e.target.value as HomeButtonAction },
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
              <label className="block space-y-1">
                <span className="text-xs text-black/50">关联智能体 ID</span>
                <input
                  className={adminInputClass}
                  value={selectedHero.primaryButton.agentId ?? ''}
                  onChange={(e) =>
                    updateHero({ primaryButton: { ...selectedHero.primaryButton, agentId: e.target.value } })
                  }
                />
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={selectedHero.enabled}
                  onChange={(e) => updateHero({ enabled: e.target.checked })}
                />
                启用展示
              </label>
            </AdminCard>
          ) : null}
        </div>
      ) : null}

      {tab === 'recommend' ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
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
                  setSelectedRecId(item.id);
                }}
              >
                新增
              </button>
            </div>
            <AdminTable
              rows={config.agentRecommendations}
              empty="暂无推荐位"
              columns={[
                { key: 'title', label: '标题' },
                { key: 'agentId', label: '智能体' },
                { key: 'badge', label: '标签' },
                { key: 'status', label: '状态', render: (row) => <StatusBadge value={String(row.status)} /> },
                {
                  key: 'id',
                  label: '操作',
                  render: (row) => (
                    <button type="button" className={adminLinkClass} onClick={() => setSelectedRecId(String(row.id))}>
                      编辑
                    </button>
                  ),
                },
              ]}
            />
          </AdminCard>

          {selectedRec ? (
            <AdminCard className="p-4 space-y-3">
              <h3 className="text-sm font-semibold">编辑推荐位</h3>
              {[
                ['title', '推荐标题'],
                ['description', '推荐说明'],
                ['agentId', '关联智能体 ID'],
                ['badge', '推荐标签'],
                ['tokenHint', '预计 Token 文案'],
              ].map(([key, label]) => (
                <label key={key} className="block space-y-1">
                  <span className="text-xs text-black/50">{label}</span>
                  <input
                    className={adminInputClass}
                    value={String(selectedRec[key as keyof HomeAgentRecommendationConfig] ?? '')}
                    onChange={(e) => updateRec({ [key]: e.target.value } as Partial<HomeAgentRecommendationConfig>)}
                  />
                </label>
              ))}
              <label className="block space-y-1">
                <span className="text-xs text-black/50">展示状态</span>
                <select
                  className={adminInputClass}
                  value={selectedRec.status}
                  onChange={(e) =>
                    updateRec({ status: e.target.value as HomeAgentRecommendationConfig['status'] })
                  }
                >
                  {['open', 'coming_soon', 'beta', 'hidden'].map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={selectedRec.enabled}
                  onChange={(e) => updateRec({ enabled: e.target.checked })}
                />
                启用展示
              </label>
            </AdminCard>
          ) : null}
        </div>
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
              <span className="text-xs text-black/50">默认标签（agentId）</span>
              <input
                className={adminInputClass}
                value={config.agentShowcase.defaultAgentId}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    agentShowcase: { ...config.agentShowcase, defaultAgentId: e.target.value },
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

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <AdminCard>
              <div className="px-4 py-3 border-b border-[#f0f0f0] flex items-center justify-between">
                <span className="text-sm font-semibold">标签列表</span>
                <button
                  type="button"
                  className={adminLinkClass}
                  onClick={() => {
                    const item: HomeAgentShowcaseTab = {
                      id: newId('tab'),
                      agentId: 'geo',
                      tabLabel: '新标签',
                      name: '新智能体',
                      shortName: '新标签',
                      tagline: '',
                      description: '',
                      coreScenarios: [''],
                      quickTasks: [{ title: '常用任务', action: 'use_agent' }],
                      cta: { label: '立即使用', action: 'use_agent' },
                      enabled: true,
                      sortOrder: config.agentShowcase.tabs.length,
                    };
                    setConfig({
                      ...config,
                      agentShowcase: {
                        ...config.agentShowcase,
                        tabs: [...config.agentShowcase.tabs, item],
                      },
                    });
                    setSelectedTabId(item.id);
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
                  { key: 'agentId', label: '智能体' },
                  { key: 'badge', label: 'Badge' },
                  {
                    key: 'enabled',
                    label: '状态',
                    render: (row) => <StatusBadge value={row.enabled ? 'enabled' : 'disabled'} />,
                  },
                  {
                    key: 'id',
                    label: '操作',
                    render: (row) => (
                      <button type="button" className={adminLinkClass} onClick={() => setSelectedTabId(String(row.id))}>
                        编辑
                      </button>
                    ),
                  },
                ]}
              />
            </AdminCard>

            {selectedShowcaseTab ? (
              <AdminCard className="p-4 space-y-3">
                <h3 className="text-sm font-semibold">编辑标签</h3>
                {[
                  ['tabLabel', '标签名称'],
                  ['name', '展示名称'],
                  ['shortName', '短名称'],
                  ['agentId', '关联智能体 ID'],
                  ['badge', 'Badge'],
                  ['tagline', '一句话定位'],
                ].map(([key, label]) => (
                  <label key={key} className="block space-y-1">
                    <span className="text-xs text-black/50">{label}</span>
                    <input
                      className={adminInputClass}
                      value={String(selectedShowcaseTab[key as keyof HomeAgentShowcaseTab] ?? '')}
                      onChange={(e) =>
                        updateShowcaseTab({ [key]: e.target.value } as Partial<HomeAgentShowcaseTab>)
                      }
                    />
                  </label>
                ))}
                <label className="block space-y-1">
                  <span className="text-xs text-black/50">详情描述</span>
                  <textarea
                    className={`${adminInputClass} min-h-20`}
                    value={selectedShowcaseTab.description}
                    onChange={(e) => updateShowcaseTab({ description: e.target.value })}
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-xs text-black/50">核心执行子模块（每行一条）</span>
                  <textarea
                    className={`${adminInputClass} min-h-20`}
                    value={selectedShowcaseTab.coreScenarios.join('\n')}
                    onChange={(e) =>
                      updateShowcaseTab({
                        coreScenarios: e.target.value.split('\n').map((line) => line.trim()).filter(Boolean),
                      })
                    }
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-xs text-black/50">常用任务（每行一条）</span>
                  <textarea
                    className={`${adminInputClass} min-h-20`}
                    value={selectedShowcaseTab.quickTasks.map((task) => task.title).join('\n')}
                    onChange={(e) =>
                      updateShowcaseTab({
                        quickTasks: e.target.value
                          .split('\n')
                          .map((line) => line.trim())
                          .filter(Boolean)
                          .map((title) => ({ title, action: 'use_agent' as const })),
                      })
                    }
                  />
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={selectedShowcaseTab.enabled}
                    onChange={(e) => updateShowcaseTab({ enabled: e.target.checked })}
                  />
                  启用此标签
                </label>
              </AdminCard>
            ) : null}
          </div>
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
    </div>
  );
}
