import React, { memo, useState, useEffect, useCallback, useRef } from 'react';
import { RefreshCw } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { fetchOrderStatus } from '../lib/api';
import './PayQrCodeModal.css';

const COUNTDOWN_SECONDS = 60;
const POLL_INTERVAL_MS = 2500;
const CLOSE_ICON = 'https://filefront.oss-cn-hangzhou.aliyuncs.com/0_web/gnomic/home/pay_dia_x.svg';
const WECHAT_ICON = 'https://filefront.oss-cn-hangzhou.aliyuncs.com/0_web/gnomic/home/weixin.png';
const ALIPAY_ICON = 'https://filefront.oss-cn-hangzhou.aliyuncs.com/0_web/gnomic/home/zhifubao.png';

const DEFAULT_NOTES = [
  'API 算力额度属于虚拟商品，专用于接口调用，一经充值不可提现或退款，请按需购买。',
  '未成年用户请在监护人陪同下理性充值，避免过度消费。',
];

export interface PayQrCodeModalProps {
  open: boolean;
  orderId: string;
  orderPageUrl: string;
  amount: number;
  payToken: string;
  onClose: () => void;
  onRefresh?: () => Promise<void>;
  onOrderPaid?: () => void;
}

const PayQrCodeModal: React.FC<PayQrCodeModalProps> = memo(
  ({ open, orderId, orderPageUrl, amount, payToken, onClose, onRefresh, onOrderPaid }) => {
    const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
    const [refreshing, setRefreshing] = useState(false);

    const onCloseRef = useRef(onClose);
    onCloseRef.current = onClose;
    const onOrderPaidRef = useRef(onOrderPaid);
    onOrderPaidRef.current = onOrderPaid;

    // 通过 SSE 实时接收订单支付状态，连接失败时降级为轮询
    useEffect(() => {
      if (!open || !orderId) return;
      let cancelled = false;
      let fallbackTimer: number | undefined;

      const onPaid = () => {
        onOrderPaidRef.current?.();
        onCloseRef.current();
      };

      const startFallbackPolling = () => {
        fallbackTimer = window.setInterval(async () => {
          try {
            const result = await fetchOrderStatus(orderId, payToken);
            if (cancelled) return;
            if (result.status === 'paid') {
              window.clearInterval(fallbackTimer);
              onPaid();
            }
          } catch {
            // 网络错误时继续轮询
          }
        }, POLL_INTERVAL_MS);
      };

      const url = `/api/payment/order/${encodeURIComponent(orderId)}/events?payToken=${encodeURIComponent(payToken)}`;
      const es = new EventSource(url);

      es.addEventListener('status', (e: MessageEvent) => {
        if (cancelled) return;
        try {
          const data = JSON.parse(e.data);
          if (data.status === 'paid') {
            es.close();
            onPaid();
          }
        } catch {
          /* ignore parse error */
        }
      });

      es.onerror = () => {
        es.close();
        if (cancelled) return;
        startFallbackPolling();
      };

      return () => {
        cancelled = true;
        es.close();
        if (fallbackTimer !== undefined) window.clearInterval(fallbackTimer);
      };
    }, [open, orderId, payToken]);

    // orderPageUrl 变化时重置倒计时
    useEffect(() => {
      if (open) {
        setCountdown(COUNTDOWN_SECONDS);
      }
    }, [open, orderPageUrl]);

    // 倒计时
    useEffect(() => {
      if (!open || countdown <= 0) return;
      const timer = window.setInterval(() => {
        setCountdown((prev) => (prev <= 1 ? 0 : prev - 1));
      }, 1000);
      return () => window.clearInterval(timer);
    }, [open, countdown]);

    const handleRefresh = useCallback(async () => {
      if (!onRefresh || refreshing) return;
      setRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
      }
    }, [onRefresh, refreshing]);

    if (!open) return null;

    const expired = countdown <= 0;

    return (
      <div className="pay-qr-modal-overlay" onClick={onClose}>
        <div className="pay-qr-modal-bg" onClick={(e) => e.stopPropagation()}>
          {/* 关闭按钮 */}
          <button className="pay-qr-close-btn" type="button" onClick={onClose}>
            <img src={CLOSE_ICON} alt="close" />
          </button>

          {/* 左侧：价格 + 二维码 + 支付方式 + 协议 */}
          <div className="pay-qr-left">
            {/* 金额 */}
            <div className="pay-qr-price">
              <span className="pay-qr-price-symbol">¥</span>
              <span className="pay-qr-price-value">{amount.toFixed(2)}</span>
            </div>

            {/* 二维码 */}
            <div
              className={`pay-qr-code-wrap${expired && onRefresh ? ' pay-qr-clickable' : ''}`}
              onClick={expired && onRefresh && !refreshing ? handleRefresh : undefined}
              onKeyDown={(e) => {
                if (expired && onRefresh && !refreshing && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault();
                  handleRefresh();
                }
              }}
              role={expired && onRefresh ? 'button' : undefined}
              tabIndex={expired && onRefresh ? 0 : undefined}
            >
              <QRCodeSVG
                value={orderPageUrl}
                size={156}
                level="M"
                className={expired ? 'pay-qr-expired' : ''}
              />
              {expired && onRefresh && (
                <div className="pay-qr-refresh-overlay">
                  <div className={`pay-qr-refresh-btn${refreshing ? ' spinning' : ''}`}>
                    <RefreshCw size={18} />
                  </div>
                  <span className="pay-qr-refresh-label">
                    {refreshing ? '刷新中…' : '点击刷新'}
                  </span>
                </div>
              )}
            </div>

            {/* 倒计时 / 过期提示 */}
            <p className={`pay-qr-countdown${expired ? ' pay-qr-countdown--expired' : ''}`}>
              {expired ? '二维码已失效' : `${countdown} 秒后二维码失效`}
            </p>

            {/* 支付方式图标提示 */}
            <div className="pay-qr-hint">
              <span>使用</span>
              <img src={WECHAT_ICON} alt="WeChat" />
              <span>微信/</span>
              <img src={ALIPAY_ICON} alt="Alipay" />
              <span>支付宝</span>
              <span>扫码支付</span>
            </div>

            {/* 协议 */}
            <div className="pay-qr-agreement">
              <span>支付即视为你同意</span>
              <br />
              <a href="/paid-service-agreement" target="_blank" rel="noopener noreferrer">
                《付费服务协议》
              </a>
            </div>
          </div>

          {/* 右侧：套餐信息 + 说明条款 */}
          <div className="pay-qr-right">
            {/* 标题区块 */}
            <div className="pay-qr-right-header">
              <h3 className="pay-qr-right-title">算力额度充值</h3>
            </div>

            {/* 描述文字块 */}
            <div className="pay-qr-right-desc-box">
              本余额用于抵扣平台提供的 AI 大模型调用费用。系统将根据您选择的模型计费标准，按实际消耗的 Token（字符单位）实时扣费，确保计量精准透明。
            </div>

            {/* 说明条款 */}
            <div className="pay-qr-notes">
              {DEFAULT_NOTES.map((note, idx) => (
                <div key={idx} className="pay-qr-note-item">
                  <span className="pay-qr-note-dot" />
                  <span>{note}</span>
                </div>
              ))}
            </div>

            {/* 商品信息卡片 */}
            <div className="pay-qr-goods-card">
              <div className="pay-qr-goods-row">
                <span className="pay-qr-goods-label">物品名称</span>
                <span className="pay-qr-goods-value">智能体词元（token）工场算力调用余额</span>
              </div>
              <div className="pay-qr-goods-row">
                <span className="pay-qr-goods-label">收款方</span>
                <span className="pay-qr-goods-value">江苏汇智智能数字科技有限公司</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  },
);

PayQrCodeModal.displayName = 'PayQrCodeModal';
export default PayQrCodeModal;
