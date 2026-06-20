/**
 * adminSkillService — single source of truth for "what skills does this
 * project actually have", aggregating all three layers:
 *
 *   1. Engineering skills under `.cursor/agent-skills/skills/` (read from
 *      SKILL.md frontmatter on disk; never queried at runtime).
 *   2. Business skill variants defined in `skillStudioService.PUBLIC_SKILL_VARIANTS`
 *      (UGC, seeding, review, conversion) — surfaced by ID for the admin UI.
 *   3. Generation skills backed by `comfyui-skill` workflows registered
 *      under the local MEDIA_PROVIDER (txt2img, txt2video, img2video, edit).
 *
 * Layer 1 is enumerated by directory scan; layers 2 and 3 are read from
 * in-process state (no DB hits). Designed to power `/api/admin/skills`
 * without requiring auth — it's an introspection endpoint for ops/dev
 * tooling, not a privileged surface.
 */
import fs from 'node:fs';
import path from 'node:path';
import { listSkills } from './skillStudioService';
import { listAvailableMediaModels } from './adapters/modelAdapter';

export type AdminSkillLayer = 'engineering' | 'business' | 'generation';

export type AdminSkill = {
  id: string;
  name: string;
  layer: AdminSkillLayer;
  description: string;
  triggers: string[];
  configured: boolean;
  meta: Record<string, unknown>;
};

const ENGINEERING_SKILLS_DIR = path.resolve(process.cwd(), '.cursor', 'agent-skills', 'skills');

function readEngineeringSkills(): AdminSkill[] {
  const skills: AdminSkill[] = [];
  let entries: fs.Dirent[] = [];
  try {
    entries = fs.readdirSync(ENGINEERING_SKILLS_DIR, { withFileTypes: true });
  } catch {
    return skills;
  }
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const skillMd = path.join(ENGINEERING_SKILLS_DIR, entry.name, 'SKILL.md');
    if (!fs.existsSync(skillMd)) continue;
    try {
      const text = fs.readFileSync(skillMd, 'utf8');
      const fm = parseFrontmatter(text);
      const id = fm.name ?? entry.name;
      skills.push({
        id,
        name: fm.name ?? entry.name,
        layer: 'engineering',
        description: fm.description ?? '',
        triggers: extractTriggers(fm.description ?? ''),
        configured: true,
        meta: { path: skillMd },
      });
    } catch {
      skills.push({
        id: entry.name,
        name: entry.name,
        layer: 'engineering',
        description: '(failed to read SKILL.md)',
        triggers: [],
        configured: false,
        meta: { path: skillMd },
      });
    }
  }
  return skills.sort((a, b) => a.id.localeCompare(b.id));
}

function parseFrontmatter(text: string): Record<string, string> {
  // Match the leading `---` block at the top of the file.
  const m = /^---\n([\s\S]*?)\n---/.exec(text);
  if (!m) return {};
  const out: Record<string, string> = {};
  for (const line of m[1].split('\n')) {
    const mm = /^([a-z_]+):\s*(.*)$/i.exec(line);
    if (!mm) continue;
    let v = mm[2];
    // Strip wrapping quotes and collapse multi-line folded scalars.
    v = v.replace(/^['"]|['"]$/g, '');
    if (v === '>-' || v === '|') {
      // YAML block scalar indicator — we don't need to parse the body here.
      continue;
    }
    out[mm[1].toLowerCase()] = v;
  }
  return out;
}

function extractTriggers(description: string): string[] {
  const out: string[] = [];
  const re = /Use when[^.]+\./g;
  for (const m of description.matchAll(re)) {
    const cleaned = m[0]
      .replace(/^Use when\s+/i, '')
      .replace(/\.$/, '')
      .trim();
    if (cleaned) out.push(cleaned);
  }
  return out;
}

async function readBusinessSkills(): Promise<AdminSkill[]> {
  let records: Awaited<ReturnType<typeof listSkills>> = [];
  try {
    records = await listSkills();
  } catch {
    records = [];
  }
  return records.map((rec) => ({
    id: rec.id,
    name: rec.name ?? rec.id,
    layer: 'business',
    description: rec.description ?? '',
    triggers: rec.category ? [rec.category] : [],
    configured: rec.status === 'published',
    meta: {
      status: rec.status,
      slug: rec.slug,
      currentVersion: rec.currentVersion,
      publishedAt: rec.publishedAt ?? null,
    },
  }));
}

function readGenerationSkills(): AdminSkill[] {
  const media = listAvailableMediaModels();
  return media.models.map((m) => ({
    id: m.id,
    name: m.label,
    layer: 'generation',
    description: `${m.task} via ${m.provider}`,
    triggers: [m.task],
    configured: m.configured,
    meta: {
      provider: m.provider,
      task: m.task,
    },
  }));
}

export async function listAllSkills(): Promise<{
  total: number;
  byLayer: Record<AdminSkillLayer, number>;
  skills: AdminSkill[];
}> {
  const engineering = readEngineeringSkills();
  const business = await readBusinessSkills();
  const generation = readGenerationSkills();
  const skills = [...engineering, ...business, ...generation];
  return {
    total: skills.length,
    byLayer: {
      engineering: engineering.length,
      business: business.length,
      generation: generation.length,
    },
    skills,
  };
}