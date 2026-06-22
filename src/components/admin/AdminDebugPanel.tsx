import { useEffect, useState } from 'react';
import { Bug, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import { adminApi } from '../../lib/adminApi';
import { getUser } from '../../lib/auth';

export default function AdminDebugPanel() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState<Record<string, unknown> | null>(null);
  const user = getUser();

  const load = async () => {
    setLoading(true);
    try {
      const data = await adminApi.debugInfo();
      setInfo(data as unknown as Record<string, unknown>);
    } catch (error) {
      setInfo({ error: error instanceof Error ? error.message : '加载失败' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && !info) void load();
  }, [open, info]);

  return (
    <div className="rounded-lg border border-[#e8e8e8] bg-[#fafafa] overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 text-left hover:bg-[#f3f3f3] transition-colors"
      >
        <span className="flex items-center gap-2 text-[11px] font-semibold text-[#444444]">
          <Bug className="w-3.5 h-3.5 text-sky-600" />
          调试面板
        </span>
        {open ? (
          <ChevronDown className="w-3.5 h-3.5 text-black/35" />
        ) : (
          <ChevronUp className="w-3.5 h-3.5 text-black/35" />
        )}
      </button>

      {open ? (
        <div className="px-3 pb-3 space-y-2 border-t border-[#ececec] text-[10px] text-black/50">
          <div className="pt-2 space-y-1">
            <p>当前账号：{user.name}</p>
            <p>角色：{user.role}</p>
            <p>手机：{user.phone || '—'}</p>
          </div>

          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-md border border-[#e8e8e8] bg-white hover:bg-[#f7f7f8] disabled:opacity-50 text-[#444444]"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            刷新环境信息
          </button>

          {info ? (
            <pre className="max-h-40 overflow-auto rounded-md bg-white border border-[#ececec] p-2 text-[10px] leading-relaxed text-[#333333]">
              {JSON.stringify(info, null, 2)}
            </pre>
          ) : null}

          <div className="grid grid-cols-1 gap-1">
            <button
              type="button"
              onClick={() => {
                localStorage.removeItem('hellome_workbench_tab_order');
                localStorage.removeItem('hellome_workbench_hidden_tabs');
                alert('已清空工作台标签缓存');
              }}
              className="py-1.5 rounded-md border border-[#e8e8e8] bg-white hover:bg-[#f7f7f8] text-left px-2 text-[#444444]"
            >
              清空工作台标签缓存
            </button>
            <button
              type="button"
              onClick={() => {
                localStorage.removeItem('hellome_hermes_connection');
                alert('已重置 Hermes 连接状态');
              }}
              className="py-1.5 rounded-md border border-[#e8e8e8] bg-white hover:bg-[#f7f7f8] text-left px-2 text-[#444444]"
            >
              重置 Hermes 本地状态
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
