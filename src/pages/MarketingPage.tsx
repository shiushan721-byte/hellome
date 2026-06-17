import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Zap } from 'lucide-react';
import HeroPortal from '../components/HeroPortal';
import AgentsShowcase from '../components/AgentsShowcase';
import HermesSection from '../components/HermesSection';
import InfoSections from '../components/InfoSections';

export default function MarketingPage() {
  const [selectedAgent, setSelectedAgent] = useState<'geo' | 'media' | 'sales'>('geo');

  return (
    <div className="min-h-screen bg-[#FDFCFB] text-[#1A1A1A] font-sans selection:bg-black/10 selection:text-black relative">
      <header className="sticky top-0 z-40 bg-[#FDFCFB]/95 backdrop-blur-md transition-all font-sans">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <div className="w-10 h-10 bg-black flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5 text-white fill-white" />
            </div>
            <div className="flex flex-col justify-center gap-1 py-0.5">
              <span className="text-xl font-bold font-display tracking-tight text-black leading-none">
                Hello<span className="font-serif italic font-semibold">Me</span>
              </span>
              <span className="text-[11px] font-medium text-black/45 tracking-[0.18em] leading-none">
                哈基米
              </span>
            </div>
          </div>

          <Link
            to="/login"
            className="px-4 py-2 bg-black text-white text-xs font-bold uppercase tracking-wider hover:bg-black/85 transition-all"
          >
            立即使用
          </Link>
        </div>
      </header>

      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <section className="relative z-10 min-h-[calc(100dvh-5rem)] flex items-center justify-center">
          <HeroPortal />
        </section>
        <AgentsShowcase activeTab={selectedAgent} onSelectAgent={setSelectedAgent} />
        <HermesSection />
        <InfoSections />
      </main>
    </div>
  );
}
