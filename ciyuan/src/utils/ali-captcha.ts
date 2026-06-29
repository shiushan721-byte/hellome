/**
 * 阿里云验证码 2.0 前端集成（V3 架构：静默模式 + 滑块兜底）
 *
 * V3 流程：
 * 1. 设置 window.AliyunCaptchaConfig = { region, prefix }
 * 2. 动态加载 AliyunCaptcha.js
 * 3. 调用 initAliyunCaptcha({ SceneId, mode, element, button, success, fail, getInstance })
 * 4. SDK 拦截绑定按钮的点击 → 执行静默验证
 *    - 静默通过 → success(captchaVerifyParam)
 *    - 静默失败 → 弹出滑块 → 通过后 → success(captchaVerifyParam)
 * 5. success 回调中存储 captchaVerifyParam 并触发 onVerified
 * 6. onVerified → doSendSmsCode → getAliCaptchaVerifyParam() → 随业务请求发送
 * 7. 服务端调用 VerifyCaptcha 校验（一次性 token）
 */

const ALI_CAPTCHA_SCRIPT_URL =
  'https://o.alicdn.com/captcha-frontend/aliyunCaptcha/AliyunCaptcha.js';
const ALI_CAPTCHA_SCRIPT_ID = 'ali-captcha-script';

declare global {
  interface Window {
    AliyunCaptchaConfig?: {
      region: string;
      prefix: string;
    };
    initAliyunCaptcha?: (config: AliCaptchaConfig) => Promise<AliCaptchaInstance>;
  }
}

interface AliCaptchaConfig {
  SceneId: string;
  mode: 'popup' | 'embed';
  element: string;
  button: string;
  success: (captchaVerifyParam: string) => void;
  fail?: (result: unknown) => void;
  getInstance: (instance: AliCaptchaInstance) => void;
  slideStyle?: {
    width: number;
    height: number;
  };
  language?: string;
}

interface AliCaptchaInstance {
  show?: () => void;
  hide?: () => void;
  refresh?: () => void;
  destroy?: () => void;
}

// ---------- 环境变量读取 ----------
// Rsbuild source.define 在编译时做字面量替换，
// 必须直接写 import.meta.env.VITE_XXX，
// 动态属性访问 env[key] 不会被替换。

const CAPTCHA_ENABLED = import.meta.env.VITE_ALI_CAPTCHA_ENABLED ?? '';
const CAPTCHA_SCENE_ID = import.meta.env.VITE_ALI_CAPTCHA_SCENE_ID ?? '';
const CAPTCHA_PREFIX = import.meta.env.VITE_ALI_CAPTCHA_PREFIX || '1m0xni';

export const aliCaptchaEnabled = (): boolean => CAPTCHA_ENABLED === 'true';

export const aliCaptchaSceneId = (): string => CAPTCHA_SCENE_ID;

export const aliCaptchaPrefix = (): string => CAPTCHA_PREFIX;

export function isAliCaptchaEnabled(): boolean {
  if (CAPTCHA_ENABLED === 'true') return true;
  if (CAPTCHA_ENABLED === 'false') return false;
  return Boolean(CAPTCHA_SCENE_ID.trim());
}

// ---------- 内部状态 ----------

let scriptLoadPromise: Promise<void> | null = null;
let captchaInstance: AliCaptchaInstance | null = null;
let lastVerifiedParam: string | undefined = undefined;
let captchaInitialized = false;

export function isAliCaptchaInitialized(): boolean {
  return captchaInitialized;
}

// ---------- DOM 等待 ----------

function waitForElement(selector: string, timeout = 3000): Promise<Element | null> {
  const el = document.querySelector(selector);
  if (el) return Promise.resolve(el);

  return new Promise((resolve) => {
    const start = Date.now();
    const interval = setInterval(() => {
      const found = document.querySelector(selector);
      if (found || Date.now() - start > timeout) {
        clearInterval(interval);
        resolve(found ?? null);
      }
    }, 50);
  });
}

// ---------- SDK 加载 ----------

function loadAliCaptchaScript(): Promise<void> {
  if (scriptLoadPromise) return scriptLoadPromise;

  if (typeof document === 'undefined') {
    scriptLoadPromise = Promise.resolve();
    return scriptLoadPromise;
  }

  if (!window.AliyunCaptchaConfig) {
    window.AliyunCaptchaConfig = {
      region: 'cn',
      prefix: aliCaptchaPrefix(),
    };
  }

  if (window.initAliyunCaptcha) {
    scriptLoadPromise = Promise.resolve();
    return scriptLoadPromise;
  }

  scriptLoadPromise = new Promise((resolve, reject) => {
    if (document.getElementById(ALI_CAPTCHA_SCRIPT_ID)) {
      if (window.initAliyunCaptcha) {
        resolve();
      } else {
        const existing = document.getElementById(ALI_CAPTCHA_SCRIPT_ID) as HTMLScriptElement;
        existing.addEventListener('load', () => resolve());
        existing.addEventListener('error', () =>
          reject(new Error('Ali CAPTCHA script load failed')),
        );
      }
      return;
    }

    const script = document.createElement('script');
    script.id = ALI_CAPTCHA_SCRIPT_ID;
    script.src = ALI_CAPTCHA_SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      scriptLoadPromise = null;
      reject(new Error('Ali CAPTCHA script load failed'));
    };
    document.head.appendChild(script);
  });

  return scriptLoadPromise;
}

// ---------- 公开 API ----------

export interface InitAliCaptchaOptions {
  onVerified?: () => void | Promise<void>;
}

/**
 * 初始化阿里云验证码组件（popup 静默模式）
 * 页面挂载时调用一次即可；内部会等待目标 DOM 元素就绪后再绑定 SDK
 */
export async function initAliCaptcha(
  captchaElementId = '#ali-captcha-element',
  buttonId = '#ali-captcha-button',
  options?: InitAliCaptchaOptions,
): Promise<void> {
  if (!isAliCaptchaEnabled()) {
    console.log('[AliCaptcha] 验证码未启用，跳过初始化');
    return;
  }

  captchaInitialized = false;
  const onVerified = options?.onVerified;

  console.log('[AliCaptcha] 开始加载 SDK 脚本...');
  try {
    await loadAliCaptchaScript();
    console.log('[AliCaptcha] SDK 脚本加载完成');
  } catch (err) {
    console.warn('[AliCaptcha] SDK 脚本加载失败:', err);
    return;
  }

  if (!window.initAliyunCaptcha) {
    console.warn('[AliCaptcha] initAliyunCaptcha 函数不可用');
    return;
  }

  console.log('[AliCaptcha] 等待 DOM 元素就绪...');
  const [containerEl, buttonEl] = await Promise.all([
    waitForElement(captchaElementId),
    waitForElement(buttonId),
  ]);

  if (!buttonEl) {
    console.warn('[AliCaptcha] 按钮元素未找到:', buttonId);
    return;
  }
  if (!containerEl) {
    console.warn('[AliCaptcha] 容器元素未找到:', captchaElementId);
    return;
  }
  console.log('[AliCaptcha] DOM 元素已就绪，开始初始化 SDK');

  if (captchaInstance?.destroy) {
    try {
      captchaInstance.destroy();
    } catch {
      // ignore
    }
    captchaInstance = null;
  }

  try {
    const sceneId = aliCaptchaSceneId();

    await window.initAliyunCaptcha({
      SceneId: sceneId,
      mode: 'popup',
      element: captchaElementId,
      button: buttonId,
      slideStyle: {
        width: 360,
        height: 40,
      },
      language: 'cn',
      success: (captchaVerifyParam: string) => {
        console.log('[AliCaptcha] 验证成功');
        lastVerifiedParam = captchaVerifyParam;
        if (onVerified) {
          Promise.resolve(onVerified()).catch((err) => {
            console.warn('[AliCaptcha] onVerified 回调异常:', err);
          });
        }
      },
      fail: (_result: unknown) => {
        console.log('[AliCaptcha] 验证失败，等待用户重试');
        lastVerifiedParam = undefined;
      },
      getInstance: (instance: AliCaptchaInstance) => {
        captchaInstance = instance;
      },
    });
    captchaInitialized = true;
    console.log('[AliCaptcha] SDK 初始化完成');
  } catch (err) {
    console.warn('[AliCaptcha] SDK 初始化失败:', err);
  }
}

/**
 * 获取验证码校验参数（一次性消费）
 * 仅在 success 回调触发后有值，取出后自动清空
 */
export async function getAliCaptchaVerifyParam(): Promise<string | undefined> {
  if (!isAliCaptchaEnabled()) return undefined;

  if (lastVerifiedParam) {
    const param = lastVerifiedParam;
    lastVerifiedParam = undefined;
    return param;
  }

  return undefined;
}

/**
 * 重置验证码状态（不销毁实例），使下次点击重新触发验证流程
 */
export function resetAliCaptcha(): void {
  lastVerifiedParam = undefined;
  if (captchaInstance?.refresh) {
    try {
      captchaInstance.refresh();
    } catch {
      // ignore
    }
  }
}

/**
 * 销毁验证码实例，页面卸载时调用
 */
export function destroyAliCaptcha(): void {
  if (captchaInstance?.destroy) {
    try {
      captchaInstance.destroy();
    } catch {
      // ignore
    }
  }
  captchaInstance = null;
  captchaInitialized = false;
  lastVerifiedParam = undefined;
}
