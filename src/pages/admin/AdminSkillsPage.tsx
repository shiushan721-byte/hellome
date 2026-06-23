import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { adminApi } from '../../lib/adminApi';
import type { AdminAgentDetail, AdminAgentRecord } from '../../types/adminAgent';
import AdminAgentCreateForm from '../../components/admin/AdminAgentCreateForm';
import AdminAgentDetailPanel, {
  agentDrawerDesc,
  agentDrawerTitle,
} from '../../components/admin/AdminAgentDetailPanel';
import AdminDrawer from '../../components/admin/AdminDrawer';
import {
  AdminCard,
  AdminPageHeader,
  AdminTable,
  StatusBadge,
  adminBtnPrimaryClass,
  adminLinkClass,
} from '../../components/admin/AdminUi';

function agentStatusLabel(status: string) {
  if (status === 'online') return '上架';
  if (status === 'offline') return '下架';
  return status;
}

type DrawerMode = 'create' | 'detail' | null;

type AdminSkillsPageProps = {
  initialDrawer?: 'create' | 'detail';
};

export default function AdminSkillsPage({ initialDrawer }: AdminSkillsPageProps = {}) {
  const navigate = useNavigate();
  const { skillId: routeSkillId } = useParams();
  const [agents, setAgents] = useState<AdminAgentRecord[]>([]);
  const [message, setMessage] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [drawer, setDrawer] = useState<DrawerMode>(null);
  const [detailSlug, setDetailSlug] = useState<string | null>(null);
  const [detailAgent, setDetailAgent] = useState<AdminAgentDetail | null>(null);

  const load = async () => {
    const data = await adminApi.agents();
    setAgents(data);
  };

  useEffect(() => {
    void load().catch((error) => {
      setMessage(error instanceof Error ? error.message : '加载失败');
    });
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawer(null);
    setDetailSlug(null);
    setDetailAgent(null);
    if (window.location.pathname !== '/admin/skills') {
      navigate('/admin/skills', { replace: true });
    }
  }, [navigate]);

  const openCreateDrawer = useCallback(() => {
    setDrawer('create');
    setDetailSlug(null);
    setDetailAgent(null);
    navigate('/admin/skills/new', { replace: true });
  }, [navigate]);

  const openDetailDrawer = useCallback(
    (slug: string) => {
      setDrawer('detail');
      setDetailSlug(slug);
      setDetailAgent(null);
      navigate(`/admin/skills/${slug}`, { replace: true });
    },
    [navigate],
  );

  useEffect(() => {
    if (initialDrawer === 'create' || routeSkillId === 'new') {
      setDrawer('create');
      setDetailSlug(null);
      return;
    }
    if (routeSkillId) {
      setDrawer('detail');
      setDetailSlug(routeSkillId);
      return;
    }
    setDrawer(null);
    setDetailSlug(null);
  }, [initialDrawer, routeSkillId]);

  useEffect(() => {
    if (drawer !== 'detail' || !detailSlug) {
      setDetailAgent(null);
      return;
    }
    void adminApi
      .agent(detailSlug)
      .then(setDetailAgent)
      .catch(() => setDetailAgent(null));
  }, [drawer, detailSlug]);

  const runStatusAction = async (agent: AdminAgentRecord, action: 'online' | 'offline') => {
    if (action === 'online' && !window.confirm('确认上架该智能体？上架后用户可以在前台看到并使用。')) return;
    if (action === 'offline' && !window.confirm('确认下架该智能体？下架后用户将不能发起新任务。')) return;

    setBusyId(agent.id);
    setMessage('');
    try {
      if (action === 'online') await adminApi.agentOnline(agent.id);
      else await adminApi.agentOffline(agent.id);
      setMessage(action === 'online' ? '已上架' : '已下架');
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '操作失败');
    } finally {
      setBusyId(null);
    }
  };

  const handleCreated = (slug: string) => {
    void load();
    openDetailDrawer(slug);
  };

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="智能体管理"
        desc="管理前台可使用的智能体、技能包版本、上架状态和展示资料。"
        action={
          <button type="button" className={adminBtnPrimaryClass} onClick={openCreateDrawer}>
            上传新智能体
          </button>
        }
      />

      {message ? <p className="text-xs text-emerald-700">{message}</p> : null}

      <AdminCard>
        <AdminTable
          rows={agents as unknown as Array<Record<string, unknown>>}
          empty="暂无智能体，点击右上角上传新智能体"
          columns={[
            {
              key: 'iconUrl',
              label: '图标',
              render: (row) => (
                <img
                  src={String(row.iconUrl || '')}
                  alt=""
                  className="w-9 h-9 rounded-lg object-cover bg-[#f5f5f5] border border-[#eee]"
                />
              ),
            },
            { key: 'name', label: '名称' },
            {
              key: 'description',
              label: '简介',
              render: (row) => (
                <span className="max-w-[240px] truncate inline-block" title={String(row.description ?? '')}>
                  {String(row.description ?? '—')}
                </span>
              ),
            },
            {
              key: 'status',
              label: '状态',
              render: (row) => <StatusBadge value={agentStatusLabel(String(row.status))} />,
            },
            { key: 'currentVersion', label: '当前版本' },
            {
              key: 'updatedAt',
              label: '更新时间',
              render: (row) => new Date(String(row.updatedAt)).toLocaleString('zh-CN'),
            },
            {
              key: 'id',
              label: '操作',
              render: (row) => {
                const id = String(row.id);
                const slug = String(row.slug);
                const status = String(row.status);
                const disabled = busyId === id;
                return (
                  <div className="flex items-center gap-3">
                    <button type="button" className={adminLinkClass} onClick={() => openDetailDrawer(slug)}>
                      {status === 'online' ? '查看' : '编辑'}
                    </button>
                    {status === 'online' ? (
                      <button
                        type="button"
                        disabled={disabled}
                        className="text-xs text-rose-700 hover:underline disabled:opacity-40"
                        onClick={() => void runStatusAction(row as unknown as AdminAgentRecord, 'offline')}
                      >
                        下架
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={disabled}
                        className="text-xs text-emerald-700 hover:underline disabled:opacity-40"
                        onClick={() => void runStatusAction(row as unknown as AdminAgentRecord, 'online')}
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

      <AdminDrawer
        open={drawer === 'create'}
        title="上传新智能体"
        desc="创建后默认为下架状态"
        onClose={closeDrawer}
        widthClass="max-w-xl"
      >
        <AdminAgentCreateForm onCreated={handleCreated} />
      </AdminDrawer>

      <AdminDrawer
        open={drawer === 'detail' && Boolean(detailSlug)}
        title={agentDrawerTitle(detailAgent, detailSlug ?? '')}
        desc={agentDrawerDesc(detailAgent, detailSlug ?? '')}
        onClose={closeDrawer}
        widthClass="max-w-3xl"
      >
        {detailSlug ? (
          <AdminAgentDetailPanel
            skillId={detailSlug}
            onChanged={() => {
              void load();
              void adminApi.agent(detailSlug).then(setDetailAgent).catch(() => undefined);
            }}
          />
        ) : null}
      </AdminDrawer>
    </div>
  );
}
