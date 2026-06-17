import React, { useState } from 'react';
import { Cpu, Compass, Terminal, Zap, Layers } from 'lucide-react';
import HermesDownloadBanner from './HermesDownloadBanner';

export default function HermesSection() {
  const [selectedSkill, setSelectedSkill] = useState<string>('search');

  const skillsData = [
    {
      id: 'search',
      name: 'SearchSkill (全网智能搜索抓取)',
      icon: Compass,
      tools: ['Google AI Search API', 'Citations Extraper', 'Web Page Scraper'],
      flow: '目标定义 ➔ 建立检索矩阵 ➔ 递归解析TOP30可信网页 ➔ 语义去噪 ➔ 正向情感索引',
      desc: '专门针对新兴 AI 搜索（如 Google AI Overviews, Perplexity 等）之召回机制设计。深度抓取主流社区论坛，逆向反演您品牌口碑与长尾词在真实数据池中的占位情况。'
    },
    {
      id: 'parser',
      name: 'DataParser (结构化元数据诊断)',
      icon: Layers,
      tools: ['Schema Markup Validator', 'JSON-Schema Builder', 'Wikidata Reference Linker'],
      flow: '抓取实体标签 ➔ 识别元数据丢失 ➔ 优化官方站点元描述 ➔ 输出标准 JSON-LD 代码包',
      desc: '专为大模型智能代理体检而设的工作组。大模型抓取工具高度看重标准化 Web 图谱描述，DataParser 让搜索机器人毫无感知地看懂官网的核心卖点与权威背书。'
    },
    {
      id: 'sentiment',
      name: 'SemanticsAudit (多维语义对齐器)',
      icon: Cpu,
      tools: ['Cognitive Analysis Hub', 'Competitor Comparison Analyzer', 'LLM Query Emulator'],
      flow: '模拟20+种对比问答场景 ➔ 识别竞品抢占权重 ➔ 标注争议言论来源 ➔ 生成语义补位提示词',
      desc: '对于大模型端高频出现的"哪些更推荐"、"优点与缺点"等比价口碑性搜索响应，SemanticsAudit 帮您分析漏洞并推荐优化，极大程度夺回被竞品独占的被动局面。'
    }
  ];

  const currentSkill = skillsData.find(s => s.id === selectedSkill) || skillsData[0];

  return (
    <section className="relative text-[#1A1A1A] overflow-hidden w-full py-16 lg:py-24" id="hermes-engine-view">
      <div className="w-full">
        <div className="text-center max-w-3xl mx-auto mb-12 lg:mb-16">
          <h2 className="text-4xl font-extrabold tracking-tight font-display text-black">
            由 <span className="font-serif italic text-black font-semibold underline decoration-2 underline-offset-4 decoration-black">Hermes 自动化流程引擎</span> 驱动
          </h2>
          <p className="mt-4 text-xs text-black/70 font-medium leading-relaxed font-sans max-w-2xl mx-auto">
            智能体会自动调用专属 Skills、装载对应分析工具、编排分步任务。整个执行路径毫秒级落格子、全程追踪，企业无需精通任何编程也能实现安全无感提分。
          </p>
        </div>

        <HermesDownloadBanner />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          <div className="lg:col-span-5 bg-white p-6 flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4">
                <span className="text-[10px] font-bold uppercase tracking-widest text-black/55">预设系统技能列表 / Skills Registry</span>
                <span className="h-2 w-2 bg-black" />
              </div>

              <div className="space-y-3.5">
                {skillsData.map((s) => {
                  const Icon = s.icon;
                  return (
                    <button
                      key={s.id}
                      onClick={() => setSelectedSkill(s.id)}
                      className={`w-full text-left p-4 transition-all rounded-sm ${
                        selectedSkill === s.id
                          ? 'bg-black text-white'
                          : 'bg-[#F2F0ED]/30 hover:bg-[#F2F0ED] text-[#1A1A1A]/80 hover:text-black'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 ${
                          selectedSkill === s.id ? 'bg-white/10 text-white' : 'bg-[#F2F0ED] text-black/60'
                        }`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-bold uppercase tracking-wider truncate leading-snug">{s.name}</h4>
                          <p className={`text-[10px] truncate mt-1 ${
                            selectedSkill === s.id ? 'text-white/60' : 'text-[#1A1A1A]/50'
                          }`}>搭载 {s.tools.length} 个核心分析子工具</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-6 mt-6 text-left">
              <div className="bg-[#F2F0ED] p-3">
                <p className="text-[10px] text-black/60 leading-normal font-medium font-sans">
                  💡 <span className="text-black font-semibold">自适应分配规则</span>：Hermes 系统根据具体工作场景进行纯并发式调用编排，让大模型分析工作不只是跑一段问答反馈，而是生成出标准的数字化质量检查流水线。
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 bg-[#F2F0ED] p-6 sm:p-8 flex flex-col justify-between text-left relative">
            <div className="flex items-center justify-between pb-4 mb-6">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-black" />
                <span className="text-xs font-mono font-bold text-black/60">hermes_skill_pipeline.ts</span>
              </div>
              <span className="text-[9px] font-mono font-bold px-2 py-0.5 bg-black text-white rounded-none">
                PRODUCTION_ACTIVE
              </span>
            </div>

            <div className="space-y-6 flex-1 flex flex-col justify-center">
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-black uppercase tracking-wider flex items-center gap-2">
                  <span className="h-1.5 w-1.5 bg-black rounded-none" />
                  {currentSkill.name} 运行方案描述：
                </h3>
                <p className="text-xs text-black/70 leading-relaxed font-sans font-medium">
                  {currentSkill.desc}
                </p>
              </div>

              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-black/50 block">调用的实体工具 (Activated Executables):</span>
                <div className="flex flex-wrap gap-2">
                  {currentSkill.tools.map((t, index) => (
                    <span
                      key={index}
                      className="px-2.5 py-1 bg-white text-[10px] font-bold font-mono text-black"
                    >
                      🔧 {t}
                    </span>
                  ))}
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-black/50 block">实时工作时序拓扑 (DAG Operations Graph):</span>
                <div className="p-3.5 bg-white">
                  <p className="text-xs font-mono font-bold text-black leading-relaxed text-center py-1">
                    {currentSkill.flow}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 p-4 bg-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <Zap className="w-4 h-4 text-black shrink-0" />
                <div className="min-w-0">
                  <span className="text-xs font-bold text-black uppercase tracking-wider block">过程完全可视，结果真实交付</span>
                  <p className="text-[10px] text-black/50 mt-0.5">分析引擎运行中，不留存企业内部商业公式文档，确保数据隐私安全</p>
                </div>
              </div>
              <button
                onClick={() => {
                  const el = document.getElementById('hero-portal-view');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-4 py-2 bg-black hover:bg-black/85 text-white text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shrink-0"
              >
                <span>立即运行我的品牌 ➔</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
