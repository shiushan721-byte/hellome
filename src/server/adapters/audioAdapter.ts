/**
 * audioAdapter.ts — Text-to-Speech (TTS) generation via local ComfyUI.
 *
 * Phase A1 of the audio-extension roadmap. Currently delegates to
 * `diodiogod/TTS-Audio-Suite` (ChatterBox engine) registered as the
 * `tts_chatterbox_api` workflow in the local `comfyui-skill` project.
 *
 * Boundary: this module is server-side skill asset only. No project
 * frontend or test code lives here.
 *
 * Public surface:
 *   - `generateAudio({ text, voice, language, speed, seed, timeoutMs })`
 *   - `listAvailableAudioModels()` — returns the registered TTS workflow
 *
 * Provider semantics follow `modelAdapter.ts`:
 *   - `local-comfyui` (the only provider for now) returns `source: 'provider'`
 *     when comfyui-skill successfully executes the workflow.
 *   - On any failure (server unreachable, model missing, OOM), it falls back
 *     to a tiny silent WAV with `source: 'fallback'` so the rest of the
 *     pipeline keeps running.
 */

import { spawn } from 'node:child_process';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { URL } from 'node:url';

// =============================================================================
// Public types
// =============================================================================

export type AudioProvider = 'local-comfyui' | 'mock';

export interface GenerateAudioInput {
  /** Required. The text to synthesize. */
  text: string;
  /** Optional. Voice ID (engine-specific). Default: 'default'. */
  voice?: string;
  /** Optional. Language code. Default: 'English'. */
  language?: 'English' | 'German' | 'French' | 'Japanese' | 'Korean' | 'Chinese' | string;
  /** Optional. Speech rate multiplier 0.5–2.0. Default: 1.0. */
  speed?: number;
  /** Optional. Seed for reproducibility. */
  seed?: number;
  /** Optional. Override which workflow to run. Default: 'tts_chatterbox_api'. */
  workflow?: string;
  /** Optional. Timeout in ms. Default: 180000 (3 min for first-run model download). */
  timeoutMs?: number;
}

export interface GenerateAudioOutput {
  url: string;
  mimeType: 'audio/wav' | 'audio/flac' | 'audio/mpeg';
  provider: AudioProvider;
  model: string;
  workflow?: string;
  promptId?: string;
  elapsedMs?: number;
  /** Duration of the generated audio in milliseconds. */
  durationMs?: number;
  /** Sample rate of the produced audio in Hz. */
  sampleRate?: number;
  /** Number of audio channels (1=mono, 2=stereo). */
  channels?: number;
  source: 'provider' | 'fallback';
  /** Bytes of the audio payload, for downstream merging / size checks. */
  sizeBytes?: number;
}

export interface AudioModelDescriptor {
  id: string;
  provider: AudioProvider;
  language: string;
  label: string;
  configured: boolean;
}

// =============================================================================
// Env helpers (mirror modelAdapter.ts conventions)
// =============================================================================

const VENV_PYTHON = process.env.COMFYUI_SKILL_VENV_PYTHON
  || '/Users/feihong/comfy/.venv/bin/python';
const COMFY_BIN = process.env.COMFYUI_SKILL_CLI
  || '/Users/feihong/comfy/.venv/bin/comfyui-skill';
const COMFYUI_SKILL_DIR = process.env.COMFYUI_SKILL_DIR
  || '/Users/feihong/Documents/hellome/.comfyui-skill';
const MEDIA_OUTPUT_DIR = process.env.MEDIA_OUTPUT_DIR
  || path.resolve(process.cwd(), 'public', 'media');

function isLocalComfyUiConfigured(): boolean {
  // Local-comfyui requires the CLI binary reachable. We don't pre-flight the
  // server — `spawnSync` will surface a clear error if it's down.
  return Boolean(COMFY_BIN);
}

function defaultAudioModel(workflow?: string): string {
  return workflow ?? 'tts_chatterbox_api';
}

// =============================================================================
// Provider implementation
// =============================================================================

/**
 * Call `comfyui-skill run <workflow> --args '{...}'` synchronously and parse
 * the JSON envelope. Throws on any failure (caller falls back to mock).
 */
async function generateWithLocalComfyUi(input: GenerateAudioInput): Promise<GenerateAudioOutput> {
  const workflow = input.workflow ?? 'tts_chatterbox_api';
  const started = Date.now();

  const args: Record<string, unknown> = {
    prompt: input.text,
  };
  if (input.language) args.language = input.language;
  if (input.seed !== undefined) args.seed = input.seed;
  if (input.voice) args.voice = input.voice;
  if (input.speed !== undefined) args.speed = input.speed;

  const cliArgs = [
    '--json', 'run', workflow,
    '--args', JSON.stringify(args),
  ];

  const stdout = await runCliCapture(cliArgs, input.timeoutMs ?? 180_000);

  // comfyui-skill --json run emits a single JSON object, NOT NDJSON.
  let completion: Record<string, unknown>;
  try {
    completion = JSON.parse(stdout.trim());
  } catch {
    throw new Error(`comfyui-skill run returned non-JSON: ${stdout.slice(-500)}`);
  }
  if (completion.status !== 'success') {
    throw new Error(`comfyui-skill run failed: ${JSON.stringify(completion).slice(-500)}`);
  }

  const outputs = Array.isArray(completion.outputs)
    ? (completion.outputs as Array<Record<string, unknown>>)
    : [];
  if (outputs.length === 0) {
    throw new Error('comfyui-skill run succeeded but returned no outputs');
  }

  // Find the audio output (skip image/video, take the first audio)
  const audioOut = outputs.find((o) => {
    const t = (o.media_type ?? o.type ?? '').toString().toLowerCase();
    return t === 'audio';
  }) ?? outputs[0];

  // comfyui-skill returns the file on disk (not a URL) under `local_path`
  // (ComfyUI `output/` directory). We copy into `public/media/` so the
  // consumer can fetch via HTTP.
  const sourcePath = typeof audioOut.local_path === 'string'
    ? audioOut.local_path
    : '';
  if (!sourcePath) {
    throw new Error(`comfyui-skill output missing local_path: ${JSON.stringify(audioOut)}`);
  }

  const buf = await fs.readFile(sourcePath);
  const ext = path.extname(sourcePath).replace(/^\./, '').toLowerCase() || 'flac';
  const mimeType: GenerateAudioOutput['mimeType'] =
    ext === 'wav' ? 'audio/wav' :
    ext === 'mp3' ? 'audio/mpeg' :
    'audio/flac';

  await fs.mkdir(MEDIA_OUTPUT_DIR, { recursive: true });
  const destName = `audio-${Date.now()}.${ext}`;
  const destPath = path.join(MEDIA_OUTPUT_DIR, destName);
  await fs.writeFile(destPath, buf);

  return {
    url: path.relative(process.cwd(), destPath),
    mimeType,
    provider: 'local-comfyui',
    model: workflow,
    workflow,
    promptId: typeof completion.prompt_id === 'string' ? completion.prompt_id : undefined,
    elapsedMs: Date.now() - started,
    sizeBytes: buf.length,
    source: 'provider',
  };
}

/**
 * Fallback: produce a 1-second silent WAV so downstream callers don't crash
 * when audio is unavailable. Returns `source: 'fallback'`.
 */
async function buildAudioFallback(input: GenerateAudioInput): Promise<GenerateAudioOutput> {
  await fs.mkdir(MEDIA_OUTPUT_DIR, { recursive: true });
  const destName = `audio-mock-${Date.now()}.wav`;
  const destPath = path.join(MEDIA_OUTPUT_DIR, destName);
  // Minimal valid WAV: 1 second of silence, 16kHz, mono, 16-bit PCM = 32044 bytes
  const silentWav = makeSilentWav(16000, 1, 16, 1);
  await fs.writeFile(destPath, silentWav);
  return {
    url: path.relative(process.cwd(), destPath),
    mimeType: 'audio/wav',
    provider: 'mock',
    model: 'silent-mock',
    workflow: input.workflow,
    elapsedMs: 0,
    sizeBytes: silentWav.length,
    source: 'fallback',
    sampleRate: 16000,
    channels: 1,
    durationMs: 1000,
  };
}

// =============================================================================
// Public API (mirror modelAdapter.ts)
// =============================================================================

export async function generateAudio(input: GenerateAudioInput): Promise<GenerateAudioOutput> {
  const provider: AudioProvider = isLocalComfyUiConfigured() ? 'local-comfyui' : 'mock';
  try {
    if (provider === 'local-comfyui') {
      return await generateWithLocalComfyUi(input);
    }
  } catch (error) {
    console.error(`[audioAdapter] ${provider} TTS failed, using mock fallback:`, error);
  }
  return await buildAudioFallback(input);
}

export function listAvailableAudioModels(): {
  provider: AudioProvider;
  models: AudioModelDescriptor[];
} {
  const provider: AudioProvider = isLocalComfyUiConfigured() ? 'local-comfyui' : 'mock';
  const configured = provider === 'local-comfyui';
  return {
    provider,
    models: [
      {
        id: 'tts_chatterbox_api',
        provider,
        language: 'English (multi-lang support depends on installed model)',
        label: 'ChatterBox TTS (local, MPS)',
        configured,
      },
    ],
  };
}

// =============================================================================
// Internal helpers
// =============================================================================

function runCliCapture(args: string[], timeoutMs: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const fullArgs = ['--dir', COMFYUI_SKILL_DIR, ...args];
    const child = spawn(COMFY_BIN, fullArgs, { stdio: ['ignore', 'pipe', 'pipe'] });
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
      reject(new Error(`failed to spawn ${COMFY_BIN}: ${err.message}`));
    });
    child.on('exit', (code) => {
      clearTimeout(timer);
      if (code === 0) return resolve(stdout);
      reject(new Error(`${COMFY_BIN} exited ${code}: ${stderr.slice(-500)}\nstdout: ${stdout.slice(-500)}`));
    });
  });
}

/**
 * Build a minimal silent WAV file with the given parameters.
 * Reference: http://soundfile.sapp.org/doc/WaveFormat/
 */
function makeSilentWav(sampleRate: number, channels: number, bitsPerSample: number, durationSec: number): Buffer {
  const byteRate = sampleRate * channels * bitsPerSample / 8;
  const blockAlign = channels * bitsPerSample / 8;
  const numSamples = Math.floor(sampleRate * durationSec);
  const dataSize = numSamples * blockAlign;
  const fileSize = 44 + dataSize;

  const buf = Buffer.alloc(fileSize);
  let o = 0;
  // RIFF header
  buf.write('RIFF', o); o += 4;
  buf.writeUInt32LE(fileSize - 8, o); o += 4;
  buf.write('WAVE', o); o += 4;
  // fmt chunk
  buf.write('fmt ', o); o += 4;
  buf.writeUInt32LE(16, o); o += 4; // chunk size
  buf.writeUInt16LE(1, o); o += 2;  // PCM
  buf.writeUInt16LE(channels, o); o += 2;
  buf.writeUInt32LE(sampleRate, o); o += 4;
  buf.writeUInt32LE(byteRate, o); o += 4;
  buf.writeUInt16LE(blockAlign, o); o += 2;
  buf.writeUInt16LE(bitsPerSample, o); o += 2;
  // data chunk
  buf.write('data', o); o += 4;
  buf.writeUInt32LE(dataSize, o); o += 4;
  // (sample data is already zero — silence)
  return buf;
}

// Avoid unused-warning when URL import isn't needed.
void URL;