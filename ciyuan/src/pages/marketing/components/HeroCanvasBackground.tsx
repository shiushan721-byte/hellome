import { useEffect, useRef, useState } from 'react';

/** Detect mobile to skip heavy WebGL on low-end devices */
const IS_MOBILE = typeof window !== 'undefined' && window.innerWidth <= 768;

const vertexShaderSource = `
precision mediump float;

varying vec2 vUv;
attribute vec2 a_position;

void main() {
  vUv = .5 * (a_position + 1.);
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const fragmentShaderSource = `
precision mediump float;

varying vec2 vUv;
uniform float u_time;
uniform float u_ratio;
uniform vec2 u_pointer_position;
uniform float u_scroll_progress;

vec2 rotate(vec2 uv, float th) {
  return mat2(cos(th), sin(th), -sin(th), cos(th)) * uv;
}

float neuro_shape(vec2 uv, float t, float p) {
  vec2 sine_acc = vec2(0.);
  vec2 res = vec2(0.);
  float scale = 8.;

  for (int j = 0; j < 15; j++) {
    uv = rotate(uv, 1.);
    sine_acc = rotate(sine_acc, 1.);
    vec2 layer = uv * scale + float(j) + sine_acc - t;
    sine_acc += sin(layer);
    res += (.5 + .5 * cos(layer)) / scale;
    scale *= (1.2 - .07 * p);
  }
  return res.x + res.y;
}

void main() {
  vec2 uv = .5 * vUv;
  uv.x *= u_ratio;

  vec2 pointer = vUv - u_pointer_position;
  pointer.x *= u_ratio;
  float p = clamp(length(pointer), 0., 1.);
  p = .82 * pow(1. - p, 1.45);

  float t = .001 * u_time;
  vec3 color = vec3(0.);

  float noise = neuro_shape(uv, t, p);

  noise = 1.2 * pow(noise, 3.);
  noise += pow(noise, 10.);
  noise = max(.0, noise - .5);
  noise *= (1. - length(vUv - .5));

  color = normalize(vec3(.40, .44 + .12 * cos(3. * u_scroll_progress), .94 + .06 * sin(3. * u_scroll_progress)));
  color = color * noise * 2.45;

  gl_FragColor = vec4(color, min(1.0, noise));
}
`;

type UniformMap = Record<string, WebGLUniformLocation | null>;

export type HeroCanvasPaletteScrollSource = 'window' | 'closing-cta-anchor';

export type HeroCanvasBackgroundProps = {
  /**
   * `window`：颜色随页面滚动变化（收尾屏默认）。
   * `closing-cta-anchor`：按 `#closing-cta` 在文档中的位置推算调色相位，使首屏与收尾屏色相一致。
   */
  paletteScrollSource?: HeroCanvasPaletteScrollSource;
};

const webglContextOptions: WebGLContextAttributes = {
  alpha: true,
  premultipliedAlpha: false,
  powerPreference: 'high-performance',
};

export function HeroCanvasBackground({
  paletteScrollSource = 'window',
}: HeroCanvasBackgroundProps = {}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [skipWebGL] = useState(IS_MOBILE);

  useEffect(() => {
    if (skipWebGL) return;
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const gl =
      canvas.getContext('webgl', webglContextOptions) ||
      canvas.getContext('experimental-webgl', webglContextOptions);
    if (!gl) return;

    const webgl = gl as WebGLRenderingContext;
    const pointer = { x: 0, y: 0, tx: window.innerWidth * 0.5, ty: window.innerHeight * 0.35 };
    const maxDpr = IS_MOBILE ? 1 : 1.5;
    const devicePixelRatio = Math.min(window.devicePixelRatio || 1, maxDpr);
    let frameId = 0;
    let isVisible = false;
    let tabVisible = document.visibilityState !== 'hidden';
    let paletteAnchorProgress = 0;
    webgl.clearColor(0, 0, 0, 0);

    const refreshPaletteAnchorProgress = () => {
      if (paletteScrollSource !== 'closing-cta-anchor') return;
      const el = document.getElementById('closing-cta');
      if (!el) {
        paletteAnchorProgress = 0;
        return;
      }
      const vh = window.innerHeight;
      const rect = el.getBoundingClientRect();
      const docTop = rect.top + window.scrollY;
      const h = rect.height || el.offsetHeight;
      /**
       * 着色器里 u_scroll_progress = window.scrollY / (2*vh)，分子是「滚动量」不是文档 Y。
       * 用「把收尾区在垂直方向大致居中」时的 scrollY，与用户在收尾屏看到的色相一致。
       */
      const scrollEquivalent = Math.max(0, docTop + h * 0.5 - vh * 0.5);
      paletteAnchorProgress = scrollEquivalent / Math.max(vh * 2, 1);
    };

    const scrollProgressForUniform = () =>
      paletteScrollSource === 'closing-cta-anchor'
        ? paletteAnchorProgress
        : window.scrollY / Math.max(window.innerHeight * 2, 1);

    const createShader = (source: string, type: number) => {
      const shader = webgl.createShader(type);
      if (!shader) return null;
      webgl.shaderSource(shader, source);
      webgl.compileShader(shader);

      if (!webgl.getShaderParameter(shader, webgl.COMPILE_STATUS)) {
        webgl.deleteShader(shader);
        return null;
      }

      return shader;
    };

    const vertexShader = createShader(vertexShaderSource, webgl.VERTEX_SHADER);
    const fragmentShader = createShader(fragmentShaderSource, webgl.FRAGMENT_SHADER);
    if (!vertexShader || !fragmentShader) return;

    const program = webgl.createProgram();
    if (!program) return;

    webgl.attachShader(program, vertexShader);
    webgl.attachShader(program, fragmentShader);
    webgl.linkProgram(program);

    if (!webgl.getProgramParameter(program, webgl.LINK_STATUS)) {
      return;
    }

    webgl.useProgram(program);

    const uniforms: UniformMap = {};
    const uniformCount = webgl.getProgramParameter(program, webgl.ACTIVE_UNIFORMS);
    for (let i = 0; i < uniformCount; i += 1) {
      const activeUniform = webgl.getActiveUniform(program, i);
      if (activeUniform) {
        uniforms[activeUniform.name] = webgl.getUniformLocation(program, activeUniform.name);
      }
    }

    const vertices = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
    const vertexBuffer = webgl.createBuffer();
    webgl.bindBuffer(webgl.ARRAY_BUFFER, vertexBuffer);
    webgl.bufferData(webgl.ARRAY_BUFFER, vertices, webgl.STATIC_DRAW);

    const positionLocation = webgl.getAttribLocation(program, 'a_position');
    webgl.enableVertexAttribArray(positionLocation);
    webgl.vertexAttribPointer(positionLocation, 2, webgl.FLOAT, false, 0, 0);

    const resizeCanvas = () => {
      const { width, height } = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.floor(width * devicePixelRatio));
      canvas.height = Math.max(1, Math.floor(height * devicePixelRatio));
      webgl.viewport(0, 0, canvas.width, canvas.height);
      webgl.uniform1f(uniforms.u_ratio, canvas.width / canvas.height);
    };

    const updatePointer = (x: number, y: number) => {
      const rect = canvas.getBoundingClientRect();
      pointer.tx = x - rect.left;
      pointer.ty = y - rect.top;
    };

    const handlePointerMove = (event: PointerEvent) => updatePointer(event.clientX, event.clientY);
    const handleTouchMove = (event: TouchEvent) => {
      const touch = event.targetTouches[0];
      if (touch) updatePointer(touch.clientX, touch.clientY);
    };

    const render = () => {
      if (!isVisible || !tabVisible) {
        frameId = 0;
        return;
      }
      pointer.x += (pointer.tx - pointer.x) * 0.16;
      pointer.y += (pointer.ty - pointer.y) * 0.16;

      webgl.clear(webgl.COLOR_BUFFER_BIT);
      webgl.uniform1f(uniforms.u_time, performance.now());
      webgl.uniform2f(
        uniforms.u_pointer_position,
        pointer.x / Math.max(canvas.clientWidth, 1),
        1 - pointer.y / Math.max(canvas.clientHeight, 1),
      );
      webgl.uniform1f(uniforms.u_scroll_progress, scrollProgressForUniform());
      webgl.drawArrays(webgl.TRIANGLE_STRIP, 0, 4);
      frameId = window.requestAnimationFrame(render);
    };

    const startLoop = () => {
      if (!isVisible || !tabVisible) return;
      if (!frameId) {
        frameId = window.requestAnimationFrame(render);
      }
    };

    const stopLoop = () => {
      if (frameId) {
        window.cancelAnimationFrame(frameId);
        frameId = 0;
      }
    };

    const onVisibilityChange = () => {
      tabVisible = document.visibilityState !== 'hidden';
      if (tabVisible) startLoop();
      else stopLoop();
    };

    const visibilityObserver = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting;
        if (isVisible) {
          startLoop();
        } else {
          stopLoop();
        }
      },
      { rootMargin: '100px' },
    );
    visibilityObserver.observe(container);

    const resizeCanvasAndPalette = () => {
      resizeCanvas();
      refreshPaletteAnchorProgress();
    };

    resizeCanvas();
    refreshPaletteAnchorProgress();
    window.addEventListener('resize', resizeCanvasAndPalette);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      stopLoop();
      visibilityObserver.disconnect();
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('resize', resizeCanvasAndPalette);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('touchmove', handleTouchMove);
      webgl.deleteProgram(program);
      webgl.deleteShader(vertexShader);
      webgl.deleteShader(fragmentShader);
      if (vertexBuffer) webgl.deleteBuffer(vertexBuffer);
    };
  }, [skipWebGL, paletteScrollSource]);

  return (
    <div ref={containerRef} className="pointer-events-none absolute inset-0 overflow-hidden" style={{ background: '#0b1120' }}>
      {!skipWebGL && (
        <canvas ref={canvasRef} className="h-full w-full opacity-100" style={{ mixBlendMode: 'normal' }} />
      )}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at top left, rgba(102,115,255,0.22), transparent 28%), linear-gradient(180deg, rgba(11,17,32,0.18) 0%, rgba(11,17,32,0.34) 100%)',
        }}
      />
    </div>
  );
}
