import React from 'react';
import { colors } from '../../styles/colors';

interface InitialWelcomeScreenProps {
  deviceUid: string;
  onViewMenu: () => void;
  loading?: boolean;
  patientAssigned?: boolean;
}

export const InitialWelcomeScreen: React.FC<InitialWelcomeScreenProps> = ({
  deviceUid,
  onViewMenu,
  loading = false,
  patientAssigned = false,
}) => {
  const isButtonDisabled = !patientAssigned || loading;
  return (
    <div style={styles.container}>
      {/* Logo Section */}
      <div style={styles.logoContainer}>
        {/* Placeholder para el logo - puedes reemplazar con <img> cuando tengas el logo */}
        <div style={styles.logoPlaceholder}>
          <h1 style={styles.logoText}>CLÍNICA CAMSA</h1>
        </div>
      </div>

      {/* Welcome Content */}
      <div style={styles.content}>
        <h1 style={styles.title}>¡Bienvenido!</h1>

        <div style={styles.messageContainer}>
          <div style={styles.messageCard}>
            <div style={styles.iconCircle}>
              <span style={styles.icon}>🎁</span>
            </div>
            <h2 style={styles.messageTitle}>Cortesías Gratuitas</h2>
            <p style={styles.messageText}>
              Durante tu consulta, disfruta de bebidas y snacks completamente gratis.
            </p>
          </div>

          <div style={styles.messageCard}>
            <div style={styles.iconCircle}>
              <span style={styles.icon}>🍽️</span>
            </div>
            <h2 style={styles.messageTitle}>Ordena Comida</h2>
            <p style={styles.messageText}>
              También puedes ordenar alimentos adicionales desde nuestro menú.
            </p>
          </div>
        </div>

        <button
          style={isButtonDisabled ? styles.buttonDisabled : styles.button}
          onClick={onViewMenu}
          disabled={isButtonDisabled}
        >
          {loading ? 'Verificando...' : patientAssigned ? 'Ver Menú' : 'Esperando registro...'}
        </button>

        {!patientAssigned && (
          <p style={styles.waitingMessage}>
            Por favor espera a que tu enfermera te registre en el sistema
          </p>
        )}

        <p style={styles.footer}>
          Dispositivo: {deviceUid}
        </p>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    minHeight: '100vh',
    backgroundColor: colors.primary,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 20px',
  },
  logoContainer: {
    marginBottom: '60px',
  },
  logoPlaceholder: {
    width: '300px',
    height: '120px',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
  },
  logoText: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: colors.primary,
    margin: 0,
    letterSpacing: '2px',
  },
  content: {
    textAlign: 'center',
    maxWidth: '900px',
    width: '100%',
  },
  title: {
    fontSize: '56px',
    fontWeight: 'bold',
    color: colors.white,
    margin: '0 0 60px 0',
    textShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
  },
  messageContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '30px',
    marginBottom: '60px',
  },
  messageCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: '20px',
    padding: '40px 30px',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  },
  iconCircle: {
    width: '100px',
    height: '100px',
    borderRadius: '50%',
    backgroundColor: colors.primaryLight,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 24px auto',
  },
  icon: {
    fontSize: '50px',
  },
  messageTitle: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: colors.primary,
    margin: '0 0 16px 0',
  },
  messageText: {
    fontSize: '18px',
    color: colors.gray,
    lineHeight: '1.6',
    margin: 0,
  },
  button: {
    padding: '24px 80px',
    backgroundColor: colors.white,
    color: colors.primary,
    border: `3px solid ${colors.white}`,
    borderRadius: '50px',
    fontSize: '28px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.2)',
    textTransform: 'uppercase',
    letterSpacing: '1px',
  },
  buttonDisabled: {
    padding: '24px 80px',
    backgroundColor: colors.grayLight,
    color: colors.white,
    border: `3px solid ${colors.grayLight}`,
    borderRadius: '50px',
    fontSize: '28px',
    fontWeight: 'bold',
    cursor: 'not-allowed',
    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.2)',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    opacity: 0.7,
  },
  footer: {
    marginTop: '40px',
    fontSize: '14px',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  waitingMessage: {
    marginTop: '20px',
    fontSize: '18px',
    color: 'rgba(255, 255, 255, 0.9)',
    fontStyle: 'italic',
  },
};

// Add hover effect
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @media (hover: hover) {
    .welcome-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 15px 50px rgba(0, 0, 0, 0.25);
    }

    .welcome-button:hover:not(:disabled) {
      transform: scale(1.05);
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3);
    }

    .welcome-button:active:not(:disabled) {
      transform: scale(0.98);
    }
  }
`;
if (!document.head.querySelector('[data-initial-welcome-styles]')) {
  styleSheet.setAttribute('data-initial-welcome-styles', 'true');
  document.head.appendChild(styleSheet);
}
