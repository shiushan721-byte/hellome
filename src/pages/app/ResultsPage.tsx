import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { FolderOpen, PencilLine } from 'lucide-react';
import { Link } from 'react-router-dom';
import { canAccessStudio } from '../../lib/auth';
import { buildResultEntries } from '../../lib/resultsCenter';
import { listRemoteTasks } from '../../lib/taskApi';
import { getTasks, subscribeTasks } from '../../lib/taskStore';
import type { Task } from '../../types/workbench';

export default function ResultsPage() {
  const localTasks = useSyncExternalStore(subscribeTasks, getTasks, getTasks);
  const [remoteTasks, setRemoteTasks] = useState<Task[]>([]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const data = await listRemoteTasks();
        if (!cancelled) setRemoteTasks(data);
      } catch {
        if (!cancelled) setRemoteTasks([]);
      }
    };

    void load();
    const timer = window.setInterval(() => {
      void load();
    }, 3000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  const mergedTasks = useMemo(
    () => [...remoteTasks, ...localTasks.filter((task) => task.agentType !== 'media')],
    [localTasks, remoteTasks],
  );
  const entries = useMemo(
    () => buildResultEntries(mergedTasks, { canEditSkill: canAccessStudio() }),
    [mergedTasks],
  );

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-start gap-4 max-w-3xl">
        <div className="w-12 h-12 rounded-2xl bg-[#f0f0f2] flex items-center justify-center shrink-0">
          <FolderOpen className="w-6 h-6 text-black/55" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold font-display">成果中心</h1>
          <p className="text-sm text-black/55 leading-relaxed">
            这里汇总已经正式完成的任务产物。你可以直接回到任务详情继续查看交付，也可以在创作者身份下返回对应 Skill 继续编辑。
          </p>
        </div>
      </div>

      {entries.length === 0 ? (
        <div className="max-w-3xl rounded-[24px] border border-black/8 bg-white p-6 text-sm text-black/45">
          还没有可展示的正式成果。先去
          <Link to="/app/tasks" className="mx-1 font-medium text-black hover:underline">
            任务中心
          </Link>
          完成一个任务，成果中心就会自动收录。
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {entries.map((entry) => (
            <article key={entry.id} className="rounded-[24px] border border-black/8 bg-white p-5 shadow-sm space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-[11px] uppercase tracking-[0.12em] text-black/35">{entry.agentLabel}</p>
                  <h2 className="text-xl font-semibold text-[#1A1A1A]">{entry.title}</h2>
                  <p className="text-sm text-black/48">完成时间：{entry.completedAtLabel}</p>
                </div>
                <span className="rounded-full bg-[#F2F6F4] px-3 py-1 text-xs font-semibold text-[#0F766E]">
                  已完成
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-[#F7F7F8] px-4 py-3">
                  <p className="text-[11px] uppercase tracking-[0.08em] text-black/35">成果规模</p>
                  <p className="mt-1 text-sm font-medium text-[#1A1A1A]">{entry.artifactSummary}</p>
                </div>
                <div className="rounded-2xl bg-[#F7F7F8] px-4 py-3">
                  <p className="text-[11px] uppercase tracking-[0.08em] text-black/35">Token 消耗</p>
                  <p className="mt-1 text-sm font-medium text-[#1A1A1A]">{entry.tokenUsedLabel}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {entry.artifactLabels.map((label) => (
                  <span
                    key={label}
                    className="rounded-full border border-black/8 bg-white px-3 py-1.5 text-xs text-black/58"
                  >
                    {label}
                  </span>
                ))}
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  to={entry.openTaskHref}
                  className="inline-flex items-center justify-center rounded-xl bg-black px-4 py-2.5 text-sm font-semibold text-white hover:bg-black/90"
                >
                  查看正式产物
                </Link>
                {entry.editSkillHref ? (
                  <Link
                    to={entry.editSkillHref}
                    className="inline-flex items-center gap-2 rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-semibold text-black/72 hover:bg-[#F7F7F8]"
                  >
                    <PencilLine className="h-4 w-4" />
                    编辑 Skill
                  </Link>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
