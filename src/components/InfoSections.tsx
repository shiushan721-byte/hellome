import React, { useState } from 'react';
import { ArrowRight, Check, Plus, Minus, CheckCircle } from 'lucide-react';
import { FaqItem } from '../types';

export default function InfoSections() {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [contactEmail, setContactEmail] = useState('');

  const steps = [
    { num: '01', title: '选择智能体', desc: '在门户选择 GEO、自媒体或销售获客等对应场景的智能体。' },
    { num: '02', title: '输入任务', desc: '输入您的具体产品品牌，或勾选指定要产出的营销场景目标。' },
    { num: '03', title: '查看结果', desc: '透过过程控制日志，获取可视化诊断概率及一键生成的实操工单交付。' }
  ];

  const pricingTiers = [
    {
      name: '单次任务包',
      price: '¥49',
      unit: '/ 任务起',
      desc: '适合独立创作者或单项品牌的快速冷启动体检检测。',
      features: [
        'GEO 主流大模型评分测试 (5次)',
        '自媒体合规错字安全审计 (10次)',
        'Hermes 基础过程控制日志面板',
        '永久保存检测工单报告记录'
      ],
      cta: '立即注册体验',
      highlight: false
    },
    {
      name: '团队年度额度',
      price: '¥1,699',
      unit: '/ 年度',
      desc: '适合数字创意工作室、公关或销售团队协作，额度全共享。',
      features: [
        '全核 GEO 品牌可见度诊断体检 (无限次)',
        '自媒体及PPT文档自动提纲 (200篇/月)',
        '销售获客智能外联邮件生成 (500封/月)',
        '专属多成员面板及历史比对分析图表',
        'Hermes 智能流 DAG 流程优先渲染算力'
      ],
      cta: '开启团队订阅',
      highlight: true
    },
    {
      name: '企业定制方案',
      price: '定制授权',
      unit: '',
      desc: '适合大型跨国企业及特定垂直品类头部大牌的私有化/API场景。',
      features: [
        '本地化核心大模型(如私有Gemini、自定义大语言模型)数据对齐',
        '自定义 Skill 添加（接入内部知识库及关系型数据库）',
        '全域安全沙盒保证，无训练语料泄露风险',
        '1对1 资深 GEO 营销架构专家部署与终身运维',
        '支持高并发生产级别 API 接入'
      ],
      cta: '联系专属顾问',
      highlight: false
    }
  ];

  const faqs: FaqItem[] = [
    {
      question: '什么是 GEO (Generative Engine Optimization)，它与 SEO 有什么区别？',
      answer: 'SEO (搜索引擎优化) 旨在提升您在 traditional Google/Baidu 等链接列表中的网页排名。而 GEO (生成式引擎优化) 则是为了解决用户在使用 Perplexity, ChatGPT Search, Gemini 等 AI 生成式问答时，AI 是否"认识"您的品牌、愿不愿意"主动推荐"您的品牌、以及在横向竞品对比中能否优先排在前面。GEO 关注的是语义关联度、可信度证明、以及结构化百科引用。'
    },
    {
      question: 'Hermes 引擎是如何保证数据分析和执行效率的？',
      answer: 'Hermes 是 HelloMe 专有的轻量级代理流程引擎。它能将复杂的业务流程分解为特定的 Skills（如获取网络上下文，执行大模型逆向推荐评估，生成工单策略等），并进行实时 DAG 工作流编排。通过内置异步执行策略与本地备用缓存，一个高精度的全渠道 AI 提及率分析仅需 4.5 秒即可产出精细日志。'
    },
    {
      question: '我们是一家传统零售企业，可以直接使用销售及自媒体智能体吗？',
      answer: '当然可以。绝大多数企业用户并不需要拥有人工智能技术功底。我们的极简门户入口为您隐退了繁琐的"提示词工程"或"大模型参数挑选"。在首屏选定或点选对应组件，输入您的品牌和描述，智能体就会代替您调用并组合最佳模型、在几秒内交付文案、PPT大纲或客户开发信。'
    },
    {
      question: '数据安全能否得到保障？输入我们内部的商业品牌会不会泄露？',
      answer: '所有传输数据均执行 TLS 加密。我们的云存储架构符合最高级别的企业合规机制，永远不会在未经授权的情况下将您的商业数据或品牌问答提供给外部大模型进行公开训练。企业订阅版及定制版用户更有专属独立沙盒通道与完全脱敏的代理接口。'
    }
  ];

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (contactEmail.trim()) {
      setFormSubmitted(true);
      setTimeout(() => setContactEmail(''), 3000);
    }
  };

  return (
    <div className="text-left pt-16 lg:pt-24 space-y-10 lg:space-y-12 pb-16 lg:pb-24">

      <section className="py-8 lg:py-10" id="working-way-view">
        <div className="w-full">
        <div className="text-center max-w-2xl mx-auto mb-12 lg:mb-16">
          <h2 className="text-3xl font-extrabold tracking-tight font-display text-black">
            从目标到结果，只需三步
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((s, index) => (
            <div key={index} className="bg-white p-6">
              <span className="block text-3xl font-mono font-black text-black mb-4">{s.num}</span>
              <h3 className="text-base font-bold text-black mb-2">{s.title}</h3>
              <p className="text-xs text-black/55 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
        </div>
      </section>

      <section className="py-8 lg:py-10" id="pricing-section-view">
        <div className="w-full">
        <div className="text-center max-w-2xl mx-auto mb-12 lg:mb-16">
          <h2 className="text-3xl font-extrabold tracking-tight font-display text-black">
            按任务付费，弹性灵活
          </h2>
          <p className="text-black/55 text-sm mt-2">
            单次任务、团队额度、企业方案。无任何强制长期订阅捆绑，自由增减。
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          {pricingTiers.map((tier, i) => (
            <div
              key={i}
              className={`bg-white p-6 sm:p-8 flex flex-col h-full relative ${
                tier.highlight ? 'bg-[#F2F0ED]' : ''
              }`}
            >
              {tier.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] font-extrabold px-3 py-1 uppercase tracking-wider">
                  MOST POPULAR · 推荐选择
                </span>
              )}
              <div className="flex flex-col flex-1">
                <div className="min-h-[5.5rem]">
                  <h3 className="text-lg font-bold text-black">{tier.name}</h3>
                  <p className="text-xs text-black/50 mt-1 leading-relaxed">{tier.desc}</p>
                </div>
                <div className="h-14 flex items-baseline gap-1 shrink-0">
                  <span className="text-4xl font-extrabold text-black leading-none">{tier.price}</span>
                  <span className="text-xs text-black/45 leading-none pb-1">
                    {tier.unit || '\u00A0'}
                  </span>
                </div>
                <ul className="flex-1 space-y-3 pt-4">
                  {tier.features.map((f, fi) => (
                    <li key={fi} className="flex gap-2.5 text-xs text-black/70 items-start">
                      <Check className="w-4 h-4 text-black shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="pt-8 mt-auto">
                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById('contact-form-section');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className={`w-full py-3 font-bold text-xs transition-all ${
                    tier.highlight
                      ? 'bg-black text-white hover:bg-black/85'
                      : 'bg-[#F2F0ED] text-black hover:bg-[#E8E6E3]'
                  }`}
                >
                  {tier.cta}
                </button>
              </div>
            </div>
          ))}
        </div>
        </div>
      </section>

      <section className="py-8 lg:py-10" id="contact-form-section">
        <div className="w-full bg-[#F2F0ED] p-8 sm:p-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div className="space-y-5">
              <h2 className="text-3xl font-extrabold tracking-tight font-display text-black">
                让第一个智能体开始工作
              </h2>
              <p className="text-sm text-black/60 leading-relaxed">
                现在注册立即获赠 <strong className="text-black">3 次免费 GEO 全通道诊断体检额度</strong>。输入您的企业邮箱，我们的 Hermes 营销架构师将在一小时内为您发送定制化的 AI 提及率分析报告和优化说明。
              </p>
            </div>
            <div>
              {formSubmitted ? (
                <div className="bg-white p-6 text-center space-y-3">
                  <div className="mx-auto w-10 h-10 bg-black flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>
                  <h4 className="text-sm font-bold text-black">提交成功！专属额度已发至您的邮箱</h4>
                  <p className="text-[11px] text-black/55 leading-normal">
                    系统已为您激活暂存工作流账号。您可以随时返回首屏体验 GEO 品牌体检模块。
                  </p>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="email"
                      required
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="您的工作邮箱 (e.g., mail@brand.com)"
                      className="flex-1 bg-white py-3 px-4 text-xs text-black outline-none transition-all placeholder:text-black/35 focus:ring-1 focus:ring-black/20"
                    />
                    <button
                      type="submit"
                      className="bg-black hover:bg-black/85 text-white font-bold px-6 py-3 text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer shrink-0"
                    >
                      <span>立即开始使用</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-[10px] text-black/40 leading-relaxed text-center sm:text-left">
                    点击"立即开始"代表您同意我们的软件服务条款及隐私策略。支持 SSO 企业登录及一键认证。
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="py-8 lg:py-10" id="faq-section-view">
        <div className="w-full max-w-4xl mx-auto">
        <div className="text-center mb-12 lg:mb-16">
          <h2 className="text-2xl font-bold tracking-tight font-display text-black">FAQ / 常见疑问答疑</h2>
          <p className="text-xs text-black/45 mt-1">
            关于 GEO 品牌可见度、智能体引擎运行及定价机制的所有细节解答
          </p>
        </div>
        <div className="space-y-2">
          {faqs.map((faq, idx) => (
            <div key={idx} className="bg-white overflow-hidden transition-all">
              <button
                type="button"
                onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                className="w-full px-5 py-4 flex items-center justify-between text-left text-xs font-semibold text-black hover:bg-[#F2F0ED] outline-none"
              >
                <span>{faq.question}</span>
                <span className="text-black/40">
                  {openFaqIndex === idx ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </span>
              </button>
              {openFaqIndex === idx && (
                <div className="px-5 pb-5 pt-1 text-xs text-black/60 leading-relaxed">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
        </div>
      </section>

      <footer className="pt-8 lg:pt-10 pb-12">
        <div className="max-w-md space-y-4">
          <span className="text-lg font-bold tracking-tight font-display text-black">
            Hello<span className="font-serif italic">Me</span>
          </span>
          <p className="text-xs text-black/50 leading-relaxed">
            您的智能体平台入口。让智能体完成复杂任务。过程看得见，结果可交付。
          </p>
          <div className="text-[10px] text-black/35">
            © {new Date().getFullYear()} HelloMe Inc. 保留所有权利及著作权。
          </div>
        </div>
      </footer>
    </div>
  );
}
