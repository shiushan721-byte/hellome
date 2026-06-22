import { ExternalLink } from 'lucide-react';
import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { canAccessAdmin } from '../../lib/auth';

const MORE_LINKS = [
  { label: '用户协议', href: '#' },
  { label: '隐私政策', href: '#' },
  { label: '关于我们', href: '#' },
  { label: '加入我们', href: '#' },
  { label: '联系客服', href: '#' },
] as const;

const SOCIAL_LINKS = [
  { label: '微信公众号', href: '#' },
  { label: '小红书', href: '#' },
  { label: '抖音', href: '#' },
  { label: 'B 站', href: '#' },
] as const;

interface SidebarMoreMenuProps {
  open: boolean;
  onClose: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  anchorRef: RefObject<HTMLElement | null>;
}

function useMenuPosition(anchorRef: RefObject<HTMLElement | null>, open: boolean) {
  const [style, setStyle] = useState<{ left: number; bottom: number } | null>(null);

  useLayoutEffect(() => {
    if (!open) {
      setStyle(null);
      return;
    }

    const update = () => {
      const anchor = anchorRef.current;
      if (!anchor) return;
      const rect = anchor.getBoundingClientRect();
      setStyle({
        left: rect.right + 12,
        bottom: window.innerHeight - rect.bottom,
      });
    };

    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [anchorRef, open]);

  return style;
}

export default function SidebarMoreMenu({
  open,
  onClose,
  onMouseEnter,
  onMouseLeave,
  anchorRef,
}: SidebarMoreMenuProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const position = useMenuPosition(anchorRef, open);

  useEffect(() => {
    if (!open) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open, onClose]);

  if (!open || !position) return null;

  const panel = (
    <div
      ref={panelRef}
      role="dialog"
      aria-label="更多菜单"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className="fixed z-[80] w-[340px] rounded-2xl border border-black/[0.06] bg-white p-6 shadow-[0_12px_32px_rgba(0,0,0,0.12)]"
      style={{
        left: position.left,
        bottom: position.bottom,
      }}
    >
      <div className="space-y-1">
        {canAccessAdmin() ? (
          <Link
            to="/admin/dashboard"
            className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm text-[#444444] hover:bg-[#f7f7f8] hover:text-[#111111] transition-colors font-semibold"
            onClick={onClose}
          >
            <span>Boss Admin 后台</span>
            <ExternalLink className="h-4 w-4 opacity-40" />
          </Link>
        ) : null}
        {MORE_LINKS.map((item) => (
          <a
            key={item.label}
            href={item.href}
            className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm text-[#444444] hover:bg-[#f7f7f8] hover:text-[#111111] transition-colors"
            onClick={(e) => {
              if (item.href === '#') e.preventDefault();
            }}
          >
            <span>{item.label}</span>
            {item.href !== '#' && <ExternalLink className="h-4 w-4 opacity-40" />}
          </a>
        ))}
      </div>

      <div className="my-4 border-t border-[#f0f0f0]" />

      <div className="flex flex-wrap gap-2">
        {SOCIAL_LINKS.map((item) => (
          <a
            key={item.label}
            href={item.href}
            className="rounded-full border border-black/10 px-3 py-1.5 text-xs text-[#666666] hover:bg-[#f7f7f8] hover:text-[#111111] transition-colors"
            onClick={(e) => e.preventDefault()}
          >
            {item.label}
          </a>
        ))}
      </div>

      <div className="mt-5 space-y-1 text-[11px] text-black/40 leading-relaxed">
        <p>江苏汇智智能数字科技有限公司</p>
        <p>苏ICP备2023021414号-8</p>
        <p>算法备案号：Jiangsu-CarrotAI-202407030002</p>
      </div>
    </div>
  );

  return createPortal(panel, document.body);
}
