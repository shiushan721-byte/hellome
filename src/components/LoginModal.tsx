import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';
import {
  loginWithPhone,
  requestLoginCode,
  verifyDemoCode,
  DEMO_PHONE,
  DEMO_CODE,
} from '../lib/auth';
import {
  resolvePostLoginPath,
  type PendingAgentIntent,
} from '../lib/pendingAgentIntent';
import { replayPendingGnomicIntent } from '../lib/gnomicSso';
import { replayPendingAgentsyunIntent } from '../lib/agentsyunSso';

interface LoginModalProps {
  intent?: PendingAgentIntent;
  onClose: () => void;
}

const WECHAT_QR_SRC = '/login-wechat-qr.png';

export default function LoginModal({ intent = {}, onClose }: LoginModalProps) {
  const navigate = useNavigate();
  const [phone, setPhone] = useState(DEMO_PHONE);
  const [code, setCode] = useState(DEMO_CODE);
  const [error, setError] = useState('');
  const [codeSent, setCodeSent] = useState(true);
  const [countdown, setCountdown] = useState(0);
  const [sendingCode, setSendingCode] = useState(false);

  const gnomicContext = Boolean(intent.gnomic);
  const agentsyunContext = Boolean(intent.agentsyun);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = window.setTimeout(() => setCountdown((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [countdown]);

  const handleSendCode = async () => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length !== 11) {
      setError('请输入 11 位手机号');
      return;
    }
    setError('');
    setSendingCode(true);
    try {
      await requestLoginCode(digits);
    } catch {
      if (!verifyDemoCode(digits, DEMO_CODE)) {
        setError('验证码发送失败，演示账号可直接使用预填验证码登录');
      }
    } finally {
      setSendingCode(false);
    }
    setCode(DEMO_CODE);
    setCodeSent(true);
    setCountdown(60);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    const digits = phone.replace(/\D/g, '') || DEMO_PHONE;
    const verifyCode = code.trim() || DEMO_CODE;

    if (!verifyDemoCode(digits, verifyCode)) {
      setError(`验证码错误。演示环境请使用 ${DEMO_CODE}`);
      return;
    }

    try {
      await loginWithPhone(digits, verifyCode);
      onClose();
      if (intent.gnomic) {
        try {
          await replayPendingGnomicIntent();
        } catch {
          // 登录已成功，Gnomic SSO 失败不阻断进入应用
        }
        navigate('/app/agents', { replace: true });
        return;
      }
      if (intent.agentsyun) {
        try {
          await replayPendingAgentsyunIntent();
        } catch {
          // 登录已成功，Agent云 SSO 失败不阻断进入应用
        }
        navigate(intent.redirect ? intent.redirect.replace(/^\/agents/, '/app/agents') : '/app/agents', {
          replace: true,
        });
        return;
      }
      navigate(resolvePostLoginPath(intent), { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败，请稍后重试');
    }
  };

  const promoTitle = gnomicContext
    ? '登录后继续 Gnomic 模板创作'
    : agentsyunContext
      ? '登录后打开 Agent云 Token 工场'
      : '免费试用智能体，连接 Hz-Hermes';

  const modal = (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/45"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-modal-title"
        className="bg-white w-full max-w-[860px] rounded-[20px] shadow-[0_24px_64px_rgba(15,23,42,0.18)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative overflow-hidden bg-gradient-to-br from-[#EAF3FF] via-[#F3F8FF] to-[#E8F0FF] px-6 pt-5 pb-16">
          <div
            className="pointer-events-none absolute -left-8 top-6 h-24 w-24 rounded-full bg-[#B9D6FF]/35 blur-2xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute right-10 top-2 h-20 w-20 rounded-full bg-[#9CC4FF]/30 blur-2xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute right-24 bottom-0 text-[72px] font-black leading-none text-[#2B6BFF]/10 select-none"
            aria-hidden
          >
            FREE
          </div>

          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/70 text-black/55 backdrop-blur hover:bg-white hover:text-black transition-colors"
            aria-label="关闭"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="relative flex flex-col items-center gap-3 pt-1">
            <span className="rounded-full border border-dashed border-[#7EB0FF]/70 bg-white/55 px-4 py-1 text-[11px] text-[#3D6FD6]">
              新用户登录即送 AI 智能体体验包
            </span>
            <div className="rounded-full bg-[#1F4FD8] px-6 py-2 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(31,79,216,0.28)]">
              {promoTitle}
            </div>
            <span className="rounded-full border border-[#A9C8FF] bg-white/70 px-4 py-1 text-[11px] text-[#4B74D8]">
              登录后可直接使用智能体并连接 Hz-Hermes
            </span>
          </div>
        </div>

        <div className="-mt-10 relative mx-5 mb-5 rounded-[18px] border border-black/[0.05] bg-white px-6 py-6 shadow-[0_10px_40px_rgba(15,23,42,0.06)]">
          <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_1px_minmax(0,1fr)] md:items-start">
            <section className="space-y-5">
              <h2 id="login-modal-title" className="text-center text-lg font-bold text-[#131B26]">
                手机号登录
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <label className="flex items-center gap-3 rounded-xl bg-[#F5F6F8] px-4 py-3.5">
                  <span className="shrink-0 text-sm font-medium text-black/70">+86</span>
                  <span className="h-4 w-px bg-black/10" aria-hidden />
                  <input
                    type="tel"
                    inputMode="numeric"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="请输入手机号"
                    className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-black/35"
                  />
                </label>

                <label className="flex items-center gap-2 rounded-xl bg-[#F5F6F8] px-3 py-2.5">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="请输入验证码"
                    maxLength={6}
                    className="min-w-0 flex-1 bg-transparent px-1 py-1.5 text-sm outline-none placeholder:text-black/35 tracking-widest"
                  />
                  <button
                    type="button"
                    onClick={handleSendCode}
                    disabled={sendingCode || countdown > 0}
                    className="shrink-0 rounded-lg border border-[#D8E4FF] bg-white px-3 py-2 text-xs font-medium text-[#2B6BFF] transition-colors hover:bg-[#F5F8FF] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {countdown > 0 ? `${countdown}s` : codeSent ? '重新发送' : '获取验证码'}
                  </button>
                </label>

                {error ? <p className="text-xs text-red-600">{error}</p> : null}

                <button
                  type="submit"
                  className="w-full rounded-xl bg-[#2B6BFF] py-3.5 text-sm font-semibold text-white transition-colors hover:bg-[#245FE6]"
                >
                  登录 / 注册
                </button>
              </form>

              <p className="text-center text-[11px] leading-relaxed text-black/40">
                演示账号：{DEMO_PHONE} · 验证码 {DEMO_CODE}
              </p>
            </section>

            <div className="hidden md:block w-px self-stretch bg-black/[0.06]" aria-hidden />

            <section className="space-y-4">
              <h3 className="text-center text-lg font-bold text-[#131B26]">微信扫码登录</h3>

              <div className="mx-auto flex w-full max-w-[220px] flex-col items-center gap-3">
                <div className="rounded-2xl border border-black/[0.05] bg-white p-3 shadow-[0_8px_24px_rgba(15,23,42,0.08)]">
                  <img
                    src={WECHAT_QR_SRC}
                    alt="微信登录二维码"
                    className="h-[180px] w-[180px] object-contain"
                  />
                </div>
                <p className="text-center text-xs text-black/45">使用微信扫码快捷登录</p>
              </div>
            </section>
          </div>

          <p className="mt-6 text-center text-[11px] leading-relaxed text-black/40">
            登录即代表同意
            <a href="#" className="text-[#2B6BFF] hover:underline">
              《用户协议》
            </a>
            和
            <a href="#" className="text-[#2B6BFF] hover:underline">
              《隐私政策》
            </a>
            ，未注册手机号将自动注册
          </p>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
