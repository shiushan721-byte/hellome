import type { Task } from '../types/workbench';
import type { UgcTaskArtifact } from '../types/ugc';

export type MediaTaskStage =
  | 'queued'
  | 'understanding'
  | 'route_planning'
  | 'waiting_confirmation'
  | 'rendering_video'
  | 'packaging_delivery'
  | 'completed'
  | 'recoverable_error'
  | 'failed';

export type MediaDeliveryView = {
  stage: MediaTaskStage;
  primaryArtifact: UgcTaskArtifact | null;
  supportingArtifacts: UgcTaskArtifact[];
  hasFallbackAudio: boolean;
  artifactSummary: string;
  statusHeadline: string;
  statusBody: string;
};

function isPlayableVideoArtifact(artifact: UgcTaskArtifact): boolean {
  if (artifact.type !== 'video') return false;
  if (artifact.mimeType?.startsWith('video/')) return true;
  const lower = artifact.fileName.toLowerCase();
  return lower.endsWith('.mp4') || lower.endsWith('.webm') || lower.endsWith('.mov') || lower.endsWith('.m4v');
}

function artifactWeight(artifact: UgcTaskArtifact): number {
  let score = 0;
  if (artifact.type === 'video') score += 100;
  if (artifact.mimeType?.startsWith('video/')) score += 20;
  const lower = artifact.fileName.toLowerCase();
  if (lower.endsWith('.webm') || lower.endsWith('.mp4') || lower.endsWith('.mov')) score += 10;
  if (lower.includes('cover') || lower.includes('poster')) score -= 20;
  if (lower.includes('mock')) score -= 5;
  return score;
}

export function resolvePrimaryVideoArtifact(artifacts: UgcTaskArtifact[]): UgcTaskArtifact | null {
  const candidates = artifacts.filter(isPlayableVideoArtifact);
  if (candidates.length === 0) return null;
  return candidates
    .slice()
    .sort((left, right) => artifactWeight(right) - artifactWeight(left))[0] ?? null;
}

export function deriveMediaTaskStage(task: Pick<Task, 'status' | 'steps' | 'recoveryState'>): MediaTaskStage {
  const steps = task.steps ?? [];
  if (task.recoveryState?.runState === 'interrupted') return 'recoverable_error';
  if (task.status === 'waiting_confirmation') return 'waiting_confirmation';
  if (task.status === 'completed') return 'completed';
  if (task.status === 'failed') return 'failed';
  if (task.status === 'queued') return 'queued';

  const activeIndex = steps.findIndex((step) => step.status === 'active');
  if (activeIndex <= 0) return 'understanding';
  if (activeIndex <= 2) return 'route_planning';
  if (activeIndex <= 4) return 'rendering_video';
  return 'packaging_delivery';
}

export function buildMediaDeliveryView(task: Pick<Task, 'status' | 'steps' | 'recoveryState' | 'artifacts'>): MediaDeliveryView {
  const stage = deriveMediaTaskStage(task);
  const artifacts = task.artifacts ?? [];
  const primaryArtifact = resolvePrimaryVideoArtifact(artifacts);
  const supportingArtifacts = primaryArtifact
    ? artifacts.filter((artifact) => artifact.id !== primaryArtifact.id)
    : artifacts.slice();
  const hasFallbackAudio = supportingArtifacts.some(
    (artifact) =>
      artifact.type === 'audio' &&
      (artifact.fileName.toLowerCase().includes('mock') || artifact.url?.toLowerCase().includes('mock')),
  );
  const artifactSummary = primaryArtifact
    ? `1 条样片视频 + ${supportingArtifacts.length} 个交付附件`
    : supportingArtifacts.length > 0
      ? `${supportingArtifacts.length} 个交付附件`
      : '结果整理中';

  if (stage === 'completed') {
    return {
      stage,
      primaryArtifact,
      supportingArtifacts,
      hasFallbackAudio,
      artifactSummary,
      statusHeadline: primaryArtifact ? '正式结果已交付' : '主结果尚未就绪',
      statusBody: primaryArtifact ? '主视频已生成，附件也已整理完成。' : '当前没有可交付的主视频，请重新生成。',
    };
  }

  if (stage === 'waiting_confirmation') {
    return {
      stage,
      primaryArtifact,
      supportingArtifacts,
      hasFallbackAudio,
      artifactSummary,
      statusHeadline: '等待确认后进入正式生成',
      statusBody: '当前方向已经整理完，确认后才会进入高成本的视频生成阶段。',
    };
  }

  if (stage === 'recoverable_error') {
    return {
      stage,
      primaryArtifact,
      supportingArtifacts,
      hasFallbackAudio,
      artifactSummary,
      statusHeadline: '生成中断，可从当前阶段恢复',
      statusBody: '系统保留了中间结果，可以继续当前任务而不是从零开始。',
    };
  }

  if (stage === 'rendering_video') {
    return {
      stage,
      primaryArtifact,
      supportingArtifacts,
      hasFallbackAudio,
      artifactSummary,
      statusHeadline: '正在生成正式样片',
      statusBody: '系统正在生成主视频结果，这一步完成后才会整理封面、脚本和摘要。',
    };
  }

  if (stage === 'packaging_delivery') {
    return {
      stage,
      primaryArtifact,
      supportingArtifacts,
      hasFallbackAudio,
      artifactSummary,
      statusHeadline: '正在整理交付附件',
      statusBody: '主视频已出，系统正在整理封面、脚本、摘要等交付文件。',
    };
  }

  if (stage === 'route_planning') {
    return {
      stage,
      primaryArtifact,
      supportingArtifacts,
      hasFallbackAudio,
      artifactSummary,
      statusHeadline: '正在整理这次的表达方向',
      statusBody: '系统正在整理业务重点、脚本方向和路线方案，还没有进入正式生成。',
    };
  }

  if (stage === 'understanding') {
    return {
      stage,
      primaryArtifact,
      supportingArtifacts,
      hasFallbackAudio,
      artifactSummary,
      statusHeadline: '正在理解业务需求',
      statusBody: '系统先整理目标用户、卖点和表达方式，再决定后续生成路径。',
    };
  }

  if (stage === 'failed') {
    return {
      stage,
      primaryArtifact,
      supportingArtifacts,
      hasFallbackAudio,
      artifactSummary,
      statusHeadline: '任务执行失败',
      statusBody: '当前任务没有拿到可交付结果，可以检查原因后重新生成。',
    };
  }

  return {
    stage,
    primaryArtifact,
    supportingArtifacts,
    hasFallbackAudio,
    artifactSummary,
    statusHeadline: '任务已接收',
    statusBody: '系统正在排队准备这次任务，很快会开始整理方向。',
  };
}
