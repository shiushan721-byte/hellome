import { get, post, del } from '@/utils/request';
import type {
  ServerApiKeyItem,
  ServerApiKeyCreated,
  ServerWalletBalance,
  ServerRechargeConfigResponse,
  ServerRechargeOrderResponse,
  ServerWalletTransaction,
  ServerPageResult,
  ServerBillingUsageQuery,
  ServerDailyBillingRow,
  ServerProductBillingRow,
  ServerRequestLogRow,
  ServerPaymentOrderDetail,
  ServerModelMarketGroupItem,
  ServerBaseUrlResponse,
} from '@/types/api';

/** 从后端获取 API 端点地址 */
export async function fetchBaseUrl(): Promise<string> {
  const result = await get<ServerBaseUrlResponse>('/api/platform-api-key/base-url');
  return result.baseUrl || '';
}

// ====== 前端类型定义（保持不变，供页面组件使用） ======

export interface ApiKeySummary {
  id: string;
  name: string;
  secretPreview: string;
  apiKey: string;
  createdAt: string;
  lastUsedAt: string;
  active: boolean;
}

export interface CreateApiKeyPayload {
  name: string;
  expiresInDays?: number;
}

export interface ApiKeyWithSecret extends ApiKeySummary {
  secret: string;
}

/** 日账单行（展示为元，字段与 BillingDailyVO 对齐） */
export interface DailyBillingRow {
  date: string;
  /** 当日消费金额（元） */
  consumptionCny: number;
  /** 当日充值扣减金额（元） */
  rechargeDeductionCny: number;
  /** 当日原价总额（元），对应 originalPrice（厘） */
  originalPriceCny?: number;
  /** 综合折扣（%） */
  discountPercent?: number | null;
}

/** 产品账单行（与 BillingProductVO 对齐） */
export interface ProductBillingRow {
  modelName: string;
  productType: string;
  consumptionCny: number;
  rechargeDeductionCny: number;
  originalPriceCny?: number;
  modelDiscount?: number | null;
  modelGroupId?: string | null;
}

/** 请求明细行（与 BillingRequestDetailVO 对齐） */
export interface RequestLogRow {
  requestId: string;
  modelName: string;
  usedAt: string;
  apiKeyName: string;
  apiKey: string;
  inputTokens: number;
  outputTokens: number;
  cacheTokens: number;
  videoSeconds: number;
  imageCount: number;
  durationSeconds: number;
  inputTextCharacters: number;
  imageInputTokens: number;
  imageOutputTokens: number;
  billingType?: string | null;
  /** originalPrice（厘）→ 元 */
  originalPriceCny?: number;
  /** outputSalesDiscount → 请求折扣（%） */
  outputSalesDiscount?: number | null;
  /** consumption（厘）→ 请求实扣（元） */
  consumptionCny?: number;
}

export interface BillingQuery {
  dateFrom?: string;
  dateTo?: string;
  apiKey?: string;
  page?: number;
  pageSize?: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

/** 分档计价（与列表/详情 tierBillingItems 对齐） */
export interface ModelTierBillingItem {
  id?: string;
  label?: string;
  minQuantity: string;
  maxQuantity: string;
  inputPrice: number;
  outputPrice: number;
  originalInputPrice?: number;
  originalOutputPrice?: number;
  cacheStoragePrice?: number;
  note?: string;
}

export interface ModelItem {
  id: string;
  name: string;
  /** 模型类别/模态兜底字段，后端若返回则用于详情页刷新后的展示判断 */
  categoryName?: string;
  modelType?: string;
  /** API模型标识（groupId） */
  modelId: string;
  provider: string;
  /** 模型logo */
  logo?: string | null;
  /** 渠道别名 */
  channelAlias: string;
  /** 渠道logo */
  channelLogo?: string | null;
  description?: string;
  tags: string[];
  /** 挂牌输入/输出单价（元/百万 tokens），与接口 inputPrice/outputPrice 一致 */
  inputPrice: number;
  outputPrice: number;
  /** 官方挂牌参考价（元/百万 tokens），列表「官方挂牌价」列优先展示 */
  officialInputPrice?: number;
  officialOutputPrice?: number;
  /** 平台折扣百分比数值（如 95 表示 95%），兼容计算 */
  platformDiscountPct?: number;
  /** 接口返回的折扣文案，如 95%，列表「平台折扣」优先展示 */
  platformDiscountLabel?: string;
  /** C 端折扣角标文案，来自接口 consumerDiscountLabel，为空则不展示角标 */
  consumerDiscountLabel?: string;
  /** 平台折后单价（元/百万 tokens），接口直接下发 */
  discountedInputPrice?: number;
  discountedOutputPrice?: number;
  /** 分档计价 */
  tierBillingItems?: ModelTierBillingItem[];
  /** 原始计费规则，用于图像/视频等非文本模型展示 */
  billingRule?: ServerModelMarketGroupItem['billingRule'];
  billingNote?: string;
  quickStartNote?: string;
  quickStartCode?: string;
  context: string;
  maxOutput: string;
  /** 展示用发布年月，如 2026-03 */
  releasedAt?: string;
  status: 'active' | 'disabled';
}

/** 折后价：优先接口 discounted*，否则按 platformDiscountPct 折算 input/output */
export function effectiveDiscountedPrices(m: ModelItem): { in: number; out: number } {
  if (m.discountedInputPrice != null && m.discountedOutputPrice != null) {
    return { in: m.discountedInputPrice, out: m.discountedOutputPrice };
  }
  const pct = m.platformDiscountPct ?? 100;
  return {
    in: m.inputPrice * (pct / 100),
    out: m.outputPrice * (pct / 100),
  };
}

/** 模型市场末尾固定展示：CarrotAI 旗舰 */
export const CARROT_FLAGSHIP_MODEL_ID = 'carrot-ai-flagship';

export const CARROT_FLAGSHIP_MODEL: ModelItem = {
  id: CARROT_FLAGSHIP_MODEL_ID,
  name: 'CarrotAI 旗舰',
  modelId: 'carrot-ai-flagship',
  provider: 'CarrotAI',
  channelAlias: 'CarrotAI',
  logo: null,
  channelLogo: null,
  description: 'CarrotAI 旗舰为高阶权益目录模型，请联系客服或客户经理开通后调用。',
  tags: ['文本', '推理', '编程'],
  inputPrice: 18,
  outputPrice: 90,
  officialInputPrice: 18,
  officialOutputPrice: 90,
  platformDiscountPct: 100,
  platformDiscountLabel: '100%',
  consumerDiscountLabel: '100%',
  discountedInputPrice: 22,
  discountedOutputPrice: 108,
  tierBillingItems: [],
  context: '128K',
  maxOutput: '64K',
  releasedAt: '2026-03',
  status: 'active',
};

/** 仅在接口返回至少一条模型时，在列表尾部追加 CarrotAI 旗舰；接口为空时不追加 */
export function mergeModelMarketList(models: ModelItem[]): ModelItem[] {
  if (models.length === 0) return models;
  if (models.some((m) => m.id === CARROT_FLAGSHIP_MODEL.id)) return models;
  return [...models, CARROT_FLAGSHIP_MODEL];
}

export interface UserBalance {
  balance: number;
  totalGiftCredit: number;
  totalRecharge: number;
  totalConsumption: number;
}

export type TopupStatus = 'pending' | 'completed' | 'failed' | 'closed';
export type PayMethod = 'epay' | 'stripe' | 'waffo' | 'wechat' | 'alipay';

export interface TopupRecord {
  id: string;
  tradeNo: string;
  amount: number;
  money: number;
  method: PayMethod;
  status: TopupStatus;
  createdAt: string;
  finishedAt?: string;
  orderId: string;
  note?: string;
}

export interface TopupOrder {
  orderId: string;
  orderPageUrl: string;
  amount: number;
  payToken: string;
}

export interface RechargeConfig {
  amount: number;
  label: string;
  isDefault: boolean;
}

export interface RechargeConfigResult {
  configs: RechargeConfig[];
  minAmountYuan: number;
  maxAmountYuan: number;
  /** 是否允许自定义充值金额，false 时前端隐藏输入框且后端拒绝非套餐金额 */
  customAmountEnabled: boolean;
}

function formatModelReleaseMonth(releasedAt: string | null | undefined): string | undefined {
  if (!releasedAt) return undefined;
  const d = new Date(releasedAt);
  if (!Number.isNaN(d.getTime())) {
    const y = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    return `${y}-${mo}`;
  }
  const m = /^(\d{4}-\d{2})/.exec(releasedAt);
  return m ? m[1] : undefined;
}

// ====== 数据适配工具 ======

function formatDateTime(dt: string | null): string {
  if (!dt) return '从未使用';
  return dt.replace('T', ' ').slice(0, 19);
}

function liToYuan(li: number): number {
  return parseFloat((li / 1000).toFixed(3));
}

// ====== 真实 API 调用（有服务端接口） ======

export async function fetchApiKeys(options?: { masked?: boolean }): Promise<ApiKeySummary[]> {
  const params = options?.masked === false ? '?masked=false' : '';
  const list = await get<ServerApiKeyItem[]>(`/api/platform-api-key/list${params}`);
  return list.map((item) => ({
    id: item.keyId,
    name: item.name,
    secretPreview: item.maskedApiKey,
    apiKey: item.maskedApiKey,
    createdAt: formatDateTime(item.createdAt),
    lastUsedAt: formatDateTime(item.lastUsedAt),
    active: item.enabled,
  }));
}

export async function createApiKey(payload: CreateApiKeyPayload): Promise<ApiKeyWithSecret> {
  const result = await post<ServerApiKeyCreated>('/api/platform-api-key', {
    name: payload.name,
    expiresInDays: payload.expiresInDays ?? null,
  });
  return {
    id: result.keyId,
    name: result.name,
    secretPreview: result.apiKey.slice(0, 8) + '****' + result.apiKey.slice(-4),
    apiKey: result.apiKey,
    createdAt: formatDateTime(result.createdAt),
    lastUsedAt: '从未使用',
    active: true,
    secret: result.apiKey,
  };
}

export async function updateApiKeyName(keyId: string, name: string): Promise<void> {
  await post<void>(`/api/platform-api-key/${keyId}`, { name });
}

export async function toggleApiKeyStatus(keyId: string): Promise<void> {
  await post<void>(`/api/platform-api-key/${keyId}/toggle`);
}

export async function deleteApiKey(id: string): Promise<void> {
  await del<void>(`/api/platform-api-key/${id}`);
}

export async function fetchUserBalance(): Promise<UserBalance> {
  const result = await get<ServerWalletBalance>('/api/wallet/balance');
  return {
    balance: liToYuan(result.balance),
    totalGiftCredit: liToYuan(result.totalGiftCredit ?? 0),
    totalRecharge: liToYuan(result.totalRecharged),
    totalConsumption: liToYuan(result.totalConsumed),
  };
}

export async function fetchRechargeConfigs(): Promise<RechargeConfigResult> {
  const result = await get<ServerRechargeConfigResponse>('/api/wallet/recharge-configs');
  return {
    configs: (result.configs ?? []).map((item) => ({
      amount: item.amount,
      label: item.label,
      isDefault: item.isDefault,
    })),
    minAmountYuan: liToYuan(result.minAmount ?? 1000),
    maxAmountYuan: liToYuan(result.maxAmount ?? 50000000),
    customAmountEnabled: result.customAmountEnabled ?? true,
  };
}

export async function createTopup(amountLi: number): Promise<TopupOrder> {
  const result = await post<ServerRechargeOrderResponse>('/api/wallet/recharge', {
    amount: amountLi,
    source: 'recharge_page',
  });
  return {
    orderId: result.orderId,
    orderPageUrl: result.orderPageUrl,
    amount: result.amount,
    payToken: result.payToken,
  };
}

export interface OrderStatus {
  orderId: string;
  amount: number;
  status: 'pending' | 'paid' | 'closed';
}

export async function fetchOrderStatus(orderId: string, payToken: string): Promise<OrderStatus> {
  const result = await get<ServerPaymentOrderDetail>(
    `/api/payment/order/${encodeURIComponent(orderId)}?payToken=${encodeURIComponent(payToken)}`,
  );
  return {
    orderId: result.orderId,
    amount: result.amount,
    status: result.status,
  };
}

export async function fetchUserTopups(): Promise<TopupRecord[]> {
  const result = await get<ServerPageResult<ServerWalletTransaction>>(
    '/api/wallet/transactions?type=recharge&page=1&pageSize=50',
  );
  return result.list.map((tx) => ({
    id: String(tx.id),
    tradeNo: tx.transactionId,
    amount: liToYuan(Math.abs(tx.amount)),
    money: liToYuan(Math.abs(tx.amount)),
    method: (tx.paymentChannel as PayMethod) || 'wechat',
    status: mapTransactionStatus(tx.type),
    createdAt: formatDateTime(tx.createdAt),
    orderId: tx.orderId || tx.transactionId,
    note: tx.description || undefined,
  }));
}

function mapTransactionStatus(type: string): TopupStatus {
  switch (type) {
    case 'recharge':
      return 'completed';
    case 'refund':
      return 'completed';
    default:
      return 'completed';
  }
}

function buildBillingUsageQueryBody(query: BillingQuery): ServerBillingUsageQuery {
  return {
    dateFrom: query.dateFrom,
    dateTo: query.dateTo,
    apiKey: query.apiKey,
    pagination: {
      page: query.page || 1,
      pageSize: query.pageSize || 20,
    },
  };
}

export async function fetchBillingDaily(
  query: BillingQuery,
): Promise<PaginatedResult<DailyBillingRow>> {
  const data = await post<ServerPageResult<ServerDailyBillingRow>>(
    '/api/app/billing/usage/daily',
    buildBillingUsageQueryBody(query) as unknown as Record<string, unknown>,
  );

  return {
    items: data.list.map((item) => {
      const origLi =
        item.originalPrice != null
          ? Number(item.originalPrice)
          : item.listAmount != null
            ? Number(item.listAmount)
            : undefined;
      const discount =
        item.discountPercent != null
          ? Number(item.discountPercent)
          : item.discountPct != null
            ? Number(item.discountPct)
            : undefined;
      return {
        date: item.date,
        consumptionCny: liToYuan(Number(item.consumption || 0)),
        rechargeDeductionCny: liToYuan(Number(item.rechargeDeduction || 0)),
        originalPriceCny: origLi != null ? liToYuan(origLi) : undefined,
        discountPercent: discount,
      };
    }),
    total: data.total,
    page: data.page,
    pageSize: data.pageSize,
  };
}

export async function fetchBillingByProduct(
  query: BillingQuery,
): Promise<PaginatedResult<ProductBillingRow>> {
  const data = await post<ServerPageResult<ServerProductBillingRow>>(
    '/api/app/billing/usage/by-product',
    buildBillingUsageQueryBody(query) as unknown as Record<string, unknown>,
  );

  return {
    items: data.list.map((item) => {
      const origLi =
        item.originalPrice != null
          ? Number(item.originalPrice)
          : item.listAmount != null
            ? Number(item.listAmount)
            : undefined;
      const modelDisc =
        item.modelDiscount != null
          ? Number(item.modelDiscount)
          : item.discountPct != null
            ? Number(item.discountPct)
            : undefined;
      return {
        modelName: item.modelName,
        productType: item.productType,
        consumptionCny: liToYuan(Number(item.consumption || 0)),
        rechargeDeductionCny: liToYuan(Number(item.rechargeDeduction || 0)),
        originalPriceCny: origLi != null ? liToYuan(origLi) : undefined,
        modelDiscount: modelDisc,
        modelGroupId: item.modelGroupId ?? undefined,
      };
    }),
    total: data.total,
    page: data.page,
    pageSize: data.pageSize,
  };
}

export async function fetchRequestLogs(
  query: BillingQuery,
): Promise<PaginatedResult<RequestLogRow>> {
  const data = await post<ServerPageResult<ServerRequestLogRow>>(
    '/api/app/billing/usage/requests',
    buildBillingUsageQueryBody(query) as unknown as Record<string, unknown>,
  );

  return {
    items: data.list.map((item) => {
      const origLi =
        item.originalPrice != null
          ? Number(item.originalPrice)
          : item.listAmount != null
            ? Number(item.listAmount)
            : undefined;
      return {
        requestId: item.requestId,
        modelName: item.modelName,
        usedAt: item.usedAt,
        apiKeyName: item.apiKeyName,
        apiKey: item.apiKey,
        inputTokens: Number(item.inputTokens || 0),
        outputTokens: Number(item.outputTokens || 0),
        cacheTokens: Number(item.cacheTokens || 0),
        videoSeconds: Number(item.videoSeconds || 0),
        imageCount: Number(item.imageCount || 0),
        durationSeconds: Number(item.durationSeconds || 0),
        inputTextCharacters: Number((item as { inputTextCharacters?: number | null }).inputTextCharacters || 0),
        imageInputTokens: (() => {
          const raw = item.imageInputTokens ?? (item as unknown as Record<string, unknown>).image_input_tokens;
          return Number(raw || 0);
        })(),
        imageOutputTokens: (() => {
          const raw = item.imageOutputTokens ?? (item as unknown as Record<string, unknown>).image_output_tokens;
          return Number(raw || 0);
        })(),
        billingType: (() => {
          if (item.billingType != null && item.billingType !== '') return item.billingType;
          const snake = (item as unknown as Record<string, unknown>).billing_type;
          return typeof snake === 'string' && snake !== '' ? snake : undefined;
        })(),
        originalPriceCny: origLi != null ? liToYuan(origLi) : undefined,
        outputSalesDiscount:
          item.outputSalesDiscount != null ? Number(item.outputSalesDiscount) : undefined,
        consumptionCny:
          item.consumption != null ? liToYuan(Number(item.consumption)) : undefined,
      };
    }),
    total: data.total,
    page: data.page,
    pageSize: data.pageSize,
  };
}

function parsePlatformDiscountPctFromLabel(label: string | null | undefined): number | undefined {
  if (label == null || String(label).trim() === '') return undefined;
  const s = String(label).trim();
  const m = /(\d+(?:\.\d+)?)\s*%/.exec(s);
  if (m) return Number(m[1]);
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
}

/** Token 数量展示为 K（千 tokens），与模型市场卡片/详情一致 */
export function formatTokenCountDisplay(n: unknown): string {
  if (n == null || n === '') return '—';
  const num = Number(n);
  if (!Number.isFinite(num)) return String(n);
  const rounded = Math.round(num);
  if (rounded === 0) return '0';
  if (rounded < 1000) return String(rounded);
  const k = rounded / 1000;
  if (Number.isInteger(k)) return `${k}K`;
  const oneDecimal = Math.round(k * 10) / 10;
  return `${oneDecimal}K`;
}

function formatCompactNumber(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1).replace(/\.0$/, '');
}

/** 上下文/最大输出容量展示：接口值为 token 数；1024K tokens = 1M tokens。 */
export function formatTokenCapacityDisplay(n: unknown): string {
  if (n == null || n === '') return '—';
  const num = Number(n);
  if (!Number.isFinite(num)) return String(n);
  if (num === 0) return '0';
  const abs = Math.abs(num);
  if (abs < 1024000) return `${formatCompactNumber(num / 1000)}K`;
  return `${formatCompactNumber(num / 1024000)}M`;
}

function mapTierBillingFromServer(
  tiers: ServerModelMarketGroupItem['tierBillingItems'],
): ModelTierBillingItem[] {
  return (tiers ?? []).map((t, idx) => ({
    id: t.id != null ? String(t.id) : `${t.minQuantity}-${t.maxQuantity}-${idx}`,
    label: t.label?.trim() || undefined,
    minQuantity: String(t.minQuantity),
    maxQuantity: String(t.maxQuantity),
    inputPrice: Number(t.inputPrice),
    outputPrice: Number(t.outputPrice),
    originalInputPrice: t.originalInputPrice != null ? Number(t.originalInputPrice) : undefined,
    originalOutputPrice: t.originalOutputPrice != null ? Number(t.originalOutputPrice) : undefined,
    cacheStoragePrice: t.cacheStoragePrice != null ? Number(t.cacheStoragePrice) : undefined,
    note: t.note?.trim() || undefined,
  }));
}

export interface ModelCategory {
  id: number;
  name: string;
  sortOrder: string;
}

/** 模型分类列表：GET /api/llm-model/category/list */
export async function fetchModelCategories(): Promise<ModelCategory[]> {
  const list = await get<ModelCategory[]>('/api/llm-model/category/list');
  return (list ?? []).slice().sort((a, b) => {
    const sa = Number(a.sortOrder);
    const sb = Number(b.sortOrder);
    if (Number.isFinite(sa) && Number.isFinite(sb)) return sa - sb;
    return String(a.sortOrder).localeCompare(String(b.sortOrder));
  });
}

/** 模型市场列表：POST /api/llm-model/category/model-group/search */
export async function fetchModels(params: {
  status?: string;
  categoryId?: number | null;
  modelName?: string;
}): Promise<ModelItem[]> {
  const body: Record<string, unknown> = {};
  if (params.categoryId != null) body.categoryId = params.categoryId;
  if (params.modelName) body.modelName = params.modelName;
  const list = await post<ServerModelMarketGroupItem[]>(
    '/api/llm-model/category/model-group/search',
    body,
  );
  const models: ModelItem[] = list.map((item) => {
    const inP = Number(item.inputPrice ?? 0);
    const outP = Number(item.outputPrice ?? 0);
    const pctNum = parsePlatformDiscountPctFromLabel(item.platformDiscount);
    const discIn = item.discountedInputPrice != null ? Number(item.discountedInputPrice) : inP;
    const discOut = item.discountedOutputPrice != null ? Number(item.discountedOutputPrice) : outP;
    return {
      id: String(item.id),
      name: item.name,
      categoryName: item.categoryName?.trim() || undefined,
      modelType: item.modelType?.trim() || undefined,
      modelId: item.groupId,
      provider: item.vendorName?.trim() || '—',
      channelAlias: item.vendorName?.trim() || item.groupId,
      logo: item.logo ?? null,
      channelLogo: null,
      description: '',
      tags: Array.isArray(item.tagNames) ? item.tagNames : [],
      inputPrice: inP,
      outputPrice: outP,
      officialInputPrice: inP,
      officialOutputPrice: outP,
      platformDiscountLabel: item.platformDiscount,
      consumerDiscountLabel:
        typeof item.consumerDiscountLabel === 'string'
          ? item.consumerDiscountLabel.trim()
          : undefined,
      platformDiscountPct: pctNum,
      discountedInputPrice: discIn,
      discountedOutputPrice: discOut,
      tierBillingItems: mapTierBillingFromServer(item.tierBillingItems),
      billingRule: item.billingRule ?? undefined,
      billingNote: item.billingNote?.trim() || undefined,
      quickStartNote: item.quickStartNote?.trim() || undefined,
      quickStartCode: item.quickStartCode?.trim() || undefined,
      context:
        item.contextTokens != null ? formatTokenCapacityDisplay(item.contextTokens) : '—',
      maxOutput:
        item.maxOutputTokens != null ? formatTokenCapacityDisplay(item.maxOutputTokens) : '—',
      releasedAt: item.releasedAt ? formatModelReleaseMonth(item.releasedAt) : undefined,
      status: 'active',
    };
  });
  if (params.status) {
    return models.filter((m) => m.status === params.status);
  }
  return models;
}

// ====== 工具函数 ======

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-999999px';
    textarea.style.top = '-999999px';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textarea);
    return successful;
  } catch {
    return false;
  }
}
