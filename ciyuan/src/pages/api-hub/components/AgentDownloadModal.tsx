import { useCallback, useState } from 'react';
import { Download, X } from 'lucide-react';

import type { AgentProduct } from '../config/agentProducts';
import { fetchPackageDownloadUrl, triggerPackageDownload } from '../config/agentProducts';
import '../api-hub.css';

export type AgentDownloadModalProps = {
  product: AgentProduct | null;
  onClose: () => void;
};

export default function AgentDownloadModal({ product, onClose }: AgentDownloadModalProps) {
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = useCallback(async (productId: number) => {
    setLoadingId(productId);
    setError(null);
    try {
      const url = await fetchPackageDownloadUrl(productId);
      if (url) {
        triggerPackageDownload(url);
      } else {
        setError('获取下载链接失败，请稍后重试');
      }
    } finally {
      setLoadingId(null);
    }
  }, []);

  if (!product?.downloads?.length) return null;

  return (
    <div className="api-hub-modal-overlay" onClick={onClose}>
      <div className="api-hub-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 400 }}>
        <div className="api-hub-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Download size={20} strokeWidth={2} style={{ color: '#6673FF', flexShrink: 0 }} aria-hidden />
            <span className="api-hub-modal-title">下载 {product.name}</span>
          </div>
          <button type="button" className="api-hub-btn-ghost" onClick={onClose} aria-label="关闭">
            <X size={18} />
          </button>
        </div>
        <div className="api-hub-modal-body" style={{ paddingTop: 16, paddingBottom: 20 }}>
          <p style={{ fontSize: 14, color: '#6b7280', margin: '0 0 16px' }}>请选择适合您系统的版本</p>
          {error ? (
            <p style={{ fontSize: 13, color: '#dc2626', margin: '0 0 12px' }}>{error}</p>
          ) : null}
          <div className="api-hub-agent-download-list">
            {product.downloads.map((option) => (
              <div key={option.label} className="api-hub-agent-download-row">
                <span className="api-hub-agent-download-label">{option.label}</span>
                {option.comingSoon ? (
                  <span className="api-hub-agent-download-soon">即将推出</span>
                ) : option.productId != null ? (
                  <button
                    type="button"
                    className="api-hub-agent-download-link"
                    disabled={loadingId === option.productId}
                    onClick={() => handleDownload(option.productId!)}
                  >
                    {loadingId === option.productId ? '获取中…' : '下载'}
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
