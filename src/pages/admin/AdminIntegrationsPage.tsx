import { useEffect, useState } from 'react';
import { adminApi } from '../../lib/adminApi';
import { AdminCard, AdminPageHeader, AdminTable, StatusBadge, adminSectionHeaderClass } from '../../components/admin/AdminUi';

export default function AdminIntegrationsPage() {
  const [rows, setRows] = useState<Array<Record<string, unknown>>>([]);

  useEffect(() => {
    void adminApi.gnomicBindings().then(setRows);
  }, []);

  return (
    <div>
      <AdminPageHeader title="第三方打通" desc="Gnomic / Agent云 绑定与 SSO 状态" />
      <AdminCard>
        <div className={adminSectionHeaderClass}>Gnomic 账号绑定</div>
        <AdminTable
          rows={rows}
          empty="暂无绑定记录"
          columns={[
            { key: 'hellomeUserId', label: 'HelloMe 用户' },
            { key: 'gnomicUserId', label: 'Gnomic 用户' },
            { key: 'phone', label: '手机号' },
            { key: 'status', label: '状态', render: (row) => <StatusBadge value={String(row.status)} /> },
            { key: 'createdAt', label: '绑定时间', render: (row) => String(row.createdAt ?? '').slice(0, 19) },
          ]}
        />
      </AdminCard>
    </div>
  );
}
