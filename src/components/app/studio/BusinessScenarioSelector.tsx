import type { ReactNode } from 'react';
import {
  CUSTOMER_TYPE_OPTIONS,
  OPTIMIZATION_OPTIONS,
  SCENARIO_OPTIONS,
  type BusinessScenario,
  type CustomerType,
  type OptimizationDirection,
} from '../../../lib/creatorStudio';

export function BusinessCustomerTypeSelector({
  value,
  onChange,
}: {
  value: CustomerType;
  onChange: (value: CustomerType) => void;
}) {
  return (
    <SelectorSection title="行业 / 客户类型">
      {CUSTOMER_TYPE_OPTIONS.map((option) => (
        <ChoiceCard key={option} selected={option === value} onClick={() => onChange(option)}>
          {option}
        </ChoiceCard>
      ))}
    </SelectorSection>
  );
}

export function BusinessScenarioSelector({
  value,
  onChange,
}: {
  value: BusinessScenario;
  onChange: (value: BusinessScenario) => void;
}) {
  return (
    <SelectorSection title="使用场景">
      {SCENARIO_OPTIONS.map((option) => (
        <ChoiceCard key={option} selected={option === value} onClick={() => onChange(option)}>
          {option}
        </ChoiceCard>
      ))}
    </SelectorSection>
  );
}

export function OptimizationDirectionSelector({
  value,
  onChange,
}: {
  value: OptimizationDirection;
  onChange: (value: OptimizationDirection) => void;
}) {
  return (
    <SelectorSection title="这次准备优化什么？">
      {OPTIMIZATION_OPTIONS.map((option) => (
        <ChoiceCard key={option} selected={option === value} onClick={() => onChange(option)}>
          {option}
        </ChoiceCard>
      ))}
    </SelectorSection>
  );
}

function SelectorSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold text-[#1A1A1A]">{title}</h3>
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-3">{children}</div>
    </section>
  );
}

function ChoiceCard({
  children,
  selected,
  onClick,
}: {
  children: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border px-4 py-4 text-left text-sm transition-colors ${
        selected
          ? 'border-[#0F766E]/25 bg-[#EAF6F4] text-[#0F766E] shadow-sm'
          : 'border-black/[0.08] bg-white text-black/72 hover:border-black/15 hover:bg-[#FCFCFD]'
      }`}
    >
      {children}
    </button>
  );
}
