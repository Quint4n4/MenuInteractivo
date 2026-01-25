import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { colors } from '../../styles/colors';
import logoHorizontal from '../../assets/logos/logo-horizontal.png';

export const KioskStoreCheckout: React.FC = () => {
  const { deviceId } = useParams<{ deviceId: string }>();
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', backgroundColor: colors.ivory }}>
      <header style={{
        backgroundColor: colors.primary,
        padding: '1rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <img src={logoHorizontal} alt="CAMSA" style={{ height: '40px' }} />
          <h1 style={{ color: 'white', margin: 0 }}>Checkout</h1>
        </div>
        <button
          onClick={() => navigate(`/kiosk/${deviceId}/store`)}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: 'transparent',
            border: '1px solid white',
            color: 'white',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          ← Volver
        </button>
      </header>
      <main style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
        <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '12px' }}>
          <h2>Checkout - Próximamente</h2>
          <p>Esta funcionalidad estará disponible pronto.</p>
        </div>
      </main>
    </div>
  );
};
