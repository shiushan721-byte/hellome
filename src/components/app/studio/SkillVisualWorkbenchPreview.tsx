import { Play, Sparkles } from 'lucide-react';
import type { SkillDebugInput, SkillDebugResult, SkillRecord } from '../../../types/skills';

const PLATFORM_OPTIONS = ['抖音', '小红书', '视频号'] as const;
const EFFECT_OPTIONS = ['更像真人种草', '更像测评讲解', '更像带货转化'] as const;

export default function SkillVisualWorkbenchPreview({
  skill,
  previewInput,
  debugResult,
}: {
  skill: SkillRecord;
  previewInput: SkillDebugInput;
  debugResult: SkillDebugResult | null;
}) {
  const plans = skill.latestVersion.executionConfig.availablePlans ?? [];
  const activePlan =
    plans.find(
      (plan) => plan.id === skill.latestVersion.executionConfig.defaultPlanId,
    ) ?? plans[0];

  const previewTitle = skill.latestVersion.title || skill.name;
  const script =
    debugResult?.understanding.draftScript ??
    `开头 2 秒直接说 ${previewInput.sellingPoint}，中段快速展示使用场景，结尾给出适合 ${previewInput.platform} 的收口动作。`;

  return (
    <div className="space-y-4">
      <div className="rounded-[24px] border border-black/[0.08] bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.08em] text-black/35">前台效果预览</p>
            <h3 className="mt-2 text-xl font-semibold text-[#1A1A1A]">{previewTitle}</h3>
          </div>
          <span className="rounded-full bg-[#EAF6F4] px-3 py-1 text-[11px] text-[#0F766E]">
            {skill.status === 'published' ? '线上版本' : '草稿预览'}
          </span>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[300px_minmax(0,1fr)]">
          <div className="mx-auto w-[250px] rounded-[28px] bg-[#111214] p-3 shadow-[0_24px_60px_rgba(0,0,0,0.18)]">
            <div className="relative aspect-[9/16] overflow-hidden rounded-[20px] bg-[linear-gradient(180deg,#E7F6F3_0%,#F8F9FB_48%,#EDE7DD_100%)]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(255,255,255,0.68),transparent_34%)]" />
              <div className="absolute left-4 right-4 top-4 flex items-center justify-between text-[11px] text-black/45">
                <span>{previewInput.platform}</span>
                <span>10s · 9:16</span>
              </div>
              <div className="absolute inset-x-0 bottom-0 p-4 text-[#1A1A1A]">
                <p className="text-sm font-semibold">{previewInput.sellingPoint}</p>
                <p className="mt-1 text-[11px] text-black/45">{previewInput.effectGoal}</p>
              </div>
              <div className="absolute inset-0 m-auto flex h-14 w-14 items-center justify-center rounded-full bg-white/88 text-black shadow-sm">
                <Play className="ml-0.5 h-5 w-5 fill-current" />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-black/[0.06] bg-[#FCFCFD] p-4">
              <div className="inline-flex rounded-full bg-black px-2.5 py-1 text-[11px] text-white">
                默认推荐方案
              </div>
              <p className="mt-3 text-sm font-semibold text-[#1A1A1A]">
                {activePlan?.label ?? '未配置执行方案'}
              </p>
              <p className="mt-2 text-sm leading-6 text-black/55">
                {activePlan?.description ?? '请先配置默认执行方案。'}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <TinyPill>{previewInput.platform}</TinyPill>
                <TinyPill>{previewInput.effectGoal}</TinyPill>
                <TinyPill>{skill.latestVersion.executionConfig.mode}</TinyPill>
              </div>
            </div>

            <div className="rounded-2xl border border-black/[0.06] bg-[#FCFCFD] p-4">
              <p className="text-[11px] uppercase tracking-[0.08em] text-black/35">业务骨架</p>
              <p className="mt-3 text-sm font-semibold text-[#1A1A1A]">
                {skill.latestVersion.businessFrame.result.promiseLine}
              </p>
              <p className="mt-2 text-sm leading-6 text-black/55">
                {skill.latestVersion.businessFrame.goal.summary}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {skill.latestVersion.businessFrame.result.deliveryLabels.map((label) => (
                  <TinyPill key={label}>{label}</TinyPill>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <MetaCard
                label="用户输入"
                value={skill.latestVersion.inputConfig.sellingPointLabel}
              />
              <MetaCard
                label="参考链接"
                value={skill.latestVersion.inputConfig.referenceUrlHint}
              />
              <MetaCard
                label="系统理解"
                value={
                  debugResult?.understanding.videoStyle ??
                  skill.latestVersion.understandingConfig.confirmationMessage
                }
              />
              <MetaCard
                label="交付目标"
                value={debugResult?.understanding.outputGoal ?? '10 秒样片 + 交付包'}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-[24px] border border-black/[0.08] bg-white p-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[#0F766E]" />
          <h4 className="text-base font-semibold text-[#1A1A1A]">系统理解与脚本预演</h4>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-3">
            <MetaCard
              label="目标用户"
              value={
                debugResult?.understanding.targetAudience ??
                '运行一次调试后，这里会展示创作者当前配置实际会产出的用户理解。'
              }
            />
            <MetaCard
              label="核心角度"
              value={debugResult?.understanding.coreAngle ?? previewInput.sellingPoint}
            />
            <MetaCard
              label="模型路由"
              value={activePlan ? `${activePlan.providerHint} · ${activePlan.label}` : '未配置'}
            />
            <MetaCard
              label="预算策略"
              value={`${budgetLabel(skill.latestVersion.businessFrame.budget.defaultTier)} · ${
                skill.latestVersion.businessFrame.budget.confirmationRequired ? '需确认' : '自动推进'
              }`}
            />
          </div>

          <div className="rounded-2xl bg-[#F7F7F8] px-4 py-4">
            <p className="text-[11px] uppercase tracking-[0.08em] text-black/35">脚本草案</p>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-black/68">{script}</p>
          </div>
        </div>
      </div>

      <div className="rounded-[24px] border border-black/[0.08] bg-white p-4">
        <p className="text-[11px] uppercase tracking-[0.08em] text-black/35">交付文件</p>
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {(skill.latestVersion.artifactConfig ?? []).map((artifact) => (
            <div
              key={artifact.fileName}
              className="rounded-2xl border border-black/[0.05] bg-[#FCFCFD] px-3 py-3"
            >
              <p className="text-sm font-medium text-[#1A1A1A]">{artifact.label}</p>
              <p className="mt-1 text-xs text-black/40">{artifact.fileName}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-[24px] border border-black/[0.08] bg-white p-4">
        <p className="text-[11px] uppercase tracking-[0.08em] text-black/35">预设控件</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {PLATFORM_OPTIONS.map((platform) => (
            <TinyPill key={platform}>{platform}</TinyPill>
          ))}
          {EFFECT_OPTIONS.map((effect) => (
            <TinyPill key={effect}>{effect}</TinyPill>
          ))}
        </div>
      </div>
    </div>
  );
}

function budgetLabel(value: 'basic' | 'standard' | 'premium') {
  if (value === 'basic') return '基础档';
  if (value === 'premium') return '高配档';
  return '标准档';
}

function MetaCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-black/[0.05] bg-[#FCFCFD] px-4 py-3">
      <p className="text-[11px] uppercase tracking-[0.08em] text-black/35">{label}</p>
      <p className="mt-2 text-sm leading-6 text-black/62">{value}</p>
    </div>
  );
}

function TinyPill({ children }: { children: string }) {
  return (
    <span className="rounded-full bg-[#F2F0ED] px-2.5 py-1 text-[11px] text-black/52">
      {children}
    </span>
  );
}
