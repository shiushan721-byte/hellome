import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

export default class AppErrorBoundary extends Component<Props, State> {
  state: State = {
    hasError: false,
    message: '',
  };

  static getDerivedStateFromError(error: unknown): State {
    return {
      hasError: true,
      message: error instanceof Error ? error.message : 'Unknown runtime error',
    };
  }

  componentDidCatch(error: unknown) {
    console.error('[AppErrorBoundary]', error);
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="min-h-screen bg-[#F5F6F8] text-[#1A1A1A] p-6 lg:p-10 flex items-center justify-center">
        <div className="w-full max-w-2xl bg-white border border-black/10 rounded-2xl p-6 space-y-4">
          <h1 className="text-xl font-bold">页面加载异常</h1>
          <p className="text-sm text-black/60">
            已拦截运行时错误，避免白屏。你可以先刷新页面，或先去 Hz-Hermes 配对页恢复可用状态。
          </p>
          <p className="text-xs text-rose-700 break-all">{this.state.message}</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-4 h-10 rounded-lg bg-black text-white text-sm font-medium hover:bg-black/90"
            >
              刷新页面
            </button>
            <button
              type="button"
              onClick={() => {
                window.location.href = '/app';
              }}
              className="px-4 h-10 rounded-lg border border-black/12 bg-white text-sm font-medium hover:bg-black/[0.02]"
            >
              前往 Hz-Hermes 配对页
            </button>
          </div>
        </div>
      </div>
    );
  }
}
