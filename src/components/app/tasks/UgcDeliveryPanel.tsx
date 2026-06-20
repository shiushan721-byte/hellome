import { useState, type ReactNode } from 'react';
import { ChevronDown, FileImage, FileText, FileVideo2, PackageCheck, Sparkles, Wand2 } from 'lucide-react';
import type { Task } from '../../../types/workbench';
import type { UgcTaskInput } from '../../../types/ugc';
import { getUserRole } from '../../../lib/auth';
import TaskResultSummaryBar from './TaskResultSummaryBar';
import TaskShowcaseStage from './TaskShowcaseStage';
import TaskStageRail, { buildTaskStages } from './TaskStageRail';

const artifactIcon = {
  video: FileVideo2,
  image: FileImage,
  script: FileText,
  report: PackageCheck,
} as const;

export default function UgcDeliveryPanel({
  task,
  onReviseAndRerun,
  onPrimaryAction,
  primaryActionLabel,
}: {
  task: Task;
  onReviseAndRerun?: (input: {
    sellingPoint: string;
    platform: string;
    effectGoal: string;
    referenceUrl?: string;
  }) => void;
  onPrimaryAction?: () => void;
  primaryActionLabel?: string;
}) {
  const input = isUgcInput(task.input) ? task.input : null;
  const role = getUserRole();
  const isPowerUser = role === 'creator' || role === 'admin';
  const isWaitingConfirmation = task.status === 'waiting_confirmation';
  const hasVideoArtifact = task.artifacts?.some((artifact) => artifact.type === 'video');
  const [sellingPoint, setSellingPoint] = useState(input?.sellingPoint ?? '');
  const [platform, setPlatform] = useState(input?.platform ?? '抖音');
  const [effectGoal, setEffectGoal] = useState(input?.effectGoal ?? '更像真人种草');
  const [referenceUrl, setReferenceUrl] = useState(input?.referenceUrl ?? '');
  const [showInputDetails, setShowInputDetails] = useState(isPowerUser);
  const [showScriptDetails, setShowScriptDetails] = useState(isPowerUser);
  const [showRetryForm, setShowRetryForm] = useState(isPowerUser);

  return (
    <div className="space-y-4">
      <TaskShowcaseStage
        task={task}
        onPrimaryAction={onPrimaryAction}
        primaryActionLabel={primaryActionLabel}
      />

      <TaskResultSummaryBar task={task} />

      <TaskStageRail stages={buildTaskStages(task)} />

      {task.recoveryState?.runState === 'interrupted' ? (
        <div className="rounded-3xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {task.recoveryState.pauseReasonMessage ?? '执行中断，可从上一步恢复。'}
        </div>
      ) : null}

      {hasVideoArtifact ? (
        <div className="rounded-3xl border border-black/8 bg-[#FCFCFD] p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-black">样片已落位</h3>
            </div>
            <span className="rounded-full bg-[#F2F0ED] px-2.5 py-1 text-[11px] text-black/45">可预览</span>
          </div>
          <div className="mx-auto w-[220px] rounded-[24px] bg-[#111214] p-3 shadow-[0_20px_40px_rgba(0,0,0,0.14)]">
            <div className="relative aspect-[9/16] overflow-hidden rounded-[18px] bg-[linear-gradient(180deg,#ECD8C2_0%,#C5D7E7_54%,#8A9AA8_100%)]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(255,255,255,0.5),transparent_35%),linear-gradient(180deg,rgba(0,0,0,0.05),rgba(0,0,0,0.22))]" />
              <div className="absolute top-4 left-4 right-4 flex items-center justify-between text-[11px] text-white/80">
                <span>UGC 样片</span>
                <span>10s · 9:16</span>
              </div>
              <div className="absolute inset-x-0 top-[42%] flex justify-center">
                <div className="rounded-full border border-white/20 bg-black/35 px-3 py-1.5 text-[11px] text-white/85 backdrop-blur">
                  可预览
                </div>
              </div>
              <div className="absolute bottom-0 inset-x-0 p-4 text-white">
                <p className="text-sm font-semibold">{task.understanding?.coreAngle ?? '样片已生成'}</p>
                <p className="mt-1 text-[11px] text-white/75">{task.understanding?.videoStyle ?? '结果已就绪'}</p>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {input ? (
        <div className="rounded-3xl border border-black/8 bg-white p-5 space-y-4">
          <ExpandableSection
            title="查看输入"
            open={showInputDetails}
            onToggle={() => setShowInputDetails((value) => !value)}
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <InfoCard label="一句话卖点" value={input.sellingPoint} />
              <InfoCard label="目标平台" value={input.platform} />
              <InfoCard label="效果目标" value={input.effectGoal} />
              <InfoCard label="参考链接" value={input.referenceUrl || '未提供'} />
            </div>
          </ExpandableSection>
        </div>
      ) : null}

      {input && onReviseAndRerun ? (
        <div className="rounded-3xl border border-black/8 bg-white p-5 space-y-4">
          <ExpandableSection
            title="修改后重新生成"
            open={showRetryForm}
            onToggle={() => setShowRetryForm((value) => !value)}
          >
            <div className="space-y-3">
              <EditField label="一句话卖点">
                <textarea
                  value={sellingPoint}
                  onChange={(event) => setSellingPoint(event.target.value)}
                  rows={3}
                  className="w-full rounded-2xl border border-black/10 bg-[#FCFCFD] px-4 py-3 text-sm text-black outline-none focus:ring-1 focus:ring-black/20"
                />
              </EditField>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <EditField label="目标平台">
                  <input
                    value={platform}
                    onChange={(event) => setPlatform(event.target.value)}
                    className="w-full rounded-2xl border border-black/10 bg-[#FCFCFD] px-4 py-3 text-sm text-black outline-none focus:ring-1 focus:ring-black/20"
                  />
                </EditField>
                <EditField label="效果目标">
                  <input
                    value={effectGoal}
                    onChange={(event) => setEffectGoal(event.target.value)}
                    className="w-full rounded-2xl border border-black/10 bg-[#FCFCFD] px-4 py-3 text-sm text-black outline-none focus:ring-1 focus:ring-black/20"
                  />
                </EditField>
              </div>

              <EditField label="参考链接">
                <input
                  value={referenceUrl}
                  onChange={(event) => setReferenceUrl(event.target.value)}
                  placeholder="没有可留空"
                  className="w-full rounded-2xl border border-black/10 bg-[#FCFCFD] px-4 py-3 text-sm text-black outline-none focus:ring-1 focus:ring-black/20"
                />
              </EditField>
            </div>

            <button
              type="button"
              onClick={() =>
                onReviseAndRerun({
                  sellingPoint: sellingPoint.trim(),
                  platform: platform.trim(),
                  effectGoal: effectGoal.trim(),
                  referenceUrl: referenceUrl.trim() || undefined,
                })
              }
              className="mt-4 h-11 rounded-2xl bg-black px-5 text-sm font-semibold text-white transition-colors hover:bg-black/90"
            >
              按新输入重新生成
            </button>
          </ExpandableSection>
        </div>
      ) : null}

      <div className="rounded-3xl border border-black/8 bg-white p-5 space-y-4">
        <ExpandableSection
          title="执行摘要"
          open={showScriptDetails}
          onToggle={() => setShowScriptDetails((value) => !value)}
        >
          {task.routePlan ? (
            <div className="rounded-2xl border border-black/8 bg-[#FCFCFD] p-4">
              <p className="text-xs text-black/40">执行方案</p>
              <p className="mt-2 text-sm font-semibold text-black">{task.routePlan.label}</p>
              <p className="mt-1 text-xs text-black/50">{task.routePlan.providerHint}</p>
            </div>
          ) : null}
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <InfoCard label="目标用户" value={task.understanding?.targetAudience ?? '处理中'} />
            <InfoCard label="视频风格" value={task.understanding?.videoStyle ?? '处理中'} />
            <InfoCard label="输出目标" value={task.understanding?.outputGoal ?? '处理中'} />
            <InfoCard label="成本" value={task.costEstimate ?? '处理中'} />
          </div>
          <div className="mt-4 rounded-2xl bg-[#F7F7F8] p-4">
            <p className="text-xs text-black/40">脚本草案</p>
            <p className="mt-2 text-sm leading-6 text-black/70">
              {task.understanding?.draftScript ?? '处理中'}
            </p>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <CorrectionChip icon={Wand2} label="风格不对" />
            <CorrectionChip icon={Sparkles} label="卖点不对" />
            <CorrectionChip icon={FileVideo2} label="人设不对" />
          </div>
          {isWaitingConfirmation ? (
            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              确认后继续。
            </div>
          ) : null}
        </ExpandableSection>
      </div>

      <div className="rounded-3xl border border-black/8 bg-white p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-black">文件</h3>
          </div>
          <span className="text-[11px] rounded-full bg-[#F2F0ED] px-2.5 py-1 text-black/45">
            {task.artifacts?.length ?? 0} 个文件
          </span>
        </div>

        <div className="mt-4 space-y-2.5">
          {(task.artifacts?.length ?? 0) > 0 ? (
            task.artifacts?.map((artifact) => {
              const Icon = artifactIcon[artifact.type];
              return (
                <div
                  key={artifact.id}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-black/8 bg-[#FCFCFD] px-4 py-3"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#F7F7F8] text-black/60">
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-black">{artifact.label}</p>
                      <p className="truncate text-xs text-black/45">{artifact.fileName}</p>
                    </div>
                  </div>
                  {artifact.url ? (
                    <a
                      href={artifact.url}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-xl border border-black/10 px-3 py-2 text-xs font-medium text-black/60 hover:bg-[#F7F7F8]"
                    >
                      查看
                    </a>
                  ) : (
                    <span className="rounded-xl bg-[#F2F0ED] px-3 py-2 text-xs text-black/45">已落库</span>
                  )}
                </div>
              );
            })
          ) : (
            <p className="rounded-2xl bg-[#F7F7F8] px-4 py-5 text-sm text-black/45">
              暂无文件
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-[#F7F7F8] p-4">
      <p className="text-xs text-black/40">{label}</p>
      <p className="mt-2 text-sm font-medium leading-6 text-black">{value}</p>
    </div>
  );
}

function EditField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-xs text-black/40">{label}</span>
      {children}
    </label>
  );
}

function ExpandableSection({
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
    <div className="rounded-2xl border border-black/[0.06] bg-[#FCFCFD]">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <span className="text-sm font-semibold text-black">{title}</span>
        <ChevronDown
          className={`h-4 w-4 text-black/35 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open ? <div className="border-t border-black/[0.06] p-4">{children}</div> : null}
    </div>
  );
}

function CorrectionChip({
  icon: Icon,
  label,
}: {
  icon: typeof Wand2;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-black/8 bg-[#FCFCFD] px-3 py-2 text-xs text-black/55">
      <Icon className="h-3.5 w-3.5" />
      {label}
    </span>
  );
}

function isUgcInput(input: Task['input']): input is UgcTaskInput {
  return Boolean(input && 'sellingPoint' in input && 'platform' in input && 'effectGoal' in input);
}
