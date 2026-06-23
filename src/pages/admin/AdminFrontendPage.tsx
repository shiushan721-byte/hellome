import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../../lib/adminApi';
import { AdminCard, AdminPageHeader, AdminTable, StatusBadge, adminBtnPrimaryClass, adminLinkClass, adminTabClass } from '../../components/admin/AdminUi';

const SCOPES = [
  { id: 'agent_market', label: '智能体市场' },
  { id: 'workflow_market', label: '工作流市场' },
];

export default function AdminFrontendPage() {
  const [scope, setScope] = useState('agent_market');
  const [rows, setRows] = useState<Array<Record<string, unknown>>>([]);
  const [message, setMessage] = useState('');

  const load = async () => {
    setRows(await adminApi.frontendConfigs(scope));
  };

  useEffect(() => {
    void load();
  }, [scope]);

  const createDraft = async () => {
    try {
      await adminApi.saveFrontendConfig({
        key: `${scope}_demo`,
        name: `${scope} 演示配置`,
        scope,
        payload: { note: '后台创建的演示配置', updatedAt: new Date().toISOString() },
      });
      setMessage('已创建草稿配置');
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '创建失败');
    }
  };

  const publish = async (id: string) => {
    try {
      await adminApi.publishFrontendConfig(id);
      setMessage('发布成功');
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '发布失败');
    }
  };

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="通用前台配置"
        desc="管理智能体市场、工作流市场等 scope 的草稿与发布"
        action={
          <button type="button" onClick={() => void createDraft()} className={adminBtnPrimaryClass}>
            新建草稿
          </button>
        }
      />

      <Link to="/admin/frontend" className={`text-xs ${adminLinkClass}`}>
        ← 返回前台配置
      </Link>

      <div className="flex gap-2">
        {SCOPES.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setScope(item.id)}
            className={adminTabClass(scope === item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {message ? <p className="text-xs text-black/45">{message}</p> : null}

      <AdminCard>
        <AdminTable
          rows={rows}
          empty="当前 scope 暂无配置，可点击「新建草稿」"
          columns={[
            { key: 'name', label: '名称' },
            { key: 'key', label: 'Key' },
            { key: 'version', label: '版本' },
            { key: 'status', label: '状态', render: (row) => <StatusBadge value={String(row.status)} /> },
            {
              key: 'id',
              label: '操作',
              render: (row) =>
                row.status === 'draft' ? (
                  <button
                    type="button"
                    onClick={() => void publish(String(row.id))}
                    className={adminLinkClass}
                  >
                    发布
                  </button>
                ) : (
                  '—'
                ),
            },
          ]}
        />
      </AdminCard>
    </div>
  );
}
