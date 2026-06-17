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
      name: '体验版',
      price: '¥49',
      unit: '',
      tokenAmount: '50,000 Token',
      agentSlotAmount: '可启用 1 个智能体',
      agentSlotNote: '启用后占用名额，停用后立即释放',
      desc: '适合首次体验 GEO 检测、短内容生成、小规模任务。',
      taskHint: '约可完成 3-5 次快速 GEO 检测',
      features: [
        'GEO 快速检测',
        '基础内容生成',
        '任务过程可视化',
        '结果保存 7 天',
      ],
      cta: '立即注册体验',
      highlight: false,
    },
    {
      name: '专业版',
      price: '¥199',
      unit: '/ 月',
      tokenAmount: '500,000 Token / 月',
      agentSlotAmount: '可启用 3 个智能体',
      agentSlotNote: '可随时停用并更换，停用后立即释放名额',
      desc: '适合品牌运营、自媒体创作者、销售个人用户。',
      taskHint: '约可完成 30-50 次标准任务',
      features: [
        'GEO 标准检测',
        '自媒体内容生成',
        '销售话术生成',
        '任务历史长期保存',
        '报告导出',
      ],
      cta: '开启专业版',
      highlight: true,
    },
    {
      name: '团队版',
      price: '¥999',
      unit: '/ 月',
      tokenAmount: '3,000,000 Token / 月',
      agentSlotAmount: '可启用 8 个智能体',
      agentSlotNote: '团队共享名额，支持多智能体协作',
      desc: '适合营销团队、销售团队、内容团队协作。',
      taskHint: '约可完成 150-300 次标准任务',
      features: [
        '团队共享 Token',
        '成员用量统计',
        'GEO 深度检测',
        '批量客户分析',
        '团队任务共享',
      ],
      cta: '开启团队版',
      highlight: false,
    },
    {
      name: '企业定制',
      price: '定制额度',
      unit: '',
      tokenAmount: '专属 Token 额度',
      agentSlotAmount: '不限或自定义',
      agentSlotNote: '按企业需求定制智能体数量',
      desc: '适合大型品牌、代理商、私有化部署或 API 场景。',
      taskHint: '按企业用量定制',
      features: [
        '专属 Token 额度',
        '自定义智能体',
        '私有模型或工具接入',
        '企业权限与白标报告',
        '专属支持',
      ],
      cta: '联系专属顾问',
      highlight: false,
    },
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
            按 Token 额度使用
          </h2>
          <p className="text-black/55 text-sm mt-2">
            每次任务根据输入规模、检测深度和生成内容长度消耗 Token。开始任务前会显示预估消耗，完成后展示实际消耗。
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6 items-stretch">
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
                <div className="h-14 flex flex-col justify-end shrink-0 gap-0.5">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-black leading-none">{tier.price}</span>
                    <span className="text-xs text-black/45 leading-none pb-1">{tier.unit || '\u00A0'}</span>
                  </div>
                  <span className="text-xs font-bold text-black/55">包含 {tier.tokenAmount}</span>
                  <span className="text-xs text-black/50">{tier.agentSlotAmount}</span>
                </div>
                <p className="text-[11px] text-black/40 mt-2">
                  {tier.taskHint}，实际消耗以任务复杂度为准。{tier.agentSlotNote}
                </p>
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
                现在注册立即获赠 <strong className="text-black">20,000 Token</strong>，可用于体验 GEO 检测、内容生成和销售线索分析。
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
