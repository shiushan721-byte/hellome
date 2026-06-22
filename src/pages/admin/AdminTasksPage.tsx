import { useEffect, useState } from 'react';
import { adminApi } from '../../lib/adminApi';
import { AdminCard, AdminPageHeader, AdminTable, StatusBadge } from '../../components/admin/AdminUi';

export default function AdminTasksPage() {
  const [rows, setRows] = useState<Array<Record<string, unknown>>>([]);

  useEffect(() => {
    void adminApi.tasks().then(setRows);
  }, []);

  return (
    <div>
      <AdminPageHeader title="任务管理" desc="查看平台任务执行状态与消耗" />
      <AdminCard>
        <AdminTable
          rows={rows}
          columns={[
            { key: 'name', label: '任务名' },
            { key: 'agentType', label: '智能体' },
            { key: 'userLabel', label: '用户', render: (row) => String(row.userLabel ?? row.userId ?? '—') },
            { key: 'status', label: '状态', render: (row) => <StatusBadge value={String(row.status)} /> },
            { key: 'tokenUsed', label: 'Token' },
            { key: 'createdAt', label: '创建时间', render: (row) => String(row.createdAt ?? '').slice(0, 19) },
          ]}
        />
      </AdminCard>
    </div>
  );
}
