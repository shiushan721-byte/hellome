import { useState, type ReactNode } from 'react';
import AppSidebar, { MobileNavBar } from '../components/app/AppSidebar';
import Topbar from '../components/app/Topbar';

export default function PublicMarketLayout({ children }: { children: ReactNode }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F5F5F7] flex">
      <AppSidebar
        mode="guest"
        mobileOpen={mobileNavOpen}
        onMobileClose={() => setMobileNavOpen(false)}
      />
      <div className="flex-1 flex flex-col min-w-0 min-h-0 h-screen overflow-hidden">
        <div className="shrink-0 z-30 bg-[#FDFCFB]">
          <MobileNavBar mode="guest" onMenuClick={() => setMobileNavOpen(true)} />
          <Topbar variant="guest" />
        </div>
        <main className="flex-1 min-h-0 overflow-auto custom-scrollbar min-w-0">{children}</main>
      </div>
    </div>
  );
}
