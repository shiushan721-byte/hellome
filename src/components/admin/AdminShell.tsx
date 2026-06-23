import { useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Boxes,
  ClipboardList,
  FileStack,
  LayoutDashboard,
  LogOut,
  Settings2,
  ShoppingCart,
  Users,
  Zap,
} from 'lucide-react';
import { logout } from '../../lib/auth';
import AdminDebugPanel from './AdminDebugPanel';

const NAV = [
  { to: '/admin/dashboard', label: '仪表盘', icon: LayoutDashboard },
  { to: '/admin/users', label: '用户管理', icon: Users },
  { to: '/admin/orders', label: '订单与算力', icon: ShoppingCart },
  { to: '/admin/tasks', label: '任务管理', icon: ClipboardList },
  { to: '/admin/results', label: '成果管理', icon: FileStack },
  { to: '/admin/frontend/home', label: '首页配置', icon: Settings2 },
  { to: '/admin/skills', label: '智能体管理', icon: Boxes },
];

export default function AdminShell() {
  const navigate = useNavigate();

  useEffect(() => {
    const root = document.documentElement;
    const wasDark = root.classList.contains('dark');
    root.classList.remove('dark');
    return () => {
      if (wasDark) root.classList.add('dark');
    };
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/agents');
  };

  return (
    <div className="min-h-screen bg-[#FDFCFB] text-[#1A1A1A] flex">
      <aside className="w-60 shrink-0 border-r border-[#f0f0f0] bg-white flex flex-col">
        <div className="h-14 px-4 border-b border-[#f0f0f0] flex items-center gap-2.5">
          <div className="w-8 h-8 bg-black flex items-center justify-center shrink-0 rounded-lg">
            <Zap className="w-4 h-4 text-white fill-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-[#111111]">HelloMe Admin</p>
            <p className="text-[10px] text-black/40">运营配置与业务管理</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-[#f0f0f2] text-[#111111] font-semibold'
                    : 'text-black/50 hover:text-[#111111] hover:bg-[#f7f7f8]'
                }`
              }
            >
              <item.icon className="w-4 h-4 shrink-0" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-[#f0f0f0] space-y-2">
          <AdminDebugPanel />
          <button
            type="button"
            onClick={() => navigate('/app')}
            className="w-full text-xs px-3 py-2 rounded-lg border border-[#e8e8e8] text-[#444444] hover:bg-[#f7f7f8] transition-colors"
          >
            返回前台
          </button>
          <button
            type="button"
            onClick={() => void handleLogout()}
            className="w-full text-xs px-3 py-2 rounded-lg border border-[#e8e8e8] text-[#444444] hover:bg-[#f7f7f8] transition-colors flex items-center justify-center gap-2"
          >
            <LogOut className="w-3.5 h-3.5" />
            退出登录
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0 flex flex-col">
        <header className="h-14 border-b border-[#f0f0f0] px-6 flex items-center justify-between bg-white/90 backdrop-blur">
          <p className="text-sm text-[#333333]">Boss Admin 控制台</p>
          <p className="text-xs text-black/40">管理员账号可见</p>
        </header>
        <div className="flex-1 overflow-auto custom-scrollbar p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
