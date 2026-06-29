import { useMemo, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { Check, X } from 'lucide-react';
import { getUsage, submitBillingTopup, subscribeUsage } from '../../lib/usageStore';
import { formatToken } from '../../lib/tokenBilling';

const AMOUNT_OPTIONS = [50, 100, 200, 500, 1000, 2000, 5000];
const TOKEN_PER_YUAN = 1000;

type PaymentMethod = 'wechat' | 'alipay';

type RechargeModalProps = {
  open: boolean;
  onClose: () => void;
};

function formatMoney(amount: number): string {
  return `¥${amount.toLocaleString('zh-CN')}`;
}

export default function RechargeModal({ open, onClose }: RechargeModalProps) {
  const usage = useSyncExternalStore(subscribeUsage, getUsage, getUsage);
  const [selectedAmount, setSelectedAmount] = useState(AMOUNT_OPTIONS[0]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('wechat');
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const tokenAmount = selectedAmount * TOKEN_PER_YUAN;
  const nextBalance = useMemo(
    () => usage.tokenBalance + tokenAmount,
    [tokenAmount, usage.tokenBalance],
  );

  if (!open) return null;

  const handleSubmit = async () => {
    if (!agreed || submitting) return;
    setError('');
    setSubmitting(true);
    try {
      await submitBillingTopup({
        tokenAmount,
        note: `${paymentMethod === 'wechat' ? '微信支付' : '支付宝'} ${selectedAmount}元`,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : '充值失败，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-start justify-center overflow-hidden bg-black/35 px-4 py-4">
      <div
        className="flex w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-black/10 bg-[#FDFCFB] shadow-2xl"
        style={{ height: 'calc(100vh - 32px)', maxHeight: 'calc(100vh - 32px)' }}
      >
        <div className="shrink-0 flex items-center justify-between border-b border-black/8 bg-[#FDFCFB]/95 px-6 py-4 backdrop-blur-md">
          <div>
            <h2 className="text-xl font-bold font-display text-[#111827]">钱包充值</h2>
            <p className="mt-1 text-xs text-black/45">选择充值金额和支付方式，充值后自动增加可用算力。</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-black/10 bg-white text-black/55 hover:text-black hover:border-black/20"
            aria-label="关闭充值弹窗"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-4">
          <section className="rounded-xl border border-black/10 bg-white px-5 py-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-bold text-black/45">可用 Token 余额</p>
                <p className="mt-2 font-display text-4xl font-bold text-[#111827]">
                  {formatToken(usage.tokenBalance)}
                </p>
                <p className="mt-3 text-sm font-semibold text-black/40">
                  本次增加：{formatToken(tokenAmount)} Token
                  <span className="mx-3 text-black/20">|</span>
                  充值后：{formatToken(nextBalance)} Token
                </p>
              </div>
              <div className="flex items-center gap-3 text-sm text-black/45">
                支持普通发票和增值税发票
                <button
                  type="button"
                  className="rounded-lg border border-black/10 bg-white px-4 py-2 text-sm font-bold text-[#111827] hover:border-black/20"
                >
                  去开票
                </button>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-black/8 bg-[#F8FAFC] px-5 py-3 text-sm leading-7 text-black/55">
            <p>1. 请确保您的账户有足够金额进行交易。</p>
            <p>2. 若充值过程遇到交易问题，请前往对应的第三方支付平台进行确认。</p>
            <p>3. 为保障账户安全与充值体验，每月最多可享受 30 次充值服务，1 天内未支付的订单会自动关闭。</p>
            <p>4. 充值完成后可在账户总览查看账户余额与充值记录。</p>
          </section>

          <section className="space-y-4">
            <div className="grid gap-4 md:grid-cols-[84px_1fr] md:items-start">
              <div className="pt-3 text-sm font-bold text-[#111827]">支付金额</div>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {AMOUNT_OPTIONS.map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => setSelectedAmount(amount)}
                    className={`h-12 rounded-lg border bg-white text-sm font-bold transition-colors ${
                      selectedAmount === amount
                        ? 'border-[#111827] shadow-[inset_0_0_0_1px_#111827] text-[#111827]'
                        : 'border-black/10 text-black/65 hover:border-black/25'
                    }`}
                  >
                    {amount}元
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-[84px_1fr] md:items-center">
              <div className="text-sm font-bold text-[#111827]">支付方式</div>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('wechat')}
                  className={`inline-flex h-12 items-center gap-2 rounded-lg border bg-white px-5 text-sm font-bold ${
                    paymentMethod === 'wechat'
                      ? 'border-[#111827] shadow-[inset_0_0_0_1px_#111827]'
                      : 'border-black/10 hover:border-black/25'
                  }`}
                >
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-[#22C55E] text-white">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                  微信支付
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('alipay')}
                  className={`inline-flex h-12 items-center gap-2 rounded-lg border bg-white px-5 text-sm font-bold ${
                    paymentMethod === 'alipay'
                      ? 'border-[#111827] shadow-[inset_0_0_0_1px_#111827]'
                      : 'border-black/10 hover:border-black/25'
                  }`}
                >
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-[#1677FF] text-white text-xs font-black">
                    支
                  </span>
                  支付宝
                </button>
              </div>
            </div>

            <label className="inline-flex items-center gap-2 text-sm font-semibold text-black/55">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(event) => setAgreed(event.target.checked)}
                className="h-4 w-4 rounded border-black/20"
              />
              已阅读并同意
              <button type="button" className="font-bold text-[#111827] hover:underline">
                《充值协议》
              </button>
            </label>

            {error ? <p className="text-sm font-semibold text-red-600">{error}</p> : null}
          </section>
        </div>
        <div className="shrink-0 border-t border-black/8 bg-[#FDFCFB]/95 px-6 py-4 backdrop-blur-md">
          <div className="flex justify-center">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!agreed || submitting}
              className="h-12 min-w-56 rounded-lg bg-black px-8 text-base font-bold text-white transition-colors hover:bg-black/85 disabled:bg-black/35 disabled:cursor-not-allowed"
            >
              {submitting ? '支付中...' : `确认支付 ${formatMoney(selectedAmount)}`}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
