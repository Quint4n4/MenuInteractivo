import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MOCK_SERVICES } from '../../types/store';
import { colors } from '../../styles/colors';
import logoHorizontal from '../../assets/logos/logo-horizontal.png';

const formatPrice = (n: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n);

/** Prototipo: solo mock. Sin API ni integración con kiosk. */
export const KioskServiceDetail: React.FC = () => {
  const { deviceId, serviceId } = useParams<{ deviceId: string; serviceId: string }>();
  const navigate = useNavigate();

  const service = MOCK_SERVICES.find(
    (s) => s.id === parseInt(serviceId || '0', 10)
  );

  if (!service) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Servicio no encontrado.</p>
        <button
          type="button"
          onClick={() => navigate(`/kiosk/${deviceId}/services`)}
          style={{ marginTop: 16, padding: '10px 20px', cursor: 'pointer' }}
        >
          Volver a servicios
        </button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: colors.ivory }}>
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <img src={logoHorizontal} alt="CAMSA" style={styles.logo} />
          <h1 style={styles.title}>{service.name}</h1>
        </div>
        <button
          type="button"
          style={styles.btnBack}
          onClick={() => navigate(`/kiosk/${deviceId}/services`)}
        >
          ← Volver
        </button>
      </header>

      <main style={styles.main}>
        <div style={styles.card}>
          <div style={styles.imageWrap}>
            {service.image ? (
              <img src={service.image} alt={service.name} style={styles.image} />
            ) : (
              <div style={styles.placeholder}>🏥</div>
            )}
          </div>
          <div style={styles.info}>
            <h2 style={styles.name}>{service.name}</h2>
            <p style={styles.desc}>{service.description}</p>
            <div style={styles.meta}>
              <span style={styles.price}>{formatPrice(service.price)}</span>
              <span>{service.duration} min</span>
            </div>
            <p style={styles.extra}>Días: {service.availableDays.join(', ')}</p>
            <p style={styles.extra}>Horarios: {service.timeSlots.join(', ')}</p>
            <button
              type="button"
              style={styles.btn}
              onClick={() =>
                navigate(`/kiosk/${deviceId}/services/${service.id}/booking`)
              }
            >
              Reservar
            </button>
          </div>
        </div>
      </main>
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
  title: { margin: 0, fontSize: 20, color: colors.white, fontWeight: 700 },
  btnBack: {
    padding: '10px 18px',
    backgroundColor: 'transparent',
    color: colors.white,
    border: `2px solid ${colors.white}`,
    borderRadius: 8,
    fontSize: 15,
    cursor: 'pointer',
  },
  main: { padding: '2rem', maxWidth: 600, margin: '0 auto' },
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    overflow: 'hidden',
    boxShadow: `0 2px 12px ${colors.shadow}`,
  },
  imageWrap: {
    width: '100%',
    aspectRatio: '16/9',
    backgroundColor: '#E8F4F8',
  },
  image: { width: '100%', height: '100%', objectFit: 'cover' },
  placeholder: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 64,
  },
  info: { padding: 24, display: 'flex', flexDirection: 'column', gap: 12 },
  name: { margin: 0, fontSize: 22, color: colors.textPrimary },
  desc: { margin: 0, fontSize: 15, color: colors.textSecondary, lineHeight: 1.5 },
  meta: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    fontSize: 16,
    color: colors.textMuted,
  },
  price: { fontSize: 20, fontWeight: 'bold', color: colors.primary },
  extra: { margin: 0, fontSize: 14, color: colors.textSecondary },
  btn: {
    width: '100%',
    padding: 16,
    backgroundColor: colors.primary,
    color: colors.white,
    border: 'none',
    borderRadius: 8,
    fontSize: 16,
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: 8,
  },
};
