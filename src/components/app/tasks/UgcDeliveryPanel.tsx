import { useState, type ReactNode } from 'react';
import { ChevronDown, FileImage, FileText, FileVideo2, PackageCheck, Sparkles, Volume2, Wand2 } from 'lucide-react';
import type { Task } from '../../../types/workbench';
import type { UgcTaskInput } from '../../../types/ugc';
import { getUserRole } from '../../../lib/auth';
import { buildMediaDeliveryView } from '../../../lib/mediaTaskPresentation';
import TaskResultSummaryBar from './TaskResultSummaryBar';
import TaskShowcaseStage from './TaskShowcaseStage';
import TaskStageRail, { buildTaskStages } from './TaskStageRail';

const artifactIcon = {
  video: FileVideo2,
  image: FileImage,
  script: FileText,
  report: PackageCheck,
  audio: Volume2,
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
  const deliveryView = buildMediaDeliveryView(task);
  const isWaitingConfirmation = task.status === 'waiting_confirmation';
  const previewArtifact =
    deliveryView.primaryArtifact ??
    deliveryView.supportingArtifacts.find((artifact) => artifact.type === 'image');
  const previewUrl = previewArtifact ? normalizeArtifactUrl(previewArtifact.url) : null;
  const previewAsImage = shouldRenderAsImage(previewArtifact);
  const hasPreviewArtifact = Boolean(previewArtifact && previewUrl);
  const [sellingPoint, setSellingPoint] = useState(input?.sellingPoint ?? '');
  const [platform, setPlatform] = useState(input?.platform ?? '抖音');
  const [effectGoal, setEffectGoal] = useState(input?.effectGoal ?? '更像真人种草');
  const [referenceUrl, setReferenceUrl] = useState(input?.referenceUrl ?? '');
  const [showInputDetails, setShowInputDetails] = useState(false);
  const [showScriptDetails, setShowScriptDetails] = useState(false);
  const [showRetryForm, setShowRetryForm] = useState(isPowerUser);
  const showBusinessExplanation = task.status === 'waiting_confirmation' || task.status === 'completed' || task.status === 'failed';
  const fixedSpec = task.understanding?.outputGoal ?? '10 秒视频样片';
  const currentDirection = task.understanding?.videoStyle ?? input?.effectGoal ?? '处理中';
  const correctionOptions = deriveCorrectionOptions(task);

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

      {task.status === 'running' || task.status === 'queued' ? (
        <div className="rounded-3xl border border-black/8 bg-white p-5">
          <p className="text-sm font-semibold text-black">当前任务正在推进</p>
          <p className="mt-2 text-sm leading-6 text-black/52">
            {deliveryView.statusBody}
          </p>
        </div>
      ) : null}

      {deliveryView.hasFallbackAudio ? (
        <div className="rounded-3xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          当前音轨为降级附件，正式结果以主视频样片为准。
        </div>
      ) : null}

      {hasPreviewArtifact ? (
        <div className="rounded-3xl border border-black/8 bg-[#FCFCFD] p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-black">
                {deliveryView.primaryArtifact ? '正式样片' : '当前可预览结果'}
              </h3>
            </div>
            <span className="rounded-full bg-[#F2F0ED] px-2.5 py-1 text-[11px] text-black/45">可预览</span>
          </div>
          <div className="mx-auto w-[220px] rounded-[24px] bg-[#111214] p-3 shadow-[0_20px_40px_rgba(0,0,0,0.14)]">
            <div className="relative aspect-[9/16] overflow-hidden rounded-[18px] bg-black">
              {previewAsImage ? (
                <img
                  src={previewUrl ?? undefined}
                  alt={previewArtifact?.label ?? '样片预览'}
                  className="h-full w-full object-cover"
                />
              ) : (
                <video
                  src={previewUrl ?? undefined}
                  controls
                  playsInline
                  className="h-full w-full object-cover"
                />
              )}
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.05),rgba(0,0,0,0.22))]" />
              <div className="pointer-events-none absolute top-4 left-4 right-4 flex items-center justify-between text-[11px] text-white/80">
                <span>UGC 样片</span>
                <span>10s · 9:16</span>
              </div>
              <div className="pointer-events-none absolute bottom-0 inset-x-0 p-4 text-white">
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
            title={isPowerUser ? '查看输入' : '系统整理后的任务内容'}
            open={showInputDetails}
            onToggle={() => setShowInputDetails((value) => !value)}
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <InfoCard label={isPowerUser ? '一句话卖点' : '业务描述'} value={input.sellingPoint} />
              <InfoCard label="固定规格" value={fixedSpec} />
              <InfoCard label="当前表达方向" value={currentDirection} />
              <InfoCard label="参考补充" value={input.referenceUrl || '未提供'} />
            </div>
          </ExpandableSection>
        </div>
      ) : null}

      {input && onReviseAndRerun && (isPowerUser || showBusinessExplanation) ? (
        <div className="rounded-3xl border border-black/8 bg-white p-5 space-y-4">
          <ExpandableSection
            title={isPowerUser ? '修改后重新生成' : '修改需求后重新生成'}
            open={showRetryForm}
            onToggle={() => setShowRetryForm((value) => !value)}
          >
            {isPowerUser ? (
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
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <InfoCard label="固定规格" value={fixedSpec} />
                  <InfoCard label="当前表达方向" value={currentDirection} />
                </div>

                <EditField label="想调整的业务描述">
                  <textarea
                    value={sellingPoint}
                    onChange={(event) => setSellingPoint(event.target.value)}
                    rows={4}
                    className="w-full rounded-2xl border border-black/10 bg-[#FCFCFD] px-4 py-3 text-sm text-black outline-none focus:ring-1 focus:ring-black/20"
                  />
                </EditField>

                <EditField label="补充参考（选填）">
                  <input
                    value={referenceUrl}
                    onChange={(event) => setReferenceUrl(event.target.value)}
                    placeholder="没有可留空"
                    className="w-full rounded-2xl border border-black/10 bg-[#FCFCFD] px-4 py-3 text-sm text-black outline-none focus:ring-1 focus:ring-black/20"
                  />
                </EditField>
              </div>
            )}

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
          title="任务说明"
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
          {isPowerUser ? (
            <>
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
            </>
          ) : (
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <InfoCard label="当前表达方向" value={task.understanding?.videoStyle ?? '处理中'} />
              <InfoCard label="当前成本状态" value={task.costEstimate ?? '处理中'} />
            </div>
          )}
          {task.status === 'completed' || task.status === 'waiting_confirmation' || task.status === 'failed' ? (
            <div className="mt-4 space-y-3">
              <p className="text-xs text-black/40">如果结果还不够贴合，可以直接选择你想调整的方向。</p>
              <div className="flex flex-wrap gap-2">
                {correctionOptions.map((option) => (
                  <CorrectionChip
                    key={option.label}
                    icon={option.icon}
                    label={option.label}
                    onClick={() => {
                      setShowRetryForm(true);
                      setSellingPoint((current) => mergeCorrectionHint(current, option.hint));
                    }}
                  />
                ))}
              </div>
            </div>
          ) : null}
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
            <h3 className="text-sm font-semibold text-black">交付附件</h3>
          </div>
          <span className="text-[11px] rounded-full bg-[#F2F0ED] px-2.5 py-1 text-black/45">
            {deliveryView.supportingArtifacts.length} 个文件
          </span>
        </div>

        <div className="mt-4 space-y-2.5">
          {deliveryView.supportingArtifacts.length > 0 ? (
            deliveryView.supportingArtifacts.map((artifact) => {
              const Icon = artifactIcon[artifact.type];
              const artifactUrl = normalizeArtifactUrl(artifact.url);
              return (
                <div
                  key={artifact.id}
                  className="rounded-2xl border border-black/8 bg-[#FCFCFD] px-4 py-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#F7F7F8] text-black/60">
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-black">{artifact.label}</p>
                        <p className="truncate text-xs text-black/45">{artifact.fileName}</p>
                      </div>
                    </div>
                    {artifactUrl ? (
                      <a
                        href={artifactUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-xl border border-black/10 px-3 py-2 text-xs font-medium text-black/60 hover:bg-[#F7F7F8]"
                      >
                        {artifact.type === 'audio' ? '播放' : '查看'}
                      </a>
                    ) : (
                      <span className="rounded-xl bg-[#F2F0ED] px-3 py-2 text-xs text-black/45">已落库</span>
                    )}
                  </div>
                  {artifact.type === 'audio' && artifactUrl ? (
                    <audio controls src={artifactUrl} className="mt-3 w-full" preload="none" />
                  ) : null}
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

function normalizeArtifactUrl(url?: string): string | null {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/')) {
    return url;
  }
  if (url.startsWith('public/')) {
    return `/${url.slice('public/'.length)}`;
  }
  return `/${url}`;
}

function shouldRenderAsImage(
  artifact?: Task['artifacts'][number],
): boolean {
  if (!artifact) return false;
  if (artifact.mimeType?.startsWith('image/')) return true;
  const lower = artifact.fileName.toLowerCase();
  return lower.endsWith('.svg') || lower.endsWith('.png') || lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.webp');
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
  onClick,
}: {
  icon: typeof Wand2;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-full border border-black/8 bg-[#FCFCFD] px-3 py-2 text-xs text-black/55 transition-colors hover:border-black/16 hover:bg-white hover:text-black/75"
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}

function isUgcInput(input: Task['input']): input is UgcTaskInput {
  return Boolean(input && 'sellingPoint' in input && 'platform' in input && 'effectGoal' in input);
}

function deriveCorrectionOptions(task: Task): Array<{
  icon: typeof Wand2;
  label: string;
  hint: string;
}> {
  const direction = task.understanding?.videoStyle ?? '';
  const outputGoal = task.understanding?.outputGoal ?? '';

  return [
    {
      icon: Wand2,
      label: '结果气质要调整',
      hint: `请保留${outputGoal || '当前规格'}，但把结果气质调整得更贴近我的业务场景。`,
    },
    {
      icon: Sparkles,
      label: '主推重点要调整',
      hint: '请替换当前主推重点，重新突出这次最重要的卖点和业务目标。',
    },
    {
      icon: FileVideo2,
      label: direction.includes('真人') ? '出镜感觉要调整' : '表达方式要调整',
      hint: direction.includes('真人')
        ? '请让出镜感觉更自然、更像真实客户会接受的视频表达。'
        : '请保持任务目标不变，但调整表达方式，让结果更好理解。',
    },
  ];
}

function mergeCorrectionHint(current: string, hint: string): string {
  if (!current.trim()) return hint;
  if (current.includes(hint)) return current;
  return `${current.trim()}\n${hint}`;
}
