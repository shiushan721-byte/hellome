import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Cloud,
  Download,
  ExternalLink,
  Laptop,
  RefreshCw,
} from 'lucide-react';
import {
  getCurrentAccountId,
  getHermesConnection,
  pairHermesWithCurrentAccount,
  refreshHermesConnection,
  subscribeHermesConnection,
} from '../lib/hermesConnection';
import {
  buildOnboardingState,
  HERMES_DOWNLOAD_URL,
  type FirstRunHermesStatus,
} from '../lib/firstRunOnboarding';
import {
  parseIntentFromSearchParams,
  replayPendingIntent,
  stashIntent,
} from '../lib/pendingAgentIntent';
import { getProfile, subscribeProfile } from '../lib/profileStore';

const FAQ = [
  {
    q: '为什么需要安装 Hz-Hermes？',
    a: '因为很多智能体任务需要在你的电脑上打开网页、连接平台或处理本地文件。Hz-Hermes 就是负责执行这些动作的引擎。',
  },
  {
    q: 'HelloMe 和 Hz-Hermes 是什么关系？',
    a: 'HelloMe 是你发起任务和查看结果的地方，Hz-Hermes 是帮你执行任务的本地引擎。',
  },
  {
    q: '一键配对安全吗？',
    a: '配对只会把当前 HelloMe 账号和你的 Hz-Hermes 连接起来。执行高风险动作前，系统仍会要求你确认。',
  },
] as const;

const STATUS_COPY: Record<
  FirstRunHermesStatus,
  { title: string; desc: string; tone: 'neutral' | 'warn' | 'success' }
> = {
  not_connected: {
    title: '尚未连接 Hz-Hermes',
    desc: '请先下载并安装 Hz-Hermes，然后使用同一个账号登录。',
    tone: 'neutral',
  },
  waiting_pairing: {
    title: '等待 Hz-Hermes 配对',
    desc: '请在 Hz-Hermes 中点击“一键配对 HelloMe”。',
    tone: 'neutral',
  },
  account_mismatch: {
    title: '账号不一致，无法配对',
    desc: '请确认 HelloMe 和 Hz-Hermes 登录的是同一个账号。',
    tone: 'warn',
  },
  offline: {
    title: 'Hz-Hermes 当前未在线',
    desc: '请打开 Hz-Hermes，确认已登录当前账号。',
    tone: 'warn',
  },
  connected: {
    title: 'Hz-Hermes 已连接',
    desc: '现在可以开始使用智能体。',
    tone: 'success',
  },
};

export default function ConnectHermesPage({ embedded = false }: { embedded?: boolean }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [checking, setChecking] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const snapshot = useSyncExternalStore(
    subscribeHermesConnection,
    getHermesConnection,
    getHermesConnection,
  );
  const profile = useSyncExternalStore(subscribeProfile, getProfile, getProfile);
  const account = getCurrentAccountId();

  const onboarding = useMemo(
    () => buildOnboardingState(snapshot, account, profile.nickname),
    [snapshot, account, profile.nickname],
  );

  const status = onboarding.hermesStatus;
  const forceOffline = searchParams.get('status') === 'offline';
  const displayStatus: FirstRunHermesStatus =
    forceOffline && status !== 'connected' ? 'offline' : status;

  useEffect(() => {
    const intent = parseIntentFromSearchParams(searchParams);
    if (intent.agentId || intent.action || intent.redirect) {
      stashIntent(intent);
    }
  }, [searchParams]);

  const finishPairing = () => {
    navigate(replayPendingIntent(), { replace: true });
  };

  useEffect(() => {
    if (snapshot.status === 'connected' && !forceOffline) {
      if (!embedded) {
        finishPairing();
      }
    }
  }, [snapshot.status, forceOffline, embedded]);

  const handleRefresh = async () => {
    setChecking(true);
    window.setTimeout(() => {
      const next = refreshHermesConnection();
      setChecking(false);
      if (next.status === 'connected') {
        finishPairing();
      }
    }, 600);
  };

  const handlePair = () => {
    const next = pairHermesWithCurrentAccount();
    if (next.status === 'connected') {
      finishPairing();
    }
  };

  const enterWorkbench = () => {
    finishPairing();
  };

  return (
    <div
      className={
        embedded
          ? 'p-4 sm:p-6 lg:p-8 w-full'
          : 'min-h-screen bg-[#F5F6F8] text-[#1A1A1A] p-4 sm:p-6 lg:p-10'
      }
    >
      <div className="max-w-5xl mx-auto space-y-6">
        <header className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-black/40">HelloMe</p>
          <h1 className="text-3xl sm:text-4xl font-bold font-display">连接你的个人智能引擎</h1>
          <p className="text-sm sm:text-base text-black/55 max-w-2xl">
            HelloMe 负责发起任务，Hz-Hermes 负责在你的电脑上执行任务。
          </p>
        </header>

        <section className="bg-white border border-black/10 rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">HelloMe 与 Hz-Hermes</h2>
            <p className="text-sm text-black/60 leading-relaxed">
              HelloMe 的 Me，代表你的个人执行引擎 Hz-Hermes。安装并配对后，你可以在 HelloMe
              里选择智能体、发起任务、查看过程和结果。
            </p>
            <p className="text-sm text-black/55 leading-relaxed">
              你在 HelloMe 里告诉智能体要做什么，Hz-Hermes 会在你的电脑上帮你把任务跑起来。
            </p>
          </div>

          <div className="flex items-center justify-center gap-4 py-4">
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="w-14 h-14 rounded-2xl bg-[#F2F0ED] flex items-center justify-center">
                <Cloud className="w-6 h-6 text-black/55" />
              </div>
              <p className="text-xs font-bold">HelloMe</p>
              <p className="text-[10px] text-black/45">云端入口</p>
            </div>
            <div className="h-px w-10 sm:w-16 bg-black/15 relative">
              <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[10px] text-black/35">
                配对
              </span>
            </div>
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="w-14 h-14 rounded-2xl bg-[#F2F0ED] flex items-center justify-center">
                <Laptop className="w-6 h-6 text-black/55" />
              </div>
              <p className="text-xs font-bold">Hz-Hermes</p>
              <p className="text-[10px] text-black/45">本地电脑</p>
            </div>
          </div>

          <div className="border-t border-black/8 pt-6 space-y-4">
            <h2 className="text-sm font-semibold">三步开始</h2>
            <div className="grid sm:grid-cols-3 gap-3">
              <StepCard step="1" title="下载 Hz-Hermes" desc="下载 Windows 版并安装。" />
              <StepCard step="2" title="登录同一个账号" desc="使用当前 HelloMe 账号登录 Hz-Hermes。" />
              <StepCard step="3" title="一键配对" desc="在 Hz-Hermes 中点击一键配对。" />
            </div>
            <p className="text-[11px] text-black/40">macOS 和 Linux 版本即将推出</p>
          </div>
        </section>

        <section
          className={`rounded-2xl border p-5 sm:p-6 space-y-4 ${
            STATUS_COPY[displayStatus].tone === 'success'
              ? 'bg-emerald-50 border-emerald-200'
              : STATUS_COPY[displayStatus].tone === 'warn'
                ? 'bg-amber-50 border-amber-200'
                : 'bg-white border-black/10'
          }`}
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="text-xs text-black/45">
                HelloMe 账号：<span className="font-mono text-black/70">{account || '未识别'}</span>
              </p>
              <h3 className="text-base font-semibold flex items-center gap-2">
                {displayStatus === 'connected' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : displayStatus === 'account_mismatch' || displayStatus === 'offline' ? (
                  <AlertTriangle className="w-4 h-4 text-amber-700" />
                ) : null}
                {checking ? '检测中…' : STATUS_COPY[displayStatus].title}
              </h3>
              <p className="text-sm text-black/55">{STATUS_COPY[displayStatus].desc}</p>
              {snapshot.lastError ? (
                <p className="text-xs text-rose-700">{snapshot.lastError}</p>
              ) : null}
            </div>
            <p className="text-[10px] text-black/40 uppercase tracking-wider">
              配对状态 · {checking ? '检测中' : displayStatus === 'connected' ? '已连接' : '未连接'}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {(displayStatus === 'not_connected' || displayStatus === 'waiting_pairing') && (
              <>
                <a
                  href={HERMES_DOWNLOAD_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 h-9 rounded-lg bg-black text-white text-sm font-medium"
                >
                  <Download className="w-3.5 h-3.5" />
                  下载 Hz-Hermes
                </a>
                <button
                  type="button"
                  onClick={handleRefresh}
                  className="inline-flex items-center gap-1.5 px-4 h-9 rounded-lg border border-black/12 bg-white text-sm font-medium"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${checking ? 'animate-spin' : ''}`} />
                  {displayStatus === 'not_connected' ? '我已安装，重新检测' : '重新检测'}
                </button>
                {displayStatus === 'waiting_pairing' ? (
                  <button
                    type="button"
                    onClick={handlePair}
                    className="inline-flex items-center gap-1.5 px-4 h-9 rounded-lg border border-black/12 bg-white text-sm font-medium"
                  >
                    我已完成一键配对
                  </button>
                ) : null}
              </>
            )}

            {(displayStatus === 'waiting_pairing' || displayStatus === 'offline') && (
              <button
                type="button"
                onClick={handleRefresh}
                className="inline-flex items-center gap-1.5 px-4 h-9 rounded-lg border border-black/12 bg-white text-sm font-medium"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                打开 Hz-Hermes
              </button>
            )}

            {displayStatus === 'account_mismatch' && (
              <button
                type="button"
                onClick={handleRefresh}
                className="inline-flex items-center gap-1.5 px-4 h-9 rounded-lg bg-black text-white text-sm font-medium"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                我已切换账号，重新检测
              </button>
            )}

            {displayStatus === 'connected' && (
              <button
                type="button"
                onClick={enterWorkbench}
                className="inline-flex items-center gap-1.5 px-4 h-9 rounded-lg bg-black text-white text-sm font-medium"
              >
                进入工作台
              </button>
            )}
          </div>
        </section>

        <section className="bg-white border border-black/10 rounded-2xl p-5 sm:p-6 space-y-2">
          <h2 className="text-sm font-semibold mb-3">常见问题</h2>
          {FAQ.map((item, index) => (
            <div key={item.q} className="border-t border-black/8 first:border-t-0">
              <button
                type="button"
                onClick={() => setOpenFaq(openFaq === index ? null : index)}
                className="w-full py-3 flex items-center justify-between gap-3 text-left text-sm font-medium"
              >
                {item.q}
                <ChevronDown
                  className={`w-4 h-4 shrink-0 text-black/35 transition-transform ${
                    openFaq === index ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {openFaq === index ? (
                <p className="pb-3 text-sm text-black/55 leading-relaxed">{item.a}</p>
              ) : null}
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}

function StepCard({ step, title, desc }: { step: string; title: string; desc: string }) {
  return (
    <div className="flex gap-3 rounded-xl bg-[#F6F8FA] border border-black/8 p-3">
      <span className="w-6 h-6 rounded-full bg-black text-white text-xs font-bold flex items-center justify-center shrink-0">
        {step}
      </span>
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-xs text-black/50 mt-0.5">{desc}</p>
      </div>
    </div>
  );
}
