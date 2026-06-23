import type { HomeButtonAction, HomeShowcaseTaskAction } from '../types/homePageConfig';
import { openAgentsyunHub } from './agentsyunSso';
import { openGnomicTemplate } from './gnomicSso';
import { getAgentWorkspacePath } from './openAgentWorkspace';
import { tryUseAgent } from './useAgentAccess';

export type HomeActionContext = {
  guestMode?: boolean;
  lowBalance?: boolean;
  openLogin: (intent?: {
    redirect?: string;
    agentId?: string;
    action?: 'use' | 'view' | 'enter';
  }) => void;
  onHermesRequired?: (agentId?: string) => void;
  navigate: (path: string) => void;
};

export function executeHomeButtonAction(
  action: HomeButtonAction,
  ctx: HomeActionContext,
  options?: { agentId?: string; target?: string },
): void {
  const agentId = options?.agentId;
  const guestMode = ctx.guestMode ?? true;

  switch (action) {
    case 'login':
      ctx.openLogin({ redirect: '/welcome' });
      return;
    case 'use_agent':
      if (!agentId) {
        ctx.openLogin({ redirect: '/agents' });
        return;
      }
      {
        const result = tryUseAgent(agentId, { guestMode, lowBalance: ctx.lowBalance });
        if (result.reason === 'login') {
          ctx.openLogin({
            agentId,
            action: 'use',
            redirect: guestMode ? `/agents/${agentId}` : getAgentWorkspacePath(agentId),
          });
          return;
        }
        if (result.reason === 'hermes') {
          ctx.onHermesRequired?.(agentId);
          return;
        }
        if (result.reason === 'recharge') {
          ctx.navigate('/app/usage');
          return;
        }
        if (result.ok) {
          ctx.navigate(getAgentWorkspacePath(agentId));
        }
      }
      return;
    case 'open_market':
      ctx.navigate(guestMode ? '/agents' : '/app/agents');
      return;
    case 'open_workbench':
      ctx.navigate(guestMode ? '/agents' : '/app/agents');
      return;
    case 'open_url':
      if (options?.target && /^https?:\/\//i.test(options.target)) {
        window.open(options.target, '_blank', 'noopener,noreferrer');
      }
      return;
    case 'open_gnomic':
      if (options?.target) {
        openGnomicTemplate(
          { templateId: options.target, action: 'view', redirectPath: '/app/agents' },
          ctx.openLogin,
        );
      } else {
        ctx.navigate(guestMode ? '/agents' : '/app/agents');
      }
      return;
    case 'open_agentsyun':
      openAgentsyunHub({ loginRedirect: '/agents' }, ctx.openLogin);
      return;
    default:
      return;
  }
}

export function executeShowcaseTaskAction(
  action: HomeShowcaseTaskAction,
  ctx: HomeActionContext,
  options?: { agentId?: string; target?: string },
): void {
  if (action === 'view_agent' && options?.agentId) {
    const path = ctx.guestMode ? `/agents/${options.agentId}` : `/app/agents/${options.agentId}`;
    ctx.navigate(path);
    return;
  }
  if (action === 'open_url' && options?.target) {
    executeHomeButtonAction('open_url', ctx, options);
    return;
  }
  if (options?.agentId) {
    executeHomeButtonAction('use_agent', ctx, { agentId: options.agentId });
  }
}
