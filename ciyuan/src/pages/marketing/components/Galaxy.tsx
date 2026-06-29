/**
 * Galaxy from React Bits (MIT). Shader + props match upstream defaults.
 * Extras: `pointerRoot` (layout), optional `rayScale`/`raySharp` (cross rays only), `pointerLerp` (mouse follow).
 * @see https://github.com/DavidHDev/react-bits/blob/main/src/ts-tailwind/Backgrounds/Galaxy/Galaxy.tsx
 */
import type { HTMLAttributes, RefObject } from 'react';
import { useEffect, useRef } from 'react';
import { Color, Mesh, Program, Renderer, Triangle } from 'ogl';

const vertexShader = `
attribute vec2 uv;
attribute vec2 position;

varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = vec4(position, 0, 1);
}
`;

const fragmentShader = `
precision highp float;

uniform float uTime;
uniform vec3 uResolution;
uniform vec2 uFocal;
uniform vec2 uRotation;
uniform float uStarSpeed;
uniform float uDensity;
uniform float uHueShift;
uniform float uSpeed;
uniform vec2 uMouse;
uniform float uGlowIntensity;
uniform float uSaturation;
uniform bool uMouseRepulsion;
uniform float uTwinkleIntensity;
uniform float uRotationSpeed;
uniform float uRepulsionStrength;
uniform float uMouseActiveFactor;
uniform float uAutoCenterRepulsion;
uniform bool uTransparent;
uniform float uRayScale;
uniform float uRaySharp;
uniform float uStarPointScale;

varying vec2 vUv;

#define NUM_LAYER 4.0
#define STAR_COLOR_CUTOFF 0.2
#define MAT45 mat2(0.7071, -0.7071, 0.7071, 0.7071)
#define PERIOD 3.0

float Hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float tri(float x) {
  return abs(fract(x) * 2.0 - 1.0);
}

float tris(float x) {
  float t = fract(x);
  return 1.0 - smoothstep(0.0, 1.0, abs(2.0 * t - 1.0));
}

float trisn(float x) {
  float t = fract(x);
  return 2.0 * (1.0 - smoothstep(0.0, 1.0, abs(2.0 * t - 1.0))) - 1.0;
}

vec3 hsv2rgb(vec3 c) {
  vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

float Star(vec2 uv, float flare) {
  float d = length(uv);
  float m = (0.05 * uGlowIntensity) / d;
  float rays = smoothstep(0.0, 1.0, 1.0 - abs(uv.x * uv.y * uRaySharp));
  m += rays * flare * uGlowIntensity * uRayScale;
  uv *= MAT45;
  rays = smoothstep(0.0, 1.0, 1.0 - abs(uv.x * uv.y * uRaySharp));
  m += rays * 0.3 * flare * uGlowIntensity * uRayScale;
  m *= smoothstep(1.0, 0.2, d);
  return m;
}

vec3 StarLayer(vec2 uv) {
  vec3 col = vec3(0.0);

  vec2 gv = fract(uv) - 0.5;
  vec2 id = floor(uv);

  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      vec2 offset = vec2(float(x), float(y));
      vec2 si = id + vec2(float(x), float(y));
      float seed = Hash21(si);
      float size = fract(seed * 345.32);
      float glossLocal = tri(uStarSpeed / (PERIOD * seed + 1.0));
      float flareSize = smoothstep(0.9, 1.0, size) * glossLocal;

      float red = smoothstep(STAR_COLOR_CUTOFF, 1.0, Hash21(si + 1.0)) + STAR_COLOR_CUTOFF;
      float blu = smoothstep(STAR_COLOR_CUTOFF, 1.0, Hash21(si + 3.0)) + STAR_COLOR_CUTOFF;
      float grn = min(red, blu) * seed;
      vec3 base = vec3(red, grn, blu);

      float hue = atan(base.g - base.r, base.b - base.r) / (2.0 * 3.14159) + 0.5;
      hue = fract(hue + uHueShift / 360.0);
      float sat = length(base - vec3(dot(base, vec3(0.299, 0.587, 0.114)))) * uSaturation;
      float val = max(max(base.r, base.g), base.b);
      base = hsv2rgb(vec3(hue, sat, val));

      vec2 pad = vec2(tris(seed * 34.0 + uTime * uSpeed / 10.0), tris(seed * 38.0 + uTime * uSpeed / 30.0)) - 0.5;

      float star = Star((gv - offset - pad) * uStarPointScale, flareSize);
      vec3 color = base;

      float twinkle = trisn(uTime * uSpeed + seed * 6.2831) * 0.5 + 1.0;
      twinkle = mix(1.0, twinkle, uTwinkleIntensity);
      star *= twinkle;

      col += star * size * color;
    }
  }

  return col;
}

void main() {
  vec2 focalPx = uFocal * uResolution.xy;
  vec2 uv = (vUv * uResolution.xy - focalPx) / uResolution.y;

  vec2 mouseNorm = uMouse - vec2(0.5);

  if (uAutoCenterRepulsion > 0.0) {
    vec2 centerUV = vec2(0.0, 0.0);
    float centerDist = length(uv - centerUV);
    vec2 repulsion = normalize(uv - centerUV) * (uAutoCenterRepulsion / (centerDist + 0.1));
    uv += repulsion * 0.05;
  } else if (uMouseRepulsion) {
    vec2 mousePosUV = (uMouse * uResolution.xy - focalPx) / uResolution.y;
    float mouseDist = length(uv - mousePosUV);
    vec2 repulsion = normalize(uv - mousePosUV) * (uRepulsionStrength / (mouseDist + 0.1));
    uv += repulsion * 0.05 * uMouseActiveFactor;
  } else {
    vec2 mouseOffset = mouseNorm * 0.1 * uMouseActiveFactor;
    uv += mouseOffset;
  }

  float autoRotAngle = uTime * uRotationSpeed;
  mat2 autoRot = mat2(cos(autoRotAngle), -sin(autoRotAngle), sin(autoRotAngle), cos(autoRotAngle));
  uv = autoRot * uv;

  uv = mat2(uRotation.x, -uRotation.y, uRotation.y, uRotation.x) * uv;

  vec3 col = vec3(0.0);

  for (float i = 0.0; i < 1.0; i += 1.0 / NUM_LAYER) {
    float depth = fract(i + uStarSpeed * uSpeed);
    float scale = mix(20.0 * uDensity, 0.5 * uDensity, depth);
    float fade = depth * smoothstep(1.0, 0.9, depth);
    col += StarLayer(uv * scale + i * 453.32) * fade;
  }

  if (uTransparent) {
    float alpha = length(col);
    alpha = smoothstep(0.0, 0.3, alpha);
    alpha = min(alpha, 1.0);
    gl_FragColor = vec4(col, alpha);
  } else {
    gl_FragColor = vec4(col, 1.0);
  }
}
`;

type GalaxyOwn = {
  focal?: [number, number];
  rotation?: [number, number];
  starSpeed?: number;
  density?: number;
  hueShift?: number;
  disableAnimation?: boolean;
  speed?: number;
  mouseInteraction?: boolean;
  /**
   * `container` = 与上游一致，监听 Galaxy 根节点。
   * `window` = 监听 `window` 并把坐标换算到画布矩形（首屏有 `pointer-events` 叠层时必须用这个，否则没有鼠标扰动）。
   */
  pointerRoot?: 'container' | 'window';
  /** 鼠标坐标平滑；越大越灵敏（上游等价 0.05） */
  pointerLerp?: number;
  /** 十字星芒亮度系数，1 = 上游默认 */
  rayScale?: number;
  /** 星芒交叉锐度，1000 = 上游默认；越大十字越细 */
  raySharp?: number;
  /** 星光点缩放，1 = 默认；略大于 1 则整体更小更细（仅 Star 内坐标，不影响鼠标） */
  starPointScale?: number;
  /**
   * 与画布同坐标系的锚点元素（如首屏标题）：用于首帧默认扰动中心、以及指针静止一段时间后回到该点。
   * 不传则保持仅跟随指针的原有行为。
   */
  pointerAnchorRef?: RefObject<HTMLElement | null>;
  /** 指针在画布内无移动超过该时间（ms）后，扰动中心平滑回到 `pointerAnchorRef` 几何中心。默认 3000。 */
  pointerIdleReturnMs?: number;
  glowIntensity?: number;
  saturation?: number;
  mouseRepulsion?: boolean;
  twinkleIntensity?: number;
  rotationSpeed?: number;
  repulsionStrength?: number;
  autoCenterRepulsion?: number;
  transparent?: boolean;
};

export type GalaxyProps = GalaxyOwn & Omit<HTMLAttributes<HTMLDivElement>, keyof GalaxyOwn>;

export default function Galaxy({
  focal = [0.5, 0.5],
  rotation = [1.0, 0.0],
  starSpeed = 0.5,
  density = 1,
  hueShift = 140,
  disableAnimation = false,
  speed = 1.0,
  mouseInteraction = true,
  pointerRoot = 'container',
  pointerLerp = 0.05,
  rayScale = 1.0,
  raySharp = 1000.0,
  starPointScale = 1.0,
  pointerAnchorRef,
  pointerIdleReturnMs = 2000,
  glowIntensity = 0.3,
  saturation = 0.0,
  mouseRepulsion = true,
  repulsionStrength = 2,
  twinkleIntensity = 0.3,
  rotationSpeed = 0.1,
  autoCenterRepulsion = 0,
  transparent = true,
  ...rest
}: GalaxyProps) {
  const ctnDom = useRef<HTMLDivElement>(null);
  const targetMousePos = useRef({ x: 0.5, y: 0.5 });
  const smoothMousePos = useRef({ x: 0.5, y: 0.5 });
  const targetMouseActive = useRef(0.0);
  const smoothMouseActive = useRef(0.0);
  const pointerInsideRef = useRef(false);
  const hasUserPointerInsideRef = useRef(false);
  const lastPointerMoveTsRef = useRef(0.0);

  useEffect(() => {
    if (!ctnDom.current) return;
    const ctn = ctnDom.current;
    const renderer = new Renderer({
      alpha: transparent,
      premultipliedAlpha: false,
    });
    const gl = renderer.gl;

    if (transparent) {
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.clearColor(0, 0, 0, 0);
    } else {
      gl.clearColor(0, 0, 0, 1);
    }

    let program!: Program;

    function resize() {
      const scale = 1;
      renderer.setSize(ctn.offsetWidth * scale, ctn.offsetHeight * scale);
      if (program) {
        program.uniforms.uResolution.value = new Color(
          gl.canvas.width,
          gl.canvas.height,
          gl.canvas.width / gl.canvas.height,
        );
      }
    }
    window.addEventListener('resize', resize, false);
    resize();

    const geometry = new Triangle(gl);
    program = new Program(gl, {
      vertex: vertexShader,
      fragment: fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uResolution: {
          value: new Color(gl.canvas.width, gl.canvas.height, gl.canvas.width / gl.canvas.height),
        },
        uFocal: { value: new Float32Array(focal) },
        uRotation: { value: new Float32Array(rotation) },
        uStarSpeed: { value: starSpeed },
        uDensity: { value: density },
        uHueShift: { value: hueShift },
        uSpeed: { value: speed },
        uMouse: {
          value: new Float32Array([smoothMousePos.current.x, smoothMousePos.current.y]),
        },
        uGlowIntensity: { value: glowIntensity },
        uSaturation: { value: saturation },
        uMouseRepulsion: { value: mouseRepulsion },
        uTwinkleIntensity: { value: twinkleIntensity },
        uRotationSpeed: { value: rotationSpeed },
        uRepulsionStrength: { value: repulsionStrength },
        uMouseActiveFactor: { value: 0.0 },
        uAutoCenterRepulsion: { value: autoCenterRepulsion },
        uTransparent: { value: transparent },
        uRayScale: { value: rayScale },
        uRaySharp: { value: raySharp },
        uStarPointScale: { value: starPointScale },
      },
    });

    const mesh = new Mesh(gl, { geometry, program });
    let rafId = 0;
    const intersectingRef = { current: false };

    const useAnchor = Boolean(pointerAnchorRef);

    function clamp01(v: number) {
      return Math.min(1, Math.max(0, v));
    }

    function anchorNormFromRef(): { x: number; y: number } {
      const el = pointerAnchorRef?.current;
      const rect = ctn.getBoundingClientRect();
      if (!el || rect.width < 1 || rect.height < 1) {
        return { x: 0.5, y: 0.5 };
      }
      const ar = el.getBoundingClientRect();
      const cx = ar.left + ar.width / 2;
      const cy = ar.top + ar.height / 2;
      const x = (cx - rect.left) / rect.width;
      const y = 1.0 - (cy - rect.top) / rect.height;
      return { x: clamp01(x), y: clamp01(y) };
    }

    function update(t: number) {
      if (!intersectingRef.current || document.visibilityState === 'hidden') {
        rafId = 0;
        return;
      }
      rafId = requestAnimationFrame(update);

      if (!disableAnimation) {
        program.uniforms.uTime.value = t * 0.001;
        program.uniforms.uStarSpeed.value = (t * 0.001 * starSpeed) / 10.0;
      }

      const now = performance.now();
      const idleMs = pointerIdleReturnMs;

      if (mouseInteraction && useAnchor) {
        const anchor = anchorNormFromRef();
        if (!hasUserPointerInsideRef.current) {
          targetMousePos.current.x = anchor.x;
          targetMousePos.current.y = anchor.y;
          targetMouseActive.current = 1.0;
        } else if (pointerInsideRef.current && now - lastPointerMoveTsRef.current >= idleMs) {
          const k = 0.055;
          const dx = anchor.x - targetMousePos.current.x;
          const dy = anchor.y - targetMousePos.current.y;
          if (dx * dx + dy * dy < 1e-6) {
            targetMousePos.current.x = anchor.x;
            targetMousePos.current.y = anchor.y;
          } else {
            targetMousePos.current.x += dx * k;
            targetMousePos.current.y += dy * k;
          }
          targetMouseActive.current = 1.0;
        }
      }

      const lerpFactor = Math.min(1, Math.max(0.02, pointerLerp));
      smoothMousePos.current.x += (targetMousePos.current.x - smoothMousePos.current.x) * lerpFactor;
      smoothMousePos.current.y += (targetMousePos.current.y - smoothMousePos.current.y) * lerpFactor;

      smoothMouseActive.current += (targetMouseActive.current - smoothMouseActive.current) * lerpFactor;

      program.uniforms.uMouse.value[0] = smoothMousePos.current.x;
      program.uniforms.uMouse.value[1] = smoothMousePos.current.y;
      program.uniforms.uMouseActiveFactor.value = smoothMouseActive.current;

      renderer.render({ scene: mesh });
    }

    function startRafIfNeeded() {
      if (rafId !== 0) return;
      if (!intersectingRef.current || document.visibilityState === 'hidden') return;
      rafId = requestAnimationFrame(update);
    }

    function stopRaf() {
      if (rafId !== 0) {
        cancelAnimationFrame(rafId);
        rafId = 0;
      }
    }

    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        intersectingRef.current = Boolean(entry?.isIntersecting);
        if (intersectingRef.current) {
          startRafIfNeeded();
        } else {
          stopRaf();
        }
      },
      { root: null, rootMargin: '80px 0px', threshold: 0 },
    );
    intersectionObserver.observe(ctn);

    function onVisibilityChange() {
      if (document.visibilityState === 'hidden') {
        stopRaf();
      } else if (intersectingRef.current) {
        startRafIfNeeded();
      }
    }
    document.addEventListener('visibilitychange', onVisibilityChange);

    /** SPA 跳转或 bfcache 时尽快停帧，避免路由已切走仍短暂 rAF */
    function onPageHide() {
      stopRaf();
    }
    window.addEventListener('pagehide', onPageHide);

    ctn.appendChild(gl.canvas);
    (gl.canvas as HTMLCanvasElement).style.pointerEvents = pointerRoot === 'window' ? 'none' : 'auto';

    function handleMouseMove(e: MouseEvent) {
      const rect = ctn.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = 1.0 - (e.clientY - rect.top) / rect.height;
      targetMousePos.current = { x, y };
      targetMouseActive.current = 1.0;
      pointerInsideRef.current = true;
      lastPointerMoveTsRef.current = performance.now();
      if (useAnchor) {
        hasUserPointerInsideRef.current = true;
      }
    }

    function handleMouseLeave() {
      targetMouseActive.current = 0.0;
      pointerInsideRef.current = false;
    }

    function snapTargetToAnchor() {
      const anchor = anchorNormFromRef();
      targetMousePos.current.x = anchor.x;
      targetMousePos.current.y = anchor.y;
      targetMouseActive.current = 1.0;
      pointerInsideRef.current = false;
      lastPointerMoveTsRef.current = performance.now();
    }

    function handleWindowMouseMove(e: MouseEvent) {
      const inViewport =
        e.clientX >= 0 &&
        e.clientY >= 0 &&
        e.clientX < window.innerWidth &&
        e.clientY < window.innerHeight;

      if (mouseInteraction && useAnchor && hasUserPointerInsideRef.current && !inViewport) {
        snapTargetToAnchor();
        return;
      }

      const rect = ctn.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = 1.0 - (e.clientY - rect.top) / rect.height;
      targetMousePos.current = { x, y };
      const inside =
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom;
      targetMouseActive.current = inside ? 1.0 : 0.0;
      pointerInsideRef.current = inside;
      lastPointerMoveTsRef.current = performance.now();
      if (useAnchor && inside) {
        hasUserPointerInsideRef.current = true;
      }
    }

    /** 指针移出浏览器窗口时部分环境不再派发 mousemove，用 mouseout 兜底回到标题锚点 */
    function handleDocumentMouseOut(e: MouseEvent) {
      if (!mouseInteraction || !useAnchor || !hasUserPointerInsideRef.current) return;
      if (e.relatedTarget != null) return;
      snapTargetToAnchor();
    }

    if (mouseInteraction) {
      if (pointerRoot === 'window') {
        window.addEventListener('mousemove', handleWindowMouseMove, { passive: true });
        if (useAnchor) {
          document.addEventListener('mouseout', handleDocumentMouseOut);
        }
      } else {
        ctn.addEventListener('mousemove', handleMouseMove);
        ctn.addEventListener('mouseleave', handleMouseLeave);
      }
    }

    return () => {
      stopRaf();
      intersectionObserver.disconnect();
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('pagehide', onPageHide);
      window.removeEventListener('resize', resize);
      if (mouseInteraction) {
        if (pointerRoot === 'window') {
          window.removeEventListener('mousemove', handleWindowMouseMove);
          if (useAnchor) {
            document.removeEventListener('mouseout', handleDocumentMouseOut);
          }
        } else {
          ctn.removeEventListener('mousemove', handleMouseMove);
          ctn.removeEventListener('mouseleave', handleMouseLeave);
        }
      }
      ctn.removeChild(gl.canvas);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    };
  }, [
    focal,
    rotation,
    starSpeed,
    density,
    hueShift,
    disableAnimation,
    speed,
    mouseInteraction,
    pointerRoot,
    pointerLerp,
    rayScale,
    raySharp,
    starPointScale,
    glowIntensity,
    saturation,
    mouseRepulsion,
    twinkleIntensity,
    rotationSpeed,
    repulsionStrength,
    autoCenterRepulsion,
    transparent,
    pointerAnchorRef,
    pointerIdleReturnMs,
  ]);

  return <div ref={ctnDom} className="w-full h-full relative" {...rest} />;
}
