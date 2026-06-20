import { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Play, Rocket, Save, Sparkles } from 'lucide-react';
import {
  getStudioSkill,
  publishStudioSkill,
  runStudioSkillDebug,
  updateStudioSkill,
} from '../../lib/skillStudioApi';
import { normalizeSkillRecord } from '../../lib/skillDraft';
import {
  buildCreateHeroTitle,
  buildDebugInputFromBusiness,
  buildEditBusinessSentence,
  type BusinessScenario,
  type CustomerType,
  type OptimizationDirection,
} from '../../lib/creatorStudio';
import type { SkillDebugResult, SkillRecord } from '../../types/skills';
import SkillStudioNav from '../../components/app/studio/SkillStudioNav';
import BusinessFlowPreviewPanel from '../../components/app/studio/BusinessFlowPreviewPanel';
import {
  BusinessCustomerTypeSelector,
  BusinessScenarioSelector,
  OptimizationDirectionSelector,
} from '../../components/app/studio/BusinessScenarioSelector';

const DEFAULT_CREATE_CUSTOMER_TYPE: CustomerType = '制造业企业';
const DEFAULT_CREATE_SCENARIO: BusinessScenario = '设备演示';
const DEFAULT_EDIT_CUSTOMER_TYPE: CustomerType = '本地门店';
const DEFAULT_EDIT_SCENARIO: BusinessScenario = '门店宣传';
const DEFAULT_DIRECTION: OptimizationDirection = '结果展示';
const DEFAULT_INSTRUCTION = '让结果更像门店宣传片，而不是促销海报页；强调空间感、氛围感和品牌感。';

export default function CreatorSkillEditorPage() {
  const { skillId = 'media-ugc' } = useParams();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode') === 'create' ? 'create' : 'edit';

  const [skill, setSkill] = useState<SkillRecord | null>(null);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [debugging, setDebugging] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [debugResult, setDebugResult] = useState<SkillDebugResult | null>(null);
  const [customerType, setCustomerType] = useState<CustomerType>(
    mode === 'create' ? DEFAULT_CREATE_CUSTOMER_TYPE : DEFAULT_EDIT_CUSTOMER_TYPE,
  );
  const [scenario, setScenario] = useState<BusinessScenario>(
    mode === 'create' ? DEFAULT_CREATE_SCENARIO : DEFAULT_EDIT_SCENARIO,
  );
  const [direction, setDirection] = useState<OptimizationDirection>(DEFAULT_DIRECTION);
  const [instruction, setInstruction] = useState(DEFAULT_INSTRUCTION);

  useEffect(() => {
    let cancelled = false;
    void getStudioSkill(skillId)
      .then((data) => {
        if (cancelled) return;
        setSkill(normalizeSkillRecord(data));
      })
      .catch((loadError) => {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : '读取 Skill 失败');
      });
    return () => {
      cancelled = true;
    };
  }, [skillId]);

  const heroTitle = useMemo(
    () => (mode === 'create' ? buildCreateHeroTitle(customerType, scenario) : buildEditBusinessSentence(customerType, scenario)),
    [mode, customerType, scenario],
  );

  const latestSummary = useMemo(() => {
    if (!debugResult) return '';
    return mode === 'create'
      ? `草稿已生成：${debugResult.understanding.outputGoal}`
      : `本次改写将重点影响：${direction} · ${debugResult.understanding.videoStyle}`;
  }, [debugResult, mode, direction]);

  const buildDraftSkill = (): SkillRecord | null => {
    if (!skill) return null;
    return {
      ...skill,
      latestVersion: {
        ...skill.latestVersion,
        title: mode === 'create' ? `${scenario}视频智能体` : skill.latestVersion.title,
        summary: mode === 'create' ? `${customerType} · ${scenario}` : skill.latestVersion.summary,
        businessFrame: {
          ...skill.latestVersion.businessFrame,
          goal: {
            ...skill.latestVersion.businessFrame.goal,
            summary: mode === 'create' ? `帮助${customerType}更高效完成${scenario}` : `持续优化${customerType}的${scenario}智能体表现`,
            scenarios: [scenario],
          },
        },
      },
    };
  };

  const persistDraft = async () => {
    const nextDraft = buildDraftSkill();
    if (!nextDraft) return null;
    const next = await updateStudioSkill(nextDraft.id, {
      name: nextDraft.name,
      description: nextDraft.description,
      latestVersion: nextDraft.latestVersion,
    });
    const normalized = normalizeSkillRecord(next);
    setSkill(normalized);
    return normalized;
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setMessage('');
    try {
      await persistDraft();
      setMessage(mode === 'create' ? '业务草稿已保存，可继续生成智能体。' : '智能体业务改写已保存，可继续预演。');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!skill) return;
    setPublishing(true);
    setError('');
    setMessage('');
    try {
      await persistDraft();
      const next = await publishStudioSkill(skill.id);
      setSkill(normalizeSkillRecord(next));
      setMessage('当前草稿已发布，前台开始读取这个版本。');
    } catch (publishError) {
      setError(publishError instanceof Error ? publishError.message : '发布失败');
    } finally {
      setPublishing(false);
    }
  };

  const handlePreview = async () => {
    if (!skill) return;
    setDebugging(true);
    setError('');
    setMessage('');
    try {
      await persistDraft();
      const next = await runStudioSkillDebug(
        skill.id,
        buildDebugInputFromBusiness({
          customerType,
          scenario,
          instruction: mode === 'edit' ? instruction : undefined,
        }),
      );
      setDebugResult(next);
      setMessage(mode === 'create' ? '智能体草稿已生成，可继续细化前台与执行链路。' : '智能体改写预演已完成，可继续验证结果表现。');
    } catch (previewError) {
      setError(previewError instanceof Error ? previewError.message : '预演失败');
    } finally {
      setDebugging(false);
    }
  };

  if (!skill) {
    return (
      <div className="w-full p-4 sm:p-6 lg:p-8">
        <p className="text-sm text-black/45">{error || '读取 Skill 中...'}</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 p-4 sm:p-6 lg:p-8">
      <header className="rounded-[28px] border border-black/[0.08] bg-white p-6 sm:p-8">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#F5F6F8] px-3 py-1 text-[11px] font-semibold text-black/55">
              <Sparkles className="h-3.5 w-3.5" />
              HelloMe 智能体工坊
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#1A1A1A]">
                {mode === 'create' ? '新建业务智能体' : '优化已有智能体'}
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-black/55">
                {mode === 'create'
                  ? '先把业务任务讲清楚，系统会据此生成视频智能体草稿。'
                  : '先确认这次修改目标，再发送给 Hermes 改写智能体。'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                void handlePreview();
              }}
              disabled={debugging}
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-black/10 bg-white px-4 text-sm font-medium text-black/70 disabled:opacity-60"
            >
              <Play className="h-4 w-4" />
              {debugging ? '预演中...' : mode === 'create' ? '生成草稿预演' : '改写预演'}
            </button>
            <button
              type="button"
              onClick={() => {
                void handleSave();
              }}
              disabled={saving}
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-black/10 bg-[#FCFCFD] px-4 text-sm font-medium text-black/80 disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              {saving ? '保存中...' : '保存草稿'}
            </button>
            <button
              type="button"
              onClick={() => {
                void handlePublish();
              }}
              disabled={publishing}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-black px-4 text-sm font-semibold text-white disabled:opacity-60"
            >
              <Rocket className="h-4 w-4" />
              {publishing ? '发布中...' : '发布到前台'}
            </button>
          </div>
        </div>
      </header>

      <SkillStudioNav skillId={skill.id} />

      {message ? (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
          {error}
        </p>
      ) : null}

      <div className="grid grid-cols-1 gap-5 2xl:grid-cols-[minmax(0,0.96fr)_minmax(420px,0.92fr)]">
        <section className="rounded-[28px] border border-black/[0.06] bg-white p-5 shadow-sm sm:p-6">
          <div className="space-y-6">
            <div className="rounded-[24px] border border-black/[0.06] bg-[#FCFCFD] p-5">
              <p className="text-[11px] uppercase tracking-[0.16em] text-black/35">
                {mode === 'create' ? '业务表达' : '当前业务定位'}
              </p>
              <h2 className="mt-3 text-2xl font-semibold leading-tight text-[#1A1A1A]">{heroTitle}</h2>
            </div>

            {mode === 'create' ? (
              <>
                <BusinessCustomerTypeSelector value={customerType} onChange={setCustomerType} />
                <BusinessScenarioSelector value={scenario} onChange={setScenario} />
                <CompactToneCard
                  title="发送给 Hermes 之前"
                  lines={['系统会先生成智能体草稿', '再补全默认执行链路与前台页面结构']}
                />
                <StickyPrimaryAction
                  label="✨ 开始生成智能体草稿"
                  helper="确认后发送给 Hermes"
                  disabled={debugging}
                  onClick={() => {
                    void handlePreview();
                  }}
                />
              </>
            ) : (
              <>
                <OptimizationDirectionSelector value={direction} onChange={setDirection} />
                <section className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-[#1A1A1A]">明确优化指令</h3>
                    <button
                      type="button"
                      onClick={() =>
                        setInstruction((current) =>
                          current.includes('更专业')
                            ? current
                            : `${current}；整体再更专业、更可信一些。`,
                        )
                      }
                      className="rounded-full border border-black/[0.08] bg-white px-3 py-1 text-xs text-black/55"
                    >
                      ✨ AI 润色指令
                    </button>
                  </div>
                  <textarea
                    value={instruction}
                    onChange={(event) => setInstruction(event.target.value)}
                    className="min-h-[160px] w-full rounded-[24px] border border-black/[0.08] bg-[#FCFCFD] px-4 py-4 text-sm leading-7 text-black/72 outline-none focus:ring-2 focus:ring-black/5"
                  />
                </section>
                <section className="rounded-[24px] border border-black/[0.06] bg-[#FCFCFD] p-4">
                  <h3 className="text-sm font-semibold text-[#1A1A1A]">本次修改输入预览</h3>
                  <div className="mt-3 grid grid-cols-1 gap-3 text-sm text-black/58 sm:grid-cols-2">
                    <PreviewMeta label="行业 / 客户类型" value={customerType} />
                    <PreviewMeta label="使用场景" value={scenario} />
                    <PreviewMeta label="优化方向" value={direction} />
                    <PreviewMeta label="执行方式" value="确认后发送给 Hermes" />
                  </div>
                </section>
                <StickyPrimaryAction
                  label="✨ 开始改写智能体"
                  helper="确认后发送给 Hermes"
                  disabled={debugging}
                  onClick={() => {
                    void handlePreview();
                  }}
                />
              </>
            )}

            {latestSummary ? (
              <section className="rounded-[24px] border border-emerald-200 bg-emerald-50 p-4">
                <p className="text-sm font-semibold text-emerald-800">最近一次预演结果</p>
                <p className="mt-2 text-sm leading-6 text-emerald-700">{latestSummary}</p>
                {debugResult ? (
                  <p className="mt-2 text-xs text-emerald-700">
                    {debugResult.provider} / {debugResult.model} / {debugResult.source}
                  </p>
                ) : null}
              </section>
            ) : null}
          </div>
        </section>

        <BusinessFlowPreviewPanel
          mode={mode}
          customerType={customerType}
          scenario={scenario}
          instruction={instruction}
        />
      </div>
    </div>
  );
}

function PreviewMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-black/[0.05] bg-white px-4 py-3">
      <p className="text-[11px] uppercase tracking-[0.12em] text-black/35">{label}</p>
      <p className="mt-2 text-sm text-black/68">{value}</p>
    </div>
  );
}

function CompactToneCard({ title, lines }: { title: string; lines: string[] }) {
  return (
    <section className="rounded-[24px] border border-black/[0.06] bg-[#FCFCFD] p-4">
      <h3 className="text-sm font-semibold text-[#1A1A1A]">{title}</h3>
      <div className="mt-3 space-y-2 text-sm leading-6 text-black/55">
        {lines.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </div>
    </section>
  );
}

function StickyPrimaryAction({
  label,
  helper,
  disabled,
  onClick,
}: {
  label: string;
  helper: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <div className="sticky bottom-0 rounded-[24px] border border-black/[0.06] bg-white/92 p-4 backdrop-blur">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className="h-12 w-full rounded-2xl bg-black text-sm font-semibold text-white disabled:opacity-60"
      >
        {label}
      </button>
      <p className="mt-2 text-center text-xs text-black/42">{helper}</p>
    </div>
  );
}
