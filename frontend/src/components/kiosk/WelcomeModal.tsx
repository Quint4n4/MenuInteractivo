import React from 'react';
import { colors } from '../../styles/colors';

interface WelcomeModalProps {
  show: boolean;
  patientName: string;
  orderLimits?: {
    DRINK?: number;
    SNACK?: number;
  };
  onClose: () => void;
}

export const WelcomeModal: React.FC<WelcomeModalProps> = ({
  show,
  patientName,
  orderLimits,
  onClose,
}) => {
  if (!show) return null;

  const drinkLimit = orderLimits?.DRINK || 1;
  const snackLimit = orderLimits?.SNACK || 1;

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.iconContainer}>
          <span style={styles.icon}>🏥</span>
        </div>

        <h2 style={styles.title}>¡Bienvenido/a {patientName}!</h2>

        <p style={styles.message}>
          Nos complace tenerte con nosotros. Como cortesía de la casa,
          puedes disfrutar de:
        </p>

        <div style={styles.limitsContainer}>
          {drinkLimit > 0 && (
            <div style={styles.limitItem}>
              <span style={styles.limitIcon}>🥤</span>
              <div>
                <div style={styles.limitLabel}>
                  {drinkLimit} {drinkLimit === 1 ? 'Bebida' : 'Bebidas'}
                </div>
                <div style={styles.limitDescription}>Agua, café, té o jugo</div>
              </div>
            </div>
          )}

          {snackLimit > 0 && (
            <div style={styles.limitItem}>
              <span style={styles.limitIcon}>🍪</span>
              <div>
                <div style={styles.limitLabel}>
                  {snackLimit} {snackLimit === 1 ? 'Snack' : 'Snacks'}
                </div>
                <div style={styles.limitDescription}>Frutas, galletas o pan</div>
              </div>
            </div>
          )}

          {drinkLimit === 0 && snackLimit === 0 && (
            <div style={styles.limitItem}>
              <span style={styles.limitIcon}>🎉</span>
              <div>
                <div style={styles.limitLabel}>Sin límites</div>
                <div style={styles.limitDescription}>Puedes ordenar lo que desees</div>
              </div>
            </div>
          )}
        </div>

        <p style={styles.enjoyMessage}>
          ¡Disfruta tu estancia y que te recuperes pronto!
        </p>

        <button style={styles.button} onClick={onClose}>
          OK
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
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10000,
  },
  modal: {
    backgroundColor: colors.white,
    borderRadius: '20px',
    padding: '48px 40px',
    maxWidth: '600px',
    width: '90%',
    textAlign: 'center',
    boxShadow: '0 12px 48px rgba(0, 0, 0, 0.3)',
  },
  iconContainer: {
    marginBottom: '24px',
  },
  icon: {
    fontSize: '80px',
  },
  title: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: colors.black,
    margin: '0 0 24px 0',
  },
  message: {
    fontSize: '18px',
    color: colors.gray,
    lineHeight: '1.6',
    margin: '0 0 32px 0',
  },
  limitsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    marginBottom: '32px',
    padding: '24px',
    backgroundColor: '#f8f9fa',
    borderRadius: '16px',
  },
  limitItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    padding: '16px',
    backgroundColor: colors.white,
    borderRadius: '12px',
    textAlign: 'left',
    border: '2px solid #e0e0e0',
  },
  limitIcon: {
    fontSize: '48px',
  },
  limitLabel: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: colors.black,
    marginBottom: '4px',
  },
  limitDescription: {
    fontSize: '14px',
    color: colors.gray,
  },
  enjoyMessage: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#4caf50',
    margin: '0 0 32px 0',
  },
  button: {
    padding: '16px 64px',
    backgroundColor: '#4caf50',
    color: colors.white,
    border: 'none',
    borderRadius: '12px',
    fontSize: '18px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.3s',
    boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3)',
  },
};
