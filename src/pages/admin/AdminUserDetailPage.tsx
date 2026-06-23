import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { adminApi, type AdminUserDetail } from '../../lib/adminApi';
import {
  AdminCard,
  AdminPageHeader,
  AdminTable,
  StatusBadge,
  adminBtnPrimaryClass,
  adminInputClass,
  adminLinkClass,
  adminSectionHeaderClass,
  adminTabClass,
} from '../../components/admin/AdminUi';

type DetailTab =
  | 'profile'
  | 'billing'
  | 'tasks'
  | 'artifacts'
  | 'devices'
  | 'integrations'
  | 'audit';

const TABS: Array<{ id: DetailTab; label: string }> = [
  { id: 'profile', label: '基础信息' },
  { id: 'billing', label: '算力与订单' },
  { id: 'tasks', label: '任务记录' },
  { id: 'artifacts', label: '成果记录' },
  { id: 'devices', label: '设备与配对' },
  { id: 'integrations', label: '第三方绑定' },
  { id: 'audit', label: '操作日志' },
];

const ADJUSTMENT_TYPES = [
  { id: 'compensation', label: '客服补偿' },
  { id: 'gift', label: '赠送' },
  { id: 'campaign', label: '活动奖励' },
  { id: 'test', label: '测试发放' },
  { id: 'deduction', label: '扣减' },
  { id: 'refund_recovery', label: '退款回收' },
  { id: 'correction', label: '错误修正' },
];

function formatTime(value: unknown) {
  if (!value) return '—';
  return String(value).slice(0, 19).replace('T', ' ');
}

export default function AdminUserDetailPage() {
  const { id = '' } = useParams();
  const [tab, setTab] = useState<DetailTab>('profile');
  const [detail, setDetail] = useState<AdminUserDetail | null>(null);
  const [message, setMessage] = useState('');

  const [adjustType, setAdjustType] = useState('compensation');
  const [tokenAmount, setTokenAmount] = useState('5000');
  const [reason, setReason] = useState('客服补偿');
  const [note, setNote] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);

  const load = async () => {
    if (!id) return;
    setDetail(await adminApi.user(id));
  };

  useEffect(() => {
    void load().catch((error) => {
      setMessage(error instanceof Error ? error.message : '加载失败');
    });
  }, [id]);

  const handleAdjust = async () => {
    if (!id) return;
    const amount = Number(tokenAmount);
    if (!Number.isFinite(amount) || amount === 0) {
      setMessage('请输入有效的 Token 数量');
      return;
    }
    if (Math.abs(amount) >= 10000 && !showConfirm) {
      setShowConfirm(true);
      return;
    }
    try {
      await adminApi.adjustTokens(id, {
        type: adjustType,
        tokenAmount: amount,
        reason,
        note,
      });
      setMessage('Token 调整成功');
      setShowConfirm(false);
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '调整失败');
      setShowConfirm(false);
    }
  };

  if (!detail) {
    return (
      <div>
        <AdminPageHeader title="用户详情" desc={id || '—'} />
        <p className="text-black/45">{message || '加载中…'}</p>
      </div>
    );
  }

  const profile = detail.profile;
  const summary = detail.summary;

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title={String(profile.displayName ?? '用户详情')}
        desc={`${profile.phone ?? '—'} · ID ${profile.id}`}
        action={
          <Link to="/admin/users" className={`${adminLinkClass} text-sm`}>
            ← 返回列表
          </Link>
        }
      />

      {message ? <p className="text-xs text-black/45">{message}</p> : null}

      <AdminCard className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold">{String(profile.displayName)}</h2>
              <StatusBadge value={String(profile.status ?? 'active')} />
              {profile.hermesStatus === 'connected' ? (
                <span className="text-xs px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
                  Hermes 已配对
                </span>
              ) : null}
              {profile.gnomicBound ? (
                <span className="text-xs px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-200">
                  Gnomic 已绑定
                </span>
              ) : null}
            </div>
            <p className="text-sm text-black/50">
              注册 {formatTime(profile.createdAt)} · externalId {String(profile.externalId)}
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <SummaryStat label="Token 余额" value={Number(summary.tokenBalance ?? 0).toLocaleString()} />
            <SummaryStat label="累计充值" value={Number(summary.totalTopup ?? 0).toLocaleString()} />
            <SummaryStat label="累计消耗" value={Number(summary.totalConsumed ?? 0).toLocaleString()} />
            <SummaryStat label="任务 / 成果" value={`${summary.taskCount ?? 0} / ${summary.artifactCount ?? 0}`} />
          </div>
        </div>
      </AdminCard>

      <div className="flex flex-wrap gap-2">
        {TABS.map((item) => (
          <button key={item.id} type="button" onClick={() => setTab(item.id)} className={adminTabClass(tab === item.id)}>
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'profile' ? (
        <AdminCard className="p-4">
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <InfoRow label="内部用户 ID" value={String(profile.id)} />
            <InfoRow label="externalId" value={String(profile.externalId)} />
            <InfoRow label="手机号" value={String(profile.phone ?? '—')} />
            <InfoRow label="昵称" value={String(profile.displayName)} />
            <InfoRow label="邮箱" value={String(profile.email ?? '—')} />
            <InfoRow label="用户状态" value={String(profile.status ?? 'active')} />
            <InfoRow label="最近登录" value={formatTime(profile.lastLoginAt)} />
            {profile.disabledReason ? (
              <InfoRow label="禁用原因" value={String(profile.disabledReason)} />
            ) : null}
            {Array.isArray(profile.tags) && profile.tags.length > 0 ? (
              <InfoRow label="标签" value={(profile.tags as string[]).join('、')} />
            ) : null}
            <InfoRow label="注册时间" value={formatTime(profile.createdAt)} />
            <InfoRow label="更新时间" value={formatTime(profile.updatedAt)} />
            <InfoRow label="登录方式" value="手机号" />
          </dl>
        </AdminCard>
      ) : null}

      {tab === 'billing' ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <AdminCard className="p-4">
              <p className="text-xs text-black/45">本月消耗</p>
              <p className="text-xl font-bold mt-1">{Number(summary.monthlyConsumed ?? 0).toLocaleString()}</p>
            </AdminCard>
            <AdminCard className="p-4">
              <p className="text-xs text-black/45">最近充值</p>
              <p className="text-sm mt-1">{formatTime(summary.lastTopupAt)}</p>
            </AdminCard>
            <AdminCard className="p-4">
              <p className="text-xs text-black/45">最近消耗</p>
              <p className="text-sm mt-1">{formatTime(summary.lastConsumedAt)}</p>
            </AdminCard>
            <AdminCard className="p-4">
              <p className="text-xs text-black/45">当前余额</p>
              <p className="text-xl font-bold mt-1">{Number(summary.tokenBalance ?? 0).toLocaleString()}</p>
            </AdminCard>
          </div>

          <AdminCard className="p-4 space-y-3">
            <h3 className="text-sm font-semibold">人工调整 Token</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="block text-sm">
                <span className="text-black/45">调整类型</span>
                <select
                  value={adjustType}
                  onChange={(e) => setAdjustType(e.target.value)}
                  className={`mt-1 ${adminInputClass}`}
                >
                  {ADJUSTMENT_TYPES.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm">
                <span className="text-black/45">Token 数量（负数扣减）</span>
                <input value={tokenAmount} onChange={(e) => setTokenAmount(e.target.value)} className={`mt-1 ${adminInputClass}`} />
              </label>
              <label className="block text-sm">
                <span className="text-black/45">调整原因</span>
                <input value={reason} onChange={(e) => setReason(e.target.value)} className={`mt-1 ${adminInputClass}`} />
              </label>
              <label className="block text-sm">
                <span className="text-black/45">备注</span>
                <input value={note} onChange={(e) => setNote(e.target.value)} className={`mt-1 ${adminInputClass}`} />
              </label>
            </div>
            {showConfirm ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                确认调整该用户 Token？数量 {tokenAmount}，原因：{reason}。该操作会影响算力余额并写入操作日志。
                <div className="mt-2 flex gap-2">
                  <button type="button" onClick={() => void handleAdjust()} className={adminBtnPrimaryClass}>
                    确认调整
                  </button>
                  <button type="button" onClick={() => setShowConfirm(false)} className="px-3 py-2 text-sm border rounded-lg">
                    取消
                  </button>
                </div>
              </div>
            ) : (
              <button type="button" onClick={() => void handleAdjust()} className={adminBtnPrimaryClass}>
                调整 Token
              </button>
            )}
          </AdminCard>

          <AdminCard>
            <div className={adminSectionHeaderClass}>充值记录</div>
            <AdminTable
              rows={detail.topups}
              empty="暂无充值"
              columns={[
                { key: 'id', label: '记录 ID' },
                { key: 'tokenAmount', label: 'Token' },
                { key: 'note', label: '备注' },
                { key: 'createdAt', label: '时间', render: (row) => formatTime(row.createdAt) },
              ]}
            />
          </AdminCard>

          <AdminCard>
            <div className={adminSectionHeaderClass}>消耗账本</div>
            <AdminTable
              rows={detail.ledgers}
              empty="暂无消耗记录"
              columns={[
                { key: 'time', label: '时间', render: (row) => formatTime(row.time) },
                { key: 'taskId', label: '任务 ID' },
                { key: 'taskName', label: '任务名称' },
                { key: 'agent', label: '智能体' },
                { key: 'tokenUsed', label: '消耗 Token' },
                { key: 'status', label: '状态', render: (row) => <StatusBadge value={String(row.status)} /> },
              ]}
            />
          </AdminCard>
        </div>
      ) : null}

      {tab === 'tasks' ? (
        <AdminCard>
          <AdminTable
            rows={detail.tasks}
            empty="暂无任务"
            columns={[
              { key: 'id', label: '任务 ID' },
              { key: 'name', label: '任务名称' },
              { key: 'agentType', label: '智能体' },
              { key: 'status', label: '状态', render: (row) => <StatusBadge value={String(row.status)} /> },
              { key: 'createdAt', label: '创建时间', render: (row) => formatTime(row.createdAt) },
              { key: 'tokenUsed', label: '实际 Token' },
              {
                key: 'requiresConfirm',
                label: '需确认',
                render: (row) => (row.requiresConfirm ? '是' : '否'),
              },
            ]}
          />
        </AdminCard>
      ) : null}

      {tab === 'artifacts' ? (
        <AdminCard>
          <AdminTable
            rows={detail.artifacts}
            empty="暂无成果"
            columns={[
              { key: 'id', label: '成果 ID' },
              { key: 'label', label: '名称' },
              { key: 'type', label: '类型' },
              { key: 'taskName', label: '来源任务' },
              { key: 'fileName', label: '文件名' },
              { key: 'mimeType', label: 'MIME' },
              { key: 'createdAt', label: '创建时间', render: (row) => formatTime(row.createdAt) },
              {
                key: 'url',
                label: '操作',
                render: (row) =>
                  row.url ? (
                    <a href={String(row.url)} target="_blank" rel="noreferrer" className={adminLinkClass}>
                      预览
                    </a>
                  ) : (
                    '—'
                  ),
              },
            ]}
          />
        </AdminCard>
      ) : null}

      {tab === 'devices' ? (
        <AdminCard>
          <AdminTable
            rows={detail.devices}
            empty="暂无 Hermes 设备"
            columns={[
              { key: 'id', label: '设备 ID' },
              { key: 'deviceName', label: '设备名称' },
              { key: 'os', label: '系统' },
              { key: 'version', label: '版本' },
              { key: 'status', label: '状态', render: (row) => <StatusBadge value={String(row.status)} /> },
              { key: 'lastSeenAt', label: '最后在线', render: (row) => formatTime(row.lastSeenAt) },
              {
                key: 'debugEnabled',
                label: '调试',
                render: (row) => (row.debugEnabled ? '开启' : '关闭'),
              },
            ]}
          />
        </AdminCard>
      ) : null}

      {tab === 'integrations' ? (
        <AdminCard className="p-4">
          {detail.gnomicBinding ? (
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <InfoRow label="绑定 ID" value={String(detail.gnomicBinding.id)} />
              <InfoRow label="Gnomic 用户 ID" value={String(detail.gnomicBinding.gnomicUserId)} />
              <InfoRow label="手机号" value={String(detail.gnomicBinding.phone ?? '—')} />
              <InfoRow label="状态" value={String(detail.gnomicBinding.status)} />
              <InfoRow label="创建时间" value={formatTime(detail.gnomicBinding.createdAt)} />
              <InfoRow label="更新时间" value={formatTime(detail.gnomicBinding.updatedAt)} />
            </dl>
          ) : (
            <p className="text-sm text-black/45">该用户尚未绑定 Gnomic 账号</p>
          )}
        </AdminCard>
      ) : null}

      {tab === 'audit' ? (
        <AdminCard>
          <AdminTable
            rows={detail.auditLogs}
            empty="暂无相关操作日志"
            columns={[
              { key: 'createdAt', label: '时间', render: (row) => formatTime(row.createdAt) },
              { key: 'actorName', label: '操作人', render: (row) => String(row.actorName ?? row.actorId ?? '—') },
              { key: 'module', label: '模块' },
              { key: 'action', label: '动作' },
              { key: 'ip', label: 'IP', render: (row) => String(row.ip ?? '—') },
            ]}
          />
        </AdminCard>
      ) : null}
    </div>
  );
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-black/45">{label}</p>
      <p className="font-semibold mt-1">{value}</p>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-black/45 text-xs">{label}</dt>
      <dd className="mt-1 break-all">{value}</dd>
    </div>
  );
}
