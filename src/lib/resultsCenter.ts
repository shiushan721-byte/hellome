import type { Task } from '../types/workbench';
import { buildMediaDeliveryView } from './mediaTaskPresentation';

export type ResultEntry = {
  id: string;
  title: string;
  agentLabel: string;
  completedAtLabel: string;
  artifactCount: number;
  artifactSummary: string;
  artifactLabels: string[];
  tokenUsedLabel: string;
  openTaskHref: string;
  editSkillHref?: string;
};

export function buildResultEntries(
  tasks: Task[],
  options: { canEditSkill: boolean },
): ResultEntry[] {
  return tasks
    .filter((task) => task.status === 'completed')
    .map((task) => {
      const artifactLabels = task.artifacts?.map((artifact) => artifact.label) ?? [];
      const mediaDelivery = task.agentType === 'media' ? buildMediaDeliveryView(task) : null;
      const resultArtifactLabels =
        mediaDelivery
          ? [
              mediaDelivery.primaryArtifact?.label ?? null,
              ...mediaDelivery.supportingArtifacts.map((artifact) => artifact.label),
            ].filter((label): label is string => Boolean(label))
          : artifactLabels;
      const artifactCount = resultArtifactLabels.length > 0 ? resultArtifactLabels.length : task.agentType === 'geo' ? 1 : 0;
      const skillId =
        task.agentType === 'media' && task.input && 'skillId' in task.input && typeof task.input.skillId === 'string'
          ? task.input.skillId
          : undefined;

      return {
        id: task.id,
        title: task.name,
        agentLabel: task.agentType === 'geo' ? 'GEO 智能体' : task.agentType === 'media' ? '视频交付' : '销售智能体',
        completedAtLabel: task.completedAt
          ? new Date(task.completedAt).toLocaleString('zh-CN', {
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
            })
          : '已完成',
        artifactCount,
        artifactSummary:
          mediaDelivery
            ? mediaDelivery.artifactSummary
            : artifactCount > 0
              ? `${artifactCount} 项${task.agentType === 'geo' ? '报告成果' : '交付物'}`
              : task.agentType === 'geo'
                ? '1 项报告成果'
                : '结果已完成',
        artifactLabels: resultArtifactLabels.length > 0 ? resultArtifactLabels : task.agentType === 'geo' ? ['GEO 报告'] : [],
        tokenUsedLabel: task.tokenUsed > 0 ? `${task.tokenUsed.toLocaleString('zh-CN')} Token` : '待结算',
        openTaskHref: `/app/tasks/${task.id}`,
        editSkillHref: options.canEditSkill && skillId ? `/app/studio/skills/${skillId}` : undefined,
      };
    })
    .sort((left, right) => {
      const leftTask = tasks.find((task) => task.id === left.id);
      const rightTask = tasks.find((task) => task.id === right.id);
      const leftTime = leftTask?.completedAt ?? leftTask?.createdAt ?? '';
      const rightTime = rightTask?.completedAt ?? rightTask?.createdAt ?? '';
      return +new Date(rightTime) - +new Date(leftTime);
    });
}
