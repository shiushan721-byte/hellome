import { useCallback, useEffect, useMemo, useState } from 'react';
import InvoiceModal from '../components/InvoiceModal';
import SupportContactModal from '../components/SupportContactModal';
import { Info, Wallet, Plus, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useIsMobile } from '../../../hooks/useIsMobile';
import { DatePicker } from '../components/DatePicker';
import { Dropdown } from '../components/Dropdown';
import type { DropdownOption } from '../components/Dropdown';
import type {
  ApiKeySummary,
  DailyBillingRow,
  ProductBillingRow,
  RequestLogRow,
  UserBalance,
  PaginatedResult,
} from '../lib/api';
import {
  fetchApiKeys,
  fetchBillingByProduct,
  fetchBillingDaily,
  fetchRequestLogs,
  fetchUserBalance,
} from '../lib/api';
import '../api-hub.css';

type TabKey = 'daily' | 'product' | 'request';

/* ---- 骨架屏 ---- */
const SKELETON_BILLING_COUNT = 5;

function SkeletonBillingRow({ cells }: { cells: number }) {
  return (
    <div className="api-hub-skeleton-billing-row">
      <div className="api-hub-skeleton-block api-hub-skeleton-billing-cell-wide" />
      {Array.from({ length: cells - 1 }).map((_, i) => (
        <div key={i} className="api-hub-skeleton-block api-hub-skeleton-billing-cell" />
      ))}
    </div>
  );
}

function SkeletonMobileCard({ rows }: { rows: number }) {
  return (
    <div className="api-hub-skeleton-mobile-card">
      <div className="api-hub-skeleton-mobile-card-header">
        <div className="api-hub-skeleton-block api-hub-skeleton-mobile-card-title" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="api-hub-skeleton-mobile-card-row">
          <div className="api-hub-skeleton-block api-hub-skeleton-mobile-card-label" />
          <div className="api-hub-skeleton-block api-hub-skeleton-mobile-card-value" />
        </div>
      ))}
    </div>
  );
}

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getDefaultRange(): { from: string; to: string } {
  const now = new Date();
  const to = formatDate(now);
  const fromDate = new Date(now);
  fromDate.setDate(fromDate.getDate() - 30);
  return { from: formatDate(fromDate), to };
}

function fmtBillingAmount(n: number | undefined, digits: number): string {
  return n != null && Number.isFinite(n) ? n.toFixed(digits) : '—';
}

function fmtBillingDelta(n: number | undefined, digits: number): string {
  if (n == null || !Number.isFinite(n)) return '—';
  if (n === 0) return '0';
  return n.toFixed(digits);
}

function normalizeRequestBillingType(billingType?: string | null): string {
  return (billingType ?? '').trim().toLowerCase();
}

function isImageTokenRequestBilling(billingType?: string | null): boolean {
  const normalized = normalizeRequestBillingType(billingType);
  return normalized === 'image_token' || normalized.includes('image_token');
}

function getRequestUsageText(r: RequestLogRow): string {
  const billingType = normalizeRequestBillingType(r.billingType);
  if (isImageTokenRequestBilling(billingType)) {
    return `输入 ${(r.imageInputTokens || 0).toLocaleString()} / 输出 ${(r.imageOutputTokens || 0).toLocaleString()}`;
  }
  if (billingType === 'image') {
    return `${r.imageCount || 0} 张`;
  }
  if (billingType === 'video_spec') {
    const seconds = r.videoSeconds || r.durationSeconds || 0;
    return `${seconds.toLocaleString()} 秒`;
  }
  if (billingType === 'video_token') {
    const totalTokens = (r.inputTokens || 0) + (r.outputTokens || 0);
    return `${totalTokens.toLocaleString()} tokens`;
  }
  if (billingType === 'audio_speech') {
    const chars = r.inputTextCharacters || 0;
    // const wan = chars / 10000;
    return `${chars.toLocaleString()} 字符`;
  }
  return `输入 ${r.inputTokens.toLocaleString()} / 输出 ${r.outputTokens.toLocaleString()} / 缓存 ${r.cacheTokens.toLocaleString()}`;
}

function getRequestBillingUnitText(r: RequestLogRow): string {
  const billingType = normalizeRequestBillingType(r.billingType);
  if (isImageTokenRequestBilling(billingType)) return '元/百万tokens';
  if (billingType === 'image') return '元/张';
  if (billingType === 'video_spec') return '元/秒';
  if (billingType === 'audio_speech') return '元/万字符';
  return '元/百万tokens';
}

function getRequestDiscountAmount(r: RequestLogRow): number | undefined {
  if (r.originalPriceCny == null || r.consumptionCny == null) return undefined;
  return r.consumptionCny - r.originalPriceCny;
}

/** 百分比展示（BillingDailyVO.discountPercent 等） */
function fmtPercent(v: number | null | undefined): string {
  if (v == null || !Number.isFinite(Number(v))) return '—';
  const n = Number(v);
  return `${Number.isInteger(n) ? n : n.toFixed(2)}%`;
}

export default function LogsBilling() {
  const isMobile = useIsMobile();
  const { isLogin, requireAuth } = useAuth();
  const navigate = useNavigate();
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('daily');
  const [balance, setBalance] = useState<UserBalance | null>(null);
  const [apiKeys, setApiKeys] = useState<ApiKeySummary[]>([]);
  const [selectedKey, setSelectedKey] = useState('all');

  const defaultRange = useMemo(() => getDefaultRange(), []);
  const [dateFrom, setDateFrom] = useState(defaultRange.from);
  const [dateTo, setDateTo] = useState(defaultRange.to);

  const [dailyData, setDailyData] = useState<PaginatedResult<DailyBillingRow>>({
    items: [],
    total: 0,
    page: 1,
    pageSize: 20,
  });
  const [productData, setProductData] = useState<PaginatedResult<ProductBillingRow>>({
    items: [],
    total: 0,
    page: 1,
    pageSize: 20,
  });
  const [requestData, setRequestData] = useState<PaginatedResult<RequestLogRow>>({
    items: [],
    total: 0,
    page: 1,
    pageSize: 20,
  });
  const [loading, setLoading] = useState(true);

  const [dailyPage, setDailyPage] = useState(1);
  const [productPage, setProductPage] = useState(1);
  const [requestPage, setRequestPage] = useState(1);

  useEffect(() => {
    if (!isLogin) return;
    const loadInitial = () => {
      fetchUserBalance()
        .then(setBalance)
        .catch(() => setBalance({ balance: 0, totalGiftCredit: 0, totalRecharge: 0, totalConsumption: 0 }));
      fetchApiKeys({ masked: false })
        .then(setApiKeys)
        .catch(() => setApiKeys([]));
    };
    loadInitial();

    const handleLoginSuccess = () => loadInitial();
    window.addEventListener('login-success', handleLoginSuccess);
    return () => window.removeEventListener('login-success', handleLoginSuccess);
  }, [isLogin]);

  const keyOptions = useMemo<DropdownOption[]>(() => {
    const opts: DropdownOption[] = [{ label: '全部 API Key', value: 'all' }];
    for (const k of apiKeys) {
      opts.push({ label: k.name, value: k.apiKey });
    }
    return opts;
  }, [apiKeys]);

  const loadData = useCallback(async () => {
    if (!isLogin) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const apiKey = selectedKey === 'all' ? undefined : selectedKey;
      if (activeTab === 'daily') {
        const data = await fetchBillingDaily({
          dateFrom,
          dateTo,
          apiKey,
          page: dailyPage,
          pageSize: 20,
        });
        setDailyData(data);
      } else if (activeTab === 'product') {
        const data = await fetchBillingByProduct({
          dateFrom,
          dateTo,
          apiKey,
          page: productPage,
          pageSize: 20,
        });
        setProductData(data);
      } else {
        const data = await fetchRequestLogs({
          dateFrom,
          dateTo,
          apiKey,
          page: requestPage,
          pageSize: 20,
        });
        setRequestData(data);
      }
    } catch (err) {
      console.error('Failed to load billing data:', err);
    } finally {
      setLoading(false);
    }
  }, [isLogin, activeTab, dateFrom, dateTo, selectedKey, dailyPage, productPage, requestPage]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleTabChange = useCallback((tab: TabKey) => {
    if (!requireAuth()) return;
    setActiveTab(tab);
    if (tab === 'daily') setDailyPage(1);
    else if (tab === 'product') setProductPage(1);
    else setRequestPage(1);
  }, [requireAuth]);

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'daily', label: '日账单' },
    { key: 'product', label: '产品账单' },
    { key: 'request', label: '请求明细' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      {/* 页面标题 */}
      <div style={{ marginBottom: 24, flexShrink: 0 }}>
        <h1 className="api-hub-page-title">计费明细</h1>
        <p className="api-hub-page-subtitle">查看详细的账单流水与请求日志</p>
      </div>

      {/* 账户总览卡片 */}
      <div className="api-hub-table-wrap api-hub-overview-card" style={{ flexShrink: 0 }}>
        <div className="api-hub-overview-header">
          <div className="api-hub-overview-title-wrap">
            <div className="api-hub-overview-icon">
              <Wallet size={20} />
            </div>
            <span className="api-hub-overview-title">账户总览</span>
          </div>
          <div className="api-hub-overview-actions">
            {/* <button
              type="button"
              className="api-hub-overview-support-btn"
              onClick={() => setSupportOpen(true)}
            >
              <MessageCircle size={14} strokeWidth={2} />
              账单疑问？联系客服
            </button> */}
            <button
              type="button"
              className="api-hub-overview-action-btn"
              onClick={() => navigate('/hub/wallet')}
            >
              <Plus size={14} />
              充值
            </button>
            <button
              type="button"
              className="api-hub-overview-action-btn"
              onClick={() => setInvoiceOpen(true)}
            >
              <FileText size={14} />
              去开票
            </button>
          </div>
        </div>
        <div className="api-hub-overview-grid">
          <div>
            <p className="api-hub-stat-label">可用余额</p>
            {balance === null ? (
              <div className="api-hub-skeleton-block api-hub-skeleton-stat" />
            ) : (
              <p className="api-hub-stat-value">
                ¥ {balance.balance?.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
              </p>
            )}
          </div>
          <div>
            <p className="api-hub-stat-label">赠送额度</p>
            {balance === null ? (
              <div className="api-hub-skeleton-block api-hub-skeleton-stat" />
            ) : (
              <p className="api-hub-stat-value">
                ¥ {balance.totalGiftCredit?.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
              </p>
            )}
          </div>
          <div>
            <p className="api-hub-stat-label">累计充值</p>
            {balance === null ? (
              <div className="api-hub-skeleton-block api-hub-skeleton-stat" />
            ) : (
              <p className="api-hub-stat-value">
                ¥ {balance.totalRecharge?.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
              </p>
            )}
          </div>
          <div>
            <p className="api-hub-stat-label">累计消费</p>
            {balance === null ? (
              <div className="api-hub-skeleton-block api-hub-skeleton-stat" />
            ) : (
              <p className="api-hub-stat-value">
                ¥ {balance.totalConsumption?.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Tabs + Content Card */}
      <div
        className="api-hub-table-wrap"
        style={{
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          minHeight: 0,
        }}
      >
        {/* Tabs */}
        <div className="api-hub-tabs" style={{ flexShrink: 0 }}>
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`api-hub-tab${activeTab === tab.key ? ' active' : ''}`}
              onClick={() => handleTabChange(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          {/* 筛选区 */}
          <div className="api-hub-filter-bar" style={{ flexShrink: 0 }}>
            <DatePicker value={dateFrom} onChange={setDateFrom} placeholder="开始日期" />
            <span className="api-hub-filter-separator">至</span>
            <DatePicker value={dateTo} onChange={setDateTo} placeholder="结束日期" />
            <Dropdown options={keyOptions} value={selectedKey} onChange={setSelectedKey} />
          </div>

          {/* 提示条 */}
          <div className="api-hub-info-bar" style={{ marginBottom: 16, flexShrink: 0 }}>
            <Info size={14} style={{ flexShrink: 0 }} />
            <span style={{ fontSize: 12 }}>
              {activeTab === 'daily' && '该表展示按日期统计的原价、综合折扣(加权)与实扣金额。综合折扣为当日多模型调用按原价金额加权后的结果，不代表单一模型折扣。'}
              {activeTab === 'product' && '该表按模型统计真实结算口径。模型折扣可与商务协议折扣不同，受模型配置与调用结构影响。'}
              {activeTab === 'request' &&
                '仅支持查询 30 天内的请求日志。请求明细为最终结算底账；日账单与产品账单均由此聚合。'}
            </span>
          </div>

          {/* 表格区 */}
          <div
            className="api-hub-table-wrap"
            style={{
              opacity: loading ? 0.6 : 1,
              transition: 'opacity 0.2s',
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
              minHeight: 0,
              overflow: 'hidden',
            }}
          >
            {activeTab === 'daily' && (
              <DailyTable data={dailyData} page={dailyPage} onPageChange={setDailyPage} isMobile={isMobile} loading={loading} />
            )}
            {activeTab === 'product' && (
              <ProductTable data={productData} page={productPage} onPageChange={setProductPage} isMobile={isMobile} loading={loading} />
            )}
            {activeTab === 'request' && (
              <RequestTable data={requestData} page={requestPage} onPageChange={setRequestPage} isMobile={isMobile} loading={loading} />
            )}
          </div>
        </div>
      </div>

      <InvoiceModal open={invoiceOpen} onClose={() => setInvoiceOpen(false)} />
      <SupportContactModal open={supportOpen} onClose={() => setSupportOpen(false)} />
    </div>
  );
}

/* ====== 子表格组件 ====== */

interface TablePaginationProps {
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

function TablePagination({ total, page, pageSize, onPageChange }: TablePaginationProps) {
  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) return null;

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'center',
        padding: '12px 16px',
        gap: 8,
        borderTop: '1px solid #e5e7eb',
      }}
    >
      <span style={{ fontSize: 13, color: '#6b7280' }}>共 {total} 条</span>
      <button
        type="button"
        className="api-hub-btn-secondary"
        style={{ padding: '4px 8px', fontSize: 12 }}
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        上一页
      </button>
      <span style={{ fontSize: 13, color: '#374151' }}>
        {page} / {totalPages}
      </span>
      <button
        type="button"
        className="api-hub-btn-secondary"
        style={{ padding: '4px 8px', fontSize: 12 }}
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        下一页
      </button>
    </div>
  );
}

interface DailyTableProps {
  data: PaginatedResult<DailyBillingRow>;
  page: number;
  onPageChange: (page: number) => void;
  isMobile?: boolean;
  loading?: boolean;
}

function DailyTable({ data, page, onPageChange, isMobile, loading }: DailyTableProps) {
  const { items, total, pageSize } = data;
  if (isMobile) {
    return (
      <>
        <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
          {loading && items.length === 0 ? (
            Array.from({ length: SKELETON_BILLING_COUNT }).map((_, i) => <SkeletonMobileCard key={i} rows={3} />)
          ) : items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>暂无数据</div>
          ) : (
            <div className="api-hub-mobile-card-list">
              {items.map((r) => (
                <div key={r.date} className="api-hub-mobile-card">
                  <div className="api-hub-mobile-card-header">
                    <span className="api-hub-mobile-card-title">{r.date}</span>
                  </div>
                  <div className="api-hub-mobile-card-row">
                    <span className="api-hub-mobile-card-label">消费金额（元）</span>
                    <span className="api-hub-mobile-card-value">{r.consumptionCny.toFixed(4)}</span>
                  </div>
                  <div className="api-hub-mobile-card-row">
                    <span className="api-hub-mobile-card-label">原价总额（元）</span>
                    <span className="api-hub-mobile-card-value">{fmtBillingAmount(r.originalPriceCny, 4)}</span>
                  </div>
                  <div className="api-hub-mobile-card-row">
                    <span className="api-hub-mobile-card-label">综合折扣（%）</span>
                    <span className="api-hub-mobile-card-value">{fmtPercent(r.discountPercent ?? undefined)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <TablePagination total={total} page={page} pageSize={pageSize} onPageChange={onPageChange} />
      </>
    );
  }
  return (
    <>
      <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
        <table className="api-hub-table" style={{ whiteSpace: 'nowrap', minWidth: 760 }}>
          <thead>
            <tr>
              <th>账单日期</th>
              <th style={{ textAlign: 'right' }}>消费金额（元）</th>
              <th style={{ textAlign: 'right' }}>原价总额（元）</th>
              <th style={{ textAlign: 'right' }}>综合折扣（%）</th>
            </tr>
          </thead>
          <tbody>
            {loading && items.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ padding: 0 }}>
                  {Array.from({ length: SKELETON_BILLING_COUNT }).map((_, i) => (
                    <SkeletonBillingRow key={i} cells={4} />
                  ))}
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={4} className="api-hub-table-empty">
                  暂无数据
                </td>
              </tr>
            ) : (
              items.map((r) => (
                <tr key={r.date}>
                  <td className="api-hub-table-mono">{r.date}</td>
                  <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                    {r.consumptionCny.toFixed(4)}
                  </td>
                  <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                    {fmtBillingAmount(r.originalPriceCny, 4)}
                  </td>
                  <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                    {fmtPercent(r.discountPercent ?? undefined)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <TablePagination total={total} page={page} pageSize={pageSize} onPageChange={onPageChange} />
    </>
  );
}

interface ProductTableProps {
  data: PaginatedResult<ProductBillingRow>;
  page: number;
  onPageChange: (page: number) => void;
  isMobile?: boolean;
  loading?: boolean;
}

function ProductTable({ data, page, onPageChange, isMobile, loading }: ProductTableProps) {
  const { items, total, pageSize } = data;
  if (isMobile) {
    return (
      <>
        <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
          {loading && items.length === 0 ? (
            Array.from({ length: SKELETON_BILLING_COUNT }).map((_, i) => <SkeletonMobileCard key={i} rows={4} />)
          ) : items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>暂无数据</div>
          ) : (
            <div className="api-hub-mobile-card-list">
              {items.map((r, idx) => (
                <div key={`${r.modelName}-${idx}`} className="api-hub-mobile-card">
                  <div className="api-hub-mobile-card-header">
                    <span className="api-hub-mobile-card-title">{r.modelName}</span>
                    <span className="api-hub-tag" style={{ fontSize: 11 }}>
                      {r.productType || '—'}
                    </span>
                  </div>
                  <div className="api-hub-mobile-card-row">
                    <span className="api-hub-mobile-card-label">消费金额（元）</span>
                    <span className="api-hub-mobile-card-value">{r.consumptionCny.toFixed(4)}</span>
                  </div>
                  <div className="api-hub-mobile-card-row">
                    <span className="api-hub-mobile-card-label">原价总额（元）</span>
                    <span className="api-hub-mobile-card-value">{fmtBillingAmount(r.originalPriceCny, 4)}</span>
                  </div>
                  <div className="api-hub-mobile-card-row">
                    <span className="api-hub-mobile-card-label">模型折扣（%）</span>
                    <span className="api-hub-mobile-card-value">{fmtPercent(r.modelDiscount ?? undefined)}</span>
                  </div>
                  <div className="api-hub-mobile-card-row">
                    <span className="api-hub-mobile-card-label">模型分组 ID</span>
                    <span className="api-hub-mobile-card-value api-hub-table-mono" style={{ fontSize: 12 }}>
                      {r.modelGroupId ?? '—'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <TablePagination total={total} page={page} pageSize={pageSize} onPageChange={onPageChange} />
      </>
    );
  }
  return (
    <>
      <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
        <table className="api-hub-table" style={{ whiteSpace: 'nowrap', minWidth: 760 }}>
          <thead>
            <tr>
              <th>模型名称</th>
              <th>产品类型</th>
              <th style={{ textAlign: 'right' }}>消费金额（元）</th>
              {/* <th style={{ textAlign: 'right' }}>原价总额（元）</th>
              <th style={{ textAlign: 'right' }}>模型折扣（%）</th>
              <th>模型分组 ID</th> */}
            </tr>
          </thead>
          <tbody>
            {loading && items.length === 0 ? (
              <tr>
                <td colSpan={3} style={{ padding: 0 }}>
                  {Array.from({ length: SKELETON_BILLING_COUNT }).map((_, i) => (
                    <SkeletonBillingRow key={i} cells={3} />
                  ))}
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={3} className="api-hub-table-empty">
                  暂无数据
                </td>
              </tr>
            ) : (
              items.map((r, idx) => (
                <tr key={`${r.modelName}-${idx}`}>
                  <td style={{ fontWeight: 500 }}>{r.modelName}</td>
                  <td>{r.productType || '—'}</td>
                  <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                    {r.consumptionCny.toFixed(4)}
                  </td>
                  {/* <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                    {fmtBillingAmount(r.originalPriceCny, 4)}
                  </td>
                  <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                    {fmtPercent(r.modelDiscount ?? undefined)}
                  </td>
                  <td className="api-hub-table-mono" style={{ fontSize: 13, maxWidth: 220 }}>
                    {r.modelGroupId ?? '—'}
                  </td> */}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <TablePagination total={total} page={page} pageSize={pageSize} onPageChange={onPageChange} />
    </>
  );
}

interface RequestTableProps {
  data: PaginatedResult<RequestLogRow>;
  page: number;
  onPageChange: (page: number) => void;
  isMobile?: boolean;
  loading?: boolean;
}

function RequestTable({ data, page, onPageChange, isMobile, loading }: RequestTableProps) {
  const { items, total, pageSize } = data;
  if (isMobile) {
    return (
      <>
        <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
          {loading && items.length === 0 ? (
            Array.from({ length: SKELETON_BILLING_COUNT }).map((_, i) => <SkeletonMobileCard key={i} rows={8} />)
          ) : items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>暂无数据</div>
          ) : (
            <div className="api-hub-mobile-card-list">
              {items.map((r) => (
                <div key={r.requestId} className="api-hub-mobile-card">
                  <div className="api-hub-mobile-card-row">
                    <span className="api-hub-mobile-card-label">模型名称</span>
                    <span className="api-hub-mobile-card-value">{r.modelName}</span>
                  </div>
                  <div className="api-hub-mobile-card-row">
                    <span className="api-hub-mobile-card-label">使用时间</span>
                    <span className="api-hub-mobile-card-value" style={{ fontSize: 12 }}>
                      {r.usedAt}
                    </span>
                  </div>
                  <div className="api-hub-mobile-card-row">
                    <span className="api-hub-mobile-card-label">API Key 名称</span>
                    <span className="api-hub-mobile-card-value" style={{ fontSize: 12 }}>
                      {r.apiKeyName || '—'}
                    </span>
                  </div>
                  <div className="api-hub-mobile-card-row">
                    <span className="api-hub-mobile-card-label">请求用量</span>
                    <span className="api-hub-mobile-card-value">{getRequestUsageText(r)}</span>
                  </div>
                  <div className="api-hub-mobile-card-row">
                    <span className="api-hub-mobile-card-label">计费单位</span>
                    <span className="api-hub-mobile-card-value">{getRequestBillingUnitText(r)}</span>
                  </div>
                  <div className="api-hub-mobile-card-row">
                    <span className="api-hub-mobile-card-label">原价 (¥)</span>
                    <span className="api-hub-mobile-card-value">{fmtBillingAmount(r.originalPriceCny, 4)}</span>
                  </div>
                  <div className="api-hub-mobile-card-row">
                    <span className="api-hub-mobile-card-label">优惠金额 (¥)</span>
                    <span className="api-hub-mobile-card-value">{fmtBillingDelta(getRequestDiscountAmount(r), 4)}</span>
                  </div>
                  <div className="api-hub-mobile-card-row">
                    <span className="api-hub-mobile-card-label">实扣金额 (¥)</span>
                    <span className="api-hub-mobile-card-value">{fmtBillingAmount(r.consumptionCny, 4)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <TablePagination total={total} page={page} pageSize={pageSize} onPageChange={onPageChange} />
      </>
    );
  }
  return (
    <>
      <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
        <table className="api-hub-table" style={{ whiteSpace: 'nowrap', minWidth: 1180 }}>
          <thead>
            <tr>
              <th>模型</th>
              <th>时间 ↓</th>
              <th>API Key 名称</th>
              <th style={{ textAlign: 'right' }}>请求用量</th>
              <th>计费单位</th>
              <th style={{ textAlign: 'right' }}>原价 (¥)</th>
              <th style={{ textAlign: 'right' }}>优惠金额 (¥)</th>
              <th style={{ textAlign: 'right' }}>实扣金额 (¥)</th>
            </tr>
          </thead>
          <tbody>
            {loading && items.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: 0 }}>
                  {Array.from({ length: SKELETON_BILLING_COUNT }).map((_, i) => (
                    <SkeletonBillingRow key={i} cells={8} />
                  ))}
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={8} className="api-hub-table-empty">
                  暂无数据
                </td>
              </tr>
            ) : (
              items.map((r) => (
                <tr key={r.requestId}>
                  <td style={{ fontWeight: 500 }}>{r.modelName}</td>
                  <td className="api-hub-table-timestamp">{r.usedAt}</td>
                  <td>{r.apiKeyName || '—'}</td>
                  <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                    {getRequestUsageText(r)}
                  </td>
                  <td>{getRequestBillingUnitText(r)}</td>
                  <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                    {fmtBillingAmount(r.originalPriceCny, 4)}
                  </td>
                  <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: '#059669' }}>
                    {fmtBillingDelta(getRequestDiscountAmount(r), 4)}
                  </td>
                  <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
                    {fmtBillingAmount(r.consumptionCny, 4)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <TablePagination total={total} page={page} pageSize={pageSize} onPageChange={onPageChange} />
    </>
  );
}