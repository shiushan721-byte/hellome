import { useCallback, useEffect, useRef, useState } from 'react';
import { Calendar } from 'lucide-react';
import '../api-hub.css';

interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

export function DatePicker({ value, onChange, placeholder = '选择日期' }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const parsed = value ? new Date(value) : new Date();
  const [viewYear, setViewYear] = useState(parsed.getFullYear());
  const [viewMonth, setViewMonth] = useState(parsed.getMonth());

  useEffect(() => {
    if (value) {
      const d = new Date(value);
      setViewYear(d.getFullYear());
      setViewMonth(d.getMonth());
    }
  }, [value]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const prevMonth = useCallback(() => {
    setViewMonth((m) => {
      if (m === 0) {
        setViewYear((y) => y - 1);
        return 11;
      }
      return m - 1;
    });
  }, []);

  const nextMonth = useCallback(() => {
    setViewMonth((m) => {
      if (m === 11) {
        setViewYear((y) => y + 1);
        return 0;
      }
      return m + 1;
    });
  }, []);

  const handleSelect = useCallback(
    (day: number) => {
      const d = new Date(viewYear, viewMonth, day);
      onChange(formatDate(d));
      setOpen(false);
    },
    [viewYear, viewMonth, onChange],
  );

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfWeek(viewYear, viewMonth);
  const today = formatDate(new Date());

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button type="button" className="api-hub-picker-trigger" onClick={() => setOpen((v) => !v)}>
        <span>{value || placeholder}</span>
        <span className="api-hub-picker-trigger-icon">
          <Calendar size={14} />
        </span>
      </button>

      {open && (
        <div className="api-hub-picker-dropdown" style={{ padding: 12, width: 280 }}>
          <div className="api-hub-datepicker-header">
            <button type="button" className="api-hub-datepicker-nav" onClick={prevMonth}>
              ◀
            </button>
            <span className="api-hub-datepicker-title">
              {viewYear}年{viewMonth + 1}月
            </span>
            <button type="button" className="api-hub-datepicker-nav" onClick={nextMonth}>
              ▶
            </button>
          </div>

          <div className="api-hub-datepicker-grid">
            {WEEKDAYS.map((w) => (
              <div key={w} className="api-hub-datepicker-weekday">
                {w}
              </div>
            ))}
            {cells.map((day, idx) => {
              if (day === null) {
                return <div key={`empty-${idx}`} />;
              }
              const dateStr = formatDate(new Date(viewYear, viewMonth, day));
              const isSelected = dateStr === value;
              const isToday = dateStr === today;
              const classNames = ['api-hub-datepicker-day'];
              if (isSelected) classNames.push('selected');
              else if (isToday) classNames.push('today');
              return (
                <button
                  key={day}
                  type="button"
                  className={classNames.join(' ')}
                  onClick={() => handleSelect(day)}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
