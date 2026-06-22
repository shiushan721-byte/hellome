export type AgentsyunSsoErrorCode =
  | 'UNAUTHENTICATED'
  | 'AGENTSYUN_ACCOUNT_BIND_FAILED'
  | 'AGENTSYUN_CREATE_USER_FAILED'
  | 'AGENTSYUN_SERVICE_UNAVAILABLE'
  | 'INVALID_REDIRECT';

export interface AgentsyunAccountBindingRecord {
  id: string;
  hellomeUserId: string;
  agentsyunUserId: string;
  phone?: string;
  status: 'active' | 'disabled';
  createdAt: Date;
  updatedAt: Date;
}

export interface StartAgentsyunSsoInput {
  hellomeUserId: string;
  phone: string;
  nickname: string;
  avatarUrl?: string;
  redirectPath?: string;
}

export class AgentsyunSsoError extends Error {
  readonly code: AgentsyunSsoErrorCode;

  constructor(code: AgentsyunSsoErrorCode, message: string) {
    super(message);
    this.name = 'AgentsyunSsoError';
    this.code = code;
  }
}
