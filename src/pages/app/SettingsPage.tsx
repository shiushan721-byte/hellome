import { Link } from 'react-router-dom';
import { getUser } from '../../lib/auth';
import type { AuthStatus } from '../../types/workbench';

const DEFAULT_AUTH: AuthStatus = {
  browserAutomation: true,
  localFileAccess: false,
  wechatOfficial: false,
  xiaohongshu: false,
  feishu: false,
  email: false,
};

const authItems: { key: keyof AuthStatus; label: string }[] = [
  { key: 'browserAutomation', label: '浏览器自动化' },
  { key: 'localFileAccess', label: '本地文件访问' },
  { key: 'wechatOfficial', label: '公众号' },
  { key: 'xiaohongshu', label: '小红书' },
  { key: 'feishu', label: '飞书' },
  { key: 'email', label: '邮箱' },
];

export default function SettingsPage() {
  const user = getUser();

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto space-y-10">
      <div>
        <h1 className="text-2xl font-bold font-display">设置</h1>
        <p className="text-sm text-black/50 mt-1">账号、通知与授权管理</p>
      </div>

      <section className="space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-black/45">个人资料</h2>
        <div className="bg-white border border-black/8 p-5 space-y-3 text-sm">
          <Row label="姓名" value={user.name} />
          <Row label="手机号" value={user.phone || '未绑定'} />
          <Row label="邮箱" value={user.email || '未绑定'} />
          <Row label="工作空间" value={user.workspace} />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-black/45">账号安全</h2>
        <div className="bg-white border border-black/8 p-5 text-sm text-black/55">
          <p>支持 SSO 企业登录及一键认证（演示模式暂未接入）</p>
        </div>
      </section>

      <section className="space-y-4" id="auth">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-black/45">授权管理</h2>
          <Link to="/app/settings/auth" className="text-xs font-bold text-black/50 hover:text-black">
            详情 →
          </Link>
        </div>
        <div className="bg-white border border-black/8 divide-y divide-black/8">
          {authItems.map(({ key, label }) => (
            <div key={key} className="flex items-center justify-between px-5 py-3 text-sm">
              <span>{label}</span>
              <AuthBadge connected={DEFAULT_AUTH[key]} />
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-black/45">隐私与数据</h2>
        <div className="bg-white border border-black/8 p-5 text-sm text-black/55 leading-relaxed">
          所有传输数据均执行 TLS 加密。未经授权不会将商业数据用于外部大模型公开训练。
        </div>
      </section>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-black/45">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function AuthBadge({ connected }: { connected: boolean }) {
  return (
    <span
      className={`text-[10px] font-bold uppercase px-2 py-0.5 ${
        connected ? 'bg-emerald-50 text-emerald-700' : 'bg-black/5 text-black/40'
      }`}
    >
      {connected ? '已开启' : connected === false ? '未连接' : '未开启'}
    </span>
  );
}
