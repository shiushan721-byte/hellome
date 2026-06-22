import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, X, Zap } from 'lucide-react';
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

export default function LoginModal({ intent = {}, onClose }: LoginModalProps) {
  const navigate = useNavigate();
  const [phone, setPhone] = useState(DEMO_PHONE);
  const [code, setCode] = useState(DEMO_CODE);
  const [error, setError] = useState('');
  const [codeSent, setCodeSent] = useState(true);

  const gnomicContext = Boolean(intent.gnomic);
  const agentsyunContext = Boolean(intent.agentsyun);
  const contextual = Boolean(
    gnomicContext ||
      agentsyunContext ||
      intent.agentId ||
      intent.action === 'use' ||
      intent.action === 'enter',
  );
  const title = gnomicContext
    ? '登录后继续使用 Gnomic 模板'
    : agentsyunContext
      ? '登录后打开 Agent云 Token 工场'
      : contextual
        ? '登录后继续使用'
        : '手机号登录';
  const subtitle = gnomicContext
    ? '登录 HelloMe 后，可直接跳转到已登录的 Gnomic 工作台使用模板。'
    : agentsyunContext
      ? '登录 HelloMe 后，可直接跳转到已登录的 Agent云 大模型 API 平台。'
      : contextual
        ? '登录 HelloMe 后，你可以连接 Hz-Hermes，并让智能体在你的电脑上执行任务。'
        : '登录后连接 Hz-Hermes，并直接使用智能体';

  const handleSendCode = async () => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length !== 11) {
      setError('请输入 11 位手机号');
      return;
    }
    setError('');
    try {
      await requestLoginCode(digits);
    } catch {
      if (!verifyDemoCode(digits, DEMO_CODE)) {
        setError('验证码发送失败，演示账号可直接使用预填验证码登录');
      }
    }
    setCode(DEMO_CODE);
    setCodeSent(true);
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

  const modal = (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/40"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-modal-title"
        className="bg-white w-full max-w-md rounded-2xl border border-black/[0.06] shadow-[0_12px_32px_rgba(0,0,0,0.12)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 pt-6 pb-2">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-black flex items-center justify-center rounded-lg shrink-0">
              <Zap className="w-4 h-4 text-white fill-white" />
            </div>
            <div className="flex flex-col leading-none gap-0.5">
              <span className="text-base font-bold font-display">
                Hello<span className="font-serif italic font-semibold">Me</span>
              </span>
              <span className="text-[10px] text-black/45 tracking-[0.15em]">哈啰蜜</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-black/45 hover:bg-[#f7f7f8] hover:text-black transition-colors"
            aria-label="关闭"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 pb-6 pt-4 space-y-5">
          <div className="space-y-1.5">
            <h2 id="login-modal-title" className="text-xl font-bold font-display">
              {title}
            </h2>
            <p className="text-sm text-black/50 leading-relaxed">{subtitle}</p>
            {contextual && !gnomicContext && !agentsyunContext && (
              <p className="text-xs text-black/45 leading-relaxed pt-1">
                登录不会自动发起任务，任务执行前会展示预计 Token 消耗。
              </p>
            )}
          </div>

          <div className="text-[11px] text-black/45 bg-[#F2F0ED] px-3 py-2 leading-relaxed rounded-lg">
            演示账号已预填：手机号 <span className="font-mono font-bold text-black">{DEMO_PHONE}</span>
            ，验证码 <span className="font-mono font-bold text-black">{DEMO_CODE}</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-black/50 mb-1.5">手机号</label>
              <input
                type="tel"
                inputMode="numeric"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="请输入手机号"
                className="w-full py-3 px-4 text-sm bg-[#F2F0ED] rounded-lg outline-none focus:ring-1 focus:ring-black/20 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-black/50 mb-1.5">验证码</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  inputMode="numeric"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="6 位验证码"
                  maxLength={6}
                  className="flex-1 py-3 px-4 text-sm bg-[#F2F0ED] rounded-lg outline-none focus:ring-1 focus:ring-black/20 font-mono tracking-widest"
                />
                <button
                  type="button"
                  onClick={handleSendCode}
                  className="shrink-0 px-4 py-3 text-xs font-bold border border-black/15 hover:bg-[#F2F0ED] rounded-lg transition-colors"
                >
                  {codeSent ? '重新发送' : '获取验证码'}
                </button>
              </div>
            </div>

            {error && <p className="text-xs text-red-600">{error}</p>}

            <button
              type="submit"
              className="w-full py-3 bg-black text-white text-sm font-bold flex items-center justify-center gap-2 hover:bg-black/85 rounded-lg transition-colors"
            >
              登录
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
