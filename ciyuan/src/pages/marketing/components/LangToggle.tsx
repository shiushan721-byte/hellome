import type { Locale } from '../i18n/constants';

type LangToggleVariant = 'onLight' | 'onDark';

export function LangToggle({
  locale,
  setLocale,
  label,
  variant = 'onLight',
}: {
  locale: Locale;
  setLocale: (next: Locale) => void;
  label: string;
  variant?: LangToggleVariant;
}) {
  const active =
    variant === 'onDark' ? 'font-medium text-white' : 'font-semibold text-[#111827]';
  const idle =
    variant === 'onDark'
      ? 'font-medium text-white/60'
      : 'font-medium text-[#6b7280]';
  const slashClass = variant === 'onDark' ? 'select-none text-white/45' : 'select-none text-[#9ca3af]';
  const shell =
    variant === 'onDark'
      ? '-mx-1 -my-0.5 rounded-lg px-2 py-1.5 text-left outline-none transition-colors hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white/35'
      : '-mx-1 -my-0.5 rounded-lg px-2 py-1.5 text-left outline-none transition-colors hover:bg-[#ececef] focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/40';

  return (
    <button
      type="button"
      className={`inline-flex items-center gap-0.5 text-sm tabular-nums ${shell}`}
      aria-label={label}
      onClick={() => setLocale(locale === 'zh' ? 'en' : 'zh')}
    >
      <span className={locale === 'zh' ? active : idle}>中</span>
      <span className={slashClass} aria-hidden>
        /
      </span>
      <span className={locale === 'en' ? active : idle}>En</span>
    </button>
  );
}
