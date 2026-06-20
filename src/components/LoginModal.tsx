import { useNavigate } from 'react-router-dom';
import LoginModalCore from '../../复用组件库/auth-login-kit/login-modal-core';
import { resolvePostLoginPath, type PendingAgentIntent } from '../lib/pendingAgentIntent';

interface LoginModalProps {
  intent?: PendingAgentIntent;
  onClose: () => void;
}

export default function LoginModal({ intent = {}, onClose }: LoginModalProps) {
  const navigate = useNavigate();
  const contextual = Boolean(intent.agentId || intent.action === 'use' || intent.action === 'enter');

  return (
    <LoginModalCore
      title={contextual ? '登录后继续使用' : '手机号登录'}
      subtitle={
        contextual
          ? '登录 HelloMe 后，你可以连接 Hz-Hermes，并让智能体在你的电脑上执行任务。'
          : '登录后连接 Hz-Hermes，并直接使用智能体'
      }
      helperText="当前是测试环境登录：验证码由服务端动态生成，并会自动填入输入框；注册、会话和角色分流按真实线上结构执行。"
      onClose={onClose}
      onSuccess={() => {
        navigate(resolvePostLoginPath(intent), { replace: true });
      }}
    />
  );
}
