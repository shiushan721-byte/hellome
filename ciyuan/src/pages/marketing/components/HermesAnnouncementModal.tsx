import { useEffect } from 'react';
import { useT } from '../i18n/LocaleProvider';

const HERMES_BG_SRC = '/marketing-assets/hermes-bg.jpg';
const HERMES_SITE_URL = 'https://hermes.agentsyun.com/';

const bodyItems = [
  {
    title: '强悍算力，本地释放。',
    text: '将强大的 AI 能力直接部署到你的个人设备。无惧网络波动，即使离线状态下也能流畅运行，轻松应对各类复杂任务。',
  },
  {
    title: '数据安全，隐私可控。',
    text: '告别云端上传担忧。所有对话、文件和处理数据均在本地加密存储，将数据的所有权完全交还给你，最大程度保护隐私安全。',
  },
  {
    title: '原生体验，触手可及。',
    text: '专为桌面端深度优化的安装包。支持全局快捷键一键唤醒，不打断现有工作流，在任何界面下都能随时响应你的需求。',
  },
] as const;

export function HermesAnnouncementModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useT();

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[105] flex items-center justify-center p-4 sm:p-6">
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(3px)' }}
        aria-hidden
        onClick={onClose}
        role="presentation"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="hermes-modal-title"
        className="relative z-[1] isolate flex w-full max-w-[880px] flex-col overflow-hidden rounded-2xl bg-white outline-none md:max-h-[min(90vh,560px)] md:flex-row md:rounded-2xl"
        style={{ boxShadow: '0 24px 80px rgba(15,23,42,0.2)' }}
      >
        <div
          className="relative min-h-[200px] w-full shrink-0 overflow-hidden rounded-t-2xl md:w-[42%] md:min-h-[467px] md:rounded-t-none md:rounded-l-2xl"
          style={{ background: '#0a0a0c' }}
        >
          <img
            src={HERMES_BG_SRC}
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-center"
          />
        </div>

        <div className="relative flex min-h-0 flex-1 flex-col bg-white">
          <button
            type="button"
            className="absolute right-2 top-2 z-10 flex h-9 w-9 items-center justify-center rounded-lg border-0 bg-transparent transition-colors hover:bg-gray-100"
            style={{ color: 'var(--color-text-secondary)' }}
            onClick={onClose}
            aria-label="关闭"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
              <path
                d="M6 6l12 12M18 6L6 18"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
              />
            </svg>
          </button>

          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-6 pb-6 pt-8 sm:px-8 sm:pb-8">
            <span
              className="inline-flex w-fit shrink-0 rounded-full bg-transparent px-[12px] py-1 text-[12px] font-normal leading-none"
              style={{ border: '1px solid var(--color-text-primary)', color: 'var(--color-text-primary)' }}
            >
              重磅上线
            </span>
            <h2
              id="hermes-modal-title"
              className="mt-5 text-xl font-semibold uppercase sm:text-2xl"
              style={{ letterSpacing: '-0.03em', lineHeight: 1.25, color: 'var(--color-text-primary)' }}
            >
              HzHermes 内测中
            </h2>
            <ul className="mt-4 space-y-5 text-sm sm:text-reading">
              {bodyItems.map((item) => (
                <li key={item.title} className="list-none space-y-1">
                  <p className="text-sm font-semibold leading-snug" style={{ color: 'var(--color-text-primary)' }}>{item.title}</p>
                  <p
                    className="text-2xs sm:text-caption"
                    style={{ color: 'var(--color-text-secondary)', lineHeight: 1.55 }}
                  >
                    {item.text}
                  </p>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex shrink-0 justify-end px-6 pb-6 pt-2 sm:px-8 sm:pb-8 sm:pt-3">
            <a
              href={HERMES_SITE_URL}
              target="_blank"
              rel="noreferrer"
              onClick={onClose}
              className="hermes-cta-primary inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium leading-none no-underline transition-colors duration-200 ease-out"
              style={{ background: 'var(--color-text-primary)', color: '#fff' }}
            >
              {t('hermes.cta')}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

