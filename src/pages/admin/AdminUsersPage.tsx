import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../../lib/adminApi';
import {
  AdminCard,
  AdminPageHeader,
  AdminTable,
  StatusBadge,
  adminInputClass,
  adminLinkClass,
  adminTabClass,
} from '../../components/admin/AdminUi';

type QuickFilter = 'all' | 'lowBalance' | 'hasTopup' | 'hasHermes' | 'hasGnomic' | 'disabled';

const QUICK_FILTERS: Array<{ id: QuickFilter; label: string }> = [
  { id: 'all', label: '全部' },
  { id: 'lowBalance', label: 'Token 不足' },
  { id: 'hasTopup', label: '已充值' },
  { id: 'hasHermes', label: '已配对 Hermes' },
  { id: 'hasGnomic', label: '已绑定 Gnomic' },
  { id: 'disabled', label: '已禁用' },
];

export default function AdminUsersPage() {
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<QuickFilter>('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [rows, setRows] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setMessage('');
    try {
      const data = await adminApi.users({
        q: search || undefined,
        status: filter === 'disabled' ? 'disabled' : undefined,
        lowBalance: filter === 'lowBalance' ? true : undefined,
        hasTopup: filter === 'hasTopup' ? true : undefined,
        hasHermes: filter === 'hasHermes' ? true : undefined,
        hasGnomic: filter === 'hasGnomic' ? true : undefined,
        page,
        pageSize: 20,
      });
      setRows(Array.isArray(data.users) ? data.users : []);
      setTotal(typeof data.total === 'number' ? data.total : 0);
    } catch (error) {
      setRows([]);
      setTotal(0);
      setMessage(error instanceof Error ? error.message : '加载用户失败，请确认已用管理员登录并重启开发服务');
    } finally {
      setLoading(false);
    }
  }, [filter, page, search]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSearch = () => {
    setPage(1);
    setSearch(query.trim());
  };

  const totalPages = Math.max(1, Math.ceil(total / 20));

  return (
    <div className="space-y-5">
      <AdminPageHeader title="用户管理" desc="检索、查看用户资料、算力余额与完整生命周期" />

      {message ? <p className="text-xs text-rose-600">{message}</p> : null}

      <AdminCard className="p-4 space-y-4">
        <div className="flex flex-col lg:flex-row gap-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="搜索手机号、用户ID、订单号、任务ID"
            className={`flex-1 ${adminInputClass}`}
          />
          <button type="button" onClick={handleSearch} className="px-4 py-2 rounded-lg bg-[#111111] text-white text-sm font-semibold">
            搜索
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {QUICK_FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setFilter(item.id);
                setPage(1);
              }}
              className={adminTabClass(filter === item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </AdminCard>

      <AdminCard>
        <AdminTable
          rows={rows}
          empty={loading ? '加载中…' : '暂无匹配用户'}
          columns={[
            { key: 'displayName', label: '昵称' },
            { key: 'phone', label: '手机号', render: (row) => String(row.phone ?? '—') },
            {
              key: 'tokenBalance',
              label: 'Token 余额',
              render: (row) => Number(row.tokenBalance ?? 0).toLocaleString(),
            },
            { key: 'taskCount', label: '任务数' },
            {
              key: 'hermesStatus',
              label: 'Hermes',
              render: (row) => {
                const value = String(row.hermesStatus ?? 'none');
                return value === 'connected' ? '已配对' : value === 'offline' ? '离线' : '未配对';
              },
            },
            {
              key: 'gnomicBound',
              label: 'Gnomic',
              render: (row) => (row.gnomicBound ? '已绑定' : '—'),
            },
            {
              key: 'status',
              label: '状态',
              render: (row) => <StatusBadge value={String(row.status ?? 'active')} />,
            },
            {
              key: 'createdAt',
              label: '注册时间',
              render: (row) => String(row.createdAt ?? '').slice(0, 19).replace('T', ' '),
            },
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

      <div className="flex items-center justify-between text-sm text-black/45">
        <p>
          共 {total} 条 · 第 {page} / {totalPages} 页
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="px-3 py-1.5 rounded-lg border border-[#e8e8e8] disabled:opacity-40"
          >
            上一页
          </button>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1.5 rounded-lg border border-[#e8e8e8] disabled:opacity-40"
          >
            下一页
          </button>
        </div>
      </div>
    </div>
  );
}
