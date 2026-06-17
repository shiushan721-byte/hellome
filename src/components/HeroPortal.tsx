import { Link } from 'react-router-dom';

export default function HeroPortal() {
  return (
    <div className="w-full" id="hero-portal-view">
      <div className="w-full max-w-2xl mx-auto space-y-8 px-2 sm:px-0 text-center">
        <div className="space-y-5">
          <p className="text-2xl sm:text-3xl font-bold font-display tracking-tight text-black">
            Hello<span className="font-serif italic font-semibold">Me</span>
          </p>

          <div className="space-y-3">
            <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-extrabold font-display tracking-tight leading-[1.08] text-black">
              让智能体完成复杂任务
            </h1>
            <p className="text-sm sm:text-base text-black/55 leading-relaxed">
              选择场景，输入目标。<br className="hidden sm:inline" />
              过程看得见，结果可交付。
            </p>
          </div>

          <div className="flex items-center justify-center pt-1">
            <Link
              to="/login"
              className="px-6 py-2.5 bg-black text-white text-xs font-bold tracking-wide hover:bg-black/85 transition-all"
              id="hero-use-btn"
            >
              立即使用
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
