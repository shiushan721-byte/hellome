import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { OrderDetail, JsapiPayParams } from './api';
import { fetchOrder, fetchStoredOpenId, fetchWechatOAuthUrl, wechatJsapiPrepay, alipayWapPay } from './api';
import './PayPage.css';

function isWeChatBrowser(): boolean {
  return /MicroMessenger/i.test(navigator.userAgent);
}

function liToYuan(li: number): string {
  const yuan = li / 1000;
  if (Number.isInteger(yuan)) return String(yuan);
  return parseFloat(yuan.toFixed(3)).toString();
}

/** 接口返回的 description 常带「xxx 50.000元」，与金额展示统一为 liToYuan 格式 */
function formatDescriptionYuanSuffix(description: string, amountLi: number): string {
  const formatted = liToYuan(amountLi);
  return description.replace(/\s*[\d.]+\s*元\s*$/, ` ${formatted}元`);
}

function waitForWeixinBridge(): Promise<void> {
  return new Promise((resolve) => {
    if ((window as any).WeixinJSBridge) {
      resolve();
      return;
    }
    const onReady = () => {
      document.removeEventListener('WeixinJSBridgeReady', onReady);
      resolve();
    };
    document.addEventListener('WeixinJSBridgeReady', onReady);
    setTimeout(() => {
      document.removeEventListener('WeixinJSBridgeReady', onReady);
      resolve();
    }, 5000);
  });
}

function invokeWechatPay(params: JsapiPayParams): Promise<'ok' | 'cancel' | 'fail'> {
  return new Promise((resolve) => {
    const bridge = (window as any).WeixinJSBridge;
    if (!bridge) {
      resolve('fail');
      return;
    }
    bridge.invoke(
      'getBrandWCPayRequest',
      {
        appId: params.appId,
        timeStamp: params.timeStamp,
        nonceStr: params.nonceStr,
        package: params.packageStr,
        signType: params.signType,
        paySign: params.paySign,
      },
      (res: any) => {
        if (res.err_msg === 'get_brand_wcpay_request:ok') {
          resolve('ok');
        } else if (res.err_msg === 'get_brand_wcpay_request:cancel') {
          resolve('cancel');
        } else {
          resolve('fail');
        }
      },
    );
  });
}

const FEATURES = ['即时到账', '灵活使用', '随处可用', '随时扩展'];

const TOAST_DURATION = 4000;

const PayPage = memo(() => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId') ?? '';
  const payToken = searchParams.get('payToken') ?? '';
  const urlOpenid = searchParams.get('openid') ?? '';
  const error = searchParams.get('error') ?? '';
  const errorMsg = searchParams.get('error_msg') ?? '';
  const alipayReturn = searchParams.get('alipay_return') ?? '';

  const isWeChat = useMemo(() => isWeChatBrowser(), []);

  const [cachedOpenid, setCachedOpenid] = useState('');
  const openid = urlOpenid || cachedOpenid;

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [message, setMessage] = useState('');
  const [authRedirecting, setAuthRedirecting] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const autoPayTriggeredRef = useRef(false);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), TOAST_DURATION);
  }, []);

  // 微信 OAuth 授权
  const startWeChatAuth = useCallback(
    (opts?: { setLoadingFalse?: boolean }) => {
      setAuthRedirecting(true);
      fetchWechatOAuthUrl(orderId, payToken)
        .then((url) => {
          if (url) {
            window.location.href = url;
            return;
          }
          if (opts?.setLoadingFalse) setLoading(false);
          setMessage('获取微信授权链接失败');
        })
        .catch((err: unknown) => {
          if (opts?.setLoadingFalse) setLoading(false);
          setMessage(err instanceof Error ? err.message : '获取微信授权链接失败');
        })
        .finally(() => {
          setAuthRedirecting(false);
        });
    },
    [orderId, payToken],
  );

  // 加载订单
  const loadOrder = useCallback(async () => {
    try {
      const detail = await fetchOrder(orderId, payToken);
      setOrder(detail);
    } catch {
      setMessage('订单加载失败');
    } finally {
      setLoading(false);
    }
  }, [orderId, payToken]);

  // 页面初始化：微信环境下先查缓存openid，有则直接用，无则走OAuth跳转
  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      setMessage('缺少订单号');
      return;
    }
    if (isWeChat && !openid && !error) {
      fetchStoredOpenId(orderId, payToken).then((stored) => {
        if (stored) {
          setCachedOpenid(stored);
          return;
        }
        startWeChatAuth({ setLoadingFalse: true });
      });
      return;
    }
    loadOrder();
  }, [orderId, openid, error, isWeChat, startWeChatAuth, loadOrder]);

  // 微信 JSAPI 支付（等待 Bridge 就绪）
  const handleWeChatPay = useCallback(async () => {
    if (!order || !openid) return;
    const params = await wechatJsapiPrepay(order.orderId, openid, payToken);

    await waitForWeixinBridge();

    const bridge = (window as any).WeixinJSBridge;
    if (bridge) {
      const result = await invokeWechatPay(params);
      if (result === 'ok') {
        setPaymentSuccess(true);
      } else if (result === 'cancel') {
        showToast('支付已取消');
      } else {
        showToast('微信支付调起失败，请点击按钮重试');
      }
    } else {
      showToast('微信支付环境未就绪，请点击按钮重试');
    }
  }, [order, openid, payToken, showToast]);

  // 支付宝 WAP 支付
  const handleAlipayPay = useCallback(async () => {
    if (!order) return;
    const payUrl = await alipayWapPay(order.orderId, payToken);
    if (payUrl) {
      window.location.href = payUrl;
    } else {
      showToast('获取支付宝支付链接失败');
    }
  }, [order, payToken, showToast]);

  // 统一支付入口
  const handlePay = useCallback(async () => {
    if (!order || paying) return;
    if (isWeChat && !openid) return;
    setPaying(true);
    try {
      if (isWeChat) {
        await handleWeChatPay();
      } else {
        await handleAlipayPay();
      }
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : '支付请求失败');
    } finally {
      setPaying(false);
    }
  }, [order, paying, isWeChat, openid, handleWeChatPay, handleAlipayPay, showToast]);

  // 用 ref 持有最新的 handlePay，避免自动支付 effect 因引用变化被 cleanup
  const handlePayRef = useRef(handlePay);
  useEffect(() => {
    handlePayRef.current = handlePay;
  }, [handlePay]);

  // 3 秒倒计时自动拉起支付
  useEffect(() => {
    if (!order || order.status !== 'pending') return;
    const canPayNow = isWeChat ? !!openid : true;
    if (!canPayNow || autoPayTriggeredRef.current) return;
    autoPayTriggeredRef.current = true;
    setCountdown(3);
    const tick = setInterval(() => {
      setCountdown((c) => {
        if (c === null || c <= 1) {
          clearInterval(tick);
          return null;
        }
        return c - 1;
      });
    }, 1000);
    const launchTimer = window.setTimeout(() => {
      handlePayRef.current();
    }, 3000);
    return () => {
      window.clearTimeout(launchTimer);
      clearInterval(tick);
    };
  }, [order, openid, isWeChat]);

  // 支付宝回跳后通过 SSE 实时接收支付结果，连接失败时降级为轮询
  useEffect(() => {
    if (!alipayReturn || !orderId) return;
    let cancelled = false;

    const onPaid = (detail?: OrderDetail) => {
      if (detail) {
        setOrder(detail);
      } else {
        setOrder((prev) => prev ? { ...prev, status: 'paid' } : prev);
      }
      setPaymentSuccess(true);
    };

    const startFallbackPolling = () => {
      const poll = async () => {
        for (let i = 0; i < 12; i++) {
          if (cancelled) return;
          await new Promise((r) => setTimeout(r, 2500));
          if (cancelled) return;
          try {
            const detail = await fetchOrder(orderId, payToken);
            if (detail.status === 'paid') {
              onPaid(detail);
              return;
            }
          } catch {
            // 继续轮询
          }
        }
      };
      poll();
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
    };
  }, [alipayReturn, orderId, payToken]);

  // ====== 渲染 ======

  const toastElement = toast && (
    <div className="pay-toast" role="alert">
      <div className="pay-toast-inner">
        <svg className="pay-toast-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <span>{toast}</span>
      </div>
    </div>
  );

  // 支付成功
  if (paymentSuccess) {
    return (
      <div className="pay-page pay-page-center">
        <div className="pay-result-icon pay-result-icon--success">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        </div>
        <p className="pay-result-title">支付成功</p>
        {order && <p className="pay-result-amount">¥{liToYuan(order.amount)}</p>}
        <p className="pay-result-desc">充值金额已到账，可关闭此页面</p>
      </div>
    );
  }

  // 加载中
  if (loading) {
    return (
      <div className="pay-page pay-page-center">
        <div className="pay-spinner" />
        <p className="pay-loading-text">加载订单中...</p>
      </div>
    );
  }

  // 错误（无订单）
  if (message && !order) {
    return (
      <div className="pay-page pay-page-center">
        <p className="pay-msg-text">{message}</p>
      </div>
    );
  }

  // 微信 OAuth 错误 + 有订单
  if (error && isWeChat) {
    return (
      <div className="pay-page pay-page-center">
        {toastElement}
        <p className="pay-error-text">授权失败{errorMsg ? `：${errorMsg}` : error ? `（${error}）` : ''}</p>
        {order && (
          <div className="pay-card" style={{ marginTop: 24, width: '100%', maxWidth: 400 }}>
            <p className="pay-card-desc">{formatDescriptionYuanSuffix(order.description, order.amount)}</p>
            <p className="pay-card-sub">金额: ¥{liToYuan(order.amount)}</p>
            <p className="pay-card-sub">状态: {order.status}</p>
            <button
              type="button"
              className="pay-btn pay-btn--primary"
              style={{ marginTop: 20, width: '100%' }}
              onClick={() => startWeChatAuth()}
              disabled={authRedirecting}
            >
              {authRedirecting ? '跳转中...' : '去微信授权'}
            </button>
          </div>
        )}
      </div>
    );
  }

  if (!order) return null;

  const isPending = order.status === 'pending';
  const canPay = isPending && (isWeChat ? !!openid : true);
  const amountYuan = liToYuan(order.amount);
  const orderTitleText = formatDescriptionYuanSuffix(order.description || '余额充值', order.amount);
  const payButtonText = isWeChat ? '微信支付' : '支付宝支付';

  return (
    <div className="pay-page pay-page-layout">
      {toastElement}

      {/* 可滚动内容区 */}
      <div className="pay-scroll-area">
        <div className="pay-content">
          {/* 订单卡片 */}
          <div className="pay-card">
            <div className="pay-card-header">
              <div className="pay-card-info">
                <p className="pay-card-title">{orderTitleText}</p>
                <p className="pay-card-company">江苏汇智智能数字科技有限公司</p>
                <p className="pay-card-order-id">订单号：{order.orderId}</p>
              </div>
              <div className="pay-card-check">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
            </div>
            <p className="pay-card-amount">¥{amountYuan}</p>
            <p className="pay-card-hint">智能体词元（token）工场算力调用余额</p>
          </div>

          {/* 特性标签 */}
          <div className="pay-features">
            {FEATURES.map((f) => (
              <div key={f} className="pay-feature-chip">
                <div className="pay-feature-icon">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <span className="pay-feature-text">{f}</span>
              </div>
            ))}
          </div>

          {/* 状态区域 */}
          {order.status === 'paid' && (
            <div className="pay-status-banner pay-status-banner--success">
              <p>支付成功</p>
            </div>
          )}
          {order.status === 'closed' && (
            <div className="pay-status-banner pay-status-banner--closed">
              <p>订单已关闭</p>
            </div>
          )}
          {alipayReturn && order.status === 'pending' && (
            <p className="pay-alipay-hint">支付结果确认中，请稍候刷新页面查看...</p>
          )}
          {message && isPending && (
            <p className="pay-error-inline">{message}</p>
          )}
        </div>
      </div>

      {/* 底部固定支付区域 */}
      {isPending && (
        <div className="pay-bottom-bar">
          <div className="pay-bottom-inner">
            {countdown !== null && countdown > 0 && !paying && (
              <p className="pay-countdown-text">
                {countdown} 秒后自动拉起{isWeChat ? '微信' : '支付宝'}支付...
              </p>
            )}
            {paying && (
              <p className="pay-countdown-text">正在拉起支付...</p>
            )}
            {canPay && (
              <button
                type="button"
                className="pay-btn pay-btn--primary pay-btn--full"
                onClick={handlePay}
                disabled={paying}
              >
                {paying && <span className="pay-btn-spinner" />}
                {payButtonText} · ¥{amountYuan}
              </button>
            )}
            {!canPay && isWeChat && (
              <button
                type="button"
                className="pay-btn pay-btn--primary pay-btn--full"
                onClick={() => startWeChatAuth()}
                disabled={authRedirecting}
              >
                {authRedirecting && <span className="pay-btn-spinner" />}
                去微信授权
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
});

PayPage.displayName = 'PayPage';
export default PayPage;
