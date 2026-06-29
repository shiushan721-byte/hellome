import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, Link, useLocation } from 'react-router-dom';
import { ArrowLeft, Copy, Check } from 'lucide-react';

import type { ModelItem, ModelTierBillingItem } from '../lib/api';
import { Dropdown } from '../components/Dropdown';
import {
  CARROT_FLAGSHIP_MODEL,
  fetchModels,
  fetchModelCategories,
  mergeModelMarketList,
  copyToClipboard,
  effectiveDiscountedPrices,
  formatTokenCountDisplay,
} from '../lib/api';
import '../api-hub.css';

const TAG_EMOJI: Record<string, string> = {
  Tool: '🛠️',
  Reasoning: '🧠',
  Vision: '👁️',
};

type ModelModality = 'text' | 'image' | 'video' | 'audio';
type AudioSpeechBillingItem = BillingUnitPrice & { spec?: string | null };
type VideoDurationUnit = '秒' | '分' | '次';
type VideoVoiceFilter = 'all' | 'with_audio' | 'silent';
type SeedanceReferenceFilter = 'all' | 'with_reference' | 'without_reference';
type VideoSpecPrice = NonNullable<NonNullable<ModelItem['billingRule']>['videoSpec']>[number];
type VideoTokenPrice = BillingUnitPrice & { resolution?: string | null; videoTokenSpec?: string | null };
type VideoTokenRow = { id: string; label: string; item: VideoTokenPrice };
type ImageTokenBillingEntry = {
  imageTokenSpec?: string | null;
  input?: BillingUnitPrice | null;
  output?: BillingUnitPrice | null;
};
type ImageTokenRow = { id: string; label: string; input: BillingUnitPrice; output: BillingUnitPrice };
type QuickStartExample = { label: string; code: string };
type QuickStartMarkdownBlock =
  | { type: 'heading'; level: number; text: string }
  | { type: 'code'; code: string; language?: string }
  | { type: 'paragraph'; text: string }
  | { type: 'list'; items: string[] }
  | { type: 'table'; headers: string[]; rows: string[][] };

function renderTag(tag: string): string {
  return TAG_EMOJI[tag] ? `${TAG_EMOJI[tag]} ${tag}` : tag;
}

function includesAnyKeyword(text: string, keywords: string[]): boolean {
  const normalized = text.toLowerCase();
  return keywords.some((keyword) => normalized.includes(keyword.toLowerCase()));
}

function videoDurationUnitFromPriceValue(v: number): VideoDurationUnit {
  if (v === 60) return '分';
  if (v === -1) return '次';
  return '秒';
}

function videoVoiceTypeFromLabel(label: string): 'with_audio' | 'silent' | 'unknown' {
  const normalized = (label || '').toLowerCase();
  if (normalized.includes('有声') || normalized.includes('voice')) return 'with_audio';
  if (normalized.includes('无声') || normalized.includes('silent')) return 'silent';
  return 'unknown';
}

function videoVoiceTypeFromSpec(audioType?: string | null): 'with_audio' | 'silent' | 'unknown' {
  const normalized = (audioType || '').toLowerCase();
  if (normalized.includes('with_audio') || normalized.includes('有声')) return 'with_audio';
  if (normalized.includes('no_audio') || normalized.includes('silent') || normalized.includes('无声')) return 'silent';
  return 'unknown';
}

function videoVoiceLabelFromSpec(audioType?: string | null): string {
  const type = videoVoiceTypeFromSpec(audioType);
  if (type === 'with_audio') return '有声';
  if (type === 'silent') return '无声';
  return '默认';
}

function seedanceReferenceTypeFromLabel(label: string): 'with_reference' | 'without_reference' | 'unknown' {
  const normalized = (label || '').toLowerCase();
  if (normalized.includes('有参考视频') || normalized.includes('包含视频输入') || normalized.includes('with_video_input')) {
    return 'with_reference';
  }
  if (normalized.includes('无参考视频') || normalized.includes('不含视频输入') || normalized.includes('without_video_input') || normalized.includes('no_video_input')) {
    return 'without_reference';
  }
  return 'unknown';
}

function tierDisplayLabel(t: ModelTierBillingItem): string {
  return t.label?.trim() || tierOptionLabel(t);
}

function inferVideoPricingMode(tiers: ModelTierBillingItem[]): 'token' | 'duration' {
  const joinedLabels = tiers.map((t) => t.label || '').join(' ').toLowerCase();
  if (joinedLabels.includes('token') || joinedLabels.includes('tok')) return 'token';
  if (tiers.some((t) => t.label && videoVoiceTypeFromLabel(t.label) !== 'unknown')) return 'duration';
  if (tiers.some((t) => t.cacheStoragePrice != null && t.cacheStoragePrice > 0)) return 'duration';
  return 'token';
}

async function attachCategoryName(model: ModelItem): Promise<ModelItem> {
  if (model.categoryName || model.modelType) return model;
  try {
    const categories = await fetchModelCategories();
    const matches = await Promise.all(
      categories.map(async (category) => {
        try {
          const categoryModels = await fetchModels({ status: 'active', categoryId: category.id });
          return categoryModels.some((m) => m.id === model.id) ? category.name : '';
        } catch {
          return '';
        }
      }),
    );
    const categoryName = matches.find(Boolean);
    return categoryName ? { ...model, categoryName } : model;
  } catch {
    return model;
  }
}

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

function ModelIcon({
  provider,
  size = 40,
  logo,
}: {
  provider: string;
  size?: number;
  logo?: string | null;
}) {
  const imgSrc = logo;
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
          border: '1px solid #f3f4f6',
        }}
      />
    );
  }
  if (provider === 'CarrotAI') {
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
          boxShadow: '0 1px 3px rgba(217, 119, 6, 0.25)',
        }}
        aria-hidden
      >
        🥕
      </div>
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

function minTierPrices(tiers: ModelTierBillingItem[]): { in: number; out: number } {
  return {
    in: Math.min(...tiers.map((t) => t.inputPrice)),
    out: Math.min(...tiers.map((t) => t.outputPrice)),
  };
}

function tierOptionLabel(t: ModelTierBillingItem): string {
  return `${formatTokenCountDisplay(t.minQuantity)} ~ ${formatTokenCountDisplay(t.maxQuantity)}`;
}

function formatYuanDisplay(v: number): string {
  if (!Number.isFinite(v)) return '—';
  return v.toFixed(4).replace(/\.?0+$/, '');
}

/** 档位单价等：有小数保留有效位，整数不尾随 .0000（与模型市场卡片一致） */
function formatTierPriceYuan(n: number): string {
  if (!Number.isFinite(n)) return '—';
  return n.toFixed(4).replace(/\.?0+$/, '');
}

type BillingUnitPrice = NonNullable<NonNullable<ModelItem['billingRule']>['image']>[number];

function billingAmountToYuan(value: number, denomination?: string | null): number {
  if (!Number.isFinite(value)) return 0;
  const normalized = (denomination || '').toUpperCase();
  if (denomination === '厘' || normalized === 'CNY_LI') return value / 1000;
  if (denomination === '分' || normalized === 'CNY_FEN') return value / 100;
  return value;
}

function normalizeAudioSpeechBillingItem(raw: unknown): AudioSpeechBillingItem | null {
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
    spec: typeof item.spec === 'string' ? item.spec : null,
    tiers: null,
  };
}

function getAudioSpeechBillingItem(rule: ModelItem['billingRule'] | null | undefined): AudioSpeechBillingItem | null {
  if (!rule?.audio?.speech) return null;
  const speech = rule.audio.speech;
  const raw = Array.isArray(speech) ? speech[0] : speech;
  return normalizeAudioSpeechBillingItem(raw);
}

function formatAudioBillingUnitLabel(unitSpec?: number | null): string {
  const spec = unitSpec != null && unitSpec > 0 ? unitSpec : 10000;
  if (spec === 10000) return '万字符';
  if (spec === 1000000) return '百万字符';
  if (spec === 1000) return '千字符';
  if (spec === 1) return '字符';
  return `${spec}字符`;
}

function formatAudioPriceUnitLabel(unitSpec?: number | null): string {
  const unit = formatAudioBillingUnitLabel(unitSpec);
  return unit.startsWith('元') ? unit : `元 / ${unit}`;
}

function formatAudioBillingUnitPhrase(unitSpec?: number | null): string {
  const label = formatAudioBillingUnitLabel(unitSpec);
  return label === '万字符' || label === '百万字符' || label === '千字符' ? label : `${unitSpec ?? 1}${label}`;
}

function formatAudioSpeechSpecLabel(spec?: string | null): string {
  const normalized = (spec || '').trim().toLowerCase();
  if (!normalized || normalized === 'default') return '默认';
  return spec!.trim();
}

function inferModelModality(model: ModelItem, categoryName: string): ModelModality {
  const rule = model.billingRule;
  if (getAudioSpeechBillingItem(rule)) return 'audio';
  if (hasImageTokenBilling(rule)) return 'image';

  const billingType = rule?.billingType?.toLowerCase();
  if (billingType?.includes('video')) return 'video';
  if (billingType?.includes('image')) return 'image';
  if (billingType?.includes('audio')) return 'audio';

  const categoryText = categoryName || model.categoryName || model.modelType || '';
  if (includesAnyKeyword(categoryText, ['视频', 'video'])) return 'video';
  if (includesAnyKeyword(categoryText, ['图像', '图片', 'image'])) return 'image';
  if (includesAnyKeyword(categoryText, ['音频', 'audio', 'tts', '语音'])) return 'audio';

  const modelText = [model.name, model.modelId, model.id, ...(model.tags ?? [])].join(' ');
  if (includesAnyKeyword(modelText, ['视频', '文生视频', 'video', 'sora', 'veo', 'kling', 'seedance'])) {
    return 'video';
  }
  if (includesAnyKeyword(modelText, ['图像', '图片', '文生图', '绘图', 'image', 'dall', 'gpt-image', 'imagen', 'flux'])) {
    return 'image';
  }
  if (includesAnyKeyword(modelText, ['音频', 'audio', 'tts', '语音', 'cosyvoice', 'speech'])) {
    return 'audio';
  }
  return 'text';
}

function applyBillingDiscount(value: number, discount?: number | null): number {
  if (discount == null || !Number.isFinite(discount)) return value;
  if (discount > 100) return value * (discount / 10000);
  return value * (discount > 1 ? discount / 100 : discount);
}

function billingUnitPriceToYuan(item: BillingUnitPrice, denomination?: string | null, discounted = false): number {
  const base = billingAmountToYuan(Number(item.pricePerUnit ?? 0), denomination);
  return discounted ? applyBillingDiscount(base, item.discount) : base;
}

function getLowestBillingUnitPrice(items: BillingUnitPrice[] | null | undefined): BillingUnitPrice | null {
  if (!items?.length) return null;
  return items.reduce((min, item) =>
    Number(item.pricePerUnit ?? Infinity) < Number(min.pricePerUnit ?? Infinity) ? item : min,
  );
}

function normalizeBillingUnitPrice(item: unknown): BillingUnitPrice | null {
  if (!item || typeof item !== 'object' || Array.isArray(item)) return null;
  const raw = item as Partial<BillingUnitPrice>;
  const pricePerUnit = Number(raw.pricePerUnit);
  const unitSpec = raw.unitSpec == null ? 1000000 : Number(raw.unitSpec);
  if (!Number.isFinite(pricePerUnit) || !Number.isFinite(unitSpec)) return null;
  return {
    ...raw,
    pricePerUnit,
    unitSpec,
  };
}

function getTokenCacheBillingItem(token: unknown, tier?: ModelTierBillingItem | null, tierIndex = 0): BillingUnitPrice | null {
  if (!token || typeof token !== 'object' || Array.isArray(token)) return null;
  const cache = (token as { cache?: unknown }).cache;
  if (!cache || typeof cache !== 'object') return null;

  const rawItems = Array.isArray(cache)
    ? cache
    : Array.isArray((cache as { tiers?: unknown }).tiers)
    ? (cache as { tiers: unknown[] }).tiers
    : [cache];
  if (rawItems.length === 0) return null;

  const matchedByRange = tier
    ? rawItems.find((item) => {
        if (!item || typeof item !== 'object' || Array.isArray(item)) return false;
        const raw = item as { minQuantity?: unknown; maxQuantity?: unknown };
        return String(raw.minQuantity ?? '') === tier.minQuantity && String(raw.maxQuantity ?? '') === tier.maxQuantity;
      })
    : undefined;

  return normalizeBillingUnitPrice(matchedByRange ?? rawItems[tierIndex] ?? rawItems[0]);
}

function getLowestVideoSpecPrice(items: VideoSpecPrice[] | null | undefined): VideoSpecPrice | null {
  if (!items?.length) return null;
  return items.reduce((min, item) =>
    Number(item.pricePerUnit ?? Infinity) < Number(min.pricePerUnit ?? Infinity) ? item : min,
  );
}

function videoSpecDisplayLabel(item: VideoSpecPrice): string {
  const resolution = item.resolution?.trim() || '默认规格';
  return `${resolution.toUpperCase()}（${videoVoiceLabelFromSpec(item.audioType)}）`;
}

function videoTokenSpecLabel(spec?: string | null): string {
  const normalized = (spec || '').toLowerCase();
  if (normalized.includes('with_video_input')) return '包含视频输入';
  if (normalized.includes('no_video_input') || normalized.includes('without_video_input')) return '不包含视频输入';
  return '默认';
}

function videoTokenDisplayLabel(item: VideoTokenPrice, index: number): string {
  const spec = videoTokenSpecLabel(item.videoTokenSpec);
  return spec === '默认' ? `规格 ${index + 1}` : spec;
}

function hasImageTokenBilling(rule: ModelItem['billingRule'] | null | undefined): boolean {
  const imageToken = rule?.imageToken;
  return Array.isArray(imageToken) && imageToken.length > 0;
}

function isImageTokenBillingModel(model: ModelItem): boolean {
  const billingType = model.billingRule?.billingType?.toLowerCase() ?? '';
  if (billingType === 'image_token' || billingType.includes('image_token')) return true;
  return hasImageTokenBilling(model.billingRule);
}

function normalizeImageTokenBillingEntry(raw: unknown): ImageTokenBillingEntry | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const item = raw as Record<string, unknown>;
  const input = normalizeBillingUnitPrice(item.input);
  const output = normalizeBillingUnitPrice(item.output);
  if (!input && !output) return null;
  return {
    imageTokenSpec: typeof item.imageTokenSpec === 'string' ? item.imageTokenSpec : null,
    input,
    output,
  };
}

function getImageTokenBillingEntries(rule: ModelItem['billingRule'] | null | undefined): ImageTokenBillingEntry[] {
  const imageToken = rule?.imageToken;
  if (!Array.isArray(imageToken)) return [];
  return imageToken
    .map((entry) => normalizeImageTokenBillingEntry(entry))
    .filter((entry): entry is ImageTokenBillingEntry => entry != null);
}

function imageTokenSpecLabel(spec?: string | null): string {
  const normalized = (spec || '').toLowerCase();
  if (normalized.includes('text_to_image') || normalized.includes('文生图')) return '文生图';
  if (normalized.includes('image_to_image') || normalized.includes('图生图')) return '图生图';
  return spec?.trim() || '默认';
}

function minImageTokenSideYuan(
  entries: ImageTokenBillingEntry[],
  side: 'input' | 'output',
  denomination: string | null | undefined,
  discounted: boolean,
): number | null {
  const prices = entries
    .map((entry) => entry[side])
    .filter((item): item is BillingUnitPrice => item != null)
    .map((item) => billingUnitPriceToYuan(item, denomination, discounted));
  if (prices.length === 0) return null;
  return Math.min(...prices);
}

function formatImageTokenPriceUnitLabel(unitSpec?: number | null): string {
  const spec = unitSpec != null && unitSpec > 0 ? unitSpec : 1000000;
  if (spec === 1000000) return '百万 Tokens';
  return `${spec} tokens`;
}

function formatYuanRange(values: number[]): string {
  const validValues = values.filter((value) => Number.isFinite(value));
  if (validValues.length === 0) return '—';
  const min = Math.min(...validValues);
  const max = Math.max(...validValues);
  return min === max ? formatYuanDisplay(min) : `${formatYuanDisplay(min)} ~ ${formatYuanDisplay(max)}`;
}

function parseQuickStartCode(raw?: string): QuickStartExample[] {
  if (!raw?.trim()) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return [];
    return Object.entries(parsed)
      .filter((entry): entry is [string, string] => typeof entry[1] === 'string' && entry[1].trim() !== '')
      .map(([label, code]) => ({ label, code }));
  } catch {
    return [];
  }
}

function trimBlankLines(lines: string[]): string[] {
  const result = [...lines];
  while (result.length && result[0].trim() === '') result.shift();
  while (result.length && result[result.length - 1].trim() === '') result.pop();
  return result;
}

function renderInline(text: string, keyPrefix: string): React.ReactNode {
  const pattern = /(\*\*[^*\n]+?\*\*|\*[^*\n]+?\*|`[^`\n]+`)/g;
  const segments: React.ReactNode[] = [];
  let lastIndex = 0;
  let i = 0;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) segments.push(text.slice(lastIndex, match.index));
    const raw = match[0];
    if (raw.startsWith('**')) {
      segments.push(<strong key={`${keyPrefix}-b${i}`}>{raw.slice(2, -2)}</strong>);
    } else if (raw.startsWith('*')) {
      segments.push(<em key={`${keyPrefix}-i${i}`}>{raw.slice(1, -1)}</em>);
    } else {
      segments.push(
        <code
          key={`${keyPrefix}-c${i}`}
          style={{ fontFamily: 'ui-monospace, monospace', background: '#f3f4f6', padding: '1px 4px', borderRadius: 3, fontSize: '0.9em', color: '#374151' }}
        >
          {raw.slice(1, -1)}
        </code>,
      );
    }
    lastIndex = match.index + raw.length;
    i++;
  }
  if (lastIndex < text.length) segments.push(text.slice(lastIndex));
  return segments.length === 1 ? segments[0] : <>{segments}</>;
}

function parseTableLine(line: string): string[] {
  return line
    .split('|')
    .slice(1, -1)
    .map((cell) => cell.trim());
}

function parseQuickStartMarkdown(raw?: string): QuickStartMarkdownBlock[] {
  if (!raw?.trim()) return [];

  const blocks: QuickStartMarkdownBlock[] = [];
  const lines = raw.replace(/\r\n/g, '\n').split('\n');
  let paragraphLines: string[] = [];
  let fenceLines: string[] | null = null;
  let fenceLanguage = '';
  let listItems: string[] = [];
  let tableLines: string[] = [];

  const flushParagraph = () => {
    const text = paragraphLines.join('\n').trim();
    if (text) blocks.push({ type: 'paragraph', text });
    paragraphLines = [];
  };

  const flushList = () => {
    if (listItems.length > 0) {
      blocks.push({ type: 'list', items: [...listItems] });
      listItems = [];
    }
  };

  const flushTable = () => {
    if (tableLines.length === 0) return;
    const dataLines = tableLines.filter((l) => !l.match(/^\s*\|[\s|:-]+\|\s*$/));
    if (dataLines.length >= 1) {
      const headers = parseTableLine(dataLines[0]);
      const rows = dataLines.slice(1).map(parseTableLine);
      blocks.push({ type: 'table', headers, rows });
    }
    tableLines = [];
  };

  lines.forEach((line) => {
    const fenceMatch = line.match(/^```(\w+)?\s*$/);
    if (fenceMatch) {
      if (fenceLines) {
        const code = trimBlankLines(fenceLines).join('\n');
        if (code) blocks.push({ type: 'code', code, language: fenceLanguage || undefined });
        fenceLines = null;
        fenceLanguage = '';
      } else {
        flushParagraph();
        flushList();
        flushTable();
        fenceLines = [];
        fenceLanguage = fenceMatch[1] || '';
      }
      return;
    }

    if (fenceLines) {
      fenceLines.push(line);
      return;
    }

    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      flushParagraph();
      flushList();
      flushTable();
      const level = headingMatch[1].length;
      blocks.push({ type: 'heading', level, text: headingMatch[2].trim() });
      return;
    }

    const listMatch = line.match(/^[ \t]*[-*+]\s+(.+)$/);
    if (listMatch) {
      flushParagraph();
      flushTable();
      listItems.push(listMatch[1]);
      return;
    }

    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      flushParagraph();
      flushList();
      tableLines.push(line);
      return;
    }

    if (!line.trim()) {
      flushParagraph();
      flushList();
      flushTable();
      return;
    }

    paragraphLines.push(line);
  });

  if (fenceLines) {
    const code = trimBlankLines(fenceLines).join('\n');
    if (code) blocks.push({ type: 'code', code, language: fenceLanguage || undefined });
  }
  flushParagraph();
  flushList();
  flushTable();

  return blocks;
}

export default function ModelDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const navState = (location.state || {}) as { categoryName?: string };
  const categoryName = navState.categoryName || '';
  const [model, setModel] = useState<ModelItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [copiedQuickStartKey, setCopiedQuickStartKey] = useState<string | null>(null);
  const [quickStartTab, setQuickStartTab] = useState('');
  const [selectedTierIndex, setSelectedTierIndex] = useState(0);
  const [videoVoiceFilter, setVideoVoiceFilter] = useState<VideoVoiceFilter>('all');
  const [selectedVideoTokenResolution, setSelectedVideoTokenResolution] = useState('');
  const [seedanceReferenceFilter, setSeedanceReferenceFilter] = useState<SeedanceReferenceFilter>('all');

  useEffect(() => {
    let mounted = true;
    const rawId = id ? decodeURIComponent(id) : '';
    (async () => {
      setLoading(true);
      try {
        const list = mergeModelMarketList(await fetchModels({ status: 'active' }));
        if (!mounted) return;
        const found = list.find((m) => m.id === rawId);
        const resolved = found && !categoryName ? await attachCategoryName(found) : found;
        if (!mounted) return;
        setModel(resolved ?? (rawId === CARROT_FLAGSHIP_MODEL.id ? CARROT_FLAGSHIP_MODEL : null));
      } catch {
        if (!mounted) return;
        setModel(rawId === CARROT_FLAGSHIP_MODEL.id ? CARROT_FLAGSHIP_MODEL : null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [categoryName, id]);

  useEffect(() => {
    setSelectedTierIndex(0);
    setVideoVoiceFilter('all');
    setSelectedVideoTokenResolution('');
    setSeedanceReferenceFilter('all');
    setQuickStartTab('');
    setCopiedQuickStartKey(null);
  }, [model?.id]);

  const handleCopyId = useCallback(async () => {
    if (!model) return;
    const ok = await copyToClipboard(model.modelId || model.id);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [model]);

  const handleCopyQuickStart = useCallback(async (code: string, key: string) => {
    const ok = await copyToClipboard(code);
    if (ok) {
      setCopiedQuickStartKey(key);
      setTimeout(() => setCopiedQuickStartKey(null), 2000);
    }
  }, []);

  const tiers = useMemo<ModelTierBillingItem[]>(() => {
    if (!model) return [];
    const rawTiers = model.tierBillingItems ?? [];
    if (rawTiers.length > 0) return rawTiers;
    return [
      {
        id: 'default',
        label: '默认',
        minQuantity: '0',
        maxQuantity: '0',
        inputPrice: model.discountedInputPrice ?? model.inputPrice,
        outputPrice: model.discountedOutputPrice ?? model.outputPrice,
        originalInputPrice: model.officialInputPrice,
        originalOutputPrice: model.officialOutputPrice,
      },
    ];
  }, [model]);
  const tierMaxIdx = Math.max(0, tiers.length - 1);
  const safeTierIdx = Math.min(Math.max(0, selectedTierIndex), tierMaxIdx);
  const activeTier = tiers.length > 0 ? tiers[safeTierIdx] : null;
  const tierDropdownOptions = tiers.map((t, idx) => ({
    value: String(idx),
    label: tierDisplayLabel(t),
  }));

  const hasMultiTiers = tiers.length > 1;

  const summaryPrices = useMemo(() => {
    if (!model) return { in: 0, out: 0 };
    const t = model.tierBillingItems ?? [];
    if (t.length > 0) return minTierPrices(t);
    return effectiveDiscountedPrices(model);
  }, [model]);

  const officialIn = model?.officialInputPrice ?? model?.inputPrice;
  const officialOut = model?.officialOutputPrice ?? model?.outputPrice;

  if (loading) {
    return (
      <div style={{ padding: 48, textAlign: 'center', color: '#6b7280', fontSize: 14 }}>
        加载模型信息…
      </div>
    );
  }

  if (!model) {
    return (
      <div style={{ padding: 48, textAlign: 'center' }}>
        <p style={{ color: '#6b7280', marginBottom: 16 }}>未找到该模型或已下线</p>
        <button type="button" className="api-hub-btn-secondary" onClick={() => navigate('/hub/models')}>
          返回模型市场
        </button>
      </div>
    );
  }

  const modality = inferModelModality(model, categoryName);
  const isTextModality = modality === 'text';
  const isImageModality = modality === 'image';
  const isVideoModality = modality === 'video';
  const isAudioModality = modality === 'audio';
  const audioSpeechBillingItem = isAudioModality ? getAudioSpeechBillingItem(model.billingRule) : null;
  const isAudioSpeechPricing = isAudioModality && audioSpeechBillingItem != null;
  const billingType = model.billingRule?.billingType?.toLowerCase();
  const isCarrot = model.id === CARROT_FLAGSHIP_MODEL.id;
  const videoSpecRows = isVideoModality ? model.billingRule?.videoSpec ?? [] : [];
  const isVideoSpecPricing = isVideoModality && videoSpecRows.length > 0;
  const videoTokenRule = isVideoModality ? model.billingRule?.videoToken : null;
  const videoTokenRows: VideoTokenRow[] = Array.isArray(videoTokenRule)
    ? videoTokenRule.map((item, idx) => ({
        id: `${item.resolution || 'default'}-${item.videoTokenSpec || 'default'}-${idx}`,
        label: videoTokenDisplayLabel(item, idx),
        item,
      }))
    : [
        videoTokenRule?.withVideoInput
          ? { id: 'withVideoInput', label: '包含视频输入', item: videoTokenRule.withVideoInput }
          : null,
        videoTokenRule?.noVideoInput
          ? { id: 'noVideoInput', label: '不包含视频输入', item: videoTokenRule.noVideoInput }
          : null,
      ].filter((row): row is VideoTokenRow => row != null);
  const isVideoTokenRulePricing = isVideoModality && videoTokenRows.length > 0;
  const videoTokenResolutionOptions = Array.from(
    new Set(videoTokenRows.map((row) => row.item.resolution?.trim()).filter((resolution): resolution is string => Boolean(resolution))),
  );
  const videoTokenResolutionDropdownOptions = videoTokenResolutionOptions.map((resolution) => ({
    value: resolution,
    label: resolution.toUpperCase(),
  }));
  const activeVideoTokenResolution = videoTokenResolutionOptions.includes(selectedVideoTokenResolution)
    ? selectedVideoTokenResolution
    : videoTokenResolutionOptions[0] || '';
  const visibleVideoTokenRows = [...(activeVideoTokenResolution
    ? videoTokenRows.filter((row) => row.item.resolution?.trim() === activeVideoTokenResolution)
    : videoTokenRows
  )].sort((a, b) => {
    const order = (spec?: string | null) => (spec?.toLowerCase().includes('with_video_input') ? 0 : 1);
    return order(a.item.videoTokenSpec) - order(b.item.videoTokenSpec);
  });
  const videoPricingMode = isVideoModality && !isVideoSpecPricing ? inferVideoPricingMode(tiers) : 'token';
  const isVideoTokenPricing = isVideoModality && !isVideoSpecPricing && (isVideoTokenRulePricing || videoPricingMode === 'token');
  const isVideoDurationPricing = isVideoModality && !isVideoSpecPricing && videoPricingMode === 'duration';
  const isSeedanceUnifiedTokenBilling = isVideoTokenPricing && (isVideoTokenRulePricing || model.modelId.toLowerCase().includes('seedance-2-0'));
  const videoTokenOfficialValues = videoTokenRows.map((row) => billingUnitPriceToYuan(row.item, model.billingRule?.denominationDefault, false));
  const videoTokenDiscountedValues = videoTokenRows.map((row) => billingUnitPriceToYuan(row.item, model.billingRule?.denominationDefault, true));
  const videoTokenDiscountedRange = formatYuanRange(videoTokenDiscountedValues);
  const videoTokenOfficialRange = formatYuanRange(videoTokenOfficialValues);
  const videoTokenUnitSpec = videoTokenRows[0]?.item.unitSpec || 1000000;
  const videoTokenUnitLabel = videoTokenUnitSpec === 1000000 ? '元 / 百万 tokens' : `元 / ${videoTokenUnitSpec} tokens`;
  const hasVideoVoiceOptions = isVideoDurationPricing && tiers.some((t) => videoVoiceTypeFromLabel(t.label || '') !== 'unknown');
  const hasVideoSpecVoiceOptions = isVideoSpecPricing && videoSpecRows.some((item) => videoVoiceTypeFromSpec(item.audioType) !== 'unknown');
  const videoSpecVisibleRows = isVideoSpecPricing
    ? videoSpecRows.filter((item) => {
        const voice = videoVoiceTypeFromSpec(item.audioType);
        if (videoVoiceFilter === 'with_audio') return voice === 'with_audio';
        if (videoVoiceFilter === 'silent') return voice === 'silent';
        return true;
      })
    : [];
  const videoSpecPrimary = getLowestVideoSpecPrice(videoSpecRows);
  const videoSpecOfficialYuan = videoSpecPrimary
    ? billingUnitPriceToYuan(videoSpecPrimary, model.billingRule?.denominationDefault, false)
    : summaryPrices.out;
  const videoSpecDiscountedYuan = videoSpecPrimary
    ? billingUnitPriceToYuan(videoSpecPrimary, model.billingRule?.denominationDefault, true)
    : model.discountedOutputPrice ?? summaryPrices.out;
  const videoSpecUnitSpec = videoSpecPrimary?.unitSpec && videoSpecPrimary.unitSpec > 0 ? videoSpecPrimary.unitSpec : 1;
  const videoSpecUnitLabel = videoSpecUnitSpec > 1 ? `${videoSpecUnitSpec}秒` : '秒';
  const videoSpecUnitPhrase = videoSpecUnitSpec > 1 ? videoSpecUnitLabel : `${videoSpecUnitSpec}${videoSpecUnitLabel}`;
  const videoSpecSummaryLabel = model.billingRule?.ruleSpec || videoSpecRows.map(videoSpecDisplayLabel).slice(0, 2).join(' / ') || model.context;
  const videoSpecSummarySub = videoSpecPrimary?.maxDuration ? `最长 ${videoSpecPrimary.maxDuration} 秒` : '含多分辨率';
  const durationRows = isVideoDurationPricing
    ? tiers.filter((t) => {
        const voice = videoVoiceTypeFromLabel(t.label || '');
        if (videoVoiceFilter === 'with_audio') return voice === 'with_audio';
        if (videoVoiceFilter === 'silent') return voice === 'silent';
        return true;
      })
    : [];
  const videoDurationPrimary = isVideoDurationPricing ? (durationRows[0] ?? tiers[0]) : undefined;
  const videoDurationUnit = videoDurationPrimary ? videoDurationUnitFromPriceValue(videoDurationPrimary.outputPrice) : '秒';
  const seedanceReferenceRows = isSeedanceUnifiedTokenBilling
    ? tiers.filter((t) => {
        const refType = seedanceReferenceTypeFromLabel(t.label || '');
        if (seedanceReferenceFilter === 'with_reference') return refType === 'with_reference';
        if (seedanceReferenceFilter === 'without_reference') return refType === 'without_reference';
        return true;
      })
    : tiers;
  const hasSeedanceReferenceTypes = isSeedanceUnifiedTokenBilling && tiers.some((t) => seedanceReferenceTypeFromLabel(t.label || '') !== 'unknown');
  const visibleTierRows = isVideoDurationPricing ? durationRows : seedanceReferenceRows;
  const imageTokenEntries = isImageModality ? getImageTokenBillingEntries(model.billingRule) : [];
  const isImageTokenRulePricing = isImageModality && isImageTokenBillingModel(model) && imageTokenEntries.length > 0;
  const imageTokenRows: ImageTokenRow[] = imageTokenEntries
    .map((entry, idx) => {
      if (!entry.input || !entry.output) return null;
      return {
        id: `${entry.imageTokenSpec || 'default'}-${idx}`,
        label: imageTokenSpecLabel(entry.imageTokenSpec),
        input: entry.input,
        output: entry.output,
      };
    })
    .filter((row): row is ImageTokenRow => row != null);
  const imageTokenDenomination = model.billingRule?.denominationDefault;
  const imageTokenUnitSpec =
    imageTokenEntries[0]?.input?.unitSpec ?? imageTokenEntries[0]?.output?.unitSpec ?? 1000000;
  const imageTokenPriceUnitPhrase = formatImageTokenPriceUnitLabel(imageTokenUnitSpec);
  const imageTokenInputDiscountedYuan = minImageTokenSideYuan(imageTokenEntries, 'input', imageTokenDenomination, true);
  const imageTokenOutputDiscountedYuan = minImageTokenSideYuan(imageTokenEntries, 'output', imageTokenDenomination, true);
  const imageTokenInputOfficialYuan = minImageTokenSideYuan(imageTokenEntries, 'input', imageTokenDenomination, false);
  const imageTokenOutputOfficialYuan = minImageTokenSideYuan(imageTokenEntries, 'output', imageTokenDenomination, false);
  const hasMultiPricingRows =
    hasMultiTiers ||
    (isVideoSpecPricing && videoSpecRows.length > 1) ||
    (isVideoTokenRulePricing && videoTokenRows.length > 1) ||
    (isImageTokenRulePricing && imageTokenRows.length > 1);
  const imageBillingItem =
    isImageModality && !isImageTokenRulePricing ? getLowestBillingUnitPrice(model.billingRule?.image) : null;
  const imageOfficialYuan = imageBillingItem
    ? billingUnitPriceToYuan(imageBillingItem, model.billingRule?.denominationDefault, false)
    : summaryPrices.out;
  const imageDiscountedYuan = imageBillingItem
    ? billingUnitPriceToYuan(imageBillingItem, model.billingRule?.denominationDefault, true)
    : model.discountedOutputPrice ?? summaryPrices.out;
  const imageUnitSpec = imageBillingItem?.unitSpec && imageBillingItem.unitSpec > 0 ? imageBillingItem.unitSpec : 1;
  const imageBillingUnitLabel = imageUnitSpec > 1 ? `${imageUnitSpec}张` : '张';
  const imagePriceUnitLabel = imageUnitSpec > 1 ? `元 / ${imageUnitSpec}张` : '元';
  const audioOfficialYuan = audioSpeechBillingItem
    ? billingUnitPriceToYuan(audioSpeechBillingItem, model.billingRule?.denominationDefault, false)
    : summaryPrices.out;
  const audioDiscountedYuan = audioSpeechBillingItem
    ? billingUnitPriceToYuan(audioSpeechBillingItem, model.billingRule?.denominationDefault, true)
    : model.discountedOutputPrice ?? summaryPrices.out;
  const audioUnitSpec = audioSpeechBillingItem?.unitSpec && audioSpeechBillingItem.unitSpec > 0 ? audioSpeechBillingItem.unitSpec : 10000;
  const audioBillingUnitLabel = formatAudioBillingUnitLabel(audioUnitSpec);
  const audioPriceUnitLabel = formatAudioPriceUnitLabel(audioUnitSpec);
  const audioBillingUnitPhrase = formatAudioBillingUnitPhrase(audioUnitSpec);
  const audioSpeechSpecLabel = formatAudioSpeechSpecLabel(audioSpeechBillingItem?.spec);
  const mediaSpecPrimary =
    isAudioSpeechPricing
      ? audioSpeechSpecLabel
      : isImageModality && model.context.trim() !== '—'
      ? model.context
      : isVideoSpecPricing
      ? videoSpecSummaryLabel
      : isVideoDurationPricing
      ? (durationRows.length ? durationRows : tiers).map((t) => t.label).filter(Boolean).slice(0, 2).join(' / ') || model.context
      : isVideoTokenRulePricing
      ? model.billingRule?.ruleSpec || model.context
      : model.context;
  const mediaSpecSub = isAudioSpeechPricing
    ? `按${audioBillingUnitLabel}计费`
    : isVideoDurationPricing
    ? videoDurationPrimary?.cacheStoragePrice && videoDurationPrimary.cacheStoragePrice > 0
      ? `时长上限 ${videoDurationPrimary.cacheStoragePrice}${videoDurationUnit}`
      : '含多分辨率'
    : isVideoSpecPricing
    ? videoSpecSummarySub
    : isVideoTokenRulePricing
    ? model.billingRule?.ruleSpec || '统一 Token 计费'
    : isTextModality
    ? `最大输出 ${model.maxOutput}`
    : model.maxOutput || '以接口返回为准';
  const priceUnitText = isImageTokenRulePricing
    ? `元 / ${imageTokenPriceUnitPhrase}`
    : isImageModality
    ? '元 / 张'
    : isAudioSpeechPricing
    ? audioPriceUnitLabel
    : isVideoSpecPricing
    ? `元 / ${videoSpecUnitLabel}`
    : isVideoDurationPricing
    ? `元 / ${videoDurationUnit}`
    : videoTokenUnitLabel;
  const tierInputLabel = isImageTokenRulePricing ? '文本输入' : '推理输入';
  const tierOutputLabel = isImageTokenRulePricing
    ? '文本输出'
    : isImageModality
    ? '图片单价'
    : isAudioSpeechPricing
    ? '语音单价'
    : isVideoDurationPricing
    ? '基础单价'
    : '推理输出';
  const showTierInput = isTextModality || isImageTokenRulePricing;
  const showBillingUnitCard =
    (isImageModality && !isImageTokenRulePricing) || isAudioSpeechPricing || isVideoDurationPricing;
  const billingUnitText = isImageModality ? '张' : isAudioSpeechPricing ? audioBillingUnitLabel : isVideoSpecPricing ? videoSpecUnitLabel : videoDurationUnit;
  const billingUnitDescription = isImageModality
    ? '用于结算图片生成费用'
    : isAudioSpeechPricing
    ? '用于结算语音合成字符量'
    : '结算按每次请求的时长 / 次数';
  /** 摘要区「平台零售价」优先展示接口折后单价 */
  const retailInputYuan = model.discountedInputPrice ?? summaryPrices.in;
  const retailOutputYuan = isImageTokenRulePricing
    ? imageTokenOutputDiscountedYuan ?? 0
    : isImageModality
    ? imageDiscountedYuan
    : isAudioSpeechPricing
    ? audioDiscountedYuan
    : isVideoSpecPricing
    ? videoSpecDiscountedYuan
    : model.discountedOutputPrice ?? summaryPrices.out;

  const platformDiscountFactor = (model.platformDiscountPct ?? 100) / 100;
  const tokenCacheBillingItem = isTextModality ? getTokenCacheBillingItem(model.billingRule?.token, activeTier, safeTierIdx) : null;

  /** 「模型定价」推理输入/输出：分段计费用当前档位价×平台折扣；非分段则用接口 discounted* */
  const tierInferenceInput = isImageTokenRulePricing
    ? imageTokenInputDiscountedYuan ?? 0
    : hasMultiTiers && activeTier
    ? activeTier.inputPrice * platformDiscountFactor
    : model.discountedInputPrice ?? activeTier?.inputPrice ?? summaryPrices.in;
  const tierInferenceCache = tokenCacheBillingItem
    ? billingUnitPriceToYuan(tokenCacheBillingItem, model.billingRule?.denominationDefault, true)
    : null;
  const tierInferenceOutput = (() => {
    if (hasMultiTiers && activeTier) {
      return Number(activeTier.outputPrice) * platformDiscountFactor;
    }
    if (isImageTokenRulePricing) {
      return imageTokenOutputDiscountedYuan ?? 0;
    }
    if (isImageModality) {
      return imageDiscountedYuan;
    }
    if (isAudioSpeechPricing) {
      return audioDiscountedYuan;
    }
    if (isVideoSpecPricing) {
      return videoSpecDiscountedYuan;
    }
    if (model.discountedOutputPrice != null && Number.isFinite(model.discountedOutputPrice)) {
      return model.discountedOutputPrice;
    }
    if (activeTier) return Number(activeTier.outputPrice);
    return summaryPrices.out;
  })();
  const quickStartExamples = parseQuickStartCode(model.quickStartCode);
  const quickStartMarkdownBlocks = quickStartExamples.length === 0 ? parseQuickStartMarkdown(model.quickStartCode) : [];
  const activeQuickStart = quickStartExamples.find((item) => item.label === quickStartTab) ?? quickStartExamples[0];
  return (
    <div className="api-hub-detail-root" style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 24 }}>
        <button
          type="button"
          onClick={() => navigate('/hub/models')}
          aria-label="返回模型市场"
          style={{
            padding: 8,
            marginTop: 2,
            border: 'none',
            borderRadius: 8,
            background: 'transparent',
            color: '#9ca3af',
            cursor: 'pointer',
            flexShrink: 0,
          }}
          className="api-hub-detail-back-btn"
        >
          <ArrowLeft size={20} strokeWidth={2} />
        </button>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px 12px' }}>
            <ModelIcon provider={model.provider} size={40} logo={model.logo} />
            <h1
              style={{
                margin: 0,
                fontSize: 26,
                fontWeight: 700,
                letterSpacing: '-0.02em',
                color: '#111827',
                lineHeight: 1.25,
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
              {model.name}
            </h1>
            {model.tags.map((tag) => (
              <span key={tag} className="api-hub-detail-tag-pill">
                {renderTag(tag)}
              </span>
            ))}
          </div>

          <p style={{ fontSize: 14, color: '#6b7280', marginTop: 10, marginBottom: 0 }}>
            模型厂商：{model.provider}
            <span style={{ paddingLeft: 5, paddingRight: 5 }}>·</span>
            {model.releasedAt ? `发布于 ${model.releasedAt}` : ''}
          </p>
          {/* <p style={{ fontSize: 12, color: '#6b7280', marginTop: 6, marginBottom: 0 }}>
            {endpointHint}
          </p> */}
        </div>
      </div>

      {model.description ? (
        <p style={{ fontSize: 14, color: '#4b5563', lineHeight: 1.6, marginBottom: 24 }}>{model.description}</p>
      ) : null}

      <div className="api-hub-detail-card-shell" style={{ padding: 20, marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
          <div>
            <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 8 }}>模型标识</p>
            <code style={{ fontSize: 14, fontFamily: 'ui-monospace, monospace', color: '#111827' }}>
              {model.modelId || model.id}
            </code>
          </div>
          {!isImageModality && !isVideoModality ? (
            <button
              type="button"
              onClick={handleCopyId}
              style={{
                flexShrink: 0,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 12px',
                fontSize: 14,
                color: '#6b7280',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
              }}
            >
              {copied ? <Check size={16} style={{ color: '#10B981' }} /> : <Copy size={16} />}
              {copied ? '已复制' : '复制'}
            </button>
          ) : null}
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16,
          marginBottom: 24,
        }}
      >
        <div className="api-hub-detail-card-shell" style={{ padding: 16 }}>
          <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 8, fontWeight: 500 }}>
            {isTextModality || isImageTokenRulePricing
              ? '平台零售价 (输入)'
              : isImageModality || isAudioSpeechPricing
              ? '参考单价'
              : isVideoSpecPricing
              ? '基础单价'
              : isVideoDurationPricing
              ? '基础单价'
              : isVideoTokenRulePricing || isSeedanceUnifiedTokenBilling
              ? '计费单价（统一 Token 口径）'
              : '参考单价 (输入)'}
          </p>
          <p className="api-hub-table-mono" style={{ fontSize: 20, fontWeight: 700, color: '#111827', margin: 0 }}>
            {isVideoDurationPricing
              ? `￥${formatYuanDisplay(videoDurationPrimary?.inputPrice ?? retailInputYuan)}`
              : isVideoSpecPricing
              ? `￥${formatYuanDisplay(videoSpecDiscountedYuan)}`
              : isVideoTokenRulePricing
              ? `￥${videoTokenDiscountedRange}`
              : isSeedanceUnifiedTokenBilling && summaryPrices.in > 0 && summaryPrices.out > 0
              ? `￥${formatYuanDisplay(Math.min(summaryPrices.in, summaryPrices.out))} ~ ${formatYuanDisplay(Math.max(summaryPrices.in, summaryPrices.out))}`
              : `￥${formatYuanDisplay(
                  isImageTokenRulePricing
                    ? imageTokenInputDiscountedYuan ?? 0
                    : isImageModality || isAudioSpeechPricing
                    ? retailOutputYuan
                    : retailInputYuan,
                )}`}
          </p>
          {isImageTokenRulePricing &&
          imageTokenInputOfficialYuan != null &&
          imageTokenInputDiscountedYuan != null &&
          imageTokenInputOfficialYuan > imageTokenInputDiscountedYuan ? (
            <p style={{ fontSize: 12, color: '#9ca3af', textDecoration: 'line-through', marginTop: 6, marginBottom: 0 }}>
              官方基准：￥{formatYuanDisplay(imageTokenInputOfficialYuan)}
            </p>
          ) : isVideoSpecPricing && videoSpecOfficialYuan > 0 ? (
            <p style={{ fontSize: 12, color: '#9ca3af', textDecoration: 'line-through', marginTop: 6, marginBottom: 0 }}>
              官方基准：￥{formatYuanDisplay(videoSpecOfficialYuan)}
            </p>
          ) : isImageModality && imageOfficialYuan > 0 ? (
            <p style={{ fontSize: 12, color: '#9ca3af', textDecoration: 'line-through', marginTop: 6, marginBottom: 0 }}>
              官方基准：￥{formatYuanDisplay(imageOfficialYuan)}
            </p>
          ) : isAudioSpeechPricing && audioOfficialYuan > 0 ? (
            <p style={{ fontSize: 12, color: '#9ca3af', textDecoration: 'line-through', marginTop: 6, marginBottom: 0 }}>
              官方基准：￥{formatYuanDisplay(audioOfficialYuan)}
            </p>
          ) : isVideoTokenRulePricing && videoTokenOfficialValues.length > 0 ? (
            <p style={{ fontSize: 12, color: '#9ca3af', textDecoration: 'line-through', marginTop: 6, marginBottom: 0 }}>
              官方基准：￥{videoTokenOfficialRange}
            </p>
          ) : !isVideoDurationPricing && officialIn != null && officialIn > 0 ? (
            <p style={{ fontSize: 12, color: '#9ca3af', textDecoration: 'line-through', marginTop: 6, marginBottom: 0 }}>
              官方基准：￥{formatYuanDisplay(officialIn)}
            </p>
          ) : null}
          <p style={{ fontSize: 12, color: '#9ca3af', fontWeight: 500, marginTop: 8, marginBottom: 0 }}>
            {isTextModality || isImageTokenRulePricing
              ? priceUnitText
              : isImageModality
              ? `${imageUnitSpec} 张 出图`
              : isAudioSpeechPricing
              ? `${audioBillingUnitPhrase} 合成`
              : isVideoSpecPricing
              ? `${videoSpecUnitPhrase} 对应基础单价`
              : isVideoDurationPricing
              ? `1${videoDurationUnit} 对应基础单价`
              : isVideoTokenRulePricing || isSeedanceUnifiedTokenBilling
              ? '目录档位参考价（最终按实际消耗 token 结算）'
              : '元 / 百万 tokens'}
          </p>
          {hasMultiPricingRows ? (
            <p style={{ fontSize: 11, color: '#6673FF', fontWeight: 600, marginTop: 10, marginBottom: 0, lineHeight: 1.45 }}>
              {isVideoSpecPricing ? '包含多档规格价' : '包含多档阶梯价'}
            </p>
          ) : null}
        </div>

        <div className="api-hub-detail-card-shell" style={{ padding: 16 }}>
          <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 8, fontWeight: 500 }}>
            {isTextModality || isImageTokenRulePricing
              ? '平台零售价 (输出)'
              : isImageModality || isAudioSpeechPricing
              ? '计费单位'
              : isVideoSpecPricing
              ? '计费单位'
              : isVideoDurationPricing
              ? '计费单位'
              : isVideoTokenRulePricing || isSeedanceUnifiedTokenBilling
              ? '计费规则'
              : '参考单价 (输出)'}
          </p>
          <p style={{ fontSize: 20, fontWeight: 700, color: '#111827', margin: 0 }}>
            {isImageTokenRulePricing
              ? imageTokenOutputDiscountedYuan != null
                ? `￥${formatYuanDisplay(imageTokenOutputDiscountedYuan)}`
                : '—'
              : isImageModality
              ? `按${imageBillingUnitLabel}`
              : isAudioSpeechPricing
              ? `按${audioBillingUnitLabel}`
              : isVideoSpecPricing
              ? `按${videoSpecUnitLabel}`
              : isVideoDurationPricing
              ? `按${videoDurationUnit}`
              : isVideoTokenRulePricing || isSeedanceUnifiedTokenBilling
              ? '按最终视频实际消耗 Token'
              : retailOutputYuan > 0
              ? `￥${formatYuanDisplay(retailOutputYuan)}`
              : '—'}
          </p>
          {isImageTokenRulePricing &&
          imageTokenOutputOfficialYuan != null &&
          imageTokenOutputDiscountedYuan != null &&
          imageTokenOutputOfficialYuan > imageTokenOutputDiscountedYuan ? (
            <p style={{ fontSize: 12, color: '#9ca3af', textDecoration: 'line-through', marginTop: 6, marginBottom: 0 }}>
              官方基准：￥{formatYuanDisplay(imageTokenOutputOfficialYuan)}
            </p>
          ) : officialOut != null && officialOut > 0 && retailOutputYuan > 0 && !isImageModality && !isAudioSpeechPricing && !isVideoDurationPricing ? (
            <p style={{ fontSize: 12, color: '#9ca3af', textDecoration: 'line-through', marginTop: 6, marginBottom: 0 }}>
              官方基准：￥{formatYuanDisplay(officialOut)}
            </p>
          ) : null}
          <p style={{ fontSize: 12, color: '#9ca3af', fontWeight: 500, marginTop: 8, marginBottom: 0 }}>
            {isTextModality || isImageTokenRulePricing
              ? priceUnitText
              : isImageModality
              ? `单位：${imageBillingUnitLabel}`
              : isAudioSpeechPricing
              ? `单位：${audioBillingUnitLabel}`
              : isVideoSpecPricing
              ? '结算按每次请求的时长 / 次数'
              : isVideoDurationPricing
              ? '结算按每次请求的时长 / 次数'
              : isVideoTokenRulePricing || isSeedanceUnifiedTokenBilling
              ? ''
              : '元 / 百万 tokens'}
          </p>
        </div>

        {!isImageModality && !isAudioSpeechPricing ? (
          <div className="api-hub-detail-card-shell" style={{ padding: 16 }}>
            <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 8 }}>{isTextModality ? '上下文窗口' : '规格'}</p>
            <p style={{ fontSize: 20, fontWeight: 700, color: '#111827', margin: 0 }}>{mediaSpecPrimary}</p>
            <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 6, marginBottom: 0 }}>{mediaSpecSub}</p>
            {model.platformDiscountPct != null && model.platformDiscountPct < 100 ? (
              <span
                style={{
                  display: 'inline-flex',
                  marginTop: 10,
                  padding: '3px 8px',
                  fontSize: 10,
                  fontWeight: 600,
                  borderRadius: 4,
                  background: '#ecfdf5',
                  color: '#047857',
                  border: '1px solid #a7f3d0',
                }}
              >
                平台折扣 {model.platformDiscountPct}%
              </span>
            ) : null}
          </div>
        ) : null}
      </div>

      {hasMultiPricingRows ? (
        <p
          style={{
            fontSize: 12,
            color: '#4b5563',
            background: '#f9fafb',
            border: '1px solid #f3f4f6',
            borderRadius: 8,
            padding: '10px 12px',
            marginBottom: 12,
            lineHeight: 1.5,
          }}
        >
          顶部摘要为<strong style={{ fontWeight: 600, color: '#111827' }}>目录最低价</strong>
          {isVideoTokenRulePricing
            ? '（视频 Token 规格中取最小值）。下方可按输出分辨率查看单价。'
            : isSeedanceUnifiedTokenBilling
            ? '（输入 / 输出在各档中分别取最小值）。下方可按有无参考视频查看目录价。'
            : isVideoSpecPricing
            ? '（输入 / 输出在各档中分别取最小值）。下方可按档位查看单价，并对照「各档位价格表」。'
            : isVideoDurationPricing
            ? '（按视频基础单价在各档中取最小值）。下方可按规格查看单价。'
            : isImageTokenRulePricing
            ? '（文生图 / 图生图等各档位中取输入、输出最低价）。下方为目录参考价。'
            : isImageModality
            ? '（按图片生成价在各档中取最小值）。下方可查看生成单价。'
            : '（输入 / 输出在各档中分别取最小值）。下方可按档位查看单价，并对照「各档位价格表」。'}
        </p>
      ) : null}

      {(isImageModality || isVideoModality || isAudioSpeechPricing) ? (
        <p
          style={{
            fontSize: 12,
            color: '#92400e',
            background: '#fffbeb',
            border: '1px solid #fef3c7',
            borderRadius: 8,
            padding: '10px 12px',
            marginBottom: 24,
            lineHeight: 1.5,
          }}
        >
          {isImageTokenRulePricing
            ? '按 token 计费，支持文生图 / 图生图档位；具体单价见模型详情。'
            : isAudioSpeechPricing
            ? `目录价按「${audioPriceUnitLabel}」计（与网关对 input 的 Unicode 码点计数及日志 input_tokens 语义一致）。`
            : `演示价：${isImageModality ? `按${imageBillingUnitLabel}计费` : billingType === 'video_token' ? '按 Token 计费' : '按秒计费'}`}
        </p>
      ) : null}

      {tiers.length > 0 ? (
        <div className="api-hub-detail-card-shell" style={{ marginBottom: 24, overflow: 'visible' }}>
          <div
            style={{
              padding: '16px 20px',
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: 16,
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px 12px', minWidth: 0 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: '#111827' }}>模型定价</h2>
              {isVideoTokenRulePricing && videoTokenResolutionOptions.length > 0 ? (
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#6b7280' }}>
                  输出分辨率
                  <Dropdown
                    value={activeVideoTokenResolution}
                    onChange={setSelectedVideoTokenResolution}
                    options={videoTokenResolutionDropdownOptions}
                  />
                </label>
              ) : (
                <>
                  {hasMultiPricingRows ? <span className="api-hub-detail-badge-segment">分段计费</span> : null}
                  <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>
                    {hasMultiPricingRows ? '选择计费档位后查看该档目录价。' : '当前模型为单一目录价。'}
                  </p>
                </>
              )}
              {hasMultiPricingRows ? (
                <p style={{ margin: 0, fontSize: 11, color: '#6b7280', width: '100%', lineHeight: 1.6 }}>
                  {isVideoTokenRulePricing || isSeedanceUnifiedTokenBilling ? (
                    <>
                      计费规则：系统按请求使用的视频输入类型与实际消耗 Token 结算。
                    </>
                  ) : isVideoSpecPricing ? (
                    <>
                      计费规则：系统按请求的视频规格与时长 / 次数计算生成费用。
                    </>
                  ) : (
                    <>
                      计费规则：系统按单次请求的 <span style={{ fontFamily: 'ui-monospace, monospace' }}>input_tokens</span>{' '}
                      自动命中对应区间，再按该档单价计算输入 / 输出费用。
                    </>
                  )}
                </p>
              ) : null}
            </div>
            <span style={{ fontSize: 12, color: '#6b7280', flexShrink: 0 }}>
              {isTextModality || isImageTokenRulePricing
                ? '统一按元 / 百万 tokens 展示'
                : isImageModality
                ? '统一按元/张展示'
                : isAudioSpeechPricing
                ? audioPriceUnitLabel
                : isVideoSpecPricing
                ? '统一按元/秒展示'
                : isVideoDurationPricing
                ? '统一按元（每秒 / 每分 / 每次）展示'
                : '统一按元 / 百万 tokens 展示'}
            </span>
          </div>

          {hasMultiTiers && !isVideoDurationPricing && !(isSeedanceUnifiedTokenBilling && hasSeedanceReferenceTypes) ? (
            <div style={{ padding: '12px 20px', borderBottom: '1px solid #f3f4f6', background: 'rgba(249, 250, 251, 0.8)' }}>
              <label htmlFor="model-detail-tier-select" style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#6b7280', marginBottom: 8 }}>
                计费档位
              </label>
              <Dropdown
                value={String(safeTierIdx)}
                onChange={(value) => setSelectedTierIndex(Number(value))}
                options={tierDropdownOptions}
              />
              <p style={{ fontSize: 11, color: '#6b7280', marginTop: 8, marginBottom: 0 }}>
                {isImageModality || isVideoModality
                  ? '实际扣费时由网关自动判档；下拉用于预览不同区间的生成价格。'
                  : '实际扣费时由网关自动判档；下拉用于预览不同区间的输入/输出/缓存价格。'}
              </p>
            </div>
          ) : null}

          <div style={{ padding: '20px 24px' }}>
            {isAudioSpeechPricing && audioSpeechBillingItem ? (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
                  <div className="api-hub-detail-tier-inner">
                    <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>语音单价</p>
                    <p className="api-hub-table-mono" style={{ fontSize: 18, fontWeight: 600, color: '#111827', margin: 0 }}>
                      ￥{formatYuanDisplay(audioDiscountedYuan)}
                    </p>
                    <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 8, marginBottom: 0 }}>价格单位：{audioPriceUnitLabel}</p>
                  </div>
                  <div className="api-hub-detail-tier-inner">
                    <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>计费单位</p>
                    <p style={{ fontSize: 18, fontWeight: 600, color: '#111827', margin: 0 }}>按{audioBillingUnitLabel}</p>
                    <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 8, marginBottom: 0 }}>用于结算语音合成字符量</p>
                  </div>
                </div>
                <p style={{ margin: '16px 0 0', paddingTop: 16, borderTop: '1px solid #f3f4f6', fontSize: 12, color: '#6b7280' }}>
                  音频模型不区分输入/输出，按{audioBillingUnitLabel}计费
                </p>
              </>
            ) : isImageTokenRulePricing ? (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {(
                    [
                      { label: '文本输入', value: imageTokenInputDiscountedYuan },
                      { label: '文本输出', value: imageTokenOutputDiscountedYuan },
                    ] as const
                  ).map((row) => (
                    <div
                      key={row.label}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 16,
                        border: '1px solid #f3f4f6',
                        borderRadius: 8,
                        background: '#f9fafb',
                        padding: '12px 16px',
                      }}
                    >
                      <span style={{ fontSize: 14, fontWeight: 500, color: '#374151' }}>{row.label}</span>
                      <p className="api-hub-table-mono" style={{ fontSize: 14, fontWeight: 600, color: '#111827', margin: 0, whiteSpace: 'nowrap' }}>
                        {row.value != null ? (
                          <>
                            ¥{formatYuanDisplay(row.value)} / {imageTokenPriceUnitPhrase}
                          </>
                        ) : (
                          '—'
                        )}
                      </p>
                    </div>
                  ))}
                </div>
                {imageTokenRows.length > 1 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16, paddingTop: 16, borderTop: '1px solid #f3f4f6' }}>
                    <p style={{ margin: 0, fontSize: 12, fontWeight: 500, color: '#6b7280' }}>各档位目录价</p>
                    {imageTokenRows.map((row) => (
                      <div
                        key={row.id}
                        style={{
                          border: '1px solid #f3f4f6',
                          borderRadius: 8,
                          background: '#fff',
                          padding: '12px 16px',
                        }}
                      >
                        <p style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 600, color: '#111827' }}>{row.label}</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 13 }}>
                            <span style={{ color: '#6b7280' }}>文本输入</span>
                            <span className="api-hub-table-mono" style={{ color: '#111827', fontWeight: 600 }}>
                              ¥{formatYuanDisplay(billingUnitPriceToYuan(row.input, imageTokenDenomination, true))} / {imageTokenPriceUnitPhrase}
                            </span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 13 }}>
                            <span style={{ color: '#6b7280' }}>文本输出</span>
                            <span className="api-hub-table-mono" style={{ color: '#111827', fontWeight: 600 }}>
                              ¥{formatYuanDisplay(billingUnitPriceToYuan(row.output, imageTokenDenomination, true))} / {imageTokenPriceUnitPhrase}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
                <p style={{ margin: '16px 0 0', fontSize: 12, color: '#6b7280', lineHeight: 1.6 }}>
                  目录价为参考档位，实际扣费按网关结算的多模态 Token 用量计算。
                </p>
              </>
            ) : isImageModality && activeTier ? (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
                  <div className="api-hub-detail-tier-inner">
                    <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>图片单价</p>
                    <p className="api-hub-table-mono" style={{ fontSize: 18, fontWeight: 600, color: '#111827', margin: 0 }}>
                      ￥{formatYuanDisplay(imageDiscountedYuan)}
                    </p>
                    <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 8, marginBottom: 0 }}>价格单位：{imagePriceUnitLabel}</p>
                  </div>
                  <div className="api-hub-detail-tier-inner">
                    <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>计费单位</p>
                    <p style={{ fontSize: 18, fontWeight: 600, color: '#111827', margin: 0 }}>按{imageBillingUnitLabel}</p>
                    <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 8, marginBottom: 0 }}>用于结算图片生成费用</p>
                  </div>
                </div>
                <p style={{ margin: '16px 0 0', paddingTop: 16, borderTop: '1px solid #f3f4f6', fontSize: 12, color: '#6b7280' }}>
                  图片模型不区分输入/输出，按张计费
                </p>
              </>
            ) : isVideoSpecPricing ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {hasVideoSpecVoiceOptions ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    {[
                      { id: 'all' as const, label: '全部' },
                      { id: 'with_audio' as const, label: '有声' },
                      { id: 'silent' as const, label: '无声' },
                    ].map((item) => {
                      const active = videoVoiceFilter === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setVideoVoiceFilter(item.id)}
                          style={{
                            border: `1px solid ${active ? '#6673FF' : '#e5e7eb'}`,
                            color: active ? '#6673FF' : '#4b5563',
                            background: active ? 'rgba(102, 115, 255, 0.1)' : '#fff',
                            borderRadius: 6,
                            padding: '4px 10px',
                            fontSize: 12,
                            cursor: 'pointer',
                          }}
                        >
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                ) : null}
                {videoSpecVisibleRows.length === 0 ? (
                  <p style={{ margin: 0, fontSize: 14, color: '#9ca3af' }}>暂无视频规格定价</p>
                ) : (
                  videoSpecVisibleRows.map((item, idx) => (
                    <div
                      key={`${item.resolution}-${item.audioType}-${idx}`}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 16,
                        border: '1px solid #f3f4f6',
                        borderRadius: 8,
                        background: '#f9fafb',
                        padding: '12px 16px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            padding: '2px 8px',
                            borderRadius: 6,
                            fontSize: 12,
                            fontWeight: 500,
                            color: '#6673FF',
                            background: 'rgba(102, 115, 255, 0.1)',
                            border: '1px solid rgba(102, 115, 255, 0.2)',
                          }}
                        >
                          {videoSpecDisplayLabel(item)}
                        </span>
                        {item.maxDuration ? <span style={{ fontSize: 11, color: '#6b7280' }}>时长上限 {item.maxDuration}秒</span> : null}
                      </div>
                      <div style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <p className="api-hub-table-mono" style={{ fontSize: 14, fontWeight: 600, color: '#111827', margin: 0 }}>
                          {item.unitSpec || 1}秒 / ￥{formatYuanDisplay(billingUnitPriceToYuan(item, model.billingRule?.denominationDefault, true))}
                        </p>
                        <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 4, marginBottom: 0 }}>每秒计费</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : isVideoDurationPricing ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {hasVideoVoiceOptions ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    {[
                      { id: 'all' as const, label: '全部' },
                      { id: 'with_audio' as const, label: '有声' },
                      { id: 'silent' as const, label: '无声' },
                    ].map((item) => {
                      const active = videoVoiceFilter === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setVideoVoiceFilter(item.id)}
                          style={{
                            border: `1px solid ${active ? '#6673FF' : '#e5e7eb'}`,
                            color: active ? '#6673FF' : '#4b5563',
                            background: active ? 'rgba(102, 115, 255, 0.1)' : '#fff',
                            borderRadius: 6,
                            padding: '4px 10px',
                            fontSize: 12,
                            cursor: 'pointer',
                          }}
                        >
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                ) : null}
                {visibleTierRows.length === 0 ? (
                  <p style={{ margin: 0, fontSize: 14, color: '#9ca3af' }}>暂无视频规格定价</p>
                ) : (
                  visibleTierRows.map((t, idx) => {
                    const unit = videoDurationUnitFromPriceValue(t.outputPrice);
                    const limit = t.cacheStoragePrice && t.cacheStoragePrice > 0 ? `${t.cacheStoragePrice}${unit}` : null;
                    return (
                      <div
                        key={t.id ?? `${t.minQuantity}-${t.maxQuantity}-${idx}`}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: 16,
                          border: '1px solid #f3f4f6',
                          borderRadius: 8,
                          background: '#f9fafb',
                          padding: '12px 16px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                          <span
                            style={{
                              display: 'inline-flex',
                              padding: '2px 8px',
                              borderRadius: 6,
                              fontSize: 12,
                              fontWeight: 500,
                              color: '#6673FF',
                              background: 'rgba(102, 115, 255, 0.1)',
                              border: '1px solid rgba(102, 115, 255, 0.2)',
                            }}
                          >
                            {tierDisplayLabel(t)}
                          </span>
                          {limit ? <span style={{ fontSize: 11, color: '#6b7280' }}>时长上限 {limit}</span> : null}
                        </div>
                        <div style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                          <p className="api-hub-table-mono" style={{ fontSize: 14, fontWeight: 600, color: '#111827', margin: 0 }}>
                            1{unit} / ￥{formatYuanDisplay(t.inputPrice * platformDiscountFactor)}
                          </p>
                          <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 4, marginBottom: 0 }}>每{unit}计费</p>
                        </div>
                      </div>
                    );
                  })
                )}
                {videoDurationPrimary?.cacheStoragePrice && videoDurationPrimary.cacheStoragePrice > 0 ? (
                  <p style={{ fontSize: 12, color: '#6b7280', marginTop: 4, marginBottom: 0 }}>
                    并发：{videoDurationPrimary.cacheStoragePrice}倍/min
                  </p>
                ) : null}
              </div>
            ) : isVideoTokenRulePricing ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                {visibleVideoTokenRows.map((row) => (
                  <div key={row.id} className="api-hub-detail-tier-inner">
                    <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>{row.label}</p>
                    <p className="api-hub-table-mono" style={{ fontSize: 18, fontWeight: 600, color: '#111827', margin: 0 }}>
                      ￥{formatYuanDisplay(billingUnitPriceToYuan(row.item, model.billingRule?.denominationDefault, true))}
                    </p>
                    <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 8, marginBottom: 0 }}>
                      最终以实际消耗 token 结算
                    </p>
                  </div>
                ))}
              </div>
            ) : isSeedanceUnifiedTokenBilling ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                {(visibleTierRows.length ? visibleTierRows : tiers).slice(0, 2).map((t, idx) => (
                  <div key={t.id ?? `${t.minQuantity}-${t.maxQuantity}-${idx}`} className="api-hub-detail-tier-inner">
                    <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>
                      {seedanceReferenceTypeFromLabel(t.label || '') === 'without_reference' ? '无参考视频' : '有参考视频'}
                    </p>
                    <p className="api-hub-table-mono" style={{ fontSize: 18, fontWeight: 600, color: '#111827', margin: 0 }}>
                      ￥{formatYuanDisplay((idx === 0 ? t.inputPrice : t.outputPrice || t.inputPrice) * platformDiscountFactor)}
                    </p>
                    <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 8, marginBottom: 0 }}>最终以实际消耗 token 结算</p>
                  </div>
                ))}
              </div>
            ) : activeTier ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
                {showTierInput ? (
                  <div className="api-hub-detail-tier-inner">
                    <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>{tierInputLabel}</p>
                    <p className="api-hub-table-mono" style={{ fontSize: 18, fontWeight: 600, color: '#111827', margin: 0 }}>
                      ￥{formatTierPriceYuan(tierInferenceInput)}
                    </p>
                    <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 8, marginBottom: 0 }}>{priceUnitText}</p>
                  </div>
                ) : null}
                <div className="api-hub-detail-tier-inner">
                  <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>{tierOutputLabel}</p>
                  <p className="api-hub-table-mono" style={{ fontSize: 18, fontWeight: 600, color: '#111827', margin: 0 }}>
                    {tierInferenceOutput > 0
                      ? `￥${formatTierPriceYuan(tierInferenceOutput)}`
                      : '—'}
                  </p>
                  <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 8, marginBottom: 0 }}>{priceUnitText}</p>
                </div>
                {isTextModality ? (
                  <div className="api-hub-detail-tier-inner">
                    <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>推理缓存</p>
                    <p className="api-hub-table-mono" style={{ fontSize: 18, fontWeight: 600, color: '#111827', margin: 0 }}>
                      {tierInferenceCache != null && tierInferenceCache > 0
                        ? `￥${formatTierPriceYuan(tierInferenceCache)}`
                        : '—'}
                    </p>
                    <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 8, marginBottom: 0 }}>{priceUnitText}</p>
                  </div>
                ) : null}
                {showBillingUnitCard ? (
                  <div className="api-hub-detail-tier-inner">
                    <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>计费单位</p>
                    <p style={{ fontSize: 18, fontWeight: 600, color: '#111827', margin: 0 }}>按{billingUnitText}</p>
                    <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 8, marginBottom: 0 }}>
                      {billingUnitDescription}
                    </p>
                  </div>
                ) : null}
              </div>
            ) : null}
            {activeTier?.note ? (
              <p style={{ fontSize: 12, color: '#6b7280', marginTop: 16, paddingTop: 16, marginBottom: 0, borderTop: '1px solid #f3f4f6' }}>
                {activeTier.note}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="api-hub-detail-card-shell" style={{ marginBottom: 24, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb' }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: '#111827' }}>快速开始 (Developer Tools)</h2>
        </div>
        <div style={{ padding: 20, fontSize: 14, color: '#4b5563', lineHeight: 1.8 }}>
          {/* {isTextModality ? (
            <p style={{ margin: 0 }}>
              当前为「文本」类模型，请使用 Chat Completions 接口，并将模型标识设置为
              <code style={{ marginLeft: 6, fontFamily: 'ui-monospace, monospace', color: '#111827' }}>{model.modelId || model.id}</code>。
            </p>
          ) : (
            <>
              <p style={{ marginTop: 0, marginBottom: 12 }}>
                当前为「{isImageModality ? '图像' : '视频'}」类模型，请求路径与鉴权与 Chat Completions 不同；控制台仅展示目录与参考价，接入请以开放文档中的多模态章节为准。
              </p>
              <p
                style={{
                  margin: 0,
                  padding: '10px 12px',
                  borderRadius: 8,
                  background: '#f9fafb',
                  border: '1px solid #f3f4f6',
                  fontSize: 12,
                  color: '#6b7280',
                  fontFamily: 'ui-monospace, monospace',
                }}
              >
                常见路径：{endpointHint.replace('OpenAI 兼容：', '')}
              </p>
            </>
          )} */}
          {quickStartExamples.length > 0 ? (
            <div style={{ marginTop: 16 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                {quickStartExamples.map((item) => {
                  const active = item.label === activeQuickStart?.label;
                  return (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => {
                        setQuickStartTab(item.label);
                        setCopiedQuickStartKey(null);
                      }}
                      style={{
                        border: 'none',
                        borderRadius: 8,
                        padding: '8px 14px',
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: 'pointer',
                        color: active ? '#fff' : '#6b7280',
                        background: active ? '#6673FF' : '#f3f4f6',
                      }}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
              <div style={{ position: 'relative' }}>
                <pre
                  style={{
                    margin: 0,
                    padding: '16px 18px',
                    paddingRight: 88,
                    borderRadius: 10,
                    background: '#1f2937',
                    color: '#e5e7eb',
                    overflowX: 'auto',
                    fontSize: 13,
                    lineHeight: 1.65,
                    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                  }}
                >
                  <code>{activeQuickStart?.code}</code>
                </pre>
                <button
                  type="button"
                  onClick={() => activeQuickStart && handleCopyQuickStart(activeQuickStart.code, activeQuickStart.label)}
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: 12,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    border: 'none',
                    borderRadius: 6,
                    padding: '6px 10px',
                    background: '#374151',
                    color: '#fff',
                    fontSize: 12,
                    cursor: 'pointer',
                  }}
                >
                  {copiedQuickStartKey === activeQuickStart?.label ? <Check size={13} /> : <Copy size={13} />}
                  {copiedQuickStartKey === activeQuickStart?.label ? '已复制' : '复制'}
                </button>
              </div>
            </div>
          ) : quickStartMarkdownBlocks.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {quickStartMarkdownBlocks.map((block, index) => {
                if (block.type === 'heading') {
                  const isTopLevel = block.level === 1;
                  return (
                    <h3
                      key={`heading-${index}`}
                      style={{
                        margin: isTopLevel ? '4px 0 0' : '8px 0 0',
                        fontSize: isTopLevel ? 15 : 14,
                        fontWeight: 600,
                        color: '#111827',
                        lineHeight: 1.5,
                      }}
                    >
                      {renderInline(block.text, `h${index}`)}
                    </h3>
                  );
                }

                if (block.type === 'paragraph') {
                  return (
                    <p key={`paragraph-${index}`} style={{ margin: 0, color: '#4b5563', lineHeight: 1.7 }}>
                      {renderInline(block.text, `p${index}`)}
                    </p>
                  );
                }

                if (block.type === 'list') {
                  return (
                    <ul key={`list-${index}`} style={{ margin: 0, paddingLeft: 0, listStyle: 'none', color: '#000000', lineHeight: 1.8, display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {block.items.map((item, i) => (
                        <li key={i} style={{ display: 'flex', gap: 6 }}>
                          <span style={{ flexShrink: 0, color: '#9ca3af' }}>·</span>
                          <span>{renderInline(item, `li${index}-${i}`)}</span>
                        </li>
                      ))}
                    </ul>
                  );
                }

                if (block.type === 'table') {
                  return (
                    <div key={`table-${index}`} style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                        <thead>
                          <tr>
                            {block.headers.map((h, i) => (
                              <th
                                key={i}
                                style={{
                                  padding: '6px 12px',
                                  textAlign: 'left',
                                  fontWeight: 600,
                                  color: '#374151',
                                  background: '#f9fafb',
                                  borderBottom: '1px solid #e5e7eb',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {renderInline(h, `th${index}-${i}`)}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {block.rows.map((row, ri) => (
                            <tr key={ri} style={{ borderBottom: '1px solid #f3f4f6' }}>
                              {row.map((cell, ci) => (
                                <td key={ci} style={{ padding: '6px 12px', color: '#4b5563', verticalAlign: 'top' }}>
                                  {renderInline(cell, `td${index}-${ri}-${ci}`)}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                }

                const copiedKey = `markdown-${index}`;
                const copiedBlock = copiedQuickStartKey === copiedKey;
                return (
                  <div key={`code-${index}`} style={{ position: 'relative' }}>
                    <pre
                      style={{
                        margin: 0,
                        padding: '16px 18px',
                        paddingRight: 88,
                        borderRadius: 10,
                        background: '#1f2937',
                        color: '#e5e7eb',
                        overflowX: 'auto',
                        fontSize: 13,
                        lineHeight: 1.65,
                        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                      }}
                    >
                      <code>{block.code}</code>
                    </pre>
                    <button
                      type="button"
                      onClick={() => handleCopyQuickStart(block.code, copiedKey)}
                      style={{
                        position: 'absolute',
                        right: 12,
                        top: 12,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        border: 'none',
                        borderRadius: 6,
                        padding: '6px 10px',
                        background: '#374151',
                        color: '#fff',
                        fontSize: 12,
                        cursor: 'pointer',
                      }}
                    >
                      {copiedBlock ? <Check size={13} /> : <Copy size={13} />}
                      {copiedBlock ? '已复制' : '复制'}
                    </button>
                  </div>
                );
              })}
            </div>
          ) : model.quickStartNote ? (
            <pre
              style={{
                marginTop: 12,
                marginBottom: 0,
                padding: 14,
                borderRadius: 8,
                background: '#1f2937',
                color: '#e5e7eb',
                overflowX: 'auto',
                fontSize: 13,
                lineHeight: 1.6,
              }}
            >
              <code>{model.quickStartNote}</code>
            </pre>
          ) : null}
        </div>
      </div>

      <div style={{ marginTop: 'auto', paddingTop: 8 }}>
        <Link to="/hub/models" className="api-hub-btn-secondary" style={{ display: 'flex', alignItems: 'center', width: 'fit-content', textDecoration: 'none' }}>
          返回列表
        </Link>
      </div>
    </div>
  );
}
