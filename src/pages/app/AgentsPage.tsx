import { useNavigate } from 'react-router-dom';
import { ArrowRight, Compass, PenLine, Users, Clock, Coins } from 'lucide-react';

const agents = [
  {
    id: 'geo',
    name: 'GEO 智能体',
    desc: '检测品牌在 DeepSeek、豆包、Kimi 等 AI 回答里的可见度。',
    tasks: '品牌检测 / 竞品分析 / 官网优化',
    duration: '3-8 分钟',
    cost: '1 次 GEO 检测',
    available: true,
    path: '/app/agents/geo',
    icon: Compass,
    highlight: true,
  },
  {
    id: 'media',
    name: '自媒体智能体',
    desc: '公众号、小红书内容起草与发布前合规体检。',
    tasks: '文案生成 / 合规审计 / PPT 大纲',
    duration: '2-5 分钟',
    cost: '1 次内容生成',
    available: false,
    path: '/app/agents',
    icon: PenLine,
    highlight: false,
  },
  {
    id: 'sales',
    name: '销售获客智能体',
    desc: '客户画像分析、外联脚本与跟进邮件生成。',
    tasks: '线索分析 / 私信话术 / 开发信',
    duration: '3-6 分钟',
    cost: '按 Token 计费',
    available: false,
    path: '/app/agents',
    icon: Users,
    highlight: false,
  },
];

export default function AgentsPage() {
  const navigate = useNavigate();

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold font-display">智能体</h1>
        <p className="text-sm text-black/50 mt-1">选择场景智能体，发起可交付的任务</p>
      </div>

      <div className="space-y-4">
        {agents.map((agent) => {
          const Icon = agent.icon;
          return (
            <div
              key={agent.id}
              className={`bg-white border p-6 ${
                agent.highlight ? 'border-black' : 'border-black/8'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex gap-4 min-w-0">
                  <div className={`p-3 shrink-0 ${agent.highlight ? 'bg-black text-white' : 'bg-[#F2F0ED]'}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold">{agent.name}</h2>
                      {agent.highlight && (
                        <span className="text-[9px] font-bold bg-black text-white px-1.5 py-0.5 uppercase">
                          推荐
                        </span>
                      )}
                      {!agent.available && (
                        <span className="text-[9px] font-bold text-black/40 uppercase">即将开放</span>
                      )}
                    </div>
                    <p className="text-sm text-black/55 mt-1 leading-relaxed">{agent.desc}</p>
                    <p className="text-xs text-black/40 mt-2">适合：{agent.tasks}</p>
                    <div className="flex flex-wrap gap-4 mt-3 text-xs text-black/45">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        预计 {agent.duration}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Coins className="w-3.5 h-3.5" />
                        预计消耗 {agent.cost}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={!agent.available}
                  onClick={() => navigate(agent.path)}
                  className="shrink-0 px-5 py-2.5 text-xs font-bold bg-black text-white hover:bg-black/85 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  开始使用
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
