import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import AppSidebar, { MobileNavBar } from './AppSidebar';
import Topbar from './Topbar';
import WorkbenchTabsBar from './WorkbenchTabsBar';
import { useSyncExternalStore } from 'react';
import {
  getVisibleRecentAgentIds,
  subscribeWorkbenchTabs,
} from '../../lib/workbenchTabs';
import { syncHermesConnection } from '../../lib/hermesConnection';
import { syncAuthSession } from '../../lib/auth';
import { syncUsageState } from '../../lib/usageStore';

export default function AppShell() {
  const location = useLocation();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const workbenchRevision = useSyncExternalStore(
    subscribeWorkbenchTabs,
    () => getVisibleRecentAgentIds().join(','),
    () => '',
  );
  const showWorkbenchTabs =
    workbenchRevision.length > 0 &&
    (location.pathname === '/app' || /^\/app\/agents\/[^/]+$/.test(location.pathname));

  useEffect(() => {
    void syncAuthSession();
    void syncHermesConnection();
    void syncUsageState();
  }, []);

  return (
    <div className="min-h-screen bg-[#FDFCFB] text-[#1A1A1A] flex">
      <AppSidebar
        mode="app"
        mobileOpen={mobileNavOpen}
        onMobileClose={() => setMobileNavOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0 min-h-0 h-screen overflow-hidden">
        <div className="shrink-0 z-30 bg-[#FDFCFB]">
          <MobileNavBar mode="app" onMenuClick={() => setMobileNavOpen(true)} />
          <Topbar />
          {showWorkbenchTabs && <WorkbenchTabsBar />}
        </div>
        <main className="flex-1 min-h-0 overflow-auto custom-scrollbar">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
