#!/usr/bin/env node
/**
 * Batch-generate HelloMe agent 3D icons via gpt-image-2.
 * Usage: node generate-agent-icons.mjs [--only geo,media]
 */

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '../../../..');
const generateScript = path.join(__dirname, 'generate-image.mjs');
const outDir = path.join(projectRoot, 'assets/generated/agents');

const BRAND = `Editorial minimal product illustration for HelloMe AI agent platform.
Warm off-white background #FDFCFB, charcoal black #1A1A1A accents, clean sans-serif mood,
no text watermark, no logo text, soft paper texture, high-end SaaS marketing style.
3D soft clay icon, single centered object, subtle shadow, matte finish, square 1:1 composition.`;

const AGENTS = [
  {
    id: 'geo',
    prompt: `${BRAND} Subject: soft 3D compass with radar rings and AI visibility nodes, sky blue #0EA5E9 accent.`,
  },
  {
    id: 'media',
    prompt: `${BRAND} Subject: soft 3D fountain pen with small content card, rose pink #E11D48 accent.`,
  },
  {
    id: 'sales',
    prompt: `${BRAND} Subject: soft 3D connected user avatars in a network cluster, violet #7C3AED accent.`,
  },
  {
    id: 'schema-optimizer',
    prompt: `${BRAND} Subject: soft 3D globe with structured data brackets and JSON nodes, emerald #059669 accent.`,
  },
  {
    id: 'competitor-scan',
    prompt: `${BRAND} Subject: soft 3D target bullseye with scanning beam, orange #EA580C accent.`,
  },
  {
    id: 'hermes-report',
    prompt: `${BRAND} Subject: soft 3D bar chart dashboard tile with rising bars, indigo #4F46E5 accent.`,
  },
  {
    id: 'faq-generator',
    prompt: `${BRAND} Subject: soft 3D chat bubble with question mark and answer lines, cyan #0891B2 accent.`,
  },
  {
    id: 'ppt-outline',
    prompt: `${BRAND} Subject: soft 3D presentation slides stack with pointer, amber #D97706 accent.`,
  },
  {
    id: 'outreach-mail',
    prompt: `${BRAND} Subject: soft 3D envelope with outgoing arrow trail, blue #2563EB accent.`,
  },
  {
    id: 'copy-audit',
    prompt: `${BRAND} Subject: soft 3D document with magnifying glass and check shield, pink #DB2777 accent.`,
  },
  {
    id: 'sov-tracker',
    prompt: `${BRAND} Subject: soft 3D line chart with upward trend marker, lime green #65A30D accent.`,
  },
  {
    id: 'prompt-lab',
    prompt: `${BRAND} Subject: soft 3D sparkles wand with floating prompt chips, fuchsia #C026D3 accent.`,
  },
];

function parseOnly(argv) {
  const idx = argv.indexOf('--only');
  if (idx === -1) return null;
  return argv[idx + 1]?.split(',').map((s) => s.trim()).filter(Boolean) ?? null;
}

function runOne(agent) {
  return new Promise((resolve, reject) => {
    const output = path.join(outDir, `${agent.id}.png`);
    if (fs.existsSync(output)) {
      console.error(`[skip] ${agent.id} already exists`);
      resolve(output);
      return;
    }

    const args = [
      generateScript,
      '--prompt',
      agent.prompt,
      '--aspect',
      '1:1',
      '--reply-type',
      'json',
      '--output',
      `assets/generated/agents/${agent.id}.png`,
    ];

    console.error(`\n[generate] ${agent.id}...`);
    const child = spawn(process.execPath, args, {
      cwd: projectRoot,
      stdio: 'inherit',
      env: process.env,
    });
    child.on('close', (code) => {
      if (code === 0) resolve(output);
      else reject(new Error(`${agent.id} failed with code ${code}`));
    });
  });
}

async function main() {
  const only = parseOnly(process.argv.slice(2));
  const list = only ? AGENTS.filter((a) => only.includes(a.id)) : AGENTS;

  if (list.length === 0) {
    console.error('No agents matched --only filter');
    process.exit(1);
  }

  fs.mkdirSync(outDir, { recursive: true });

  for (const agent of list) {
    await runOne(agent);
  }

  console.error(`\n[done] ${list.length} agent icon(s) in ${outDir}`);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
