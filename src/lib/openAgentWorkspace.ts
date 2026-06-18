import { openAgentTab } from './workbenchTabs';

/** 打开智能体工作台（记录最近标签并导航） */
export function openAgentWorkspace(agentId: string): void {
  openAgentTab(agentId);
}

export function getAgentWorkspacePath(agentId: string): string {
  return `/app?agent=${agentId}`;
}
