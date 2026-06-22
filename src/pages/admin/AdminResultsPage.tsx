import { useEffect, useState } from 'react';
import { adminApi } from '../../lib/adminApi';
import { AdminCard, AdminPageHeader, AdminTable } from '../../components/admin/AdminUi';

export default function AdminResultsPage() {
  const [rows, setRows] = useState<Array<Record<string, unknown>>>([]);

  useEffect(() => {
    void adminApi.artifacts().then(setRows);
  }, []);

  return (
    <div>
      <AdminPageHeader title="成果管理" desc="查看任务交付物与附件" />
      <AdminCard>
        <AdminTable
          rows={rows}
          empty="暂无成果（需连接数据库后查看 TaskArtifact）"
          columns={[
            { key: 'label', label: '名称' },
            { key: 'type', label: '类型' },
            { key: 'taskName', label: '来源任务' },
            { key: 'url', label: '链接', render: (row) => String(row.url ?? '—') },
            { key: 'createdAt', label: '生成时间', render: (row) => String(row.createdAt ?? '').slice(0, 19) },
          ]}
        />
      </AdminCard>
    </div>
  );
}
