import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MOCK_SERVICES } from '../../types/store';
import type { Service } from '../../types/store';
import { ServiceCard } from '../../components/services/ServiceCard';
import { ServiceDetailModal } from '../../components/services/ServiceDetailModal';
import { colors } from '../../styles/colors';
import logoHorizontal from '../../assets/logos/logo-horizontal.png';

/** Prototipo: solo mock. Sin API ni integración con kiosk. */
export const KioskServicesPage: React.FC = () => {
  const { deviceId } = useParams<{ deviceId: string }>();
  const navigate = useNavigate();
  const [detailService, setDetailService] = useState<Service | null>(null);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: colors.ivory }}>
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <img src={logoHorizontal} alt="CAMSA" style={styles.logo} />
          <h1 style={styles.title}>Servicios</h1>
        </div>
        <button
          type="button"
          style={styles.btnBack}
          onClick={() => navigate(`/kiosk/${deviceId}`)}
        >
          ← Volver
        </button>
      </header>

      <main style={styles.main}>
        <div style={styles.grid}>
          {MOCK_SERVICES.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              onViewDetail={(id) => {
                const s = MOCK_SERVICES.find((x) => x.id === id);
                if (s) setDetailService(s);
              }}
              onReserve={(id) => navigate(`/kiosk/${deviceId}/services/${id}/booking`)}
            />
          ))}
        </div>
      </main>

      {detailService && (
        <ServiceDetailModal
          service={detailService}
          onClose={() => setDetailService(null)}
          onReserve={() => {
            setDetailService(null);
            navigate(`/kiosk/${deviceId}/services/${detailService.id}/booking`);
          }}
        />
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem 2rem',
    backgroundColor: colors.primary,
    boxShadow: `0 2px 8px ${colors.shadow}`,
  },
  headerLeft: { display: 'flex', alignItems: 'center', gap: 16 },
  logo: { height: 40 },
  title: { margin: 0, fontSize: 22, color: colors.white, fontWeight: 700 },
  btnBack: {
    padding: '10px 18px',
    backgroundColor: 'transparent',
    color: colors.white,
    border: `2px solid ${colors.white}`,
    borderRadius: 8,
    fontSize: 15,
    cursor: 'pointer',
  },
  main: { padding: '2rem', maxWidth: 1200, margin: '0 auto' },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: 24,
  },
};
