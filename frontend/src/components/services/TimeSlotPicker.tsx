import React from 'react';
import { colors } from '../../styles/colors';

interface TimeSlotPickerProps {
  slots: string[];
  selected: string | null;
  onSelect: (slot: string) => void;
  duration?: number;
}

export const TimeSlotPicker: React.FC<TimeSlotPickerProps> = ({
  slots,
  selected,
  onSelect,
  duration,
}) => {
  return (
    <div style={styles.wrap}>
      {duration != null && (
        <p style={styles.duration}>Duración: {duration} min</p>
      )}
      <div style={styles.grid}>
        {slots.map((slot) => {
          const isSelected = selected === slot;
          return (
            <button
              key={slot}
              type="button"
              style={{
                ...styles.slot,
                ...(isSelected ? styles.slotSelected : {}),
              }}
              onClick={() => onSelect(slot)}
            >
              {slot}
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
  duration: {
    margin: '0 0 12px 0',
    fontSize: 14,
    color: colors.textSecondary,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
    gap: 8,
  },
  slot: {
    padding: '12px 16px',
    borderRadius: 8,
    border: `2px solid ${colors.border}`,
    backgroundColor: colors.white,
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 500,
    color: colors.textPrimary,
  },
  slotSelected: {
    backgroundColor: colors.primary,
    color: colors.white,
    borderColor: colors.primary,
  },
};
