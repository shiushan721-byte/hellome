export type GnomicAction = 'view' | 'experience' | 'clone';

export type GnomicBindingStatus = 'active' | 'disabled';

export type GnomicSsoErrorCode =
  | 'UNAUTHENTICATED'
  | 'GNOMIC_ACCOUNT_BIND_FAILED'
  | 'GNOMIC_CREATE_USER_FAILED'
  | 'GNOMIC_SERVICE_UNAVAILABLE'
  | 'INVALID_REDIRECT';

export interface GnomicAccountBindingRecord {
  id: string;
  hellomeUserId: string;
  gnomicUserId: string;
  phone?: string;
  status: GnomicBindingStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface GnomicSsoTicketRecord {
  id: string;
  ticket: string;
  hellomeUserId: string;
  gnomicUserId: string;
  redirectPath: string;
  used: boolean;
  expiresAt: Date;
  createdAt: Date;
}

export interface StartGnomicSsoInput {
  hellomeUserId: string;
  phone: string;
  nickname: string;
  avatarUrl?: string;
  templateId?: string;
  action?: GnomicAction;
  redirectPath?: string;
}

export interface CreateGnomicUserPayload {
  hellomeUserId: string;
  phone: string;
  nickname: string;
  avatarUrl?: string;
  source: 'hellome';
}

export class GnomicSsoError extends Error {
  readonly code: GnomicSsoErrorCode;

  constructor(code: GnomicSsoErrorCode, message: string) {
    super(message);
    this.name = 'GnomicSsoError';
    this.code = code;
  }
}
