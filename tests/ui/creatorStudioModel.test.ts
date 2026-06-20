import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildCreateHeroTitle,
  buildDebugInputFromBusiness,
  buildEditBusinessSentence,
  buildEngineSteps,
} from '../../src/lib/creatorStudio';

test('buildCreateHeroTitle reflects business-first creation sentence', () => {
  assert.equal(buildCreateHeroTitle('制造业企业', '设备演示'), '即将为你生成：制造业企业的设备演示视频智能体');
});

test('buildEditBusinessSentence reflects current business positioning', () => {
  assert.equal(buildEditBusinessSentence('本地门店', '门店宣传'), '当前这个视频智能体服务于本地门店，主要用于门店宣传');
});

test('buildEngineSteps adds scenario-specific pipeline step', () => {
  assert.deepEqual(buildEngineSteps('设备演示'), [
    '解析业务需求',
    '匹配演示模板',
    '生成脚本与分镜',
    '调用视频模型',
    '整理交付包',
  ]);
});

test('buildDebugInputFromBusiness maps business context to studio debug input', () => {
  const input = buildDebugInputFromBusiness({
    customerType: '本地门店',
    scenario: '门店宣传',
    instruction: '更强调空间感和品牌感',
  });

  assert.equal(input.platform, '视频号');
  assert.equal(input.effectGoal, '更像带货转化');
  assert.equal(input.referenceDirection, '更强调空间感和品牌感');
});
