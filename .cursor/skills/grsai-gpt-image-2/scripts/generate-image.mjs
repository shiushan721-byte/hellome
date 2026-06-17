#!/usr/bin/env node
/**
 * Grsai gpt-image-2 image generation CLI for HelloMe.
 * Usage: node generate-image.mjs --prompt "..." [--aspect 16:9] [--output path.png]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '../../../..');

loadEnv(path.join(projectRoot, '.env'));

const args = parseArgs(process.argv.slice(2));
const apiKey = process.env.GRSAI_API_KEY;
const baseUrl = (process.env.GRSAI_BASE_URL || 'https://grsai.dakka.com.cn').replace(/\/$/, '');

if (!apiKey) {
  console.error('Error: GRSAI_API_KEY is not set. Add it to .env (see .env.example).');
  process.exit(1);
}

if (!args.prompt) {
  console.error(`Usage: node generate-image.mjs --prompt "..." [options]

Options:
  --model gpt-image-2|gpt-image-2-vip   (default: gpt-image-2)
  --aspect 16:9|1:1|1024x1024         (default: 16:9)
  --reply-type json|async|stream        (default: json)
  --images url1,url2                    reference images
  --output assets/generated/out.png     download to file
`);
  process.exit(1);
}

const body = {
  model: args.model || 'gpt-image-2',
  prompt: args.prompt,
  images: args.images ? args.images.split(',').map((s) => s.trim()).filter(Boolean) : [],
  aspectRatio: args.aspect || '16:9',
  replyType: args.replyType || 'json',
};

async function main() {
  console.error(`[grsai] POST ${baseUrl}/v1/api/generate`);
  console.error(`[grsai] model=${body.model} aspect=${body.aspectRatio} replyType=${body.replyType}`);

  const res = await fetch(`${baseUrl}/v1/api/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  let data = await res.json().catch(() => ({}));

  if (!res.ok) {
    console.error('API error:', JSON.stringify(data, null, 2));
    process.exit(1);
  }

  if (body.replyType === 'async' && data.status === 'running' && data.id) {
    console.error(`[grsai] async task ${data.id}, polling...`);
    data = await pollResult(data.id);
  }

  if (data.status === 'violation' || data.status === 'failed') {
    console.error('Generation failed:', data.error || data.status);
    process.exit(1);
  }

  if (data.status === 'running') {
    console.error('Still running. Try --reply-type async or retry later.');
    console.log(JSON.stringify(data, null, 2));
    process.exit(2);
  }

  const url = data.results?.[0]?.url;
  if (!url) {
    console.error('No image URL in response:', JSON.stringify(data, null, 2));
    process.exit(1);
  }

  console.log(url);

  if (args.output) {
    const outPath = path.isAbsolute(args.output)
      ? args.output
      : path.join(projectRoot, args.output);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    const imgRes = await fetch(url);
    if (!imgRes.ok) {
      console.error('Failed to download image:', imgRes.status);
      process.exit(1);
    }
    const buf = Buffer.from(await imgRes.arrayBuffer());
    fs.writeFileSync(outPath, buf);
    console.error(`[grsai] saved → ${outPath}`);
  }
}

async function pollResult(id, maxAttempts = 120, intervalMs = 3000) {
  for (let i = 0; i < maxAttempts; i++) {
    const res = await fetch(`${baseUrl}/v1/api/result?id=${encodeURIComponent(id)}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    const data = await res.json().catch(() => ({}));
    if (data.status === 'succeeded' || data.status === 'failed' || data.status === 'violation') {
      return data;
    }
    const progress = data.progress != null ? `${data.progress}%` : '…';
    console.error(`[grsai] poll ${i + 1}/${maxAttempts} status=${data.status} progress=${progress}`);
    await sleep(intervalMs);
  }
  throw new Error('Polling timeout');
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--prompt') out.prompt = argv[++i];
    else if (a === '--model') out.model = argv[++i];
    else if (a === '--aspect') out.aspect = argv[++i];
    else if (a === '--reply-type') out.replyType = argv[++i];
    else if (a === '--images') out.images = argv[++i];
    else if (a === '--output') out.output = argv[++i];
  }
  return out;
}

function loadEnv(envPath) {
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  for (const line of lines) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq === -1) continue;
    const key = t.slice(0, eq).trim();
    let val = t.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
