import { useEffect, useState } from 'react';
import { adminApi } from '../../lib/adminApi';
import { AdminCard, AdminPageHeader, AdminTable, StatusBadge, adminSectionHeaderClass } from '../../components/admin/AdminUi';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Array<Record<string, unknown>>>([]);
  const [packs, setPacks] = useState<Array<Record<string, unknown>>>([]);

  useEffect(() => {
    void Promise.all([adminApi.orders(), adminApi.rechargePacks()]).then(([o, p]) => {
      setOrders(o);
      setPacks(p);
    });
  }, []);

  return (
    <div className="space-y-5">
      <AdminPageHeader title="订单与算力" desc="充值记录与充值包配置" />

      <AdminCard>
        <div className={adminSectionHeaderClass}>充值记录</div>
        <AdminTable
          rows={orders}
          columns={[
            { key: 'orderNo', label: '订单号' },
            { key: 'userLabel', label: '用户' },
            { key: 'tokenAmount', label: 'Token' },
            { key: 'status', label: '状态', render: (row) => <StatusBadge value={String(row.status)} /> },
            { key: 'createdAt', label: '时间', render: (row) => String(row.createdAt ?? '').slice(0, 19) },
            { key: 'note', label: '备注' },
          ]}
        />
      </AdminCard>

      <AdminCard>
        <div className={adminSectionHeaderClass}>充值包</div>
        <AdminTable
          rows={packs}
          columns={[
            { key: 'name', label: '名称' },
            { key: 'tokenAmount', label: 'Token' },
            { key: 'bonusTokens', label: '赠送' },
            { key: 'priceCents', label: '价格(分)' },
            { key: 'status', label: '状态', render: (row) => <StatusBadge value={String(row.status)} /> },
            { key: 'recommended', label: '推荐', render: (row) => (row.recommended ? '是' : '否') },
          ]}
        />
      </AdminCard>
    </div>
  );
}
