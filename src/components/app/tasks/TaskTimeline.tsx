import type { TaskStep } from '../../../types/workbench';
import { Check, Circle, Loader2, X } from 'lucide-react';

interface TaskTimelineProps {
  steps: TaskStep[];
}

export default function TaskTimeline({ steps }: TaskTimelineProps) {
  return (
    <ol className="space-y-0">
      {steps.map((step, i) => (
        <li key={step.id} className="flex gap-3">
          <div className="flex flex-col items-center">
            <StepIcon status={step.status} />
            {i < steps.length - 1 && (
              <div
                className={`w-px flex-1 min-h-6 my-1 ${
                  step.status === 'completed' ? 'bg-black/30' : 'bg-black/10'
                }`}
              />
            )}
          </div>
          <div className="pb-5 min-w-0">
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
          </div>
        </li>
      ))}
    </ol>
  );
}

function StepIcon({ status }: { status: TaskStep['status'] }) {
  if (status === 'completed') {
    return (
      <span className="w-5 h-5 bg-black text-white flex items-center justify-center shrink-0">
        <Check className="w-3 h-3" />
      </span>
    );
  }
  if (status === 'active') {
    return (
      <span className="w-5 h-5 border-2 border-black flex items-center justify-center shrink-0">
        <Loader2 className="w-3 h-3 animate-spin" />
      </span>
    );
  }
  if (status === 'failed') {
    return (
      <span className="w-5 h-5 bg-red-600 text-white flex items-center justify-center shrink-0">
        <X className="w-3 h-3" />
      </span>
    );
  }
  return (
    <span className="w-5 h-5 border border-black/20 flex items-center justify-center shrink-0">
      <Circle className="w-2 h-2 text-black/20" />
    </span>
  );
}
