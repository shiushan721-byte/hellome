import React, { useState } from 'react';
import { ArrowRight, CheckCircle2, Terminal, ArrowUpRight, ShieldCheck } from 'lucide-react';

interface AgentsShowcaseProps {
  activeTab?: 'geo' | 'media' | 'sales';
  onSelectAgent?: (type: 'geo' | 'media' | 'sales') => void;
}

export default function AgentsShowcase({ activeTab: controlledTab, onSelectAgent }: AgentsShowcaseProps) {
  const [internalTab, setInternalTab] = useState<'geo' | 'media' | 'sales'>('geo');
  const activeTab = controlledTab ?? internalTab;

  const setActiveTab = (tab: 'geo' | 'media' | 'sales') => {
    if (controlledTab === undefined) setInternalTab(tab);
    onSelectAgent?.(tab);
  };

  const agents = [
    {
      id: 'geo' as const,
      name: 'GEO 智能体',
      shortName: 'GEO 智能体',
      tagline: 'AI 可见度检测与优化',
      desc: '专为数字营销时代打造，核心检测您的品牌在各类 AI 生成式搜索回复中的占比，通过智能逆向推荐机制给出科学的提分建议。',
      coreScenarios: [
        'AI 纯答案率、提及率与首推率多模型全量化',
        '核心竞品抢首推词的占位份额比例 (SoV)',
        '自然搜索向大模型召回的下一阶段改造工单输出'
      ],
      quickTasks: ['检测行业内品牌词大模型首位率', '竞品召回漏洞专项补齐', '官网Schema结构化标记重构'],
      badge: '重磅场景 · 官网主推'
    },
    {
      id: 'media' as const,
      name: '自媒体小助手',
      shortName: '自媒体小助手',
      tagline: '公众号、小红书、PPT内容与发布前体检',
      desc: '支持自媒体全生命周期管理，从核心文案起草开始，进行字词禁忌敏评检测、传播模型符合评分、以及自动重塑幻灯片大纲。',
      coreScenarios: [
        '微信公众号、小红书、知乎多平台发前合规审计',
        '高点击率爆棚标题逆向大模型测试与修正模型',
        'PPT 结构大纲及演讲手稿的提分生成'
      ],
      quickTasks: ['生成小红书爆款排版格式', '发布前政治/错别字安全体检', '大纲结构智能化重排'],
      badge: '创作者首选'
    },
    {
      id: 'sales' as const,
      name: '销售获客智能体',
      shortName: '销售获客智能体',
      tagline: '客户画像精准定位、私信与邮件跟进闭环',
      desc: '为销售及商务拓展团队深度降本，完成海量潜在企业分析、私信外联脚本起草，并对回访邮件及长文跟进形成闭环逻辑。',
      coreScenarios: [
        '根据目标企业官网一键提取买家决策链痛点',
        '生成式微信/LinkedIn领英私聊话术',
        '高意向潜在客户多段式精细化跟进邮件'
      ],
      quickTasks: ['全自动外联开发邮件优化', 'B2B 买家个性特征深度提取', '私聊话术自适应训练'],
      badge: '高效获客神器'
    }
  ];

  const currentAgent = agents.find(a => a.id === activeTab) || agents[0];

  const handleActivate = (agentId: 'geo' | 'media' | 'sales') => {
    setActiveTab(agentId);
    const el = document.getElementById('agents-list-view');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative w-full py-16 lg:py-24" id="agents-list-view">
      <div className="mb-12 lg:mb-16 text-center space-y-6">
        <div className="max-w-xl mx-auto space-y-3">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-display text-black">
            三大核心智能体服务
          </h2>
          <p className="text-sm text-black/60">
            按需调用，支持任务执行全程进度监控，针对企业痛点场景深度定制。
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-2">
          {agents.map((a) => (
            <button
              key={a.id}
              onClick={() => setActiveTab(a.id)}
              className={`px-3 py-2 text-[10px] sm:text-xs font-bold transition-all rounded-sm ${
                activeTab === a.id
                  ? 'bg-black text-white'
                  : 'bg-[#F2F0ED] text-black hover:bg-[#E8E6E3]'
              }`}
            >
              {a.shortName}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch text-left">
        <div className="lg:col-span-7 bg-white p-6 sm:p-8 flex flex-col justify-between">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <span className="inline-flex px-3 py-1 bg-[#F2F0ED] text-[10px] font-bold text-black">
                {currentAgent.badge}
              </span>
              <span className="text-[10px] font-mono text-black/40 uppercase tracking-widest">SCENARIO CORE</span>
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-extrabold font-display text-black">{currentAgent.name}</h3>
              <p className="text-sm font-semibold text-black/70">{currentAgent.tagline}</p>
              <p className="text-xs text-black/55 leading-relaxed pt-2">{currentAgent.desc}</p>
            </div>

            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold text-black uppercase tracking-wider">核心执行子模块</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {currentAgent.coreScenarios.map((cs, i) => (
                  <div key={i} className="flex gap-2 text-xs text-black/70 items-start">
                    <CheckCircle2 className="w-4 h-4 text-black shrink-0 mt-0.5" />
                    <span>{cs}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-8 mt-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-1.5">
              <Terminal className="w-4 h-4 text-black/50" />
              <span className="text-xs text-black/50">底层完全适配 Hz-Hermes 执行内核</span>
            </div>
            <button
              onClick={() => handleActivate(currentAgent.id)}
              className="py-2.5 px-4 text-xs font-bold text-white bg-black hover:bg-black/85 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>立即在此场景中开始工作</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="lg:col-span-5 bg-[#F2F0ED] p-6 sm:p-8 flex flex-col justify-between">
          <div className="space-y-6">
            <div className="pb-3">
              <h4 className="text-xs font-bold text-black uppercase tracking-wider">
                该智能体搭载的项目工单
              </h4>
              <p className="text-[11px] text-black/45 mt-0.5">常用秒级可调度的预设方案列表</p>
            </div>

            <div className="space-y-2">
              {currentAgent.quickTasks.map((qt, i) => (
                <div
                  key={i}
                  className="p-3 bg-white hover:bg-white/80 transition-colors flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono font-bold text-black/35">0{i + 1}</span>
                    <span className="text-xs text-black font-medium">{qt}</span>
                  </div>
                  <ArrowUpRight className="w-3.5 h-3.5 text-black/30 group-hover:text-black group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                </div>
              ))}
            </div>
          </div>

          <div className="pt-6 mt-6">
            <div className="flex items-center gap-2 bg-white p-3">
              <ShieldCheck className="w-4 h-4 text-black/50" />
              <span className="text-[10px] text-black/55">
                支持企业定制自建：可无缝结合内部研发 API 及数据库资源。
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
