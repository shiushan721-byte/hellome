import { useEffect, useSyncExternalStore } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, Download, ExternalLink, RefreshCw } from 'lucide-react';
import {
  getCurrentAccountId,
  getHermesConnection,
  pairHermesWithCurrentAccount,
  refreshHermesConnection,
  subscribeHermesConnection,
} from '../lib/hermesConnection';

export default function ConnectHermesPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const expectedOffline = searchParams.get('status') === 'offline';
  const snapshot = useSyncExternalStore(subscribeHermesConnection, getHermesConnection, getHermesConnection);
  const account = getCurrentAccountId();
  const isConnected = snapshot.status === 'connected';
  useEffect(() => {
    if (isConnected && !expectedOffline) {
      navigate('/app', { replace: true });
    }
  }, [isConnected, expectedOffline, navigate]);

  const isOffline = snapshot.status === 'offline' || expectedOffline;

  const handleRefresh = () => {
    const next = refreshHermesConnection();
    if (next.status === 'connected') navigate('/app', { replace: true });
  };

  const handlePair = () => {
    const next = pairHermesWithCurrentAccount();
    if (next.status === 'connected') navigate('/app', { replace: true });
  };

  const description = isOffline
    ? 'Hz-Hermes 当前离线，请打开 Hz-Hermes 客户端并确认已登录当前 HelloMe 账号。'
    : 'HelloMe 的智能体需要通过 Hz-Hermes 执行。请下载 Hz-Hermes，并使用同一个账号登录后点击一键配对。';

  return (
    <div className="min-h-screen bg-[#F5F6F8] text-[#1A1A1A] p-4 sm:p-6 lg:p-8">
      <div className="w-full bg-white border border-black/10 rounded-2xl p-6 lg:p-8 space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">连接 Hz-Hermes 后开始使用 HelloMe</h1>
          <p className="text-sm text-black/55">{description}</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-4">
          <section className="bg-[#F6F8FA] border border-black/8 rounded-xl p-4">
            <h2 className="text-sm font-semibold mb-3">操作步骤</h2>
            <ol className="space-y-2 text-sm text-black/65 list-decimal pl-5">
              <li>下载并安装 Hz-Hermes</li>
              <li>打开 Hz-Hermes</li>
              <li>使用当前 HelloMe 账号登录 Hz-Hermes</li>
              <li>在 Hz-Hermes 中点击“一键配对”</li>
              <li>配对成功后自动进入 HelloMe 工作台</li>
            </ol>
          </section>
          <section className="bg-[#F6F8FA] border border-black/8 rounded-xl p-4 space-y-2">
            <h2 className="text-sm font-semibold">当前状态</h2>
            <p className="text-xs text-black/45">
              HelloMe 账号：<span className="font-mono">{account || '未识别'}</span>
            </p>
            <p className="text-xs text-black/45">
              Hz-Hermes 状态：
              <span className="ml-1 font-semibold text-black/75">
                {isConnected ? '已连接' : isOffline ? '离线' : '未配对'}
              </span>
            </p>
            {snapshot.lastError ? (
              <p className="text-xs text-rose-700 inline-flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                {snapshot.lastError}
              </p>
            ) : null}
            {isConnected && snapshot.device ? (
              <p className="text-xs text-emerald-700 inline-flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Hz-Hermes 已连接 · {snapshot.device.id} {snapshot.device.version}
              </p>
            ) : null}
          </section>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-4 h-10 rounded-lg border border-black/12 bg-white hover:bg-black/[0.02] text-sm font-medium"
          >
            <Download className="w-4 h-4" />
            下载 Hz-Hermes
          </button>
          <button
            type="button"
            onClick={handleRefresh}
            className="inline-flex items-center gap-1.5 px-4 h-10 rounded-lg border border-black/12 bg-white hover:bg-black/[0.02] text-sm font-medium"
          >
            <ExternalLink className="w-4 h-4" />
            打开 Hz-Hermes
          </button>
          <button
            type="button"
            onClick={handleRefresh}
            className="inline-flex items-center gap-1.5 px-4 h-10 rounded-lg border border-black/12 bg-white hover:bg-black/[0.02] text-sm font-medium"
          >
            <RefreshCw className="w-4 h-4" />
            重新检测配对状态
          </button>
          <button
            type="button"
            onClick={handlePair}
            className="inline-flex items-center gap-1.5 px-4 h-10 rounded-lg bg-black text-white hover:bg-black/90 text-sm font-medium"
          >
            我已完成一键配对
          </button>
        </div>
      </div>
    </div>
  );
}
