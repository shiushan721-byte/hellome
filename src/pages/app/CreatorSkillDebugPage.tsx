import type { ReactNode } from 'react';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Bug, Play, TerminalSquare, Wand2 } from 'lucide-react';
import { runStudioSkillDebug } from '../../lib/skillStudioApi';
import { createRemoteUgcTask } from '../../lib/taskApi';
import type { SkillDebugInput, SkillDebugResult } from '../../types/skills';
import SkillStudioNav from '../../components/app/studio/SkillStudioNav';

export default function CreatorSkillDebugPage() {
  const { skillId = 'media-ugc' } = useParams();
  const navigate = useNavigate();
  const [input, setInput] = useState<SkillDebugInput>({
    sellingPoint: '补水不黏腻，夏天通勤 10 秒上脸就能出门。',
    platform: '抖音',
    effectGoal: '更像真人种草',
    referenceDirection: '真实试用、首秒抓人、轻转化',
  });
  const [running, setRunning] = useState(false);
  const [creatingTask, setCreatingTask] = useState(false);
  const [result, setResult] = useState<SkillDebugResult | null>(null);
  const [error, setError] = useState('');

  const handleRun = async () => {
    setRunning(true);
    setError('');
    try {
      const next = await runStudioSkillDebug(skillId, input);
      setResult(next);
    } catch (runError) {
      setError(runError instanceof Error ? runError.message : 'Skill 调试失败');
    } finally {
      setRunning(false);
    }
  };

  const handleCreateRealTask = async () => {
    setCreatingTask(true);
    setError('');
    try {
      const task = await createRemoteUgcTask({
        skillId,
        sellingPoint: input.sellingPoint,
        platform: input.platform,
        effectGoal: input.effectGoal,
        referenceUrl: input.referenceDirection,
      });
      navigate(`/app/tasks/${task.id}`);
    } catch (taskError) {
      setError(taskError instanceof Error ? taskError.message : '真实视频任务创建失败');
    } finally {
      setCreatingTask(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full space-y-6">
      <header className="bg-white border border-black/8 rounded-[28px] p-6 sm:p-8 space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full bg-[#F5F6F8] px-3 py-1 text-[11px] font-semibold text-black/55">
          <Bug className="w-3.5 h-3.5" />
          Skill 调试
        </div>
        <h1 className="text-2xl font-bold font-display">短视频客户交付 Agent 调试台</h1>
        <p className="text-sm text-black/55 max-w-3xl">
          这里调的是结果导向任务包的内容和执行逻辑，不是让创作者重新搭一套用户前台页面。
        </p>
      </header>

      <SkillStudioNav skillId={skillId} />

      {error ? <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 px-3 py-2 rounded-xl">{error}</p> : null}

      <div className="grid grid-cols-1 xl:grid-cols-[360px_minmax(0,1fr)_360px] gap-5">
        <Panel title="测试输入" icon={Play}>
          <DebugField label="产品卖点" value={input.sellingPoint} onChange={(value) => setInput({ ...input, sellingPoint: value })} multiline />
          <DebugField label="目标平台" value={input.platform} onChange={(value) => setInput({ ...input, platform: value })} />
          <DebugField label="风格目标" value={input.effectGoal} onChange={(value) => setInput({ ...input, effectGoal: value })} />
          <DebugField
            label="参考方向"
            value={input.referenceDirection ?? ''}
            onChange={(value) => setInput({ ...input, referenceDirection: value })}
            multiline
          />
          <button
            type="button"
            onClick={() => {
              void handleRun();
            }}
            disabled={running}
            className="w-full h-11 rounded-xl bg-black text-white text-sm font-semibold disabled:opacity-70"
          >
            {running ? '调试中...' : '运行调试'}
          </button>
          <div className="rounded-2xl border border-black/10 bg-[#FCFCFD] px-4 py-4 space-y-3">
            <p className="text-sm font-medium">真实视频任务验证</p>
            <p className="text-sm leading-relaxed text-black/55">
              调试通过后，可直接用当前 skill 和这组输入创建真实视频任务，进入任务页验证执行链路。
            </p>
            <div className="grid grid-cols-1 gap-2 text-sm text-black/58">
              <MiniMeta label="当前 Skill" value={skillId} />
              <MiniMeta label="任务平台" value={input.platform} />
              <MiniMeta label="结果风格" value={input.effectGoal} />
            </div>
            <button
              type="button"
              onClick={() => {
                void handleCreateRealTask();
              }}
              disabled={creatingTask}
              className="w-full h-11 rounded-xl border border-black/10 bg-white text-sm font-semibold text-black/72 disabled:opacity-70"
            >
              {creatingTask ? '任务创建中...' : '发起真实视频任务验证'}
            </button>
          </div>
        </Panel>

        <Panel title="系统理解与中间结果" icon={Wand2}>
          <ResultBlock
            title="系统理解"
            text={
              result?.understanding.targetAudience ??
              '运行调试后，这里会展示模型生成的目标用户与内容理解。'
            }
          />
          <ResultBlock
            title="视频风格"
            text={result?.understanding.videoStyle ?? '等待调试输出'}
          />
          <ResultBlock
            title="脚本草案"
            text={result?.understanding.draftScript ?? '等待调试输出'}
          />
        </Panel>

        <Panel title="日志与调试输出" icon={TerminalSquare}>
          {result?.logs?.length ? (
            result.logs.map((log, index) => (
              <LogRow key={`${log.level}-${index}`} level={log.level} text={log.message} />
            ))
          ) : (
            <LogRow level="info" text="运行调试后，这里会展示当前 SkillVersion 的执行日志。" />
          )}
          {result ? (
            <div className="rounded-2xl border border-black/10 bg-[#FCFCFD] px-4 py-3 space-y-1">
              <p className="text-sm font-medium">模型来源</p>
              <p className="text-sm text-black/55">{result.provider} / {result.model} / {result.source}</p>
            </div>
          ) : null}
        </Panel>
      </div>
    </div>
  );
}

function Panel({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: typeof Play;
  children: ReactNode;
}) {
  return (
    <section className="bg-white border border-black/8 rounded-[24px] p-5 sm:p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-black/55" />
        <h2 className="text-lg font-semibold">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function DebugField({
  label,
  value,
  onChange,
  multiline = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-black/45 uppercase tracking-[0.16em]">{label}</p>
      {multiline ? (
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full min-h-[88px] rounded-2xl border border-black/10 bg-[#FCFCFD] px-4 py-3 text-sm text-black/70 outline-none focus:ring-2 focus:ring-black/5"
        />
      ) : (
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full h-11 rounded-2xl border border-black/10 bg-[#FCFCFD] px-4 text-sm text-black/70 outline-none focus:ring-2 focus:ring-black/5"
        />
      )}
    </div>
  );
}

function ResultBlock({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-black/10 bg-[#FCFCFD] px-4 py-3 space-y-1">
      <p className="text-sm font-medium">{title}</p>
      <p className="text-sm text-black/55 leading-relaxed whitespace-pre-wrap">{text}</p>
    </div>
  );
}

function LogRow({ level, text }: { level: 'success' | 'info' | 'warning' | 'error'; text: string }) {
  const tone =
    level === 'success'
      ? 'text-emerald-700 bg-emerald-50'
      : level === 'warning'
        ? 'text-amber-800 bg-amber-50'
        : level === 'error'
          ? 'text-rose-700 bg-rose-50'
          : 'text-black/65 bg-[#F5F6F8]';

  return <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${tone}`}>{text}</div>;
}

function MiniMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-black/8 bg-white px-4 py-3">
      <p className="text-[11px] uppercase tracking-[0.14em] text-black/35">{label}</p>
      <p className="mt-1 text-sm text-black/68">{value}</p>
    </div>
  );
}
