import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import type { AuthStatus } from '../../types/workbench';

const authStatus: AuthStatus = {
  browserAutomation: true,
  localFileAccess: false,
  wechatOfficial: false,
  xiaohongshu: false,
  feishu: false,
  email: false,
};

const items: { key: keyof AuthStatus; label: string; connectedLabel: string; disconnectedLabel: string }[] = [
  { key: 'browserAutomation', label: '浏览器自动化', connectedLabel: '已开启', disconnectedLabel: '未开启' },
  { key: 'localFileAccess', label: '本地文件访问', connectedLabel: '已开启', disconnectedLabel: '未开启' },
  { key: 'wechatOfficial', label: '公众号', connectedLabel: '已登录', disconnectedLabel: '未登录' },
  { key: 'xiaohongshu', label: '小红书', connectedLabel: '已登录', disconnectedLabel: '未登录' },
  { key: 'feishu', label: '飞书', connectedLabel: '已连接', disconnectedLabel: '未连接' },
  { key: 'email', label: '邮箱', connectedLabel: '已连接', disconnectedLabel: '未连接' },
];

export default function SettingsAuthPage() {
  return (
    <div className="p-6 lg:p-8 max-w-2xl mx-auto space-y-6">
      <Link
        to="/app/settings"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-black/50 hover:text-black"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        返回设置
      </Link>

      <div>
        <h1 className="text-2xl font-bold font-display">授权管理</h1>
        <p className="text-sm text-black/50 mt-1">查看各平台连接状态，高风险操作前将弹出确认</p>
      </div>

      <div className="bg-white border border-black/8 divide-y divide-black/8">
        {items.map(({ key, label, connectedLabel, disconnectedLabel }) => (
          <div key={key} className="flex items-center justify-between px-5 py-4">
            <span className="text-sm font-medium">{label}</span>
            <span
              className={`text-xs font-bold ${
                authStatus[key] ? 'text-emerald-700' : 'text-black/40'
              }`}
            >
              {authStatus[key] ? connectedLabel : disconnectedLabel}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
