import test from 'node:test';
import assert from 'node:assert/strict';
import { getDefaultHomePageConfig } from '../../src/lib/homePageConfigDefaults';
import { normalizeHomePageConfigPayload } from '../../src/lib/homePageConfigNormalize';
import { MARKET_CATEGORY_TABS } from '../../src/lib/agentMarketCategories';
import { normalizeHeroAds, HERO_AD_SLOT_COUNT } from '../../src/lib/homeHeroAds';
import { validateHomePageConfig } from '../../src/server/admin/homeConfigService';

test('normalizeHeroAds always returns four fixed slots', () => {
  const slots = normalizeHeroAds([{ id: 'custom', name: '旧广告', enabled: true, sortOrder: 0 } as never]);
  assert.equal(slots.length, HERO_AD_SLOT_COUNT);
  assert.equal(slots[0].id, 'hero-slot-1');
  assert.equal(slots[3].id, 'hero-slot-4');
});

test('normalizeHomePageConfigPayload migrates legacy showcase tabs', () => {
  const normalized = normalizeHomePageConfigPayload({
    heroAds: [],
    agentRecommendations: [],
    agentShowcase: {
      enabled: true,
      title: '展示',
      subtitle: '副标题',
      defaultAgentId: 'geo',
      tabs: [
        {
          id: 'legacy-tab',
          agentId: 'geo',
          tabLabel: 'GEO 智能体',
          shortName: 'GEO',
          enabled: true,
          sortOrder: 0,
          cta: { label: '立即使用', action: 'use_agent' },
        },
      ],
    },
  });

  assert.equal(normalized.agentShowcase.defaultTabKey, 'geo');
  assert.equal(normalized.agentShowcase.tabs.length, MARKET_CATEGORY_TABS.length);
  const geoTab = normalized.agentShowcase.tabs.find((tab) => tab.tabKey === 'geo');
  assert.equal(geoTab?.tabLabel, 'GEO 营销');
  assert.equal(geoTab?.agents[0]?.agentId, 'geo');
  assert.equal(geoTab?.agents[0]?.buttonLabel, '立即使用');
  assert.deepEqual(
    normalized.agentShowcase.tabs.map((tab) => tab.tabKey),
    MARKET_CATEGORY_TABS.map((cat) => cat.id),
  );
});

test('validateHomePageConfig checks recommendation title and description length', () => {
  const config = getDefaultHomePageConfig();
  const invalid = {
    ...config,
    agentRecommendations: config.agentRecommendations.map((item, index) =>
      index === 0
        ? { ...item, title: '这是一段超过二十个汉字的推荐位标题示例', description: '正常简介' }
        : item,
    ),
  };
  const errors = validateHomePageConfig(invalid);
  assert.ok(errors.some((error) => error.includes('标题不能超过')));
});

test('validateHomePageConfig checks default tab and hero ads', () => {
  const config = getDefaultHomePageConfig();
  assert.deepEqual(validateHomePageConfig(config), []);

  const invalid = {
    ...config,
    heroAds: config.heroAds.map((ad, index) =>
      index === 0 ? { ...ad, enabled: true, media: { type: 'image' as const, url: '' } } : ad,
    ),
    agentShowcase: { ...config.agentShowcase, defaultTabKey: 'missing' },
  };
  const errors = validateHomePageConfig(invalid);
  assert.ok(errors.some((error) => error.includes('上传图片')));
  assert.ok(errors.some((error) => error.includes('默认标签')));
});
