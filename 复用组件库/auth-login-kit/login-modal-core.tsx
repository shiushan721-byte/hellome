import { useState, type FormEvent } from 'react';
import { ArrowRight, X, Zap } from 'lucide-react';
import { createPortal } from 'react-dom';
import {
  DEFAULT_LOGIN_PHONE,
  DEMO_ACCOUNT_PRESETS,
  loginWithPhone,
  requestLoginCode,
} from './frontend-auth-core';

interface LoginModalCoreProps {
  title?: string;
  subtitle?: string;
  helperText?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function LoginModalCore({
  title = '手机号登录',
  subtitle = '登录后即可继续使用当前产品能力。',
  helperText = '当前是测试环境登录：验证码由服务端动态生成，并会自动填入输入框。',
  onClose,
  onSuccess,
}: LoginModalCoreProps) {
  const [phone, setPhone] = useState(DEFAULT_LOGIN_PHONE);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [sendHint, setSendHint] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSendCode = async () => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length !== 11) {
      setError('请输入 11 位手机号');
      return;
    }

    setError('');
    setSendHint('');
    setSendingCode(true);

    try {
      const result = await requestLoginCode(digits);
      setCodeSent(true);
      if (result.testingCode) {
        setCode(result.testingCode);
      }
      setSendHint(
        result.testingCode
          ? `测试环境验证码已生成，并已自动填入输入框：${result.testingCode}，${Math.floor(result.expiresInSec / 60)} 分钟内有效。`
          : '验证码已发送，请查看短信。',
      );
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : '验证码发送失败');
    } finally {
      setSendingCode(false);
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await loginWithPhone(phone.replace(/\D/g, ''), code.trim());
      onSuccess?.();
      onClose();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : '验证码错误，请重新获取后再试');
    } finally {
      setSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-md overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-[0_12px_32px_rgba(0,0,0,0.12)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 pb-2 pt-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-black">
              <Zap className="h-4 w-4 fill-white text-white" />
            </div>
            <div className="flex flex-col gap-0.5 leading-none">
              <span className="text-base font-bold">Auth Kit</span>
              <span className="text-[10px] tracking-[0.15em] text-black/45">REUSABLE</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-black/45 transition-colors hover:bg-[#f7f7f8] hover:text-black"
            aria-label="关闭"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 px-6 pb-6 pt-4">
          <div className="space-y-1.5">
            <h2 className="text-xl font-bold">{title}</h2>
            <p className="text-sm leading-relaxed text-black/50">{subtitle}</p>
          </div>

          <div className="rounded-lg bg-[#F2F0ED] px-3 py-2 text-[11px] leading-relaxed text-black/45">
            {helperText}
          </div>

          <div className="grid gap-2">
            {DEMO_ACCOUNT_PRESETS.map((account) => (
              <button
                key={account.phone}
                type="button"
                onClick={() => {
                  setPhone(account.phone);
                  setCode('');
                  setError('');
                  setSendHint('');
                }}
                className="w-full rounded-xl border border-black/8 bg-white px-3 py-3 text-left transition-colors hover:bg-[#F7F6F4]"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-black">{account.label}</p>
                    <p className="mt-1 text-[11px] text-black/45">{account.description}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-[10px] uppercase tracking-[0.16em] text-black/35">{account.role}</p>
                    <p className="mt-1 font-mono text-[11px] text-black/60">{account.phone}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-bold text-black/50">手机号</label>
              <input
                type="tel"
                inputMode="numeric"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="请输入手机号"
                className="w-full rounded-lg bg-[#F2F0ED] px-4 py-3 text-sm font-mono outline-none focus:ring-1 focus:ring-black/20"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-black/50">验证码</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  inputMode="numeric"
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  placeholder="6 位验证码"
                  maxLength={6}
                  className="flex-1 rounded-lg bg-[#F2F0ED] px-4 py-3 text-sm font-mono tracking-widest outline-none focus:ring-1 focus:ring-black/20"
                />
                <button
                  type="button"
                  onClick={handleSendCode}
                  disabled={sendingCode}
                  className="shrink-0 rounded-lg border border-black/15 px-4 py-3 text-xs font-bold transition-colors hover:bg-[#F2F0ED]"
                >
                  {sendingCode ? '发送中...' : codeSent ? '重新发送' : '获取验证码'}
                </button>
              </div>
            </div>

            {sendHint && <p className="text-xs text-black/55">{sendHint}</p>}
            {error && <p className="text-xs text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-black py-3 text-sm font-bold text-white transition-colors hover:bg-black/85"
            >
              {submitting ? '登录中...' : '登录'}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </div>,
    document.body,
  );
}
