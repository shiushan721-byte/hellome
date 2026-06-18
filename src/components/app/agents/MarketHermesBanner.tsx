import { HERMES_DOWNLOAD_URL } from '../../../lib/firstRunOnboarding';

interface MarketHermesBannerProps {
  onGoPair: () => void;
}

export default function MarketHermesBanner({ onGoPair }: MarketHermesBannerProps) {
  return (
    <div className="rounded-2xl border border-sky-200 bg-sky-50/80 px-4 py-4 sm:px-5 flex flex-col sm:flex-row sm:items-center gap-4">
      <div className="flex-1 min-w-0 space-y-1">
        <p className="text-sm font-bold text-sky-950">使用智能体前，请先配对 Hz-Hermes</p>
        <p className="text-xs text-sky-900/70 leading-relaxed">
          HelloMe 负责发起任务，Hz-Hermes 负责在你的电脑和网页环境中执行。
        </p>
      </div>
      <div className="flex flex-wrap gap-2 shrink-0">
        <a
          href={HERMES_DOWNLOAD_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 text-xs font-bold border border-sky-300/80 bg-white text-sky-950 hover:bg-sky-50 rounded-lg"
        >
          下载 Hz-Hermes
        </a>
        <button
          type="button"
          onClick={onGoPair}
          className="px-4 py-2 text-xs font-bold bg-sky-900 text-white hover:bg-sky-950 rounded-lg"
        >
          一键配对
        </button>
      </div>
    </div>
  );
}
