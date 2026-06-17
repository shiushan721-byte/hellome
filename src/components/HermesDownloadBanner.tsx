import React from 'react';
import { Download, ArrowRight } from 'lucide-react';

const HERMES_URL = 'https://hermes.agentsyun.com/';

function WindowsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M3 5.5L10.5 4.2V11.5H3V5.5ZM3 18.5V12.5H10.5V19.8L3 18.5ZM11.5 4L21 2.3V11.5H11.5V4ZM11.5 19.8V12.5H21V21.7L11.5 19.8Z" />
    </svg>
  );
}

function AppleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M16.7 13.1c-.1-2.9 2.4-4.3 2.5-4.4-1.4-2-3.5-2.3-4.2-2.3-1.8-.2-3.5 1.1-4.4 1.1-.9 0-2.3-1-3.8-1-2 0-3.8 1.1-4.8 2.9-2.1 3.5-.5 8.6 1.5 11.4 1 1.4 2.2 3 3.8 2.9 1.5-.1 2.1-1 3.9-1s2.3 1 3.9.9c1.6-.1 2.6-1.4 3.6-2.8 1.1-1.7 1.6-3.3 1.6-3.4-.1 0-3.1-1.2-3.1-4.4zM14.2 4.2c.8-1 1.4-2.3 1.2-3.7-1.2.1-2.6.8-3.4 1.8-.8.9-1.4 2.2-1.2 3.6 1.3.1 2.6-.7 3.4-1.7z" />
    </svg>
  );
}

function LinuxIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12.5 2c-2.8 0-5 2-5.3 4.7-.2 1.5.2 2.9 1 4.1-.9.5-1.6 1.3-2 2.3-.6 1.4-.5 3 .2 4.3.3.6.8 1.1 1.3 1.5-.1.6-.1 1.2 0 1.8.2 1.2.9 2.2 2 2.7.4 2.1 1.8 3.8 3.8 4.5.7.2 1.4.3 2.1.3 2.5 0 4.7-1.5 5.6-3.7 1.1-.5 1.9-1.5 2.1-2.7.1-.6.1-1.2 0-1.8.5-.4 1-.9 1.3-1.5.7-1.3.8-2.9.2-4.3-.4-1-.9-1.7-1.7-2.2.9-1.2 1.4-2.6 1.2-4.1C17.5 4 15.3 2 12.5 2zm-1.2 14.5c-.8 0-1.4-.6-1.4-1.4s.6-1.4 1.4-1.4 1.4.6 1.4 1.4-.6 1.4-1.4 1.4zm3.4 0c-.8 0-1.4-.6-1.4-1.4s.6-1.4 1.4-1.4 1.4.6 1.4 1.4-.6 1.4-1.4 1.4z" />
    </svg>
  );
}

export default function HermesDownloadBanner() {
  return (
    <div className="mb-12 lg:mb-16 max-w-lg mx-auto w-full text-center space-y-5">
      <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
        <a
          href={HERMES_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2.5 bg-black text-white text-sm font-bold py-3 px-5 rounded-full hover:bg-black/85 transition-all"
        >
          <WindowsIcon className="w-4 h-4 shrink-0" />
          <span>Windows下载</span>
          <Download className="w-4 h-4 shrink-0" />
        </a>

        <a
          href={HERMES_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm font-bold text-black/60 hover:text-black transition-colors"
        >
          了解更多
          <ArrowRight className="w-4 h-4" />
        </a>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-black/40 text-xs sm:text-sm">
        <span className="inline-flex items-center gap-2">
          <AppleIcon className="w-4 h-4" />
          macOS（即将推出）
        </span>
        <span className="inline-flex items-center gap-2">
          <LinuxIcon className="w-4 h-4" />
          Linux（即将推出）
        </span>
      </div>
    </div>
  );
}
