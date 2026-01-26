import React from 'react';
import { colors } from '../../styles/colors';

interface CannotOrderModalProps {
  show: boolean;
  onClose: () => void;
  message?: string;
}

export const CannotOrderModal: React.FC<CannotOrderModalProps> = ({
  show,
  onClose,
  message = 'No puedes realizar pedidos en este momento. Por favor espera a que tu enfermera habilite la encuesta.',
}) => {
  if (!show) return null;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.content}>
          <div style={styles.iconContainer}>
            <span style={styles.icon}>⏳</span>
          </div>
          <h2 style={styles.title}>No puedes realizar pedidos</h2>
          <p style={styles.message}>{message}</p>
          <button
            onClick={onClose}
            style={styles.button}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = colors.primaryDark;
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = colors.primary;
            }}
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10000,
    padding: '20px',
  },
  modal: {
    backgroundColor: colors.white,
    borderRadius: '16px',
    padding: '40px',
    maxWidth: '500px',
    width: '100%',
    boxShadow: `0 4px 20px ${colors.shadowDark}`,
    border: `1px solid ${colors.primaryMuted}`,
    textAlign: 'center',
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '20px',
  },
  iconContainer: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    backgroundColor: colors.primaryMuted,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '10px',
  },
  icon: {
    fontSize: '40px',
  },
  title: {
    fontSize: '24px',
    fontWeight: 600,
    color: colors.textPrimary,
    margin: 0,
  },
  message: {
    fontSize: '16px',
    color: colors.textSecondary,
    lineHeight: 1.6,
    margin: 0,
  },
  button: {
    backgroundColor: colors.primary,
    color: colors.white,
    border: 'none',
    borderRadius: '8px',
    padding: '12px 32px',
    fontSize: '16px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    marginTop: '10px',
  },
};
