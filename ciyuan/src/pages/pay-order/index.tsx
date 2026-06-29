import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

// Mock data
const PLANS = {
  free: { name: '免费版', price: 0 },
  pro: { name: '专业版', price: 99 },
  enterprise: { name: '企业版', price: 999 },
};

const PAYMENT_METHODS = [
  { id: 'alipay', name: '支付宝', icon: '💳' },
  { id: 'wechat', name: '微信支付', icon: '💬' },
  { id: 'bank', name: '银行卡', icon: '🏦' },
];

export default function PayOrderPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const planId = searchParams.get('plan') || 'pro';

  const plan = PLANS[planId as keyof typeof PLANS] || PLANS.pro;
  const [paymentMethod, setPaymentMethod] = useState('alipay');
  const [loading, setLoading] = useState(false);

  const handlePay = async () => {
    setLoading(true);
    // Mock: 模拟支付
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setLoading(false);

    // 支付成功，跳转到账单管理
    navigate('/billing-manage');
  };

  return (
    <div className="min-h-screen py-12 px-4" style={{ backgroundColor: 'var(--bg-color, #f5f5f5)' }}>
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-color, #333)' }}>
            确认订单
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary, #666)' }}>
            智能体词元(Token)工场
          </p>
        </div>

        {/* Order Info */}
        <div
          className="rounded-2xl p-6 mb-6"
          style={{ backgroundColor: 'var(--card-bg, #fff)' }}
        >
          <div className="flex justify-between items-center mb-4 pb-4 border-b" style={{ borderColor: 'var(--border-color, #e8e8e8)' }}>
            <span className="font-medium" style={{ color: 'var(--text-color, #333)' }}>
              {plan.name}
            </span>
            <span className="text-2xl font-bold" style={{ color: 'var(--primary-color, #1890ff)' }}>
              ¥{plan.price}
            </span>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span style={{ color: 'var(--text-secondary, #666)' }}>支付方式</span>
              <span style={{ color: 'var(--text-color, #333)' }}>月付</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: 'var(--text-secondary, #666)' }}>额度说明</span>
              <span style={{ color: 'var(--text-color, #333)' }}>余额可用于token消费</span>
            </div>
          </div>
        </div>

        {/* Payment Method */}
        <div
          className="rounded-2xl p-6 mb-6"
          style={{ backgroundColor: 'var(--card-bg, #fff)' }}
        >
          <h3 className="font-medium mb-4" style={{ color: 'var(--text-color, #333)' }}>
            选择支付方式
          </h3>
          <div className="space-y-3">
            {PAYMENT_METHODS.map((method) => (
              <label
                key={method.id}
                className={`flex items-center p-4 rounded-lg cursor-pointer transition-colors ${
                  paymentMethod === method.id ? 'ring-2' : ''
                }`}
                style={{
                  backgroundColor: 'var(--bg-color, #f5f5f5)',
                  border: paymentMethod === method.id ? '2px solid var(--primary-color, #1890ff)' : '1px solid var(--border-color, #e8e8e8)',
                }}
              >
                <input
                  type="radio"
                  name="payment"
                  value={method.id}
                  checked={paymentMethod === method.id}
                  onChange={() => setPaymentMethod(method.id)}
                  className="sr-only"
                />
                <span className="text-2xl mr-3">{method.icon}</span>
                <span className="flex-1 font-medium" style={{ color: 'var(--text-color, #333)' }}>
                  {method.name}
                </span>
                {paymentMethod === method.id && (
                  <svg
                    className="w-5 h-5"
                    style={{ color: 'var(--primary-color, #1890ff)' }}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </label>
            ))}
          </div>
        </div>

        {/* Pay Button */}
        <button
          onClick={handlePay}
          disabled={loading}
          className="w-full py-4 rounded-xl font-medium text-white text-lg transition-opacity"
          style={{
            backgroundColor: 'var(--primary-color, #1890ff)',
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? '处理中...' : `支付 ¥${plan.price}`}
        </button>

        {/* Notice */}
        <p className="mt-4 text-center text-xs" style={{ color: 'var(--text-secondary, #999)' }}>
          支付即表示您同意我们的服务条款
        </p>
      </div>
    </div>
  );
}