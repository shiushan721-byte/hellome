export const LOCALE_STORAGE_KEY = 'tf-locale';

export type Locale = 'zh' | 'en';

export function readStoredLocale(): Locale {
  if (typeof window === 'undefined') return 'zh';
  try {
    const v = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    if (v === 'en' || v === 'zh') return v;
  } catch {
    /* ignore */
  }
  return 'zh';
}
