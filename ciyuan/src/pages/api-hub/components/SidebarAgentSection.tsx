import type { CSSProperties } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Box,
  ChevronRight,
  Download,
  ExternalLink,
  HelpCircle,
  MessageCircle,
} from 'lucide-react';

import { AGENT_PRODUCTS, TOKEN_GROUP_QR_SRC, type AgentProduct } from '../config/agentProducts';
import AgentDownloadModal from './AgentDownloadModal';
import AgentGroupModal from './AgentGroupModal';
import '../api-hub.css';

type SidebarAgentSectionProps = {
  collapsed: boolean;
};

type GroupModalState = {
  title: string;
  qrImageSrc: string;
  placeholder: string;
};

export default function SidebarAgentSection({ collapsed }: SidebarAgentSectionProps) {
  const [agentPopoverOpen, setAgentPopoverOpen] = useState(false);
  const [downloadProduct, setDownloadProduct] = useState<AgentProduct | null>(null);
  const [groupModal, setGroupModal] = useState<GroupModalState | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [popoverStyle, setPopoverStyle] = useState<CSSProperties>({});
  const closeTimerRef = useRef<number | null>(null);
  const agentWrapRef = useRef<HTMLDivElement>(null);
  const agentTriggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const clearCloseTimer = useCallback(() => {
    if (closeTimerRef.current == null) return;
    window.clearTimeout(closeTimerRef.current);
    closeTimerRef.current = null;
  }, []);

  const updatePopoverPosition = useCallback(() => {
    const trigger = agentTriggerRef.current;
    const popover = popoverRef.current;
    const wrap = agentWrapRef.current;
    if (!trigger || !popover) return;

    const triggerRect = trigger.getBoundingClientRect();
    const popoverHeight = popover.offsetHeight;
    const gap = 8;
    const viewportPadding = 12;

    if (!collapsed && wrap) {
      const wrapRect = wrap.getBoundingClientRect();
      const top = Math.max(
        viewportPadding,
        triggerRect.top - popoverHeight - gap,
      );
      setPopoverStyle({
        left: wrapRect.left,
        top,
        width: wrapRect.width,
      });
      return;
    }

    const sidebar = wrap?.closest('.api-hub-sidebar');
    const sidebarWidth = sidebar?.getBoundingClientRect().width ?? 240;
    const popoverWidth = Math.min(sidebarWidth, 240);
    let top = triggerRect.top + triggerRect.height / 2 - popoverHeight / 2;
    top = Math.min(
      Math.max(viewportPadding, top),
      window.innerHeight - popoverHeight - viewportPadding,
    );

    setPopoverStyle({
      left: triggerRect.right + gap,
      top,
      width: popoverWidth,
    });
  }, [collapsed]);

  const openAgentPopover = useCallback(() => {
    clearCloseTimer();
    setAgentPopoverOpen(true);
  }, [clearCloseTimer]);

  const scheduleCloseAgentPopover = useCallback(() => {
    clearCloseTimer();
    closeTimerRef.current = window.setTimeout(() => {
      setAgentPopoverOpen(false);
      closeTimerRef.current = null;
    }, 120);
  }, [clearCloseTimer]);

  const closeAgentPopover = useCallback(() => {
    clearCloseTimer();
    setAgentPopoverOpen(false);
  }, [clearCloseTimer]);

  useEffect(() => {
    return () => clearCloseTimer();
  }, [clearCloseTimer]);

  useEffect(() => {
    if (!agentPopoverOpen) return;
    const frame = requestAnimationFrame(() => updatePopoverPosition());
    const onLayout = () => updatePopoverPosition();
    window.addEventListener('resize', onLayout);
    window.addEventListener('scroll', onLayout, true);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', onLayout);
      window.removeEventListener('scroll', onLayout, true);
    };
  }, [agentPopoverOpen, collapsed, updatePopoverPosition]);

  const openGroup = useCallback((product: AgentProduct) => {
    closeAgentPopover();
    setGroupModal({
      title: product.groupTitle,
      qrImageSrc: product.groupQrSrc,
      placeholder: `请将二维码放到 public${product.groupQrSrc}`,
    });
  }, [closeAgentPopover]);

  const openDownload = useCallback((product: AgentProduct) => {
    closeAgentPopover();
    setDownloadProduct(product);
  }, [closeAgentPopover]);

  return (
    <>
      <div className="api-hub-sidebar-extras">
        <div
          ref={agentWrapRef}
          className="api-hub-sidebar-extra-wrap"
          onMouseEnter={openAgentPopover}
          onMouseLeave={scheduleCloseAgentPopover}
          onFocus={openAgentPopover}
          onBlur={(event) => {
            const next = event.relatedTarget;
            if (!(next instanceof Node) || !event.currentTarget.contains(next)) {
              scheduleCloseAgentPopover();
            }
          }}
        >
          <button
            ref={agentTriggerRef}
            type="button"
            className="api-hub-sidebar-extra-item"
            data-tooltip={collapsed ? '汇智智能体' : undefined}
            aria-haspopup="true"
            aria-expanded={agentPopoverOpen}
          >
            <Box size={18} strokeWidth={2} />
            {!collapsed && (
              <>
                <span className="api-hub-sidebar-extra-label">汇智智能体</span>
                <ChevronRight size={16} strokeWidth={2} className="api-hub-sidebar-extra-chevron" />
              </>
            )}
          </button>

          <div
            ref={popoverRef}
            className={`api-hub-agent-popover${agentPopoverOpen ? ' api-hub-agent-popover--open' : ''}`}
            style={popoverStyle}
            onMouseEnter={openAgentPopover}
            onMouseLeave={closeAgentPopover}
          >
            {AGENT_PRODUCTS.map((product) => (
              <div key={product.id} className="api-hub-agent-popover-block">
                <div className="api-hub-agent-popover-name">{product.name}</div>
                <div className="api-hub-agent-popover-actions">
                  {product.detailUrl ? (
                    <a
                      href={product.detailUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="api-hub-agent-popover-action"
                      onClick={closeAgentPopover}
                    >
                      详情
                      <ExternalLink size={13} strokeWidth={2} />
                    </a>
                  ) : (
                    <span className="api-hub-agent-popover-action api-hub-agent-popover-action--disabled">
                      详情
                      <ExternalLink size={13} strokeWidth={2} />
                    </span>
                  )}
                  {product.downloads?.length ? (
                    <button
                      type="button"
                      className="api-hub-agent-popover-action"
                      onClick={() => openDownload(product)}
                    >
                      下载
                      <Download size={13} strokeWidth={2} />
                    </button>
                  ) : null}
                  {!product.hideGroup ? (
                    <button
                      type="button"
                      className="api-hub-agent-popover-action"
                      onClick={() => openGroup(product)}
                    >
                      交流群
                      <MessageCircle size={13} strokeWidth={2} />
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>

        <button
          type="button"
          className="api-hub-sidebar-extra-item"
          data-tooltip={collapsed ? '帮助与反馈' : undefined}
          onClick={() => setHelpOpen(true)}
        >
          <HelpCircle size={18} strokeWidth={2} />
          {!collapsed && (
            <>
              <span className="api-hub-sidebar-extra-label">帮助与反馈</span>
              <ChevronRight size={16} strokeWidth={2} className="api-hub-sidebar-extra-chevron" />
            </>
          )}
        </button>
      </div>

      <AgentDownloadModal product={downloadProduct} onClose={() => setDownloadProduct(null)} />

      <AgentGroupModal
        open={groupModal != null}
        title={groupModal?.title ?? ''}
        qrImageSrc={groupModal?.qrImageSrc ?? ''}
        qrPlaceholder={groupModal?.placeholder}
        onClose={() => setGroupModal(null)}
      />

      <AgentGroupModal
        open={helpOpen}
        title="词元交流群"
        qrImageSrc={TOKEN_GROUP_QR_SRC}
        qrPlaceholder="请将二维码放到 public/ciyuan.png"
        onClose={() => setHelpOpen(false)}
      />
    </>
  );
}
