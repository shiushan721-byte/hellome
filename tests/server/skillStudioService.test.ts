import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getSkill,
  getSkillExperienceConfig,
  updateSkill,
} from '../../src/server/skillStudioService';

test('getSkill returns normalized business frame by default', async () => {
  const skill = await getSkill('media-ugc');

  assert.equal(skill.latestVersion.businessFrame.goal.summary.length > 0, true);
  assert.equal(skill.latestVersion.businessFrame.executionPlan.stages.length > 0, true);
  assert.equal(skill.latestVersion.businessFrame.result.deliveryLabels.length > 0, true);
});

test('updateSkill persists business frame changes for creator and public experience', async () => {
  const skill = await getSkill('media-ugc');
  const updatedGoal = '先帮助客户明确业务目标，再生成视频交付结果。';
  const updatedPromise = '拿到可用于提案、试投放和客户确认的视频样片。';

  await updateSkill('creator-demo', skill.id, {
    name: skill.name,
    description: skill.description,
    latestVersion: {
      ...skill.latestVersion,
      businessFrame: {
        ...skill.latestVersion.businessFrame,
        goal: {
          ...skill.latestVersion.businessFrame.goal,
          summary: updatedGoal,
          scenarios: ['产品推广', '门店宣传', '设备演示'],
        },
        result: {
          ...skill.latestVersion.businessFrame.result,
          promiseLine: updatedPromise,
          deliveryLabels: ['9:16', '提案样片', '可复审'],
        },
      },
    },
  });

  const reloaded = await getSkill(skill.id);
  const experience = await getSkillExperienceConfig('media-ugc');

  assert.equal(reloaded.latestVersion.businessFrame.goal.summary, updatedGoal);
  assert.deepEqual(reloaded.latestVersion.businessFrame.goal.scenarios, [
    '产品推广',
    '门店宣传',
    '设备演示',
  ]);
  assert.equal(experience.businessFrame.goal.summary, updatedGoal);
  assert.equal(experience.businessFrame.result.promiseLine, updatedPromise);
  assert.deepEqual(experience.businessFrame.result.deliveryLabels, ['9:16', '提案样片', '可复审']);
});
