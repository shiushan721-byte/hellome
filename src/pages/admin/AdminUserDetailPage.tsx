import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { adminApi } from '../../lib/adminApi';
import { AdminCard, AdminPageHeader, AdminTable, adminBtnPrimaryClass, adminInputClass, adminSectionHeaderClass } from '../../components/admin/AdminUi';

export default function AdminUserDetailPage() {
  const { id = '' } = useParams();
  const [detail, setDetail] = useState<Record<string, unknown> | null>(null);
  const [tokenAmount, setTokenAmount] = useState('5000');
  const [note, setNote] = useState('客服补偿');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!id) return;
    void adminApi.user(id).then(setDetail);
  }, [id]);

  const handleAdjust = async () => {
    if (!id) return;
    try {
      await adminApi.adjustTokens(id, { tokenAmount: Number(tokenAmount), note });
      setMessage('Token 调整成功');
      setDetail(await adminApi.user(id));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '调整失败');
    }
  };

  if (!detail) return <p className="text-black/45">加载中…</p>;

  const tasks = (detail.tasks as Array<Record<string, unknown>>) ?? [];
  const topups = (detail.topups as Array<Record<string, unknown>>) ?? [];

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title={String(detail.displayName ?? '用户详情')}
        desc={`ID: ${detail.id}`}
      />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <AdminCard className="p-4 xl:col-span-1 space-y-2 text-sm">
          <p>手机：{String(detail.phone ?? '—')}</p>
          <p>邮箱：{String(detail.email ?? '—')}</p>
          <p>Token 余额：{String(detail.tokenBalance ?? 0)}</p>
          <div className="pt-3 border-t border-[#f0f0f0] space-y-2">
            <p className="text-xs text-black/45">人工调整 Token</p>
            <input
              value={tokenAmount}
              onChange={(e) => setTokenAmount(e.target.value)}
              className={adminInputClass}
            />
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className={adminInputClass}
            />
            <button
              type="button"
              onClick={() => void handleAdjust()}
              className={`w-full ${adminBtnPrimaryClass}`}
            >
              确认调整
            </button>
            {message ? <p className="text-xs text-black/45">{message}</p> : null}
          </div>
        </AdminCard>

        <AdminCard className="xl:col-span-2">
          <div className={adminSectionHeaderClass}>最近任务</div>
          <AdminTable
            rows={tasks}
            empty="暂无任务"
            columns={[
              { key: 'name', label: '任务名' },
              { key: 'agentType', label: '智能体' },
              { key: 'status', label: '状态' },
              { key: 'tokenUsed', label: 'Token' },
            ]}
          />
        </AdminCard>
      </div>

      <AdminCard>
        <div className={adminSectionHeaderClass}>充值记录</div>
        <AdminTable
          rows={topups}
          empty="暂无充值"
          columns={[
            { key: 'tokenAmount', label: 'Token' },
            { key: 'note', label: '备注' },
            { key: 'createdAt', label: '时间', render: (row) => String(row.createdAt ?? '').slice(0, 19) },
          ]}
        />
      </AdminCard>
    </div>
  );
}
