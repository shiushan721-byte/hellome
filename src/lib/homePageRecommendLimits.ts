export const HOME_RECOMMEND_TITLE_MAX = 20;
export const HOME_RECOMMEND_DESC_MAX = 20;

export function clampHomeRecommendText(value: string, max: number): string {
  return Array.from(value).slice(0, max).join('');
}
