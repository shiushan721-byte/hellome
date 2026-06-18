import { AlertTriangle, ExternalLink, Link2 } from 'lucide-react';
import type { HermesConnectionStatus } from '../../lib/hermesConnection';
import { createPortal } from 'react-dom';

export default function HermesActionModal({
  status,
  onClose,
  onOpenHermes,
  onGoPair,
}: {
  status: HermesConnectionStatus;
  onClose: () => void;
  onOpenHermes: () => void;
  onGoPair: () => void;
}) {
  const isOffline = status === 'offline';
  const isNotPaired = status === 'not_paired' || status === 'account_mismatch';
  const isNotInstalled = status === 'capability_missing';
  const title = isOffline
    ? 'Hermes 当前离线'
    : isNotInstalled
      ? '请先安装 Hermes'
      : '请先完成 Hermes 配对';
  const desc = isOffline
    ? '检测到 Hermes 未在线。启动 Hermes 后即可继续使用智能体功能。'
    : isNotInstalled
      ? 'HelloMe 智能体依赖 Hermes 执行。请先安装并打开 Hermes，再回到当前页面。'
      : '未检测到配对关系。请打开 Hermes 并使用同账号完成一键配对后再继续。';

  const modal = (
    <div className="fixed inset-0 z-[70] bg-black/35 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white border border-black/10 rounded-2xl shadow-xl p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold">{title}</h3>
            <p className="text-sm text-black/55 mt-1">{desc}</p>
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

        {isNotPaired && (
          <section className="rounded-xl border border-black/10 bg-[#F7F9FB] p-4 space-y-3">
            <p className="text-xs font-semibold text-black/70 inline-flex items-center gap-1.5">
              <Link2 className="w-3.5 h-3.5" />
              配对示意图
            </p>
            <div className="flex items-center gap-2 text-[11px]">
              <div className="flex-1 rounded-lg border border-black/10 bg-white px-2 py-2 text-center">
                HelloMe 登录
              </div>
              <span className="text-black/35">→</span>
              <div className="flex-1 rounded-lg border border-black/10 bg-white px-2 py-2 text-center">
                Hermes 同账号登录
              </div>
              <span className="text-black/35">→</span>
              <div className="flex-1 rounded-lg border border-black/10 bg-white px-2 py-2 text-center">
                一键配对成功
              </div>
            </div>
          </section>
        )}

        <div className="flex flex-wrap gap-2">
          {(isOffline || isNotInstalled) && (
            <button
              type="button"
              onClick={onOpenHermes}
              className="px-4 h-10 rounded-lg bg-black text-white text-sm font-medium hover:bg-black/90 inline-flex items-center gap-1.5"
            >
              <ExternalLink className="w-4 h-4" />
              启动 Hermes 应用
            </button>
          )}
          {isNotPaired && (
            <button
              type="button"
              onClick={onGoPair}
              className="px-4 h-10 rounded-lg bg-black text-white text-sm font-medium hover:bg-black/90"
            >
              去 Hermes 配对页
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="px-4 h-10 rounded-lg border border-black/12 bg-white text-sm font-medium hover:bg-black/[0.02]"
          >
            我知道了
          </button>
        </div>

        {(isOffline || isNotInstalled) && (
          <p className="text-xs text-amber-700 inline-flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            Hermes 恢复在线后即可继续使用智能体。
          </p>
        )}
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
