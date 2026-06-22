import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../../lib/adminApi';
import { AdminCard, AdminPageHeader, AdminTable, StatusBadge, adminLinkClass } from '../../components/admin/AdminUi';

export default function AdminUsersPage() {
  const [rows, setRows] = useState<Array<Record<string, unknown>>>([]);

  useEffect(() => {
    void adminApi.users().then(setRows);
  }, []);

  return (
    <div>
      <AdminPageHeader title="用户管理" desc="查看用户资料、算力余额与详情" />
      <AdminCard>
        <AdminTable
          rows={rows}
          columns={[
            { key: 'displayName', label: '昵称' },
            { key: 'phone', label: '手机号' },
            { key: 'tokenBalance', label: 'Token 余额' },
            {
              key: 'status',
              label: '状态',
              render: (row) => <StatusBadge value={String(row.status ?? 'active')} />,
            },
            { key: 'createdAt', label: '注册时间', render: (row) => String(row.createdAt ?? '').slice(0, 19) },
            {
              key: 'id',
              label: '操作',
              render: (row) => (
                <Link to={`/admin/users/${row.id}`} className={adminLinkClass}>
                  查看详情
                </Link>
              ),
            },
          ]}
        />
      </AdminCard>
    </div>
  );
}
