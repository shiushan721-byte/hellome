import { AlertTriangle, Download, ExternalLink } from 'lucide-react';
import type { HermesConnectionStatus } from '../../lib/hermesConnection';
import { HERMES_DOWNLOAD_URL } from '../../lib/firstRunOnboarding';
import { createPortal } from 'react-dom';

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
  const isOffline = status === 'offline';
  const isNotPaired = status === 'not_paired' || status === 'account_mismatch';
  const isNotInstalled = status === 'capability_missing';
  const pairingMode = variant === 'pairing' || isNotPaired;

  const title = pairingMode
    ? '连接你的个人智能引擎'
    : isOffline
      ? 'Hz-Hermes 当前离线'
      : isNotInstalled
        ? '请先安装 Hz-Hermes'
        : '请先完成 Hz-Hermes 配对';

  const desc = pairingMode
    ? 'HelloMe 负责发起任务，Hz-Hermes 负责在你的电脑上执行任务。使用智能体前，请先下载 Hz-Hermes，并用当前 HelloMe 账号完成一键配对。'
    : isOffline
      ? '检测到 Hz-Hermes 未在线。启动 Hz-Hermes 后即可继续使用智能体功能。'
      : isNotInstalled
        ? 'HelloMe 智能体依赖 Hz-Hermes 执行。请先安装并打开 Hz-Hermes，再回到当前页面。'
        : '未检测到配对关系。请打开 Hz-Hermes 并使用同账号完成一键配对后再继续。';

  const modal = (
    <div className="fixed inset-0 z-[70] bg-black/35 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white border border-black/10 rounded-2xl shadow-xl p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold">{title}</h3>
            <p className="text-sm text-black/55 mt-1 leading-relaxed">{desc}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-md border border-black/10 text-black/55 hover:bg-[#F2F0ED]"
            aria-label="关闭"
          >
            ×
          </button>
        </div>

        {pairingMode && (
          <ol className="rounded-xl border border-black/10 bg-[#F7F9FB] p-4 space-y-2 text-sm text-black/65 list-decimal list-inside">
            <li>下载 Hz-Hermes</li>
            <li>使用同一个账号登录</li>
            <li>一键配对</li>
          </ol>
        )}

        <div className="flex flex-wrap gap-2">
          {(pairingMode || isNotInstalled) && (
            <a
              href={HERMES_DOWNLOAD_URL}
              target="_blank"
              rel="noreferrer"
              className="px-4 h-10 rounded-lg bg-black text-white text-sm font-medium hover:bg-black/90 inline-flex items-center gap-1.5"
            >
              <Download className="w-4 h-4" />
              下载 Hz-Hermes
            </a>
          )}
          {pairingMode && (
            <button
              type="button"
              onClick={() => {
                onOpenHermes();
                onPairedComplete?.();
              }}
              className="px-4 h-10 rounded-lg border border-black/12 bg-white text-sm font-medium hover:bg-black/[0.02]"
            >
              我已完成配对
            </button>
          )}
          {(isOffline || isNotInstalled || pairingMode) && (
            <button
              type="button"
              onClick={onOpenHermes}
              className="px-4 h-10 rounded-lg border border-black/12 bg-white text-sm font-medium hover:bg-black/[0.02] inline-flex items-center gap-1.5"
            >
              <ExternalLink className="w-4 h-4" />
              打开 Hz-Hermes
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="px-4 h-10 rounded-lg border border-black/12 bg-white text-sm font-medium hover:bg-black/[0.02]"
          >
            稍后再说
          </button>
        </div>

        {(isOffline || isNotInstalled) && !pairingMode && (
          <p className="text-xs text-amber-700 inline-flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            Hz-Hermes 恢复在线后即可继续使用智能体。
          </p>
        )}
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
