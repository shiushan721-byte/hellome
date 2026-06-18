import { useSyncExternalStore } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, ChevronDown, LogOut } from 'lucide-react';
import { logout } from '../../lib/auth';
import { getProfile, subscribeProfile } from '../../lib/profileStore';
import UserAvatar from './UserAvatar';
import { getUsage, isLowBalance, subscribeUsage } from '../../lib/usageStore';
import { formatToken } from '../../lib/tokenBilling';
import {
  getHermesConnection,
  refreshHermesConnection,
  subscribeHermesConnection,
} from '../../lib/hermesConnection';
import { useState } from 'react';
import HermesActionModal from './HermesActionModal';

export default function Topbar() {
  const navigate = useNavigate();
  const profile = useSyncExternalStore(subscribeProfile, getProfile, getProfile);
  const usage = useSyncExternalStore(subscribeUsage, getUsage, getUsage);
  const hermes = useSyncExternalStore(
    subscribeHermesConnection,
    getHermesConnection,
    getHermesConnection,
  );
  const low = isLowBalance(usage);
  const [showHermesModal, setShowHermesModal] = useState(false);
  const isConnected = hermes.status === 'connected';
  const isNotPaired = hermes.status === 'not_paired' || hermes.status === 'account_mismatch';

  const hermesLabel = isConnected
    ? 'Hz-Hermes 已连接'
    : isNotPaired
      ? 'Hz-Hermes 未配对 · 去配对'
      : 'Hz-Hermes 离线 · 启动应用';

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
        <button
          type="button"
          onClick={() => {
            if (isConnected) refreshHermesConnection();
            else setShowHermesModal(true);
          }}
          className={`hidden md:inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-full border ${
            isConnected
              ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
              : isNotPaired
                ? 'border-sky-300 bg-sky-50 text-sky-800'
                : 'border-amber-300 bg-amber-50 text-amber-800'
          }`}
        >
          {hermesLabel}
        </button>

        <div className="relative group">
          <button
            type="button"
            className="flex items-center gap-2 text-xs font-medium hover:text-black/70"
          >
            <UserAvatar profile={profile} size="sm" />
            <span className="hidden sm:inline">{profile.nickname}</span>
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
      {showHermesModal && (
        <HermesActionModal
          status={hermes.status}
          onClose={() => setShowHermesModal(false)}
          onOpenHermes={() => {
            refreshHermesConnection();
            setShowHermesModal(false);
          }}
          onGoPair={() => {
            setShowHermesModal(false);
            navigate('/connect-hermes');
          }}
        />
      )}
    </header>
  );
}
