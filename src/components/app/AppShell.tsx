import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import AppSidebar, { MobileNavBar } from './AppSidebar';
import Topbar from './Topbar';

export default function AppShell() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#FDFCFB] text-[#1A1A1A] flex">
      <AppSidebar
        mode="app"
        mobileOpen={mobileNavOpen}
        onMobileClose={() => setMobileNavOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0 min-h-0 h-screen overflow-hidden">
        <div className="shrink-0 z-30">
          <MobileNavBar mode="app" onMenuClick={() => setMobileNavOpen(true)} />
          <Topbar />
        </div>
        <main className="flex-1 min-h-0 overflow-auto custom-scrollbar">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
