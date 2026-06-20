import type { ReactNode } from 'react';
import type { SkillBusinessFrame } from '../../../types/skills';

export default function BusinessFrameEditor({
  value,
  onChange,
}: {
  value: SkillBusinessFrame;
  onChange: (next: SkillBusinessFrame) => void;
}) {
  const update = (patch: Partial<SkillBusinessFrame>) => {
    onChange({
      ...value,
      ...patch,
    });
  };

  return (
    <div className="space-y-4">
      <Section title="目标">
        <TextField
          label="一句话目标"
          value={value.goal.summary}
          onChange={(next) =>
            update({
              goal: {
                ...value.goal,
                summary: next,
              },
            })
          }
          multiline
        />
        <TagField
          label="适用场景"
          value={value.goal.scenarios}
          onChange={(scenarios) =>
            update({
              goal: {
                ...value.goal,
                scenarios,
              },
            })
          }
        />
      </Section>

      <Section title="预算">
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <SelectField
            label="默认预算档"
            value={value.budget.defaultTier}
            options={[
              { label: '基础', value: 'basic' },
              { label: '标准', value: 'standard' },
              { label: '高配', value: 'premium' },
            ]}
            onChange={(defaultTier) =>
              update({
                budget: {
                  ...value.budget,
                  defaultTier: defaultTier as SkillBusinessFrame['budget']['defaultTier'],
                },
              })
            }
          />
          <ToggleField
            label="需要确认后继续"
            checked={value.budget.confirmationRequired}
            onChange={(confirmationRequired) =>
              update({
                budget: {
                  ...value.budget,
                  confirmationRequired,
                },
              })
            }
          />
        </div>
        <TextField
          label="预算说明"
          value={value.budget.notes}
          onChange={(notes) =>
            update({
              budget: {
                ...value.budget,
                notes,
              },
            })
          }
          multiline
        />
      </Section>

      <Section title="执行方案">
        <div className="space-y-2">
          {value.executionPlan.stages.map((stage, index) => (
            <div
              key={stage.id}
              className="grid grid-cols-1 gap-3 rounded-2xl border border-black/[0.06] bg-[#FCFCFD] p-4 xl:grid-cols-[minmax(0,1fr)_140px]"
            >
              <TextField
                label={`阶段 ${index + 1}`}
                value={stage.label}
                onChange={(label) =>
                  update({
                    executionPlan: {
                      stages: value.executionPlan.stages.map((item) =>
                        item.id === stage.id ? { ...item, label } : item,
                      ),
                    },
                  })
                }
              />
              <SelectField
                label="类型"
                value={stage.kind}
                options={[
                  { label: '自动推进', value: 'auto' },
                  { label: '确认节点', value: 'confirm' },
                ]}
                onChange={(kind) =>
                  update({
                    executionPlan: {
                      stages: value.executionPlan.stages.map((item) =>
                        item.id === stage.id
                          ? { ...item, kind: kind as SkillBusinessFrame['executionPlan']['stages'][number]['kind'] }
                          : item,
                      ),
                    },
                  })
                }
              />
            </div>
          ))}
        </div>
      </Section>

      <Section title="结果">
        <TextField
          label="结果承诺"
          value={value.result.promiseLine}
          onChange={(promiseLine) =>
            update({
              result: {
                ...value.result,
                promiseLine,
              },
            })
          }
          multiline
        />
        <TagField
          label="交付标签"
          value={value.result.deliveryLabels}
          onChange={(deliveryLabels) =>
            update({
              result: {
                ...value.result,
                deliveryLabels,
              },
            })
          }
        />
        <TextField
          label="案例提示"
          value={value.result.showcaseHint}
          onChange={(showcaseHint) =>
            update({
              result: {
                ...value.result,
                showcaseHint,
              },
            })
          }
          multiline
        />
      </Section>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-[24px] border border-black/[0.06] bg-white p-5">
      <h4 className="text-base font-semibold text-[#1A1A1A]">{title}</h4>
      <div className="mt-4 space-y-4">{children}</div>
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  multiline = false,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  multiline?: boolean;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-xs text-black/40">{label}</span>
      {multiline ? (
        <textarea
          rows={3}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full rounded-2xl border border-black/10 bg-[#FCFCFD] px-4 py-3 text-sm text-black outline-none focus:ring-1 focus:ring-black/20"
        />
      ) : (
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full rounded-2xl border border-black/10 bg-[#FCFCFD] px-4 py-3 text-sm text-black outline-none focus:ring-1 focus:ring-black/20"
        />
      )}
    </label>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<{ label: string; value: string }>;
  onChange: (next: string) => void;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-xs text-black/40">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-2xl border border-black/10 bg-[#FCFCFD] px-4 text-sm text-black outline-none focus:ring-1 focus:ring-black/20"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function ToggleField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <label className="flex h-11 items-center justify-between rounded-2xl border border-black/10 bg-[#FCFCFD] px-4">
      <span className="text-sm text-black/70">{label}</span>
      <button
        type="button"
        aria-pressed={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 rounded-full transition-colors ${checked ? 'bg-black' : 'bg-black/12'}`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${checked ? 'translate-x-[22px]' : 'translate-x-0.5'}`}
        />
      </button>
    </label>
  );
}

function TagField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string[];
  onChange: (next: string[]) => void;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-xs text-black/40">{label}</span>
      <input
        value={value.join(' / ')}
        onChange={(event) =>
          onChange(
            event.target.value
              .split('/')
              .map((item) => item.trim())
              .filter(Boolean),
          )
        }
        className="w-full rounded-2xl border border-black/10 bg-[#FCFCFD] px-4 py-3 text-sm text-black outline-none focus:ring-1 focus:ring-black/20"
      />
    </label>
  );
}
