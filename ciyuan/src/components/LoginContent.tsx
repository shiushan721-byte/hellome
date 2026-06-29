import { Button, Checkbox, Divider, Input, Form, message } from 'antd';
import { useCallback, useEffect, useRef, useState } from 'react';
import React from 'react';

import { LegalDocumentModal } from './LegalDocumentModal';
import { TermsOfServiceContent } from '../pages/terms-of-service';
import { PrivacyPolicyContent } from '../pages/privacy-policyPage';
import { useAuth } from '../context/AuthContext';
import { post, ApiError } from '../utils/request';
import {
  isAliCaptchaEnabled,
  isAliCaptchaInitialized,
  initAliCaptcha,
  getAliCaptchaVerifyParam,
  destroyAliCaptcha,
  resetAliCaptcha,
} from '../utils/ali-captcha';

interface LoginContentProps {
  from?: string;
  onSuccess?: () => void;
}

export const LoginContent: React.FC<LoginContentProps> = ({ from, onSuccess }) => {
  const { login } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [smsCode, setSmsCode] = useState('');
  const [smsCountdown, setSmsCountdown] = useState(0);
  const [smsSending, setSmsSending] = useState(false);
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [legalModalOpen, setLegalModalOpen] = useState<'terms' | 'privacy' | null>(null);
  const smsTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const doSendSmsCodeRef = useRef<(() => Promise<void>) | null>(null);

  useEffect(() => {
    return () => {
      if (smsTimerRef.current) {
        clearInterval(smsTimerRef.current);
      }
    };
  }, []);

  const startSmsCountdown = useCallback(() => {
    setSmsCountdown(60);
    if (smsTimerRef.current) {
      clearInterval(smsTimerRef.current);
    }
    smsTimerRef.current = setInterval(() => {
      setSmsCountdown((prev) => {
        if (prev <= 1) {
          if (smsTimerRef.current) {
            clearInterval(smsTimerRef.current);
            smsTimerRef.current = null;
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const doSendSmsCode = useCallback(async () => {
    if (!phoneNumber?.trim() || !/^1[3-9]\d{9}$/.test(phoneNumber)) return;
    setSmsSending(true);
    try {
      let captchaVerifyParam: string | undefined;
      if (isAliCaptchaEnabled()) {
        captchaVerifyParam = await getAliCaptchaVerifyParam();
        if (!captchaVerifyParam) {
          message.warning('请先完成人机验证');
          return;
        }
      }

      const data = await post<{ code?: string }>('/api/app/auth/sms/send', {
        phone: phoneNumber,
        ...(captchaVerifyParam ? { captchaVerifyParam } : {}),
      });

      startSmsCountdown();
      resetAliCaptcha();
      if (data?.code) {
        setSmsCode(data.code);
        message.success('验证码已自动填入（测试模式）');
      } else {
        message.success('验证码已发送');
      }
    } catch (err) {
      if (err instanceof ApiError) {
        message.error(err.message || '发送失败，请重试');
      } else {
        message.error('网络异常，请重试');
      }
    } finally {
      setSmsSending(false);
    }
  }, [phoneNumber, startSmsCountdown]);

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

  const handleSendSmsCodeClick = useCallback(() => {
    if (!isAliCaptchaEnabled()) {
      doSendSmsCode();
      return;
    }
    if (!isAliCaptchaInitialized()) {
      message.warning('验证码组件加载中，请稍后重试');
      initAliCaptcha('#ali-captcha-element', '#ali-captcha-button', {
        onVerified: () => doSendSmsCodeRef.current?.(),
      });
    }
  }, [doSendSmsCode]);

  const handlePhoneLogin = useCallback(async () => {
    if (!phoneNumber?.trim() || !smsCode?.trim() || !/^1[3-9]\d{9}$/.test(phoneNumber)) return;
    if (!agreedToTerms) return;

    setPhoneLoading(true);
    try {
      const data = await post<{
        token: string;
        userId: number;
        phone: string;
        username: string;
      }>('/api/app/auth/login', {
        phone: phoneNumber,
        code: smsCode,
      });

      login(data.token, {
        userId: data.userId,
        phone: data.phone,
        username: data.username,
      });
      onSuccess?.();
    } catch (err) {
      if (err instanceof ApiError) {
        message.error(err.message || '登录失败，请重试');
      } else {
        message.error('网络异常，请重试');
      }
    } finally {
      setPhoneLoading(false);
    }
  }, [phoneNumber, smsCode, agreedToTerms, login, onSuccess]);

  return (
    <div className="flex flex-col w-full">
      <Form layout="vertical" className="w-full" requiredMark={false}>
        <Form.Item
          validateStatus={
            phoneNumber && !/^1[3-9]\d{9}$/.test(phoneNumber) ? 'error' : undefined
          }
          help={
            phoneNumber && !/^1[3-9]\d{9}$/.test(phoneNumber) ? (
              <span className="inline-flex items-center gap-1.5">
                <img
                  src="https://filefront.oss-cn-hangzhou.aliyuncs.com/0_web/gnomic/webLogin/circle-alert-fill.svg"
                  alt=""
                  className="w-[14px] h-[14px] flex-shrink-0"
                />
                请输入正确的手机号
              </span>
            ) : undefined
          }
        >
          <Input
            prefix={
              <img
                src="https://filefront.oss-cn-hangzhou.aliyuncs.com/0_web/gnomic/webLogin/smartphone.svg"
                alt=""
                className="w-[14px] h-[14px]"
              />
            }
            type="tel"
            placeholder="请输入手机号"
            className="py-0"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            maxLength={11}
          />
        </Form.Item>

        <Form.Item>
          <Input
            prefix={
              <img
                src="https://filefront.oss-cn-hangzhou.aliyuncs.com/0_web/gnomic/webLogin/pen-line.svg"
                alt=""
                className="w-[14px] h-[14px]"
              />
            }
            suffix={
              <div className="flex items-center gap-4">
                <Divider type="vertical" className="h-[10px] m-0 my-auto" />
                <div id="ali-captcha-element" />
                <Button
                  id="ali-captcha-button"
                  onClick={handleSendSmsCodeClick}
                  loading={smsSending}
                  disabled={
                    smsCountdown > 0 ||
                    smsSending ||
                    !phoneNumber?.trim() ||
                    !/^1[3-9]\d{9}$/.test(phoneNumber)
                  }
                  type="text"
                  className="p-0 h-auto"
                >
                  {smsCountdown > 0 ? `${smsCountdown}s后重试` : '获取验证码'}
                </Button>
              </div>
            }
            placeholder="请输入验证码"
            className="py-0"
            value={smsCode}
            onChange={(e) => setSmsCode(e.target.value)}
            maxLength={6}
            onPressEnter={handlePhoneLogin}
          />
        </Form.Item>

        <Form.Item className="pt-[20px] !mb-[8px]">
          <Checkbox
            checked={agreedToTerms}
            onChange={(e) => setAgreedToTerms(e.target.checked)}
            className="login-modal-agree-checkbox text-sm text-[#5c6672]"
          >
            我已阅读并同意{' '}
            <button
              type="button"
              onClick={(ev) => {
                ev.preventDefault();
                setLegalModalOpen('terms');
              }}
              className="text-[#7080ff] hover:text-[#6673ff] cursor-pointer bg-transparent border-0 p-0 underline-offset-2 hover:underline"
            >
              《用户协议》
            </button>{' '}
            和{' '}
            <button
              type="button"
              onClick={(ev) => {
                ev.preventDefault();
                setLegalModalOpen('privacy');
              }}
              className="text-[#7080ff] hover:text-[#6673ff] cursor-pointer bg-transparent border-0 p-0 underline-offset-2 hover:underline"
            >
              《隐私协议》
            </button>
          </Checkbox>
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            onClick={handlePhoneLogin}
            loading={phoneLoading}
            disabled={
              phoneLoading ||
              !phoneNumber?.trim() ||
              !smsCode?.trim() ||
              !/^1[3-9]\d{9}$/.test(phoneNumber) ||
              !agreedToTerms
            }
            className="w-full"
          >
            登录
          </Button>
        </Form.Item>
      </Form>

      <LegalDocumentModal
        open={legalModalOpen !== null}
        title={legalModalOpen === 'terms' ? '《用户协议》' : '《隐私协议》'}
        onClose={() => setLegalModalOpen(null)}
      >
        {legalModalOpen === 'terms' && <TermsOfServiceContent />}
        {legalModalOpen === 'privacy' && <PrivacyPolicyContent />}
      </LegalDocumentModal>
    </div>
  );
};
