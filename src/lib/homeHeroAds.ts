import type { HomeHeroAdConfig } from '../types/homePageConfig';

export const HERO_AD_SLOT_COUNT = 4;

export const HERO_AD_SLOT_IDS = ['hero-slot-1', 'hero-slot-2', 'hero-slot-3', 'hero-slot-4'] as const;

export type HeroAdSlotId = (typeof HERO_AD_SLOT_IDS)[number];

/** 广告位 1：16:9 主 Banner；广告位 2–4：1:1 方图 */
export const HERO_AD_PRIMARY_ASPECT_RATIO = 16 / 9;
export const HERO_AD_SECONDARY_ASPECT_RATIO = 1;

/** @deprecated 使用 getHeroAdAspectRatio */
export const HERO_AD_ASPECT_RATIO = HERO_AD_PRIMARY_ASPECT_RATIO;

export const HERO_AD_PRIMARY_IMAGE_SIZE_HINT = '1920×1080（16:9）';
export const HERO_AD_SECONDARY_IMAGE_SIZE_HINT = '1080×1080（1:1）';

/** @deprecated 使用 getHeroAdImageSizeHint */
export const HERO_AD_IMAGE_SIZE_HINT = HERO_AD_PRIMARY_IMAGE_SIZE_HINT;

export function getHeroAdSlotIndex(ad: Pick<HomeHeroAdConfig, 'id' | 'sortOrder'>) {
  const byId = HERO_AD_SLOT_IDS.indexOf(ad.id as HeroAdSlotId);
  if (byId >= 0) return byId;
  return Math.min(Math.max(ad.sortOrder ?? 0, 0), HERO_AD_SLOT_COUNT - 1);
}

export function isPrimaryHeroAdSlot(ad: Pick<HomeHeroAdConfig, 'id' | 'sortOrder'>) {
  return getHeroAdSlotIndex(ad) === 0;
}

export function getHeroAdAspectRatio(ad: Pick<HomeHeroAdConfig, 'id' | 'sortOrder'>) {
  return isPrimaryHeroAdSlot(ad) ? HERO_AD_PRIMARY_ASPECT_RATIO : HERO_AD_SECONDARY_ASPECT_RATIO;
}

export function getHeroAdImageSizeHint(ad: Pick<HomeHeroAdConfig, 'id' | 'sortOrder'>) {
  return isPrimaryHeroAdSlot(ad) ? HERO_AD_PRIMARY_IMAGE_SIZE_HINT : HERO_AD_SECONDARY_IMAGE_SIZE_HINT;
}

export function createDefaultHeroSlot(index: number): HomeHeroAdConfig {
  return {
    id: HERO_AD_SLOT_IDS[index],
    name: `首屏广告位 ${index + 1}`,
    enabled: false,
    sortOrder: index,
    brandText: '',
    title: '',
    subtitle: '',
    primaryButton: { label: '立即使用', action: 'login' },
    media: { type: 'image', url: '' },
  };
}

export function normalizeHeroAds(raw: unknown): HomeHeroAdConfig[] {
  const defaults = HERO_AD_SLOT_IDS.map((_, index) => createDefaultHeroSlot(index));
  if (!Array.isArray(raw)) return defaults;

  const items = raw as HomeHeroAdConfig[];

  return HERO_AD_SLOT_IDS.map((slotId, index) => {
    const existing =
      items.find((item) => item.id === slotId) ??
      items.find((item) => item.sortOrder === index) ??
      items[index];

    if (!existing) return defaults[index];

    return {
      ...defaults[index],
      ...existing,
      id: slotId,
      name: existing.name?.trim() || defaults[index].name,
      sortOrder: index,
      media: {
        type: 'image' as const,
        url: existing.media?.url ?? '',
        posterUrl: existing.media?.posterUrl,
      },
    };
  });
}

export function heroAdHasImage(ad: HomeHeroAdConfig) {
  return Boolean(ad.media?.url?.trim());
}
