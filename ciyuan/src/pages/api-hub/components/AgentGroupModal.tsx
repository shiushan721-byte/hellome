import { useEffect, useState } from 'react';
import { MessageCircle, X } from 'lucide-react';

import '../api-hub.css';

export type AgentGroupModalProps = {
  open: boolean;
  title: string;
  qrImageSrc: string;
  qrPlaceholder?: string;
  onClose: () => void;
};

export default function AgentGroupModal({
  open,
  title,
  qrImageSrc,
  qrPlaceholder = '请将二维码图片放到 public 目录',
  onClose,
}: AgentGroupModalProps) {
  const [qrLoadFailed, setQrLoadFailed] = useState(false);

  useEffect(() => {
    if (open) setQrLoadFailed(false);
  }, [open, qrImageSrc]);

  if (!open) return null;

  return (
    <div className="api-hub-modal-overlay" onClick={onClose}>
      <div className="api-hub-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 400 }}>
        <div className="api-hub-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <MessageCircle size={20} strokeWidth={2} style={{ color: '#6673FF', flexShrink: 0 }} aria-hidden />
            <span className="api-hub-modal-title">{title}</span>
          </div>
          <button type="button" className="api-hub-btn-ghost" onClick={onClose} aria-label="关闭">
            <X size={18} />
          </button>
        </div>
        <div className="api-hub-modal-body" style={{ paddingTop: 16, paddingBottom: 24 }}>
          <p style={{ fontSize: 14, color: '#6b7280', margin: '0 0 16px' }}>微信扫码加入交流群</p>
          <div className="api-hub-agent-group-qr-wrap">
            {qrLoadFailed ? (
              <div className="api-hub-agent-group-qr-fallback">{qrPlaceholder}</div>
            ) : (
              <img
                src={qrImageSrc}
                alt={title}
                className="api-hub-agent-group-qr"
                onError={() => setQrLoadFailed(true)}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
