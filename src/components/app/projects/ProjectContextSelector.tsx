import { useMemo, useState, useSyncExternalStore } from 'react';
import { FolderKanban, Plus, Sparkles } from 'lucide-react';
import {
  createProject,
  getProjects,
  setActiveProjectId,
  subscribeProjects,
} from '../../../lib/projectStore';
import type { ProjectProfile } from '../../../types/workbench';

interface ProjectContextSelectorProps {
  selectedProjectId: string;
  onSelectProject: (project: ProjectProfile | null) => void;
  seed?: {
    brandName?: string;
    websiteUrl?: string;
    keywords?: string;
    competitors?: string;
  };
}

export default function ProjectContextSelector({
  selectedProjectId,
  onSelectProject,
  seed,
}: ProjectContextSelectorProps) {
  const projects = useSyncExternalStore(subscribeProjects, getProjects, getProjects);
  const [creating, setCreating] = useState(false);
  const [projectName, setProjectName] = useState('');

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId) ?? null,
    [projects, selectedProjectId],
  );

  const handleSelect = (projectId: string) => {
    if (!projectId) {
      setActiveProjectId('');
      onSelectProject(null);
      return;
    }
    const project = projects.find((item) => item.id === projectId);
    if (!project) return;
    setActiveProjectId(project.id);
    onSelectProject(project);
  };

  const handleCreate = () => {
    const project = createProject({
      name: projectName.trim() || seed?.brandName || '新项目',
      brandName: seed?.brandName,
      websiteUrl: seed?.websiteUrl,
      keywords: seed?.keywords,
      competitors: seed?.competitors,
    });
    setCreating(false);
    setProjectName('');
    onSelectProject(project);
  };

  return (
    <section className="rounded-xl border border-black/10 bg-[#F7F8FA] p-3 space-y-3">
      <div className="flex items-start gap-2">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white border border-black/8">
          <FolderKanban className="h-4 w-4 text-black/55" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-black/80">项目上下文</p>
          <p className="mt-0.5 text-xs leading-5 text-black/45">
            选择项目会复用项目资料，并隔离 Hermes 记忆。
          </p>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
        <select
          value={selectedProjectId}
          onChange={(event) => handleSelect(event.target.value)}
          className="h-10 rounded-lg border border-black/10 bg-white px-3 text-sm outline-none focus:border-[#14958A]/40 focus:ring-2 focus:ring-[#14958A]/15"
        >
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => setCreating((value) => !value)}
          className="h-10 rounded-lg border border-black/12 bg-white px-3 text-xs font-bold text-black/65 hover:bg-black/[0.02] flex items-center justify-center gap-1.5"
        >
          <Plus className="h-3.5 w-3.5" />
          新建项目
        </button>
      </div>

      {selectedProject ? (
        <div className="rounded-lg bg-white border border-black/8 p-3 text-xs text-black/55">
          <div className="flex items-center gap-1.5 font-bold text-[#0F766E]">
            <Sparkles className="h-3.5 w-3.5" />
            已使用项目资料预填，可随时修改
          </div>
          <p className="mt-1 truncate">
            {[
              selectedProject.brandName,
              selectedProject.websiteUrl,
              selectedProject.keywords,
            ]
              .filter(Boolean)
              .join(' · ') || '该项目暂无可复用资料'}
          </p>
        </div>
      ) : null}

      {creating ? (
        <div className="rounded-lg bg-white border border-black/8 p-3 space-y-2">
          <input
            value={projectName}
            onChange={(event) => setProjectName(event.target.value)}
            placeholder={seed?.brandName ? `${seed.brandName} 项目` : '项目名称'}
            className="h-10 w-full rounded-lg border border-black/10 px-3 text-sm outline-none focus:border-[#14958A]/40"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setCreating(false)}
              className="px-3 py-2 text-xs font-bold text-black/45 hover:text-black"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleCreate}
              className="px-3 py-2 text-xs font-bold bg-black text-white rounded-lg"
            >
              创建并使用
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
