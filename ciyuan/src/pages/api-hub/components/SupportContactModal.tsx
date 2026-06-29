import { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';

import '../api-hub.css';

export type SupportContactModalProps = {
  open: boolean;
  onClose: () => void;
  /** 二维码图片路径，默认 public/support/wechat-qr.png */
  qrImageSrc?: string;
};

const DEFAULT_QR_IMAGE_SRC = '/support/wechat-qr.png';

export default function SupportContactModal({
  open,
  onClose,
  qrImageSrc = DEFAULT_QR_IMAGE_SRC,
}: SupportContactModalProps) {
  const [qrLoadFailed, setQrLoadFailed] = useState(false);

  if (!open) return null;

  return (
    <div className="api-hub-modal-overlay api-hub-support-contact-overlay" onClick={onClose}>
      <div className="api-hub-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 400 }}>
        <div className="api-hub-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <MessageCircle size={20} strokeWidth={2} style={{ color: '#6673FF', flexShrink: 0 }} aria-hidden />
            <span className="api-hub-modal-title">联系客服</span>
          </div>
          <button type="button" className="api-hub-btn-ghost" onClick={onClose} aria-label="关闭">
            <X size={18} />
          </button>
        </div>
        <div className="api-hub-modal-body" style={{ paddingTop: 16 }}>
          <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.6, marginBottom: 16 }}>
            扫码添加客服，获取计费咨询、选型建议与企业支持。
          </p>

          <div
            style={{
              border: '1px solid #e5e7eb',
              borderRadius: 8,
              padding: 12,
              marginBottom: 16,
            }}
          >
            {/* <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>扫码添加客服</p> */}
            {qrLoadFailed ? (
              <div
                style={{
                  height: 176,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 6,
                  background: '#f9fafb',
                  fontSize: 12,
                  color: '#9ca3af',
                  textAlign: 'center',
                  padding: 16,
                }}
              >
                请将二维码图片放到 public/support/wechat-qr.png
              </div>
            ) : (
              <img
                src={qrImageSrc}
                alt="客服微信二维码"
                style={{
                  display: 'block',
                  margin: '0 auto',
                  width: 176,
                  height: 176,
                  borderRadius: 6,
                  border: '1px solid #e5e7eb',
                  objectFit: 'contain',
                }}
                onError={() => setQrLoadFailed(true)}
              />
            )}
          </div>

          <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>
            服务时间：工作日 09:00-18:00（紧急问题可留言）
          </p>
        </div>
        <div className="api-hub-modal-footer">
          <button type="button" className="api-hub-btn-secondary" onClick={onClose}>
            知道了
          </button>
        </div>
      </div>
    </div>
  );
}
