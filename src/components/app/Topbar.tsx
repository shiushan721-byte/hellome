import { useSyncExternalStore } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, ChevronDown, LogOut } from 'lucide-react';
import { getUser, logout } from '../../lib/auth';
import { getUsage, isLowBalance, subscribeUsage } from '../../lib/usageStore';
import { formatToken } from '../../lib/tokenBilling';

export default function Topbar() {
  const navigate = useNavigate();
  const user = getUser();
  const usage = useSyncExternalStore(subscribeUsage, getUsage, getUsage);
  const low = isLowBalance(usage);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="h-16 border-b border-black/8 bg-[#FDFCFB]/95 backdrop-blur-md px-6 flex items-center justify-end gap-4 shrink-0">
      <div className="flex items-center gap-4 shrink-0">
        <button type="button" className="text-black/45 hover:text-black transition-colors" aria-label="通知">
          <Bell className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => navigate('/app/usage')}
          className={`hidden md:flex items-center gap-2 text-xs px-3 py-1.5 rounded-full border transition-colors ${
            low
              ? 'border-amber-300 bg-amber-50 text-amber-800'
              : 'border-black/8 bg-[#F2F0ED]/50 text-black/70 hover:border-black/15'
          }`}
        >
          <span className="text-black/45">剩余 Token</span>
          <span className="font-bold font-mono">{formatToken(usage.tokenBalance)}</span>
        </button>

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
