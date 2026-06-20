import { type ReactNode, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ChevronDown,
  ImagePlus,
  Link2,
  Loader2,
} from 'lucide-react';
import { getAgentById } from '../../data/agentsCatalog';
import type { AgentEntryState } from '../../types/agentNavigation';
import { getUserRole } from '../../lib/auth';
import {
  getHermesConnection,
  subscribeHermesConnection,
} from '../../lib/hermesConnection';
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
import TaskStageRail, { buildTaskStages } from '../../components/app/tasks/TaskStageRail';

const PLATFORM_OPTIONS = ['抖音', '小红书', '视频号'] as const;
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

export default function UgcVideoAgentPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const entry = (location.state as AgentEntryState | null) ?? {};
  const routeAgentId = resolveUgcAgentId(location.pathname);
  const currentAgentId = entry.agentId ?? routeAgentId;
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

  const [selectedPlatform, setSelectedPlatform] =
    useState<(typeof PLATFORM_OPTIONS)[number]>('抖音');
  const [selectedEffect, setSelectedEffect] =
    useState<(typeof EFFECT_OPTIONS)[number]>(defaultEffectForAgent(currentAgentId));
  const [hasManualPreviewPick, setHasManualPreviewPick] = useState(false);
  const [sellingPoint, setSellingPoint] = useState('补水不黏腻，夏天通勤 10 秒上脸就能出门。');
  const [referenceUrl, setReferenceUrl] = useState('https://www.xiaohongshu.com/explore/ugc-skin-demo');
  const [productAsset, setProductAsset] = useState<{ url: string; fileName: string } | null>(null);
  const [talentAsset, setTalentAsset] = useState<{ url: string; fileName: string } | null>(null);
  const [understanding, setUnderstanding] = useState<UgcSystemUnderstanding>(() =>
    buildUnderstanding('补水不黏腻，夏天通勤 10 秒上脸就能出门。', '更像真人种草', '抖音'),
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
  const [showProgressDetails, setShowProgressDetails] = useState(isPowerUser);
  const previewOptions = buildPreviewOptions(sellingPoint, selectedPlatform);
  const activePreview =
    previewOptions.find((option) => option.effect === selectedEffect) ?? previewOptions[0];
  const secondaryPreviews = previewOptions.filter((option) => option.effect !== activePreview.effect);
  const previewTask = {
    name: agentName,
    status: 'queued' as const,
    costEstimate: '样片阶段 ￥120 - ￥260',
    input: {
      sellingPoint,
      platform: selectedPlatform,
      effectGoal: selectedEffect,
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
    setUnderstanding(buildUnderstanding(sellingPoint, selectedEffect, selectedPlatform));
  }, [sellingPoint, selectedEffect, selectedPlatform]);

  useEffect(() => {
    if (hasManualPreviewPick) return;
    const recommended = defaultEffectForAgent(currentAgentId) ?? recommendPreviewEffect(sellingPoint, selectedPlatform);
    setSelectedEffect(recommended);
  }, [sellingPoint, selectedPlatform, hasManualPreviewPick, currentAgentId]);

  const handleUpload = async (
    file: File | undefined,
    kind: 'product' | 'talent',
  ) => {
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
      platform: selectedPlatform,
      effectGoal: selectedEffect,
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

  return (
    <div className="min-h-full bg-[#F5F5F7] px-4 sm:px-6 lg:px-8 xl:px-10 pt-4 pb-6 lg:pt-5 lg:pb-8">
      <div className="w-full space-y-5">
        <header className="rounded-[28px] border border-black/[0.05] bg-white px-5 py-5 shadow-sm sm:px-6">
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 text-[11px] text-black/35">
                  <span>{agentName}</span>
                </div>
                <div>
                  <h1 className="text-[28px] leading-none font-semibold tracking-tight text-[#1A1A1A]">
                    {skillExperience?.title ?? 'UGC 视频广告生成'}
                  </h1>
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

            <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1.2fr_0.8fr]">
              <TopMetaCard eyebrow="类型" title="UGC 视频广告" />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <TopMetaCard eyebrow="格式" title="9:16 · 10 秒" compact />
                <TopMetaCard
                  eyebrow="运行"
                  title={executionMode === 'backend_silent' ? '后端静默执行' : '本地 Hermes 调试'}
                  compact
                />
              </div>
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

        <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[340px_minmax(0,1fr)_320px]">
          <aside className="space-y-4">
            <WorkbenchPanel
              eyebrow="Left · Brief Input"
              title="输入需求"
              action={null}
            >
              <div className="space-y-4">
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

                <OptionField label="发布平台">
                  <div className="flex flex-wrap gap-2">
                    {PLATFORM_OPTIONS.map((platform) => (
                      <ChoiceChip
                        key={platform}
                        active={selectedPlatform === platform}
                        onClick={() => setSelectedPlatform(platform)}
                      >
                        {platform}
                      </ChoiceChip>
                    ))}
                  </div>
                </OptionField>

                <OptionField label="目标效果">
                  <button
                    type="button"
                    className="flex h-11 w-full items-center justify-between rounded-xl border border-black/10 bg-[#FCFCFD] px-4 text-left text-sm text-black/75"
                  >
                    <span>{selectedEffect}</span>
                    <ChevronDown className="h-4 w-4 text-black/30" />
                  </button>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {EFFECT_OPTIONS.map((effect) => (
                      <ChoiceChip
                        key={effect}
                        active={selectedEffect === effect}
                        onClick={() => {
                          setHasManualPreviewPick(true);
                          setSelectedEffect(effect);
                        }}
                      >
                        {effect}
                      </ChoiceChip>
                    ))}
                  </div>
                </OptionField>

                <InputField
                  label="参考链接 / 历史材料（可选）"
                  value={referenceUrl}
                  onChange={setReferenceUrl}
                  icon={Link2}
                  placeholder={skillExperience?.inputConfig.referenceUrlHint}
                />

                <FieldBlock label="配置">
                  <div className="space-y-2">
                    <ConfigRow label="画幅比例" value="9:16 竖版" />
                    <ConfigRow label="时长" value="10 秒样片" />
                    <ConfigRow label="输出方式" value="先出样片" />
                  </div>
                </FieldBlock>
              </div>
            </WorkbenchPanel>
          </aside>

          <section className="space-y-4">
            <WorkbenchPanel
              eyebrow="Center"
              title="预览"
              action={<TinyAction>推荐 1 / 备选 2</TinyAction>}
            >
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 2xl:grid-cols-[minmax(0,1fr)_248px]">
                  <div className="space-y-4">
                    <TaskShowcaseStage
                      task={previewTask}
                      primaryActionLabel={isSubmitting ? '创建任务中…' : '按此方案生成'}
                      onPrimaryAction={() => {
                        setHasManualPreviewPick(true);
                        void handleSubmit();
                      }}
                    />
                    <TaskResultSummaryBar task={previewTask} />
                    <TaskStageRail stages={buildTaskStages(previewTask)} />
                  </div>

                  <div className="space-y-3">
                    <p className="px-1 text-[11px] uppercase tracking-[0.08em] text-black/35">其他方向</p>
                    {secondaryPreviews.map((option) => (
                      <button
                        key={option.effect}
                        type="button"
                        onClick={() => {
                          setHasManualPreviewPick(true);
                          setSelectedEffect(option.effect);
                        }}
                        className="w-full rounded-2xl border border-black/[0.06] bg-[#FCFCFD] p-4 text-left transition-colors hover:border-black/15 hover:bg-white"
                      >
                        <div
                          className="h-16 rounded-2xl border border-black/[0.05]"
                          style={{ background: option.miniAccent }}
                        />
                        <span className="mt-3 inline-flex rounded-full bg-[#F2F0ED] px-2.5 py-1 text-[11px] text-black/45">
                          {option.badge}
                        </span>
                        <p className="mt-3 text-sm font-semibold text-[#1A1A1A]">{option.title}</p>
                        <p className="mt-2 text-xs leading-6 text-black/48">{option.summary}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </WorkbenchPanel>
          </section>

          <aside className="space-y-4">
            <WorkbenchPanel
              eyebrow="Right"
              title="交付与交易"
              action={<TinyAction>账单</TinyAction>}
            >
              <div className="space-y-3">
                <WalletCard
                  label="可用余额"
                  value="￥2,460"
                />
                <WalletCard
                  label="已冻结金额"
                  value="￥380"
                  tone="warning"
                />

                <div className="rounded-2xl border border-[#F4D6A0] bg-[#FFF8EA] p-4">
                  <p className="text-[11px] uppercase tracking-[0.08em] text-[#A16207]">预估成本</p>
                  <p className="mt-2 text-base font-semibold text-[#1A1A1A]">样片阶段 ￥120 - ￥260</p>
                  <div className="mt-3 inline-flex rounded-full bg-[#FCE7B2] px-3 py-1.5 text-xs font-semibold text-[#A16207]">
                    预计冻结 ￥120 - ￥260
                  </div>
                </div>

                <div className="rounded-2xl border border-black/[0.06] bg-[#FCFCFD] p-4">
                  <p className="text-[11px] uppercase tracking-[0.08em] text-black/35">交付物清单</p>
                  <div className="mt-3 space-y-2.5">
                    {deliverables.map((file, index) => (
                      <div
                        key={file}
                        className="flex items-start gap-3 rounded-2xl border border-black/[0.05] bg-white px-3 py-3"
                      >
                        <span className="mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-[#EAF6F4] text-[10px] font-semibold text-[#0F766E]">
                          {index + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-[#1A1A1A]">{file}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-black/[0.06] bg-[#FCFCFD] p-4">
                  <p className="text-[11px] uppercase tracking-[0.08em] text-black/35">信息</p>
                  <div className="mt-3 space-y-2">
                    <StrategyRow label="生成" value="先出样片" />
                    <StrategyRow label="运行" value={runtimeNote} />
                    <StrategyRow label="Hermes 状态" value={`${hermes.status}${runtimeVersion ? ` · ${runtimeVersion}` : ''}`} />
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => {
                      void handleSubmit();
                    }}
                    disabled={isSubmitting}
                    className="h-12 w-full rounded-xl bg-black text-sm font-semibold text-white transition-colors hover:bg-black/90 disabled:opacity-60"
                  >
                    {isSubmitting ? '创建任务中…' : '冻结余额并执行'}
                  </button>
                  {isPowerUser ? (
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
                  ) : null}
                </div>

                {error ? (
                  <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
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
            </WorkbenchPanel>

            <WorkbenchPanel eyebrow="Progress" title="进度">
              <ExpandableCard
                title="查看执行步骤"
                open={showProgressDetails}
                onToggle={() => setShowProgressDetails((value) => !value)}
              >
                <div className="space-y-3">
                  {EXECUTION_STEPS.map((step, index) => (
                    <ExecutionRow
                      key={step}
                      label={step}
                      detail={index < 3 ? '处理中' : '待继续'}
                    />
                  ))}
                </div>
              </ExpandableCard>
            </WorkbenchPanel>
          </aside>
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

function defaultEffectForAgent(agentId: string): (typeof EFFECT_OPTIONS)[number] {
  if (agentId === 'media-review') return '更像测评讲解';
  if (agentId === 'media-conversion') return '更像带货转化';
  return '更像真人种草';
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
      summary: `更强调对比、体验和结论，适合先讲效果再给理由。`,
      hook: `${hookBase}，先看上脸效果再讲原因。`,
      accent: 'linear-gradient(180deg, #DCE7F7 0%, #C8D8D2 48%, #8FA0A6 100%)',
      chipTone: '#365D8A',
      miniAccent: 'linear-gradient(135deg, rgba(220,231,247,0.95) 0%, rgba(200,216,210,0.92) 100%)',
    },
    {
      effect: '更像带货转化',
      badge: '转化',
      title: '带货转化版',
      summary: `更强调节奏和行动引导，适合活动、限时和购买动机表达。`,
      hook: `${hookBase}，用更直接的节奏推动下单。`,
      accent: 'linear-gradient(180deg, #F4D7C6 0%, #D5C7E8 50%, #9E8FAF 100%)',
      chipTone: '#8A4B20',
      miniAccent: 'linear-gradient(135deg, rgba(244,215,198,0.95) 0%, rgba(213,199,232,0.92) 100%)',
    },
  ];
}

function recommendPreviewEffect(
  sellingPoint: string,
  platform: (typeof PLATFORM_OPTIONS)[number],
): (typeof EFFECT_OPTIONS)[number] {
  const text = sellingPoint.toLowerCase();

  if (
    text.includes('优惠') ||
    text.includes('活动') ||
    text.includes('下单') ||
    text.includes('抢') ||
    text.includes('限时')
  ) {
    return '更像带货转化';
  }

  if (
    text.includes('测评') ||
    text.includes('对比') ||
    text.includes('成分') ||
    text.includes('实测') ||
    platform === '视频号'
  ) {
    return '更像测评讲解';
  }

  return '更像真人种草';
}

function StatusPill({ label, tone = 'default' }: { label: string; tone?: 'default' | 'accent' }) {
  return (
    <span
      className={`px-3 py-1.5 rounded-full text-xs ${
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
      <p className="mt-1 text-sm text-black/45 break-all">{subtitle}</p>
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
          : 'bg-[#F7F7F8] text-black/55 hover:text-black hover:bg-[#EFEFF1]'
      }`}
    >
      {children}
    </button>
  );
}

function ExecutionRow({
  label,
  detail,
}: {
  label: string;
  detail: string;
}) {
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
  eyebrow,
  title,
  action,
  children,
}: {
  eyebrow: string;
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[24px] border border-black/[0.05] bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-black/35">{eyebrow}</p>
          <h2 className="mt-2 text-xl font-semibold text-[#1A1A1A]">{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function TopMetaCard({
  eyebrow,
  title,
  description,
  compact = false,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  compact?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-black/[0.05] bg-[#FCFCFD] p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-black/35">{eyebrow}</p>
      <p className={`mt-2 font-semibold text-[#1A1A1A] ${compact ? 'text-base' : 'text-lg'}`}>{title}</p>
      {description ? <p className="mt-2 text-sm leading-6 text-black/48">{description}</p> : null}
    </div>
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

function WalletCard({
  label,
  value,
  tone = 'default',
}: {
  label: string;
  value: string;
  tone?: 'default' | 'warning';
}) {
  return (
    <div className="rounded-2xl border border-black/[0.06] bg-[#FCFCFD] p-4">
      <p className="text-[11px] uppercase tracking-[0.08em] text-black/35">{label}</p>
      <p className={`mt-2 text-lg font-semibold ${tone === 'warning' ? 'text-[#A16207]' : 'text-[#1A1A1A]'}`}>
        {value}
      </p>
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
