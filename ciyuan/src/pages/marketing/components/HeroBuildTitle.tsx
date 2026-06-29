import { useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import type { Locale } from '../i18n/constants';

/** 描边总时长差速：同一起点、不同收束节奏 */
const STROKE_DURATIONS_S = [2.05, 2.42, 2.78] as const;
const STROKE_DELAYS_S = [0.52, 0.5, 0.48] as const;
const EASINGS = [
  'cubic-bezier(0.45, 0.02, 0.18, 1)',
  'cubic-bezier(0.42, 0, 0.14, 1)',
  'cubic-bezier(0.48, 0.03, 0.12, 1)',
] as const;

const ZH = {
  parts: ['构建', '微调', '扩展'] as const,
  lineText: '构建 微调 扩展',
  segmentRanges: [
    [0, 2],
    [3, 5],
    [6, 8],
  ] as const,
};

const EN = {
  parts: ['Build', 'Fine-tune', 'Scale'] as const,
  lineText: 'Build Fine-tune Scale',
  segmentRanges: [
    [0, 5],
    [6, 15],
    [16, 21],
  ] as const,
};

function subscribeReduceMotion(cb: () => void) {
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  mq.addEventListener('change', cb);
  return () => mq.removeEventListener('change', cb);
}

function getReduceMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

type HeroBuildTitleProps = {
  /** Hermes 关闭后为 true，开始描边→填充 */
  animationEnabled: boolean;
  locale: Locale;
};

export function HeroBuildTitle({ animationEnabled, locale }: HeroBuildTitleProps) {
  const bundle = locale === 'en' ? EN : ZH;
  const PARTS = bundle.parts;
  const LINE_TEXT = bundle.lineText;
  const SEGMENT_RANGES = bundle.segmentRanges;
  /** 与父级 h1 同行：继承 tracking / word-spacing / 字号，用于几何对齐原 72px 版间距 */
  const lineProbeRef = useRef<HTMLSpanElement>(null);
  const [reduceMotion, setReduceMotion] = useState(getReduceMotion);
  const [fontMeta, setFontMeta] = useState({
    family: 'system-ui, sans-serif',
    weight: '700',
    sizePx: 44,
    letterSpacing: '-0.06em',
  });
  const [layout, setLayout] = useState<{
    xs: number[];
    dash: number[];
    vbW: number;
    vbH: number;
    fontSizePx: number;
  } | null>(null);
  const [playGen, setPlayGen] = useState(0);

  useLayoutEffect(() => {
    return subscribeReduceMotion(() => setReduceMotion(getReduceMotion()));
  }, []);

  useLayoutEffect(() => {
    const lineEl = lineProbeRef.current;
    if (!lineEl) return;
    const read = () => {
      const cs = getComputedStyle(lineEl);
      const fontSizePx = parseFloat(cs.fontSize) || 44;
      setFontMeta({
        family: cs.fontFamily,
        weight: cs.fontWeight,
        sizePx: fontSizePx,
        letterSpacing: cs.letterSpacing,
      });
      const tn = lineEl.firstChild;
      if (!tn || tn.nodeType !== Node.TEXT_NODE) return;
      const textNode = tn as Text;

      const lineRect = lineEl.getBoundingClientRect();
      const lineCenterX = lineRect.left + lineRect.width / 2;
      const xs: number[] = [];
      const dash: number[] = [];
      for (let i = 0; i < SEGMENT_RANGES.length; i += 1) {
        const [a, b] = SEGMENT_RANGES[i]!;
        const range = document.createRange();
        range.setStart(textNode, a);
        range.setEnd(textNode, b);
        const br = range.getBoundingClientRect();
        xs.push(br.left + br.width / 2 - lineCenterX);
        const w = Math.max(8, br.width);
        const h = Math.max(fontSizePx * 1.08, br.height);
        dash.push(Math.max(140, (w + h) * 2.35));
      }

      const total = Math.max(lineRect.width, 1);
      const padX = fontSizePx * 0.28;
      const padY = fontSizePx * 0.2;
      const vbW = total + padX * 2;
      const vbH = Math.max(lineRect.height, fontSizePx * 1.08) + padY * 2;
      setLayout({ xs, dash, vbW, vbH, fontSizePx });
    };
    read();
    const ro = new ResizeObserver(read);
    ro.observe(lineEl);
    return () => ro.disconnect();
  }, [locale, LINE_TEXT, SEGMENT_RANGES]);

  const prevEnabledRef = useRef<boolean | undefined>(undefined);

  useLayoutEffect(() => {
    if (reduceMotion) return;
    const prev = prevEnabledRef.current;
    prevEnabledRef.current = animationEnabled;
    if (animationEnabled && prev === false) {
      const id = requestAnimationFrame(() => setPlayGen((g) => g + 1));
      return () => cancelAnimationFrame(id);
    }
    return undefined;
  }, [animationEnabled, reduceMotion]);

  if (reduceMotion) {
    return <>{LINE_TEXT}</>;
  }

  return (
    <>
      <span
        ref={lineProbeRef}
        className="pointer-events-none absolute left-0 top-0 -z-10 whitespace-pre font-bold opacity-0 select-none"
        aria-hidden
      >
        {LINE_TEXT}
      </span>
      <svg
        className="hero-build-title-svg mx-auto block max-w-full overflow-visible"
        viewBox={
          layout
            ? `${-layout.vbW / 2} ${-layout.vbH / 2} ${layout.vbW} ${layout.vbH}`
            : '-200 -50 400 100'
        }
        preserveAspectRatio="xMidYMid meet"
        role="presentation"
        aria-hidden
        style={
          layout
            ? ({
                /** 勿用 w-full：行宽远大于 viewBox 时 meet 会等比放大，字会远大于探测字号 */
                width: `min(100%, ${Math.ceil(layout.vbW)}px)`,
                height: 'auto',
                aspectRatio: `${layout.vbW} / ${layout.vbH}`,
              } as CSSProperties)
            : undefined
        }
      >
        {layout &&
          PARTS.map((part, i) => (
            <text
              key={`${playGen}-${locale}-${i}`}
              x={layout.xs[i]}
              y={0}
              fontSize={layout.fontSizePx}
              fontFamily={fontMeta.family}
              fontWeight={fontMeta.weight}
              textAnchor="middle"
              dominantBaseline="middle"
              className={
                animationEnabled
                  ? 'hero-build-title-part'
                  : 'hero-build-title-part hero-build-title-part--hold'
              }
              style={
                {
                  letterSpacing: fontMeta.letterSpacing,
                  '--dash': String(layout.dash[i]),
                  '--dur': `${STROKE_DURATIONS_S[i]}s`,
                  '--delay': `${STROKE_DELAYS_S[i]}s`,
                  '--ease': EASINGS[i],
                } as CSSProperties
              }
            >
              {part}
            </text>
          ))}
      </svg>
      <span className="sr-only">{LINE_TEXT}</span>
    </>
  );
}
