import type { HomePageOperationConfig } from '../types/homePageConfig';
import { getDefaultHomePageConfig } from './homePageConfigDefaults';

function toPublicConfig(): HomePageOperationConfig {
  const defaults = getDefaultHomePageConfig();
  return {
    ...defaults,
    version: 0,
    updatedAt: new Date().toISOString(),
  };
}

export async function fetchHomePageConfig(): Promise<HomePageOperationConfig> {
  try {
    const response = await fetch('/api/public/configs/home');
    const payload = (await response.json()) as {
      success: boolean;
      data?: HomePageOperationConfig;
    };
    if (!response.ok || !payload.success || !payload.data) {
      return toPublicConfig();
    }
    return payload.data;
  } catch {
    return toPublicConfig();
  }
}
