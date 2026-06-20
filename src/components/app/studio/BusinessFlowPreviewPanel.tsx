import { useMemo, useState } from 'react';
import { Film, Layers3, PlayCircle, Sparkles } from 'lucide-react';
import { buildEngineSteps, type BusinessScenario, type CustomerType } from '../../../lib/creatorStudio';

type PreviewMode = 'storefront' | 'engine';

export default function BusinessFlowPreviewPanel({
  mode,
  customerType,
  scenario,
  instruction,
}: {
  mode: 'create' | 'edit';
  customerType: CustomerType;
  scenario: BusinessScenario;
  instruction?: string;
}) {
  const [previewMode, setPreviewMode] = useState<PreviewMode>(mode === 'create' ? 'engine' : 'storefront');
  const engineSteps = useMemo(() => buildEngineSteps(scenario), [scenario]);

  return (
    <section className="rounded-[28px] border border-black/[0.06] bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.16em] text-black/35">
            {mode === 'create' ? '前台形态示例' : '当前用户端页面'}
          </p>
          <h2 className="mt-2 text-xl font-semibold text-[#1A1A1A]">
            {previewMode === 'engine' ? '引擎工作流' : mode === 'create' ? '参考页面结构' : '真实页面与案例'}
          </h2>
          <p className="mt-1 text-sm text-black/45">
            {mode === 'create'
              ? '基于当前业务参数匹配的参考形态，不代表最终生成结果'
              : '这里展示当前真实前台页，以及本次修改会影响到的可视区域'}
          </p>
        </div>

        <div className="inline-flex rounded-2xl border border-black/[0.08] bg-[#F7F7F8] p-1">
          <SegmentButton active={previewMode === 'storefront'} onClick={() => setPreviewMode('storefront')}>
            前台 UI 预览
          </SegmentButton>
          <SegmentButton active={previewMode === 'engine'} onClick={() => setPreviewMode('engine')}>
            引擎工作流
          </SegmentButton>
        </div>
      </div>

      <div className="mt-5">
        {previewMode === 'engine' ? (
          <EnginePreview mode={mode} customerType={customerType} scenario={scenario} steps={engineSteps} />
        ) : (
          <StorefrontPreview mode={mode} customerType={customerType} scenario={scenario} instruction={instruction} />
        )}
      </div>
    </section>
  );
}

function SegmentButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl px-3 py-2 text-sm transition-colors ${
        active ? 'bg-black text-white shadow-sm' : 'text-black/55'
      }`}
    >
      {children}
    </button>
  );
}

function EnginePreview({
  mode,
  customerType,
  scenario,
  steps,
}: {
  mode: 'create' | 'edit';
  customerType: CustomerType;
  scenario: BusinessScenario;
  steps: string[];
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-[24px] border border-black/[0.06] bg-[#FCFCFD] p-5">
        <div className="flex items-center gap-2 text-[#0F766E]">
          <Layers3 className="h-4 w-4" />
          <p className="text-sm font-semibold">{customerType} · {scenario}</p>
        </div>
        <div className="mt-4 space-y-3">
          {steps.map((step, index) => (
            <div
              key={step}
              className="flex items-start gap-3 rounded-2xl border border-black/[0.05] bg-white px-4 py-4"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#EAF6F4] text-xs font-semibold text-[#0F766E]">
                {index + 1}
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-semibold text-[#1A1A1A]">{step}</p>
                <p className="text-xs leading-5 text-black/45">
                  {index === 3 ? '高配视频生成 · 预计 50-100 Token' : mode === 'create' ? '系统根据业务参数自动组织这一阶段' : '当前智能体已包含该阶段逻辑'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {['默认执行链路', '确认节点', '交付整理方式'].map((item) => (
          <div key={item} className="rounded-2xl border border-black/[0.05] bg-white px-4 py-4 text-center text-sm text-black/55">
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}

function StorefrontPreview({
  mode,
  customerType,
  scenario,
  instruction,
}: {
  mode: 'create' | 'edit';
  customerType: CustomerType;
  scenario: BusinessScenario;
  instruction?: string;
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-[24px] border border-black/[0.06] bg-[#FCFCFD] p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#EAF6F4] px-3 py-1 text-[11px] font-semibold text-[#0F766E]">
            {mode === 'create' ? <Sparkles className="h-3.5 w-3.5" /> : <Film className="h-3.5 w-3.5" />}
            {mode === 'create' ? '示例形态' : '真实前台页'}
          </div>
          {mode === 'edit' ? (
            <span className="rounded-full bg-black px-3 py-1 text-[11px] text-white">当前正在优化结果展示区</span>
          ) : null}
        </div>

        <div className="mt-4 rounded-[24px] border border-black/[0.08] bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-lg font-semibold text-[#1A1A1A]">{scenario}视频智能体</p>
              <p className="mt-1 text-sm text-black/45">{customerType} · {scenario}</p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-[#F5F6F8] px-3 py-1 text-[11px] text-black/55">
              <PlayCircle className="h-3.5 w-3.5" />
              10 秒样片
            </div>
          </div>

          <div className="mt-4 rounded-2xl bg-[linear-gradient(135deg,#F6FAF9_0%,#F7F2EA_100%)] p-5">
            <p className="text-2xl font-bold leading-tight text-[#1A1A1A]">
              {scenario === '设备演示' ? '让设备实力\n被客户看见' : '发现属于你的\n好店时光'}
            </p>
            <p className="mt-3 text-sm leading-6 text-black/55">
              {mode === 'create'
                ? '这是系统根据当前业务参数匹配出的参考前台页面结构。'
                : instruction?.trim() || '这里会随你的修改指令更新结果展示文案与视觉排序。'}
            </p>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-black/55">
            <div className="rounded-2xl border border-black/[0.05] bg-[#FCFCFD] px-4 py-3">标题区</div>
            <div className="rounded-2xl border border-black/[0.05] bg-[#FCFCFD] px-4 py-3">用户输入区</div>
            <div className={`rounded-2xl border px-4 py-3 ${mode === 'edit' ? 'border-[#0F766E]/25 bg-[#EAF6F4]' : 'border-black/[0.05] bg-[#FCFCFD]'}`}>结果展示区</div>
            <div className="rounded-2xl border border-black/[0.05] bg-[#FCFCFD] px-4 py-3">交付说明区</div>
          </div>
        </div>
      </div>

      <div className="rounded-[24px] border border-black/[0.06] bg-white p-4">
        <p className="text-sm font-semibold text-[#1A1A1A]">{mode === 'create' ? '参考案例' : '真实案例'}</p>
        <div className="mt-3 grid grid-cols-3 gap-3">
          {['案例 A', '案例 B', '案例 C'].map((item) => (
            <div key={item} className="overflow-hidden rounded-2xl border border-black/[0.05] bg-[#FCFCFD]">
              <div className="aspect-[4/5] bg-[linear-gradient(180deg,#D8E9E5_0%,#EADDCB_100%)]" />
              <div className="px-3 py-3 text-xs text-black/55">{item}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
