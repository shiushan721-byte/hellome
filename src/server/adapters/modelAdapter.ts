import { spawn } from 'node:child_process';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { GoogleGenAI } from '@google/genai';

// =============================================================================
// Text generation (existing) — kept 100% unchanged for backward compat.
// =============================================================================
export type ModelProvider = 'openai' | 'openrouter' | 'gemini' | 'mock';

export type ModelDescriptor = {
  id: string;
  provider: ModelProvider;
  label: string;
  configured: boolean;
};

export type GenerateTextInput = {
  prompt: string;
  system?: string;
};

export type GenerateTextOutput = {
  text: string;
  provider: ModelProvider;
  model: string;
  source: 'provider' | 'fallback';
};

function getProvider(): ModelProvider {
  const raw = (process.env.MODEL_PROVIDER ?? '').trim().toLowerCase();
  if (raw === 'openai' || raw === 'openrouter' || raw === 'gemini') {
    return raw;
  }
  return 'mock';
}

function getModelName(): string {
  return (process.env.MODEL_NAME ?? '').trim() || defaultModelName(getProvider());
}

function defaultModelName(provider: ModelProvider): string {
  switch (provider) {
    case 'openai':
      return 'gpt-4.1-mini';
    case 'openrouter':
      return 'openai/gpt-4.1-mini';
    case 'gemini':
      return 'gemini-2.5-flash';
    default:
      return 'mock-hello';
  }
}

function getBaseUrl(provider: ModelProvider): string {
  const envBase = (process.env.MODEL_BASE_URL ?? '').trim();
  if (envBase) return envBase;
  if (provider === 'openrouter') return 'https://openrouter.ai/api/v1';
  return 'https://api.openai.com/v1';
}

function hasProviderKey(provider: ModelProvider): boolean {
  if (provider === 'openai') return Boolean((process.env.OPENAI_API_KEY ?? '').trim());
  if (provider === 'openrouter') return Boolean((process.env.OPENROUTER_API_KEY ?? '').trim());
  if (provider === 'gemini') return Boolean((process.env.GEMINI_API_KEY ?? '').trim());
  return false;
}

function providerKey(provider: ModelProvider): string {
  if (provider === 'openai') return process.env.OPENAI_API_KEY ?? '';
  if (provider === 'openrouter') return process.env.OPENROUTER_API_KEY ?? '';
  if (provider === 'gemini') return process.env.GEMINI_API_KEY ?? '';
  return '';
}

function buildFallbackText(input: GenerateTextInput): string {
  const prompt = input.prompt.trim();
  const firstSentence = prompt.split(/[。！？!?]/)[0] || '你的任务';
  return [
    `这是 HelloMe 的本地降级结果，用于保证 demo 可跑通。`,
    `系统理解：${firstSentence}`,
    `建议下一步：先生成结构化要点，再进入具体内容生成。`,
  ].join('\n');
}

async function generateWithOpenAICompatible(
  provider: 'openai' | 'openrouter',
  input: GenerateTextInput,
): Promise<GenerateTextOutput> {
  const response = await fetch(`${getBaseUrl(provider)}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${providerKey(provider)}`,
      'Content-Type': 'application/json',
      ...(provider === 'openrouter'
        ? {
            'HTTP-Referer': process.env.APP_URL ?? 'http://localhost:3000',
            'X-Title': 'HelloMe Demo',
          }
        : {}),
    },
    body: JSON.stringify({
      model: getModelName(),
      messages: [
        ...(input.system ? [{ role: 'system', content: input.system }] : []),
        { role: 'user', content: input.prompt },
      ],
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    throw new Error(`${provider} 响应失败：${response.status}`);
  }

  const json = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const text = json.choices?.[0]?.message?.content?.trim();
  if (!text) {
    throw new Error(`${provider} 未返回文本内容`);
  }

  return {
    text,
    provider,
    model: getModelName(),
    source: 'provider',
  };
}

async function generateWithGemini(input: GenerateTextInput): Promise<GenerateTextOutput> {
  const ai = new GoogleGenAI({
    apiKey: providerKey('gemini'),
  });

  const response = await ai.models.generateContent({
    model: getModelName(),
    contents: input.prompt,
    config: {
      systemInstruction: input.system,
    },
  });

  const text = response.text?.trim();
  if (!text) {
    throw new Error('gemini 未返回文本内容');
  }

  return {
    text,
    provider: 'gemini',
    model: getModelName(),
    source: 'provider',
  };
}

export async function generateText(input: GenerateTextInput): Promise<GenerateTextOutput> {
  const provider = getProvider();

  try {
    if (provider === 'openai' && hasProviderKey(provider)) {
      return await generateWithOpenAICompatible('openai', input);
    }
    if (provider === 'openrouter' && hasProviderKey(provider)) {
      return await generateWithOpenAICompatible('openrouter', input);
    }
    if (provider === 'gemini' && hasProviderKey(provider)) {
      return await generateWithGemini(input);
    }
  } catch (error) {
    console.error('[modelAdapter] provider request failed, using fallback:', error);
  }

  return {
    text: buildFallbackText(input),
    provider: provider === 'mock' ? 'mock' : provider,
    model: getModelName(),
    source: 'fallback',
  };
}

export function listAvailableModels(): {
  provider: ModelProvider;
  activeModel: string;
  models: ModelDescriptor[];
} {
  const provider = getProvider();
  return {
    provider,
    activeModel: getModelName(),
    models: [
      {
        id: 'gpt-4.1-mini',
        provider: 'openai',
        label: 'OpenAI · gpt-4.1-mini',
        configured: hasProviderKey('openai'),
      },
      {
        id: 'openai/gpt-4.1-mini',
        provider: 'openrouter',
        label: 'OpenRouter · openai/gpt-4.1-mini',
        configured: hasProviderKey('openrouter'),
      },
      {
        id: 'gemini-2.5-flash',
        provider: 'gemini',
        label: 'Gemini · gemini-2.5-flash',
        configured: hasProviderKey('gemini'),
      },
      {
        id: 'mock-hello',
        provider: 'mock',
        label: 'Mock Fallback',
        configured: true,
      },
    ],
  };
}

// =============================================================================
// Media generation (image / video / edit) — NEW.
//
// Same adapter pattern as text: a `MediaProvider` selected via env
// (MEDIA_PROVIDER), graceful fallback, `source: 'provider' | 'fallback'`
// in the output so callers can distinguish real vs mock results.
//
// Key design: the local-comfyui provider is treated identically to a remote
// API — same input shape, same output shape, same fallback semantics. Adding
// a new provider (e.g. fal.ai, replicate) is a single function.
// =============================================================================
export type MediaProvider = 'gemini' | 'grsai' | 'local-comfyui' | 'mock';

export type MediaTask = 'txt2img' | 'txt2video' | 'img2video' | 'edit';

export type GenerateMediaInput = {
  task: MediaTask;
  prompt: string;
  /** Required for img2video / edit; ignored for txt* tasks. */
  inputImageUrl?: string;
  /** Server-side filename if the input image was already uploaded to ComfyUI. */
  inputImageFilename?: string;
  /** Override which workflow to run (default picked by task). */
  workflow?: string;
  /** Override seed for reproducibility. */
  seed?: number;
  /** Caller-provided timeout in ms; default = 30s image / 1800s video. */
  timeoutMs?: number;
};

export type GenerateMediaOutput = {
  /** Primary artifact: URL (remote) or local file path (local-comfyui / mock). */
  url: string;
  mimeType: string;
  provider: MediaProvider;
  model: string;
  workflow?: string;
  promptId?: string;
  elapsedMs?: number;
  source: 'provider' | 'fallback';
};

export type MediaDescriptor = {
  id: string;
  provider: MediaProvider;
  task: MediaTask;
  label: string;
  configured: boolean;
};

const LOCAL_COMFY_MODELS: MediaDescriptor[] = [
  {
    id: 'z-image-turbo',
    provider: 'local-comfyui',
    task: 'txt2img',
    label: 'Z Image Turbo',
    configured: true,
  },
  {
    id: 'ltx-2b',
    provider: 'local-comfyui',
    task: 'txt2video',
    label: 'LTX 2B',
    configured: true,
  },
  {
    id: 'wan22-5b',
    provider: 'local-comfyui',
    task: 'img2video',
    label: 'Wan 2.2 5B',
    configured: true,
  },
  {
    id: 'qwen-image-edit-2511',
    provider: 'local-comfyui',
    task: 'edit',
    label: 'Qwen Image Edit 2511',
    configured: true,
  },
];

const DEFAULT_MEDIA_OUTPUT_DIR =
  process.env.MEDIA_OUTPUT_DIR ?? path.resolve(process.cwd(), 'public', 'media');

function getMediaProvider(): MediaProvider {
  const raw = (process.env.MEDIA_PROVIDER ?? '').trim().toLowerCase();
  if (raw === 'gemini') return 'gemini';
  if (raw === 'grsai') return 'grsai';
  if (raw === 'local-comfyui') return 'local-comfyui';
  return 'mock';
}

function defaultModelForTask(provider: MediaProvider, task: MediaTask): string {
  if (provider === 'gemini') {
    if (task === 'edit') return 'imagen-3.0-capability-001';
    return 'imagen-4.0-generate-001';
  }
  if (provider === 'grsai') {
    return process.env.GRSAI_MODEL?.trim() || 'gpt-image-2';
  }
  if (provider === 'local-comfyui') {
    switch (task) {
      case 'txt2img':
        return 'z-image-turbo';
      case 'txt2video':
        return 'ltx-2b';
      case 'img2video':
        return 'wan22-5b';
      case 'edit':
        return 'qwen-image-edit-2511';
    }
  }
  return `mock-${task}`;
}

function mimeForTask(task: MediaTask): string {
  switch (task) {
    case 'txt2img':
    case 'edit':
      return 'image/png';
    case 'txt2video':
    case 'img2video':
      return 'video/mp4';
  }
}

function defaultTimeoutMs(task: MediaTask): number {
  if (task === 'txt2video' || task === 'img2video') return 1_800_000;
  return 600_000; // 10 min for image / edit
}

function isLocalComfyUiConfigured(): boolean {
  // local-comfyui needs the CLI binary reachable. We don't pre-flight the
  // server — `spawnSync` will surface a clear error if it's down.
  const cli = process.env.COMFYUI_SKILL_CLI?.trim() || 'comfyui-skill';
  return Boolean(cli);
}

function geminiApiKey(): string {
  return (process.env.GEMINI_API_KEY ?? '').trim();
}

function geminiMediaConfigured(): boolean {
  return Boolean(geminiApiKey());
}

function grsaiApiKey(): string {
  return (process.env.GRSAI_API_KEY ?? '').trim();
}

function grsaiBaseUrl(): string {
  return (process.env.GRSAI_BASE_URL ?? 'https://grsai.dakka.com.cn').replace(/\/$/, '');
}

function grsaiMediaConfigured(): boolean {
  return Boolean(grsaiApiKey());
}

// =============================================================================
// Provider implementations
// =============================================================================

async function generateImageWithGemini(input: GenerateMediaInput): Promise<GenerateMediaOutput> {
  const ai = new GoogleGenAI({ apiKey: geminiApiKey() });
  const model = process.env.MEDIA_MODEL?.trim() || defaultModelForTask('gemini', input.task);

  if (input.task === 'edit') {
    if (!input.inputImageUrl) {
      throw new Error('edit task requires inputImageUrl');
    }
    // Imagen 3 capability model handles edit via reference images.
    const resp = await ai.models.generateImages({
      model,
      prompt: input.prompt,
      config: {
        numberOfImages: 1,
        referenceImages: [await urlToInlineData(input.inputImageUrl)],
      } as never,
    });
    const img = resp.generatedImages?.[0]?.image;
    if (!img) throw new Error('gemini edit returned no image');
    const buf = Buffer.from(img.imageBytes ?? '', 'base64');
    return persistLocal(buf, 'png', 'gemini', model, { mimeType: 'image/png' });
  }

  // txt2img path
  const resp = await ai.models.generateImages({
    model,
    prompt: input.prompt,
    config: { numberOfImages: 1 } as never,
  });
  const img = resp.generatedImages?.[0]?.image;
  if (!img) throw new Error('gemini txt2img returned no image');
  const buf = Buffer.from(img.imageBytes ?? '', 'base64');
  return persistLocal(buf, 'png', 'gemini', model, { mimeType: 'image/png' });
}

/**
 * Grsai gpt-image-2 — third-party Chinese API that wraps OpenAI's image
 * model. Reuses the same vendor SDK surface as the standalone skill at
 * `.cursor/skills/grsai-gpt-image-2/`, so the prompt conventions and
 * model variants stay consistent across the project.
 *
 * Capabilities:
 *   - txt2img (with optional reference images)
 *   - edit (passing input_image as a reference)
 *
 * Note: Grsai does not currently expose a video model, so video tasks
 * fall back to mock even when MEDIA_PROVIDER=grsai.
 */
async function generateImageWithGrsai(input: GenerateMediaInput): Promise<GenerateMediaOutput> {
  if (input.task === 'txt2video' || input.task === 'img2video') {
    throw new Error(`grsai provider does not support ${input.task}; switch MEDIA_PROVIDER or use a different model`);
  }

  const aspect = process.env.GRSAI_ASPECT?.trim() || '1:1';
  const model = defaultModelForTask('grsai', input.task);
  const images: string[] = [];
  if (input.inputImageUrl) images.push(input.inputImageUrl);
  if (input.task === 'edit' && !input.inputImageUrl) {
    throw new Error('grsai edit requires inputImageUrl');
  }

  const body = {
    model,
    prompt: input.prompt,
    images,
    aspectRatio: aspect,
    replyType: 'json',
  };

  const started = Date.now();
  const resp = await fetch(`${grsaiBaseUrl()}/v1/api/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${grsaiApiKey()}`,
    },
    body: JSON.stringify(body),
  });
  let data: Record<string, unknown> = {};
  try {
    data = await resp.json() as Record<string, unknown>;
  } catch {
    /* not JSON — fall through to error */
  }
  if (!resp.ok) {
    throw new Error(`grsai HTTP ${resp.status}: ${JSON.stringify(data).slice(-300)}`);
  }

  // Handle violation / failure / running status.
  if (data.status === 'violation' || data.status === 'failed') {
    throw new Error(`grsai refused: ${JSON.stringify(data.error ?? data.status)}`);
  }
  if (data.status === 'running') {
    throw new Error(`grsai still running (no replyType=async support yet) — task id=${data.id}`);
  }

  const url = pickGrsaiImageUrl(data);
  if (!url) throw new Error(`grsai response missing results[0].url: ${JSON.stringify(data).slice(-300)}`);

  const buf = await fetchBytes(url);
  return persistLocal(buf, 'png', 'grsai', model, {
    mimeType: 'image/png',
    elapsedMs: Date.now() - started,
  });
}

function pickGrsaiImageUrl(data: Record<string, unknown>): string | null {
  const results = Array.isArray(data.results) ? (data.results as Array<Record<string, unknown>>) : [];
  for (const r of results) {
    const u = r.url ?? r.image_url ?? r.imageUrl;
    if (typeof u === 'string' && u.length > 0) return u;
  }
  return null;
}

/**
 * Local ComfyUI via the `comfyui-skill` CLI (a thin wrapper that turns any
 * ComfyUI workflow into a callable skill with schema-based params).
 *
 * The CLI handles UI→API conversion, server health, and history polling —
 * this adapter just translates our unified input into the right invocation.
 *
 * Each registered workflow has its own schema.json with auto-detected
 * parameter names (e.g. `prompt_clip_text_encode_positive_prompt`). We map
 * our unified `prompt` / `inputImageFilename` / `seed` onto whatever the
 * schema exposes by picking the first required string prompt / required
 * image / first int seed field.
 */
async function generateWithLocalComfyUi(input: GenerateMediaInput): Promise<GenerateMediaOutput> {
  const cli = process.env.COMFYUI_SKILL_CLI?.trim() || 'comfyui-skill';
  const dir = process.env.COMFYUI_SKILL_DIR?.trim();
  const server = process.env.COMFYUI_SKILL_SERVER?.trim() || 'local';
  const model = input.workflow ?? defaultModelForTask('local-comfyui', input.task);
  const workflowId = model.includes('/') ? model : `${server}/${model}`;

  // Discover the workflow's schema so we can map `prompt` / `inputImage*` /
  // `seed` to whatever names `comfyui-skill` expects.
  const schema = await readWorkflowSchema(cli, dir, workflowId);

  const args: Record<string, unknown> = {};
  // Map our unified prompt to the workflow's primary string field.
  if (schema.promptField) args[schema.promptField] = input.prompt;
  // Map optional seed.
  if (input.seed !== undefined && schema.seedField) args[schema.seedField] = input.seed;
  // For img2video / edit: upload the input image first, then pass the
  // server-side filename into the schema's image field.
  if (input.task === 'img2video' || input.task === 'edit') {
    const localPath = await resolveInputImage(input);
    if (!localPath) {
      throw new Error(`${input.task} requires inputImageUrl or inputImageFilename`);
    }
    const uploaded = await runCliCapture(
      cli, dir, ['upload', localPath], input.timeoutMs ?? defaultTimeoutMs(input.task),
    );
    // `comfyui-skill upload` returns the uploaded filename.
    const uploadedName = parseUploadFilename(uploaded);
    if (schema.imageField) args[schema.imageField] = uploadedName;
  }

  const cliArgs = ['--json', 'run', workflowId, '--args', JSON.stringify(args)];
  const started = Date.now();
  const stdout = await runCli(cli, dir, cliArgs, input.timeoutMs ?? defaultTimeoutMs(input.task));

  // `comfyui-skill --json run` emits a single JSON object (not NDJSON).
  let completion: Record<string, unknown>;
  try {
    completion = JSON.parse(stdout.trim());
  } catch {
    throw new Error(`comfyui-skill run returned non-JSON: ${stdout.slice(-500)}`);
  }
  if (completion.status !== 'success') {
    throw new Error(`comfyui-skill run failed: ${JSON.stringify(completion).slice(-500)}`);
  }

  const outputs = Array.isArray(completion.outputs) ? (completion.outputs as Array<Record<string, unknown>>) : [];
  if (outputs.length === 0) {
    throw new Error('comfyui-skill run succeeded but returned no outputs');
  }
  const first = outputs[0];
  // Prefer the local_path (already on disk); fall back to url.
  const localPath = typeof first.local_path === 'string' ? first.local_path : '';
  const url = typeof first.url === 'string' ? first.url : localPath;
  if (!url) throw new Error('comfyui-skill output missing both local_path and url');

  // Copy into our public/ dir so the API returns a stable URL.
  const { promises: fsp } = await import('node:fs');
  const buf = await fsp.readFile(localPath || url);
  const ext = pickExt(url, input.task);
  return persistLocal(buf, ext, 'local-comfyui', workflowId, {
    promptId: typeof completion.prompt_id === 'string' ? completion.prompt_id : undefined,
    elapsedMs: Date.now() - started,
  });
}

interface WorkflowSchema {
  promptField: string | null;
  seedField: string | null;
  imageField: string | null;
}

async function readWorkflowSchema(
  cli: string,
  dir: string | undefined,
  workflowId: string,
): Promise<WorkflowSchema> {
  // `comfyui-skill info <id>` prints JSON with the workflow's parameters.
  const stdout = await runCliCapture(cli, dir, ['info', workflowId]);
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(stdout.trim());
  } catch {
    return { promptField: null, seedField: null, imageField: null };
  }
  const params = (parsed.parameters ?? {}) as Record<string, { type?: string; required?: boolean }>;

  // Prefer the prompt field whose name explicitly contains "positive"
  // (matches comfyui-skill's auto-detected naming convention).
  const promptCandidates = Object.entries(params)
    .filter(([, spec]) => spec.type === 'string' && /positive/i.test(String(spec.type || '')) === false);
  const promptField =
    Object.entries(params).find(([k, s]) => s.type === 'string' && /positive/i.test(k))?.[0]
    || Object.entries(params).find(([, s]) => s.type === 'string' && s.required)?.[0]
    || null;

  const seedField = Object.entries(params).find(([, s]) => s.type === 'int' && /seed/i.test(Object.entries(params).find(([k]) => /seed/i.test(k))?.[0] || ''))?.[0]
    || Object.entries(params).find(([k, s]) => s.type === 'int' && /seed/i.test(k))?.[0]
    || null;

  const imageField = Object.entries(params).find(([, s]) => s.type === 'image')?.[0] || null;

  return { promptField, seedField, imageField };
}

function parseUploadFilename(stdout: string): string {
  try {
    const obj = JSON.parse(stdout.trim());
    if (typeof obj.filename === 'string') return obj.filename;
    if (typeof obj.name === 'string') return obj.name;
  } catch { /* fall through */ }
  // Fallback: look for `uploaded: <filename>` in text output
  const m = /(?:"filename"|"name")\s*:\s*"([^"]+)"/.exec(stdout);
  if (m) return m[1];
  throw new Error(`could not parse upload response: ${stdout.slice(-300)}`);
}

async function resolveInputImage(input: GenerateMediaInput): Promise<string | null> {
  if (input.inputImageFilename) return input.inputImageFilename;
  if (!input.inputImageUrl) return null;
  // Download the URL to a temp file so `comfyui-skill upload` can ingest it.
  const resp = await fetch(input.inputImageUrl);
  if (!resp.ok) throw new Error(`fetch input image ${input.inputImageUrl} → ${resp.status}`);
  const ab = await resp.arrayBuffer();
  const buf = Buffer.from(ab);
  const tmpDir = path.join(process.env.MEDIA_OUTPUT_DIR ?? path.resolve(process.cwd(), 'public', 'media'), '_in');
  await fs.mkdir(tmpDir, { recursive: true });
  const ext = mimeFromExt(pickExt(input.inputImageUrl, 'edit')) === 'image/png' ? 'png' : 'jpg';
  const tmpFile = path.join(tmpDir, `in-${Date.now()}.${ext}`);
  await fs.writeFile(tmpFile, buf);
  return tmpFile;
}

// =============================================================================
// Fallback (mock) — guarantees the API never throws on missing config.
// =============================================================================
async function buildMediaFallback(input: GenerateMediaInput): Promise<GenerateMediaOutput> {
  await fs.mkdir(DEFAULT_MEDIA_OUTPUT_DIR, { recursive: true });
  const ext = input.task.startsWith('txt2') || input.task === 'edit' ? 'svg' : 'svg';
  const fileName = `mock-${input.task}-${Date.now()}.${ext}`;
  const filePath = path.join(DEFAULT_MEDIA_OUTPUT_DIR, fileName);
  const svg = renderMockSvg(input);
  await fs.writeFile(filePath, svg, 'utf-8');
  return {
    url: path.relative(process.cwd(), filePath),
    mimeType: 'image/svg+xml',
    provider: 'mock',
    model: defaultModelForTask('mock', input.task),
    source: 'fallback',
  };
}

function renderMockSvg(input: GenerateMediaInput): string {
  const label = (input.prompt || '').slice(0, 80);
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 576" width="1024" height="576">`,
    `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">`,
    `<stop offset="0%" stop-color="#1e293b"/><stop offset="100%" stop-color="#0f172a"/>`,
    `</linearGradient></defs>`,
    `<rect width="1024" height="576" fill="url(#g)"/>`,
    `<text x="512" y="260" fill="#94a3b8" font-family="ui-sans-serif,system-ui" font-size="28" text-anchor="middle">[MOCK ${input.task}]</text>`,
    `<text x="512" y="310" fill="#e2e8f0" font-family="ui-sans-serif,system-ui" font-size="22" text-anchor="middle">${escapeXml(label)}</text>`,
    `<text x="512" y="350" fill="#64748b" font-family="ui-sans-serif,system-ui" font-size="14" text-anchor="middle">set MEDIA_PROVIDER to a real provider</text>`,
    `</svg>`,
  ].join('\n');
}

function escapeXml(s: string): string {
  return s.replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[c]!);
}

// =============================================================================
// Public dispatch — mirrors generateText's try/catch + fallback shape.
// =============================================================================
export async function generateMedia(input: GenerateMediaInput): Promise<GenerateMediaOutput> {
  const provider = getMediaProvider();
  try {
    if (provider === 'gemini' && geminiMediaConfigured()) {
      return await generateImageWithGemini(input);
    }
    if (provider === 'grsai' && grsaiMediaConfigured()) {
      return await generateImageWithGrsai(input);
    }
    if (provider === 'local-comfyui' && isLocalComfyUiConfigured()) {
      return await generateWithLocalComfyUi(input);
    }
  } catch (error) {
    console.error(`[mediaAdapter] ${provider} ${input.task} failed, using mock fallback:`, error);
  }
  return await buildMediaFallback(input);
}

// Task-named shims so callers don't need to repeat `task`.
export const generateImage = (input: Omit<GenerateMediaInput, 'task'>) =>
  generateMedia({ ...input, task: 'txt2img' });

export const generateVideo = (input: Omit<GenerateMediaInput, 'task'>) =>
  generateMedia({ ...input, task: input.inputImageUrl ? 'img2video' : 'txt2video' });

export const editImage = (input: Omit<GenerateMediaInput, 'task'>) =>
  generateMedia({ ...input, task: 'edit' });

export function listAvailableMediaModels(): {
  provider: MediaProvider;
  tasks: MediaTask[];
  models: MediaDescriptor[];
} {
  const provider = getMediaProvider();
  const configured =
    provider === 'gemini'
      ? geminiMediaConfigured()
      : provider === 'grsai'
        ? grsaiMediaConfigured()
        : provider === 'local-comfyui'
          ? isLocalComfyUiConfigured()
          : true;
  // Grsai is image-only; video tasks fall back to mock even when configured.
  const tasks: MediaTask[] = provider === 'grsai'
    ? ['txt2img', 'edit']
    : ['txt2img', 'txt2video', 'img2video', 'edit'];
  if (provider === 'local-comfyui') {
    return {
      provider,
      tasks,
      models: LOCAL_COMFY_MODELS.map((model) => ({
        ...model,
        configured,
      })),
    };
  }
  return {
    provider,
    tasks,
    models: tasks.map((t) => ({
      id: defaultModelForTask(provider, t),
      provider,
      task: t,
      label: `${provider} · ${t}`,
      configured,
    })),
  };
}

// =============================================================================
// Internal helpers — kept private; tests can reach them via `__testing`.
// =============================================================================
async function runCli(cmd: string, dir: string | undefined, args: string[], timeoutMs: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const fullArgs = dir ? ['--dir', dir, ...args] : args;
    const child = spawn(cmd, fullArgs, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      reject(new Error(`comfyui-skill timed out after ${timeoutMs}ms`));
    }, timeoutMs);
    child.stdout.on('data', (chunk: Buffer) => (stdout += chunk.toString()));
    child.stderr.on('data', (chunk: Buffer) => (stderr += chunk.toString()));
    child.on('error', (err) => {
      clearTimeout(timer);
      reject(new Error(`failed to spawn ${cmd}: ${err.message}`));
    });
    child.on('exit', (code) => {
      clearTimeout(timer);
      if (code === 0) return resolve(stdout);
      reject(new Error(`${cmd} exited ${code}: ${stderr.slice(-500)}\nstdout: ${stdout.slice(-500)}`));
    });
  });
}

async function runCliCapture(cmd: string, dir: string | undefined, args: string[], timeoutMs = 60_000): Promise<string> {
  return runCli(cmd, dir, args, timeoutMs);
}

async function fetchBytes(url: string): Promise<Buffer> {
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`fetch ${url} → HTTP ${resp.status}`);
  const ab = await resp.arrayBuffer();
  return Buffer.from(ab);
}

async function urlToInlineData(url: string): Promise<{ inlineData: { mimeType: string; data: string } }> {
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`fetch ${url} → HTTP ${resp.status}`);
  const mime = resp.headers.get('content-type') ?? 'image/png';
  const ab = await resp.arrayBuffer();
  const b64 = Buffer.from(ab).toString('base64');
  return { inlineData: { mimeType: mime, data: b64 } };
}

async function persistLocal(
  buf: Buffer,
  ext: string,
  provider: MediaProvider,
  model: string,
  extras: Partial<GenerateMediaOutput> = {},
): Promise<GenerateMediaOutput> {
  await fs.mkdir(DEFAULT_MEDIA_OUTPUT_DIR, { recursive: true });
  const fileName = `${provider}-${Date.now()}.${ext}`;
  const filePath = path.join(DEFAULT_MEDIA_OUTPUT_DIR, fileName);
  await fs.writeFile(filePath, buf);
  return {
    url: path.relative(process.cwd(), filePath),
    mimeType: extras.mimeType ?? mimeFromExt(ext),
    provider,
    model,
    source: 'provider',
    ...extras,
  };
}

function pickExt(url: string, task: MediaTask): string {
  const m = /\.([a-z0-9]+)(?:\?|$)/i.exec(url);
  if (m) return m[1].toLowerCase();
  return task === 'txt2img' || task === 'edit' ? 'png' : 'mp4';
}

function mimeFromExt(ext: string): string {
  switch (ext.toLowerCase()) {
    case 'png': return 'image/png';
    case 'jpg':
    case 'jpeg': return 'image/jpeg';
    case 'webp': return 'image/webp';
    case 'mp4': return 'video/mp4';
    case 'webm': return 'video/webm';
    default: return 'application/octet-stream';
  }
}
