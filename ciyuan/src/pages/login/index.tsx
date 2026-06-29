import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { message } from 'antd';
import { useAuth } from '../../context/AuthContext';
import { post, ApiError } from '../../utils/request';
import {
  isAliCaptchaEnabled,
  isAliCaptchaInitialized,
  initAliCaptcha,
  getAliCaptchaVerifyParam,
  destroyAliCaptcha,
  resetAliCaptcha,
} from '../../utils/ali-captcha';
import { LegalDocumentModal } from '../../components/LegalDocumentModal';
import { TermsOfServiceContent } from '../terms-of-service';
import { PrivacyPolicyContent } from '../privacy-policyPage';
import { LocaleProvider, useLocale, useT } from '../marketing/i18n/LocaleProvider';
import { LangToggle } from '../marketing/components/LangToggle';
import './login.css';

const logoMark = '/logo.svg';

/** 大陆手机号：11 位，1 开头，第二位 3–9 */
const MAINLAND_CN_PHONE_RE = /^1[3-9]\d{9}$/;

function isMainlandPhone(value: string): boolean {
  return MAINLAND_CN_PHONE_RE.test(value.trim());
}

function digitsOnly(value: string, maxLen: number): string {
  return value.replace(/\D/g, '').slice(0, maxLen);
}

const fieldClass =
  'h-11 w-full rounded-lg border border-[var(--color-border)] bg-white px-3.5 text-[15px] leading-[22px] text-[var(--color-text-primary)] placeholder:text-[15px] placeholder:leading-[22px] placeholder:text-[var(--color-text-placeholder)] transition-[border-color] focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[rgba(102,115,255,0.25)]';

/** 与「获取验证码」置灰态一致：border / bg / 字色 */
const controlMutedClass =
  'border-[var(--color-border)] bg-[#f3f4f6] text-[15px] leading-[22px] text-[var(--color-text-placeholder)] placeholder:text-[15px] placeholder:leading-[22px] placeholder:text-[var(--color-text-placeholder)]';

/** 未填手机号时验证码框（与获取验证码按钮 disabled / 冷却中视觉一致） */
const codeFieldLockedClass = `cursor-not-allowed ${controlMutedClass} focus:border-[var(--color-border)] focus:outline-none focus:ring-0`;

/** 用户协议 / 隐私协议：默认深色；悬停主题色（覆盖全局 a { color: inherit }） */
const legalLinkClass =
  '!text-[var(--color-text-primary)] underline decoration-[var(--color-border-strong)] underline-offset-2 transition-colors hover:!text-[var(--color-primary)]';

const getCodeButtonClass =
  'inline-flex h-11 w-[132px] shrink-0 items-center justify-center whitespace-nowrap rounded-lg border px-2 text-[15px] leading-[22px] font-normal transition-colors disabled:cursor-not-allowed disabled:border-[var(--color-border)] disabled:bg-[#f3f4f6] disabled:text-[var(--color-text-placeholder)] disabled:hover:border-[var(--color-border)] disabled:hover:text-[var(--color-text-placeholder)]';

const getCodeButtonIdleClass =
  'border-[var(--color-border)] bg-white text-[var(--color-text-secondary)] hover:border-[var(--color-border-strong)] hover:text-[var(--color-text-primary)]';

function BackChevron() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M10 4L6 8l4 4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PhoneLoginForm({ onSuccess }: { onSuccess: () => void }) {
  const t = useT();
  const { login } = useAuth();
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [smsSending, setSmsSending] = useState(false);
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  /** 最近一次成功点击「获取验证码」时的手机号；与当前输入一致时才允许填验证码 */
  const [codeEntryAllowedForPhone, setCodeEntryAllowedForPhone] = useState<string | null>(null);
  const [legalModalOpen, setLegalModalOpen] = useState<'terms' | 'privacy' | null>(null);

  const smsTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const doSendSmsCodeRef = useRef<(() => Promise<void>) | null>(null);

  const phoneTrim = phone.trim();
  const phoneValid = isMainlandPhone(phone);
  const codeValid = /^\d{6}$/.test(code);
  const canUseCodeField = phoneValid && codeEntryAllowedForPhone === phoneTrim;
  const canRequestCode = phoneValid && cooldown === 0 && !smsSending;
  const canSubmit = phoneValid && codeValid && agreed && !phoneLoading;

  useEffect(() => {
    return () => {
      if (smsTimerRef.current) {
        clearInterval(smsTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const id = window.setInterval(() => {
      setCooldown((s) => (s <= 1 ? 0 : s - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [cooldown > 0]);

  useEffect(() => {
    if (!phoneValid) {
      setCode('');
      setCodeEntryAllowedForPhone(null);
      return;
    }
    if (codeEntryAllowedForPhone !== null && phoneTrim !== codeEntryAllowedForPhone) {
      setCode('');
      setCodeEntryAllowedForPhone(null);
    }
  }, [phoneValid, phoneTrim, codeEntryAllowedForPhone]);

  const startSmsCountdown = useCallback(() => {
    setCooldown(60);
  }, []);

  const doSendSmsCode = useCallback(async () => {
    if (!phoneValid || cooldown > 0) return;
    setSmsSending(true);
    try {
      let captchaVerifyParam: string | undefined;
      if (isAliCaptchaEnabled()) {
        captchaVerifyParam = await getAliCaptchaVerifyParam();
        if (!captchaVerifyParam) {
          message.warning(t('login.captchaWarning'));
          return;
        }
      }

      const data = await post<{ code?: string }>('/api/app/auth/sms/send', {
        phone: phoneTrim,
        ...(captchaVerifyParam ? { captchaVerifyParam } : {}),
      });

      setCodeEntryAllowedForPhone(phoneTrim);
      startSmsCountdown();
      resetAliCaptcha();
      if (data?.code) {
        setCode(data.code);
        message.success(t('login.codeAutoFilled'));
      } else {
        message.success(t('login.codeSent'));
      }
    } catch (err) {
      if (err instanceof ApiError) {
        message.error(err.message || t('login.codeSendFailed'));
      } else {
        message.error(t('login.networkError'));
      }
    } finally {
      setSmsSending(false);
    }
  }, [phoneValid, phoneTrim, cooldown, startSmsCountdown, t]);

  doSendSmsCodeRef.current = doSendSmsCode;

  useEffect(() => {
    if (!isAliCaptchaEnabled()) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      if (cancelled) return;
      await initAliCaptcha('#ali-captcha-element', '#ali-captcha-button', {
        onVerified: () => doSendSmsCodeRef.current?.(),
      });
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
      destroyAliCaptcha();
    };
  }, []);

  const handleGetCode = useCallback(() => {
    if (!canRequestCode) return;
    setFormError(null);
    if (!isAliCaptchaEnabled()) {
      doSendSmsCode();
      return;
    }
    if (!isAliCaptchaInitialized()) {
      message.warning(t('login.captchaLoading'));
      initAliCaptcha('#ali-captcha-element', '#ali-captcha-button', {
        onVerified: () => doSendSmsCodeRef.current?.(),
      });
    }
  }, [canRequestCode, doSendSmsCode, t]);

  const clearFormError = useCallback(() => setFormError(null), []);

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      if (phoneTrim.length === 0) {
        setFormError(t('login.hintPhoneEmpty'));
        return;
      }
      if (!phoneValid) {
        setFormError(t('login.hintPhoneInvalid'));
        return;
      }
      if (!codeValid) {
        setFormError(t('login.hintCodeInvalid'));
        return;
      }
      if (!agreed) {
        setFormError(t('login.hintAgree'));
        return;
      }
      setFormError(null);
      setPhoneLoading(true);
      try {
        const data = await post<{
          token: string;
          userId: number;
          phone: string;
          username: string;
        }>('/api/app/auth/login', {
          phone: phoneTrim,
          code,
        });
        login(data.token, {
          userId: data.userId,
          phone: data.phone,
          username: data.username,
        });
        onSuccess();
      } catch (err) {
        if (err instanceof ApiError) {
          setFormError(err.message || t('login.loginFailed'));
        } else {
          setFormError(t('login.networkError'));
        }
      } finally {
        setPhoneLoading(false);
      }
    },
    [phoneTrim, phoneValid, code, codeValid, agreed, login, onSuccess, t],
  );

  return (
    <form className="space-y-5" onSubmit={handleSubmit} noValidate>
      <div className="space-y-1.5">
        <label htmlFor="login-phone" className="block text-sm font-normal text-[var(--color-text-primary)]">
          {t('login.phoneLabel')}
        </label>
        <input
          id="login-phone"
          name="phone"
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          maxLength={11}
          value={phone}
          onChange={(e) => {
            clearFormError();
            setPhone(digitsOnly(e.target.value, 11));
          }}
          placeholder={t('login.phonePlaceholder')}
          className={fieldClass}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="login-code" className="block text-sm font-normal text-[var(--color-text-primary)]">
          {t('login.codeLabel')}
        </label>
        <div className="flex gap-2.5">
          <input
            id="login-code"
            name="code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={code}
            disabled={!canUseCodeField}
            onChange={(e) => {
              clearFormError();
              setCode(digitsOnly(e.target.value, 6));
            }}
            placeholder={t('login.codePlaceholder')}
            className={
              canUseCodeField
                ? `${fieldClass} min-w-0 flex-1`
                : `h-11 w-full min-w-0 flex-1 rounded-lg border px-3.5 text-[15px] leading-[22px] ${codeFieldLockedClass}`
            }
          />
          <button
            type="button"
            id="ali-captcha-button"
            disabled={!canRequestCode}
            onClick={handleGetCode}
            className={`${getCodeButtonClass} ${cooldown > 0 ? controlMutedClass : getCodeButtonIdleClass}`}
          >
            {smsSending
              ? t('login.codeSending')
              : cooldown > 0
                ? t('login.codeRetryIn').replace('{seconds}', String(cooldown))
                : t('login.getCode')}
          </button>
        </div>
        <div id="ali-captcha-element" className="hidden" />
      </div>

      <div className="flex gap-3 pb-4 pt-0.5">
        <input
          id="login-agree"
          type="checkbox"
          checked={agreed}
          onChange={(e) => {
            clearFormError();
            setAgreed(e.target.checked);
          }}
          className="mt-[3px] h-[14px] w-[14px] shrink-0 rounded border-[var(--color-border)] accent-[var(--color-primary)] focus:ring-2 focus:ring-[rgba(102,115,255,0.25)]"
        />
        <label htmlFor="login-agree" className="text-left text-sm leading-5 text-[var(--color-text-secondary)]">
          {t('login.agreePart1')}
          <button
            type="button"
            className={`${legalLinkClass} bg-transparent border-0 p-0 cursor-pointer`}
            onClick={() => setLegalModalOpen('terms')}
          >
            {t('login.privacyPolicy')}
          </button>
          {t('login.agreePart2')}
          <button
            type="button"
            className={`${legalLinkClass} bg-transparent border-0 p-0 cursor-pointer`}
            onClick={() => setLegalModalOpen('privacy')}
          >
            {t('login.termsOfService')}
          </button>
          {t('login.agreePart3')}
        </label>
      </div>

      {formError ? (
        <p role="alert" className="rounded-lg bg-[#fef2f2] px-3 py-2.5 text-sm leading-5 text-[#b91c1c]">
          {formError}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={phoneLoading}
        className="flex h-11 w-full items-center justify-center rounded-lg bg-[var(--color-primary)] text-[15px] leading-[22px] font-medium text-white transition-[filter,transform] hover:brightness-[1.05] active:translate-y-px disabled:cursor-not-allowed disabled:opacity-90"
      >
        {phoneLoading ? t('login.loggingIn') : t('login.submitLogin')}
      </button>

      <LegalDocumentModal
        open={legalModalOpen !== null}
        title={
          legalModalOpen === 'terms'
            ? t('login.userAgreementModalTitle')
            : t('login.privacyModalTitle')
        }
        onClose={() => setLegalModalOpen(null)}
      >
        {legalModalOpen === 'terms' && <TermsOfServiceContent />}
        {legalModalOpen === 'privacy' && <PrivacyPolicyContent />}
      </LegalDocumentModal>
    </form>
  );
}

function LoginPageInner() {
  const t = useT();
  const { locale, setLocale } = useLocale();
  const navigate = useNavigate();
  const { isLogin } = useAuth();

  useEffect(() => {
    if (isLogin) {
      navigate('/hub/models', { replace: true });
    }
  }, [isLogin, navigate]);

  const handleSuccess = useCallback(() => {
    navigate('/hub/models', { replace: true });
  }, [navigate]);

  return (
    <div className="login-page-shell-enter flex min-h-dvh flex-col bg-[#f7f7f8]">
      <header className="login-page-header-enter flex h-14 shrink-0 items-center justify-between px-6 sm:h-[3.75rem] sm:px-10">
        <Link
          to="/marketing"
          className="-mx-1.5 inline-flex items-center gap-1 rounded-md px-1.5 py-1.5 text-sm font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-[#ececef] hover:text-[var(--color-text-primary)]"
        >
          <BackChevron />
          {t('login.back')}
        </Link>
        <LangToggle locale={locale} setLocale={setLocale} label={t('lang.menuAria')} variant="onLight" />
      </header>

      <main className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <div className="flex w-full flex-1 flex-col items-center justify-center px-6 py-10 sm:px-10 sm:py-12 -translate-y-5 sm:-translate-y-8">
          <Link
            to="/marketing"
            aria-label="Token Factory"
            className="login-page-logo-enter inline-flex rounded-md outline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-primary)]"
          >
            <img src={logoMark} alt="" className="h-10 w-10 shrink-0 object-contain" aria-hidden />
          </Link>

          <div className="login-page-form-enter mt-[36px] w-full max-w-[400px]">
            <header className="mb-8 text-center">
              <h2 className="text-[32px] leading-[40px] font-semibold tracking-tight text-[var(--color-text-primary)]">
                {t('login.formTitle')}
              </h2>
              <p className="mt-1.5 text-[15px] leading-[22px] text-[var(--color-text-secondary)]">{t('login.formSubtitle')}</p>
            </header>
            <PhoneLoginForm onSuccess={handleSuccess} />
          </div>
        </div>

        <footer className="login-page-footer-enter shrink-0 px-6 py-5 text-center sm:px-10">
          <p className="flex flex-col items-center gap-0.5 text-[0.6875rem] leading-relaxed text-[var(--color-text-placeholder)]">
            <span>{t('login.icpBefore')}</span>
            <span>{t('login.icpAfter')}</span>
          </p>
        </footer>
      </main>
    </div>
  );
}

export default function LoginPage() {
  return (
    <LocaleProvider>
      <LoginPageInner />
    </LocaleProvider>
  );
}
