import { X } from 'lucide-react';
import '../api-hub.css';

interface InvoiceModalProps {
  open: boolean;
  onClose: () => void;
}

export default function InvoiceModal({ open, onClose }: InvoiceModalProps) {
  if (!open) return null;

  return (
    <div className="api-hub-modal-overlay" onClick={onClose}>
      <div
        className="api-hub-modal"
        style={{ maxWidth: 440 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="api-hub-modal-header">
          <span className="api-hub-modal-title">开具发票</span>
          <button type="button" className="api-hub-btn-ghost" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div className="api-hub-modal-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 24px' }}>
          <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 20 }}>请联系客服申请开具发票</p>
          <img
            src="https://filefront.oss-cn-hangzhou.aliyuncs.com/0_web/agent_entrepot/home/token_serve.png"
            alt="客服二维码"
            style={{ width: 180, height: 180, borderRadius: 8 }}
          />
        </div>
        <div className="api-hub-modal-footer" style={{ justifyContent: 'flex-end' }}>
          <button type="button" className="api-hub-btn-secondary" onClick={onClose}>
            好的
          </button>
        </div>
      </div>
    </div>
  );
}
