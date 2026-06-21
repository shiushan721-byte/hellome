import test from 'node:test';
import assert from 'node:assert/strict';
import { buildTaskShowcaseViewModel } from '../../src/components/app/tasks/TaskShowcaseStage';

test('buildTaskShowcaseViewModel returns recovery CTA for interrupted task', () => {
  const viewModel = buildTaskShowcaseViewModel({
    status: 'failed',
    recoveryState: {
      runState: 'interrupted',
      pauseReasonMessage: '执行中断，可从上一步恢复',
      resumeMode: 'continue',
      recoverable: true,
    },
  });

  assert.equal(viewModel.primaryActionLabel, '从这里继续');
  assert.equal(viewModel.headline, '生成中断，可从当前阶段恢复');
});

test('buildTaskShowcaseViewModel uses result-first copy for completed media task', () => {
  const viewModel = buildTaskShowcaseViewModel({
    status: 'completed',
    artifacts: [
      { id: 'video', type: 'video', label: '样片视频', fileName: 'sample-video.webm', mimeType: 'video/webm', url: '/media/sample-video.webm' },
      { id: 'audio', type: 'audio', label: 'AI 配音音轨', fileName: 'audio-mock.wav', mimeType: 'audio/wav', url: '/media/audio-mock.wav' },
    ],
    understanding: {
      targetAudience: '通勤白领',
      videoStyle: '更像真人种草',
      coreAngle: '轻薄防晒通勤不闷',
      outputGoal: '抖音 10 秒 9:16 UGC 样片',
      draftScript: 'demo',
    },
    routePlan: {
      id: 'ugc_video_factory',
      label: 'UGC Video Factory',
      providerHint: 'Generative-Media-Skills',
      reason: 'demo',
    },
    input: {
      sellingPoint: '轻薄防晒',
      platform: '抖音',
      effectGoal: '更像真人种草',
    },
  });

  assert.equal(viewModel.headline, '正式结果已交付');
  assert.equal(viewModel.heroMeta, '主视频已生成，附件也已整理完成。');
});
