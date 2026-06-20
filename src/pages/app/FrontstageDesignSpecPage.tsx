import { Link } from 'react-router-dom';
import {
  BadgeCheck,
  ChevronsRight,
  Columns3,
  Eye,
  LayoutPanelLeft,
  PackageCheck,
  Palette,
  PlaySquare,
  SquareStack,
  Type,
} from 'lucide-react';

const COLOR_TOKENS = [
  { name: 'Canvas', value: '#F5F5F7', note: '工作区底色 / 大背景' },
  { name: 'Paper', value: '#FDFCFB', note: '壳层底色 / 顶栏侧栏' },
  { name: 'Card', value: '#FFFFFF', note: '主卡片 / 浮层' },
  { name: 'Soft', value: '#F7F7F8', note: '弱提示 / 收起信息底' },
  { name: 'Tag', value: '#F2F0ED', note: '标签 / 次级按钮 / 占位' },
  { name: 'Ink', value: '#1A1A1A', note: '主文本 / 主按钮' },
  { name: 'Accent', value: '#EAF6F4', note: '已连接 / 轻强调' },
  { name: 'Accent Ink', value: '#0F766E', note: '强调文本 / 运行状态' },
] as const;

const TYPE_TOKENS = [
  { label: 'Display', sample: 'HelloMe Design Language', className: 'font-display text-[34px] leading-none font-bold' },
  { label: 'Heading', sample: '三栏结果导向工作台', className: 'text-[28px] leading-[1.1] font-semibold' },
  { label: 'Section', sample: '默认少解释，默认看结果', className: 'text-[20px] leading-[1.2] font-semibold' },
  { label: 'Body', sample: '普通用户只需要最少输入与清晰结果，不需要先理解系统过程。', className: 'text-sm leading-6 text-black/58' },
  { label: 'Meta', sample: '上传提示 / 状态 / 标签 / 说明', className: 'text-[12px] leading-5 font-medium text-black/42' },
  { label: 'Mono', sample: 'sample-video.mp4 / queued / waiting_confirmation', className: 'font-mono text-[12px] leading-5 text-black/52' },
] as const;

const PRINCIPLES = [
  '同一类功能只用一种交互样式，不重复发明新结构。',
  '普通用户默认先看结果，不先看系统过程。',
  '信息默认收起，只有用户主动触发才展开细节。',
  '左中右三栏固定分工，不在一个区域里同时塞输入、结果和日志。',
];

export default function FrontstageDesignSpecPage() {
  return (
    <div className="min-h-full bg-[#F5F5F7] px-4 sm:px-6 lg:px-8 xl:px-10 pt-4 pb-8">
      <div className="mx-auto w-full space-y-6">
        <header className="rounded-[28px] border border-black/8 bg-white px-6 py-6 sm:px-8 sm:py-8 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full bg-[#F5F6F8] px-3 py-1 text-[11px] font-semibold text-black/55">
                <Columns3 className="h-3.5 w-3.5" />
                Frontstage Design Spec
              </div>
              <div className="space-y-2">
                <h1 className="font-display text-3xl font-bold text-[#1A1A1A] sm:text-[38px]">
                  HelloMe 前台统一设计规范预览
                </h1>
                <p className="max-w-3xl text-sm leading-6 text-black/58">
                  这页只做确认，不直接改业务逻辑。先统一色彩、字体、组件、模块和左中右三栏工作台结构，确认后再批量收敛到
                  UGC 页面、任务页和 Creator 页面。
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <SpecPill icon={Eye} label="默认先看结果" />
              <SpecPill icon={LayoutPanelLeft} label="固定三栏分工" />
              <SpecPill icon={PackageCheck} label="过程按需展开" accent />
            </div>
          </div>
        </header>

        <section className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
          <Panel title="核心原则" icon={BadgeCheck}>
            <div className="grid gap-3">
              {PRINCIPLES.map((item, index) => (
                <div
                  key={item}
                  className="flex items-start gap-3 rounded-2xl border border-black/8 bg-[#FCFCFD] px-4 py-3"
                >
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#EAF6F4] text-[11px] font-semibold text-[#0F766E]">
                    {index + 1}
                  </span>
                  <p className="text-sm leading-6 text-black/62">{item}</p>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="模块栈顺序" icon={SquareStack}>
            <div className="space-y-3">
              <StackRow
                title="L1 页面框架"
                description="顶栏、侧栏、标签页栏稳定不动，减少学习成本。"
              />
              <StackRow
                title="L2 工作台结构"
                description="左输入、中结果、右交付与状态，统一布局骨架。"
              />
              <StackRow
                title="L3 交互内容"
                description="只暴露当前阶段必须操作的信息，其余默认收起。"
              />
              <StackRow
                title="L4 创作者例外"
                description="调试、版本、参数结构只在 Creator Studio 展示。"
              />
            </div>
          </Panel>
        </section>

        <section className="grid grid-cols-1 gap-5 2xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <Panel title="色彩规范" icon={Palette}>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {COLOR_TOKENS.map((token) => (
                <div key={token.name} className="rounded-2xl border border-black/8 bg-[#FCFCFD] p-3">
                  <div
                    className="h-20 rounded-[18px] border border-black/8"
                    style={{ backgroundColor: token.value }}
                  />
                  <div className="mt-3 space-y-1">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-[#1A1A1A]">{token.name}</p>
                      <span className="font-mono text-[11px] text-black/42">{token.value}</span>
                    </div>
                    <p className="text-xs leading-5 text-black/48">{token.note}</p>
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="字体规范" icon={Type}>
            <div className="space-y-4">
              {TYPE_TOKENS.map((token) => (
                <div key={token.label} className="rounded-2xl border border-black/8 bg-[#FCFCFD] px-4 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="rounded-full bg-[#F2F0ED] px-2.5 py-1 text-[11px] font-semibold text-black/50">
                      {token.label}
                    </span>
                    <span className="text-[11px] text-black/35">统一字重，不靠过多颜色制造层级</span>
                  </div>
                  <p className={`mt-3 ${token.className}`}>{token.sample}</p>
                </div>
              ))}
            </div>
          </Panel>
        </section>

        <Panel title="组件预览" icon={PlaySquare}>
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <div className="space-y-4">
              <SpecCard title="按钮 / 标签 / 状态">
                <div className="flex flex-wrap gap-3">
                  <button className="h-11 rounded-2xl bg-black px-5 text-sm font-semibold text-white">
                    立即生成
                  </button>
                  <button className="h-11 rounded-2xl border border-black/12 bg-white px-5 text-sm font-semibold text-black/72">
                    查看依据
                  </button>
                  <span className="inline-flex h-11 items-center rounded-2xl bg-[#F2F0ED] px-4 text-sm font-semibold text-black/55">
                    9:16 竖版
                  </span>
                  <span className="inline-flex h-11 items-center rounded-2xl bg-[#EAF6F4] px-4 text-sm font-semibold text-[#0F766E]">
                    Hermes 已连接
                  </span>
                </div>
              </SpecCard>

              <SpecCard title="输入类组件">
                <div className="space-y-3">
                  <div className="rounded-[24px] border border-dashed border-black/12 bg-[radial-gradient(circle_at_top,#FAF3EA,transparent_70%)] p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm">
                        <Palette className="h-5 w-5 text-black/55" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-base font-semibold text-[#1A1A1A]">产品图</p>
                        <p className="text-sm text-black/45">点击上传 JPG / PNG / WebP</p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-black/10 bg-[#FCFCFD] px-4 py-3 text-sm text-black/78">
                    补水不黏腻，夏天通勤 10 秒上脸就能出门。
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {['抖音', '小红书', '视频号'].map((label, index) => (
                      <button
                        key={label}
                        className={`rounded-2xl px-4 py-2.5 text-sm font-semibold ${
                          index === 0 ? 'bg-black text-white' : 'bg-[#F7F7F8] text-black/55'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </SpecCard>
            </div>

            <div className="space-y-4">
              <SpecCard title="结果类组件">
                <div className="grid gap-3 lg:grid-cols-[240px_minmax(0,1fr)]">
                  <div className="rounded-[28px] bg-[#111214] p-3 shadow-[0_24px_60px_rgba(0,0,0,0.14)]">
                    <div className="aspect-[9/16] rounded-[20px] bg-[linear-gradient(180deg,#ECD8C2_0%,#C5D7E7_55%,#8A9AA8_100%)]" />
                  </div>
                  <div className="space-y-3">
                    <div className="rounded-2xl border border-black/8 bg-[#FCFCFD] p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-black/40">主结果</p>
                      <h3 className="mt-2 text-lg font-semibold text-[#1A1A1A]">10 秒竖版样片预览</h3>
                      <p className="mt-1 text-sm leading-6 text-black/55">
                        默认把最想看的内容放在中间，脚本、依据、过程不抢第一屏注意力。
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {['换一种更像真人的表达', '更强调卖点', '改成人设更自然'].map((chip) => (
                        <button
                          key={chip}
                          className="rounded-full bg-[#F7F7F8] px-3 py-1.5 text-xs text-black/58"
                        >
                          {chip}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </SpecCard>

              <SpecCard title="右栏摘要组件">
                <div className="space-y-3">
                  <RightRailRow label="交付内容" value="sample-video.mp4 / cover-frame.png" />
                  <RightRailRow label="任务状态" value="等待用户确认后进入高成本视频生成" />
                  <RightRailRow label="展开入口" value="查看脚本依据 / 查看分镜 / 查看执行日志" muted />
                </div>
              </SpecCard>
            </div>
          </div>
        </Panel>

        <Panel title="完整三栏布局示意" icon={Columns3}>
          <div className="rounded-[30px] border border-black/8 bg-[#EEF1F4] p-3 sm:p-4">
            <div className="grid gap-4 xl:grid-cols-[300px_minmax(0,1fr)_320px]">
              <div className="rounded-[26px] border border-black/8 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-black/38">Left</p>
                    <h3 className="mt-1 text-lg font-semibold text-[#1A1A1A]">最少输入</h3>
                  </div>
                  <span className="rounded-full bg-[#F2F0ED] px-2.5 py-1 text-[11px] text-black/45">必须项</span>
                </div>
                <div className="space-y-3">
                  <MiniInput label="产品图" />
                  <MiniInput label="人物图 / 模特图" />
                  <MiniTextBlock title="一句话卖点" body="补水不黏腻，适合夏天通勤 10 秒快速上脸。" />
                  <div className="grid grid-cols-3 gap-2">
                    {['抖音', '小红书', '视频号'].map((item, index) => (
                      <span
                        key={item}
                        className={`rounded-2xl px-3 py-2 text-center text-xs font-semibold ${
                          index === 0 ? 'bg-black text-white' : 'bg-[#F7F7F8] text-black/55'
                        }`}
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                  <button className="mt-2 h-12 w-full rounded-2xl bg-black text-sm font-semibold text-white">
                    生成样片
                  </button>
                </div>
              </div>

              <div className="rounded-[26px] border border-black/8 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-black/38">Center</p>
                    <h3 className="mt-1 text-lg font-semibold text-[#1A1A1A]">结果优先</h3>
                  </div>
                  <button className="inline-flex items-center gap-2 rounded-2xl border border-black/10 px-4 py-2 text-xs font-semibold text-black/58">
                    查看更多结果
                    <ChevronsRight className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
                  <div className="rounded-[28px] bg-[#111214] p-3 shadow-[0_24px_60px_rgba(0,0,0,0.16)]">
                    <div className="relative aspect-[9/16] overflow-hidden rounded-[20px] bg-[linear-gradient(180deg,#F2D8C4_0%,#D0DCEC_58%,#899AA8_100%)]">
                      <div className="absolute inset-x-4 top-4 flex justify-between text-[10px] text-white/75">
                        <span>UGC Sample</span>
                        <span>00:10</span>
                      </div>
                      <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/45 to-transparent" />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="rounded-2xl border border-black/8 bg-[#FCFCFD] p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-black/38">你会先看到</p>
                      <h4 className="mt-2 text-lg font-semibold text-[#1A1A1A]">样片效果、封面气质、表达方向</h4>
                      <p className="mt-2 text-sm leading-6 text-black/55">
                        中间栏只承接结果和轻量纠偏，不承接重配置，不承接日志面板。
                      </p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <PreviewMetric label="更像真人种草" value="默认风格" />
                      <PreviewMetric label="10 秒" value="样片时长" />
                      <PreviewMetric label="9:16" value="交付比例" />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {['换一种开场', '卖点再强一点', '更像测评讲解'].map((item) => (
                        <button
                          key={item}
                          className="rounded-full bg-[#F7F7F8] px-3 py-1.5 text-xs text-black/58"
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-[26px] border border-black/8 bg-white p-5 shadow-sm">
                <div className="mb-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-black/38">Right</p>
                  <h3 className="mt-1 text-lg font-semibold text-[#1A1A1A]">状态与交付</h3>
                </div>
                <div className="space-y-3">
                  <div className="rounded-2xl bg-[#F7F7F8] p-4">
                    <p className="text-xs text-black/40">当前状态</p>
                    <p className="mt-1 text-sm font-semibold text-[#0F766E]">等待确认后进入正式视频生成</p>
                  </div>
                  <RightRailRow label="交付文件" value="sample-video.mp4" />
                  <RightRailRow label="封面图" value="cover-frame.png" />
                  <RightRailRow label="脚本说明" value="默认收起，用户主动点开才显示" muted />
                  <RightRailRow label="成本提醒" value="高成本步骤只在确认节点显示" muted />
                </div>
              </div>
            </div>
          </div>
        </Panel>

        <section className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <Panel title="这套规范优先落地到哪里" icon={PackageCheck}>
            <div className="grid gap-3 sm:grid-cols-2">
              <LandingCard
                title="/app/agents/media"
                description="普通用户 UGC 生成工作台。先收敛输入，再突出中间样片结果。"
              />
              <LandingCard
                title="/app/tasks/:id"
                description="任务交付页。默认看样片和交付，日志与脚本过程按需展开。"
              />
              <LandingCard
                title="/app/studio"
                description="Creator 继续保留更多配置能力，但页面规范仍沿用前台视觉语言。"
              />
              <LandingCard
                title="/connect-hermes"
                description="只保留安装 / 打开 / 配对的最短链路，不在浮层里讲过多概念。"
              />
            </div>
          </Panel>

          <Panel title="下一步" icon={ChevronsRight}>
            <div className="space-y-3">
              <div className="rounded-2xl border border-black/8 bg-[#FCFCFD] p-4">
                <p className="text-sm font-semibold text-[#1A1A1A]">如果这页方向确认</p>
                <p className="mt-1 text-sm leading-6 text-black/55">
                  下一步就按这套规范，开始真实收敛 UGC 前台页面和任务交付页，不再零散改细节。
                </p>
              </div>
              <Link
                to="/app/studio"
                className="inline-flex h-11 items-center justify-center rounded-2xl border border-black/12 bg-white px-5 text-sm font-semibold text-black/72 hover:bg-[#F7F7F8]"
              >
                返回 Creator Studio
              </Link>
            </div>
          </Panel>
        </section>
      </div>
    </div>
  );
}

function Panel({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: typeof Palette;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[28px] border border-black/8 bg-white p-5 sm:p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F2F0ED] text-black/62">
          <Icon className="h-5 w-5" />
        </div>
        <h2 className="text-xl font-semibold text-[#1A1A1A]">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function SpecPill({
  icon: Icon,
  label,
  accent = false,
}: {
  icon: typeof Eye;
  label: string;
  accent?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${
        accent ? 'bg-[#EAF6F4] text-[#0F766E]' : 'bg-[#F2F0ED] text-black/60'
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </span>
  );
}

function StackRow({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-black/8 bg-[#FCFCFD] px-4 py-4">
      <p className="text-sm font-semibold text-[#1A1A1A]">{title}</p>
      <p className="mt-1 text-sm leading-6 text-black/55">{description}</p>
    </div>
  );
}

function SpecCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[24px] border border-black/8 bg-[#F7F7F8] p-4">
      <h3 className="text-base font-semibold text-[#1A1A1A]">{title}</h3>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function RightRailRow({
  label,
  value,
  muted = false,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-black/8 bg-[#FCFCFD] px-4 py-3">
      <p className="text-xs text-black/40">{label}</p>
      <p className={`mt-1 text-sm leading-6 ${muted ? 'text-black/48' : 'text-black/72'}`}>{value}</p>
    </div>
  );
}

function MiniInput({ label }: { label: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-black/12 bg-[radial-gradient(circle_at_top,#FAF3EA,transparent_70%)] px-4 py-4">
      <p className="text-sm font-semibold text-[#1A1A1A]">{label}</p>
      <p className="mt-1 text-xs text-black/42">点击上传</p>
    </div>
  );
}

function MiniTextBlock({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-black/10 bg-[#FCFCFD] px-4 py-3">
      <p className="text-xs text-black/40">{title}</p>
      <p className="mt-1 text-sm leading-6 text-black/72">{body}</p>
    </div>
  );
}

function PreviewMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-black/8 bg-[#FCFCFD] p-3">
      <p className="text-xs text-black/38">{label}</p>
      <p className="mt-1 text-sm font-semibold text-[#1A1A1A]">{value}</p>
    </div>
  );
}

function LandingCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-black/8 bg-[#FCFCFD] p-4">
      <p className="font-mono text-[12px] text-black/46">{title}</p>
      <p className="mt-2 text-sm leading-6 text-black/58">{description}</p>
    </div>
  );
}
