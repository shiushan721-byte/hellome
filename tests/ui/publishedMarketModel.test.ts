import test from 'node:test';
import assert from 'node:assert/strict';
import type { AgentMarketCard } from '../../src/types/agentsPage';
import type { PublishedMarketAgent } from '../../src/lib/skillStudioApi';
import { buildWorkbenchShowcaseVideo, mergePublishedMarketAgents } from '../../src/lib/publishedMarketModel';
import type { SkillExperienceConfig } from '../../src/types/skills';

test('mergePublishedMarketAgents overrides the static media-seeding card', () => {
  const staticCards: AgentMarketCard[] = [
    {
      id: 'media-seeding',
      name: '静态名称',
      description: '静态描述',
      category: 'content',
      tokenRange: '1-2 Token',
      estimatedTokenMin: 1,
      estimatedTokenMax: 2,
      creator: 'HelloMe',
      creatorAvatar: 'H',
      heat: '1',
      likes: '1',
      iconSrc: '/icon.png',
      status: 'available',
    },
  ];
  const published: PublishedMarketAgent[] = [
    {
      agentId: 'media-seeding',
      skillId: 'media-seeding',
      name: '发布名称',
      description: 'published description',
      status: 'published',
      entryLabel: '开始做种草视频',
      tokenRange: '3-4 Token',
      category: 'content',
      showcaseVideo: {
        title: '案例',
        summary: '摘要',
        videoUrl: '/media/showcase/media-seeding-sample.mp4',
      },
    },
  ];

  const result = mergePublishedMarketAgents(staticCards, published);
  assert.equal(result[0].name, '发布名称');
  assert.equal(result[0].description, 'published description');
  assert.equal(result[0].tokenRange, '3-4 Token');
});

test('buildWorkbenchShowcaseVideo returns published showcase video when available', () => {
  const experience = {
    id: 'media-seeding',
    name: '新品种草视频',
    title: '新品种草视频',
    inputConfig: {
      sellingPointLabel: '',
      sellingPointPlaceholder: '',
      productImageHint: '',
      talentImageHint: '',
      referenceUrlHint: '',
    },
    understandingConfig: {
      prompt: '',
      confirmationMessage: '',
    },
    executionConfig: {
      mode: 'backend_silent',
      debugMode: 'local_debug',
      videoProvider: 'provider',
      requireConfirmation: true,
      routingMode: 'auto',
      defaultPlanId: 'ugc_video_factory',
      availablePlans: [],
      modelSelection: {
        imageModel: 'image',
        videoModel: 'video',
        audioModel: 'audio',
        audioEnabled: true,
      },
    },
    businessFrame: {
      goal: { summary: '', scenarios: [] },
      budget: { defaultTier: 'standard', confirmationRequired: true, notes: '' },
      executionPlan: { stages: [] },
      result: {
        promiseLine: '',
        deliveryLabels: [],
        showcaseHint: '',
        showcaseVideo: {
          title: '通勤防晒真人种草样片',
          summary: '围绕轻薄防晒与通勤场景的 10 秒真人种草案例。',
          videoUrl: '/media/showcase/media-seeding-sample.mp4',
        },
      },
    },
    artifactConfig: [],
  } satisfies SkillExperienceConfig;

  const showcase = buildWorkbenchShowcaseVideo(experience);
  assert.ok(showcase);
  assert.equal(showcase?.videoUrl, '/media/showcase/media-seeding-sample.mp4');
});
