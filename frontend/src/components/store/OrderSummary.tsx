import React from 'react';
import type { AppliedCoupon } from './CouponInput';
import { colors } from '../../styles/colors';

interface OrderSummaryProps {
  subtotal: number;
  coupon: AppliedCoupon | null;
  onRemoveCoupon?: () => void;
}

const formatPrice = (n: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n);

export const OrderSummary: React.FC<OrderSummaryProps> = ({
  subtotal,
  coupon,
}) => {
  const discount = coupon
    ? Math.round((subtotal * coupon.discountPercent) / 100 * 100) / 100
    : 0;
  const total = Math.max(0, subtotal - discount);

  return (
    <div style={styles.wrap}>
      <div style={styles.row}>
        <span style={styles.label}>Subtotal</span>
        <span style={styles.value}>{formatPrice(subtotal)}</span>
      </div>
      {coupon && (
        <div style={styles.row}>
          <span style={styles.label}>
            Descuento ({coupon.code} -{coupon.discountPercent}%)
          </span>
          <span style={{ ...styles.value, color: colors.success }}>
            -{formatPrice(discount)}
          </span>
        </div>
      )}
      <div style={{ ...styles.row, ...styles.totalRow }}>
        <span style={styles.totalLabel}>Total</span>
        <span style={styles.totalValue}>{formatPrice(total)}</span>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    padding: 16,
    backgroundColor: colors.ivory,
    borderRadius: 12,
    border: `1px solid ${colors.border}`,
  },
  row: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: { fontSize: 14, color: colors.textSecondary },
  value: { fontSize: 14, fontWeight: 600, color: colors.textPrimary },
  totalRow: {
    marginTop: 8,
    paddingTop: 12,
    borderTop: `1px solid ${colors.border}`,
  },
  totalLabel: { fontSize: 16, fontWeight: 700, color: colors.textPrimary },
  totalValue: { fontSize: 18, fontWeight: 700, color: colors.primary },
};
