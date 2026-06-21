#!/usr/bin/env bash
# merge_video_audio.sh — 把一个 mp4 视频和一个音频文件合并成有声 mp4
#
# 用法:
#   bash scripts/audio_video/merge_video_audio.sh <video.mp4> <audio.flac> <output.mp4>
#
# 例:
#   bash scripts/audio_video/merge_video_audio.sh \
#     public/media/wan22_mp4_00001.mp4 \
#     public/media/audio-1782027430371.flac \
#     public/media/with_voiceover.mp4

set -euo pipefail
VIDEO="$1"
AUDIO="$2"
OUTPUT="$3"
[ -f "$VIDEO" ] || { echo "video not found: $VIDEO"; exit 1; }
[ -f "$AUDIO" ] || { echo "audio not found: $AUDIO"; exit 1; }

# 优先用 imageio-ffmpeg 自带的 ffmpeg（不需要 brew）
FFMPEG_BIN="$HOME/comfy/.venv/lib/python3.12/site-packages/imageio_ffmpeg/binaries/ffmpeg-macos-aarch64-v7.1"
if [ ! -x "$FFMPEG_BIN" ]; then
  # 备选：系统 ffmpeg
  FFMPEG_BIN="$(command -v ffmpeg)"
fi
[ -x "$FFMPEG_BIN" ] || { echo "ffmpeg not found"; exit 1; }
echo "using ffmpeg: $FFMPEG_BIN"

# 看音频时长
AUDIO_DUR=$("$FFMPEG_BIN" -i "$AUDIO" 2>&1 | grep "Duration" | head -1 | sed 's/.*Duration: \([^,]*\).*/\1/')
echo "audio duration: $AUDIO_DUR"

# 合并：复制视频流（不重编码），音频转 aac 192k
"$FFMPEG_BIN" -y -i "$VIDEO" -i "$AUDIO" \
    -c:v copy \
    -c:a aac -b:a 192k \
    -shortest \
    -movflags +faststart \
    "$OUTPUT" 2>&1 | tail -3

echo "✓ merged: $OUTPUT"
ls -lh "$OUTPUT"