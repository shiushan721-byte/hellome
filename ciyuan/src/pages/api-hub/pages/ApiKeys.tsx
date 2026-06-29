import { useState, useEffect, useCallback } from 'react';
import {
  Copy,
  Plus,
  Trash2,
  Edit2,
  Terminal,
  X,
  Check,
  BookOpen,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useIsMobile } from '../../../hooks/useIsMobile';
import type { ApiKeySummary } from '../lib/api';
import {
  createApiKey,
  deleteApiKey,
  fetchApiKeys,
  updateApiKeyName,
  toggleApiKeyStatus,
  fetchBaseUrl,
  copyToClipboard,
} from '../lib/api';
import '../api-hub.css';

interface ModalState {
  type: 'create' | 'edit' | 'delete' | 'secret' | null;
  keyId?: string;
  keyName?: string;
  secret?: string;
}

function maskKey(key: string): string {
  if (key.length <= 12) return key;
  return key.slice(0, key.lastIndexOf('-') + 5) + '****' + key.slice(-4);
}

/* ---- 骨架屏 ---- */
const SKELETON_KEY_COUNT = 4;

function SkeletonKeyRow() {
  return (
    <div className="api-hub-skeleton-key-row">
      <div className="api-hub-skeleton-block api-hub-skeleton-key-name" />
      <div className="api-hub-skeleton-block api-hub-skeleton-key-secret" />
      <div className="api-hub-skeleton-block api-hub-skeleton-key-date" />
      <div className="api-hub-skeleton-block api-hub-skeleton-key-date" />
      <div className="api-hub-skeleton-block api-hub-skeleton-key-switch" />
      <div className="api-hub-skeleton-key-actions">
        <div className="api-hub-skeleton-block api-hub-skeleton-key-action" />
        <div className="api-hub-skeleton-block api-hub-skeleton-key-action" />
      </div>
    </div>
  );
}

function SkeletonKeyCard() {
  return (
    <div className="api-hub-skeleton-mobile-card">
      <div className="api-hub-skeleton-mobile-card-header">
        <div className="api-hub-skeleton-block api-hub-skeleton-mobile-card-title" />
        <div className="api-hub-skeleton-block api-hub-skeleton-key-switch" />
      </div>
      <div className="api-hub-skeleton-mobile-card-row">
        <div className="api-hub-skeleton-block api-hub-skeleton-mobile-card-label" />
        <div className="api-hub-skeleton-block api-hub-skeleton-mobile-card-value" />
      </div>
      <div className="api-hub-skeleton-mobile-card-row">
        <div className="api-hub-skeleton-block api-hub-skeleton-mobile-card-label" />
        <div className="api-hub-skeleton-block api-hub-skeleton-mobile-card-value" />
      </div>
      <div className="api-hub-skeleton-mobile-card-row">
        <div className="api-hub-skeleton-block api-hub-skeleton-mobile-card-label" />
        <div className="api-hub-skeleton-block api-hub-skeleton-mobile-card-value" />
      </div>
    </div>
  );
}

export default function ApiKeys() {
  const isMobile = useIsMobile();
  const { isLogin, requireAuth } = useAuth();
  const [keys, setKeys] = useState<ApiKeySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ModalState>({ type: null });
  const [nameInput, setNameInput] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedEndpoint, setCopiedEndpoint] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [apiEndpoint, setApiEndpoint] = useState('');
  const [showTutorial, setShowTutorial] = useState(false);

  const loadKeys = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchApiKeys({ masked: false });
      setKeys(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isLogin) {
      setLoading(false);
      return;
    }
    loadKeys();
    fetchBaseUrl()
      .then((url) => setApiEndpoint(url))
      .catch(() => setApiEndpoint(''));

    const handleLoginSuccess = () => {
      loadKeys();
      fetchBaseUrl()
        .then((url) => setApiEndpoint(url))
        .catch(() => setApiEndpoint(''));
    };
    window.addEventListener('login-success', handleLoginSuccess);
    return () => window.removeEventListener('login-success', handleLoginSuccess);
  }, [isLogin, loadKeys]);

  const handleCopyEndpoint = async () => {
    if (!apiEndpoint) return;
    const ok = await copyToClipboard(apiEndpoint);
    if (ok) {
      setCopiedEndpoint(true);
      setTimeout(() => setCopiedEndpoint(false), 2000);
    }
  };

  const handleCopyKey = async (fullKey: string, id: string) => {
    const ok = await copyToClipboard(fullKey);
    if (ok) {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handleCopySecret = async (secret: string) => {
    const ok = await copyToClipboard(secret);
    if (ok) {
      setCopiedSecret(true);
      setTimeout(() => setCopiedSecret(false), 2000);
    }
  };

  const handleToggleActive = async (key: ApiKeySummary) => {
    if (!requireAuth()) return;
    setErrorMsg(null);
    try {
      await toggleApiKeyStatus(key.id);
      await loadKeys();
    } catch (err) {
      const msg = err instanceof Error ? err.message : '操作失败';
      setErrorMsg(msg);
      setTimeout(() => setErrorMsg(null), 5000);
    }
  };

  const openCreateModal = () => {
    if (!requireAuth()) return;
    setNameInput('');
    setModal({ type: 'create' });
  };

  const openEditModal = (key: ApiKeySummary) => {
    if (!requireAuth()) return;
    setNameInput(key.name);
    setModal({ type: 'edit', keyId: key.id, keyName: key.name });
  };

  const openDeleteModal = (key: ApiKeySummary) => {
    if (!requireAuth()) return;
    setModal({ type: 'delete', keyId: key.id, keyName: key.name });
  };

  const handleCreate = async () => {
    if (!nameInput.trim() || submitting) return;
    setSubmitting(true);
    try {
      const result = await createApiKey({ name: nameInput.trim() });
      setModal({ type: 'secret', secret: result.secret, keyName: result.name });
      await loadKeys();
    } catch (err) {
      const msg = err instanceof Error ? err.message : '创建失败';
      setErrorMsg(msg);
      setTimeout(() => setErrorMsg(null), 5000);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async () => {
    if (!nameInput.trim() || !modal.keyId || submitting) return;
    setSubmitting(true);
    try {
      await updateApiKeyName(modal.keyId, nameInput.trim());
      setModal({ type: null });
      await loadKeys();
    } catch (err) {
      const msg = err instanceof Error ? err.message : '更新失败';
      setErrorMsg(msg);
      setTimeout(() => setErrorMsg(null), 5000);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!modal.keyId || submitting) return;
    setSubmitting(true);
    try {
      await deleteApiKey(modal.keyId);
      setModal({ type: null });
      await loadKeys();
    } catch (err) {
      const msg = err instanceof Error ? err.message : '删除失败';
      setErrorMsg(msg);
      setTimeout(() => setErrorMsg(null), 5000);
    } finally {
      setSubmitting(false);
    }
  };

  const closeModal = () => {
    setModal({ type: null });
    setCopiedSecret(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      {/* 页面标题区 */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 24,
          flexShrink: 0,
        }}
      >
        <div>
          <h1 className="api-hub-page-title">API Keys</h1>
          <p className="api-hub-page-subtitle">管理您的 API 密钥，控制访问权限</p>
        </div>
        <button type="button" className="api-hub-btn-primary" onClick={openCreateModal}>
          <Plus size={16} />
          创建新密钥
        </button>
      </div>

      {/* 错误提示 */}
      {errorMsg && (
        <div className="api-hub-error-bar" style={{ flexShrink: 0 }}>
          {errorMsg}
        </div>
      )}

      {/* API 端点卡片 */}
      <div className="api-hub-endpoint-card" style={{ marginBottom: 24, flexShrink: 0 }}>
        <div className="api-hub-endpoint-cluster">
          <div className="api-hub-endpoint-left">
            <div className="api-hub-endpoint-icon">
              <Terminal size={20} />
            </div>
            <div>
              <h3 className="api-hub-endpoint-title">API 端点</h3>
              <p className="api-hub-endpoint-desc">在您的应用中配置此地址</p>
            </div>
          </div>
          <button
            type="button"
            className="api-hub-tutorial-btn"
            onClick={() => setShowTutorial(true)}
          >
            <BookOpen size={16} />
            小白必看配置教程
          </button>
        </div>
        <div className="api-hub-endpoint-code">
          <code>{apiEndpoint || '加载中…'}</code>
          <button
            type="button"
            className="api-hub-btn-ghost"
            onClick={handleCopyEndpoint}
            disabled={!apiEndpoint}
            style={{ padding: 4 }}
          >
            {copiedEndpoint ? <Check size={14} style={{ color: '#10B981' }} /> : <Copy size={14} />}
          </button>
        </div>
      </div>

      {/* 密钥列表 */}
      {isMobile ? (
        /* === 移动端卡片列表 === */
        <div className="api-hub-mobile-card-list" style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
          {loading && keys.length === 0 ? (
            Array.from({ length: SKELETON_KEY_COUNT }).map((_, i) => <SkeletonKeyCard key={i} />)
          ) : keys.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>暂无 API 密钥，点击右上角创建</div>
          ) : (
            keys.map((key) => (
              <div key={key.id} className="api-hub-mobile-card">
                <div className="api-hub-mobile-card-header">
                  <span className="api-hub-mobile-card-title">{key.name}</span>
                  <div className="api-hub-mobile-card-actions">
                    <button
                      type="button"
                      className={`api-hub-switch ${key.active ? 'on' : 'off'}`}
                      onClick={() => handleToggleActive(key)}
                    >
                      <span className="api-hub-switch-thumb" />
                    </button>
                    <button type="button" className="api-hub-btn-ghost" onClick={() => openEditModal(key)}>
                      <Edit2 size={15} />
                    </button>
                    <button type="button" className="api-hub-btn-ghost danger" onClick={() => openDeleteModal(key)}>
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
                <div className="api-hub-mobile-card-row">
                  <span className="api-hub-mobile-card-label">密钥</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, minWidth: 0 }}>
                    <span className="api-hub-code" style={{ fontSize: 12 }}>{maskKey(key.apiKey)}</span>
                    <button type="button" className="api-hub-btn-ghost" onClick={() => handleCopyKey(key.apiKey, key.id)} style={{ padding: 2, flexShrink: 0 }}>
                      {copiedId === key.id ? <Check size={12} style={{ color: '#10B981' }} /> : <Copy size={12} />}
                    </button>
                  </div>
                </div>
                <div className="api-hub-mobile-card-row">
                  <span className="api-hub-mobile-card-label">创建时间</span>
                  <span className="api-hub-mobile-card-value">{key.createdAt}</span>
                </div>
                <div className="api-hub-mobile-card-row">
                  <span className="api-hub-mobile-card-label">最近使用</span>
                  <span className="api-hub-mobile-card-value">{key.lastUsedAt}</span>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        /* === 桌面端表格 === */
        <div
          className="api-hub-table-wrap"
          style={{
            flex: 1,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
            <table className="api-hub-table">
              <thead>
                <tr>
                  <th>名称</th>
                  <th>密钥</th>
                  <th>创建时间</th>
                  <th>最近使用</th>
                  <th>状态</th>
                  <th style={{ textAlign: 'right' }}>操作</th>
                </tr>
              </thead>
              <tbody>
                {loading && keys.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: 0 }}>
                      {Array.from({ length: SKELETON_KEY_COUNT }).map((_, i) => (
                        <SkeletonKeyRow key={i} />
                      ))}
                    </td>
                  </tr>
                ) : keys.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="api-hub-table-empty">
                      暂无 API 密钥，点击右上角创建
                    </td>
                  </tr>
                ) : (
                  keys.map((key) => (
                    <tr key={key.id}>
                      <td style={{ fontWeight: 500 }}>{key.name}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span className="api-hub-code">{maskKey(key.apiKey)}</span>
                          <button
                            type="button"
                            className="api-hub-btn-ghost"
                            onClick={() => handleCopyKey(key.apiKey, key.id)}
                          >
                            {copiedId === key.id ? (
                              <Check size={14} style={{ color: '#10B981' }} />
                            ) : (
                              <Copy size={14} />
                            )}
                          </button>
                        </div>
                      </td>
                      <td style={{ color: '#111827', fontSize: 14 }}>{key.createdAt}</td>
                      <td style={{ color: '#111827', fontSize: 14 }}>{key.lastUsedAt}</td>
                      <td>
                        <button
                          type="button"
                          className={`api-hub-switch ${key.active ? 'on' : 'off'}`}
                          onClick={() => handleToggleActive(key)}
                        >
                          <span className="api-hub-switch-thumb" />
                        </button>
                      </td>
                      <td>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 4 }}>
                          <button
                            type="button"
                            className="api-hub-btn-ghost"
                            onClick={() => openEditModal(key)}
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            type="button"
                            className="api-hub-btn-ghost danger"
                            onClick={() => openDeleteModal(key)}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 创建密钥弹窗 */}
      {modal.type === 'create' && (
        <div className="api-hub-modal-overlay" onClick={closeModal}>
          <div className="api-hub-modal" onClick={(e) => e.stopPropagation()}>
            <div className="api-hub-modal-header">
              <span className="api-hub-modal-title">创建新密钥</span>
              <button type="button" className="api-hub-btn-ghost" onClick={closeModal}>
                <X size={18} />
              </button>
            </div>
            <div className="api-hub-modal-body">
              <label htmlFor="api-hub-create-key-name" className="api-hub-form-label">
                密钥名称
              </label>
              <input
                id="api-hub-create-key-name"
                className="api-hub-input"
                placeholder="例如：生产环境密钥"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              />
            </div>
            <div className="api-hub-modal-footer">
              <button type="button" className="api-hub-btn-secondary" onClick={closeModal}>
                取消
              </button>
              <button
                type="button"
                className="api-hub-btn-primary"
                onClick={handleCreate}
                disabled={!nameInput.trim() || submitting}
              >
                {submitting ? '创建中…' : '创建'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 编辑密钥弹窗 */}
      {modal.type === 'edit' && (
        <div className="api-hub-modal-overlay" onClick={closeModal}>
          <div className="api-hub-modal" onClick={(e) => e.stopPropagation()}>
            <div className="api-hub-modal-header">
              <span className="api-hub-modal-title">编辑密钥</span>
              <button type="button" className="api-hub-btn-ghost" onClick={closeModal}>
                <X size={18} />
              </button>
            </div>
            <div className="api-hub-modal-body">
              <label htmlFor="api-hub-edit-key-name" className="api-hub-form-label">
                密钥名称
              </label>
              <input
                id="api-hub-edit-key-name"
                className="api-hub-input"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleEdit()}
              />
            </div>
            <div className="api-hub-modal-footer">
              <button type="button" className="api-hub-btn-secondary" onClick={closeModal}>
                取消
              </button>
              <button
                type="button"
                className="api-hub-btn-primary"
                onClick={handleEdit}
                disabled={!nameInput.trim() || submitting}
              >
                {submitting ? '保存中…' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 创建成功 - 展示密钥弹窗 */}
      {modal.type === 'secret' && modal.secret && (
        <div className="api-hub-modal-overlay" onClick={closeModal}>
          <div className="api-hub-modal" onClick={(e) => e.stopPropagation()}>
            <div className="api-hub-modal-header">
              <span className="api-hub-modal-title">密钥创建成功</span>
              <button type="button" className="api-hub-btn-ghost" onClick={closeModal}>
                <X size={18} />
              </button>
            </div>
            <div className="api-hub-modal-body">
              <div className="api-hub-success-bar" style={{ marginBottom: 16 }}>
                <h4>请妥善保存您的密钥</h4>
                <p>此密钥仅展示一次，关闭后将无法再次查看完整密钥。</p>
              </div>
              <label htmlFor="api-hub-secret-display" className="api-hub-form-label">
                {modal.keyName}
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  id="api-hub-secret-display"
                  className="api-hub-input"
                  value={modal.secret}
                  readOnly
                  style={{ fontFamily: "'SFMono-Regular', Consolas, monospace", fontSize: 13 }}
                />
                <button
                  type="button"
                  className="api-hub-btn-secondary"
                  onClick={() => handleCopySecret(modal.secret!)}
                >
                  {copiedSecret ? <Check size={14} /> : <Copy size={14} />}
                </button>
              </div>
              <div
                style={{
                  marginTop: 16,
                  padding: 16,
                  borderRadius: 8,
                  border: '1px solid #bfdbfe',
                  background: 'rgba(239, 246, 255, 0.6)',
                  display: 'flex',
                  gap: 12,
                  alignItems: 'flex-start',
                }}
              >
                <div
                  style={{
                    padding: 6,
                    borderRadius: 6,
                    background: '#dbeafe',
                    color: '#2563eb',
                    flexShrink: 0,
                  }}
                >
                  <BookOpen size={16} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#1e3a8a' }}>
                    不知道接下来该怎么做？
                  </p>
                  <p
                    style={{
                      margin: '8px 0 12px',
                      fontSize: 12,
                      color: '#1d4ed8',
                      lineHeight: 1.55,
                      opacity: 0.9,
                    }}
                  >
                    若您是第一次在第三方客户端（如 Chatbox、OpenClaw 等）里接入，建议先看教程，避免 Base URL、Key 填错。
                  </p>
                  <button
                    type="button"
                    className="api-hub-btn-primary"
                    style={{ fontSize: 12, height: 'auto', padding: '8px 12px' }}
                    onClick={() => {
                      closeModal();
                      setTimeout(() => setShowTutorial(true), 150);
                    }}
                  >
                    查看客户端配置保姆级教程
                  </button>
                </div>
              </div>
            </div>
            <div className="api-hub-modal-footer">
              <button type="button" className="api-hub-btn-primary" onClick={closeModal}>
                完成
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 删除确认弹窗 */}
      {modal.type === 'delete' && (
        <div className="api-hub-modal-overlay" onClick={closeModal}>
          <div className="api-hub-modal" onClick={(e) => e.stopPropagation()}>
            <div className="api-hub-modal-header">
              <span className="api-hub-modal-title">删除密钥</span>
              <button type="button" className="api-hub-btn-ghost" onClick={closeModal}>
                <X size={18} />
              </button>
            </div>
            <div className="api-hub-modal-body">
              <p className="api-hub-delete-confirm-text">
                确定要删除密钥 <strong>{modal.keyName}</strong> 吗？此操作不可撤销，使用该密钥的所有请求将立即失效。
              </p>
            </div>
            <div className="api-hub-modal-footer danger">
              <button type="button" className="api-hub-btn-secondary" onClick={closeModal}>
                取消
              </button>
              <button
                type="button"
                className="api-hub-btn-danger"
                onClick={handleDelete}
                disabled={submitting}
              >
                {submitting ? '删除中…' : '确认删除'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showTutorial && (
        <div className="api-hub-drawer-root" role="dialog" aria-modal="true" aria-labelledby="api-hub-tutorial-title">
          <div className="api-hub-drawer-backdrop" onClick={() => setShowTutorial(false)} aria-hidden />
          <div className="api-hub-drawer-panel" onClick={(e) => e.stopPropagation()}>
            <div className="api-hub-drawer-header">
              <div className="api-hub-drawer-title-row" id="api-hub-tutorial-title">
                <BookOpen size={20} />
                API Key 接入保姆级教程
              </div>
              <button
                type="button"
                className="api-hub-btn-ghost"
                onClick={() => setShowTutorial(false)}
                aria-label="关闭教程"
              >
                <X size={20} />
              </button>
            </div>
            <div className="api-hub-drawer-body">
              <section className="api-hub-tutorial-block">
                <h4 className="api-hub-tutorial-heading">
                  <span className="api-hub-tutorial-step-num">1</span>
                  先搞懂：这是啥？
                </h4>
                <div className="api-hub-tutorial-sheet">
                  <p style={{ margin: 0 }}>把调用大模型想象成去一家<strong>高级按量计费的智库餐厅</strong>：</p>
                  <ul>
                    <li>
                      <span style={{ marginTop: 2 }}>📍</span>
                      <span>
                        <strong>接口地址 (Base URL)</strong>
                        <br />
                        <span style={{ fontSize: 12, color: '#6b7280' }}>
                          我们的餐厅大门地址，软件需要它才能找到 AI。
                        </span>
                      </span>
                    </li>
                    <li>
                      <span style={{ marginTop: 2 }}>💳</span>
                      <span>
                        <strong>API Key</strong>
                        <br />
                        <span style={{ fontSize: 12, color: '#6b7280' }}>
                          你的<strong>预付充值凭证</strong>。软件带着问题出示这张卡，AI 就会回答并在卡里扣费。
                        </span>
                      </span>
                    </li>
                  </ul>
                  <div className="api-hub-tutorial-warn">
                    <AlertTriangle size={18} />
                    <p style={{ margin: 0 }}>
                      <strong>绝对保密：</strong>这串 `sk-` 开头的代码等同于您的支付密码，千万不要发给其他人！一旦泄漏，别人就会刷走你的余额！
                    </p>
                  </div>
                </div>
              </section>

              <section className="api-hub-tutorial-block">
                <h4 className="api-hub-tutorial-heading">
                  <span className="api-hub-tutorial-step-num">2</span>
                  客户端配置（三步搞定）
                </h4>
                <div className="api-hub-tutorial-steps-card">
                  <div className="api-hub-tutorial-step-row">
                    <div className="api-hub-tutorial-step-badge">A</div>
                    <div>
                      <p style={{ margin: 0, fontWeight: 600, color: '#111827' }}>复制你的凭证</p>
                      <p style={{ margin: '6px 0 0', fontSize: 12, color: '#6b7280', lineHeight: 1.55 }}>
                        在当前控制台页面，复制您刚刚创建的 <strong>API Key</strong> 和顶部的 <strong>API 端点 (Base URL)</strong>。
                      </p>
                    </div>
                  </div>
                  <div className="api-hub-tutorial-step-row">
                    <div className="api-hub-tutorial-step-badge">B</div>
                    <div>
                      <p style={{ margin: 0, fontWeight: 600, color: '#111827' }}>打开你的 AI 软件</p>
                      <p style={{ margin: '6px 0 0', fontSize: 12, color: '#6b7280', lineHeight: 1.55 }}>
                        如 OpenClaw、Chatbox 等。在设置里的 <strong>模型服务商 (Providers)</strong> 中，必须选择：
                        <br />
                        <span className="api-hub-tutorial-tag">自定义 (Custom)</span>{' '}
                        或者 <span className="api-hub-tutorial-tag">OpenAI (兼容)</span>。
                      </p>
                    </div>
                  </div>
                  <div className="api-hub-tutorial-step-row highlight">
                    <div className="api-hub-tutorial-step-badge blue">C</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontWeight: 600, color: '#111827' }}>
                        照着填空{' '}
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 500,
                            color: '#ea580c',
                            background: '#ffedd5',
                            padding: '2px 6px',
                            borderRadius: 4,
                          }}
                        >
                          🔥最容易错的一步
                        </span>
                      </p>
                      <div className="api-hub-tutorial-field">
                        <p className="api-hub-tutorial-field-label">API Key / API 密钥</p>
                        <p className="mono">sk-xxxx（粘贴刚生成的长密码）</p>
                      </div>
                      <div className="api-hub-tutorial-field accent">
                        <p className="api-hub-tutorial-field-label accent">API URL / 接口地址</p>
                        <div className="api-hub-drawer-copy-wrap">
                          <p className="mono" style={{ flex: 1, minWidth: 0 }}>
                            {apiEndpoint || '加载中…'}
                          </p>
                          <button
                            type="button"
                            className="api-hub-btn-ghost"
                            title="复制地址"
                            disabled={!apiEndpoint}
                            onClick={handleCopyEndpoint}
                            style={{ padding: 4, flexShrink: 0 }}
                          >
                            <Copy size={14} />
                          </button>
                          {copiedEndpoint && (
                            <span className="api-hub-drawer-copy-tip">已复制</span>
                          )}
                        </div>
                        <p className="api-hub-tutorial-field-hint">
                          <AlertTriangle size={14} />
                          有些软件要求结尾一定要带上 /v1，否则会报错连不上！
                        </p>
                      </div>
                      <div className="api-hub-tutorial-field">
                        <p className="api-hub-tutorial-field-label">Model Name / 模型名称</p>
                        <p className="mono" style={{ fontSize: 11 }}>
                          qwen3.5-plus 或 kimi-k2.5
                        </p>
                        <p style={{ margin: '6px 0 0', fontSize: 10, color: '#6b7280' }}>
                          必须与模型市场里展示的名字一字不差
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <section className="api-hub-tutorial-block">
                <h4 className="api-hub-tutorial-heading">
                  <span className="api-hub-tutorial-step-num">3</span>
                  常见避坑指南
                </h4>
                <div className="api-hub-tutorial-pitfall">
                  <p className="api-hub-tutorial-pitfall-title">🤔 一直转圈，或提示 Error / 网络错误？</p>
                  <p className="api-hub-tutorial-pitfall-body">
                    <CheckCircle2 size={16} />
                    <span>
                      <strong>解法：</strong>99% 是因为你的接口地址没填对！许多第三方客户端会使用自带的系统默认地址，请务必将其清空，并正确替换为本平台的合规专属网关地址。
                    </span>
                  </p>
                </div>
                <div className="api-hub-tutorial-pitfall">
                  <p className="api-hub-tutorial-pitfall-title">🤔 提示无效的 API Key / Auth Fails？</p>
                  <p className="api-hub-tutorial-pitfall-body">
                    <CheckCircle2 size={16} />
                    <span>
                      <strong>解法：</strong>检查复制 API Key 时是不是首尾多带了多余的空格，或者是不是把 URL 填进了 Key 的格子里。
                    </span>
                  </p>
                </div>
                <div className="api-hub-tutorial-pitfall">
                  <p className="api-hub-tutorial-pitfall-title">🤔 提示模型不存在 (Model not found)？</p>
                  <p className="api-hub-tutorial-pitfall-body">
                    <CheckCircle2 size={16} />
                    <span>
                      <strong>解法：</strong>模型名字不能自己瞎编。请使用模型市场中的标准模型名，例如{' '}
                      <code className="api-hub-tutorial-inline-code">qwen3.5-plus</code> 或{' '}
                      <code className="api-hub-tutorial-inline-code">kimi-k2.5</code>（具体以模型市场为准）。
                    </span>
                  </p>
                </div>
              </section>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}