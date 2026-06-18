import { useNavigate } from 'react-router-dom';
import {
  buildLoginUrl,
  type AgentIntentAction,
  type PendingAgentIntent,
} from '../lib/pendingAgentIntent';

interface LoginPromptModalProps {
  agentId?: string;
  action?: AgentIntentAction;
  redirect?: string;
  onClose: () => void;
}

export default function LoginPromptModal({
  agentId,
  action = 'enable',
  redirect,
  onClose,
}: LoginPromptModalProps) {
  const navigate = useNavigate();

  const intent: PendingAgentIntent = {
    agentId,
    action,
    redirect: redirect ?? (agentId ? `/agents/${agentId}` : '/agents'),
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div
        className="bg-white w-full max-w-md p-6 shadow-xl space-y-4 rounded-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold text-black">登录后继续使用</h2>
        <p className="text-sm text-black/60 leading-relaxed">
          登录 HelloMe 后，你可以启用智能体、连接 Hz-Hermes，并让智能体在你的电脑上执行任务。
        </p>
        <p className="text-xs text-black/45 leading-relaxed">
          登录不会自动发起任务，任务执行前会展示预计 Token 消耗。
        </p>
        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 text-xs font-bold border border-black/15 hover:bg-[#F2F0ED] rounded-lg"
          >
            继续浏览
          </button>
          <button
            type="button"
            onClick={() => navigate(buildLoginUrl(intent))}
            className="flex-1 py-2.5 text-xs font-bold bg-black text-white hover:bg-black/85 rounded-lg"
          >
            立即登录
          </button>
        </div>
      </div>
    </div>
  );
}
