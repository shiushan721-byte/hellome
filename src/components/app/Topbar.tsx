import { useNavigate } from 'react-router-dom';
import { Search, Bell, ChevronDown, LogOut } from 'lucide-react';
import { getUser, logout } from '../../lib/auth';
import { getUsage } from '../../lib/usageStore';

export default function Topbar() {
  const navigate = useNavigate();
  const user = getUser();
  const usage = getUsage();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="h-16 border-b border-black/8 bg-[#FDFCFB]/95 backdrop-blur-md px-6 flex items-center justify-between gap-4 shrink-0">
      <div className="flex items-center gap-3 min-w-0">
        <span className="text-xs font-bold text-black/50 uppercase tracking-wider shrink-0">
          {user.workspace}
        </span>
        <div className="relative hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-black/35" />
          <input
            type="search"
            placeholder="搜索任务…"
            className="w-48 lg:w-64 pl-9 pr-3 py-2 text-xs bg-[#F2F0ED] border-0 outline-none focus:ring-1 focus:ring-black/15"
          />
        </div>
      </div>

      <div className="flex items-center gap-4 shrink-0">
        <button type="button" className="text-black/45 hover:text-black transition-colors" aria-label="通知">
          <Bell className="w-4 h-4" />
        </button>

        <div className="hidden md:flex items-center gap-2 text-xs">
          <span className="text-black/45">Token</span>
          <span className="font-bold font-mono">¥{usage.tokenBalance.toFixed(2)}</span>
          <span className="text-black/25">|</span>
          <span className="text-black/45">GEO</span>
          <span className="font-bold">{usage.geoUsed}/{usage.geoLimit}</span>
        </div>

        <div className="relative group">
          <button
            type="button"
            className="flex items-center gap-2 text-xs font-medium hover:text-black/70"
          >
            <span className="w-7 h-7 bg-black text-white flex items-center justify-center text-[10px] font-bold">
              {(user.name || 'U').slice(0, 1).toUpperCase()}
            </span>
            <span className="hidden sm:inline">{user.name || '用户'}</span>
            <ChevronDown className="w-3.5 h-3.5 text-black/40" />
          </button>
          <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-black/10 shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full px-3 py-2.5 text-xs text-left flex items-center gap-2 hover:bg-[#F2F0ED]"
            >
              <LogOut className="w-3.5 h-3.5" />
              退出登录
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
