import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useIsMobile } from '../../../hooks/useIsMobile';
import type { PayMethod, RechargeConfigResult, TopupRecord, UserBalance } from '../lib/api';
import { createTopup, fetchRechargeConfigs, fetchUserBalance, fetchUserTopups } from '../lib/api';
import PayQrCodeModal from '../components/PayQrCodeModal';
import InvoiceModal from '../components/InvoiceModal';
import './wallet-design.css';

// ====== 常量 ======

const DEFAULT_PRESET_AMOUNTS = [50, 100, 200, 500, 1000, 2000, 5000];

const PAY_METHOD_LABEL: Record<PayMethod, string> = {
  wechat: '微信支付',
  alipay: '支付宝',
  epay: 'EPay',
  stripe: 'Stripe',
  waffo: 'Waffo',
};

const STATUS_LABEL: Record<string, string> = {
  completed: '已完成',
  pending: '待支付',
  failed: '失败',
  closed: '已关闭',
};

const STATUS_CLASS: Record<string, string> = {
  completed: 'wallet-design-status-completed',
  pending: 'wallet-design-status-pending',
  failed: 'wallet-design-status-failed',
  closed: 'wallet-design-status-closed',
};

const NOTES = [
  '1. 请确保您的账户有足够金额进行交易。',
  '2. 若充值过程遇到交易问题，请前往相应的第三方支付平台进行确认。',
  '3. 为了保障您的账户安全与充值体验的顺畅，您每月最多可以享受30次充值服务。1天内未支付的订单，会自动关闭。',
];

// ====== 微信 / 支付宝 SVG 图标 ======

const WechatIcon: React.FC = React.memo(() => (
  <svg width="16" height="16" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g clipPath="url(#wechat_clip)">
      <path
        d="M10.0709 0H1.91214C1.40307 0.00491456 0.916563 0.210788 0.558597 0.572777C0.200631 0.934765 0.000205304 1.42354 0.000978793 1.93263V10.0781C0.00122945 10.5875 0.203621 11.076 0.563719 11.4364C0.923817 11.7967 1.41219 11.9994 1.92161 12H10.0791C10.5882 11.9978 11.0758 11.7943 11.4356 11.4341C11.7954 11.0738 11.9981 10.586 11.9997 10.0768V1.93263C11.9967 1.42166 11.7926 0.932435 11.4316 0.570765C11.0707 0.209095 10.5818 0.00405744 10.0709 0ZM5.9915 9.14874C5.56616 9.14942 5.14271 9.09227 4.73277 8.97884C4.61538 9.00005 4.50091 9.03503 4.39172 9.08305L3.61614 9.56621C3.38877 9.71716 3.31361 9.66095 3.39824 9.396L3.56814 8.79032C3.57748 8.66958 3.568 8.54813 3.54003 8.43032C3.08436 8.14559 2.70603 7.75277 2.43863 7.28672C2.17123 6.82068 2.02303 6.29582 2.00719 5.75874C2.00719 3.89305 3.7955 2.36842 5.9915 2.36842C6.60381 2.35773 7.21115 2.48001 7.77161 2.72682C8.33207 2.97363 8.83231 3.33909 9.23782 3.798L5.52729 5.55947C5.41578 5.6463 5.27641 5.68943 5.13535 5.68076C4.99429 5.6721 4.86124 5.61224 4.76119 5.51242L4.16435 4.98189C3.89024 4.896 3.7955 4.99137 3.88108 5.23705L4.52435 6.80021C4.66645 7.03705 4.88435 7.11316 5.24403 6.84726L9.5495 4.22305C9.82568 4.68394 9.97262 5.21071 9.97487 5.748C9.97582 7.62411 8.18656 9.14874 5.9915 9.14874Z"
        fill="#2AAC38"
      />
    </g>
    <defs>
      <clipPath id="wechat_clip">
        <rect width="12" height="12" fill="white" />
      </clipPath>
    </defs>
  </svg>
));
WechatIcon.displayName = 'WechatIcon';

const AlipayIcon: React.FC = React.memo(() => (
  <svg width="16" height="16" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g clipPath="url(#alipay_clip)">
      <path
        d="M12.0006 8.2152V2.307C12.0003 1.69514 11.757 1.10844 11.3243 0.675844C10.8916 0.243249 10.3049 0.000158966 9.693 0L2.307 0C1.69524 0.000317961 1.10863 0.243478 0.676056 0.676056C0.243478 1.10863 0.000317961 1.69524 0 2.307V9.693C0.000159055 10.3048 0.243268 10.8915 0.67588 11.3241C1.10849 11.7567 1.69519 11.9998 2.307 12H9.693C10.2342 11.9996 10.7581 11.8092 11.1732 11.4621C11.5884 11.1149 11.8685 10.633 11.9646 10.1004C11.3526 9.8352 8.7006 8.6904 7.3188 8.0304C6.2676 9.3042 5.166 10.0686 3.5064 10.0686C1.8468 10.0686 0.7386 9.0462 0.8718 7.7946C0.9594 6.9738 1.5228 5.6316 3.969 5.8614C5.259 5.9826 5.8488 6.2232 6.9006 6.5706C7.1724 6.0714 7.3986 5.5224 7.5702 4.9386H2.907V4.4766H5.2146V3.6462H2.4V3.138H5.214V1.941C5.214 1.941 5.2392 1.7538 5.4462 1.7538H6.6V3.138H9.6V3.6468H6.6V4.476H9.0474C8.8363 5.34988 8.50153 6.18915 8.0532 6.9684C8.7642 7.2264 12 8.2152 12 8.2152H12.0006ZM3.3228 9.2766C1.569 9.2766 1.2918 8.1696 1.3848 7.707C1.4766 7.2462 1.9848 6.645 2.9598 6.645C4.08 6.645 5.0838 6.9318 6.2886 7.5186C5.4426 8.6202 4.4028 9.2766 3.3228 9.2766Z"
        fill="#009FE8"
      />
    </g>
    <defs>
      <clipPath id="alipay_clip">
        <rect width="14" height="14" fill="white" />
      </clipPath>
    </defs>
  </svg>
));
AlipayIcon.displayName = 'AlipayIcon';

type WalletTab = 'recharge' | 'records';

// ====== 支付弹窗状态 ======

interface PayQrState {
  open: boolean;
  orderId: string;
  orderPageUrl: string;
  amount: number;
  payToken: string;
}

const INITIAL_PAY_QR: PayQrState = { open: false, orderId: '', orderPageUrl: '', amount: 0, payToken: '' };

// ====== 主组件 ======

const Wallet: React.FC = () => {
  const isMobile = useIsMobile();
  const { isLogin, requireAuth } = useAuth();
  const [activeTab, setActiveTab] = useState<WalletTab>('recharge');
  const [balance, setBalance] = useState<UserBalance | null>(null);
  const [records, setRecords] = useState<TopupRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const [presetAmounts, setPresetAmounts] = useState<number[]>(DEFAULT_PRESET_AMOUNTS);
  const [minAmountYuan, setMinAmountYuan] = useState(1);
  const [maxAmountYuan, setMaxAmountYuan] = useState(50000);
  const [customAmountEnabled, setCustomAmountEnabled] = useState(true);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(50);
  const [customAmount, setCustomAmount] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const [payMethod, setPayMethod] = useState<PayMethod>('wechat');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [invoiceOpen, setInvoiceOpen] = useState(false);

  const [payQr, setPayQr] = useState<PayQrState>(INITIAL_PAY_QR);
  const customAmountInputRef = useRef<HTMLInputElement>(null);

  const refreshData = useCallback(async () => {
    const [b, r] = await Promise.all([fetchUserBalance(), fetchUserTopups()]);
    setBalance(b);
    setRecords(r);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const [balanceData, recordsData, configResult] = await Promise.all([
          fetchUserBalance(),
          fetchUserTopups(),
          fetchRechargeConfigs().catch(() => null as RechargeConfigResult | null),
        ]);
        if (!cancelled) {
          setBalance(balanceData);
          setRecords(recordsData);
          if (configResult) {
            setMinAmountYuan(configResult.minAmountYuan);
            setMaxAmountYuan(configResult.maxAmountYuan);
            setCustomAmountEnabled(configResult.customAmountEnabled);
            if (configResult.configs.length > 0) {
              const amounts = configResult.configs.map((c) => c.amount / 1000);
              setPresetAmounts(amounts);
              const defaultConfig = configResult.configs.find((c) => c.isDefault);
              setSelectedAmount(defaultConfig ? defaultConfig.amount / 1000 : amounts[0]);
            }
            // 若自定义金额被关闭且当前处于自定义状态，重置为套餐选择
            if (!configResult.customAmountEnabled) {
              setIsCustom(false);
              setCustomAmount('');
            }
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    if (isLogin) {
      load();
    } else {
      setLoading(false);
    }

    const handleLoginSuccess = () => {
      load();
    };
    window.addEventListener('login-success', handleLoginSuccess);

    return () => {
      cancelled = true;
      window.removeEventListener('login-success', handleLoginSuccess);
    };
  }, [isLogin]);

  // 切换到充值记录 tab 时刷新记录
  useEffect(() => {
    if (activeTab === 'records' && isLogin) {
      fetchUserTopups().then(setRecords).catch(() => {});
    }
  }, [activeTab, isLogin]);

  const finalAmount = useMemo(() => {
    if (isCustom) {
      const v = Number.parseFloat(customAmount);
      if (Number.isNaN(v)) return 0;
      return Math.max(0, v);
    }
    return selectedAmount ?? 0;
  }, [isCustom, customAmount, selectedAmount]);

  const handleSelectPreset = useCallback((amount: number) => {
    setIsCustom(false);
    setSelectedAmount(amount);
    setCustomAmount('');
    setErrorMsg('');
  }, []);

  const handleCustomFocus = useCallback(() => {
    setIsCustom(true);
    setSelectedAmount(null);
  }, []);

  const handleCustomAmountChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value;
    raw = raw.replace(/-/g, '').replace(/[eE]/g, '').replace(/\+/g, '');
    setCustomAmount(raw);
    setIsCustom(true);
    setSelectedAmount(null);
  }, []);

  const handleCustomAmountKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === '-' || e.key === '+' || e.key === 'e' || e.key === 'E') {
      e.preventDefault();
    }
  }, []);

  const handleCustomAmountBlur = useCallback(() => {
    const v = Number.parseFloat(customAmount);
    if (!customAmount || Number.isNaN(v) || v <= 0) {
      setErrorMsg('');
      return;
    }
    if (v < minAmountYuan) {
      setErrorMsg(`充值金额不能低于 ${minAmountYuan.toFixed(3)} 元`);
    } else if (v > maxAmountYuan) {
      setErrorMsg(`充值金额不能超过 ${maxAmountYuan.toFixed(3)} 元`);
    } else {
      setErrorMsg('');
    }
  }, [customAmount, minAmountYuan, maxAmountYuan]);

  useEffect(() => {
    if (isCustom) {
      customAmountInputRef.current?.focus();
    }
  }, [isCustom]);

  const handleSubmitPay = useCallback(async () => {
    if (!requireAuth()) return;
    if (finalAmount <= 0 || !agreedToTerms || submitting) return;
    setErrorMsg('');
    setSubmitting(true);
    try {
      const order = await createTopup(Math.round(finalAmount * 1000));
      setPayQr({
        open: true,
        orderId: order.orderId,
        orderPageUrl: order.orderPageUrl,
        amount: finalAmount,
        payToken: order.payToken,
      });
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : '充值请求失败，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  }, [finalAmount, agreedToTerms, submitting, requireAuth]);

  const handlePayQrClose = useCallback(() => {
    setPayQr(INITIAL_PAY_QR);
    refreshData();
  }, [refreshData]);

  const handleOrderPaid = useCallback(() => {
    refreshData();
  }, [refreshData]);

  const handlePayQrRefresh = useCallback(async () => {
    if (finalAmount <= 0) return;
    try {
      const order = await createTopup(Math.round(finalAmount * 1000));
      setPayQr({
        open: true,
        orderId: order.orderId,
        orderPageUrl: order.orderPageUrl,
        amount: finalAmount,
        payToken: order.payToken,
      });
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : '充值请求失败，请稍后重试');
    }
  }, [finalAmount]);

  if (loading) {
    return (
      <div className="wallet-design-root" style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        {/* 标题骨架 */}
        <div className="wallet-skeleton-block" style={{ height: 28, width: 80, marginBottom: 4 }} />
        <div className="wallet-skeleton-block" style={{ height: 14, width: 180, marginBottom: 24 }} />

        {/* 余额卡片骨架 */}
        <div className="wallet-skeleton-balance-card">
          <div className="wallet-skeleton-block wallet-skeleton-balance-label" />
          <div className="wallet-skeleton-block wallet-skeleton-balance-amount" />
          <div className="wallet-skeleton-balance-stats">
            <div className="wallet-skeleton-block wallet-skeleton-balance-stat" />
            <div className="wallet-skeleton-block wallet-skeleton-balance-stat" />
          </div>
        </div>

        {/* Tab 骨架 */}
        <div className="wallet-skeleton-tabs">
          <div className="wallet-skeleton-block wallet-skeleton-tab" />
          <div className="wallet-skeleton-block wallet-skeleton-tab" />
        </div>

        {/* 充值表单区域骨架 */}
        <div className="wallet-skeleton-form-section">
          <div className="wallet-skeleton-block wallet-skeleton-form-label" />
          <div className="wallet-skeleton-amount-grid">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="wallet-skeleton-block wallet-skeleton-amount-btn" />
            ))}
          </div>
          <div className="wallet-skeleton-block wallet-skeleton-form-label" />
          <div className="wallet-skeleton-pay-grid">
            <div className="wallet-skeleton-block wallet-skeleton-pay-btn" />
            <div className="wallet-skeleton-block wallet-skeleton-pay-btn" />
          </div>
          <div className="wallet-skeleton-block wallet-skeleton-agreement" />
          <div className="wallet-skeleton-block wallet-skeleton-submit" />
        </div>
      </div>
    );
  }

  return (
    <div
      className="wallet-design-root"
      style={{ display: 'flex', flexDirection: 'column', flex: 1 }}
    >
      {/* 标题区 */}
      <h1 className="wallet-design-title" style={{ flexShrink: 0 }}>
        钱包
      </h1>
      <p className="wallet-design-subtitle" style={{ flexShrink: 0 }}>
        管理您的账户余额和充值记录
      </p>

      {/* 余额卡片 */}
      {balance && (
        <div className="wallet-design-balance-card" style={{ flexShrink: 0 }}>
          <div>
            <div className="wallet-design-balance-label">可用总余额</div>
            <div className="wallet-design-balance-amount">¥{balance.balance.toFixed(3)}</div>
            <div className="wallet-design-balance-stats">
              <span>累计充值: ¥{balance.totalRecharge.toFixed(3)}</span>
              <span>累计消费: ¥{balance.totalConsumption.toFixed(3)}</span>
            </div>
          </div>
          <div className="wallet-design-balance-right">
            <span className="wallet-design-invoice-hint">支持普通发票和增值税发票！</span>
            <button
              type="button"
              className="wallet-design-invoice-btn"
              onClick={() => setInvoiceOpen(true)}
            >
              去开票
            </button>
          </div>
        </div>
      )}

      {!balance && (
        <div className="wallet-design-balance-card" style={{ flexShrink: 0 }}>
          <div>
            <div className="wallet-design-balance-label">可用总余额</div>
            <div className="wallet-design-skeleton" />
          </div>
        </div>
      )}

      {/* Tab 切换 */}
      <div className="wallet-design-tabs" style={{ flexShrink: 0 }}>
        <button
          className={`wallet-design-tab${activeTab === 'recharge' ? ' active' : ''}`}
          type="button"
          onClick={() => setActiveTab('recharge')}
        >
          充值汇款
        </button>
        <button
          className={`wallet-design-tab${activeTab === 'records' ? ' active' : ''}`}
          type="button"
          onClick={() => setActiveTab('records')}
        >
          充值记录
        </button>
      </div>

      {/* 充值汇款 */}
      {activeTab === 'recharge' && (
        <div className="wallet-design-tab-content">
          {/* 注意事项 */}
          <div className="wallet-design-notice">
            {NOTES.map((note) => (
              <p key={note}>{note}</p>
            ))}
            <p>
              4. 充值完成后可前往
              <Link to="/hub/logs" className="wallet-design-notice-link">
                账户总览
              </Link>
              查看账户余额。
            </p>
          </div>

          {/* 支付金额 */}
          <div className="wallet-design-form-row">
            <div className="wallet-design-form-label">支付金额</div>
            <div className="wallet-design-form-content">
              <div className="wallet-design-amount-grid">
                {presetAmounts.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    className={`wallet-design-amount-btn${!isCustom && selectedAmount === amt ? ' selected' : ''}`}
                    onClick={() => handleSelectPreset(amt)}
                  >
                    {amt}元
                  </button>
                ))}
                <div className="wallet-design-custom-wrap">
                  {customAmountEnabled && (
                    isCustom ? (
                      <div className="wallet-design-custom-input-wrap">
                        <input
                          ref={customAmountInputRef}
                          type="number"
                          min={0}
                          className="wallet-design-custom-input"
                          value={customAmount}
                          onChange={handleCustomAmountChange}
                          onKeyDown={handleCustomAmountKeyDown}
                          onBlur={handleCustomAmountBlur}
                          placeholder="输入金额"
                        />
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="wallet-design-custom-btn"
                        onClick={handleCustomFocus}
                      >
                        自定义
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 支付方式 */}
          <div className="wallet-design-form-row">
            <div className="wallet-design-form-label">支付方式</div>
            <div className="wallet-design-form-content">
              <div className="wallet-design-pay-grid">
                <button
                  type="button"
                  className={`wallet-design-pay-btn${payMethod === 'wechat' ? ' selected' : ''}`}
                  onClick={() => setPayMethod('wechat')}
                >
                  <WechatIcon />
                  <span>微信支付</span>
                </button>
                <button
                  type="button"
                  className={`wallet-design-pay-btn${payMethod === 'alipay' ? ' selected' : ''}`}
                  onClick={() => setPayMethod('alipay')}
                >
                  <AlipayIcon />
                  <span>支付宝</span>
                </button>
              </div>
            </div>
          </div>

          {/* 协议 */}
          <label className="wallet-design-agreement">
            <input
              type="checkbox"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
            />
            已阅读并同意
            <a href="/paid-service-agreement" target="_blank" rel="noopener noreferrer">
              《充值协议》
            </a>
          </label>

          {/* 错误提示 */}
          {errorMsg && (
            <div className="wallet-design-error-msg" role="alert">
              {errorMsg}
            </div>
          )}

          {/* 确认支付 */}
          <div className="wallet-design-submit-row">
            <button
              className="wallet-design-btn-submit"
              type="button"
              disabled={finalAmount <= 0 || !agreedToTerms || submitting}
              onClick={handleSubmitPay}
            >
              {submitting && <Loader2 size={16} className="wallet-design-spinner" />}
              {submitting ? '处理中...' : '确认支付'}
            </button>
          </div>
        </div>
      )}

      {/* 充值记录 */}
      {activeTab === 'records' && (
        <div
          className="wallet-design-tab-content"
          style={{
            flex: 1,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {isMobile ? (
            /* === 移动端卡片列表 === */
            <div style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: '0 4px' }}>
              {records.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#9CA3AF', padding: 40 }}>暂无充值记录</div>
              ) : (
                <div className="api-hub-mobile-card-list">
                  {records.map((r) => (
                    <div key={r.id} className="api-hub-mobile-card">
                      <div className="api-hub-mobile-card-header">
                        <span className="api-hub-mobile-card-title" style={{ fontFamily: 'monospace' }}>¥{r.money.toFixed(3)}</span>
                        <span className={`wallet-design-status ${STATUS_CLASS[r.status] ?? STATUS_CLASS.closed}`}>
                          {STATUS_LABEL[r.status] ?? r.status}
                        </span>
                      </div>
                      <div className="api-hub-mobile-card-row">
                        <span className="api-hub-mobile-card-label">充值时间</span>
                        <span className="api-hub-mobile-card-value" style={{ fontSize: 12 }}>{r.createdAt}</span>
                      </div>
                      <div className="api-hub-mobile-card-row">
                        <span className="api-hub-mobile-card-label">支付方式</span>
                        <span className="api-hub-mobile-card-value">{PAY_METHOD_LABEL[r.method] ?? r.method}</span>
                      </div>
                      <div className="api-hub-mobile-card-row">
                        <span className="api-hub-mobile-card-label">订单号</span>
                        <code className="wallet-design-code" style={{ fontSize: 11 }}>{r.orderId}</code>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* === 桌面端表格 === */
            <div
              className="wallet-design-table-wrap"
              style={{ flex: 1, minHeight: 0, overflow: 'auto' }}
            >
              <table className="wallet-design-table">
                <thead>
                  <tr>
                    <th>充值时间</th>
                    <th>金额</th>
                    <th>支付方式</th>
                    <th>状态</th>
                    <th>订单号</th>
                  </tr>
                </thead>
                <tbody>
                  {records.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', color: '#9CA3AF', padding: 40 }}>
                        暂无充值记录
                      </td>
                    </tr>
                  ) : (
                    records.map((r) => (
                      <tr key={r.id}>
                        <td>{r.createdAt}</td>
                        <td style={{ fontWeight: 500, fontFamily: 'monospace' }}>
                          ¥{r.money.toFixed(3)}
                        </td>
                        <td>{PAY_METHOD_LABEL[r.method] ?? r.method}</td>
                        <td>
                          <span
                            className={`wallet-design-status ${STATUS_CLASS[r.status] ?? STATUS_CLASS.closed}`}
                          >
                            {STATUS_LABEL[r.status] ?? r.status}
                          </span>
                        </td>
                        <td>
                          <code className="wallet-design-code">{r.orderId}</code>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <PayQrCodeModal
        open={payQr.open}
        orderId={payQr.orderId}
        orderPageUrl={payQr.orderPageUrl}
        amount={payQr.amount}
        payToken={payQr.payToken}
        onClose={handlePayQrClose}
        onRefresh={handlePayQrRefresh}
        onOrderPaid={handleOrderPaid}
      />
      <InvoiceModal open={invoiceOpen} onClose={() => setInvoiceOpen(false)} />
    </div>
  );
};

export default Wallet;
