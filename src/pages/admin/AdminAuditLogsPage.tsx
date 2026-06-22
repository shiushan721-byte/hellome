import { useEffect, useState } from 'react';
import { adminApi } from '../../lib/adminApi';
import { AdminCard, AdminPageHeader, AdminTable } from '../../components/admin/AdminUi';

export default function AdminAuditLogsPage() {
  const [rows, setRows] = useState<Array<Record<string, unknown>>>([]);

  useEffect(() => {
    void adminApi.auditLogs().then(setRows);
  }, []);

  return (
    <div>
      <AdminPageHeader title="操作日志" desc="后台写操作审计记录" />
      <AdminCard>
        <AdminTable
          rows={rows}
          empty="暂无操作日志"
          columns={[
            { key: 'actorName', label: '操作人', render: (row) => String(row.actorName ?? row.actorId ?? '—') },
            { key: 'module', label: '模块' },
            { key: 'action', label: '动作' },
            { key: 'targetType', label: '对象类型' },
            { key: 'targetId', label: '对象 ID' },
            { key: 'createdAt', label: '时间', render: (row) => String(row.createdAt ?? '').slice(0, 19) },
          ]}
        />
      </AdminCard>
    </div>
  );
}
