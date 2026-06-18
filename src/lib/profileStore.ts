import defaultAvatarAsset from '../assets/default-avatar.png';

export const DEFAULT_AVATAR_URL = defaultAvatarAsset;

const PROFILE_KEY = 'hellome_profile';
const USER_KEY = 'hellome_user';

export interface MeProfile {
  id: string;
  nickname: string;
  avatarUrl?: string;
  isDefaultAvatar: boolean;
  isDefaultNickname: boolean;
}

type Listener = () => void;
const listeners = new Set<Listener>();

let profileSnapshot: MeProfile | null = null;
let profileSnapshotRaw: string | null = '__init__';

function notifyProfile(): void {
  profileSnapshotRaw = '__stale__';
  listeners.forEach((fn) => fn());
}

export function subscribeProfile(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function generateDefaultNickname(): string {
  const letters = 'abcdefghijklmnopqrstuvwxyz';
  const suffix = Array.from({ length: 6 }, () =>
    letters[Math.floor(Math.random() * letters.length)],
  ).join('');
  return `哈啰蜜${suffix}`;
}

function createDefaultProfile(id: string): MeProfile {
  return {
    id,
    nickname: generateDefaultNickname(),
    avatarUrl: DEFAULT_AVATAR_URL,
    isDefaultAvatar: true,
    isDefaultNickname: true,
  };
}

function migrateNickname(nickname: string): string {
  if (nickname.startsWith('哈基米')) {
    return `哈啰蜜${nickname.slice(3)}`;
  }
  return nickname;
}

function normalizeProfile(parsed: Partial<MeProfile>, fallbackId: string): MeProfile {
  const nickname = migrateNickname(String(parsed.nickname ?? '').trim());
  const hasCustomAvatar = Boolean(parsed.avatarUrl && !parsed.isDefaultAvatar);
  return {
    id: String(parsed.id || fallbackId),
    nickname: nickname || generateDefaultNickname(),
    avatarUrl: hasCustomAvatar ? parsed.avatarUrl : DEFAULT_AVATAR_URL,
    isDefaultAvatar: parsed.isDefaultAvatar ?? !hasCustomAvatar,
    isDefaultNickname: parsed.isDefaultNickname ?? !nickname,
  };
}

function getUserIdFromStorage(): string {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return 'guest';
  try {
    const parsed = JSON.parse(raw) as { phone?: string };
    return parsed.phone || 'guest';
  } catch {
    return 'guest';
  }
}

function readProfileFromStorage(): MeProfile {
  const raw = localStorage.getItem(PROFILE_KEY);
  if (raw === profileSnapshotRaw && profileSnapshot) return profileSnapshot;

  profileSnapshotRaw = raw;
  const userId = getUserIdFromStorage();

  if (!raw) {
    const created = createDefaultProfile(userId);
    localStorage.setItem(PROFILE_KEY, JSON.stringify(created));
    profileSnapshotRaw = localStorage.getItem(PROFILE_KEY);
    profileSnapshot = created;
    return created;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<MeProfile>;
    profileSnapshot = normalizeProfile(parsed, userId);
    const migratedNickname = migrateNickname(String(parsed.nickname ?? '').trim());
    if (migratedNickname && migratedNickname !== String(parsed.nickname ?? '').trim()) {
      persistProfile(profileSnapshot);
    }
  } catch {
    profileSnapshot = createDefaultProfile(userId);
  }
  return profileSnapshot;
}

export function getProfile(): MeProfile {
  return readProfileFromStorage();
}

export function getDisplayAvatarUrl(profile: MeProfile = getProfile()): string {
  if (profile.isDefaultAvatar || !profile.avatarUrl) return DEFAULT_AVATAR_URL;
  return profile.avatarUrl;
}

function persistProfile(profile: MeProfile): void {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  profileSnapshot = profile;
  profileSnapshotRaw = localStorage.getItem(PROFILE_KEY);
  notifyProfile();
}

export function initProfileForNewUser(userId: string): MeProfile {
  const profile = createDefaultProfile(userId);
  persistProfile(profile);
  return profile;
}

export function syncProfileOnLogin(userId: string): void {
  const raw = localStorage.getItem(PROFILE_KEY);
  if (!raw) {
    initProfileForNewUser(userId);
    return;
  }
  try {
    const parsed = JSON.parse(raw) as Partial<MeProfile>;
    if (parsed.id !== userId) {
      initProfileForNewUser(userId);
    }
  } catch {
    initProfileForNewUser(userId);
  }
}

export function validateNickname(nickname: string): string | null {
  const trimmed = nickname.trim();
  if (!trimmed) return '昵称不能为空';
  if (trimmed.length < 2 || trimmed.length > 20) return '昵称需为 2-20 个字符';
  if (!/^[\u4e00-\u9fa5a-zA-Z0-9]+$/.test(trimmed)) {
    return '昵称仅支持中文、英文和数字';
  }
  return null;
}

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
const ALLOWED_AVATAR_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export function validateAvatarFile(file: File): string | null {
  if (!ALLOWED_AVATAR_TYPES.has(file.type)) {
    return '仅支持 jpg、png、webp 格式';
  }
  if (file.size > MAX_AVATAR_BYTES) {
    return '头像需小于 5MB';
  }
  return null;
}

export function readAvatarFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') resolve(reader.result);
      else reject(new Error('read failed'));
    };
    reader.onerror = () => reject(reader.error ?? new Error('read failed'));
    reader.readAsDataURL(file);
  });
}

export interface UpdateProfileInput {
  nickname: string;
  avatarUrl?: string | null;
  isDefaultAvatar?: boolean;
  isDefaultNickname?: boolean;
}

export function updateProfile(input: UpdateProfileInput): { ok: true; profile: MeProfile } | { ok: false; error: string } {
  const nicknameError = validateNickname(input.nickname);
  if (nicknameError) return { ok: false, error: nicknameError };

  const current = getProfile();
  const trimmedNickname = input.nickname.trim();
  const useDefaultAvatar = input.isDefaultAvatar === true || input.avatarUrl === null;
  const next: MeProfile = {
    ...current,
    nickname: trimmedNickname,
    avatarUrl: useDefaultAvatar ? DEFAULT_AVATAR_URL : input.avatarUrl ?? current.avatarUrl ?? DEFAULT_AVATAR_URL,
    isDefaultAvatar: useDefaultAvatar,
    isDefaultNickname: input.isDefaultNickname ?? (trimmedNickname !== current.nickname ? false : current.isDefaultNickname),
  };

  if (!useDefaultAvatar && input.avatarUrl) {
    next.isDefaultAvatar = false;
    next.avatarUrl = input.avatarUrl;
  }

  if (trimmedNickname !== current.nickname) {
    next.isDefaultNickname = false;
  }

  persistProfile(next);
  return { ok: true, profile: next };
}

export function resetDefaultNickname(): MeProfile {
  const current = getProfile();
  const next: MeProfile = {
    ...current,
    nickname: generateDefaultNickname(),
    isDefaultNickname: true,
  };
  persistProfile(next);
  return next;
}
