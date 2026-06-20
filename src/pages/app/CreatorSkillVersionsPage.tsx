import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Clock3, Rocket, RotateCcw } from 'lucide-react';
import { listStudioSkillVersions, publishStudioSkill } from '../../lib/skillStudioApi';
import type { SkillVersionRecord } from '../../types/skills';
import SkillStudioNav from '../../components/app/studio/SkillStudioNav';

export default function CreatorSkillVersionsPage() {
  const { skillId = 'media-ugc' } = useParams();
  const [versions, setVersions] = useState<SkillVersionRecord[]>([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void listStudioSkillVersions(skillId)
      .then((data) => {
        if (!cancelled) setVersions(data);
      })
      .catch((loadError) => {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : '读取版本失败');
      });
    return () => {
      cancelled = true;
    };
  }, [skillId]);

  const handlePublish = async () => {
    setPublishing(true);
    setError('');
    setMessage('');
    try {
      await publishStudioSkill(skillId);
      const next = await listStudioSkillVersions(skillId);
      setVersions(next);
      setMessage('当前草稿已发布为线上版本');
    } catch (publishError) {
      setError(publishError instanceof Error ? publishError.message : '发布失败');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full space-y-6">
      <header className="bg-white border border-black/8 rounded-[28px] p-6 sm:p-8 space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full bg-[#F5F6F8] px-3 py-1 text-[11px] font-semibold text-black/55">
          <Clock3 className="w-3.5 h-3.5" />
          Skill 版本
        </div>
        <h1 className="text-2xl font-bold font-display">短视频客户交付 Agent 版本管理</h1>
        <p className="text-sm text-black/55 max-w-3xl">
          用户前台默认只读取已发布版本，草稿只在 Creator Studio 内可见。
        </p>
      </header>

      <SkillStudioNav skillId={skillId} />

      {message ? <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-xl">{message}</p> : null}
      {error ? <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 px-3 py-2 rounded-xl">{error}</p> : null}

      <section className="space-y-4">
        {versions.map((version) => (
          <div
            key={version.id}
            className="bg-white border border-black/8 rounded-[24px] p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
          >
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-semibold">{version.versionLabel}</h2>
                <span className="px-2.5 py-1 rounded-full bg-[#F5F6F8] text-[11px] font-semibold text-black/55">
                  {version.status === 'published' ? '线上版本' : '草稿'}
                </span>
              </div>
              <p className="text-sm text-black/55">{version.summary || version.title}</p>
              <p className="text-xs text-black/35">
                {new Date(version.createdAt).toLocaleString('zh-CN')}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="inline-flex items-center gap-2 px-4 h-10 rounded-xl border border-black/12 bg-white text-sm font-medium"
              >
                <RotateCcw className="w-4 h-4" />
                回滚到此版本
              </button>
              <button
                type="button"
                onClick={() => {
                  void handlePublish();
                }}
                disabled={publishing}
                className="inline-flex items-center gap-2 px-4 h-10 rounded-xl bg-black text-white text-sm font-semibold disabled:opacity-70"
              >
                <Rocket className="w-4 h-4" />
                {publishing ? '发布中...' : '发布为线上版本'}
              </button>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
