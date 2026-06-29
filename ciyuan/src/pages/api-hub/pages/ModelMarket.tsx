import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Info,
  Copy,
  List,
  LayoutGrid,
  Search,
  Check,
  ExternalLink,
  Lock,
  X,
  Import,
  Send,
} from 'lucide-react';

import type { ModelItem, ModelCategory } from '../lib/api';
import {
  CARROT_FLAGSHIP_MODEL,
  fetchModels,
  fetchModelCategories,
  copyToClipboard,
  mergeModelMarketList,
  effectiveDiscountedPrices,
} from '../lib/api';
import { useIsMobile } from '../../../hooks/useIsMobile';
import '../api-hub.css';

type ViewMode = 'list' | 'grid';

const TAG_EMOJI: Record<string, string> = {
  Tool: '🛠️',
  Reasoning: '🧠',
  Vision: '👁️',
};

function renderTag(tag: string): string {
  return TAG_EMOJI[tag] ? `${TAG_EMOJI[tag]} ${tag}` : tag;
}

/** 元/百万 tokens 价格：有小数则保留有效位，无则不再显示 .0000 */
function formatModelMarketYuan(n: number): string {
  if (!Number.isFinite(n)) return '—';
  return n.toFixed(4).replace(/\.?0+$/, '');
}

/** 音频单价：整数也保留一位小数，如 1.0 */
function formatAudioMarketYuan(n: number): string {
  if (!Number.isFinite(n)) return '—';
  const trimmed = n.toFixed(4).replace(/\.?0+$/, '');
  return trimmed.includes('.') ? trimmed : `${trimmed}.0`;
}

type BillingUnitPriceItem = NonNullable<NonNullable<ModelItem['billingRule']>['image']>[number];

function normalizeBillingUnitPrice(raw: unknown): BillingUnitPriceItem | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const item = raw as Record<string, unknown>;
  const pricePerUnit = Number(item.pricePerUnit ?? item.price_per_unit);
  const unitSpecRaw = item.unitSpec ?? item.unit_spec;
  const unitSpec = unitSpecRaw == null ? 10000 : Number(unitSpecRaw);
  const discountRaw = item.discount ?? item.discount_rate;
  if (!Number.isFinite(pricePerUnit)) return null;
  return {
    pricePerUnit,
    unitSpec: Number.isFinite(unitSpec) && unitSpec > 0 ? unitSpec : 10000,
    discount: discountRaw == null || discountRaw === '' ? null : Number(discountRaw),
    tiers: null,
  };
}

function parseBillingRuleObject(rule: ModelItem['billingRule'] | null | undefined): Record<string, unknown> | null {
  if (rule == null) return null;
  if (typeof rule === 'string') {
    try {
      const parsed = JSON.parse(rule) as unknown;
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : null;
    } catch {
      return null;
    }
  }
  return typeof rule === 'object' ? (rule as Record<string, unknown>) : null;
}

function getAudioSpeechBillingItem(rule: ModelItem['billingRule'] | null | undefined): BillingUnitPriceItem | null {
  const billing = parseBillingRuleObject(rule);
  if (!billing) return null;

  const audio = billing.audio;
  if (audio != null) {
    if (Array.isArray(audio)) {
      return normalizeBillingUnitPrice(audio[0]);
    }
    if (typeof audio === 'object') {
      const speech = (audio as Record<string, unknown>).speech;
      if (speech != null) {
        const raw = Array.isArray(speech) ? speech[0] : speech;
        const normalized = normalizeBillingUnitPrice(raw);
        if (normalized) return normalized;
      }
    }
  }

  const rootSpeech = billing.speech;
  if (rootSpeech != null) {
    const raw = Array.isArray(rootSpeech) ? rootSpeech[0] : rootSpeech;
    return normalizeBillingUnitPrice(raw);
  }

  return null;
}

/** 音频 pricePerUnit / 挂牌价均以「厘」存储（denominationDefault 为「元」时仍按厘换算） */
function resolveAudioBillingDenomination(rule: ModelItem['billingRule'] | null | undefined): string {
  return rule?.denominationDefault === '分' ? '分' : '厘';
}

function formatAudioSpeechUnitLabel(unitSpec?: number | null): string {
  const spec = unitSpec != null && unitSpec > 0 ? unitSpec : 10000;
  if (spec === 10000) return '元 / 万字符';
  if (spec === 1000000) return '元 / 百万字符';
  if (spec === 1000) return '元 / 千字符';
  if (spec === 1) return '元 / 字符';
  return `元 / ${spec}字符`;
}

type MarketModality = 'text' | 'image' | 'video' | 'audio';

type MarketPriceLine = {
  label: string;
  value: number | null;
  unit: string;
};

function hasVideoTokenBilling(rule: ModelItem['billingRule'] | null | undefined): boolean {
  const videoToken = rule?.videoToken;
  if (!videoToken) return false;
  if (Array.isArray(videoToken)) return videoToken.length > 0;
  return Boolean(videoToken.noVideoInput || videoToken.withVideoInput);
}

function isVideoTokenBillingModel(model: ModelItem): boolean {
  const billingType = model.billingRule?.billingType?.toLowerCase() ?? '';
  if (billingType === 'video_token' || billingType.includes('video_token')) return true;
  return hasVideoTokenBilling(model.billingRule);
}

type VideoTokenBillingItem = BillingUnitPriceItem & {
  resolution?: string | null;
  videoTokenSpec?: string | null;
};

type VideoTokenMarketPrices = {
  inputOfficial: number | null;
  inputPlatform: number | null;
  outputOfficial: number | null;
  outputPlatform: number | null;
  unit: string;
};

function getVideoTokenBillingItems(rule: ModelItem['billingRule'] | null | undefined): VideoTokenBillingItem[] {
  const videoToken = rule?.videoToken;
  if (!videoToken) return [];
  if (Array.isArray(videoToken)) return videoToken as VideoTokenBillingItem[];
  return [videoToken.noVideoInput, videoToken.withVideoInput].filter(
    (item): item is VideoTokenBillingItem => item != null,
  );
}

function isNoVideoInputTokenSpec(spec?: string | null): boolean {
  const normalized = (spec || '').toLowerCase();
  return normalized.includes('no_video_input') || normalized.includes('without_video_input');
}

function isWithVideoInputTokenSpec(spec?: string | null): boolean {
  const normalized = (spec || '').toLowerCase();
  return normalized.includes('with_video_input');
}

function minVideoTokenPrice(
  items: VideoTokenBillingItem[],
  denomination: string | null | undefined,
  discounted: boolean,
): number | null {
  if (items.length === 0) return null;
  const prices = items.map((item) => billingUnitPriceToYuan(item, denomination, discounted));
  return Math.min(...prices);
}

function formatVideoTokenUnitLabel(rule: ModelItem['billingRule'] | null | undefined, items: VideoTokenBillingItem[]): string {
  const unitSpec = items[0]?.unitSpec ?? 1000000;
  const base = unitSpec === 1000000 ? '元 / 百万 tokens' : `元 / ${unitSpec} tokens`;
  const ruleSpec = rule?.ruleSpec?.trim();
  return ruleSpec ? `${base} · ${ruleSpec}` : base;
}

function getVideoTokenMarketPrices(model: ModelItem): VideoTokenMarketPrices | null {
  if (!isVideoTokenBillingModel(model)) return null;
  const rule = model.billingRule;
  const items = getVideoTokenBillingItems(rule);
  if (items.length === 0) return null;

  const denomination = rule?.denominationDefault;
  const inputItems = items.filter((item) => isNoVideoInputTokenSpec(item.videoTokenSpec));
  const outputItems = items.filter((item) => isWithVideoInputTokenSpec(item.videoTokenSpec));

  return {
    inputOfficial: minVideoTokenPrice(inputItems, denomination, false),
    inputPlatform: minVideoTokenPrice(inputItems, denomination, true),
    outputOfficial: minVideoTokenPrice(outputItems, denomination, false),
    outputPlatform: minVideoTokenPrice(outputItems, denomination, true),
    unit: formatVideoTokenUnitLabel(rule, items),
  };
}

type ImageTokenBillingEntry = {
  imageTokenSpec?: string | null;
  input?: BillingUnitPriceItem | null;
  output?: BillingUnitPriceItem | null;
};

function normalizeImageTokenSidePrice(raw: unknown): BillingUnitPriceItem | null {
  return normalizeBillingUnitPrice(raw);
}

function normalizeImageTokenBillingEntry(raw: unknown): ImageTokenBillingEntry | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const item = raw as Record<string, unknown>;
  const input = normalizeImageTokenSidePrice(item.input);
  const output = normalizeImageTokenSidePrice(item.output);
  if (!input && !output) return null;
  return {
    imageTokenSpec: typeof item.imageTokenSpec === 'string' ? item.imageTokenSpec : null,
    input,
    output,
  };
}

function hasImageTokenBilling(rule: ModelItem['billingRule'] | null | undefined): boolean {
  const imageToken = rule?.imageToken;
  if (Array.isArray(imageToken)) return imageToken.length > 0;
  const billing = parseBillingRuleObject(rule);
  const raw = billing?.imageToken;
  return Array.isArray(raw) && raw.length > 0;
}

function isImageTokenBillingModel(model: ModelItem): boolean {
  const billingType = model.billingRule?.billingType?.toLowerCase() ?? '';
  if (billingType === 'image_token' || billingType.includes('image_token')) return true;
  return hasImageTokenBilling(model.billingRule);
}

function getImageTokenBillingItems(rule: ModelItem['billingRule'] | null | undefined): ImageTokenBillingEntry[] {
  const fromRule = rule?.imageToken;
  if (Array.isArray(fromRule) && fromRule.length > 0) {
    return fromRule
      .map((entry) => normalizeImageTokenBillingEntry(entry))
      .filter((entry): entry is ImageTokenBillingEntry => entry != null);
  }
  const billing = parseBillingRuleObject(rule);
  const raw = billing?.imageToken;
  if (!Array.isArray(raw)) return [];
  return raw
    .map((entry) => normalizeImageTokenBillingEntry(entry))
    .filter((entry): entry is ImageTokenBillingEntry => entry != null);
}

function minImageTokenSidePrice(
  items: ImageTokenBillingEntry[],
  side: 'input' | 'output',
  denomination: string | null | undefined,
  discounted: boolean,
): number | null {
  const prices = items
    .map((item) => item[side])
    .filter((item): item is BillingUnitPriceItem => item != null)
    .map((item) => billingUnitPriceToYuan(item, denomination, discounted));
  if (prices.length === 0) return null;
  return Math.min(...prices);
}

function formatImageTokenUnitLabel(rule: ModelItem['billingRule'] | null | undefined, items: ImageTokenBillingEntry[]): string {
  const unitSpec = items[0]?.input?.unitSpec ?? items[0]?.output?.unitSpec ?? 1000000;
  const base = unitSpec === 1000000 ? '元 / 百万 tokens' : `元 / ${unitSpec} tokens`;
  const ruleSpec = rule?.ruleSpec?.trim();
  return ruleSpec ? `${base} · ${ruleSpec}` : base;
}

function getImageTokenMarketPrices(model: ModelItem): VideoTokenMarketPrices | null {
  if (!isImageTokenBillingModel(model)) return null;
  const rule = model.billingRule;
  const items = getImageTokenBillingItems(rule);
  if (items.length === 0) return null;

  const denomination = rule?.denominationDefault;
  return {
    inputOfficial: minImageTokenSidePrice(items, 'input', denomination, false),
    inputPlatform: minImageTokenSidePrice(items, 'input', denomination, true),
    outputOfficial: minImageTokenSidePrice(items, 'output', denomination, false),
    outputPlatform: minImageTokenSidePrice(items, 'output', denomination, true),
    unit: formatImageTokenUnitLabel(rule, items),
  };
}

function getTokenIoMarketPrices(model: ModelItem): VideoTokenMarketPrices | null {
  return getVideoTokenMarketPrices(model) ?? getImageTokenMarketPrices(model);
}

function usesOfficialPlatformPriceLayout(model: ModelItem, modelModality: MarketModality): boolean {
  if (isVideoTokenBillingModel(model)) return false;
  if (isImageTokenBillingModel(model)) return false;
  return modelModality === 'image' || modelModality === 'video' || modelModality === 'audio';
}

function inferMarketModality(model: ModelItem, fallback: MarketModality): MarketModality {
  const rule = model.billingRule;

  if (rule?.videoSpec?.length || hasVideoTokenBilling(rule)) return 'video';
  if (hasImageTokenBilling(rule)) return 'image';
  if (rule?.image?.length) return 'image';
  if (getAudioSpeechBillingItem(rule)) return 'audio';

  const billingType = rule?.billingType?.toLowerCase();
  if (billingType?.includes('video')) return 'video';
  if (billingType?.includes('image')) return 'image';
  if (billingType?.includes('audio')) return 'audio';

  const text = [model.categoryName, model.modelType, model.name, model.modelId, ...model.tags].join(' ').toLowerCase();
  if (text.includes('视频') || text.includes('video')) return 'video';
  if (text.includes('图像') || text.includes('图片') || text.includes('image')) return 'image';
  if (text.includes('音频') || text.includes('audio') || text.includes('tts')) return 'audio';
  return fallback;
}

function billingAmountToYuan(value: number, denomination?: string | null): number {
  if (!Number.isFinite(value)) return 0;
  if (denomination === '厘') return value / 1000;
  if (denomination === '分') return value / 100;
  return value;
}

function applyBillingDiscount(value: number, discount?: number | null): number {
  if (discount == null || !Number.isFinite(discount)) return value;
  if (discount > 100) return value * (discount / 10000);
  return value * (discount > 1 ? discount / 100 : discount);
}

function billingUnitPriceToYuan(
  item: BillingUnitPriceItem,
  denomination?: string | null,
  discounted = false,
): number {
  const base = billingAmountToYuan(Number(item.pricePerUnit ?? 0), denomination);
  return discounted ? applyBillingDiscount(base, item.discount) : base;
}

function getMarketPriceLines(
  model: ModelItem,
  modality: MarketModality,
  discounted: boolean,
  fallbackPrices: { in: number; out: number },
): MarketPriceLine[] {
  const rule = model.billingRule;
  const denomination = rule?.denominationDefault;

  if (modality === 'image' && rule?.image?.length) {
    return rule.image.map((item) => ({
      label: item.unitSpec && item.unitSpec > 1 ? `${item.unitSpec}张` : '单张',
      value: billingUnitPriceToYuan(item, denomination, discounted),
      unit: item.unitSpec && item.unitSpec > 1 ? `元 / ${item.unitSpec}张` : '元 / 张',
    }));
  }

  if (modality === 'video' && rule?.videoSpec?.length) {
    const minSpec = rule.videoSpec.reduce((min, item) =>
      Number(item.pricePerUnit ?? Infinity) < Number(min.pricePerUnit ?? Infinity) ? item : min,
    );
    return [
      {
        label: '单价',
        value: billingUnitPriceToYuan(minSpec, denomination, discounted),
        unit: '元 / 秒',
      },
    ];
  }

  if (modality === 'audio') {
    const item = getAudioSpeechBillingItem(rule);
    if (item) {
      const denomination = resolveAudioBillingDenomination(rule);
      const unitSpec = item.unitSpec != null && item.unitSpec > 0 ? item.unitSpec : 10000;
      return [
        {
          label: '单价',
          value: billingUnitPriceToYuan(item, denomination, discounted),
          unit: formatAudioSpeechUnitLabel(unitSpec),
        },
      ];
    }
  }

  if (modality === 'image' || modality === 'video' || modality === 'audio') {
    const denomination = modality === 'audio' ? resolveAudioBillingDenomination(rule) : rule?.denominationDefault;
    const officialRaw = Number(model.officialOutputPrice ?? model.outputPrice ?? NaN);
    const discountedRaw = Number(model.discountedOutputPrice ?? fallbackPrices.out ?? NaN);
    const officialValue =
      modality === 'audio'
        ? Number.isFinite(officialRaw)
          ? billingAmountToYuan(officialRaw, denomination)
          : null
        : officialRaw ?? null;
    const platformValue =
      modality === 'audio'
        ? Number.isFinite(discountedRaw)
          ? billingAmountToYuan(discountedRaw, denomination)
          : null
        : fallbackPrices.out;
    return [
      {
        label: modality === 'image' ? '单张' : modality === 'audio' ? '单价' : '每秒',
        value: discounted ? platformValue : officialValue,
        unit:
          modality === 'image'
            ? '元 / 张'
            : modality === 'audio'
            ? formatAudioSpeechUnitLabel(10000)
            : '元 / 秒',
      },
    ];
  }

  return [];
}

function renderMarketPriceLines(
  lines: MarketPriceLine[],
  emphasis: 'muted' | 'strong',
  formatYuan: (n: number) => string = formatModelMarketYuan,
  showFromSuffix = true,
) {
  if (lines.length === 0 || lines.every((line) => line.value == null)) {
    return <span style={{ color: '#d1d5db', fontSize: 12 }}>—</span>;
  }

  const suffix = showFromSuffix ? '起' : '';

  if (lines.length === 1) {
    const [line] = lines;
    return (
      <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2, textAlign: 'right' }}>
        <span
          className="api-hub-table-mono primary"
          style={{
            color: emphasis === 'strong' ? '#111827' : '#6b7280',
            fontWeight: emphasis === 'strong' ? 700 : 500,
            fontSize: 15,
          }}
        >
          ￥{formatYuan(line.value ?? NaN)}
          {suffix}
        </span>
        <span style={{ fontSize: 11, color: '#9ca3af' }}>{line.unit}</span>
      </div>
    );
  }

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
      {lines.map((line) => (
        <div key={`${line.label}-${line.unit}`} style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: emphasis === 'strong' ? 500 : 400 }}>{line.label}</span>
          <span
            className="api-hub-table-mono primary"
            style={{
              color: emphasis === 'strong' ? '#111827' : '#6b7280',
              fontWeight: emphasis === 'strong' ? 700 : 500,
              fontSize: 15,
            }}
          >
            ￥{formatYuan(line.value ?? NaN)}
          </span>
          <span style={{ fontSize: 11, color: '#9ca3af' }}>{line.unit}</span>
        </div>
      ))}
    </div>
  );
}

function renderCardMediaPriceValues(
  lines: MarketPriceLine[],
  className: string,
  showDash = false,
  showFromSuffix = true,
  formatYuan: (n: number) => string = formatModelMarketYuan,
) {
  const validLines = lines.filter((line) => line.value != null);
  if (validLines.length === 0) {
    return showDash ? <span style={{ color: '#d1d5db' }}>—</span> : null;
  }

  const suffix = showFromSuffix ? '起' : '';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
      {validLines.map((line) => (
        <span key={`${line.label}-${line.unit}`} style={{ display: 'inline-flex', alignItems: 'baseline', gap: 6 }}>
          {validLines.length > 1 ? <span style={{ fontSize: 11, color: '#9ca3af' }}>{line.label}</span> : null}
          <span className={className}>
            ¥{formatYuan(line.value ?? NaN)}
            {suffix}
          </span>
        </span>
      ))}
    </div>
  );
}

/* ---- 供应商图标 ---- */
const PROVIDER_GRADIENTS: Record<string, string> = {
  DeepSeek: 'linear-gradient(135deg, #7C3AED, #5B21B6)',
  Alibaba: 'linear-gradient(135deg, #FF6A00, #EE0A24)',
  Moonshot: 'linear-gradient(135deg, #3B82F6, #1D4ED8)',
  ByteDance: 'linear-gradient(135deg, #00C6FF, #0072FF)',
  Zhipu: 'linear-gradient(135deg, #10B981, #059669)',
  CarrotAI: 'linear-gradient(135deg, #F59E0B, #D97706)',
};

const PROVIDER_INITIALS: Record<string, string> = {
  DeepSeek: 'DS',
  Alibaba: 'Q',
  Moonshot: 'K',
  ByteDance: 'D',
  Zhipu: 'G',
};

function ModelIcon({ provider, size = 40, logo }: { provider: string; size?: number; logo?: string | null }) {
  const imgSrc = logo;
  if (provider === 'CarrotAI' && !imgSrc) {
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: 999,
          background: PROVIDER_GRADIENTS.CarrotAI,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          fontSize: size * 0.45,
          boxShadow: '0 1px 4px rgba(217, 119, 6, 0.35)',
        }}
        aria-hidden
      >
        🥕
      </div>
    );
  }
  if (imgSrc) {
    return (
      <img
        src={imgSrc}
        alt={provider}
        style={{
          width: size,
          height: size,
          borderRadius: 10,
          objectFit: 'contain',
          flexShrink: 0,
          background: '#f9fafb',
        }}
      />
    );
  }
  const bg = PROVIDER_GRADIENTS[provider] || 'linear-gradient(135deg, #6B7280, #4B5563)';
  const initial = PROVIDER_INITIALS[provider] || provider.charAt(0);
  return (
    <div
      className="api-hub-model-icon"
      style={{
        width: size,
        height: size,
        background: bg,
        borderRadius: 10,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontWeight: 700,
        fontSize: size * 0.35,
        flexShrink: 0,
      }}
    >
      {initial}
    </div>
  );
}

/* ---- 骨架屏 ---- */
function SkeletonCard() {
  return (
    <div className="api-hub-skeleton-card">
      <div className="api-hub-skeleton-card-header">
        <div className="api-hub-skeleton-block api-hub-skeleton-icon" />
        <div style={{ flex: 1 }}>
          <div className="api-hub-skeleton-block api-hub-skeleton-title" />
          <div className="api-hub-skeleton-block api-hub-skeleton-subtitle" />
        </div>
      </div>
      <div className="api-hub-skeleton-block api-hub-skeleton-desc" />
      <div className="api-hub-skeleton-block api-hub-skeleton-desc-short" />
      <div className="api-hub-skeleton-tags">
        <div className="api-hub-skeleton-block api-hub-skeleton-tag" />
        <div className="api-hub-skeleton-block api-hub-skeleton-tag" />
      </div>
      <div className="api-hub-skeleton-block api-hub-skeleton-params" />
      <div className="api-hub-skeleton-pricing">
        <div className="api-hub-skeleton-block api-hub-skeleton-price" />
        <div className="api-hub-skeleton-block api-hub-skeleton-price" />
      </div>
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className="api-hub-skeleton-row">
      <div className="api-hub-skeleton-block api-hub-skeleton-row-icon" />
      <div className="api-hub-skeleton-row-info">
        <div className="api-hub-skeleton-block api-hub-skeleton-row-name" />
        <div className="api-hub-skeleton-block api-hub-skeleton-row-provider" />
      </div>
      <div className="api-hub-skeleton-block api-hub-skeleton-row-cell" style={{ marginLeft: 24 }} />
      <div className="api-hub-skeleton-block api-hub-skeleton-row-cell" style={{ marginLeft: 24 }} />
      <div className="api-hub-skeleton-block api-hub-skeleton-row-cell" style={{ marginLeft: 24 }} />
      <div className="api-hub-skeleton-block api-hub-skeleton-row-cell" style={{ marginLeft: 24 }} />
      <div className="api-hub-skeleton-block api-hub-skeleton-row-cell" style={{ marginLeft: 24 }} />
    </div>
  );
}

const PLATFORM_DISCOUNT_TOOLTIP =
  '展示折扣仅供参考。系统默认按最高折扣执行；如需申请更优价格与专属权益，请联系商务洽谈。';

function PlatformDiscountBadge({
  variant,
  label,
}: {
  variant: 'table' | 'card';
  label?: string | null;
}) {
  const discountText = typeof label === 'string' ? label.trim() : '';
  if (!discountText) return null;
  return (
    <span className={variant === 'table' ? 'api-hub-discount-badge-pill' : 'api-hub-model-card-discount-badge'}>
      {discountText}
    </span>
  );
}

function isTextCategoryTag(tag: string): boolean {
  return tag === '文本' || tag === 'text' || tag.toLowerCase() === 'text';
}

function shouldHideModelDiscount(model: ModelItem): boolean {
  return model.name.toLowerCase().includes('seedance');
}

const SKELETON_COUNT = 6;

export default function ModelMarket() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [models, setModels] = useState<ModelItem[]>([]);
  const [categories, setCategories] = useState<ModelCategory[]>([]);
  const [activeCategoryId, setActiveCategoryId] = useState<number | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [carrotModalOpen, setCarrotModalOpen] = useState(false);
  const [carrotQrFailed, setCarrotQrFailed] = useState(false);

  const effectiveViewMode = isMobile ? 'grid' : viewMode;

  useEffect(() => {
    if (carrotModalOpen) setCarrotQrFailed(false);
  }, [carrotModalOpen]);

  const activeCategoryName =
    activeCategoryId != null
      ? categories.find((c) => c.id === activeCategoryId)?.name ?? ''
      : '';
  const modality: MarketModality = activeCategoryName.includes('视频')
    ? 'video'
    : activeCategoryName.includes('图像') || activeCategoryName.includes('图片')
    ? 'image'
    : activeCategoryName.includes('音频')
    ? 'audio'
    : 'text';
  const isImageModality = modality === 'image';
  const isVideoModality = modality === 'video';
  const isAudioModality = modality === 'audio';

  const displayModels = useMemo(
    () => (isImageModality || isVideoModality || isAudioModality ? models : mergeModelMarketList(models)),
    [models, isImageModality, isVideoModality, isAudioModality],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(searchQuery.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    fetchModelCategories().then(setCategories).catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    const loadModels = () => {
      setLoading(true);
      fetchModels({
        status: 'active',
        categoryId: activeCategoryId,
        modelName: debouncedSearch || undefined,
      })
        .then(setModels)
        .finally(() => setLoading(false));
    };
    loadModels();

    const handleLoginSuccess = () => loadModels();
    window.addEventListener('login-success', handleLoginSuccess);
    return () => window.removeEventListener('login-success', handleLoginSuccess);
  }, [activeCategoryId, debouncedSearch]);

  const handleCopy = useCallback(async (model: ModelItem) => {
    // const fullName = `${model.channelAlias}-${model.modelId}`;
    const fullName = `${model.modelId}`;
    const ok = await copyToClipboard(fullName);
    if (ok) {
      setCopiedId(model.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  }, []);

  const priceUnitText = isImageModality
    ? '元 / 张 起'
    : isVideoModality
    ? '元 / 秒 起'
    : isAudioModality
    ? '元 / 万字符 起'
    : '元 / 百万 tokens 起';
  const inputRowLabel = isImageModality || isVideoModality ? '提示词' : '输入';
  const outputRowLabel = isImageModality
    ? '单张'
    : isVideoModality
    ? '每秒'
    : '输出';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      {/* 页面标题 */}
      <div style={{ marginBottom: 24, flexShrink: 0 }}>
        <h1 className="api-hub-page-title">模型市场</h1>
        <p className="api-hub-page-subtitle" style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span>探索优质 AI 模型，找到最适合您的解决方案。列表中的入/出价为目录最低，多档模型会标注「起」；具体上下文与各档单价请在模型详情页查看。</span>
          <span className="api-hub-discount-info-anchor">
            <button type="button" className="api-hub-discount-info-trigger" aria-label="折扣说明">
              <Info size={16} strokeWidth={2} style={{ color: '#6b7280' }} />
            </button>
            <span className="api-hub-discount-tooltip api-hub-discount-tooltip--subtitle" role="tooltip">
              {PLATFORM_DISCOUNT_TOOLTIP}
            </span>
          </span>
        </p>
      </div>

      {/* 分类标签 + 搜索 + 视图切换 */}
      {categories.length > 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            marginBottom: 16,
            flexShrink: 0,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {[{ id: null as number | null, name: '全部' }, ...categories.map((c) => ({ id: c.id as number | null, name: c.name }))].map((cat) => {
              const active = activeCategoryId === cat.id;
              return (
                <button
                  key={cat.id ?? 'all'}
                  type="button"
                  onClick={() => setActiveCategoryId(cat.id)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 999,
                    fontSize: 13,
                    fontWeight: 500,
                    border: '1px solid',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    background: active ? '#6673FF' : '#fff',
                    color: active ? '#fff' : '#4b5563',
                    borderColor: active ? '#6673FF' : '#e5e7eb',
                  }}
                >
                  {cat.name}
                </button>
              );
            })}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginLeft: 'auto' }}>
            <div style={{ position: 'relative', width: 240 }}>
              <Search
                size={16}
                strokeWidth={2}
                style={{
                  position: 'absolute',
                  left: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#9ca3af',
                  pointerEvents: 'none',
                }}
              />
              <input
                type="search"
                className="api-hub-input"
                placeholder="搜索模型名称"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: 34, width: '100%' }}
              />
            </div>
            {!isMobile && (
              <div className="api-hub-view-toggle">
                <button
                  type="button"
                  className={`api-hub-view-toggle-btn${viewMode === 'list' ? ' active' : ''}`}
                  onClick={() => setViewMode('list')}
                  title="列表视图"
                >
                  <List size={16} strokeWidth={2} />
                </button>
                <button
                  type="button"
                  className={`api-hub-view-toggle-btn${viewMode === 'grid' ? ' active' : ''}`}
                  onClick={() => setViewMode('grid')}
                  title="卡片视图"
                >
                  <LayoutGrid size={16} strokeWidth={2} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 内容区 */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {loading && models.length === 0 ? (
          /* ========== 骨架屏 ========== */
          effectiveViewMode === 'list' ? (
            <div
              className="api-hub-table-wrap"
              style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
            >
              <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
                <table className="api-hub-table" style={{ whiteSpace: 'nowrap', minWidth: 1100 }}>
                  <thead>
                    <tr>
                      <th>模型名称</th>
                      <th style={{ textAlign: 'right' }}>
                        <div>官方挂牌价</div>
                      </th>
                      <th style={{ textAlign: 'center' }}>
                        <div>平台折扣</div>
                      </th>
                      <th style={{ textAlign: 'right' }}>
                        <div style={{ color: '#6673FF' }}>平台折后价</div>
                      </th>
                      <th style={{ textAlign: 'center', width: 96 }}>详情</th>
                    </tr>
                  </thead>
                </table>
                {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
                  <SkeletonRow key={i} />
                ))}
              </div>
            </div>
          ) : (
            <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
              <div className="api-hub-model-grid">
                {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            </div>
          )
        ) : effectiveViewMode === 'list' ? (
          /* ========== 列表视图 ========== */
          <div
            className="api-hub-table-wrap"
            style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
          >
            <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
              <table className="api-hub-table" style={{ whiteSpace: 'nowrap', minWidth: 1100 }}>
                <thead>
                  <tr>
                    <th>模型名称</th>
                    <th style={{ textAlign: 'right' }}>
                      <div>官方挂牌价</div>
                    </th>
                    <th style={{ textAlign: 'center' }}>
                      <div>平台折扣</div>
                    </th>
                    <th style={{ textAlign: 'right' }}>
                      <div style={{ color: '#6673FF' }}>平台折后价</div>
                    </th>
                    <th style={{ textAlign: 'center', width: 96 }}>详情</th>
                  </tr>
                </thead>
                <tbody>
                  {displayModels.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="api-hub-table-empty">
                        {debouncedSearch ? '未找到匹配的模型' : '暂无可用模型'}
                      </td>
                    </tr>
                  ) : (
                    displayModels.map((m) => {
                      const eff = effectiveDiscountedPrices(m);
                      const isCarrot = m.id === CARROT_FLAGSHIP_MODEL.id;
                      const modelModality = inferMarketModality(m, modality);
                      const modelIsImage = modelModality === 'image';
                      const modelIsVideo = modelModality === 'video';
                      const modelIsAudio = modelModality === 'audio';
                      const tokenIoPrices = getTokenIoMarketPrices(m);
                      const modelUsesTokenIoPricing = tokenIoPrices != null;
                      const modelUsesOfficialPlatform = usesOfficialPlatformPriceLayout(m, modelModality);
                      const rowInputLabel = modelUsesTokenIoPricing ? '输入' : inputRowLabel;
                      const rowOutputLabel = modelUsesTokenIoPricing ? '输出' : outputRowLabel;
                      const officialMediaPriceLines = getMarketPriceLines(m, modelModality, false, eff);
                      const platformMediaPriceLines = getMarketPriceLines(m, modelModality, true, eff);
                      const activeCategoryName =
                        activeCategoryId != null
                          ? categories.find((c) => c.id === activeCategoryId)?.name
                          : undefined;
                      const detailState = { categoryName: activeCategoryName };
                      return (
                        <tr key={m.id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                              <ModelIcon provider={m.provider} size={40} logo={m.logo} />
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                  <Link
                                    to={`/hub/models/${encodeURIComponent(m.id)}`}
                                    state={detailState}
                                    className="api-hub-model-name"
                                    style={{
                                      textDecoration: 'none',
                                      ...(isCarrot
                                        ? {
                                            background: 'linear-gradient(90deg, #92400e, #d97706)',
                                            WebkitBackgroundClip: 'text',
                                            WebkitTextFillColor: 'transparent',
                                            backgroundClip: 'text',
                                            fontWeight: 700,
                                          }
                                        : { color: 'inherit' }),
                                    }}
                                  >
                                    {m.name}
                                  </Link>
                                  {!modelIsImage && !modelIsVideo ? (
                                    <>
                                      <button
                                        type="button"
                                        className="api-hub-btn-ghost"
                                        onClick={() => handleCopy(m)}
                                        title="复制模型标识"
                                        style={{ padding: 4 }}
                                      >
                                        {copiedId === m.id ? (
                                          <Check size={14} style={{ color: '#10B981' }} />
                                        ) : (
                                          <Copy size={14} />
                                        )}
                                      </button>
                                      {copiedId === m.id && <span className="api-hub-copied-text">已复制</span>}
                                    </>
                                  ) : null}
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                  {m.tags.map((tag) => (
                                    <span key={tag} className="api-hub-tag">
                                      {renderTag(tag)}
                                    </span>
                                  ))}
                                </div>
                                {isCarrot && (
                                  <button
                                    type="button"
                                    className="api-hub-btn-secondary"
                                    onClick={() => setCarrotModalOpen(true)}
                                    style={{
                                      alignSelf: 'flex-start',
                                      marginTop: 4,
                                      fontSize: 12,
                                      padding: '6px 10px',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: 6,
                                      background: '#fffbeb',
                                      borderColor: '#fcd34d',
                                      color: '#92400e',
                                    }}
                                  >
                                    <Lock size={14} />
                                    联系客服解锁
                                  </button>
                                )}
                              </div>
                            </div>
                          </td>
                          <td style={{ textAlign: 'right', verticalAlign: 'middle' }}>
                            {modelUsesOfficialPlatform ? (
                              renderMarketPriceLines(
                                officialMediaPriceLines,
                                'muted',
                                modelIsAudio ? formatAudioMarketYuan : formatModelMarketYuan,
                                !modelIsAudio,
                              )
                            ) : modelUsesTokenIoPricing && tokenIoPrices ? (
                              <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                                  <span style={{ fontSize: 11, color: '#9ca3af' }}>{rowInputLabel}</span>
                                  {tokenIoPrices.inputOfficial != null ? (
                                    <span className="api-hub-table-mono primary" style={{ color: '#6b7280', fontWeight: 500 }}>
                                      ￥{formatModelMarketYuan(tokenIoPrices.inputOfficial)}
                                    </span>
                                  ) : (
                                    <span style={{ color: '#d1d5db', fontSize: 12 }}>—</span>
                                  )}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                                  <span style={{ fontSize: 11, color: '#9ca3af' }}>{rowOutputLabel}</span>
                                  {tokenIoPrices.outputOfficial != null ? (
                                    <span className="api-hub-table-mono primary" style={{ color: '#6b7280', fontWeight: 500 }}>
                                      ￥{formatModelMarketYuan(tokenIoPrices.outputOfficial)}
                                    </span>
                                  ) : (
                                    <span style={{ color: '#d1d5db', fontSize: 12 }}>—</span>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                                  <span style={{ fontSize: 11, color: '#9ca3af' }}>{inputRowLabel}</span>
                                  {m.officialInputPrice != null || m.inputPrice != null ? (
                                    <span className="api-hub-table-mono primary" style={{ color: '#6b7280', fontWeight: 500 }}>
                                      ￥{formatModelMarketYuan(m.officialInputPrice ?? m.inputPrice)}
                                    </span>
                                  ) : (
                                    <span style={{ color: '#d1d5db', fontSize: 12 }}>—</span>
                                  )}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                                  <span style={{ fontSize: 11, color: '#9ca3af' }}>{outputRowLabel}</span>
                                  {m.officialOutputPrice != null || m.outputPrice != null ? (
                                    <span className="api-hub-table-mono primary" style={{ color: '#6b7280', fontWeight: 500 }}>
                                      ￥{formatModelMarketYuan(m.officialOutputPrice ?? m.outputPrice)}
                                    </span>
                                  ) : (
                                    <span style={{ color: '#d1d5db', fontSize: 12 }}>—</span>
                                  )}
                                </div>
                              </div>
                            )}
                          </td>
                          <td className="api-hub-table-discount-cell" style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                            {!isCarrot && !shouldHideModelDiscount(m) ? (
                              <PlatformDiscountBadge variant="table" label={m.consumerDiscountLabel} />
                            ) : null}
                          </td>
                          <td style={{ textAlign: 'right', verticalAlign: 'middle' }}>
                            {modelUsesOfficialPlatform ? (
                              renderMarketPriceLines(
                                platformMediaPriceLines,
                                'strong',
                                modelIsAudio ? formatAudioMarketYuan : formatModelMarketYuan,
                                !modelIsAudio,
                              )
                            ) : modelUsesTokenIoPricing && tokenIoPrices ? (
                              <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                                  <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 500 }}>{rowInputLabel}</span>
                                  {tokenIoPrices.inputPlatform != null ? (
                                    <span className="api-hub-table-mono" style={{ fontWeight: 700, fontSize: 15, color: '#111827' }}>
                                      ￥{formatModelMarketYuan(tokenIoPrices.inputPlatform)}
                                    </span>
                                  ) : (
                                    <span style={{ color: '#d1d5db', fontSize: 12 }}>—</span>
                                  )}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                                  <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 500 }}>{rowOutputLabel}</span>
                                  {tokenIoPrices.outputPlatform != null ? (
                                    <span className="api-hub-table-mono" style={{ fontWeight: 700, fontSize: 15, color: '#111827' }}>
                                      ￥{formatModelMarketYuan(tokenIoPrices.outputPlatform)}
                                    </span>
                                  ) : (
                                    <span style={{ color: '#d1d5db', fontSize: 12 }}>—</span>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                                  <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 500 }}>{inputRowLabel}</span>
                                  <span className="api-hub-table-mono" style={{ fontWeight: 700, fontSize: 15, color: '#111827' }}>
                                    ￥{formatModelMarketYuan(eff.in)}
                                  </span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                                  <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 500 }}>{outputRowLabel}</span>
                                  <span className="api-hub-table-mono" style={{ fontWeight: 700, fontSize: 15, color: '#111827' }}>
                                    ￥{formatModelMarketYuan(eff.out)}
                                  </span>
                                </div>
                              </div>
                            )}
                          </td>
                          <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                            <Link
                              to={`/hub/models/${encodeURIComponent(m.id)}`}
                              state={detailState}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                                fontSize: 14,
                                fontWeight: 500,
                                color: '#6673FF',
                                textDecoration: 'none',
                              }}
                            >
                              进入
                              <ExternalLink size={14} />
                            </Link>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* ========== 卡片视图 ========== */
          <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
            <div className="api-hub-model-grid">
              {displayModels.length === 0 ? (
                <div className="api-hub-model-grid-empty">
                  {debouncedSearch ? '未找到匹配的模型' : '暂无可用模型'}
                </div>
              ) : (
                displayModels.map((m) => {
                  const eff = effectiveDiscountedPrices(m);
                  const isCarrot = m.id === CARROT_FLAGSHIP_MODEL.id;
                  const modelModality = inferMarketModality(m, modality);
                  const modelIsImage = modelModality === 'image';
                  const modelIsVideo = modelModality === 'video';
                  const modelIsAudio = modelModality === 'audio';
                  const tokenIoPrices = getTokenIoMarketPrices(m);
                  const modelUsesTokenIoPricing = tokenIoPrices != null;
                  const modelUsesOfficialPlatform = usesOfficialPlatformPriceLayout(m, modelModality);
                  const officialMediaPriceLines = getMarketPriceLines(m, modelModality, false, eff);
                  const platformMediaPriceLines = getMarketPriceLines(m, modelModality, true, eff);
                  const mediaPriceUnitText =
                    platformMediaPriceLines[0]?.unit ||
                    (modelIsImage ? '元 / 张' : modelIsAudio ? '元 / 万字符' : '元 / 秒');
                  const mo = m.maxOutput?.trim() ?? '';
                  const showMaxOutput = mo !== '' && mo !== '0' && Number(mo) !== 0;
                  const cardDesc =
                    m.description?.trim() ||
                    (modelIsImage
                      ? '图像生成模型，适用于文生图与视觉内容创作。'
                      : modelIsVideo
                      ? '视频生成模型，适用于文生视频与动态内容制作。'
                      : modelIsAudio
                      ? '目录价按「元/万字符」计（与网关对 input 的 Unicode 码点计数及日志 input_tokens 语义一致）。'
                      : `文本推理模型，支持 ${m.context} 上下文${showMaxOutput ? `，最大输出 ${m.maxOutput}` : ''}。`);

                  const detailPath = `/hub/models/${encodeURIComponent(m.id)}`;
                  const activeCategoryName =
                    activeCategoryId != null
                      ? categories.find((c) => c.id === activeCategoryId)?.name
                      : undefined;
                  const detailState = { categoryName: activeCategoryName };

                  return (
                    <div
                      key={m.id}
                      className={`api-hub-model-card${isCarrot ? ' api-hub-model-card--premium' : ''} api-hub-model-card--clickable`}
                      role="link"
                      tabIndex={0}
                      onClick={() => navigate(detailPath, { state: detailState })}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          navigate(detailPath, { state: detailState });
                        }
                      }}
                    >
                      <div className="api-hub-model-card-top">
                        <div className="api-hub-model-card-title-row">
                          <ModelIcon provider={m.provider} size={48} logo={m.logo} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                              <span
                                className="api-hub-model-card-name"
                                style={{
                                  ...(isCarrot
                                    ? {
                                        background: 'linear-gradient(90deg, #92400e, #d97706)',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                        backgroundClip: 'text',
                                      }
                                    : {}),
                                }}
                              >
                                {m.name}
                              </span>
                              {!modelIsImage && !modelIsVideo ? (
                                <button
                                  type="button"
                                  className="api-hub-btn-ghost"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCopy(m);
                                  }}
                                  title="复制模型标识"
                                  style={{ padding: 4, flexShrink: 0, color: '#9ca3af' }}
                                >
                                  {copiedId === m.id ? (
                                    <Check size={16} style={{ color: '#10B981' }} />
                                  ) : (
                                    <Copy size={16} />
                                  )}
                                </button>
                              ) : null}
                            </div>
                          </div>
                        </div>
                        {!isCarrot && !shouldHideModelDiscount(m) && m.consumerDiscountLabel?.trim() ? (
                          <span
                            className="api-hub-model-card-discount-stop"
                            onClick={(e) => e.stopPropagation()}
                            onKeyDown={(e) => e.stopPropagation()}
                          >
                            <PlatformDiscountBadge variant="card" label={m.consumerDiscountLabel} />
                          </span>
                        ) : null}
                      </div>

                      {m.tags && m.tags.length > 0 && (
                        <div className="api-hub-model-card-tags">
                          {m.tags.map((tag) => (
                            <span
                              key={tag}
                              className={`api-hub-tag ${isTextCategoryTag(tag) ? 'api-hub-model-card-tag--accent' : 'api-hub-model-card-tag--muted'}`}
                            >
                              {renderTag(tag)}
                            </span>
                          ))}
                        </div>
                      )}

                      <p className="api-hub-model-card-desc" style={{ marginBottom: 0 }}>
                        {cardDesc}
                      </p>

                      <div className="api-hub-model-card-pricing-block">
                        {modelUsesOfficialPlatform ? (
                          <>
                            <div className="api-hub-model-card-price-line">
                              <div className="api-hub-model-card-price-label-wrap">
                                <span>官方</span>
                              </div>
                              <div className="api-hub-model-card-price-values">
                                {renderCardMediaPriceValues(
                                  officialMediaPriceLines,
                                  'api-hub-model-card-price-old',
                                  true,
                                  !modelIsAudio,
                                  modelIsAudio ? formatAudioMarketYuan : formatModelMarketYuan,
                                )}
                              </div>
                            </div>
                            <div className="api-hub-model-card-price-line">
                              <div className="api-hub-model-card-price-label-wrap">
                                <span>平台</span>
                              </div>
                              <div className="api-hub-model-card-price-values">
                                {renderCardMediaPriceValues(
                                  platformMediaPriceLines,
                                  'api-hub-model-card-price-new',
                                  false,
                                  !modelIsAudio,
                                  modelIsAudio ? formatAudioMarketYuan : formatModelMarketYuan,
                                )}
                              </div>
                            </div>
                            <div className="api-hub-model-card-price-unit">{mediaPriceUnitText}</div>
                          </>
                        ) : modelUsesTokenIoPricing && tokenIoPrices ? (
                          <>
                            <div className="api-hub-model-card-price-line">
                              <div className="api-hub-model-card-price-label-wrap">
                                <Import size={15} strokeWidth={2} aria-hidden />
                                <span>输入</span>
                              </div>
                              <div className="api-hub-model-card-price-values">
                                {tokenIoPrices.inputOfficial != null &&
                                tokenIoPrices.inputOfficial !== tokenIoPrices.inputPlatform ? (
                                  <span className="api-hub-model-card-price-old">
                                    ¥{formatModelMarketYuan(tokenIoPrices.inputOfficial)}
                                  </span>
                                ) : null}
                                {tokenIoPrices.inputPlatform != null ? (
                                  <span className="api-hub-model-card-price-new">
                                    ¥{formatModelMarketYuan(tokenIoPrices.inputPlatform)}起
                                  </span>
                                ) : (
                                  <span style={{ color: '#d1d5db' }}>—</span>
                                )}
                              </div>
                            </div>
                            <div className="api-hub-model-card-price-line">
                              <div className="api-hub-model-card-price-label-wrap">
                                <Send size={15} strokeWidth={2} aria-hidden />
                                <span>输出</span>
                              </div>
                              <div className="api-hub-model-card-price-values">
                                {tokenIoPrices.outputOfficial != null &&
                                tokenIoPrices.outputOfficial !== tokenIoPrices.outputPlatform ? (
                                  <span className="api-hub-model-card-price-old">
                                    ¥{formatModelMarketYuan(tokenIoPrices.outputOfficial)}
                                  </span>
                                ) : null}
                                {tokenIoPrices.outputPlatform != null ? (
                                  <span className="api-hub-model-card-price-new">
                                    ¥{formatModelMarketYuan(tokenIoPrices.outputPlatform)}起
                                  </span>
                                ) : (
                                  <span style={{ color: '#d1d5db' }}>—</span>
                                )}
                              </div>
                            </div>
                            <div className="api-hub-model-card-price-unit">{tokenIoPrices.unit} 起</div>
                          </>
                        ) : (
                          <>
                            <div className="api-hub-model-card-price-line">
                              <div className="api-hub-model-card-price-label-wrap">
                                <Import size={15} strokeWidth={2} aria-hidden />
                                <span>{inputRowLabel}</span>
                              </div>
                              <div className="api-hub-model-card-price-values">
                                {(m.officialInputPrice ?? m.inputPrice) > 0 ? (
                                  <span className="api-hub-model-card-price-old">
                                    ¥{formatModelMarketYuan(m.officialInputPrice ?? m.inputPrice)}
                                  </span>
                                ) : null}
                                <span className="api-hub-model-card-price-new">¥{formatModelMarketYuan(eff.in)}</span>
                              </div>
                            </div>
                            <div className="api-hub-model-card-price-line">
                              <div className="api-hub-model-card-price-label-wrap">
                                <Send size={15} strokeWidth={2} aria-hidden />
                                <span>{outputRowLabel}</span>
                              </div>
                              <div className="api-hub-model-card-price-values">
                                {(m.officialOutputPrice ?? m.outputPrice) > 0 ? (
                                  <span className="api-hub-model-card-price-old">
                                    ¥{formatModelMarketYuan(m.officialOutputPrice ?? m.outputPrice)}
                                  </span>
                                ) : null}
                                <span className="api-hub-model-card-price-new">¥{formatModelMarketYuan(eff.out)}</span>
                              </div>
                            </div>
                            <div className="api-hub-model-card-price-unit">{priceUnitText}</div>
                          </>
                        )}
                      </div>

                      {isCarrot && (
                        <button
                          type="button"
                          className="api-hub-btn-secondary"
                          onClick={(e) => {
                            e.stopPropagation();
                            setCarrotModalOpen(true);
                          }}
                          style={{
                            marginTop: 12,
                            fontSize: 12,
                            padding: '8px 12px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            background: '#fffbeb',
                            borderColor: '#fcd34d',
                            color: '#92400e',
                          }}
                        >
                          <Lock size={14} />
                          联系客服解锁
                        </button>
                      )}

                      {m.releasedAt ? (
                        <div className="api-hub-model-card-footer">发布 {m.releasedAt}</div>
                      ) : null}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {carrotModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(17, 24, 39, 0.4)',
            backdropFilter: 'blur(4px)',
            padding: 16,
          }}
          role="presentation"
          onClick={() => setCarrotModalOpen(false)}
        >
          <div
            className="api-hub-table-wrap"
            style={{ maxWidth: 400, width: '100%', padding: 24, position: 'relative' }}
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setCarrotModalOpen(false)}
              aria-label="关闭"
              style={{
                position: 'absolute',
                top: 12,
                right: 12,
                padding: 4,
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                color: '#9ca3af',
              }}
            >
              <X size={20} />
            </button>
            <h3 style={{ fontSize: 18, fontWeight: 600, margin: '0 32px 8px 0', color: '#111827' }}>解锁 CarrotAI 旗舰</h3>
            <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.6, marginBottom: 16 }}>
              该模型为高阶权益目录项。请联系客服或您的客户经理开通后，即可在控制台与 API 中调用。
            </p>
            <div style={{ margin: '16px auto', display: 'flex', justifyContent: 'center' }}>
              {carrotQrFailed ? (
                <div
                  style={{
                    width: 144,
                    height: 144,
                    borderRadius: 12,
                    background: 'linear-gradient(to bottom right, #fffbeb, #f1f5f9)',
                    border: '1px dashed #fcd34d',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 12,
                    color: 'rgba(146, 64, 14, 0.75)',
                    textAlign: 'center',
                    padding: 12,
                  }}
                >
                  请将二维码图片放到 public/support/wechat-qr.png
                </div>
              ) : (
                <img
                  src="/support/wechat-qr.png"
                  alt="客服微信二维码"
                  width={144}
                  height={144}
                  style={{
                    width: 144,
                    height: 144,
                    borderRadius: 12,
                    objectFit: 'contain',
                    border: '1px solid #e5e7eb',
                    display: 'block',
                  }}
                  onError={() => setCarrotQrFailed(true)}
                />
              )}
            </div>
            <button type="button" className="api-hub-btn-primary" style={{ width: '100%', marginTop: 8 }} onClick={() => setCarrotModalOpen(false)}>
              知道了
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
