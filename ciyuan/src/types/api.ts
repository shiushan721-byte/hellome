/** 服务端统一分页结果 */
export interface ServerPageResult<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}

/** 服务端 API Key 列表项 */
export interface ServerApiKeyItem {
  keyId: string;
  name: string;
  maskedApiKey: string;
  enabled: boolean;
  createdAt: string;
  lastUsedAt: string | null;
  expiresAt: string | null;
}

/** 服务端 API 端点地址响应 */
export interface ServerBaseUrlResponse {
  baseUrl: string;
}

/** 服务端 API Key 创建响应 */
export interface ServerApiKeyCreated {
  keyId: string;
  apiKey: string;
  name: string;
  createdAt: string;
  expiresAt: string | null;
}

/** 服务端钱包余额响应（金额单位：厘） */
export interface ServerWalletBalance {
  balance: number;
  totalRecharged: number;
  totalConsumed: number;
  frozenAmount: number;
  totalGiftCredit: number;
}

/** 服务端充值配置项（金额单位：厘） */
export interface ServerRechargeConfigItem {
  amount: number;
  label: string;
  isDefault: boolean;
}

/** 服务端充值配置响应（包含套餐列表和金额限制） */
export interface ServerRechargeConfigResponse {
  configs: ServerRechargeConfigItem[];
  minAmount: number;
  maxAmount: number;
  /** 是否允许自定义充值金额，由 Nacos wallet.custom-amount-enabled 控制 */
  customAmountEnabled: boolean;
}

/** 服务端充值订单响应（金额单位：厘） */
export interface ServerRechargeOrderResponse {
  orderId: string;
  orderPageUrl: string;
  amount: number;
  payToken: string;
}

/** 服务端钱包流水记录 */
export interface ServerWalletTransaction {
  id: number;
  tenantId: number;
  transactionId: string;
  userId: number;
  type: string;
  amount: number;
  balanceAfter: number;
  orderId: string | null;
  bizId: string | null;
  paymentChannel: string | null;
  description: string | null;
  extraData: string | null;
  createdAt: string;
}

/** 服务端支付订单详情 */
export interface ServerPaymentOrderDetail {
  orderId: string;
  amount: number;
  description: string;
  status: 'pending' | 'paid' | 'closed';
  orderType: string;
}

/** 服务端账单查询请求 */
export interface ServerBillingUsageQuery {
  dateFrom?: string;
  dateTo?: string;
  apiKey?: string;
  pagination?: {
    page?: number;
    pageSize?: number;
  };
}

/** 服务端日账单行（BillingDailyVO：金额多为厘；OpenAPI 另见分/厘说明，前端统一按既有 li 口径换算为元） */
export interface ServerDailyBillingRow {
  date: string;
  consumption: number;
  rechargeDeduction: number;
  /** OpenAPI：originalPrice 原价总额（厘） */
  originalPrice?: number | null;
  /** OpenAPI：discountPercent 综合折扣（%） */
  discountPercent?: number | null;
  /** 兼容旧字段：原价（厘） */
  listAmount?: number | null;
  discountPct?: number | null;
  billedAmount?: number | null;
  requestCount?: number | null;
}

/** 服务端产品账单行（BillingProductVO） */
export interface ServerProductBillingRow {
  modelName: string;
  productType: string;
  consumption: number;
  rechargeDeduction: number;
  /** OpenAPI：originalPrice 模型原价（厘） */
  originalPrice?: number | null;
  /** OpenAPI：modelDiscount 模型折扣（%） */
  modelDiscount?: number | null;
  /** OpenAPI：modelGroupId */
  modelGroupId?: string | null;
  listAmount?: number | null;
  discountPct?: number | null;
  billedAmount?: number | null;
}

/** 服务端请求明细行（BillingRequestDetailVO） */
export interface ServerRequestLogRow {
  requestId: string;
  modelName: string;
  usedAt: string;
  apiKeyName: string;
  apiKey: string;
  inputTokens: number;
  outputTokens: number;
  cacheTokens?: number | null;
  videoSeconds?: number | null;
  imageCount?: number | null;
  durationSeconds?: number | null;
  inputTextCharacters?: number | null;
  imageInputTokens?: number | null;
  imageOutputTokens?: number | null;
  billingType?: string | null;
  /** 原价（厘） */
  originalPrice?: number | null;
  /** 消费金额（厘）→ 请求实扣 */
  consumption?: number | null;
  rechargeDeduction?: number | null;
  /** 输出侧售价折扣（展示为请求折扣 %） */
  outputSalesDiscount?: number | null;
  listAmount?: number | null;
  discountPct?: number | null;
  billedAmount?: number | null;
}

/** 服务端模型列表项（与后端 LlmModelItemResponse 对齐） */
export interface ServerModelItem {
  id: number | string;
  /** 模型展示名称 */
  name: string;
  /** API模型标识 */
  modelId: string;
  channelName: string;
  channelAlias: string;
  channelLogo: string | null;
  modelType: string;
  tags?: string[];
  inputPrice: number | null;
  outputPrice: number | null;
  contextTokens: string;
  maxOutputTokens: string;
  releasedAt: string | null;
  description?: string;
  status: string;
  logo?: string | null;
  /** 官方挂牌参考价（元/百万 tokens），可选 */
  officialInputPrice?: number | null;
  officialOutputPrice?: number | null;
  /** 平台折扣百分比，如 100 表示标价即折后价 */
  platformDiscountPct?: number | null;
}

/** 【C端】模型市场分组查询单行 POST /api/llm-model/category/model-group/search */
export interface ServerModelMarketGroupTier {
  id?: number | string;
  label?: string | null;
  minQuantity: string;
  maxQuantity: string;
  inputPrice: number | null;
  outputPrice: string | number;
  originalInputPrice?: number | null;
  originalOutputPrice?: number | null;
  cacheStoragePrice?: number | null;
  note?: string | null;
}

export interface ServerBillingUnitPrice {
  discount?: number | null;
  pricePerUnit: number;
  spec?: string | null;
  tiers?: unknown[] | null;
  unitSpec: number;
}

export interface ServerVideoSpecPrice extends ServerBillingUnitPrice {
  audioType?: string | null;
  maxDuration?: number | null;
  resolution?: string | null;
}

export interface ServerVideoTokenPrice extends ServerBillingUnitPrice {
  resolution?: string | null;
  videoTokenSpec?: string | null;
}

export interface ServerImageTokenBillingEntry {
  imageTokenSpec?: string | null;
  input?: ServerBillingUnitPrice | null;
  output?: ServerBillingUnitPrice | null;
  cache?: unknown | null;
}

export interface ServerAudioBillingRule {
  speech?: ServerBillingUnitPrice[] | null;
  voiceClone?: ServerBillingUnitPrice[] | null;
}

export interface ServerModelBillingRule {
  billingType?: string | null;
  count?: unknown | null;
  denominationDefault?: '厘' | '分' | '元' | string | null;
  duration?: unknown | null;
  audio?: ServerAudioBillingRule | null;
  image?: ServerBillingUnitPrice[] | null;
  imageToken?: ServerImageTokenBillingEntry[] | null;
  ruleSpec?: string | null;
  token?: unknown | null;
  version?: number | null;
  videoSpec?: ServerVideoSpecPrice[] | null;
  videoToken?: ServerVideoTokenPrice[] | {
    noVideoInput?: ServerBillingUnitPrice | null;
    withVideoInput?: ServerBillingUnitPrice | null;
  } | null;
}

export interface ServerModelMarketGroupItem {
  id: number;
  /** 模型标识（调用 model） */
  groupId: string;
  name: string;
  categoryName?: string | null;
  modelType?: string | null;
  /** 列表/卡片头像，来自集合 logo */
  logo?: string | null;
  tagNames: string[];
  /** 输入挂牌价（元/百万 tokens） */
  inputPrice: number;
  /** 输出挂牌价 */
  outputPrice: number | null;
  billingRule?: ServerModelBillingRule | null;
  /** 官方折扣文案，如 95% */
  platformDiscount: string | null;
  /** C 端展示的折扣文案（绿色角标），为空则不展示角标 */
  consumerDiscountLabel?: string | null;
  discountedInputPrice: number | null;
  discountedOutputPrice: number | null;
  billingNote?: string | null;
  quickStartNote?: string | null;
  quickStartCode?: string | null;
  vendorName: string | null;
  releasedAt: string;
  tierBillingItems: ServerModelMarketGroupTier[];
  contextTokens?: number;
  maxOutputTokens?: number;
}
