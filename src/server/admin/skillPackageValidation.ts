import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import AdmZip from 'adm-zip';

const SEMVER_RE = /^\d+\.\d+\.\d+([-.+][\w.-]+)?$/;

export type SkillPackageManifest = {
  skillId: string;
  version: string;
  name: string;
  description: string;
  entry: string;
  inputSchema?: unknown;
  outputSchema?: unknown;
  runtime?: {
    type?: string;
    minVersion?: string;
  };
};

export function computeFileChecksum(filePath: string): string {
  const buffer = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

export function validateSkillPackageArchive(filePath: string): {
  valid: boolean;
  manifest: SkillPackageManifest | null;
  errors: string[];
} {
  const errors: string[] = [];

  if (!filePath.toLowerCase().endsWith('.zip')) {
    return { valid: false, manifest: null, errors: ['技能包必须是 .zip 文件'] };
  }

  let zip: AdmZip;
  try {
    zip = new AdmZip(filePath);
  } catch {
    return { valid: false, manifest: null, errors: ['无法读取 zip 文件，请检查文件是否损坏'] };
  }

  const entries = zip.getEntries().map((entry) => entry.entryName.replace(/\\/g, '/'));
  const manifestEntry = entries.find((name) => name === 'manifest.json' || name.endsWith('/manifest.json'));

  if (!manifestEntry) {
    return { valid: false, manifest: null, errors: ['缺少 manifest.json'] };
  }

  let manifestRaw: unknown;
  try {
    manifestRaw = JSON.parse(zip.readAsText(manifestEntry));
  } catch {
    return { valid: false, manifest: null, errors: ['manifest.json 不是合法 JSON'] };
  }

  const manifest = manifestRaw as Partial<SkillPackageManifest>;
  if (!manifest.skillId?.trim()) errors.push('manifest.skillId 不能为空');
  if (!manifest.version?.trim()) errors.push('manifest.version 不能为空');
  else if (!SEMVER_RE.test(manifest.version.trim())) errors.push('manifest.version 格式应为 semver，如 1.0.0');
  if (!manifest.name?.trim()) errors.push('manifest.name 不能为空');
  if (!manifest.description?.trim()) errors.push('manifest.description 不能为空');
  if (!manifest.entry?.trim()) errors.push('manifest.entry 不能为空');

  const entryPath = manifest.entry?.trim().replace(/\\/g, '/');
  if (entryPath && !entries.includes(entryPath)) {
    errors.push(`入口文件不存在：${entryPath}`);
  }

  if (!manifest.runtime?.type?.trim()) {
    errors.push('manifest.runtime.type 不能为空');
  }

  if (errors.length > 0) {
    return { valid: false, manifest: null, errors };
  }

  return {
    valid: true,
    manifest: manifest as SkillPackageManifest,
    errors: [],
  };
}

export function slugifyAgentId(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
}

export function assertAgentProfileInput(input: { name: string; description: string }) {
  const name = input.name.trim();
  const description = input.description.trim();
  const errors: string[] = [];
  if (name.length < 2 || name.length > 30) errors.push('智能体名称需为 2-30 个字符');
  if (description.length < 10 || description.length > 120) errors.push('智能体简介需为 10-120 个字符');
  if (errors.length > 0) throw new Error(errors.join('；'));
  return { name, description };
}

export function packagesDir(): string {
  const dir = path.join(process.cwd(), 'public', 'uploads', 'packages');
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}
