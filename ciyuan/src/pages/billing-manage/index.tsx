import { useState } from 'react';

// Mock billing data
const MOCK_BILLS = [
  { id: '1', date: '2024-01-15', amount: 99, status: 'paid', plan: '专业版', method: '支付宝' },
  { id: '2', date: '2023-12-15', amount: 99, status: 'paid', plan: '专业版', method: '支付宝' },
  { id: '3', date: '2023-11-15', amount: 99, status: 'paid', plan: '专业版', method: '微信支付' },
  { id: '4', date: '2023-10-15', amount: 0, status: 'paid', plan: '免费版', method: '-' },
];

const MOCK_USAGE = {
  totalCalls: 8542,
  limitCalls: 10000,
  totalTokens: 1250000,
  limitTokens: 2000000,
  period: '2024-01-01 ~ 2024-01-31',
};

export default function BillingManagePage() {
  const [activeTab, setActiveTab] = useState<'bills' | 'usage'>('bills');

  return (
    <div className="min-h-screen py-12 px-4" style={{ backgroundColor: 'var(--bg-color, #f5f5f5)' }}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-color, #333)' }}>
            账单管理
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary, #666)' }}>
            查看您的消费记录和使用情况
          </p>
        </div>

        {/* Current Plan Card */}
        <div
          className="rounded-2xl p-6 mb-6"
          style={{ backgroundColor: 'var(--card-bg, #fff)' }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm mb-1" style={{ color: 'var(--text-secondary, #666)' }}>
                当前套餐
              </p>
              <h2 className="text-2xl font-bold" style={{ color: 'var(--text-color, #333)' }}>
                专业版
              </h2>
            </div>
            <div className="text-right">
              <p className="text-sm mb-1" style={{ color: 'var(--text-secondary, #666)' }}>
                下次扣费
              </p>
              <p className="text-xl font-semibold" style={{ color: 'var(--primary-color, #1890ff)' }}>
                ¥99/月
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab('bills')}
            className="px-6 py-2 rounded-lg font-medium transition-colors"
            style={{
              backgroundColor: activeTab === 'bills' ? 'var(--primary-color, #1890ff)' : 'transparent',
              color: activeTab === 'bills' ? '#fff' : 'var(--text-color, #333)',
              border: activeTab === 'bills' ? 'none' : '1px solid var(--border-color, #d9d9d9)',
            }}
          >
            账单记录
          </button>
          <button
            onClick={() => setActiveTab('usage')}
            className="px-6 py-2 rounded-lg font-medium transition-colors"
            style={{
              backgroundColor: activeTab === 'usage' ? 'var(--primary-color, #1890ff)' : 'transparent',
              color: activeTab === 'usage' ? '#fff' : 'var(--text-color, #333)',
              border: activeTab === 'usage' ? 'none' : '1px solid var(--border-color, #d9d9d9)',
            }}
          >
            使用统计
          </button>
        </div>

        {/* Content */}
        {activeTab === 'bills' && (
          <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: 'var(--card-bg, #fff)' }}>
            <table className="w-full">
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-color, #f5f5f5)' }}>
                  <th className="text-left py-4 px-6 font-medium" style={{ color: 'var(--text-secondary, #666)' }}>
                    日期
                  </th>
                  <th className="text-left py-4 px-6 font-medium" style={{ color: 'var(--text-secondary, #666)' }}>
                    套餐
                  </th>
                  <th className="text-left py-4 px-6 font-medium" style={{ color: 'var(--text-secondary, #666)' }}>
                    支付方式
                  </th>
                  <th className="text-right py-4 px-6 font-medium" style={{ color: 'var(--text-secondary, #666)' }}>
                    金额
                  </th>
                  <th className="text-right py-4 px-6 font-medium" style={{ color: 'var(--text-secondary, #666)' }}>
                    状态
                  </th>
                </tr>
              </thead>
              <tbody>
                {MOCK_BILLS.map((bill) => (
                  <tr
                    key={bill.id}
                    className="border-t"
                    style={{ borderColor: 'var(--border-color, #e8e8e8)' }}
                  >
                    <td className="py-4 px-6" style={{ color: 'var(--text-color, #333)' }}>
                      {bill.date}
                    </td>
                    <td className="py-4 px-6" style={{ color: 'var(--text-color, #333)' }}>
                      {bill.plan}
                    </td>
                    <td className="py-4 px-6" style={{ color: 'var(--text-color, #333)' }}>
                      {bill.method}
                    </td>
                    <td className="py-4 px-6 text-right font-medium" style={{ color: 'var(--text-color, #333)' }}>
                      ¥{bill.amount}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <span
                        className="px-2 py-1 rounded text-xs"
                        style={{
                          backgroundColor: 'rgba(82, 196, 26, 0.1)',
                          color: '#52c41a',
                        }}
                      >
                        已支付
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'usage' && (
          <div className="space-y-6">
            {/* Period */}
            <div className="text-sm text-center py-4" style={{ color: 'var(--text-secondary, #666)' }}>
              统计周期：{MOCK_USAGE.period}
            </div>

            {/* API Calls */}
            <div className="rounded-2xl p-6" style={{ backgroundColor: 'var(--card-bg, #fff)' }}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-medium" style={{ color: 'var(--text-color, #333)' }}>
                  API 调用次数
                </h3>
                <span className="text-sm" style={{ color: 'var(--text-secondary, #666)' }}>
                  {MOCK_USAGE.totalCalls.toLocaleString()} / {MOCK_USAGE.limitCalls.toLocaleString()}
                </span>
              </div>
              <div className="h-3 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-color, #f5f5f5)' }}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${(MOCK_USAGE.totalCalls / MOCK_USAGE.limitCalls) * 100}%`,
                    backgroundColor: 'var(--primary-color, #1890ff)',
                  }}
                />
              </div>
            </div>

            {/* Tokens */}
            <div className="rounded-2xl p-6" style={{ backgroundColor: 'var(--card-bg, #fff)' }}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-medium" style={{ color: 'var(--text-color, #333)' }}>
                  Token 使用量
                </h3>
                <span className="text-sm" style={{ color: 'var(--text-secondary, #666)' }}>
                  {MOCK_USAGE.totalTokens.toLocaleString()} / {MOCK_USAGE.limitTokens.toLocaleString()}
                </span>
              </div>
              <div className="h-3 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-color, #f5f5f5)' }}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${(MOCK_USAGE.totalTokens / MOCK_USAGE.limitTokens) * 100}%`,
                    backgroundColor: 'var(--success-color, #52c41a)',
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}