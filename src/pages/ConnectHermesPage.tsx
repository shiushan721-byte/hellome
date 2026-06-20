import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Cloud,
  Download,
  Laptop,
  LoaderCircle,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import {
  getCurrentAccountId,
  getHermesConnection,
  pairHermesLocallyWithCurrentAccount,
  syncHermesConnection,
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
    title: '尚未安装 Hermes',
    desc: '首次使用需要先安装 Hermes。安装完成后会继续当前智能体任务。',
    tone: 'neutral',
  },
  waiting_pairing: {
    title: '等待连接当前账号',
    desc: 'Hermes 已准备好，下一步只需要连接到当前 HelloMe 账号。',
    tone: 'neutral',
  },
  account_mismatch: {
    title: '账号不一致，暂时无法连接',
    desc: '请确认 HelloMe 和 Hermes 登录的是同一个账号。',
    tone: 'warn',
  },
  service_unavailable: {
    title: 'Hermes 检测服务暂时不可用',
    desc: '当前无法确认本机 Hermes 状态，这不等于未安装。请先重新检测。',
    tone: 'warn',
  },
  offline: {
    title: 'Hermes 当前未启动',
    desc: '已检测到 Hermes，但它现在没有在线。启动后会继续当前任务。',
    tone: 'warn',
  },
  connected: {
    title: 'Hermes 已连接',
    desc: '现在可以开始使用智能体。',
    tone: 'success',
  },
};

function getPrepareActionCopy(status: FirstRunHermesStatus): string {
  if (status === 'not_connected') return '安装 Hermes 并继续';
  if (status === 'service_unavailable') return '重新检测 Hermes';
  if (status === 'offline') return '启动智能体';
  if (status === 'connected') return '进入工作台';
  return '连接智能体';
}

export default function ConnectHermesPage({ embedded = false }: { embedded?: boolean }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [checking, setChecking] = useState(false);
  const [preparing, setPreparing] = useState(false);
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
  const forceServiceUnavailable = searchParams.get('status') === 'service_unavailable';
  const displayStatus: FirstRunHermesStatus =
    forceServiceUnavailable && status !== 'connected'
      ? 'service_unavailable'
      : forceOffline && status !== 'connected'
        ? 'offline'
        : status;

  useEffect(() => {
    const intent = parseIntentFromSearchParams(searchParams);
    if (intent.agentId || intent.action || intent.redirect) {
      stashIntent(intent);
    }
  }, [searchParams]);

  useEffect(() => {
    void syncHermesConnection();
  }, [account]);

  const finishPairing = () => {
    navigate(replayPendingIntent(), { replace: true });
  };

  useEffect(() => {
    if (snapshot.status === 'connected' && !forceOffline && !forceServiceUnavailable) {
      if (!embedded) {
        finishPairing();
      }
    }
  }, [snapshot.status, forceOffline, forceServiceUnavailable, embedded]);

  const handleRefresh = async () => {
    setChecking(true);
    const next = await syncHermesConnection();
    setChecking(false);
    if (next.status === 'connected') {
      finishPairing();
    }
  };

  const handlePrepare = async () => {
    setPreparing(true);
    try {
      if (displayStatus === 'service_unavailable') {
        const next = await syncHermesConnection();
        if (next.status === 'connected') {
          finishPairing();
        }
        return;
      }

      if (displayStatus === 'not_connected') {
        window.open(HERMES_DOWNLOAD_URL, '_blank', 'noopener,noreferrer');
        const next = await syncHermesConnection();
        if (next.status === 'connected') {
          finishPairing();
        }
        return;
      }

      if (displayStatus === 'offline') {
        const next = await syncHermesConnection();
        if (next.status === 'connected') {
          finishPairing();
        }
        return;
      }

      const next = await pairHermesLocallyWithCurrentAccount(profile.nickname);
      if (next.status === 'connected') {
        finishPairing();
      }
    } finally {
      setPreparing(false);
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
          <h1 className="text-3xl sm:text-4xl font-bold font-display">启动你的个人智能体环境</h1>
          <p className="text-sm sm:text-base text-black/55 max-w-2xl">
            登录即注册。首次使用时，HelloMe 会引导你准备 Hermes 环境，并尽量把下载、启动、连接这些动作合并成一次完成。
          </p>
        </header>

        <section className="bg-white border border-black/10 rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#F5F6F8] px-3 py-1 text-[11px] font-semibold text-black/55">
              <Sparkles className="w-3.5 h-3.5" />
              自动准备模式
            </div>
            <h2 className="text-lg font-semibold">HelloMe 与 Hermes 的关系</h2>
            <p className="text-sm text-black/60 leading-relaxed">
              HelloMe 负责理解你的目标、组织任务和展示结果，Hermes 负责在你的电脑上执行需要本地权限的动作。
            </p>
            <p className="text-sm text-black/55 leading-relaxed">
              你只需要点一次“启动智能体”。如果这是第一次使用，系统会先带你完成环境准备，再自动回到当前任务。
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
            <h2 className="text-sm font-semibold">系统会自动完成这些准备</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              <StepCard step="1" title="准备 Hermes 客户端" desc="首次使用时自动引导下载安装。" />
              <StepCard step="2" title="连接当前账号" desc="尽量静默完成账号识别与配对。" />
              <StepCard step="3" title="恢复任务上下文" desc="准备完成后自动回到你的智能体任务。" />
              <StepCard step="4" title="开始执行" desc="进入工作台后直接开始使用智能体。" />
            </div>
            <p className="text-[11px] text-black/40">早期阶段仍要求本机安装 Hermes，但不再要求你先理解整套流程。</p>
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
            {displayStatus !== 'connected' ? (
              <button
                type="button"
                onClick={() => {
                  void handlePrepare();
                }}
                disabled={preparing}
                className="inline-flex items-center gap-1.5 px-4 h-9 rounded-lg bg-black text-white text-sm font-medium disabled:opacity-70"
              >
                {preparing ? (
                  <LoaderCircle className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                {preparing ? '准备中…' : getPrepareActionCopy(displayStatus)}
              </button>
            ) : null}

            {displayStatus !== 'connected' ? (
              <button
                type="button"
                onClick={handleRefresh}
                className="inline-flex items-center gap-1.5 px-4 h-9 rounded-lg border border-black/12 bg-white text-sm font-medium"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${checking ? 'animate-spin' : ''}`} />
                重新检测
              </button>
            ) : null}

            {displayStatus !== 'connected' ? (
              <a
                href={HERMES_DOWNLOAD_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 h-9 rounded-lg border border-black/12 bg-white text-sm font-medium"
              >
                <Download className="w-3.5 h-3.5" />
                单独下载 Hermes
              </a>
            ) : null}

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
