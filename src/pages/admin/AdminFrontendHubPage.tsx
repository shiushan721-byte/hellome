import { Link } from 'react-router-dom';
import { AdminCard, AdminPageHeader, adminLinkClass } from '../../components/admin/AdminUi';

const MODULES = [
  {
    to: '/admin/frontend/home',
    title: '首页配置',
    desc: '首屏广告、标签与上架智能体',
  },
  {
    to: '/admin/frontend/generic',
    title: '通用配置',
    desc: '智能体市场、工作流市场等 scope 配置（草稿 / 发布）',
  },
];

export default function AdminFrontendHubPage() {
  return (
    <div className="space-y-5">
      <AdminPageHeader title="前台配置" desc="管理首页与各市场模块的展示配置" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {MODULES.map((item) => (
          <Link key={item.to} to={item.to} className="block">
            <AdminCard className="p-5 hover:border-[#d4d4d4] transition-colors h-full">
              <h2 className="text-base font-semibold text-[#111111]">{item.title}</h2>
              <p className="text-sm text-black/50 mt-2">{item.desc}</p>
              <span className={`inline-block mt-4 ${adminLinkClass}`}>进入 →</span>
            </AdminCard>
          </Link>
        ))}
      </div>
    </div>
  );
}
