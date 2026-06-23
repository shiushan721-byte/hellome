import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

type AdminDrawerProps = {
  open: boolean;
  title: string;
  desc?: string;
  onClose: () => void;
  children: ReactNode;
  widthClass?: string;
};

export default function AdminDrawer({
  open,
  title,
  desc,
  onClose,
  children,
  widthClass = 'max-w-2xl',
}: AdminDrawerProps) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[200] flex justify-end">
      <button
        type="button"
        aria-label="关闭抽屉"
        className="absolute inset-0 bg-black/30 backdrop-blur-[1px]"
        onClick={onClose}
      />
      <aside
        className={`relative flex h-full w-full ${widthClass} flex-col bg-white shadow-2xl border-l border-[#eee]`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-drawer-title"
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#f0f0f0] px-5 py-4 shrink-0">
          <div className="min-w-0">
            <h2 id="admin-drawer-title" className="text-lg font-bold text-[#111] truncate">
              {title}
            </h2>
            {desc ? <p className="text-sm text-black/50 mt-0.5 truncate">{desc}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 p-2 rounded-lg text-black/45 hover:text-black/70 hover:bg-[#f5f5f5] transition-colors"
            aria-label="关闭"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar p-5">{children}</div>
      </aside>
    </div>,
    document.body,
  );
}
