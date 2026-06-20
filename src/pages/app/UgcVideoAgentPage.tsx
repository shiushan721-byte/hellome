import { type ReactNode, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, ImagePlus, Link2, Loader2 } from 'lucide-react';
import { getAgentById } from '../../data/agentsCatalog';
import type { AgentEntryState } from '../../types/agentNavigation';
import { getUserRole } from '../../lib/auth';
import { getHermesConnection, subscribeHermesConnection } from '../../lib/hermesConnection';
import {
  createRemoteUgcTask,
  getHermesRuntime,
  runHermesDebug,
  uploadTaskFile,
} from '../../lib/taskApi';
import { getSkillExperienceConfig, getSkillRuntimeConfig } from '../../lib/skillStudioApi';
import type { SkillExperienceConfig } from '../../types/skills';
import type { TaskExecutionMode, UgcTaskInput, UgcSystemUnderstanding } from '../../types/ugc';
import TaskResultSummaryBar from '../../components/app/tasks/TaskResultSummaryBar';
import TaskShowcaseStage from '../../components/app/tasks/TaskShowcaseStage';

const EFFECT_OPTIONS = ['更像真人种草', '更像测评讲解', '更像带货转化'] as const;
const EXECUTION_STEPS = [
  '理解需求',
  '生成脚本',
  '规划镜头',
  '生成人物 / 产品镜头',
  '合成样片',
  '导出交付包',
] as const;

type PreviewOption = {
  effect: (typeof EFFECT_OPTIONS)[number];
  badge: string;
  title: string;
  summary: string;
  hook: string;
  accent: string;
  chipTone: string;
  miniAccent: string;
};

type ExecutionPreset = {
  platform: string;
  effectGoal: (typeof EFFECT_OPTIONS)[number];
  formatLabel: string;
  deliveryLabel: string;
};

export default function UgcVideoAgentPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const entry = (location.state as AgentEntryState | null) ?? {};
  const routeAgentId = resolveUgcAgentId(location.pathname);
  const currentAgentId = entry.agentId ?? routeAgentId;
  const executionPreset = resolveExecutionPreset(currentAgentId);
  const agent = getAgentById(currentAgentId);
  const agentName = agent?.name ?? 'UGC 视频广告生成';
  const role = getUserRole();
  const isPowerUser = role === 'creator' || role === 'admin';
  const hermes = useSyncExternalStore(
    subscribeHermesConnection,
    getHermesConnection,
    getHermesConnection,
  );

  const productInputRef = useRef<HTMLInputElement | null>(null);
  const talentInputRef = useRef<HTMLInputElement | null>(null);

  const [sellingPoint, setSellingPoint] = useState('补水不黏腻，夏天通勤 10 秒上脸就能出门。');
  const [referenceUrl, setReferenceUrl] = useState('https://www.xiaohongshu.com/explore/ugc-skin-demo');
  const [productAsset, setProductAsset] = useState<{ url: string; fileName: string } | null>(null);
  const [talentAsset, setTalentAsset] = useState<{ url: string; fileName: string } | null>(null);
  const [understanding, setUnderstanding] = useState<UgcSystemUnderstanding>(() =>
    buildUnderstanding('补水不黏腻，夏天通勤 10 秒上脸就能出门。', executionPreset.effectGoal, executionPreset.platform),
  );
  const [executionMode, setExecutionMode] = useState<TaskExecutionMode>('backend_silent');
  const [runtimeNote, setRuntimeNote] = useState('后端执行');
  const [runtimeVersion, setRuntimeVersion] = useState<string | null>(null);
  const [skillRouteSummary, setSkillRouteSummary] = useState('自动匹配');
  const [skillExperience, setSkillExperience] = useState<SkillExperienceConfig | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDebugging, setIsDebugging] = useState(false);
  const [debugOutput, setDebugOutput] = useState('');
  const [error, setError] = useState('');
  const [showMoreSettings, setShowMoreSettings] = useState(false);
  const [showCostDetails, setShowCostDetails] = useState(false);
  const [showDeliveryDetails, setShowDeliveryDetails] = useState(false);
  const [showProgressDetails, setShowProgressDetails] = useState(false);

  const activePreview = buildPreviewOption(sellingPoint, executionPreset.platform, executionPreset.effectGoal);
  const previewTask = {
    name: agentName,
    status: 'queued' as const,
    costEstimate: '样片阶段 ￥120 - ￥260',
    input: {
      sellingPoint,
      platform: executionPreset.platform,
      effectGoal: executionPreset.effectGoal,
      referenceUrl: referenceUrl.trim() || undefined,
    },
    understanding,
    routePlan: {
      id: `preview-${currentAgentId}`,
      label: activePreview.title,
      providerHint: skillRouteSummary,
      reason: activePreview.summary,
    },
    steps: [
      { id: 'preview-received', name: '已接收', status: 'active' as const },
      { id: 'preview-planning', name: '方案规划', status: 'pending' as const },
      { id: 'preview-confirm', name: '确认节点', status: 'pending' as const },
      { id: 'preview-generate', name: '视频生成', status: 'pending' as const },
      { id: 'preview-delivery', name: '整理交付', status: 'pending' as const },
    ],
  };

  useEffect(() => {
    let cancelled = false;
    void getHermesRuntime()
      .then((runtime) => {
        if (cancelled) return;
        setExecutionMode(runtime.recommendedMode);
        setRuntimeNote(runtime.note);
        setRuntimeVersion(runtime.version);
      })
      .catch(() => {
        if (cancelled) return;
        setRuntimeNote('运行状态读取失败');
      });

    void getSkillRuntimeConfig(currentAgentId)
      .then((config) => {
        if (cancelled) return;
        const planNames = config.availablePlans.map((plan) => plan.label).join(' / ');
        setSkillRouteSummary(
          config.routingMode === 'fixed'
            ? `${config.defaultPlanId} · ${planNames}`
            : `自动匹配 · ${planNames}`,
        );
      })
      .catch(() => {
        if (cancelled) return;
      });

    void getSkillExperienceConfig(currentAgentId)
      .then((config) => {
        if (cancelled) return;
        setSkillExperience(config);
      })
      .catch(() => {
        if (cancelled) return;
      });

    return () => {
      cancelled = true;
    };
  }, [currentAgentId]);

  useEffect(() => {
    setUnderstanding(buildUnderstanding(sellingPoint, executionPreset.effectGoal, executionPreset.platform));
  }, [sellingPoint, executionPreset]);

  const handleUpload = async (file: File | undefined, kind: 'product' | 'talent') => {
    if (!file) return;
    setError('');
    const uploaded = await uploadTaskFile(file);
    if (kind === 'product') {
      setProductAsset({ url: uploaded.url, fileName: uploaded.fileName });
      return;
    }
    setTalentAsset({ url: uploaded.url, fileName: uploaded.fileName });
  };

  const handleSubmit = async () => {
    if (!sellingPoint.trim()) {
      setError('请先填写一句话卖点。');
      return;
    }

    setIsSubmitting(true);
    setError('');

    const payload: UgcTaskInput = {
      skillId: currentAgentId,
      productImageUrl: productAsset?.url,
      productImageName: productAsset?.fileName,
      talentImageUrl: talentAsset?.url,
      talentImageName: talentAsset?.fileName,
      sellingPoint: sellingPoint.trim(),
      platform: executionPreset.platform,
      effectGoal: executionPreset.effectGoal,
      referenceUrl: referenceUrl.trim() || undefined,
    };

    try {
      const task = await createRemoteUgcTask(payload);
      navigate(`/app/tasks/${task.id}`);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : '创建任务失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDebug = async () => {
    setIsDebugging(true);
    setDebugOutput('');
    try {
      const result = await runHermesDebug(`请用 UGC Video Factory 心智理解这个需求：${sellingPoint}`);
      setDebugOutput(result.stdout || result.stderr || 'Hermes CLI 返回为空');
    } catch (debugError) {
      setDebugOutput(debugError instanceof Error ? debugError.message : 'Hermes 调试失败');
    } finally {
      setIsDebugging(false);
    }
  };

  const deliverables =
    skillExperience?.artifactConfig.map((item) => item.fileName) ??
    ['sample-video.mp4', 'cover-frame.png', 'script.md', 'delivery-summary.pdf'];

  const costEstimateLabel = '样片阶段 ￥120 - ￥260';
  const primaryActionLabel = isSubmitting ? '创建任务中…' : '开始生成样片';

  return (
    <div className="min-h-full bg-[#F5F5F7] px-4 pt-4 pb-6 sm:px-6 lg:px-8 lg:pt-5 lg:pb-8 xl:px-10">
      <div className="w-full space-y-5">
        <header className="rounded-[28px] border border-black/[0.05] bg-white px-5 py-5 shadow-sm sm:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 text-[11px] text-black/35">
                <span>{agentName}</span>
              </div>
              <div>
                <h1 className="text-[28px] leading-none font-semibold tracking-tight text-[#1A1A1A]">
                  {skillExperience?.title ?? '视频智能体'}
                </h1>
                <p className="mt-3 text-sm leading-6 text-black/48">
                  {skillExperience?.businessFrame.result.promiseLine ?? '补齐最少输入，先生成一版样片方向；合适后再进入正式任务。'}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <StatusPill label="9:16 竖版" />
              <StatusPill label="10 秒样片" />
              <StatusPill
                label={executionMode === 'backend_silent' ? '后端静默执行' : '本地调试模式'}
                tone="accent"
              />
            </div>
          </div>
        </header>

        <input
          ref={productInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => {
            void handleUpload(event.target.files?.[0], 'product');
          }}
        />
        <input
          ref={talentInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => {
            void handleUpload(event.target.files?.[0], 'talent');
          }}
        />

        <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[380px_minmax(0,1fr)]">
          <aside className="space-y-4">
            <WorkbenchPanel title="提交本次素材">
              <div className="space-y-5">
                <FieldBlock label="素材上传">
                  <div className="grid grid-cols-1 gap-3">
                    <UploadCard
                      title="产品图 / 素材图"
                      subtitle={
                        productAsset?.fileName ??
                        skillExperience?.inputConfig.productImageHint ??
                        '上传包装图 / 单品图'
                      }
                      onClick={() => productInputRef.current?.click()}
                    />
                    <UploadCard
                      title="人物图 / 模特图"
                      subtitle={
                        talentAsset?.fileName ??
                        skillExperience?.inputConfig.talentImageHint ??
                        '上传自拍或模特参考'
                      }
                      onClick={() => talentInputRef.current?.click()}
                    />
                  </div>
                </FieldBlock>

                <TextAreaField
                  label={skillExperience?.inputConfig.sellingPointLabel ?? '一句话卖点'}
                  value={sellingPoint}
                  onChange={setSellingPoint}
                  placeholder={
                    skillExperience?.inputConfig.sellingPointPlaceholder ??
                    '比如：补水不黏腻，夏天通勤 10 秒上脸就能出门。'
                  }
                />

                <PresetNotice
                  text={`本智能体固定生成 ${executionPreset.effectGoal}，默认面向 ${executionPreset.platform}，输出 ${executionPreset.formatLabel} 样片。`}
                />

                <ExpandableCard
                  title="更多设置"
                  open={showMoreSettings}
                  onToggle={() => setShowMoreSettings((value) => !value)}
                >
                  <div className="space-y-4">
                    <InputField
                      label="参考链接 / 历史材料（可选）"
                      value={referenceUrl}
                      onChange={setReferenceUrl}
                      icon={Link2}
                      placeholder={skillExperience?.inputConfig.referenceUrlHint}
                    />
                    <FieldBlock label="补充说明">
                      <div className="space-y-2">
                        <ConfigRow label="交付方式" value={executionPreset.deliveryLabel} />
                        <ConfigRow label="执行方式" value="先出样片，再决定是否继续正式生成" />
                      </div>
                    </FieldBlock>
                  </div>
                </ExpandableCard>

                {error ? (
                  <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
                ) : null}

                <div className="sticky bottom-0 rounded-[20px] border border-black/[0.06] bg-white/96 p-3 backdrop-blur">
                  <div className="mb-3 flex items-center justify-between gap-3 rounded-2xl bg-[#F7F7F8] px-4 py-3">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.08em] text-black/35">预估成本</p>
                      <p className="mt-1 text-sm font-medium text-[#1A1A1A]">{costEstimateLabel}</p>
                    </div>
                    <span className="rounded-full bg-[#FFF3D8] px-3 py-1 text-xs font-semibold text-[#A16207]">
                      先冻结样片预算
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      void handleSubmit();
                    }}
                    disabled={isSubmitting}
                    className="h-12 w-full rounded-xl bg-black text-sm font-semibold text-white transition-colors hover:bg-black/90 disabled:opacity-60"
                  >
                    {primaryActionLabel}
                  </button>
                </div>
              </div>
            </WorkbenchPanel>
          </aside>

          <section className="space-y-4">
            <WorkbenchPanel title="结果预览" action={<TinyAction>智能体预设</TinyAction>}>
              <div className="space-y-4">
                <TaskShowcaseStage
                  task={previewTask}
                  primaryActionLabel={primaryActionLabel}
                  onPrimaryAction={() => {
                    void handleSubmit();
                  }}
                />
                <TaskResultSummaryBar task={previewTask} />
              </div>
            </WorkbenchPanel>

            <WorkbenchPanel title="交付与交易" action={<TinyAction>按需展开</TinyAction>}>
              <div className="space-y-3">
                <CompactSummaryCard title="可用余额" value="￥2,460" detail="样片确认前仅冻结预算" />

                <ExpandableCard
                  title="预估成本"
                  open={showCostDetails}
                  onToggle={() => setShowCostDetails((value) => !value)}
                >
                  <div className="space-y-3">
                    <CostHeroCard headline={costEstimateLabel} />
                    <StrategyRow label="冻结策略" value="先冻结样片预算，确认后再进入正式生成" />
                    <StrategyRow label="执行方式" value={runtimeNote} />
                  </div>
                </ExpandableCard>

                <ExpandableCard
                  title="交付说明"
                  open={showDeliveryDetails}
                  onToggle={() => setShowDeliveryDetails((value) => !value)}
                >
                  <div className="space-y-3">
                    <StrategyRow label="交付形式" value="完成后统一整理为交付包" />
                    <div className="rounded-2xl border border-black/[0.06] bg-[#FCFCFD] p-4">
                      <p className="text-[11px] uppercase tracking-[0.08em] text-black/35">交付包内容</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {deliverables.map((file) => (
                          <span
                            key={file}
                            className="rounded-full border border-black/[0.06] bg-white px-3 py-1.5 text-xs text-black/58"
                          >
                            {file}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </ExpandableCard>

                <ExpandableCard
                  title="执行过程"
                  open={showProgressDetails}
                  onToggle={() => setShowProgressDetails((value) => !value)}
                >
                  <div className="space-y-3">
                    {EXECUTION_STEPS.map((step, index) => (
                      <ExecutionRow
                        key={step}
                        label={step}
                        detail={index === 0 ? '任务启动后显示当前阶段' : '按任务进度逐步展开'}
                      />
                    ))}

                    {isPowerUser ? (
                      <div className="space-y-3">
                        <div className="rounded-2xl border border-black/[0.06] bg-[#FCFCFD] p-4">
                          <p className="text-[11px] uppercase tracking-[0.08em] text-black/35">专业信息</p>
                          <div className="mt-3 space-y-2">
                            <StrategyRow
                              label="Hermes 状态"
                              value={`${hermes.status}${runtimeVersion ? ` · ${runtimeVersion}` : ''}`}
                            />
                            <StrategyRow label="路由策略" value={skillRouteSummary} />
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            void handleDebug();
                          }}
                          disabled={isDebugging}
                          className="h-11 w-full rounded-xl border border-black/12 bg-white text-sm font-semibold text-black/70 transition-colors hover:bg-[#F7F7F8] disabled:opacity-60"
                        >
                          {isDebugging ? 'Hermes 调试中…' : '本地 Hermes 调试'}
                        </button>
                      </div>
                    ) : null}

                    {debugOutput ? (
                      <div className="rounded-2xl border border-black/8 bg-[#F7F7F8] px-4 py-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-black/45">Debug Output</p>
                        <pre className="mt-2 whitespace-pre-wrap break-words text-xs leading-6 text-black/60">
                          {debugOutput}
                        </pre>
                      </div>
                    ) : null}
                  </div>
                </ExpandableCard>
              </div>
            </WorkbenchPanel>
          </section>
        </div>
      </div>
    </div>
  );
}

function buildUnderstanding(
  sellingPoint: string,
  effectGoal: string,
  platform: string,
): UgcSystemUnderstanding {
  return {
    targetAudience: '25-35 岁通勤女性，偏好真人试用型短视频',
    videoStyle: `${effectGoal}，贴近 ${platform} 平台表达`,
    coreAngle: sellingPoint || '等待输入',
    outputGoal: `${platform} 10 秒 9:16 样片`,
    draftScript: `先抛出真实场景，再用“${sellingPoint || '产品核心卖点'}”打记忆点，最后给一个轻转化动作。`,
  };
}

function resolveUgcAgentId(pathname: string): string {
  if (pathname.endsWith('/media-seeding')) return 'media-seeding';
  if (pathname.endsWith('/media-review')) return 'media-review';
  if (pathname.endsWith('/media-conversion')) return 'media-conversion';
  return 'media-seeding';
}

function resolveExecutionPreset(agentId: string): ExecutionPreset {
  if (agentId === 'media-review') {
    return {
      platform: '视频号',
      effectGoal: '更像测评讲解',
      formatLabel: '10 秒 / 9:16',
      deliveryLabel: '完成后整理交付包',
    };
  }

  if (agentId === 'media-conversion') {
    return {
      platform: '抖音',
      effectGoal: '更像带货转化',
      formatLabel: '10 秒 / 9:16',
      deliveryLabel: '完成后整理交付包',
    };
  }

  return {
    platform: '抖音',
    effectGoal: '更像真人种草',
    formatLabel: '10 秒 / 9:16',
    deliveryLabel: '完成后整理交付包',
  };
}

function buildPreviewOptions(
  sellingPoint: string,
  platform: string,
): PreviewOption[] {
  const hookBase = sellingPoint || '10 秒快速上脸';

  return [
    {
      effect: '更像真人种草',
      badge: '种草',
      title: '真人种草版',
      summary: `更像真实分享，适合 ${platform} 的自然口播和生活场景切入。`,
      hook: `${hookBase}，像朋友推荐一样自然种草。`,
      accent: 'linear-gradient(180deg, #EED9C6 0%, #C8D5EA 54%, #8FA2B2 100%)',
      chipTone: '#0F766E',
      miniAccent: 'linear-gradient(135deg, rgba(238,217,198,0.9) 0%, rgba(200,213,234,0.95) 100%)',
    },
    {
      effect: '更像测评讲解',
      badge: '测评',
      title: '测评讲解版',
      summary: '更强调对比、体验和结论，适合先讲效果再给理由。',
      hook: `${hookBase}，先看上脸效果再讲原因。`,
      accent: 'linear-gradient(180deg, #DCE7F7 0%, #C8D8D2 48%, #8FA0A6 100%)',
      chipTone: '#365D8A',
      miniAccent: 'linear-gradient(135deg, rgba(220,231,247,0.95) 0%, rgba(200,216,210,0.92) 100%)',
    },
    {
      effect: '更像带货转化',
      badge: '转化',
      title: '带货转化版',
      summary: '更强调节奏和行动引导，适合活动、限时和购买动机表达。',
      hook: `${hookBase}，用更直接的节奏推动下单。`,
      accent: 'linear-gradient(180deg, #F4D7C6 0%, #D5C7E8 50%, #9E8FAF 100%)',
      chipTone: '#8A4B20',
      miniAccent: 'linear-gradient(135deg, rgba(244,215,198,0.95) 0%, rgba(213,199,232,0.92) 100%)',
    },
  ];
}

function buildPreviewOption(
  sellingPoint: string,
  platform: string,
  effectGoal: (typeof EFFECT_OPTIONS)[number],
): PreviewOption {
  return (
    buildPreviewOptions(sellingPoint, platform).find((option) => option.effect === effectGoal) ??
    buildPreviewOptions(sellingPoint, platform)[0]
  );
}

function StatusPill({ label, tone = 'default' }: { label: string; tone?: 'default' | 'accent' }) {
  return (
    <span
      className={`rounded-full px-3 py-1.5 text-xs ${
        tone === 'accent' ? 'bg-[#EAF6F4] text-[#0F766E]' : 'bg-[#F2F0ED] text-black/50'
      }`}
    >
      {label}
    </span>
  );
}

function UploadCard({
  title,
  subtitle,
  onClick,
}: {
  title: string;
  subtitle: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="min-h-[124px] rounded-2xl border border-dashed border-black/12 bg-gradient-to-br from-[#FDF7F2] to-[#FFFDF9] p-4 text-left transition-colors hover:border-black/20"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-black/65 shadow-sm">
        <ImagePlus className="h-5 w-5" />
      </div>
      <p className="mt-4 text-base font-semibold text-[#1A1A1A]">{title}</p>
      <p className="mt-1 break-all text-sm text-black/45">{subtitle}</p>
      <p className="mt-4 text-xs text-black/35">点击上传 JPG / PNG / WebP</p>
    </button>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-black/62">{label}</p>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={3}
        className="w-full resize-none rounded-xl border border-black/10 bg-[#FCFCFD] px-4 py-3 text-sm leading-7 text-black/78 outline-none transition-colors focus:border-[#0F766E]/30"
      />
    </div>
  );
}

function InputField({
  label,
  value,
  onChange,
  icon: Icon,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  icon: typeof Link2;
  placeholder?: string;
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-black/62">{label}</p>
      <div className="flex min-h-11 items-start gap-3 rounded-xl border border-black/10 bg-[#FCFCFD] px-4 py-3">
        <Icon className="mt-0.5 h-4 w-4 shrink-0 text-black/30" />
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="w-full bg-transparent text-sm text-black/60 outline-none"
        />
      </div>
    </div>
  );
}

function OptionField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-black/62">{label}</p>
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
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-10 rounded-xl px-3.5 text-sm transition-colors ${
        active
          ? 'bg-black text-white'
          : 'bg-[#F7F7F8] text-black/55 hover:bg-[#EFEFF1] hover:text-black'
      }`}
    >
      {children}
    </button>
  );
}

function ExecutionRow({ label, detail }: { label: string; detail: string }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-black/[0.05] bg-[#FCFCFD] px-4 py-3">
      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#EAF6F4] text-[10px] font-semibold text-[#0F766E]">
        <Loader2 className="h-3 w-3 animate-spin" />
      </span>
      <div>
        <p className="text-sm font-medium text-[#1A1A1A]">{label}</p>
        <p className="mt-1 text-xs text-black/45">{detail}</p>
      </div>
    </div>
  );
}

function WorkbenchPanel({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[24px] border border-black/[0.05] bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-4 flex items-start justify-between gap-3">
        <h2 className="text-xl font-semibold text-[#1A1A1A]">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function TinyAction({ children }: { children: ReactNode }) {
  return (
    <button
      type="button"
      className="rounded-xl border border-black/10 bg-white px-3 py-1.5 text-xs font-medium text-black/45 transition-colors hover:bg-[#F7F7F8] hover:text-black/70"
    >
      {children}
    </button>
  );
}

function FieldBlock({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-black/62">{label}</p>
      {children}
    </div>
  );
}

function PresetNotice({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-[#E8ECEA] bg-[#F8FBFA] px-4 py-4">
      <p className="text-sm leading-6 text-black/58">{text}</p>
    </div>
  );
}

function ConfigRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-black/[0.06] bg-[#FCFCFD] px-4 py-3">
      <p className="text-[11px] uppercase tracking-[0.08em] text-black/35">{label}</p>
      <p className="mt-1 text-sm text-[#1A1A1A]">{value}</p>
    </div>
  );
}

function ExpandableCard({
  title,
  open,
  onToggle,
  children,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-black/[0.05] bg-[#FCFCFD]">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <span className="text-sm font-medium text-[#1A1A1A]">{title}</span>
        <ChevronDown
          className={`h-4 w-4 text-black/35 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open ? <div className="border-t border-black/[0.05] p-4">{children}</div> : null}
    </div>
  );
}

function StrategyRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-black/[0.05] bg-white px-4 py-3">
      <p className="text-[11px] uppercase tracking-[0.08em] text-black/35">{label}</p>
      <p className="mt-1 text-sm leading-6 text-[#1A1A1A]">{value}</p>
    </div>
  );
}

function CompactSummaryCard({
  title,
  value,
  detail,
}: {
  title: string;
  value: string;
  detail?: string;
}) {
  return (
    <div className="rounded-2xl border border-black/[0.06] bg-[#FCFCFD] p-4">
      <p className="text-[11px] uppercase tracking-[0.08em] text-black/35">{title}</p>
      <p className="mt-2 text-xl font-semibold text-[#1A1A1A]">{value}</p>
      {detail ? <p className="mt-2 text-xs leading-6 text-black/48">{detail}</p> : null}
    </div>
  );
}

function CostHeroCard({ headline }: { headline: string }) {
  return (
    <div className="rounded-2xl border border-[#F4D6A0] bg-[#FFF8EA] p-4">
      <p className="text-[11px] uppercase tracking-[0.08em] text-[#A16207]">预估成本</p>
      <p className="mt-2 text-base font-semibold text-[#1A1A1A]">{headline}</p>
      <div className="mt-3 inline-flex rounded-full bg-[#FCE7B2] px-3 py-1.5 text-xs font-semibold text-[#A16207]">
        预计冻结样片预算
      </div>
    </div>
  );
}
