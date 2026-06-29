import { useMemo, useSyncExternalStore } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, FolderOpen } from 'lucide-react';
import { getTasks, subscribeTasks } from '../../lib/taskStore';
import { buildResultEntries } from '../../lib/resultsCenter';

export default function ResultsPage() {
  const tasks = useSyncExternalStore(subscribeTasks, getTasks, getTasks);

  const entries = useMemo(() => {
    return buildResultEntries(tasks, { canEditSkill: false });
  }, [tasks]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full space-y-6">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-2xl bg-[#f0f0f2] flex items-center justify-center shrink-0">
          <FolderOpen className="w-6 h-6 text-black/55" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold font-display">成果中心</h1>
          <p className="text-sm text-black/55 leading-relaxed">
            汇总已完成任务产出的报告、文档、视频和交付物。所有新成果都归属到项目。
          </p>
        </div>
      </div>

      {entries.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-sm text-black/40">暂无成果记录</p>
          <Link to="/app/projects" className="mt-3 inline-block text-xs font-bold underline">
            前往项目中心
          </Link>
        </div>
      ) : (
        <div className="grid gap-3">
          {entries.map((entry) => (
            <article
              key={entry.id}
              className="rounded-2xl border border-black/8 bg-white p-4 shadow-sm flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-black/40">
                  <span>{entry.agentLabel}</span>
                  <span>·</span>
                  <span>{entry.completedAtLabel}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 ${
                      entry.projectLabel !== '未归属项目'
                        ? 'bg-[#EAF6F4] text-[#0F766E]'
                        : 'bg-[#F2F0ED] text-black/45'
                    }`}
                  >
                    {entry.projectLabel}
                  </span>
                </div>
                <h2 className="mt-2 truncate text-base font-semibold text-black/85">{entry.title}</h2>
                <p className="mt-1 text-xs text-black/50">{entry.artifactSummary}</p>
                {entry.artifactLabels.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {entry.artifactLabels.map((label) => (
                      <span key={label} className="rounded-full bg-black/[0.04] px-2 py-1 text-[11px] text-black/45">
                        {label}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className="font-mono text-xs text-black/45">{entry.tokenUsedLabel}</span>
                <Link
                  to={entry.openTaskHref}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-black px-3 text-xs font-bold text-white"
                >
                  查看任务
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
