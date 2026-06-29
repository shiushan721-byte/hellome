import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type ReactNode,
} from 'react';

function subscribePrefersReducedMotion(onChange: () => void) {
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  mq.addEventListener('change', onChange);
  return () => mq.removeEventListener('change', onChange);
}

function getPrefersReducedMotionSnapshot() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export type RevealItemProps = {
  children: ReactNode;
  className?: string;
  /**
   * 进入视口后动画延迟（ms）。同一排卡片可传 index * step，形成从左到右的微弱阶梯。
   */
  delayMs?: number;
  /**
   * 用于 grid / 产品横排等：外层 flex 列 + 内层 flex-1 撑满，避免多包一层后子项 h-full 断链。
   */
  fill?: boolean;
  /** 挂在外层 .reveal-item 上的样式（如 flex-basis） */
  outerStyle?: CSSProperties;
};

const LEAVE_DEBOUNCE_MS = 160;

/** 全屏弹窗关闭后由页面派发：重新 takeRecords + 几何兜底，避免锁滚动后 Reveal 卡在未入场 */
export const SURFACE_LAYOUT_UNLOCK_EVENT = 'tw-surface-unlock';

/**
 * 首次及每次滚出视口（防抖确认）后再滚入，都会播入场动画。
 * 离开用短防抖，减少在边界上 isIntersecting 抖动导致的闪动。
 */
export function RevealItem({
  children,
  className = '',
  delayMs = 0,
  fill = false,
  outerStyle,
}: RevealItemProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const leaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** 曾经离开过视口后，再次进入需要 bump key 以重启 CSS 动画 */
  const hasLeftOnceRef = useRef(false);
  /** 避免首帧 IO 误报「不可见」触发离开定时器，把已入场内容又关掉 */
  const hasSeenIntersectingRef = useRef(false);
  const [shown, setShown] = useState(false);
  const [animCycle, setAnimCycle] = useState(0);
  const reduceMotion = useSyncExternalStore(
    subscribePrefersReducedMotion,
    getPrefersReducedMotionSnapshot,
    () => false,
  );

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    const clearLeaveTimer = () => {
      if (leaveTimerRef.current) {
        clearTimeout(leaveTimerRef.current);
        leaveTimerRef.current = null;
      }
    };

    if (reduceMotion) {
      setShown(true);
      return () => clearLeaveTimer();
    }

    /** 从「减弱动态」切回全动效、或 StrictMode 二次挂载时，重新走 idle → IO，否则会看不到入场动画 */
    hasSeenIntersectingRef.current = false;
    setShown(false);

    const commitEntered = () => {
      hasSeenIntersectingRef.current = true;
      clearLeaveTimer();
      setShown((prev) => {
        if (!prev && hasLeftOnceRef.current) {
          setAnimCycle((c) => c + 1);
        }
        return true;
      });
    };

    const commitLeftDebounced = () => {
      if (!hasSeenIntersectingRef.current) return;
      clearLeaveTimer();
      leaveTimerRef.current = setTimeout(() => {
        leaveTimerRef.current = null;
        hasLeftOnceRef.current = true;
        setShown(false);
      }, LEAVE_DEBOUNCE_MS);
    };

    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        if (entry.isIntersecting) commitEntered();
        else commitLeftDebounced();
      },
      /**
       * rootMargin 不宜过大：否则会判定「屏幕外」的板块也已进入视口，动画在看不见时已播完，滚到时像没有动效。
       */
      { root: null, rootMargin: '0px', threshold: 0 },
    );

    io.observe(el);

    const flushIntersectingRecords = () => {
      const records = io.takeRecords();
      const entry = records[0];
      if (entry?.isIntersecting) commitEntered();
    };

    const geometryCommitIfVisible = () => {
      flushIntersectingRecords();
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || document.documentElement.clientHeight;
      const vw = window.innerWidth || document.documentElement.clientWidth;
      const inViewport =
        rect.width > 0 &&
        rect.height > 0 &&
        rect.bottom > 1 &&
        rect.right > 1 &&
        rect.top < vh - 1 &&
        rect.left < vw - 1;
      if (inViewport) commitEntered();
    };

    flushIntersectingRecords();
    /** 首帧布局前 IO/takeRecords 可能为空；双 rAF + 几何兜底，避免整块内容长期 pointer-events:none */
    let alive = true;
    requestAnimationFrame(() => {
      if (!alive) return;
      geometryCommitIfVisible();
      requestAnimationFrame(() => {
        if (!alive) return;
        geometryCommitIfVisible();
      });
    });

    const onSurfaceUnlock = () => {
      geometryCommitIfVisible();
    };
    window.addEventListener(SURFACE_LAYOUT_UNLOCK_EVENT, onSurfaceUnlock);

    return () => {
      alive = false;
      window.removeEventListener(SURFACE_LAYOUT_UNLOCK_EVENT, onSurfaceUnlock);
      clearLeaveTimer();
      io.disconnect();
    };
  }, [reduceMotion]);

  const style = { '--reveal-delay': `${delayMs}ms` } as CSSProperties;

  return (
    <div
      ref={rootRef}
      className={['reveal-item', fill && 'reveal-item--fill-outer', className].filter(Boolean).join(' ')}
      style={outerStyle}
    >
      <div
        key={animCycle}
        style={style}
        className={[shown ? 'reveal-item--enter' : 'reveal-item--idle', fill && 'reveal-item--fill-inner']
          .filter(Boolean)
          .join(' ')}
      >
        {children}
      </div>
    </div>
  );
}
