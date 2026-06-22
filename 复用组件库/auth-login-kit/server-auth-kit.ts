import crypto from 'node:crypto';
import type express from 'express';
import type { DemoSession, UserProfile, UserRole, VerificationCodeRecord } from './auth-types';
import { getPrismaClient } from '../../src/server/db/prisma';
import { normalizeWorkspaceSlug } from '../../src/server/bootstrap/demoSeedHelpers';

const SESSION_COOKIE = 'hellome_demo_session';
const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const VERIFICATION_TTL_MS = 5 * 60 * 1000;
const VERIFICATION_RESEND_MS = 60 * 1000;

const demoSessions = new Map<string, DemoSession>();
const verificationCodes = new Map<string, VerificationCodeRecord>();

type DemoAccountRecord = {
  phone: string;
  name: string;
  email: string;
  workspace: string;
  role: UserRole;
};

function getDemoAccounts(): DemoAccountRecord[] {
  return [
    {
      phone: (process.env.DEMO_USER_PHONE ?? '13800138001').trim(),
      name: process.env.DEMO_USER_NAME?.trim() || 'HelloMe 普通用户',
      email: process.env.DEMO_USER_EMAIL?.trim() || 'user@hellome.ai',
      workspace: process.env.DEMO_USER_WORKSPACE?.trim() || '个人空间',
      role: 'user',
    },
    {
      phone: (process.env.DEMO_CREATOR_PHONE ?? '13800138002').trim(),
      name: process.env.DEMO_CREATOR_NAME?.trim() || 'HelloMe 创作者',
      email: process.env.DEMO_CREATOR_EMAIL?.trim() || 'creator@hellome.ai',
      workspace: process.env.DEMO_CREATOR_WORKSPACE?.trim() || 'Creator Studio',
      role: 'creator',
    },
    {
      phone: (process.env.DEMO_ADMIN_PHONE ?? '13800138000').trim(),
      name: process.env.DEMO_ADMIN_NAME?.trim() || 'HelloMe 演示管理员',
      email: process.env.DEMO_ADMIN_EMAIL?.trim() || 'admin@hellome.ai',
      workspace: process.env.DEMO_WORKSPACE?.trim() || 'HelloMe Demo Workspace',
      role: ((process.env.DEMO_ADMIN_ROLE ?? 'admin').trim().toLowerCase() as UserRole) || 'admin',
    },
  ];
}

function findDemoAccount(phone: string): DemoAccountRecord | null {
  const normalizedPhone = phone.replace(/\D/g, '');
  return (
    getDemoAccounts().find((account) => account.phone.replace(/\D/g, '') === normalizedPhone) ?? null
  );
}

function getRoleForPhone(phone: string): UserRole {
  return findDemoAccount(phone)?.role ?? 'user';
}

function getDefaultNameForPhone(phone: string): string {
  const demoAccount = findDemoAccount(phone);
  if (demoAccount) return demoAccount.name;
  return `HelloMe 用户${phone.slice(-4)}`;
}

function getDefaultEmailForPhone(phone: string): string {
  const demoAccount = findDemoAccount(phone);
  if (demoAccount?.email) return demoAccount.email;
  return `${phone}@demo.hellome.local`;
}

function getDefaultWorkspaceForPhone(phone: string, role: UserRole): string {
  const demoAccount = findDemoAccount(phone);
  if (demoAccount?.workspace) return demoAccount.workspace;
  if (role === 'creator') return 'Creator Studio';
  if (role === 'admin') return 'HelloMe Admin Workspace';
  return '个人空间';
}

function buildUserProfile(phone: string): UserProfile {
  const normalizedPhone = phone.replace(/\D/g, '');
  const role = getRoleForPhone(normalizedPhone);
  return {
    name: getDefaultNameForPhone(normalizedPhone),
    phone: normalizedPhone,
    email: getDefaultEmailForPhone(normalizedPhone),
    workspace: getDefaultWorkspaceForPhone(normalizedPhone, role),
    role,
  };
}

function parseCookies(cookieHeader?: string): Record<string, string> {
  if (!cookieHeader) return {};
  return cookieHeader.split(';').reduce<Record<string, string>>((acc, part) => {
    const [rawKey, ...rawValue] = part.trim().split('=');
    if (!rawKey) return acc;
    acc[rawKey] = decodeURIComponent(rawValue.join('=') || '');
    return acc;
  }, {});
}

function setSessionCookie(res: express.Response, sessionId: string): void {
  const isSecure = process.env.NODE_ENV === 'production';
  const cookie = [
    `${SESSION_COOKIE}=${encodeURIComponent(sessionId)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${Math.floor(SESSION_MAX_AGE_MS / 1000)}`,
    ...(isSecure ? ['Secure'] : []),
  ].join('; ');
  res.setHeader('Set-Cookie', cookie);
}

function clearSessionCookie(res: express.Response): void {
  const isSecure = process.env.NODE_ENV === 'production';
  const cookie = [
    `${SESSION_COOKIE}=`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    'Max-Age=0',
    ...(isSecure ? ['Secure'] : []),
  ].join('; ');
  res.setHeader('Set-Cookie', cookie);
}

function currentSession(req: express.Request): DemoSession | null {
  const cookies = parseCookies(req.headers.cookie);
  const sessionId = cookies[SESSION_COOKIE];
  if (!sessionId) return null;

  const session = demoSessions.get(sessionId);
  if (!session) return null;
  if (Date.now() - session.createdAt > SESSION_MAX_AGE_MS) {
    demoSessions.delete(sessionId);
    return null;
  }

  return session;
}

function getDemoVerificationCodeForPhone(phone: string): string | null {
  if (process.env.NODE_ENV === 'production') return null;
  const account = findDemoAccount(phone);
  if (!account) return null;

  if (account.role === 'admin') {
    return process.env.DEMO_ADMIN_CODE?.trim() || '123456';
  }
  if (account.role === 'creator') {
    return process.env.DEMO_CREATOR_CODE?.trim() || '123456';
  }
  return process.env.DEMO_USER_CODE?.trim() || '123456';
}

function isVerificationCodeValid(phone: string, code: string): boolean {
  const normalizedPhone = phone.replace(/\D/g, '');
  const demoCode = getDemoVerificationCodeForPhone(normalizedPhone);
  if (demoCode && demoCode === code.trim()) {
    return true;
  }

  const record = verificationCodes.get(normalizedPhone);
  if (!record) return false;
  if (Date.now() > record.expiresAt) {
    verificationCodes.delete(normalizedPhone);
    return false;
  }
  return record.code === code;
}

function generateVerificationCode(): string {
  return crypto.randomInt(100000, 1000000).toString();
}

async function ensureUserRecord(user: UserProfile): Promise<UserProfile> {
  const prisma = getPrismaClient();
  if (!prisma) return user;

  const prismaDb = prisma as any;
  const canonicalExternalId = user.phone;

  const ownerByExternalId =
    (await prismaDb.user.findUnique({
      where: { externalId: canonicalExternalId },
      include: { workspaces: true },
    })) ?? null;

  const ownerByPhone =
    ownerByExternalId ??
    (await prismaDb.user.findFirst({
      where: { phone: user.phone },
      include: { workspaces: true },
    })) ??
    null;

  const profilePatch = {
    displayName: user.name,
    email: user.email,
    phone: user.phone,
  };

  const persistedUser = ownerByExternalId
    ? await prismaDb.user.update({
        where: { id: ownerByExternalId.id },
        data: profilePatch,
        include: { workspaces: true },
      })
    : ownerByPhone
      ? await prismaDb.user.update({
          where: { id: ownerByPhone.id },
          data: profilePatch,
          include: { workspaces: true },
        })
      : await prismaDb.user.create({
          data: {
            externalId: canonicalExternalId,
            ...profilePatch,
          },
          include: { workspaces: true },
        });

  const existingWorkspace = persistedUser.workspaces?.[0];
  if (!existingWorkspace) {
    await prismaDb.workspace.create({
      data: {
        name: user.workspace,
        slug: normalizeWorkspaceSlug(user.role, user.phone),
        ownerId: persistedUser.id,
      },
    });
  } else if (existingWorkspace.name !== user.workspace) {
    await prismaDb.workspace.update({
      where: { id: existingWorkspace.id },
      data: { name: user.workspace },
    });
  }

  return user;
}

export function createAuthKit() {
  return {
    registerRoutes(app: express.Express) {
      app.post('/api/auth/send-code', async (req, res) => {
        const phone = String(req.body?.phone ?? '').replace(/\D/g, '');
        if (phone.length !== 11) {
          res.status(400).json({ success: false, error: '请输入 11 位手机号' });
          return;
        }

        const previous = verificationCodes.get(phone);
        if (previous && Date.now() - previous.sentAt < VERIFICATION_RESEND_MS) {
          const retryAfter = Math.ceil((VERIFICATION_RESEND_MS - (Date.now() - previous.sentAt)) / 1000);
          res.status(429).json({ success: false, error: `请求过于频繁，请在 ${retryAfter}s 后重试` });
          return;
        }

        const record: VerificationCodeRecord = {
          phone,
          code: generateVerificationCode(),
          sentAt: Date.now(),
          expiresAt: Date.now() + VERIFICATION_TTL_MS,
        };

        verificationCodes.set(phone, record);
        await ensureUserRecord(buildUserProfile(phone));

        res.json({
          success: true,
          data: {
            phone,
            expiresInSec: Math.floor(VERIFICATION_TTL_MS / 1000),
            cooldownSec: Math.floor(VERIFICATION_RESEND_MS / 1000),
            testingCode: process.env.NODE_ENV === 'production' ? undefined : record.code,
            simulated: true,
          },
        });
      });

      app.post('/api/auth/login', async (req, res) => {
        try {
          const phone = String(req.body?.phone ?? '').replace(/\D/g, '');
          const code = String(req.body?.code ?? '').trim();

          if (phone.length !== 11) {
            res.status(400).json({ success: false, error: '请输入 11 位手机号' });
            return;
          }

          if (!isVerificationCodeValid(phone, code)) {
            res.status(401).json({ success: false, error: '手机号或验证码错误' });
            return;
          }

          verificationCodes.delete(phone);
          const user = await ensureUserRecord(buildUserProfile(phone));

          const sessionId = crypto.randomUUID();
          const session: DemoSession = {
            id: sessionId,
            user,
            createdAt: Date.now(),
          };

          demoSessions.set(sessionId, session);
          setSessionCookie(res, sessionId);

          res.json({
            success: true,
            data: {
              authenticated: true,
              user: session.user,
            },
          });
        } catch (error) {
          console.error('[auth/login]', error);
          res.status(500).json({ success: false, error: '登录失败，请稍后重试' });
        }
      });

      app.get('/api/auth/me', (req, res) => {
        const session = currentSession(req);
        if (!session) {
          clearSessionCookie(res);
          res.json({ success: true, data: { authenticated: false } });
          return;
        }

        res.json({
          success: true,
          data: {
            authenticated: true,
            user: session.user,
          },
        });
      });

      app.post('/api/auth/logout', (req, res) => {
        const session = currentSession(req);
        if (session) {
          demoSessions.delete(session.id);
        }
        clearSessionCookie(res);
        res.json({ success: true });
      });
    },
    currentSession,
    getCurrentExternalId(req: express.Request): string {
      const session = currentSession(req);
      return (session?.user.email || session?.user.phone || '').trim();
    },
    requireCreatorSession(req: express.Request, res: express.Response): DemoSession | null {
      const session = currentSession(req);
      if (!session) {
        res.status(401).json({ success: false, error: '请先登录' });
        return null;
      }
      if (session.user.role !== 'creator' && session.user.role !== 'admin') {
        res.status(403).json({ success: false, error: '当前账号没有 Creator Studio 权限' });
        return null;
      }
      return session;
    },
    requireAdminSession(req: express.Request, res: express.Response): DemoSession | null {
      const session = currentSession(req);
      if (!session) {
        res.status(401).json({ success: false, error: '请先登录' });
        return null;
      }
      if (session.user.role !== 'admin') {
        res.status(403).json({ success: false, error: '当前账号没有后台管理权限' });
        return null;
      }
      return session;
    },
  };
}
