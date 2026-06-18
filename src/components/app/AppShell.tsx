import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  Home,
  ListTodo,
  BarChart3,
  Settings,
  Zap,
  Store,
} from 'lucide-react';
import Topbar from './Topbar';
import PlanDebugPanel from './PlanDebugPanel';
import HermesDebugPanel from './HermesDebugPanel';
import WorkbenchTabsBar from './WorkbenchTabsBar';

const navItems = [
  {
    to: '/app',
    label: '我的工作台',
    icon: Home,
    match: (pathname: string) => pathname === '/app' || /^\/app\/agents\/[^/]+$/.test(pathname),
  },
  { to: '/app/agents', label: '智能体市场', icon: Store, end: true as const },
  { to: '/app/tasks', label: '任务中心', icon: ListTodo },
  { to: '/app/usage', label: '用量', icon: BarChart3 },
  { to: '/app/settings', label: '设置', icon: Settings },
];

export default function AppShell() {
  const location = useLocation();
  const showWorkbenchTabs = location.pathname === '/app' || /^\/app\/agents\/[^/]+$/.test(location.pathname);

  return (
    <div className="min-h-screen bg-[#FDFCFB] text-[#1A1A1A] flex">
      <aside className="w-56 shrink-0 border-r border-black/8 bg-[#FDFCFB] flex flex-col">
        <div className="h-16 px-5 flex items-center gap-2.5 border-b border-black/8">
          <div className="w-8 h-8 bg-black flex items-center justify-center shrink-0">
            <Zap className="w-4 h-4 text-white fill-white" />
          </div>
          <div className="flex flex-col leading-none gap-0.5">
            <span className="text-sm font-bold font-display">
              Hello<span className="font-serif italic font-semibold">Me</span>
            </span>
            <span className="text-[9px] text-black/40 tracking-[0.15em]">哈啰蜜</span>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-0.5">
          {navItems.map(({ to, label, icon: Icon, end, match }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium transition-colors ${
                  (match ? match(location.pathname) : isActive)
                    ? 'bg-black text-white'
                    : 'text-black/60 hover:bg-[#F2F0ED] hover:text-black'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto">
          <HermesDebugPanel />
          <PlanDebugPanel />
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        {showWorkbenchTabs && <WorkbenchTabsBar />}
        <main className="flex-1 overflow-auto custom-scrollbar">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
