import React from 'react';
import { colors } from '../../styles/colors';
import { useWindowSize } from '../../utils/responsive';

interface CannotOrderModalProps {
  onClose: () => void;
}

const CannotOrderModal: React.FC<CannotOrderModalProps> = ({ onClose }) => {
  const { isMobile } = useWindowSize();

  return (
    <div style={styles.overlay}>
      <div style={{ ...styles.modal, ...(isMobile && responsiveStyles.modal) }}>
        <div style={styles.iconContainer}>⚠️</div>
        <h2 style={{ ...styles.title, ...(isMobile && responsiveStyles.title) }}>
          No puedes realizar nuevas órdenes
        </h2>
        <p style={styles.message}>
          Espera la confirmación de encuesta o que tu enfermera cree órdenes por ti.
        </p>
        <button
          onClick={onClose}
          style={{
            ...styles.button,
            ...(isMobile && responsiveStyles.button),
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = colors.primaryDark;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = colors.primary;
          }}
        >
          Aceptar
        </button>
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
    zIndex: 1000,
    padding: '20px',
  },
  modal: {
    backgroundColor: colors.white,
    borderRadius: '16px',
    padding: '40px',
    maxWidth: '500px',
    width: '100%',
    boxShadow: colors.shadowGold,
    border: `1px solid ${colors.primaryMuted}`,
    textAlign: 'center',
  },
  iconContainer: {
    fontSize: '64px',
    marginBottom: '20px',
  },
  title: {
    fontSize: '24px',
    fontWeight: 600,
    color: colors.textPrimary,
    marginBottom: '20px',
  },
  message: {
    fontSize: '16px',
    color: colors.textSecondary,
    marginBottom: '30px',
    lineHeight: '1.6',
  },
  button: {
    width: '100%',
    backgroundColor: colors.primary,
    color: colors.white,
    border: 'none',
    borderRadius: '8px',
    padding: '16px 32px',
    fontSize: '18px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
};

const responsiveStyles: { [key: string]: React.CSSProperties } = {
  modal: {
    padding: '30px 20px',
  },
  title: {
    fontSize: '20px',
  },
  button: {
    padding: '14px 24px',
    fontSize: '16px',
  },
};

export default CannotOrderModal;
