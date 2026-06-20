import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  ExternalLink,
  LoaderCircle,
  Sparkles,
} from 'lucide-react';
import type { HermesConnectionStatus } from '../../lib/hermesConnection';
import {
  pairHermesLocallyWithCurrentAccount,
  syncHermesConnection,
} from '../../lib/hermesConnection';
import { HERMES_DOWNLOAD_URL } from '../../lib/firstRunOnboarding';
import { createPortal } from 'react-dom';

type PreparePhase =
  | 'idle'
  | 'downloading'
  | 'opening'
  | 'pairing'
  | 'checking'
  | 'ready'
  | 'error';

function getPrimaryActionCopy(status: HermesConnectionStatus): string {
  if (status === 'connected') return '开始使用智能体';
  if (status === 'api_unavailable') return '重新检测 Hermes';
  if (status === 'capability_missing') return '安装 Hermes 并继续';
  if (status === 'offline') return '启动智能体';
  return '连接智能体';
}

function getStatusHint(status: HermesConnectionStatus): string {
  if (status === 'api_unavailable') return 'Hermes 检测服务暂时不可用，请先重新检测；这不等于本机未安装 Hermes。';
  if (status === 'capability_missing') return '当前还未检测到 Hermes 客户端，需要先安装一次。';
  if (status === 'offline') return '已检测到 Hermes，但它现在没有在线，可以直接启动并继续。';
  if (status === 'account_mismatch') return '检测到设备登录账号与当前 HelloMe 账号不一致，需要切换后再连接。';
  if (status === 'not_paired' || status === 'pairing') return '客户端已准备好，正在等待连接当前账号。';
  return '系统准备完成。';
}

export default function HermesActionModal({
  status,
  onClose,
  onOpenHermes,
  onPairedComplete,
  variant = 'default',
}: {
  status: HermesConnectionStatus;
  onClose: () => void;
  onOpenHermes: () => void;
  onGoPair?: () => void;
  onPairedComplete?: () => void;
  variant?: 'default' | 'pairing';
}) {
  const [phase, setPhase] = useState<PreparePhase>('idle');
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    if (status === 'connected') {
      setPhase('ready');
      setActionError('');
      return;
    }
    setPhase((current) => (current === 'ready' ? 'idle' : current));
  }, [status]);

  useEffect(() => {
    if (!['downloading', 'opening', 'pairing', 'checking'].includes(phase)) return;
    if (status === 'connected') return;

    const timer = window.setTimeout(() => {
      void syncHermesConnection().catch(() => undefined);
    }, 1800);

    return () => window.clearTimeout(timer);
  }, [phase, status]);

  const pairingMode = variant === 'pairing' || status === 'not_paired' || status === 'account_mismatch';
  const preparing = ['downloading', 'opening', 'pairing', 'checking'].includes(phase);

  const stepStates = useMemo(() => {
    const hermesClientReady = status !== 'capability_missing' && status !== 'api_unavailable';
    const accountLinked = status === 'connected' || status === 'offline' || status === 'not_paired' || status === 'pairing';
    const executionReady = status === 'connected';

    return [
      {
        id: 'auth',
        title: '登录 HelloMe',
        description: '登录即注册，当前账号将直接作为智能体身份。',
        state: 'done' as const,
      },
      {
        id: 'client',
        title: '准备 Hermes 环境',
        description: hermesClientReady
          ? '已检测到 Hermes 运行环境。'
          : status === 'api_unavailable'
            ? '当前无法确认 Hermes 运行时状态，需要先恢复检测服务。'
            : '首次使用会自动拉起下载页并完成安装准备。',
        state:
          status === 'capability_missing'
            ? phase === 'downloading'
              ? ('active' as const)
              : ('pending' as const)
            : status === 'api_unavailable'
              ? ('warn' as const)
            : ('done' as const),
      },
      {
        id: 'pairing',
        title: '连接当前账号',
        description:
          status === 'account_mismatch'
            ? '当前设备账号不一致，需要切换到当前 HelloMe 账号。'
            : accountLinked
              ? '系统会尽量静默完成连接与配对。'
              : '准备就绪后会自动尝试连接。',
        state:
          status === 'connected'
            ? ('done' as const)
            : status === 'account_mismatch'
              ? ('warn' as const)
              : phase === 'pairing' || pairingMode
                ? ('active' as const)
                : ('pending' as const),
      },
      {
        id: 'run',
        title: '启动智能体',
        description: executionReady ? '环境已就绪，可以直接进入任务执行。' : '完成后会自动回到当前智能体任务。',
        state:
          status === 'connected'
            ? ('done' as const)
            : phase === 'checking' || phase === 'opening'
              ? ('active' as const)
              : ('pending' as const),
      },
    ];
  }, [pairingMode, phase, status]);

  const title =
    status === 'connected'
      ? '智能体环境已就绪'
      : status === 'api_unavailable'
        ? 'Hermes 检测服务异常'
      : status === 'capability_missing'
        ? '先安装 Hermes，再继续当前智能体'
        : status === 'offline'
          ? '先启动 Hermes，再继续当前智能体'
          : '先连接 Hermes，再继续当前智能体';

  const desc =
    status === 'connected'
      ? 'Hermes 已连接完成，接下来可以直接进入当前智能体工作台。'
      : 'HelloMe 会按当前状态引导你完成最少的一步动作。只有在未安装、未启动或未连接时，才会提示你补齐对应环节。';

  const primaryLabel =
    status === 'connected'
      ? '开始使用智能体'
      : preparing
        ? '准备中...'
        : getPrimaryActionCopy(status);

  async function handlePrimaryAction() {
    if (status === 'connected') {
      onPairedComplete?.();
      return;
    }

    setActionError('');

    try {
      if (status === 'api_unavailable') {
        setPhase('checking');
        await syncHermesConnection();
        return;
      }

      if (status === 'capability_missing') {
        setPhase('downloading');
        window.open(HERMES_DOWNLOAD_URL, '_blank', 'noopener,noreferrer');
        onOpenHermes();
        setPhase('checking');
        await syncHermesConnection();
        return;
      }

      if (status === 'offline') {
        setPhase('opening');
        onOpenHermes();
        setPhase('checking');
        await syncHermesConnection();
        return;
      }

      setPhase('pairing');
      await pairHermesLocallyWithCurrentAccount();
      const next = await syncHermesConnection();
      if (next.status === 'connected') {
        setPhase('ready');
        onPairedComplete?.();
        return;
      }
      setPhase('checking');
    } catch (error) {
      setPhase('error');
      setActionError(error instanceof Error ? error.message : '环境准备失败，请重试');
    }
  }

  const modal = (
    <div className="fixed inset-0 z-[70] bg-black/35 flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-white border border-black/10 rounded-[28px] shadow-xl p-5 sm:p-6 space-y-5">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#F5F6F8] px-3 py-1 text-[11px] font-semibold text-black/55">
              <Sparkles className="w-3.5 h-3.5" />
              自动准备模式
            </div>
            <div>
              <h3 className="text-xl font-semibold">{title}</h3>
              <p className="text-sm text-black/55 mt-1 leading-relaxed">{desc}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl border border-black/10 text-black/55 hover:bg-[#F2F0ED]"
            aria-label="关闭"
          >
            ×
          </button>
        </div>

        <div className="rounded-2xl border border-black/8 bg-[#F7F8FA] p-4 space-y-3">
          {stepStates.map((step) => (
            <div key={step.id} className="flex items-start gap-3">
              <StepStateIcon state={step.state} />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-black">{step.title}</p>
                <p className="text-xs text-black/50 mt-0.5 leading-relaxed">{step.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-black/8 bg-white px-4 py-3">
          <p className="text-xs font-semibold text-black/70">当前状态</p>
          <p className="text-sm text-black/55 mt-1 leading-relaxed">{getStatusHint(status)}</p>
          {status === 'capability_missing' ? (
            <p className="text-xs text-black/40 mt-2">
              安装完成后回到当前页面，HelloMe 会继续检测并连接当前账号。
            </p>
          ) : null}
          {status === 'api_unavailable' ? (
            <p className="text-xs text-black/40 mt-2">
              常见原因是本地开发服务刚重启、接口未就绪，或当前页面连到的不是最新的 HelloMe 后端。
            </p>
          ) : null}
          {actionError ? <p className="text-xs text-rose-700 mt-2">{actionError}</p> : null}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              void handlePrimaryAction();
            }}
            disabled={preparing}
            className="px-4 h-11 rounded-xl bg-black text-white text-sm font-semibold hover:bg-black/90 inline-flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {preparing ? <LoaderCircle className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {primaryLabel}
          </button>

          {status !== 'connected' ? (
            <button
              type="button"
              onClick={() => {
                setActionError('');
                setPhase('checking');
                void syncHermesConnection().catch((error) => {
                  setPhase('error');
                  setActionError(error instanceof Error ? error.message : '检测失败，请稍后重试');
                });
              }}
              className="px-4 h-11 rounded-xl border border-black/12 bg-white text-sm font-medium hover:bg-black/[0.02] inline-flex items-center gap-1.5"
            >
              <ExternalLink className="w-4 h-4" />
              重新检测
            </button>
          ) : null}

          <a
            href={HERMES_DOWNLOAD_URL}
            target="_blank"
            rel="noreferrer"
            className="px-4 h-11 rounded-xl border border-black/12 bg-white text-sm font-medium hover:bg-black/[0.02] inline-flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" />
            下载 Hermes
          </a>

          <button
            type="button"
            onClick={onClose}
            className="px-4 h-11 rounded-xl border border-black/12 bg-white text-sm font-medium hover:bg-black/[0.02]"
          >
            稍后再说
          </button>
        </div>

        {status !== 'connected' ? (
          <p className="text-xs text-amber-700 inline-flex items-start gap-1.5 leading-relaxed">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            早期版本仍依赖本地 Hermes 执行能力。如果系统无法自动完成准备，你只需要完成安装或启动，剩下的连接动作会继续由 HelloMe 处理。
          </p>
        ) : null}
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}

function StepStateIcon({ state }: { state: 'done' | 'active' | 'pending' | 'warn' }) {
  if (state === 'done') {
    return <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />;
  }
  if (state === 'active') {
    return <LoaderCircle className="w-5 h-5 text-black/60 animate-spin shrink-0 mt-0.5" />;
  }
  if (state === 'warn') {
    return <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />;
  }
  return (
    <span className="w-5 h-5 rounded-full border border-black/15 bg-white shrink-0 mt-0.5" />
  );
}
