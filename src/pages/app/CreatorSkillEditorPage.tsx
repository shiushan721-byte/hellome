import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronDown, Play, Rocket, Save, Sparkles } from 'lucide-react';
import {
  getStudioSkill,
  publishStudioSkill,
  runStudioSkillDebug,
  updateStudioSkill,
} from '../../lib/skillStudioApi';
import { normalizeSkillRecord } from '../../lib/skillDraft';
import type { SkillDebugInput, SkillDebugResult, SkillRecord } from '../../types/skills';
import BusinessFrameEditor from '../../components/app/studio/BusinessFrameEditor';
import SkillStudioNav from '../../components/app/studio/SkillStudioNav';
import SkillVisualWorkbenchPreview from '../../components/app/studio/SkillVisualWorkbenchPreview';

const PLATFORM_OPTIONS = ['抖音', '小红书', '视频号'] as const;
const EFFECT_OPTIONS = ['更像真人种草', '更像测评讲解', '更像带货转化'] as const;

export default function CreatorSkillEditorPage() {
  const { skillId = 'media-ugc' } = useParams();
  const [skill, setSkill] = useState<SkillRecord | null>(null);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [debugging, setDebugging] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [debugResult, setDebugResult] = useState<SkillDebugResult | null>(null);
  const [previewInput, setPreviewInput] = useState<SkillDebugInput>({
    sellingPoint: '补水不黏腻，夏天通勤 10 秒上脸就能出门。',
    platform: '抖音',
    effectGoal: '更像真人种草',
    referenceDirection: '真实试用、首秒抓人、轻转化',
  });

  useEffect(() => {
    let cancelled = false;
    void getStudioSkill(skillId)
      .then((data) => {
        if (!cancelled) setSkill(normalizeSkillRecord(data));
      })
      .catch((loadError) => {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : '读取 Skill 失败');
      });
    return () => {
      cancelled = true;
    };
  }, [skillId]);

  const activePlan = useMemo(() => {
    if (!skill) return null;
    const plans = skill.latestVersion.executionConfig.availablePlans ?? [];
    return (
      plans.find(
        (plan) => plan.id === skill.latestVersion.executionConfig.defaultPlanId,
      ) ?? plans[0]
    );
  }, [skill]);

  const handleSave = async () => {
    if (!skill) return;
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const next = await updateStudioSkill(skill.id, {
        name: skill.name,
        description: skill.description,
        latestVersion: skill.latestVersion,
      });
      setSkill(normalizeSkillRecord(next));
      setMessage('Skill 草稿已保存，可继续预览和调试。');
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
      const next = await publishStudioSkill(skill.id);
      setSkill(normalizeSkillRecord(next));
      setMessage('当前草稿已发布，前台开始读取这个版本。');
    } catch (publishError) {
      setError(publishError instanceof Error ? publishError.message : '发布失败');
    } finally {
      setPublishing(false);
    }
  };

  const handleDebug = async () => {
    if (!skill) return;
    setDebugging(true);
    setError('');
    try {
      const next = await runStudioSkillDebug(skill.id, previewInput);
      setDebugResult(next);
      setMessage('已完成一次系统理解预演。');
    } catch (debugError) {
      setError(debugError instanceof Error ? debugError.message : '调试失败');
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
              Skill 可视化编辑
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#1A1A1A]">{skill.name}</h1>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-black/55">
                在这里直接编辑 skill 的前台效果，而不是在 Hermes 里黑盒试错。创作者改完输入、理解、执行与交付配置后，可以立刻看到用户端会怎么呈现，再决定是否调试与发布。
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                void handleDebug();
              }}
              disabled={debugging}
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-black/10 bg-white px-4 text-sm font-medium text-black/70 disabled:opacity-60"
            >
              <Play className="h-4 w-4" />
              {debugging ? '预演中...' : '跑一次预演'}
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

      <div className="grid grid-cols-1 gap-5 2xl:grid-cols-[minmax(0,1.05fr)_520px]">
        <section className="space-y-5">
          <ConfigCard title="智能体工坊骨架">
            <p className="text-sm leading-6 text-black/55">
              先定义这个视频智能体服务的目标、预算路线、执行方案和结果承诺，再继续微调前台字段、理解逻辑和交付配置。
            </p>
            <BusinessFrameEditor
              value={skill.latestVersion.businessFrame}
              onChange={(businessFrame) =>
                setSkill({
                  ...skill,
                  latestVersion: {
                    ...skill.latestVersion,
                    businessFrame,
                  },
                })
              }
            />
          </ConfigCard>

          <ConfigCard title="前台文案与输入配置">
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              <EditableField
                label="Skill 名称"
                value={skill.name}
                onChange={(value) => setSkill({ ...skill, name: value })}
              />
              <EditableField
                label="前台标题"
                value={skill.latestVersion.title}
                onChange={(value) =>
                  setSkill({ ...skill, latestVersion: { ...skill.latestVersion, title: value } })
                }
              />
            </div>

            <EditableField
              label="Skill 描述"
              value={skill.description || ''}
              onChange={(value) => setSkill({ ...skill, description: value })}
              multiline
            />

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              <EditableField
                label="一句话卖点字段名"
                value={skill.latestVersion.inputConfig.sellingPointLabel}
                onChange={(value) =>
                  setSkill({
                    ...skill,
                    latestVersion: {
                      ...skill.latestVersion,
                      inputConfig: { ...skill.latestVersion.inputConfig, sellingPointLabel: value },
                    },
                  })
                }
              />
              <EditableField
                label="一句话卖点占位提示"
                value={skill.latestVersion.inputConfig.sellingPointPlaceholder}
                onChange={(value) =>
                  setSkill({
                    ...skill,
                    latestVersion: {
                      ...skill.latestVersion,
                      inputConfig: {
                        ...skill.latestVersion.inputConfig,
                        sellingPointPlaceholder: value,
                      },
                    },
                  })
                }
                multiline
              />
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              <EditableField
                label="产品图上传提示"
                value={skill.latestVersion.inputConfig.productImageHint}
                onChange={(value) =>
                  setSkill({
                    ...skill,
                    latestVersion: {
                      ...skill.latestVersion,
                      inputConfig: { ...skill.latestVersion.inputConfig, productImageHint: value },
                    },
                  })
                }
                multiline
              />
              <EditableField
                label="人物图上传提示"
                value={skill.latestVersion.inputConfig.talentImageHint}
                onChange={(value) =>
                  setSkill({
                    ...skill,
                    latestVersion: {
                      ...skill.latestVersion,
                      inputConfig: { ...skill.latestVersion.inputConfig, talentImageHint: value },
                    },
                  })
                }
                multiline
              />
            </div>

            <EditableField
              label="参考链接提示"
              value={skill.latestVersion.inputConfig.referenceUrlHint}
              onChange={(value) =>
                setSkill({
                  ...skill,
                  latestVersion: {
                    ...skill.latestVersion,
                    inputConfig: { ...skill.latestVersion.inputConfig, referenceUrlHint: value },
                  },
                })
              }
              multiline
            />
          </ConfigCard>

          <ConfigCard title="系统理解与确认逻辑">
            <EditableField
              label="System Prompt"
              value={skill.latestVersion.understandingConfig.prompt}
              onChange={(value) =>
                setSkill({
                  ...skill,
                  latestVersion: {
                    ...skill.latestVersion,
                    understandingConfig: { ...skill.latestVersion.understandingConfig, prompt: value },
                  },
                })
              }
              multiline
            />
            <EditableField
              label="高成本确认文案"
              value={skill.latestVersion.understandingConfig.confirmationMessage}
              onChange={(value) =>
                setSkill({
                  ...skill,
                  latestVersion: {
                    ...skill.latestVersion,
                    understandingConfig: {
                      ...skill.latestVersion.understandingConfig,
                      confirmationMessage: value,
                    },
                  },
                })
              }
              multiline
            />
          </ConfigCard>

          <ConfigCard title="执行与交付配置">
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              <SelectField
                label="执行模式"
                value={skill.latestVersion.executionConfig.mode}
                options={[
                  { label: '后端静默执行', value: 'backend_silent' },
                  { label: '本地调试模式', value: 'local_debug' },
                ]}
                onChange={(value) =>
                  setSkill({
                    ...skill,
                    latestVersion: {
                      ...skill.latestVersion,
                      executionConfig: {
                        ...skill.latestVersion.executionConfig,
                        mode: value as 'backend_silent' | 'local_debug',
                      },
                    },
                  })
                }
              />
              <SelectField
                label="调试模式"
                value={skill.latestVersion.executionConfig.debugMode}
                options={[
                  { label: '本地调试模式', value: 'local_debug' },
                  { label: '后端静默执行', value: 'backend_silent' },
                ]}
                onChange={(value) =>
                  setSkill({
                    ...skill,
                    latestVersion: {
                      ...skill.latestVersion,
                      executionConfig: {
                        ...skill.latestVersion.executionConfig,
                        debugMode: value as 'backend_silent' | 'local_debug',
                      },
                    },
                  })
                }
              />
              <EditableField
                label="视频 Provider"
                value={skill.latestVersion.executionConfig.videoProvider}
                onChange={(value) =>
                  setSkill({
                    ...skill,
                    latestVersion: {
                      ...skill.latestVersion,
                      executionConfig: {
                        ...skill.latestVersion.executionConfig,
                        videoProvider: value,
                      },
                    },
                  })
                }
              />
              <SelectField
                label="路由策略"
                value={skill.latestVersion.executionConfig.routingMode}
                options={[
                  { label: '自动路由', value: 'auto' },
                  { label: '固定方案', value: 'fixed' },
                ]}
                onChange={(value) =>
                  setSkill({
                    ...skill,
                    latestVersion: {
                      ...skill.latestVersion,
                      executionConfig: {
                        ...skill.latestVersion.executionConfig,
                        routingMode: value as 'auto' | 'fixed',
                      },
                    },
                  })
                }
              />
            </div>

            <SelectField
              label="默认执行方案"
              value={skill.latestVersion.executionConfig.defaultPlanId}
              options={(skill.latestVersion.executionConfig.availablePlans ?? []).map((plan) => ({
                label: plan.label,
                value: plan.id,
              }))}
              onChange={(value) =>
                setSkill({
                  ...skill,
                  latestVersion: {
                    ...skill.latestVersion,
                    executionConfig: { ...skill.latestVersion.executionConfig, defaultPlanId: value },
                  },
                })
              }
            />

            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-black/45">
                可用执行方案
              </p>
              {(skill.latestVersion.executionConfig.availablePlans ?? []).map((plan, index) => (
                <div
                  key={plan.id}
                  className="rounded-2xl border border-black/10 bg-[#FCFCFD] p-4 space-y-3"
                >
                  <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                    <EditableField
                      label={`方案 ${index + 1} 名称`}
                      value={plan.label}
                      onChange={(value) =>
                        updateRoutePlan(skill, setSkill, index, { ...plan, label: value })
                      }
                    />
                    <EditableField
                      label="方案 ID"
                      value={plan.id}
                      onChange={(value) =>
                        updateRoutePlan(skill, setSkill, index, { ...plan, id: value })
                      }
                    />
                  </div>

                  <EditableField
                    label="方案说明"
                    value={plan.description}
                    onChange={(value) =>
                      updateRoutePlan(skill, setSkill, index, { ...plan, description: value })
                    }
                    multiline
                  />
                  <EditableField
                    label="Provider Hint"
                    value={plan.providerHint}
                    onChange={(value) =>
                      updateRoutePlan(skill, setSkill, index, { ...plan, providerHint: value })
                    }
                  />
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-black/45">
                交付模板
              </p>
              {(skill.latestVersion.artifactConfig ?? []).map((artifact) => (
                <ArtifactRow key={artifact.fileName} label={artifact.label} fileName={artifact.fileName} />
              ))}
            </div>
          </ConfigCard>
        </section>

        <aside className="space-y-5">
          <ConfigCard title="前台预演输入">
            <EditableField
              label="卖点"
              value={previewInput.sellingPoint}
              onChange={(value) => setPreviewInput({ ...previewInput, sellingPoint: value })}
              multiline
            />

            <OptionField label="平台">
              <div className="flex flex-wrap gap-2">
                {PLATFORM_OPTIONS.map((platform) => (
                  <ChoiceChip
                    key={platform}
                    active={previewInput.platform === platform}
                    onClick={() => setPreviewInput({ ...previewInput, platform })}
                  >
                    {platform}
                  </ChoiceChip>
                ))}
              </div>
            </OptionField>

            <OptionField label="效果">
              <div className="flex flex-wrap gap-2">
                {EFFECT_OPTIONS.map((effect) => (
                  <ChoiceChip
                    key={effect}
                    active={previewInput.effectGoal === effect}
                    onClick={() => setPreviewInput({ ...previewInput, effectGoal: effect })}
                  >
                    {effect}
                  </ChoiceChip>
                ))}
              </div>
            </OptionField>

            <EditableField
              label="参考方向"
              value={previewInput.referenceDirection ?? ''}
              onChange={(value) => setPreviewInput({ ...previewInput, referenceDirection: value })}
              multiline
            />

            <div className="rounded-2xl border border-[#F4D6A0] bg-[#FFF8EA] px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.08em] text-[#A16207]">当前默认路由</p>
              <p className="mt-2 text-sm font-semibold text-[#1A1A1A]">
                {activePlan ? `${activePlan.label} · ${activePlan.providerHint}` : '未配置'}
              </p>
            </div>
          </ConfigCard>

          <SkillVisualWorkbenchPreview
            skill={skill}
            previewInput={previewInput}
            debugResult={debugResult}
          />

          {debugResult ? (
            <ConfigCard title="本次预演日志">
              <div className="space-y-2">
                {debugResult.logs.map((log, index) => (
                  <LogRow key={`${log.level}-${index}`} level={log.level} text={log.message} />
                ))}
              </div>
              <div className="rounded-2xl border border-black/10 bg-[#FCFCFD] px-4 py-3">
                <p className="text-sm font-medium text-[#1A1A1A]">模型来源</p>
                <p className="mt-1 text-sm text-black/55">
                  {debugResult.provider} / {debugResult.model} / {debugResult.source}
                </p>
              </div>
              <Link
                to={`/app/studio/skills/${skill.id}/debug`}
                className="inline-flex h-10 items-center rounded-xl border border-black/10 px-4 text-sm text-black/60"
              >
                进入完整调试页
              </Link>
            </ConfigCard>
          ) : null}
        </aside>
      </div>
    </div>
  );
}

function ConfigCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-[24px] border border-black/[0.08] bg-white p-5 sm:p-6 space-y-4">
      <h2 className="text-lg font-semibold text-[#1A1A1A]">{title}</h2>
      {children}
    </section>
  );
}

function EditableField({
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
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-black/45">{label}</p>
      {multiline ? (
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="min-h-[96px] w-full rounded-2xl border border-black/10 bg-[#FCFCFD] px-4 py-3 text-sm leading-relaxed text-black/70 outline-none transition-colors focus:border-black/20 focus:ring-2 focus:ring-black/5"
        />
      ) : (
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-11 w-full rounded-2xl border border-black/10 bg-[#FCFCFD] px-4 text-sm text-black/70 outline-none transition-colors focus:border-black/20 focus:ring-2 focus:ring-black/5"
        />
      )}
    </div>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<{ label: string; value: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-black/45">{label}</p>
      <div className="relative">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-11 w-full appearance-none rounded-2xl border border-black/10 bg-[#FCFCFD] px-4 pr-10 text-sm text-black/70 outline-none transition-colors focus:border-black/20 focus:ring-2 focus:ring-black/5"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-black/30" />
      </div>
    </div>
  );
}

function ArtifactRow({ label, fileName }: { label: string; fileName: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-black/10 bg-[#FCFCFD] px-4 py-3">
      <div>
        <p className="text-sm font-medium text-[#1A1A1A]">{label}</p>
        <p className="mt-1 text-xs text-black/45">{fileName}</p>
      </div>
      <span className="text-[11px] text-black/35">已配置</span>
    </div>
  );
}

function OptionField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-black/45">{label}</p>
      {children}
    </div>
  );
}

function ChoiceChip({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-2 text-sm transition-colors ${
        active ? 'bg-black text-white' : 'bg-[#F2F0ED] text-black/55 hover:bg-[#E7E3DD]'
      }`}
    >
      {children}
    </button>
  );
}

function LogRow({ level, text }: { level: 'success' | 'info' | 'warning' | 'error'; text: string }) {
  const tone =
    level === 'success'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
      : level === 'warning'
        ? 'border-amber-200 bg-amber-50 text-amber-800'
        : level === 'error'
          ? 'border-rose-200 bg-rose-50 text-rose-700'
          : 'border-black/10 bg-[#F5F6F8] text-black/65';

  return <div className={`rounded-2xl border px-4 py-3 text-sm leading-relaxed ${tone}`}>{text}</div>;
}

function updateRoutePlan(
  skill: SkillRecord,
  setSkill: (skill: SkillRecord) => void,
  index: number,
  nextPlan: SkillRecord['latestVersion']['executionConfig']['availablePlans'][number],
) {
  const availablePlans = skill.latestVersion.executionConfig.availablePlans.map((plan, planIndex) =>
    planIndex === index ? nextPlan : plan,
  );

  setSkill({
    ...skill,
    latestVersion: {
      ...skill.latestVersion,
      executionConfig: {
        ...skill.latestVersion.executionConfig,
        availablePlans,
      },
    },
  });
}
