import { Link, useLocation } from 'react-router-dom';
import { Bug, FileSliders, Rocket, SquareArrowOutUpRight } from 'lucide-react';

const NAV_ITEMS = [
  { key: 'editor', label: '可视化编辑', icon: FileSliders, suffix: '' },
  { key: 'debug', label: '调试验证', icon: Bug, suffix: '/debug' },
  { key: 'versions', label: '发布版本', icon: Rocket, suffix: '/versions' },
] as const;

export default function SkillStudioNav({ skillId }: { skillId: string }) {
  const location = useLocation();

  return (
    <div className="rounded-[24px] border border-black/[0.08] bg-white px-4 py-4 sm:px-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          {NAV_ITEMS.map((item) => {
            const href = `/app/studio/skills/${skillId}${item.suffix}`;
            const active = location.pathname === href;
            const Icon = item.icon;

            return (
              <Link
                key={item.key}
                to={href}
                className={`inline-flex h-10 items-center gap-2 rounded-xl border px-4 text-sm transition-colors ${
                  active
                    ? 'border-black bg-black text-white'
                    : 'border-black/10 bg-[#FCFCFD] text-black/65 hover:border-black/15 hover:bg-white'
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </div>

        <Link
          to="/app/agents/media-seeding"
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-black/10 bg-white px-4 text-sm text-black/60 transition-colors hover:bg-[#FAFAFA]"
        >
          <SquareArrowOutUpRight className="h-4 w-4" />
          查看前台
        </Link>
      </div>
    </div>
  );
}
