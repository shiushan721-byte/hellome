import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getUsage, submitBillingTopup, subscribeUsage, syncUsageState } from '../../lib/usageStore';
import { formatToken } from '../../lib/tokenBilling';

const RECHARGE_PACKAGES = [
  { id: 'starter', label: '新手补充包', tokenAmount: 20_000, note: '新手补充包' },
  { id: 'standard', label: '标准补充包', tokenAmount: 50_000, note: '标准补充包' },
  { id: 'team', label: '团队补充包', tokenAmount: 120_000, note: '团队补充包' },
];

export default function UsageRechargePage() {
  const navigate = useNavigate();
  const usage = useSyncExternalStore(subscribeUsage, getUsage, getUsage);
  const [selectedId, setSelectedId] = useState(RECHARGE_PACKAGES[0].id);
  const [customAmount, setCustomAmount] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const selectedPackage = RECHARGE_PACKAGES.find((item) => item.id === selectedId) ?? RECHARGE_PACKAGES[0];
  const resolvedAmount = customAmount.trim() ? Number(customAmount) : selectedPackage.tokenAmount;
  const resolvedNote = note.trim() || selectedPackage.note;
  const nextBalance = useMemo(
    () => (Number.isFinite(resolvedAmount) ? usage.tokenBalance + Math.max(0, resolvedAmount) : usage.tokenBalance),
    [resolvedAmount, usage.tokenBalance],
  );

  useEffect(() => {
    void syncUsageState();
  }, []);

  const handleSubmit = async () => {
    setError('');
    setSubmitting(true);
    try {
      await submitBillingTopup({
        tokenAmount: resolvedAmount,
        note: resolvedNote,
      });
      navigate('/app/usage', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : '充值失败，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display">词元调整</h1>
          <p className="text-sm text-black/50 mt-1">先用假的充值页打通链路，提交后会直接同步算力余额与记录。</p>
        </div>
        <Link
          to="/app/usage"
          className="inline-flex justify-center px-5 py-2.5 text-xs font-bold border border-black/15 hover:bg-black/[0.02] rounded-lg"
        >
          返回账户总览
        </Link>
      </div>

      <section className="grid gap-4 lg:grid-cols-[1.3fr_0.9fr]">
        <div className="space-y-4 bg-[#F2F0ED] p-5">
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-black">选择一个充值包</h2>
            <p className="text-xs text-black/45">这一步不接真实支付，只做服务端记账与余额同步。</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {RECHARGE_PACKAGES.map((item) => {
              const active = item.id === selectedId && !customAmount.trim();
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setSelectedId(item.id);
                    setCustomAmount('');
                  }}
                  className={`rounded-2xl border p-4 text-left transition-colors ${
                    active ? 'border-black bg-white' : 'border-black/8 bg-white/60 hover:border-black/20'
                  }`}
                >
                  <p className="text-sm font-bold text-black">{item.label}</p>
                  <p className="mt-2 font-mono text-lg text-black">{formatToken(item.tokenAmount)}</p>
                  <p className="text-[11px] text-black/40 mt-1">Token</p>
                </button>
              );
            })}
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold text-black/60">自定义补充 Token</label>
            <input
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value.replace(/[^\d]/g, ''))}
              placeholder="例如 30000"
              inputMode="numeric"
              className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm outline-none focus:border-black/25"
            />
            <p className="text-[11px] text-black/45">留空时使用当前选中的充值包。</p>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold text-black/60">备注</label>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={selectedPackage.note}
              className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm outline-none focus:border-black/25"
            />
          </div>

          {error ? <p className="text-xs text-red-600">{error}</p> : null}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || !Number.isFinite(resolvedAmount) || resolvedAmount <= 0}
            className="inline-flex justify-center px-5 py-3 text-sm font-bold bg-black text-white hover:bg-black/85 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting ? '充值中...' : '确认充值'}
          </button>
        </div>

        <div className="space-y-4 bg-white border border-black/8 p-5">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-black/40">当前余额</p>
            <p className="mt-2 text-2xl font-bold font-display text-black">{formatToken(usage.tokenBalance)}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-black/40">本次增加</p>
            <p className="mt-2 text-xl font-bold font-mono text-[#14958A]">+{formatToken(Math.max(0, resolvedAmount || 0))}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-black/40">充值后预计余额</p>
            <p className="mt-2 text-xl font-bold font-display text-black">{formatToken(nextBalance)}</p>
          </div>
          <div className="rounded-2xl bg-[#F6F3EE] px-4 py-3 text-xs leading-6 text-black/55">
            当前页是演示充值页，提交后会调用服务端接口写入充值记录，并刷新顶部 Token、账户总览余额和最近记录。
          </div>
        </div>
      </section>
    </div>
  );
}
