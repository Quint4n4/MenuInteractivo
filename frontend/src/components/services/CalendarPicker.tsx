import React, { useState } from 'react';
import { colors } from '../../styles/colors';

interface CalendarPickerProps {
  onSelectDate: (date: Date) => void;
  selectedDate: Date | null;
  /** Días de la semana permitidos (ej. ['Lunes','Martes']). Si vacío, todos. */
  availableDays?: string[];
}

const DAYS_ES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTHS_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

function getDaysInMonth(year: number, month: number): Date[] {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const days: Date[] = [];
  for (let d = new Date(first); d <= last; d.setDate(d.getDate() + 1)) {
    days.push(new Date(d));
  }
  return days;
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

function getDayName(d: Date) {
  return DAYS_ES[d.getDay()];
}

export const CalendarPicker: React.FC<CalendarPickerProps> = ({
  onSelectDate,
  selectedDate,
  availableDays = [],
}) => {
  const [view, setView] = useState(() => {
    const d = selectedDate || new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  const days = getDaysInMonth(view.year, view.month);
  const first = days[0];
  const padStart = first.getDay();

  const isAvailable = (d: Date) => {
    if (availableDays.length === 0) return true;
    return availableDays.includes(getDayName(d));
  };

  const isPast = (d: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dx = new Date(d);
    dx.setHours(0, 0, 0, 0);
    return dx < today;
  };

  const prev = () => {
    if (view.month === 0) setView({ year: view.year - 1, month: 11 });
    else setView({ ...view, month: view.month - 1 });
  };

  const next = () => {
    if (view.month === 11) setView({ year: view.year + 1, month: 0 });
    else setView({ ...view, month: view.month + 1 });
  };

  return (
    <div style={styles.wrap}>
      <div style={styles.nav}>
        <button type="button" style={styles.navBtn} onClick={prev}>←</button>
        <span style={styles.monthLabel}>
          {MONTHS_ES[view.month]} {view.year}
        </span>
        <button type="button" style={styles.navBtn} onClick={next}>→</button>
      </div>
      <div style={styles.weekdays}>
        {DAYS_ES.map((d) => (
          <div key={d} style={styles.weekday}>{d}</div>
        ))}
      </div>
      <div style={styles.grid}>
        {Array.from({ length: padStart }, (_, i) => (
          <div key={`pad-${i}`} style={styles.cell} />
        ))}
        {days.map((d) => {
          const avail = isAvailable(d);
          const past = isPast(d);
          const sel = selectedDate && isSameDay(d, selectedDate);
          const disabled = !avail || past;
          return (
            <button
              key={d.toISOString()}
              type="button"
              style={{
                ...styles.cell,
                ...styles.dayBtn,
                ...(disabled ? styles.dayDisabled : {}),
                ...(sel ? styles.daySelected : {}),
              }}
              onClick={() => {
                if (!disabled) onSelectDate(d);
              }}
              disabled={disabled}
            >
              {d.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    padding: 16,
    backgroundColor: colors.ivory,
    borderRadius: 12,
    border: `1px solid ${colors.border}`,
  },
  nav: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  navBtn: {
    width: 44,
    height: 44,
    borderRadius: 8,
    border: `1px solid ${colors.border}`,
    backgroundColor: colors.white,
    cursor: 'pointer',
    fontSize: 18,
  },
  monthLabel: { fontSize: 16, fontWeight: 600, color: colors.textPrimary },
  weekdays: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: 4,
    marginBottom: 8,
  },
  weekday: {
    textAlign: 'center',
    fontSize: 12,
    fontWeight: 600,
    color: colors.textMuted,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: 4,
  },
  cell: {
    aspectRatio: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayBtn: {
    border: `2px solid transparent`,
    borderRadius: 8,
    backgroundColor: colors.white,
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 500,
    color: colors.textPrimary,
  },
  dayDisabled: {
    opacity: 0.4,
    cursor: 'not-allowed',
  },
  daySelected: {
    backgroundColor: colors.primary,
    color: colors.white,
    borderColor: colors.primary,
  },
};
