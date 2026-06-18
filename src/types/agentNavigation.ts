/** 进入智能体工作台时通过 location.state 传递 */
export interface AgentEntryState {
  agentId?: string;
  from?: string;
  prompt?: string;
}

export const DEFAULT_AGENT_RETURN_PATH = '/app';
