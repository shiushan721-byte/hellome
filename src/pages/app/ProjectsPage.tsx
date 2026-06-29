import { useEffect, useState, useSyncExternalStore } from 'react';
import { FolderKanban, Plus } from 'lucide-react';
import {
  createProject,
  getProjects,
  subscribeProjects,
  updateProject,
} from '../../lib/projectStore';
import type { ProjectProfile } from '../../types/workbench';

const emptyDraft = {
  name: '',
  brandName: '',
  websiteUrl: '',
  productIntro: '',
  targetAudience: '',
  keywords: '',
  competitors: '',
  sellingPoints: '',
  tone: '',
  notes: '',
};

export default function ProjectsPage() {
  const projects = useSyncExternalStore(subscribeProjects, getProjects, getProjects);
  const [activeId, setActiveId] = useState('');
  const activeProject = projects.find((project) => project.id === activeId) ?? projects[0] ?? null;

  useEffect(() => {
    if (!activeId && projects[0]) setActiveId(projects[0].id);
    if (activeId && !projects.some((project) => project.id === activeId)) setActiveId(projects[0]?.id ?? '');
  }, [activeId, projects]);

  const handleCreate = () => {
    const project = createProject({ name: '新项目' });
    setActiveId(project.id);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display">项目</h1>
          <p className="mt-1 text-sm text-black/45">
            项目用于沉淀品牌资料，并为不同智能体自动预填可复用信息。
          </p>
        </div>
        <button
          type="button"
          onClick={handleCreate}
          className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-black px-4 text-xs font-bold text-white"
        >
          <Plus className="h-4 w-4" />
          新建项目
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="rounded-2xl border border-black/8 bg-white p-10 text-center">
          <FolderKanban className="mx-auto h-10 w-10 text-black/25" />
          <p className="mt-4 text-sm font-bold text-black/70">还没有项目</p>
          <p className="mt-2 text-sm text-black/45">创建项目后，GEO、视频、销售等智能体可以复用同一套资料。</p>
          <button
            type="button"
            onClick={handleCreate}
            className="mt-5 rounded-lg bg-black px-4 py-2 text-xs font-bold text-white"
          >
            创建第一个项目
          </button>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="rounded-2xl border border-black/8 bg-white p-2">
            {projects.map((project) => (
              <button
                key={project.id}
                type="button"
                onClick={() => setActiveId(project.id)}
                className={`w-full rounded-xl px-3 py-3 text-left transition-colors ${
                  activeProject?.id === project.id ? 'bg-[#EAF6F4]' : 'hover:bg-black/[0.03]'
                }`}
              >
                <p className="truncate text-sm font-bold text-black/80">{project.name}</p>
                <p className="mt-1 truncate text-xs text-black/40">{project.brandName || '未填写品牌名'}</p>
              </button>
            ))}
          </aside>

          {activeProject ? <ProjectEditor key={activeProject.id} project={activeProject} /> : null}
        </div>
      )}
    </div>
  );
}

function ProjectEditor({ project }: { project: ProjectProfile }) {
  const [draft, setDraft] = useState({
    ...emptyDraft,
    ...project,
  });
  const [saved, setSaved] = useState(false);

  const update = (key: keyof typeof emptyDraft, value: string) => {
    setSaved(false);
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    updateProject(project.id, draft);
    setSaved(true);
  };

  return (
    <section className="rounded-2xl border border-black/8 bg-white p-5 space-y-5">
      <div>
        <h2 className="text-lg font-bold text-black/85">项目资料</h2>
        <p className="mt-1 text-xs text-black/45">这些资料会用于智能体表单预填，用户在每次任务前仍可修改。</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <TextField label="项目名称" value={draft.name} onChange={(value) => update('name', value)} required />
        <TextField label="品牌名" value={draft.brandName || ''} onChange={(value) => update('brandName', value)} />
        <TextField label="官网 URL" value={draft.websiteUrl || ''} onChange={(value) => update('websiteUrl', value)} />
        <TextField label="目标客户" value={draft.targetAudience || ''} onChange={(value) => update('targetAudience', value)} />
        <TextField label="核心关键词" value={draft.keywords || ''} onChange={(value) => update('keywords', value)} />
        <TextField label="竞品" value={draft.competitors || ''} onChange={(value) => update('competitors', value)} />
      </div>

      <TextArea label="产品 / 服务介绍" value={draft.productIntro || ''} onChange={(value) => update('productIntro', value)} />
      <TextArea label="品牌卖点" value={draft.sellingPoints || ''} onChange={(value) => update('sellingPoints', value)} />
      <TextArea label="常用语气" value={draft.tone || ''} onChange={(value) => update('tone', value)} />
      <TextArea label="补充说明" value={draft.notes || ''} onChange={(value) => update('notes', value)} />

      <div className="flex items-center justify-end gap-3">
        {saved ? <span className="text-xs text-[#0F766E]">已保存</span> : null}
        <button
          type="button"
          onClick={handleSave}
          className="rounded-lg bg-black px-4 py-2 text-xs font-bold text-white"
        >
          保存项目资料
        </button>
      </div>
    </section>
  );
}

function TextField({
  label,
  value,
  onChange,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-xs font-bold text-black/55">
        {label}
        {required ? ' *' : ''}
      </span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 h-10 w-full rounded-lg border border-black/10 px-3 text-sm outline-none focus:border-[#14958A]/40 focus:ring-2 focus:ring-[#14958A]/15"
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-xs font-bold text-black/55">{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={3}
        className="mt-2 w-full rounded-lg border border-black/10 px-3 py-2 text-sm leading-6 outline-none focus:border-[#14958A]/40 focus:ring-2 focus:ring-[#14958A]/15"
      />
    </label>
  );
}
