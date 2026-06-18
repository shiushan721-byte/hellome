import { Link } from 'react-router-dom';
import { Zap } from 'lucide-react';

export default function PublicMarketLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F5F5F7] flex flex-col">
      <header className="h-14 shrink-0 border-b border-black/8 bg-[#FDFCFB] px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-black flex items-center justify-center shrink-0">
            <Zap className="w-4 h-4 text-white fill-white" />
          </div>
          <span className="text-sm font-bold font-display">
            Hello<span className="font-serif italic font-semibold">Me</span>
          </span>
        </Link>
        <Link
          to="/login?redirect=/agents"
          className="px-4 py-2 text-xs font-bold bg-black text-white hover:bg-black/85 rounded-lg"
        >
          登录
        </Link>
      </header>
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
