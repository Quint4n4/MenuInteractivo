import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { colors } from '../../styles/colors';
import logoHorizontal from '../../assets/logos/logo-horizontal.png';

export const KioskServiceBooking: React.FC = () => {
  const { deviceId, serviceId } = useParams<{ deviceId: string; serviceId: string }>();
  const navigate = useNavigate();
  const [notes, setNotes] = useState('');

  const handleSubmit = () => {
    // TODO: Implementar envío de solicitud de servicio
    alert('Solicitud de servicio enviada. Serás contactado pronto.');
    navigate(`/kiosk/${deviceId}/services`);
  };

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
          <h1 style={{ color: 'white', margin: 0 }}>Solicitar Servicio</h1>
        </div>
        <button
          onClick={() => navigate(`/kiosk/${deviceId}/services/${serviceId}`)}
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
      <main style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '12px' }}>
          <h2>Completa tu solicitud</h2>
          <div style={{ marginTop: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              Notas adicionales (opcional):
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Describe cualquier detalle adicional sobre tu solicitud..."
              style={{
                width: '100%',
                minHeight: '150px',
                padding: '1rem',
                border: `1px solid ${colors.border}`,
                borderRadius: '8px',
                fontSize: '1rem',
                fontFamily: 'inherit'
              }}
            />
          </div>
          <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
            <button
              onClick={handleSubmit}
              style={{
                flex: 1,
                padding: '1rem',
                backgroundColor: colors.primary,
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '1.1rem',
                fontWeight: 'bold'
              }}
            >
              Enviar Solicitud
            </button>
            <button
              onClick={() => navigate(`/kiosk/${deviceId}/services/${serviceId}`)}
              style={{
                padding: '1rem 2rem',
                backgroundColor: 'transparent',
                border: `1px solid ${colors.border}`,
                color: colors.textPrimary,
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '1rem'
              }}
            >
              Cancelar
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};
