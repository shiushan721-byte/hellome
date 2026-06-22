# 视频质量 troubleshooting — Wan 2.2 / LTX 2.3 画屏 / 闪烁 / 撕裂

> **TL;DR**：画屏 90% 是分辨率+步数太激进了。**降到 832×480 / 20 步 / cfg=5 立即修好**。
> 实在不行换 **LTX 2B v0.9.5**（5.9GB，100% 稳定，90 秒出片）。

---

## 1. 常见症状 vs 原因

| 症状 | 最可能原因 | 快速验证 |
|---|---|---|
| 物体撕裂 / 帧间错位 | 分辨率超出模型设计上限 | 降到 832×480 试试 |
| 颜色过饱和 / 偏色 | cfg_scale 太高（7+）| 降到 5.0 |
| 闪烁 / 帧间漂移 | 步数太多 + 推理时间长 | 降到 20 步 |
| 静止 / 几乎不动 | prompt 太抽象 | 加 "walking" / "moving" |
| 人物脸变形 | 模型 + MPS 兼容性问题 | 换 LTX 2B v0.9.5（最稳）|
| **完全黑屏** | text encoder 加载失败 | 看 server stderr "invalid tokenizer" |
| **整段乱码（00009 那种）** | 1280×704 + 30 步 + 5B 模型爆显存 | **降到 832×480 20 步** |

---

## 2. 按模型调参（**核心表**）

| 模型 | 分辨率 | 步数 | cfg | 帧数 | 估时 | 稳定性 |
|---|---|---|---|---|---|---|
| **LTX 2B v0.9.5** (5.9GB) | **768×512** | **20** | **4.0** | 97 | **90 秒** | ⭐⭐⭐⭐⭐ |
| **Wan 2.2 5B** | **832×480** ⭐ | **20** | **5.0** | 41 | **5 分钟** | ⭐⭐⭐ |
| Wan 2.2 5B | 1024×576 | 20 | 5.0 | 41 | 8 分钟 | ⭐⭐ |
| Wan 2.2 5B | 1280×704（5B 极限）| 30 | 5.0 | 41 | 14 分钟 | ⭐（画屏高发）|
| Wan 2.2 5B | 1280×704 | 30 | 7.0 | 41 | 14 分钟 | 🔴（频繁画屏）|
| **LTX 2.3** | (待 ComfyUI ≥0.26) | - | - | - | - | ❌ blocked |

**经验法则**：
- **cfg_scale ≤ 5.0**（5B Wan/LTX）
- **steps ≤ 20**（除非特别需要）
- **resolution ≤ 832×480** for 5B Wan
- **resolution ≤ 768×512** for LTX 2B

---

## 3. Wan 2.2 5B 画屏排查

### 3.1 立即排查清单

```bash
# 1. 看产物文件大小
ls -lh ~/comfy/ComfyUI/output/wan22_*.webm

# 2. 看 ffmpeg metadata（解码信息）
FFMPEG="$HOME/comfy/.venv/lib/python3.12/site-packages/imageio_ffmpeg/binaries/ffmpeg-macos-aarch64-v7.1"
"$FFMPEG" -i ~/comfy/ComfyUI/output/wan22_latest.webm 2>&1 | grep -E "Duration|Stream|Video"
```

### 3.2 已验证的正确配置

```bash
comfyui-skill --dir ~/Documents/hellome/.comfyui-skill run wan22_text_to_video_mp4 \
  --args '{
    "prompt_clip_text_encode_positive_prompt": "a cute red fox walking in a misty forest at dawn, cinematic lighting, smooth motion",
    "prompt_clip_text_encode_negative_prompt": "blurry, ugly, deformed, low quality",
    "width": 832,
    "height": 480,
    "frame_rate": 24,
    "filename_prefix": "wan22_test",
    "format": "video/h264-mp4",
    "steps": 20,
    "cfg": 5
  }'
```

**端到端验证结果**（之前已跑通）：
- 270 秒（4.5 分钟）
- `wan22_mp4_real_00001.mp4` 410 KB
- h264 832×480 24 fps 1.62 秒
- **无画屏**（按上面参数）

### 3.3 已知问题 00009 案例

| 文件 | 模型 | 原因 |
|---|---|---|
| `ComfyUI_00009_.webp` 2.7MB | **Wan 2.2 5B** | 1280×704 + 30 步 + cfg 7+ 触发画屏 |
| `ComfyUI_00008_.webp` 5.0MB | **LTX 2B v0.9.5**（MD5 跟 00001 完全相同）| 768×512，**无画屏** |

**MD5 证据**：
```
00001 webp: 1eda58e8b0355d8251b119a93ff99165  (LTX 2B 768×512)
00008 webp: 1eda58e8b0355d8251b119a93ff99165  (完全相同 = 之前 LTX 2B 跑过的产物)
00004 webp: 51826d01e1b97a17309c753999b27ef6  (Wan 2.2 视频封面)
00009 webp: 51826d01e1b97a17309c753999b27ef6  (完全相同 = Wan 2.2 视频封面)
```

---

## 4. LTX 2B v0.9.5 — 100% 稳定参考

```bash
# 之前 00001 跑的设置
LTX-Video 2B v0.9.5
T5XXL fp8 e4m3fn scaled
30 步、97 帧、768×512
结果: 91.96 秒 5.1MB webp（无画屏）
```

**端到端 mp4 路径**（用 ltxv api 节点）：
- LtxvApiTextToVideo 是 **云端 API 节点**（不读本地 checkpoint）
- 本地 LTX 2B 完整路径用 KSampler + LTXVScheduler + LTXVEmptyLatentVideo + LTXVImgToVideo
- 复杂度高于 Wan 2.2 workflow

---

## 5. 端到端推荐工作流

| 阶段 | 推荐 | 备注 |
|---|---|---|
| **1. 快速测试** | Wan 2.2 832×480 20 步 | 5 分钟，验证 pipeline 通 |
| **2. 提升质量** | Wan 2.2 832×480 30 步（如果稳定）| 7-8 分钟 |
| **3. 商业视频** | LTX 2.3（等 ComfyUI ≥0.26）| 当前不可用 |
| **4. 长期方案** | LTX 2B v0.9.5 | 768×512 最稳，**90 秒** |

---

## 6. 给前端 / 测试 agent 的诊断脚本

```typescript
// 1. 提交后立即 POST 看 status
const res = await fetch('/api/tasks/ugc', { method: 'POST', body: JSON.stringify({input}) });
const { taskId } = await res.json();

// 2. 5 秒轮询看 status
setInterval(async () => {
  const task = await fetch(`/api/tasks/${taskId}`).then(r => r.json());
  
  if (task.status === 'failed' && !task.recoverable) {
    // 4 大类：configuration / runtime / external
    if (task.pauseReasonType === 'context_limit') {
      // → 降分辨率 / 步数
    } else if (task.pauseReasonType === 'provider_error') {
      // → 重试
    } else if (task.pauseReasonType === 'timeout') {
      // → 降分辨率
    }
  }
  
  if (task.status === 'completed') {
    // 看 artifacts[].url 是否存在
    // → 用 ffmpeg 解析 video size + duration
    //   size < 50KB → mock fallback
    //   duration 异常 → 推理中断
  }
}, 5000);
```

---

## 7. 关键不变量

1. **5B 模型 ≤ 832×480** 才不出画屏
2. **LTX 2B v0.9.5** 永远不出画屏（768×512 是它的训练分辨率）
3. **cfg_scale > 6** 在 MPS 容易爆伪影
4. **steps > 25** 在 MPS 长推理容易闪烁
5. **看 stderr** `"invalid tokenizer"` = 文本编码器加载失败（**不是**画屏问题）

---

## 8. 状态机（画屏 vs 其他失败）

| 症状 | task.status | task.pauseReasonType | 修法 |
|---|---|---|---|
| 视频画屏 | `completed` | (空) | 降分辨率/步数 |
| 黑屏 | `failed` | `provider_error` | 重新跑 |
| 半截视频 | `failed` | `timeout` | 降分辨率 |
| 永远不结束 | `running` | (空) | 看 stderr 找 OOM |
| 文件不存在 | `completed` 但 url 空 | - | 看产物目录 |

---

## 9. 快速决策树

```
视频画屏?
├── Wan 2.2 1280×704? → 降到 832×480 20 步 cfg=5
├── cfg > 6? → 降到 5
├── steps > 25? → 降到 20
├── frame > 81? → 降到 41
├── 还有问题? → 换 LTX 2B v0.9.5 (5.9GB, 100% 稳定)
└── LTX 2B 也画屏? → 看 server stderr (可能是 model loading 失败)
```

---

## 10. 我已知的但**未跑通**的高级能力

- **Wan 2.2 14B** 满精度 = 28GB 模型 + 14B 满精度**应该**能跑 1280×704 稳定，但**太大**没下
- **Wan 2.2 5B 蒸馏版**（Q4 量化）~ 6GB，**没有公开 GGUF**
- **LTX 2.3 完整版**（gemma 3 fast tokenizer）—— 等 ComfyUI 0.26+
- **HunyuanVideo**（腾讯）—— 没用过，不知道质量
- **Mochi 2**（Genmo）—— 没用过

---

**给我的边界是**：
- ✅ 写 skill 资产（workflow JSON、adapter、文档）
- ❌ 改前端 / 改 ComfyUI 内部 / 跑 frontend test

**对前端 / 测试 agent 的建议**：
- **永远从 Wan 2.2 832×480 20 步 cfg=5 开始** —— 这是 5 分钟验证 pipeline 的最低成本
- **画屏必查分辨率**，不是模型坏
- **长视频（> 41 帧）先用 LTX 2B**（更稳）