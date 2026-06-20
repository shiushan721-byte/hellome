import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bug, Columns3, FileSliders, Rocket, Sparkles } from 'lucide-react';
import { getUser } from '../../lib/auth';
import { listStudioSkills } from '../../lib/skillStudioApi';
import type { SkillRecord } from '../../types/skills';

export default function CreatorStudioPage() {
  const user = getUser();
  const [skills, setSkills] = useState<SkillRecord[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    void listStudioSkills()
      .then((data) => {
        if (!cancelled) setSkills(data);
      })
      .catch((loadError) => {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : '读取 Skill 列表失败');
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full space-y-6">
      <section className="bg-white border border-black/8 rounded-[28px] p-6 sm:p-8 space-y-4">
        <div className="inline-flex items-center gap-2 rounded-full bg-[#F5F6F8] px-3 py-1 text-[11px] font-semibold text-black/55">
          <Sparkles className="w-3.5 h-3.5" />
          Creator Studio
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold font-display">UGC Skill 创作者工作台</h1>
          <p className="text-sm text-black/55 max-w-3xl leading-relaxed">
            这里不是另一个后台，而是 HelloMe 当前前台里只对创作者开放的配置与调试层。你可以继续沿用用户前台的结果导向页面，只配置内容、执行和交付逻辑。
          </p>
          <p className="text-xs text-black/40">
            当前身份：<span className="font-semibold text-black/65">{user.role}</span>
          </p>
        </div>
      </section>

      {error ? (
        <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 px-3 py-2 rounded-xl">{error}</p>
      ) : null}

      <section className="bg-white border border-black/8 rounded-[24px] p-5 sm:p-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold">前台设计规范预览</h2>
          <p className="text-sm text-black/55 leading-relaxed">
            在正式改 UGC、任务页和 Hermes 链路前，先统一前台的组件、色彩、字体和三栏工作台规范。
          </p>
        </div>
        <StudioLink to="/app/studio/design-spec" icon={Columns3} label="查看规范页面" />
      </section>

      <section className="grid grid-cols-1 gap-4">
        {skills.map((skill) => (
          <div
            key={skill.id}
            className="bg-white border border-black/8 rounded-[24px] p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_auto] gap-4"
          >
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-semibold">{skill.name}</h2>
                <span className="px-2.5 py-1 rounded-full bg-[#F5F6F8] text-[11px] font-semibold text-black/55">
                  {skill.status === 'published' ? '已发布' : '草稿'}
                </span>
                <span className="px-2.5 py-1 rounded-full bg-[#F5F6F8] text-[11px] font-semibold text-black/45">
                  {skill.latestVersion.versionLabel}
                </span>
              </div>
              <p className="text-sm text-black/55 leading-relaxed">
                {skill.description || '固定结果导向页面范式下的 UGC 交付 Skill。'}
              </p>
              <p className="text-xs text-black/35">
                最近更新时间：{new Date(skill.updatedAt).toLocaleString('zh-CN')}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 lg:justify-end">
              <StudioLink to={`/app/studio/skills/${skill.id}`} icon={FileSliders} label="编辑 Skill" />
              <StudioLink to={`/app/studio/skills/${skill.id}/debug`} icon={Bug} label="调试 Skill" />
              <StudioLink to={`/app/studio/skills/${skill.id}/versions`} icon={Rocket} label="版本管理" />
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}

function StudioLink({
  to,
  icon: Icon,
  label,
}: {
  to: string;
  icon: typeof FileSliders;
  label: string;
}) {
  return (
    <Link
      to={to}
      className="inline-flex items-center gap-2 px-4 h-10 rounded-xl border border-black/12 bg-white text-sm font-medium hover:bg-black/[0.02]"
    >
      <Icon className="w-4 h-4" />
      {label}
    </Link>
  );
}
