import { useState, useSyncExternalStore } from 'react';
import { Bug, ChevronUp, ChevronDown } from 'lucide-react';
import { applyDebugPlan, getUsage, subscribeUsage } from '../../lib/usageStore';
import { bumpAgentSlots, getOccupiedSlotCount, subscribeAgentSlots } from '../../lib/agentSlotStore';
import { DEBUG_PLAN_OPTIONS, getPlanEntitlements } from '../../lib/planEntitlements';
import { formatToken } from '../../lib/tokenBilling';

export default function PlanDebugPanel() {
  const [open, setOpen] = useState(false);

  const usage = useSyncExternalStore(subscribeUsage, getUsage, getUsage);
  useSyncExternalStore(subscribeAgentSlots, () => getOccupiedSlotCount(), () => 0);

  const plan = getPlanEntitlements(usage.planName);
  const occupied = getOccupiedSlotCount();

  const switchPlan = (name: (typeof DEBUG_PLAN_OPTIONS)[number]) => {
    applyDebugPlan(name);
    bumpAgentSlots();
  };

  return (
    <div className="p-3 border-t border-black/8 mt-auto">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-2 px-2 py-2 rounded-lg text-left hover:bg-[#F2F0ED] transition-colors"
      >
        <span className="flex items-center gap-2 text-[11px] font-bold text-black/55">
          <Bug className="w-3.5 h-3.5 text-amber-600" />
          套餐调试
        </span>
        {open ? (
          <ChevronDown className="w-3.5 h-3.5 text-black/35" />
        ) : (
          <ChevronUp className="w-3.5 h-3.5 text-black/35" />
        )}
      </button>

      {open && (
        <div className="mt-2 space-y-2.5 px-1">
          <div className="space-y-0.5 text-[10px] text-black/45 leading-relaxed">
            <p>
              当前 <span className="font-bold text-black">{usage.planName}</span>
            </p>
            <p>
              名额 {occupied}/{plan.enabledAgentLimit} · Token{' '}
              {formatToken(usage.tokenBalance)}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-1">
            {DEBUG_PLAN_OPTIONS.map((name) => {
              const ent = getPlanEntitlements(name);
              const active = usage.planName === name;
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => switchPlan(name)}
                  className={`px-1.5 py-1.5 rounded text-[10px] font-bold transition-colors ${
                    active
                      ? 'bg-black text-white'
                      : 'bg-[#F2F0ED] text-black/60 hover:bg-black/10 hover:text-black'
                  }`}
                  title={`${ent.enabledAgentLimit} 个智能体 · ${formatToken(ent.monthlyTokenLimit)} Token`}
                >
                  {name}
                </button>
              );
            })}
          </div>

          <p className="text-[9px] text-black/35 leading-relaxed">
            切换同步 Token 额度与名额上限；已启用智能体保留。
          </p>
        </div>
      )}
    </div>
  );
}
