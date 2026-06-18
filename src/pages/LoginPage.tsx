import { useState, useEffect, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Zap, ArrowRight } from 'lucide-react';
import {
  isAuthenticated,
  loginWithPhone,
  verifyDemoCode,
  DEMO_PHONE,
  DEMO_CODE,
} from '../lib/auth';
import { isHermesConnected } from '../lib/firstRunOnboarding';
import {
  parseIntentFromSearchParams,
  resolvePostLoginPath,
  replayPendingIntent,
} from '../lib/pendingAgentIntent';

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [phone, setPhone] = useState(DEMO_PHONE);
  const [code, setCode] = useState(DEMO_CODE);
  const [error, setError] = useState('');
  const [codeSent, setCodeSent] = useState(true);

  useEffect(() => {
    if (!isAuthenticated()) return;
    const intent = parseIntentFromSearchParams(searchParams);
    if (isHermesConnected()) {
      navigate(replayPendingIntent(), { replace: true });
    } else {
      navigate(resolvePostLoginPath(intent), { replace: true });
    }
  }, [navigate, searchParams]);

  const handleSendCode = () => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length !== 11) {
      setError('请输入 11 位手机号');
      return;
    }
    setError('');
    setCode(DEMO_CODE);
    setCodeSent(true);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError('');

    const digits = phone.replace(/\D/g, '') || DEMO_PHONE;
    const verifyCode = code.trim() || DEMO_CODE;

    if (!verifyDemoCode(digits, verifyCode)) {
      setError(`验证码错误。演示环境请使用 ${DEMO_CODE}`);
      return;
    }

    loginWithPhone(digits);
    const intent = parseIntentFromSearchParams(searchParams);
    navigate(resolvePostLoginPath(intent), { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#FDFCFB] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-3 mb-10 justify-center">
          <div className="w-10 h-10 bg-black flex items-center justify-center">
            <Zap className="w-5 h-5 text-white fill-white" />
          </div>
          <div className="flex flex-col leading-none gap-1">
            <span className="text-xl font-bold font-display">
              Hello<span className="font-serif italic font-semibold">Me</span>
            </span>
            <span className="text-[11px] text-black/45 tracking-[0.18em]">哈啰蜜</span>
          </div>
        </div>

        <div className="bg-white border border-black/8 p-8 space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold font-display">手机号登录</h1>
            <p className="text-sm text-black/50">登录后启用智能体并连接 Hz-Hermes</p>
          </div>

          <div className="text-[11px] text-black/45 bg-[#F2F0ED] px-3 py-2 leading-relaxed">
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
                className="w-full py-3 px-4 text-sm bg-[#F2F0ED] outline-none focus:ring-1 focus:ring-black/20 font-mono"
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
                  className="flex-1 py-3 px-4 text-sm bg-[#F2F0ED] outline-none focus:ring-1 focus:ring-black/20 font-mono tracking-widest"
                />
                <button
                  type="button"
                  onClick={handleSendCode}
                  className="shrink-0 px-4 py-3 text-xs font-bold border border-black/15 hover:bg-[#F2F0ED] transition-colors"
                >
                  {codeSent ? '重新发送' : '获取验证码'}
                </button>
              </div>
            </div>

            {error && <p className="text-xs text-red-600">{error}</p>}

            <button
              type="submit"
              className="w-full py-3 bg-black text-white text-sm font-bold flex items-center justify-center gap-2 hover:bg-black/85 transition-colors"
            >
              登录
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <p className="text-[11px] text-black/40 text-center">
            <Link to="/agents" className="hover:text-black underline mr-3">
              浏览智能体市场
            </Link>
            <Link to="/" className="hover:text-black underline">
              返回官网首页
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
