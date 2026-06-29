import type { Locale } from './constants';

export interface MessageTree {
  [key: string]: string | MessageTree;
}

function isTree(v: string | MessageTree): v is MessageTree {
  return typeof v === 'object' && v !== null;
}

export function getMessage(tree: MessageTree, path: string): string | undefined {
  const keys = path.split('.');
  let cur: string | MessageTree | undefined = tree;
  for (const k of keys) {
    if (cur === undefined || !isTree(cur)) return undefined;
    cur = cur[k];
  }
  return typeof cur === 'string' ? cur : undefined;
}

const zh: MessageTree = {
  nav: {
    home: '首页',
    capabilities: '构建场景',
    products: '服务能力',
    agentMatrix: '智能体矩阵',
    featuredModels: '智能体矩阵',
    about: '前往官网',
    login: '登录',
    logout: '退出登录',
    workspace: '进入工作台',
    openMenuAria: '打开导航菜单',
    closeMenuAria: '关闭导航菜单',
    menuDialogAria: '网站导航',
  },
  lang: {
    menuAria: '语言',
    listboxAria: '选择语言',
    zh: '中文',
    en: 'English',
    triggerZh: '简体中文',
    triggerEn: 'English',
  },
  home: {
    heroBadge: '智能体词元(Token)工场',
    heroSub:
      '极速运行 AI 模型，针对您的用例进行深度优化，借助「Agent云Token工场」推理云实现规模化扩展。',
    ctaKeys: '获取API密钥',
    ctaModels: '前往工作台',
    scrollCapabilities: '滚动到能力与场景',
    capabilitiesTitle: '您可以构建什么',
    capabilitiesDesc:
      '从实验到生产，「Agent云Token工场」为您提供构建生成式 AI 能力的平台——不仅经过深度优化，且支持规模化扩展。',
    productsTitle: '服务能力',
    productsDesc: '助力用户一站式实现 AI 能力与应用的快速对接',
    agentMatrixTitle: '智能体矩阵',
    agentMatrixDesc: '面向内容创作与桌面生产力的智能体产品，开箱即用、直达场景',
    featuredTitle: '探索我们的精选模型',
    featuredDesc:
      '「Agent云Token工场」 让您能够即刻访问最热门的模型 —— 并在最快的 AI 云平台上，针对成本、速度和质量进行了全面优化。',
    closingTitle: '构建，从现在开始',
    closingSub: '连接模型能力与真实场景，从第一行代码到规模化部署，一步到位',
    contactTitle: '联系我们',
    contactHours: '工作日 09:00-18:00',
    contactQrAlt: '使用微信扫码联系',
    contactHint: '使用微信扫描二维码',
    close: '关闭',
    metrics: {
      tokens: '平台累计推理规模',
      users: '全球开发者与企业用户',
      models: '可用模型与工作流能力',
    },
    metricsValues: {
      users: '5M+ 用户',
      models: '20+ 模型',
    },
    pricing: {
      input: '输入',
      output: '输出',
      perMillion: '/ 1M',
    },
  },
  capabilities: {
    code: { title: '代码辅助', desc: 'IDE 智能副手、代码生成、代码调试智能体。' },
    chat: { title: '对话式 AI', desc: '客户支持机器人、内部服务台助手、多语言对话。' },
    agent: { title: '智能体系统', desc: '多步推理、规划与执行流水线。' },
    search: { title: '搜索企业助手', desc: '内容摘要、语义搜索、个性化推荐。' },
    multimodal: { title: '多模态应用', desc: '用于实时工作流中的文本与视觉处理。' },
    rag: { title: '企业级 RAG', desc: '针对知识库和文档的安全、可扩展检索。' },
  },
  products: {
    api: {
      title: '开箱即用的大模型 API',
      collapsed: '大模型 API',
      desc: '覆盖语言、语音、图片、视频等场景，一站式提供大模型 API 服务，按量计费，助力应用快速上线。',
      action: '立即体验',
    },
    tune: {
      title: '模型微调与部署的托管服务',
      collapsed: '微调与托管服务',
      desc: '支持多种模型微调后直接托管，无需关注底层资源与运维，助力业务快速迭代。',
      action: '联系我们',
    },
    speed: {
      title: '高效能模型推理加速服务',
      collapsed: '推理加速服务',
      desc: '无论是自研模型还是开源模型，均可接入高效推理加速服务，全面提升响应速度与处理性能。',
      action: '联系我们',
    },
    deploy: {
      title: '私有化部署',
      collapsed: '私有化部署',
      desc: '提供企业级私有化部署方案，一站式解决模型性能优化、部署与运维等痛点，满足多样化场景需求。',
      action: '联系我们',
    },
    shortDrama: {
      title: 'OPC生态服务',
      collapsed: 'OPC生态服务',
      desc: '围绕课程体系、数字产品与服务商品三条主线，帮助你把 AI 能力落地为可执行、可复用、可增长的业务系统。',
      action: '联系我们',
    },
    hermes: {
      title: '汇智爱马仕助手',
      collapsed: '汇智爱马仕助手',
      desc: '本地运行的 AI 助手，强悍算力与隐私可控的桌面体验。',
      action: '下载Hz-Hermes',
    },
  },
  agentMatrix: {
    action: '进一步了解',
    drama: {
      title: '汇影漫剧',
      desc: '支持小说拆解、剧本生成、角色资产、分镜设计和视频生产，让内容团队更快完成从文本到成片的创作流程。',
      action: '进一步了解',
    },
    hermes: {
      title: '汇智爱马仕助手',
      desc: '本地运行的 AI 助手，强悍算力与隐私可控的桌面体验。',
      action: '下载Hz-Hermes',
    },
  },
  featured: {
    qwen: {
      badge: '旗舰',
      desc: 'Qwen3.6 原生视觉语言系列 Plus 模型，基于混合架构设计，融合了线性注意力机制与稀疏混合专家模型，实现了更高的推理效率。',
    },
    deepseek: {
      badge: 'Agent',
      desc: 'DeepSeek-V4.0 是一款兼具高计算效率与卓越推理和 Agent 性能的模型。DeepSeek 稀疏注意力，一种高效的注意力机制，在保持模型性能的同时显著降低了计算复杂性，并特别针对长上下文场景进行了优化。',
    },
    kimi: {
      badge: 'MoE',
      desc: 'Kimi K2.5 采用 MoE 架构，拥有 1T 总参数和 32B 激活参数，支持 256K 上下文长度，能够无缝融合视觉与语言理解能力，并具备即时模式和思考模式两种推理方式，以及对话和智能体两种交互范式。',
    },
    glm: {
      badge: 'Complex',
      desc: 'GLM-5.1 专注于复杂系统工程和长周期 Agent 任务。模型规模从 GLM-4.5 的 355B 参数（32B 激活）扩展至 744B 参数（40B 激活），预训练数据从 23T 增加到 28.5T tokens。在保持长上下文能力的同时大幅降低部署成本。',
    },
    minimax: {
      badge: 'Fast',
      desc: 'MiniMax-M2.7 采用 MoE 架构，拥有 2290 亿参数，在编程、智能体工具调用与搜索、办公场景等任务中达到业界领先水平，在 SWE-Bench Verified 上取得 80.2% 的成绩，推理速度比前代 M2.1 提升 37%。',
    },
    doubaoPro: {
      badge: 'Pro',
      desc: '旗舰级全能通用模型，面向 Agent 时代的复杂推理与长链路任务执行场景。强调多模态理解、长上下文推理、结构化生成与工具增强执行，复杂指令与多约束执行能力突出，可稳定应对多步复杂规划、复杂图文推理、视频内容理解与高难度分析等场景。',
    },
    doubaoLite: {
      badge: 'Lite',
      desc: '面向高频企业场景兼顾性能与成本的均衡型模型，胜任非结构化信息处理、内容创作、搜索推荐、数据分析等生产型工作，支持长上下文、多源信息融合、多步指令执行与高保真结构化输出。在保障稳定效果的同时显著优化成本。',
    },
    doubaoMini: {
      badge: 'Mini',
      desc: '面向低时延、高并发与成本敏感场景，提供极致的模型推理速度。模型效果与 Doubao-Seed-1.6 相当。支持 256k 上下文、4 档思考长度和多模态理解，适合成本和速度优先的轻量级任务。',
    },
  },
  login: {
    back: '返回',
    formTitle: '欢迎回来',
    formSubtitle: '登录您的账户',
    phoneLabel: '手机号码',
    phonePlaceholder: '请输入手机号',
    codeLabel: '验证码',
    codePlaceholder: '请输入验证码',
    getCode: '获取验证码',
    codeSending: '发送中…',
    codeRetryIn: '{seconds}s后获取',
    agreePart1: '阅读并同意',
    privacyPolicy: '《用户协议》',
    agreePart2: '和',
    termsOfService: '《隐私协议》',
    agreePart3: '，未注册绑定的手机号验证成功后将自动注册',
    submitLogin: '登录',
    loggingIn: '登录中…',
    hintPhoneEmpty: '请先填写手机号码。',
    hintPhoneInvalid: '请填写有效的大陆手机号码。',
    hintCodeInvalid: '请输入6位数字验证码。',
    hintAgree: '请勾选同意《用户协议》和《隐私协议》。',
    captchaWarning: '请先完成人机验证',
    captchaLoading: '验证码组件加载中，请稍后重试',
    codeSent: '验证码已发送',
    codeAutoFilled: '验证码已自动填入（测试模式）',
    codeSendFailed: '发送失败，请重试',
    loginFailed: '登录失败，请重试',
    networkError: '网络异常，请重试',
    userAgreementModalTitle: '用户协议',
    privacyModalTitle: '隐私协议',
    icpBefore: 'Copyright©2024江苏汇智智能数字科技有限公司',
    icpAfter: '苏ICP备2023021414号-8',
  },
  hermes: {
    close: '关闭',
    badge: '重磅上线',
    title: 'HzHermes 现已开放下载',
    cta: '前往下载',
    items: {
      a: {
        title: '强悍算力，本地释放。',
        text: '将强大的 AI 能力直接部署到你的个人设备。无惧网络波动，即使离线状态下也能流畅运行，轻松应对各类复杂任务。',
      },
      b: {
        title: '数据安全，隐私可控。',
        text: '告别云端上传担忧。所有对话、文件和处理数据均在本地加密存储，将数据的所有权完全交还给你，最大程度保护隐私安全。',
      },
      c: {
        title: '原生体验，触手可及。',
        text: '专为桌面端深度优化的安装包。支持全局快捷键一键唤醒，不打断现有工作流，在任何界面下都能随时响应你的需求。',
      },
    },
  },
  footer: {
    copyright: 'Copyright©2024江苏汇智智能数字科技有限公司',
    icp: '苏ICP备2023021414号-8',
    contactUs: '联系我们',
    qrTitle: '微信扫码联系',
    qrAlt: '联系我们微信二维码',
  },
};

const en: MessageTree = {
  nav: {
    home: 'Home',
    capabilities: 'Use cases',
    products: 'Services',
    agentMatrix: 'Agent matrix',
    featuredModels: 'Agent matrix',
    about: 'Official site',
    login: 'Log in',
    logout: 'Log out',
    workspace: 'Workspace',
    openMenuAria: 'Open navigation menu',
    closeMenuAria: 'Close navigation menu',
    menuDialogAria: 'Site navigation',
  },
  lang: {
    menuAria: 'Language',
    listboxAria: 'Choose language',
    zh: '中文',
    en: 'English',
    triggerZh: '简体中文',
    triggerEn: 'English',
  },
  home: {
    heroBadge: 'Agent Token Factory',
    heroSub:
      'Run AI models at speed, tuned for your workloads, and scale on the Agent Cloud Token Factory inference cloud.',
    ctaKeys: 'Get API keys',
    ctaModels: 'Go to workspace',
    scrollCapabilities: 'Scroll to capabilities',
    capabilitiesTitle: 'What you can build',
    capabilitiesDesc:
      'From experiments to production, Agent Cloud Token Factory gives you a platform to build generative AI—optimized and ready to scale.',
    productsTitle: 'Services',
    productsDesc: 'Connect AI capabilities to your applications in one place.',
    agentMatrixTitle: 'Agent matrix',
    agentMatrixDesc: 'Ready-to-use agent products for content creation and desktop productivity.',
    featuredTitle: 'Featured models',
    featuredDesc:
      'Access leading models instantly—optimized for cost, speed, and quality on a high-performance AI cloud.',
    closingTitle: 'Build from here',
    closingSub: 'From first line of code to production scale—connect models to real-world scenarios.',
    contactTitle: 'Contact Us',
    contactHours: 'Weekdays 09:00–18:00',
    contactQrAlt: 'Scan with WeChat to contact us',
    contactHint: 'Scan the QR code with WeChat',
    close: 'Close',
    metrics: {
      tokens: 'Cumulative inference scale',
      users: 'Developers and teams worldwide',
      models: 'Models and workflow capabilities',
    },
    metricsValues: {
      users: '5M+ Users',
      models: '20+ Models',
    },
    pricing: {
      input: 'Input',
      output: 'Output',
      perMillion: '/ 1M',
    },
  },
  capabilities: {
    code: { title: 'Code assistance', desc: 'IDE copilots, code generation, and debugging agents.' },
    chat: { title: 'Conversational AI', desc: 'Support bots, helpdesk assistants, and multilingual chat.' },
    agent: { title: 'Agent systems', desc: 'Multi-step reasoning, planning, and execution pipelines.' },
    search: { title: 'Enterprise search', desc: 'Summaries, semantic search, and personalized recommendations.' },
    multimodal: { title: 'Multimodal apps', desc: 'Text and vision processing for live workflows.' },
    rag: { title: 'Enterprise RAG', desc: 'Secure, scalable retrieval over knowledge bases and documents.' },
  },
  products: {
    api: {
      title: 'Ready-to-use model APIs',
      collapsed: 'Model APIs',
      desc: 'Language, speech, image, and video—metered APIs to ship applications faster.',
      action: 'Try it now',
    },
    tune: {
      title: 'Managed fine-tuning & hosting',
      collapsed: 'Tuning & hosting',
      desc: 'Fine-tune popular models and host them without running infrastructure.',
      action: 'Contact Us',
    },
    speed: {
      title: 'High-performance inference',
      collapsed: 'Inference acceleration',
      desc: 'Speed up proprietary or open models with optimized inference.',
      action: 'Contact Us',
    },
    deploy: {
      title: 'Private deployment',
      collapsed: 'On-prem / private cloud',
      desc: 'Enterprise deployments with performance tuning, rollout, and operations.',
      action: 'Contact Us',
    },
    shortDrama: {
      title: 'OPC ecosystem services',
      collapsed: 'OPC ecosystem services',
      desc: 'Built around courses, digital products, and service offerings, helping teams turn AI capabilities into executable, reusable, growth-ready business systems.',
      action: 'Contact Us',
    },
    hermes: {
      title: 'Huizhi Hermes Assistant',
      collapsed: 'Huizhi Hermes Assistant',
      desc: 'A local AI assistant with powerful on-device compute and privacy-first design.',
      action: 'Get Hz-Hermes',
    },
  },
  agentMatrix: {
    action: 'Learn more',
    drama: {
      title: 'Huiying Manju',
      desc: 'Novel breakdown, script generation, character assets, storyboard design, and video production help content teams move faster from text to final video.',
      action: 'Learn more',
    },
    hermes: {
      title: 'Huizhi Hermes Assistant',
      desc: 'A locally running AI assistant with strong compute and a privacy-controlled desktop experience.',
      action: 'Download Hz-Hermes',
    },
  },
  featured: {
    qwen: {
      badge: 'Flagship',
      desc: 'Qwen3.6 native VLM Plus: hybrid architecture with linear attention and sparse MoE for higher inference efficiency.',
    },
    deepseek: {
      badge: 'Agent',
      desc: 'DeepSeek-V4.0 balances compute efficiency with strong reasoning and agent performance; sparse attention cuts cost while scaling long context.',
    },
    kimi: {
      badge: 'MoE',
      desc: 'Kimi K2.5 uses MoE with 1T total / 32B active params, 256K context, fused vision-language, instant vs thinking modes, and chat vs agent paradigms.',
    },
    glm: {
      badge: 'Complex',
      desc: 'GLM-5.1 targets complex systems and long-horizon agents—744B / 40B active vs GLM-4.5 355B / 32B, 28.5T tokens pretrain, lower deploy cost with long context.',
    },
    minimax: {
      badge: 'Fast',
      desc: 'MiniMax-M2.7 MoE at 229B params leads on coding, tool use, search, and office tasks—80.2% SWE-Bench Verified, 37% faster than M2.1.',
    },
    doubaoPro: {
      badge: 'Pro',
      desc: 'Full-spectrum flagship for agent-era reasoning and long chains—multimodal, long context, structured output, and tool-augmented execution.',
    },
    doubaoLite: {
      badge: 'Lite',
      desc: 'Balanced cost/performance for high-frequency enterprise work—unstructured data, content, search, analytics, long context, and structured output.',
    },
    doubaoMini: {
      badge: 'Mini',
      desc: 'Low-latency, high-concurrency, cost-sensitive workloads—256k context, multi-step thinking, multimodal; comparable to Doubao-Seed-1.6.',
    },
  },
  login: {
    back: 'Back',
    formTitle: 'Welcome back',
    formSubtitle: 'Log in to your account',
    phoneLabel: 'Phone number',
    phonePlaceholder: 'Enter your phone number',
    codeLabel: 'Verification code',
    codePlaceholder: 'Enter the code',
    getCode: 'Get code',
    codeSending: 'Sending…',
    codeRetryIn: 'Resend in {seconds}s',
    agreePart1: 'I have read and agree to the ',
    privacyPolicy: 'User Agreement',
    agreePart2: ' and ',
    termsOfService: 'Privacy Agreement',
    agreePart3: '. Unregistered numbers will be registered after successful verification.',
    submitLogin: 'Log in',
    loggingIn: 'Logging in…',
    hintPhoneEmpty: 'Please enter your phone number.',
    hintPhoneInvalid: 'Please enter a valid mainland China mobile number.',
    hintCodeInvalid: 'Please enter the 6-digit verification code.',
    hintAgree: 'Please accept the User Agreement and Privacy Agreement.',
    captchaWarning: 'Please complete the captcha first.',
    captchaLoading: 'Captcha is loading, please retry shortly.',
    codeSent: 'Verification code sent.',
    codeAutoFilled: 'Code auto-filled (test mode).',
    codeSendFailed: 'Failed to send. Please retry.',
    loginFailed: 'Login failed. Please retry.',
    networkError: 'Network error. Please retry.',
    userAgreementModalTitle: 'User Agreement',
    privacyModalTitle: 'Privacy Agreement',
    icpBefore: 'Copyright©2024 Jiangsu Huizhi Intelligent Digital Technology Co., Ltd.',
    icpAfter: '苏ICP备2023021414号-8',
  },
  hermes: {
    close: 'Close',
    badge: 'Now available',
    title: 'HzHermes is ready to download',
    cta: 'Go to download',
    items: {
      a: {
        title: 'Serious compute, on your machine.',
        text: 'Run capable AI locally—stay productive offline and handle demanding tasks without relying on the network.',
      },
      b: {
        title: 'Your data, your control.',
        text: 'Conversations, files, and workloads stay encrypted on device—privacy-first by design.',
      },
      c: {
        title: 'A native desktop experience.',
        text: 'A polished desktop app with global shortcuts—wake it anywhere without breaking your flow.',
      },
    },
  },
  footer: {
    copyright: 'Copyright©2024 Jiangsu Huizhi Intelligent Digital Technology Co., Ltd.',
    icp: '苏ICP备2023021414号-8',
    contactUs: 'Contact us',
    qrTitle: 'Scan to contact',
    qrAlt: 'WeChat QR code for contact',
  },
};

export const messageTrees: Record<Locale, MessageTree> = {
  zh,
  en,
};
