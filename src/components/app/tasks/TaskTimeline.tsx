import type { TaskStep } from '../../../types/workbench';
import { Check, Circle, Loader2, X } from 'lucide-react';

interface TaskTimelineProps {
  steps: TaskStep[];
}

export default function TaskTimeline({ steps }: TaskTimelineProps) {
  return (
    <ol className="space-y-3">
      {steps.map((step, i) => (
        <li
          key={step.id}
          className={`flex gap-3 rounded-2xl border px-4 py-3 ${
            step.status === 'active'
              ? 'border-amber-200 bg-amber-50/70'
              : step.status === 'completed'
                ? 'border-emerald-200 bg-emerald-50/50'
                : step.status === 'failed'
                  ? 'border-red-200 bg-red-50/60'
                  : 'border-black/[0.05] bg-[#FCFCFD]'
          }`}
        >
          <div className="flex flex-col items-center">
            <StepIcon status={step.status} />
            {i < steps.length - 1 && (
              <div
                className={`my-1 min-h-6 w-px flex-1 ${
                  step.status === 'completed' ? 'bg-emerald-300' : 'bg-black/10'
                }`}
              />
            )}
          </div>
          <div className="min-w-0 pb-2">
            <p
              className={`text-sm font-medium ${
                step.status === 'active'
                  ? 'text-black'
                  : step.status === 'completed'
                    ? 'text-black/70'
                    : step.status === 'failed'
                      ? 'text-red-600'
                      : 'text-black/35'
              }`}
            >
              {step.name}
            </p>
            {step.status === 'active' && (
              <p className="text-[11px] text-black/45 mt-0.5">执行中…</p>
            )}
            {step.tokenUsed != null && step.tokenUsed > 0 && (
              <p className="text-[11px] font-mono text-black/40 mt-0.5">
                {step.tokenUsed.toLocaleString('zh-CN')} Token
              </p>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}

function StepIcon({ status }: { status: TaskStep['status'] }) {
  if (status === 'completed') {
    return (
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
        <Check className="w-3 h-3" />
      </span>
    );
  }
  if (status === 'active') {
    return (
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-amber-500 text-amber-700">
        <Loader2 className="w-3 h-3 animate-spin" />
      </span>
    );
  }
  if (status === 'failed') {
    return (
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-600 text-white">
        <X className="w-3 h-3" />
      </span>
    );
  }
  return (
    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-black/20 bg-white">
      <Circle className="w-2 h-2 text-black/20" />
    </span>
  );
}
