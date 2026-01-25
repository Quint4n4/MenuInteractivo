import React, { useState } from 'react';
import { colors } from '../../styles/colors';

interface PaymentFormProps {
  onSubmit: () => void;
  loading?: boolean;
}

/** Validación básica (prototipo). No procesa pagos reales. */
function formatCardNumber(val: string): string {
  const digits = val.replace(/\D/g, '').slice(0, 16);
  return digits.replace(/(.{4})/g, '$1 ').trim();
}

function formatExpiry(val: string): string {
  const digits = val.replace(/\D/g, '').slice(0, 4);
  if (digits.length >= 2) {
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  }
  return digits;
}

export const PaymentForm: React.FC<PaymentFormProps> = ({ onSubmit, loading }) => {
  const [name, setName] = useState('');
  const [card, setCard] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Nombre requerido';
    if (card.replace(/\s/g, '').length < 16) e.card = 'Tarjeta inválida';
    if (expiry.length < 5) e.expiry = 'Fecha requerida';
    const [mm, yy] = expiry.split('/').map((x) => parseInt(x, 10));
    if (mm < 1 || mm > 12) e.expiry = 'Mes inválido';
    const now = new Date();
    const y = now.getFullYear() % 100;
    const m = now.getMonth() + 1;
    if (yy < y || (yy === y && mm < m)) e.expiry = 'Tarjeta expirada';
    if (!/^\d{3,4}$/.test(cvv)) e.cvv = 'CVV inválido';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || loading) return;
    onSubmit();
  };

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      <div style={styles.field}>
        <label style={styles.label}>Nombre del titular</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Como aparece en la tarjeta"
          style={{ ...styles.input, borderColor: errors.name ? colors.error : colors.border }}
        />
        {errors.name && <span style={styles.error}>{errors.name}</span>}
      </div>
      <div style={styles.field}>
        <label style={styles.label}>Número de tarjeta</label>
        <input
          type="text"
          value={card}
          onChange={(e) => setCard(formatCardNumber(e.target.value))}
          placeholder="0000 0000 0000 0000"
          maxLength={19}
          style={{ ...styles.input, borderColor: errors.card ? colors.error : colors.border }}
        />
        {errors.card && <span style={styles.error}>{errors.card}</span>}
      </div>
      <div style={styles.row}>
        <div style={styles.field}>
          <label style={styles.label}>Vencimiento (MM/YY)</label>
          <input
            type="text"
            value={expiry}
            onChange={(e) => setExpiry(formatExpiry(e.target.value))}
            placeholder="MM/YY"
            maxLength={5}
            style={{ ...styles.input, borderColor: errors.expiry ? colors.error : colors.border }}
          />
          {errors.expiry && <span style={styles.error}>{errors.expiry}</span>}
        </div>
        <div style={styles.field}>
          <label style={styles.label}>CVV</label>
          <input
            type="text"
            value={cvv}
            onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
            placeholder="123"
            maxLength={4}
            style={{ ...styles.input, borderColor: errors.cvv ? colors.error : colors.border }}
          />
          {errors.cvv && <span style={styles.error}>{errors.cvv}</span>}
        </div>
      </div>
      <p style={styles.disclaimer}>
        Prototipo: no se procesan pagos reales.
      </p>
      <button type="submit" style={styles.submit} disabled={loading}>
        {loading ? 'Procesando…' : 'Pagar'}
      </button>
    </form>
  );
};

const styles: Record<string, React.CSSProperties> = {
  form: { display: 'flex', flexDirection: 'column', gap: 16 },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 14, fontWeight: 600, color: colors.textPrimary },
  input: {
    padding: '12px 16px',
    borderRadius: 8,
    border: `2px solid ${colors.border}`,
    fontSize: 15,
  },
  row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
  error: { fontSize: 12, color: colors.error },
  disclaimer: {
    margin: 0,
    fontSize: 12,
    color: colors.textMuted,
  },
  submit: {
    padding: 16,
    backgroundColor: colors.primary,
    color: colors.white,
    border: 'none',
    borderRadius: 8,
    fontSize: 16,
    fontWeight: 600,
    cursor: 'pointer',
  },
};
