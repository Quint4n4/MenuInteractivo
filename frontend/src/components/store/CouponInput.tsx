import React, { useState } from 'react';
import { MOCK_COUPONS } from '../../types/store';
import { colors } from '../../styles/colors';

export interface AppliedCoupon {
  code: string;
  discountPercent: number;
}

interface CouponInputProps {
  onApply: (coupon: AppliedCoupon | null) => void;
  applied: AppliedCoupon | null;
  disabled?: boolean;
}

/** Validación en frontend (prototipo). CAMSA10, CAMSA20. */
function validateCoupon(code: string): { code: string; discountPercent: number } | null {
  const c = code.trim().toUpperCase();
  const found = MOCK_COUPONS.find((x) => x.code === c);
  return found ? { code: found.code, discountPercent: found.discountPercent } : null;
}

export const CouponInput: React.FC<CouponInputProps> = ({
  onApply,
  applied,
  disabled,
}) => {
  const [input, setInput] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleApply = () => {
    setMessage(null);
    if (!input.trim()) {
      setMessage({ type: 'error', text: 'Ingresa un código' });
      return;
    }
    const coupon = validateCoupon(input);
    if (coupon) {
      onApply(coupon);
      setMessage({ type: 'success', text: `${coupon.code} aplicado (${coupon.discountPercent}% de descuento)` });
      setInput('');
    } else {
      onApply(null);
      setMessage({ type: 'error', text: 'Código inválido' });
    }
  };

  const handleRemove = () => {
    onApply(null);
    setMessage(null);
    setInput('');
  };

  return (
    <div style={styles.wrap}>
      {applied ? (
        <div style={styles.applied}>
          <span style={styles.appliedText}>
            Cupón: {applied.code} (-{applied.discountPercent}%)
          </span>
          <button
            type="button"
            style={styles.removeBtn}
            onClick={handleRemove}
          >
            Quitar
          </button>
        </div>
      ) : (
        <>
          <input
            type="text"
            placeholder="Código de cupón"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleApply()}
            disabled={disabled}
            style={styles.input}
          />
          <button
            type="button"
            style={styles.applyBtn}
            onClick={handleApply}
            disabled={disabled}
          >
            Aplicar
          </button>
        </>
      )}
      {message && (
        <p
          style={{
            ...styles.message,
            color: message.type === 'success' ? colors.success : colors.error,
          }}
        >
          {message.text}
        </p>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  input: {
    padding: '12px 16px',
    borderRadius: 8,
    border: `1px solid ${colors.border}`,
    fontSize: 15,
  },
  applyBtn: {
    padding: '12px 16px',
    backgroundColor: colors.primary,
    color: colors.white,
    border: 'none',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },
  applied: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: colors.primaryMuted,
    borderRadius: 8,
    border: `1px solid ${colors.primary}`,
  },
  appliedText: { fontSize: 14, fontWeight: 600, color: colors.primaryDark },
  removeBtn: {
    padding: '6px 12px',
    backgroundColor: 'transparent',
    color: colors.primaryDark,
    border: `1px solid ${colors.primary}`,
    borderRadius: 6,
    fontSize: 12,
    cursor: 'pointer',
  },
  message: { margin: 0, fontSize: 13 },
};
