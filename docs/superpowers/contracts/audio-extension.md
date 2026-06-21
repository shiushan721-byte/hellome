# 音频 / 配音 / 唇同步 扩展契约

> **TL;DR**：当前 6 个视频智能体**已有 AI 配音** ✅。背景音乐 / 唇同步 / 字幕待后续。
>
> 本文档是契约补充 + 扩展路线图。Phase A1（TTS）已由 skill 团队实现并跑通；后续 Phase（A2 唇同步 / A3 字幕 / B BGM）由对接方根据本契约自行实现。

---

## 0. Phase A1 状态：✅ TTS 已完成

| 项目 | 状态 |
|---|---|
| ComfyUI 节点 `diodiogod/TTS-Audio-Suite`（★1043）| ✅ 已装 |
| **18 个 TTS 引擎** | ✅ 全部注册（ChatterBox / F5-TTS / IndexTTS / CosyVoice / Qwen3-TTS / MOSS / Echo / VibeVoice / Dots 等）|
| 缺依赖 `s3tokenizer` + `diffusers` | ✅ 已装（install.py 用 `--no-deps` 跳过）|
| Workflow `tts_chatterbox_api` | ✅ 注册到 comfyui-skill (`data/local/tts_chatterbox_api/`) |
| ChatterBox 模型权重 | ✅ 自动下载到 `~/comfy/ComfyUI/models/TTS/chatterbox/English/` |
| Server-side adapter `generateAudio()` | ✅ `src/server/adapters/audioAdapter.ts` |
| `npm run lint` | ✅ exit 0 |
| 端到端 smoke test | ✅ 7 秒生成 188 KB FLAC（vendor=ChatterBox 真实生成）|

### ⚠️ 持久化警告

`install.py` 默认用 `--no-deps` 安装 `s3tokenizer` 和 `diffusers`（避免依赖冲突）。
如果 **ComfyUI venv 重建**（如重装 comfy-cli、迁移机器），必须手动重装：

```bash
~/comfy/.venv/bin/python -m pip install s3tokenizer diffusers
```

否则 ChatterBox 引擎会**静默 fallback 到 mock**（生成损坏 FLAC，sample_rate=98304000Hz 异常值）。

---

## 1. 现状

### ✅ 已完成

- Z-Image-Turbo（文生图）
- Wan 2.2 5B（文生视频 + 图生视频）
- LTX-Video 2B（文生视频）
- Qwen-Image-Edit（图像编辑）
- **AI 配音 — ChatterBox TTS**（MPS 友好，206 KB FLAC/15-30 秒语音）

### ❌ 仍待扩展

- 背景音乐（MusicGen / Stable Audio Open）
- 唇同步（MuseTalk / LatentSync）
- 字幕生成（Faster-Whisper）
- 音频混合（FFmpeg）

---

## 2. Phase A1 已落地的接口契约

### 2.1 新增端点

**所有 audio 调用都走 `modelAdapter.generateAudio()`**，**不增加新 HTTP 端点**（避免 API 表面爆炸）。对接方从 TS 直接调用，或通过 ugcTaskService 间接调用。

```typescript
// src/server/adapters/audioAdapter.ts
import type { AudioProvider } from '../adapters/audioAdapter';

export interface GenerateAudioInput {
  /** Required. The text to synthesize. */
  prompt: string;
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
  url: string;                              // 'public/media/audio-XXX.flac'
  mimeType: 'audio/wav' | 'audio/flac' | 'audio/mpeg';
  provider: 'local-comfyui' | 'mock';
  model: string;                            // 'tts_chatterbox_api'
  workflow?: string;
  promptId?: string;
  elapsedMs?: number;
  durationMs?: number;
  sampleRate?: number;
  channels?: number;
  source: 'provider' | 'fallback';          // ← 关键：是否真实生成
  sizeBytes?: number;
}

export async function generateAudio(input: GenerateAudioInput): Promise<GenerateAudioOutput>;

export function listAvailableAudioModels(): {
  provider: 'local-comfyui' | 'mock';
  models: AudioModelDescriptor[];
};
```

### 2.2 Provider 行为

| Provider | 触发条件 | source 返回 |
|---|---|---|
| `local-comfyui` | `comfyui-skill` CLI 可执行 + `tts_chatterbox_api` workflow 已注册 | `'provider'` |
| `mock` | COMFYUI_SKILL_CLI 不可达 / workflow 失败 | `'fallback'`（1 秒静音 WAV）|

环境变量：
```bash
COMFYUI_SKILL_CLI=/Users/feihong/comfy/.venv/bin/comfyui-skill   # 默认
COMFYUI_SKILL_DIR=/Users/feihong/Documents/hellome/.comfyui-skill # 默认
COMFYUI_SKILL_VENV_PYTHON=/Users/feihong/comfy/.venv/bin/python    # 默认
MEDIA_OUTPUT_DIR=./public/media                                # 默认
```

### 2.3 5 大类前台外显（Phase A1 新增状态）

在 `taskStateMachine` 增加第 6 个外显态：
- **「配音合成中」**：调用 `generateAudio()` 期间显示，自动推进 → `auto-running`

| 前台 6 大类 | TaskStatus | Trigger |
|---|---|---|
| 待开始 | draft / queued | - |
| 自动推进中 | running + 当前 stage.kind === 'auto' | - |
| **配音合成中** | running + currentStage.kind === 'audio_synthesize' | **新增** |
| 待确认 | running + currentStage.kind === 'confirm' | - |
| 已中断待恢复 | failed + recoverable | - |
| 已完成 | completed | - |

### 2.4 artifact 增加 1 个

```typescript
{ type: 'audio', label: '配音音频', fileName: 'voiceover.flac', mimeType: 'audio/flac', url?: string }
```

**位置**：紧接 `script.md` 之后、`cover-frame.png` 之前。

---

## 3. SkillBusinessFrame 扩展（业务侧）

### 3.1 executionPlan.stages 增加阶段（推荐默认）

在当前 5 默认阶段（理解业务 / 组织交付方式 / 生成前台草稿 / 优化结果表达 / 发布智能体）**之前**插入 `audio_synthesize`：

```json
{
  "executionPlan": {
    "stages": [
      { "id": "understand", "label": "理解业务", "kind": "auto" },
      { "id": "structure", "label": "组织交付方式", "kind": "auto" },
      { "id": "script_draft", "label": "生成脚本", "kind": "auto" },
      { "id": "audio_synthesize", "label": "配音合成", "kind": "auto" },   // ← 新增
      { "id": "front_end_draft", "label": "生成前台草稿", "kind": "auto" },
      { "id": "refine", "label": "优化结果表达", "kind": "auto" },
      { "id": "publish", "label": "发布智能体", "kind": "auto" }
    ]
  }
}
```

**注意**：`audio_synthesize` 必须在 `front_end_draft` 之前 —— 因为前台草稿会显示「有声视频」预览。

### 3.2 result.deliveryLabels 升级

```json
"deliveryLabels": [
  "30-60 秒视频",
  "AI 配音版",          // ← 新增
  "基础字幕版",
  "横版 / 竖版"
]
```

### 3.3 result.promiseLine 可选升级

```json
"promiseLine": "为消费品商家提供带 AI 配音的产品种草视频表达"   // 加「带 AI 配音」
```

### 3.4 budget 增加字段（可选）

```json
"budget": {
  ...
  "audio": {
    "defaultVoice": "female-young",        // 默认音色 ID
    "voiceCloning": false,                 // 是否允许用户上传参考音克隆
    "defaultLanguage": "English"           // 创作者可选 "Chinese"
  }
}
```

---

## 4. ugcTaskService 集成（待对接方做）

`step 4 video_rendering` 当前**只生成视频 + 封面**。需要新增 `step 4.5 audio_synthesis`：

```typescript
// ugcTaskService.ts step 4.5 (illustrative, not implemented yet)
const scriptMd = task.artifacts.find(a => a.id === `${taskId}-script`)?.url;
// ...extract text from script...
const audio = await generateAudio({
  prompt: scriptText,
  language: 'English',
  seed: 42,
  timeoutMs: 60_000,
});
task.artifacts.push({
  id: `${taskId}-voiceover`,
  type: 'audio',
  label: '配音音频',
  fileName: path.basename(audio.url),
  mimeType: audio.mimeType,
  url: audio.url,
});
```

事件流：
```
'已生成视频' → '配音合成中...' → '已生成配音（local-comfyui/tts_chatterbox_api · 7s · source=provider）' → '整理交付'
```

---

## 5. 前端 UI 更新（待对接方做）

### 5.1 右栏展示位

设计稿 `S0-S5` 主舞台卡新增「AI 配音」徽章（`OutcomeBar` 内）。

### 5.2 artifact 列表

**当前**：
```
[video] sample-video.mp4
[image] cover-frame.png
[script] script.md
[report] delivery-summary.pdf
```

**Phase A1 之后**：
```
[video] sample-video.mp4
[audio] voiceover.flac            ← 新增
[image] cover-frame.png
[script] script.md
[report] delivery-summary.pdf
```

### 5.3 任务面板

新 phase 状态文字：
- 「正在配音合成...」
- 「配音完成（7 秒生成 188 KB）」
- 「配音失败，已用占位音轨」

---

## 6. Phase 后续路线图（待对接方按需实现）

### Phase A2：唇同步（4-6 周工作量）

**目标**：让视频嘴型跟音频对齐。

**推荐引擎**：LatentSync 1.6（ByteDance，ShmuelRonen/ComfyUI-LatentSyncWrapper ★951）
**注意**：⚠️ 该节点 README 明确说「on Windows and WSL 2.0」，**Mac Apple Silicon 兼容性未验证**。需要 `s3tokenizer`/`diffusers`/`onnxruntime` 等额外依赖。

**workflow**：`workflows/lip_sync.json`（输入：视频 mp4 + 音频 wav → 输出：带口型视频 mp4）

**新增 executionPlan.stages**：
```json
{ "id": "lip_sync", "label": "唇同步合成", "kind": "confirm" }   // 高成本 + 方向锁死 → 需用户确认
```

**新增 artifact**：
```
[video] final-video.mp4    // 带口型的最终视频
```

### Phase A3：字幕（1-2 天）

**推荐引擎**：Faster-Whisper（本地，Apache-2.0）+ Hermes SRT 节点

**workflow**：`workflows/subtitle.json`（输入：音频 → 输出：SRT）

### Phase B：背景音乐（2-3 天）

**推荐引擎**：MusicGen（Meta，Apache-2.0）或 Stable Audio Open

**workflow**：`workflows/audio_bgm.json`（输入：prompt + 时长 → 输出：mp3）

**新增 executionPlan.stages**：
```json
{ "id": "audio_bgm", "label": "背景音乐生成", "kind": "auto" },
{ "id": "audio_mix", "label": "音频混合", "kind": "auto" }
```

### Phase C：音频混合（1 天）

**推荐引擎**：FFmpeg 节点（ComfyUI 已装 `VHS_VideoCombine` 可做）

**workflow**：`workflows/audio_mix.json`（voiceover + bgm → mixed.wav）

---

## 7. 已注册的 workflow 清单

| Workflow ID | 类型 | 文件 |
|---|---|---|
| `tts_chatterbox_api` | TTS (ChatterBox) | `/Users/feihong/Documents/hellome/.comfyui-skill/workflows/tts_chatterbox_api.json` |
| `txt2img` | 图像（Z-Image）| （已存在）|
| `txt2video` | 视频（LTX）| （已存在）|
| `wan22_t2v` | 视频（Wan 2.2）| （已存在）|
| `wan22_i2v` | 图生视频（Wan 2.2）| （已存在）|
| `qwen_edit` | 图像编辑（Qwen）| （已存在）|

---

## 8. 文件清单（本 Phase A1 交付）

| 文件 | 路径 | 内容 |
|---|---|---|
| ComfyUI 节点 | `~/comfy/ComfyUI/custom_nodes/TTS-Audio-Suite/` | 18 个 TTS 引擎 |
| TTS workflow | `~/comfy/ComfyUI/workflows/tts_chatterbox_api.json` | API 格式 |
| comfyui-skill 注册 | `~/Documents/hellome/.comfyui-skill/data/local/tts_chatterbox_api/` | workflow + schema |
| TS adapter | `~/Documents/hellome/src/server/adapters/audioAdapter.ts` | generateAudio() + listAvailableAudioModels() |
| 测试脚本 | `~/Documents/hellome/scripts/test_audio_adapter.ts` | 端到端验证 |

---

## 9. 对接方 Checklist（按顺序）

1. **更新 `buildDefaultBusinessFrame` / `buildOrchestratorDefaultBusinessFrame`**：在 stages 里插入 `audio_synthesize`，deliveryLabels 加 `'AI 配音版'`
2. **更新 `UgcTaskArtifact.type` 类型**：添加 `'audio'`
3. **更新 `ugcTaskService.ts`**：step 4 后插 step 4.5 调 `generateAudio()`
4. **更新前端右栏**：OutcomeBar 加「AI 配音」徽章，artifact 列表显示 audio 类型
5. **更新前端任务面板**：phase 文字加「配音合成中」

---

## 10. 验证

```bash
# 1. lint 必须通过
cd ~/Documents/hellome
npm run lint  # → exit 0

# 2. audioAdapter 端到端
npx tsx scripts/test_audio_adapter.ts
# → { source: 'provider', sizeBytes: 188451, ... }

# 3. comfyui-skill 路径
~/comfy/.venv/bin/comfyui-skill --dir ~/Documents/hellome/.comfyui-skill \
  --json run tts_chatterbox_api \
  --args '{"prompt":"hello", "language":"English"}'
# → {"status":"success","outputs":[{"local_path":"...flac"}]}

# 4. 真实音频标记
grep -c "ChatterBox" public/media/audio-*.flac
# → ≥ 1（FLAC vendor tag 含 ChatterBox 字样）

# 5. mock fallback 检测
grep -c "98304000" public/media/audio-*.flac
# → 0（异常 sample_rate=98304000 是 mock 标志；真实 ChatterBox 输出没这个值）
```

---

## 11. 关键修复（持久化知识）

**`s3tokenizer` + `diffusers` 是 ChatterBox 引擎必需依赖**：
- `install.py` 默认用 `--no-deps` 跳过（避免版本冲突）
- 必须**手动 pip install**：
  ```bash
  ~/comfy/.venv/bin/python -m pip install s3tokenizer diffusers
  ```
- 加进 `requirements.txt` 或 setup 脚本，避免 venv 重建后丢失

如果没有装，`generateAudio()` 会**静默 fallback 到 mock**（FLAC 看着像文件但实际是损坏占位）：
- ✅ 文件存在
- ❌ `sample_rate=98304000` 异常值（正常是 16/24/44.1 kHz）
- ❌ FLAC 没有 "ChatterBox" vendor tag
- ❌ 播放出来是噪音或静音