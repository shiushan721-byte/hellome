import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Mock pricing data
const PRICING_PLANS = [
  {
    id: 'free',
    name: '免费版',
    price: 0,
    unit: '免费',
    description: '适合个人测试和小规模使用',
    features: [
      '100次/天 API调用',
      '基础模型支持',
      '标准响应速度',
      '社区支持',
    ],
    notIncluded: [
      '高峰时段优先',
      '专属客服',
      '自定义模型',
    ],
  },
  {
    id: 'pro',
    name: '专业版',
    price: 99,
    unit: '月',
    description: '适合开发者和小型团队',
    features: [
      '10000次/天 API调用',
      '全部模型支持',
      '优先响应速度',
      'API密钥管理',
      '使用统计',
      '邮件支持',
    ],
    notIncluded: [
      '专属客服',
      '自定义模型',
    ],
    popular: true,
  },
  {
    id: 'enterprise',
    name: '企业版',
    price: 999,
    unit: '月',
    description: '适合企业级大规模使用',
    features: [
      '无限API调用',
      '全部模型支持',
      '最快响应速度',
      'API密钥管理',
      '详细使用统计',
      '专属客服',
      '自定义模型',
      'SLA保障',
      '批量采购折扣',
    ],
    notIncluded: [],
  },
];

const MODEL_PRICES = [
  { name: 'GPT-4', price: '¥30/1M tokens', input: '¥30', output: '¥90' },
  { name: 'GPT-4o', price: '¥15/1M tokens', input: '¥15', output: '¥60' },
  { name: 'Claude-3', price: '¥25/1M tokens', input: '¥25', output: '¥75' },
  { name: 'DeepSeek-V3', price: '¥4/1M tokens', input: '¥4', output: '¥8' },
  { name: 'Qwen2.5', price: '¥2/1M tokens', input: '¥2', output: '¥6' },
];

export default function PricingPage() {
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState('pro');

  const handleSelectPlan = (planId: string) => {
    setSelectedPlan(planId);
    if (planId !== 'free') {
      navigate(`/pay-order?plan=${planId}`);
    }
  };

  return (
    <div className="min-h-screen py-12 px-4" style={{ backgroundColor: 'var(--bg-color, #f5f5f5)' }}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4" style={{ color: 'var(--text-color, #333)' }}>
            选择适合您的方案
          </h1>
          <p className="text-lg" style={{ color: 'var(--text-secondary, #666)' }}>
            灵活的定价方案，满足不同规模的需求
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {PRICING_PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-2xl p-6 transition-transform hover:scale-105 ${
                plan.popular ? 'ring-2' : ''
              }`}
              style={{
                backgroundColor: 'var(--card-bg, #fff)',
                ringColor: plan.popular ? 'var(--primary-color, #1890ff)' : 'transparent',
              }}
            >
              {plan.popular && (
                <div
                  className="absolute -top-3 left-1/2 transform -translate-x-1/2 px-3 py-1 rounded-full text-xs text-white font-medium"
                  style={{ backgroundColor: 'var(--primary-color, #1890ff)' }}
                >
                  最受欢迎
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-color, #333)' }}>
                  {plan.name}
                </h3>
                <div className="flex items-baseline justify-center">
                  <span className="text-4xl font-bold" style={{ color: 'var(--text-color, #333)' }}>
                    ¥{plan.price}
                  </span>
                  <span className="ml-1" style={{ color: 'var(--text-secondary, #666)' }}>
                    /{plan.unit}
                  </span>
                </div>
                <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary, #666)' }}>
                  {plan.description}
                </p>
              </div>

              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center text-sm">
                    <svg
                      className="w-4 h-4 mr-2 flex-shrink-0"
                      style={{ color: 'var(--success-color, #52c41a)' }}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span style={{ color: 'var(--text-color, #333)' }}>{feature}</span>
                  </li>
                ))}
                {plan.notIncluded.map((feature, i) => (
                  <li key={i} className="flex items-center text-sm opacity-50">
                    <svg
                      className="w-4 h-4 mr-2 flex-shrink-0"
                      style={{ color: 'var(--text-secondary, #999)' }}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span style={{ color: 'var(--text-secondary, #999)' }}>{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSelectPlan(plan.id)}
                className="w-full py-3 rounded-lg font-medium transition-colors"
                style={{
                  backgroundColor:
                    selectedPlan === plan.id || plan.popular
                      ? 'var(--primary-color, #1890ff)'
                      : 'transparent',
                  border: `1px solid ${
                    selectedPlan === plan.id || plan.popular
                      ? 'var(--primary-color, #1890ff)'
                      : 'var(--border-color, #d9d9d9)'
                  }`,
                  color:
                    selectedPlan === plan.id || plan.popular
                      ? '#fff'
                      : 'var(--text-color, #333)',
                }}
              >
                {plan.price === 0 ? '当前方案' : plan.id === 'enterprise' ? '联系我们' : '立即购买'}
              </button>
            </div>
          ))}
        </div>

        {/* Model Prices Table */}
        <div className="rounded-2xl p-6" style={{ backgroundColor: 'var(--card-bg, #fff)' }}>
          <h2 className="text-2xl font-semibold mb-6" style={{ color: 'var(--text-color, #333)' }}>
            模型价格明细
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr
                  className="border-b"
                  style={{ borderColor: 'var(--border-color, #e8e8e8)' }}
                >
                  <th
                    className="text-left py-3 px-4 font-medium"
                    style={{ color: 'var(--text-secondary, #666)' }}
                  >
                    模型
                  </th>
                  <th
                    className="text-right py-3 px-4 font-medium"
                    style={{ color: 'var(--text-secondary, #666)' }}
                  >
                    输入价格
                  </th>
                  <th
                    className="text-right py-3 px-4 font-medium"
                    style={{ color: 'var(--text-secondary, #666)' }}
                  >
                    输出价格
                  </th>
                  <th
                    className="text-right py-3 px-4 font-medium"
                    style={{ color: 'var(--text-secondary, #666)' }}
                  >
                    参考价格
                  </th>
                </tr>
              </thead>
              <tbody>
                {MODEL_PRICES.map((model, i) => (
                  <tr
                    key={i}
                    className="border-b"
                    style={{ borderColor: 'var(--border-color, #e8e8e8)' }}
                  >
                    <td className="py-3 px-4 font-medium" style={{ color: 'var(--text-color, #333)' }}>
                      {model.name}
                    </td>
                    <td className="py-3 px-4 text-right" style={{ color: 'var(--text-color, #333)' }}>
                      ¥{model.input}/1M tokens
                    </td>
                    <td className="py-3 px-4 text-right" style={{ color: 'var(--text-color, #333)' }}>
                      ¥{model.output}/1M tokens
                    </td>
                    <td className="py-3 px-4 text-right" style={{ color: 'var(--text-secondary, #666)' }}>
                      {model.price}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
