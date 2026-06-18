import { useEffect, useState, useSyncExternalStore } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Link2, Search } from 'lucide-react';
import { getAgentById } from '../../data/agentsCatalog';
import type { AgentEntryState } from '../../types/agentNavigation';
import { DEFAULT_AGENT_RETURN_PATH } from '../../types/agentNavigation';
import {
  getHermesConnection,
  refreshHermesConnection,
  subscribeHermesConnection,
} from '../../lib/hermesConnection';
import HermesActionModal from '../../components/app/HermesActionModal';

const MODELS = ['豆包', 'DeepSeek', '腾讯元宝', 'Kimi', '文心一言', 'Qwen', '智谱', 'MiniMax'];

export default function GeoAgentPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const entry = (location.state as AgentEntryState | null) ?? {};
  const agent = getAgentById(entry.agentId ?? 'geo');
  const agentName = agent?.name ?? 'GEO 智能体';
  const returnPath = entry.from ?? DEFAULT_AGENT_RETURN_PATH;

  const [executionCollapsed, setExecutionCollapsed] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [runProgress, setRunProgress] = useState(10);
  const [showHermesModal, setShowHermesModal] = useState(false);
  const hermes = useSyncExternalStore(
    subscribeHermesConnection,
    getHermesConnection,
    getHermesConnection,
  );

  useEffect(() => {
    setIsRunning(false);
    setRunProgress(10);
    setExecutionCollapsed(false);
  }, []);

  useEffect(() => {
    if (!isRunning) {
      return;
    }
    const timer = window.setInterval(() => {
      setRunProgress((prev) => Math.min(98, prev + (prev < 40 ? 8 : prev < 70 ? 5 : 2)));
    }, 1800);
    return () => window.clearInterval(timer);
  }, [isRunning]);

  return (
    <div className="min-h-full bg-white">
      <div className="p-4 sm:p-6 lg:p-8 w-full">
        <div className="relative grid gap-4 lg:grid-cols-[188px_minmax(0,1fr)]">
          <aside className="hidden lg:flex flex-col bg-[#EEF1F3] border border-black/8 rounded-2xl p-3">
            <button
              type="button"
              className="w-full h-9 rounded-lg bg-[#14958A] text-white text-xs font-semibold hover:bg-[#128278]"
            >
              + 快速发起
            </button>
            <nav className="mt-3 space-y-1">
              {['工作台', '品牌管理', 'GEO 分析', 'GEO 监控', '积分与账户', '内容文件', 'Hz-Hermes 日志'].map(
                (item) => (
                  <button
                    key={item}
                    type="button"
                    className={`w-full text-left px-3 py-2 rounded-md text-xs ${
                      item === 'GEO 分析'
                        ? 'bg-white text-black/90 font-semibold'
                        : 'text-black/55 hover:bg-white/70'
                    }`}
                  >
                    {item}
                  </button>
                ),
              )}
            </nav>
          </aside>

          <div
            className={`grid gap-4 ${
              isRunning
                ? executionCollapsed
                  ? 'lg:grid-cols-[minmax(0,1fr)_56px]'
                  : 'lg:grid-cols-[minmax(0,1fr)_320px] 2xl:grid-cols-[minmax(0,1fr)_360px]'
                : 'grid-cols-1'
            }`}
          >
            <div className="space-y-4 min-w-0">
            <section className="bg-white border border-black/8 rounded-2xl p-4 md:p-5">
            <div className="flex items-center gap-2">
              <button className="px-3 py-1.5 text-xs rounded-lg bg-[#EEF5FF] text-[#3971C6] font-semibold">
                快速检测
              </button>
              <button className="px-3 py-1.5 text-xs rounded-lg text-black/50 hover:bg-black/[0.03]">深度分析</button>
            </div>

            <div className="mt-3">
              <h2 className="text-[28px] leading-none font-semibold tracking-tight text-black/85">GEO 快速检测</h2>
              <p className="mt-2 text-sm text-black/45">补齐品牌资料后即可提交，检测 AI 平台提及与内容缺口。</p>
            </div>

            <div className="mt-5 grid md:grid-cols-2 gap-3">
              <Field label="品牌名称 *" value="UU教育" hint="4/20" />
              <Field label="城市 / 目标市场 *" value="北京市/通州区" />
              <Field label="产品 / 服务 *" value="UU教育; UU教育怎么样, UU教育靠谱吗, UU考研" hint="300/300" />
              <Field label="官网 URL（可选）" value="https://www.example.com" />
            </div>

            <p className="mt-2 text-[11px] text-[#14958A] font-medium">
              本次检测引用：{agentName}（切换请使用顶部品牌选择器）
            </p>

            <section className="mt-4 rounded-xl bg-[#F7F8FA] border border-black/6 p-3">
              <h3 className="text-sm font-semibold text-black/80">输入材料 *</h3>
              <p className="mt-1 text-xs text-black/35">至少填写官网、一条参考链接或补充说明中的一项。</p>

              <div className="mt-3 rounded-xl bg-white border border-black/8 p-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-black/60">参考链接</p>
                  <p className="text-[11px] text-black/35">已添加 0/10 条</p>
                </div>
                <div className="mt-2 flex gap-2">
                  <div className="flex-1 min-w-0 h-10 border border-black/10 rounded-lg px-3 flex items-center gap-2 text-black/35 text-sm">
                    <Link2 className="w-4 h-4" />
                    粘贴文章、竞品或发布内容链接
                  </div>
                  <button
                    type="button"
                    className="w-[92px] h-10 border border-black/10 rounded-lg text-sm text-black/45 hover:bg-black/[0.02]"
                  >
                    + 添加
                  </button>
                </div>
              </div>

              <div className="mt-3 rounded-xl bg-white border border-black/8 p-3">
                <p className="text-xs font-medium text-black/60">补充说明</p>
                <div className="mt-2 rounded-lg border border-black/10 bg-[#FCFCFD] px-3 py-2 text-sm text-black/70 leading-relaxed min-h-[96px]">
                  UU教育(北京鸿途优学教育科技有限公司)创立于2015年，总部位于北京市通州区，是一家以法律职业资格、注册会计师为核心，
                  覆盖医药、建筑、考研、财会等多领域的互联网职业教育平台，提供直播课程、在线精品课、真机模拟、学管师陪学等服务。
                </div>
                <p className="mt-1 text-right text-[11px] text-black/30">136/300 字</p>
              </div>
            </section>

            <section className="mt-4">
              <p className="text-sm font-medium text-black/70">目标平台</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {MODELS.map((model) => (
                  <button
                    key={model}
                    type="button"
                    className={`px-3 py-1.5 rounded-full text-xs border ${
                      model === '豆包' || model === '腾讯元宝' || model === 'Kimi'
                        ? 'border-[#14958A]/35 text-[#14958A] bg-[#EAF6F4]'
                        : 'border-black/10 text-black/55 bg-white'
                    }`}
                  >
                    {model}
                  </button>
                ))}
              </div>
            </section>
            </section>

            <ExecutionPanel
              collapsed={false}
              onToggle={() => {}}
              onExecute={() => {
                if (hermes.status !== 'connected') {
                  setShowHermesModal(true);
                  return;
                }
                setIsRunning(true);
                setRunProgress(10);
              }}
              forceExpanded={isRunning}
              disableExecute={isRunning}
            />
          </div>

            {isRunning && !executionCollapsed ? (
              <RunningSidePanel
                onCollapse={() => setExecutionCollapsed(true)}
                progress={runProgress}
                onOpenTask={() => navigate('/app/tasks?agent=geo')}
                onOpenAll={() => navigate('/app/tasks')}
                onBack={() => setIsRunning(false)}
              />
            ) : null}

            {isRunning && executionCollapsed ? (
              <aside className="hidden lg:flex flex-col items-center shrink-0 w-14 min-w-[56px]">
                <button
                  type="button"
                  onClick={() => setExecutionCollapsed(false)}
                  className="sticky top-24 w-10 h-10 rounded-xl border border-black/12 bg-white hover:bg-black/[0.02] flex items-center justify-center shadow-sm"
                  aria-label="展开执行面板"
                  title="展开执行面板"
                >
                  <ChevronLeft className="w-4 h-4 text-black/55" />
                </button>
              </aside>
            ) : null}
          </div>
        </div>
        {showHermesModal && (
          <HermesActionModal
            status={hermes.status}
            onClose={() => setShowHermesModal(false)}
            onOpenHermes={refreshHermesConnection}
            onGoPair={() => {
              setShowHermesModal(false);
              navigate('/app');
            }}
          />
        )}
      </div>
    </div>
  );
}

function Field({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div>
      <p className="text-sm text-black/65 mb-1.5">{label}</p>
      <div className="h-11 rounded-lg border border-black/10 bg-white px-3 flex items-center justify-between gap-3">
        <span className="text-sm text-black/75 truncate">{value}</span>
        {hint && <span className="text-[11px] text-black/30 shrink-0">{hint}</span>}
      </div>
    </div>
  );
}

function ExecutionPanel({
  collapsed,
  onToggle,
  onExecute,
  forceExpanded = false,
  disableExecute = false,
}: {
  collapsed: boolean;
  onToggle: () => void;
  onExecute: () => void;
  forceExpanded?: boolean;
  disableExecute?: boolean;
}) {
  const actualCollapsed = forceExpanded ? false : collapsed;

  if (actualCollapsed) {
    return (
      <aside className="bg-white border border-black/8 rounded-2xl p-2">
        <div className="flex flex-col items-center">
          <button
            type="button"
            onClick={onToggle}
            className="w-8 h-8 rounded-md border border-black/10 hover:bg-black/[0.02] flex items-center justify-center"
            aria-label="展开执行面板"
          >
            <ChevronLeft className="w-4 h-4 text-black/55" />
          </button>
          <span className="-rotate-90 mt-6 text-[10px] text-black/35 whitespace-nowrap">执行</span>
        </div>
      </aside>
    );
  }

  return (
    <aside className="bg-white border border-black/8 rounded-2xl p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-[28px] leading-none font-semibold tracking-tight text-black/85">AI 拆解方案</h3>
        {!forceExpanded && (
          <button
            type="button"
            onClick={onToggle}
            className="w-8 h-8 rounded-md border border-black/10 hover:bg-black/[0.02] flex items-center justify-center"
            aria-label="收起执行面板"
          >
            <ChevronRight className="w-4 h-4 text-black/55" />
          </button>
        )}
      </div>
      <p className="mt-2 text-sm text-black/45">资料已齐，可提交 Hz-Hermes 分析</p>

      <div className="mt-4 space-y-2">
        {['品牌名称', '城市/目标市场', '产品/服务', '官网，链接或补充材料'].map((row) => (
          <div key={row} className="h-10 px-3 rounded-lg bg-[#EAF6F4] border border-[#14958A]/18 flex items-center justify-between">
            <span className="text-sm text-black/60">{row}</span>
            <span className="text-xs text-[#14958A] font-semibold">已填</span>
          </div>
        ))}
      </div>

      <section className="mt-4">
        <p className="text-sm font-semibold text-black/75">分析模式</p>
        <div className="mt-2 rounded-xl border border-[#3B82F6]/20 bg-[#F3F7FF] px-3 py-2">
          <p className="text-xl font-semibold leading-none text-black/85">快速检测</p>
          <p className="mt-1 text-xs text-black/45">平台提及与内容缺口，适合首次体检</p>
        </div>
      </section>

      <section className="mt-4 rounded-xl bg-[#F7F8FA] p-3 border border-black/6">
        <p className="text-sm text-black/45">AI 分析项</p>
        <p className="mt-1 text-3xl leading-none font-semibold text-black/85">12 条</p>
      </section>

      <section className="mt-4">
        <p className="text-sm font-semibold text-black/75">将执行</p>
        <div className="mt-2 space-y-1.5 text-sm text-black/50">
          <p className="flex items-center gap-1.5">
            <Search className="w-3.5 h-3.5" />
            平台提及巡检
          </p>
          <p className="flex items-center gap-1.5">
            <Search className="w-3.5 h-3.5" />
            内容可引用性快检
          </p>
        </div>
      </section>

      <section className="mt-4 rounded-xl bg-white border border-black/10 p-3">
        <p className="text-sm font-semibold text-black/75">预计产物</p>
        <ul className="mt-2 text-sm text-black/50 space-y-1">
          <li>· AI 平台提及巡检摘要</li>
          <li>· 内容缺口与优先修复建议</li>
        </ul>
        <button type="button" className="mt-2 text-sm text-[#14958A] font-semibold hover:underline">
          查看任务详情
        </button>
      </section>

      <button
        type="button"
        onClick={onExecute}
        disabled={disableExecute}
        className="mt-5 w-full h-11 rounded-xl bg-[#87D1C8] hover:bg-[#6fc7bc] disabled:bg-black/10 disabled:text-black/35 text-white text-lg font-semibold"
      >
        提交 Hz-Hermes 快速检测
      </button>
    </aside>
  );
}

function RunningSidePanel({
  onCollapse,
  progress,
  onOpenTask,
  onOpenAll,
  onBack,
}: {
  onCollapse: () => void;
  progress: number;
  onOpenTask: () => void;
  onOpenAll: () => void;
  onBack: () => void;
}) {
  return (
    <aside className="bg-[#F5F6F8] border border-black/10 rounded-2xl p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 rounded-full border-2 border-[#14958A] border-t-transparent animate-spin" />
          <h3 className="text-xl font-semibold text-black/85">Hz-Hermes 正在执行</h3>
        </div>
        <button
          type="button"
          onClick={onCollapse}
          className="w-8 h-8 rounded-md border border-black/10 hover:bg-white flex items-center justify-center"
          aria-label="收起执行面板"
        >
          <ChevronRight className="w-4 h-4 text-black/55" />
        </button>
      </div>
      <p className="mt-2 text-sm text-black/50">已创建任务： UU教育 · GEO 快速检测</p>
      <p className="mt-2 text-sm text-black/60">进度 {progress}%</p>
      <p className="mt-1 text-sm text-black/45">
        任务处理中，完成前暂无法提交新任务。可前往结果中心查看进度，完成后我们会通知你。
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onOpenTask}
          className="px-4 h-9 rounded-lg bg-[#14958A] text-white text-sm font-semibold hover:bg-[#128278]"
        >
          查看本任务分进度
        </button>
        <button
          type="button"
          onClick={onOpenAll}
          className="px-4 h-9 rounded-lg bg-white border border-black/12 text-sm font-medium hover:bg-black/[0.02]"
        >
          全部任务
        </button>
        <button
          type="button"
          onClick={onBack}
          className="px-4 h-9 rounded-lg bg-white border border-black/12 text-sm font-medium hover:bg-black/[0.02]"
        >
          返回工作台
        </button>
      </div>
    </aside>
  );
}
