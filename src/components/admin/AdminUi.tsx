import type { ReactNode } from 'react';

export const adminInputClass =
  'w-full px-3 py-2 rounded-lg bg-white border border-[#e5e5e5] text-sm text-[#111111] placeholder:text-black/35 focus:outline-none focus:ring-2 focus:ring-black/10';

export const adminTabClass = (active: boolean) =>
  `px-3 py-1.5 rounded-lg text-sm border transition-colors ${
    active
      ? 'bg-[#f0f0f2] border-[#d4d4d4] text-[#111111] font-medium'
      : 'border-[#e8e8e8] text-black/50 hover:text-[#111111] hover:bg-[#fafafa]'
  }`;

export const adminSectionHeaderClass =
  'px-4 py-3 border-b border-[#f0f0f0] text-sm font-semibold text-[#111111]';

export const adminLinkClass = 'text-sky-700 hover:underline text-xs';

export const adminBtnPrimaryClass =
  'px-3 py-2 rounded-lg bg-[#111111] text-white text-sm font-semibold hover:bg-black/85 disabled:opacity-40 transition-colors';

export function AdminPageHeader({ title, desc, action }: { title: string; desc?: string; action?: ReactNode }) {
  return (
    <div className="mb-5 flex items-start justify-between gap-4">
      <div>
        <h1 className="text-xl font-bold text-[#111111]">{title}</h1>
        {desc ? <p className="text-sm text-black/50 mt-1">{desc}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function AdminCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-[#f0f0f0] bg-white shadow-sm ${className}`}>{children}</div>
  );
}

export function AdminTable({
  columns,
  rows,
  empty = '暂无数据',
}: {
  columns: Array<{ key: string; label: string; render?: (row: Record<string, unknown>) => ReactNode }>;
  rows: Array<Record<string, unknown>>;
  empty?: string;
}) {
  if (rows.length === 0) {
    return <p className="p-8 text-center text-sm text-black/45">{empty}</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#f0f0f0] text-left text-black/45">
            {columns.map((col) => (
              <th key={col.key} className="px-4 py-3 font-medium whitespace-nowrap">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={String(row.id ?? index)} className="border-b border-[#f5f5f5] hover:bg-[#fafafa]">
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-3 text-[#333333] whitespace-nowrap">
                  {col.render ? col.render(row) : String(row[col.key] ?? '—')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function StatusBadge({ value }: { value: string }) {
  const tone =
    value === 'published' || value === 'paid' || value === 'completed' || value === 'active'
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : value === 'draft' || value === 'running'
        ? 'bg-amber-50 text-amber-700 border-amber-200'
        : 'bg-slate-100 text-slate-600 border-slate-200';

  return <span className={`inline-flex px-2 py-0.5 rounded-full border text-xs ${tone}`}>{value}</span>;
}
