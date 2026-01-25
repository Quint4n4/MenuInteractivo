import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { RenovaHeader } from '../../components/store/RenovaHeader';
import { colors } from '../../styles/colors';

export const RenovaHomePage: React.FC = () => {
  const { deviceId } = useParams<{ deviceId: string }>();
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', backgroundColor: colors.ivory }}>
      <RenovaHeader activePage="home" />

      {/* Hero Section */}
      <section style={styles.hero}>
        <div style={styles.heroContent}>
          <h1 style={styles.heroTitle}>Bienvenido a Renova Clinic</h1>
          <p style={styles.heroSubtitle}>
            Medicina regenerativa y tratamientos de vanguardia para tu bienestar
          </p>
          <button
            type="button"
            style={styles.heroButton}
            onClick={() => navigate(`/kiosk/${deviceId}/store`)}
          >
            Explorar Tienda
          </button>
        </div>
      </section>

      {/* Features Section */}
      <section style={styles.features}>
        <div style={styles.container}>
          <h2 style={styles.sectionTitle}>Nuestros Servicios</h2>
          <div style={styles.featuresGrid}>
            <div style={styles.featureCard}>
              <div style={styles.featureIcon}>💆</div>
              <h3 style={styles.featureTitle}>Tratamientos Faciales</h3>
              <p style={styles.featureDesc}>
                Rejuvenecimiento y regeneración celular para una piel radiante
              </p>
            </div>
            <div style={styles.featureCard}>
              <div style={styles.featureIcon}>💪</div>
              <h3 style={styles.featureTitle}>Tratamientos Corporales</h3>
              <p style={styles.featureDesc}>
                Terapias avanzadas para el bienestar y regeneración corporal
              </p>
            </div>
            <div style={styles.featureCard}>
              <div style={styles.featureIcon}>💊</div>
              <h3 style={styles.featureTitle}>Suplementos Regenerativos</h3>
              <p style={styles.featureDesc}>
                Productos de última generación para tu salud y vitalidad
              </p>
            </div>
            <div style={styles.featureCard}>
              <div style={styles.featureIcon}>🏠</div>
              <h3 style={styles.featureTitle}>Cuidado en Casa</h3>
              <p style={styles.featureDesc}>
                Productos profesionales para mantener tu rutina de cuidado
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* About Preview Section */}
      <section style={styles.aboutPreview}>
        <div style={styles.container}>
          <div style={styles.aboutContent}>
            <div style={styles.aboutText}>
              <h2 style={styles.sectionTitle}>Medicina Regenerativa</h2>
              <p style={styles.aboutDesc}>
                En Renova Clinic nos especializamos en medicina regenerativa de vanguardia,
                combinando tratamientos avanzados con productos de última generación para
                promover la regeneración celular y el bienestar integral.
              </p>
              <p style={styles.aboutDesc}>
                Nuestro enfoque integra terapias faciales, corporales y suplementos
                regenerativos diseñados para optimizar tu salud y vitalidad.
              </p>
              <button
                type="button"
                style={styles.aboutButton}
                onClick={() => navigate(`/kiosk/${deviceId}/renova/about`)}
              >
                Conoce Más
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={styles.cta}>
        <div style={styles.container}>
          <h2 style={styles.ctaTitle}>¿Listo para comenzar tu transformación?</h2>
          <p style={styles.ctaText}>
            Explora nuestros productos y servicios diseñados para tu bienestar
          </p>
          <button
            type="button"
            style={styles.ctaButton}
            onClick={() => navigate(`/kiosk/${deviceId}/store`)}
          >
            Ver Tienda
          </button>
        </div>
      </section>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  hero: {
    background: `linear-gradient(135deg, ${colors.primaryMuted} 0%, ${colors.cream} 100%)`,
    padding: '80px 2rem',
    textAlign: 'center',
  },
  heroContent: {
    maxWidth: 800,
    margin: '0 auto',
  },
  heroTitle: {
    fontSize: 48,
    fontWeight: 700,
    color: colors.textPrimary,
    margin: '0 0 16px 0',
    fontFamily: 'serif',
  },
  heroSubtitle: {
    fontSize: 20,
    color: colors.textSecondary,
    margin: '0 0 32px 0',
    lineHeight: 1.6,
  },
  heroButton: {
    padding: '14px 32px',
    backgroundColor: colors.primary,
    color: colors.white,
    border: 'none',
    borderRadius: 8,
    fontSize: 16,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  features: {
    padding: '80px 2rem',
    backgroundColor: colors.white,
  },
  container: {
    maxWidth: 1200,
    margin: '0 auto',
  },
  sectionTitle: {
    fontSize: 36,
    fontWeight: 700,
    color: colors.textPrimary,
    margin: '0 0 48px 0',
    textAlign: 'center',
    fontFamily: 'serif',
  },
  featuresGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: 32,
  },
  featureCard: {
    textAlign: 'center',
    padding: '32px 24px',
    backgroundColor: colors.ivory,
    borderRadius: 12,
    border: `1px solid ${colors.border}`,
  },
  featureIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  featureTitle: {
    fontSize: 20,
    fontWeight: 700,
    color: colors.textPrimary,
    margin: '0 0 12px 0',
  },
  featureDesc: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 1.6,
    margin: 0,
  },
  aboutPreview: {
    padding: '80px 2rem',
    backgroundColor: colors.ivory,
  },
  aboutContent: {
    maxWidth: 800,
    margin: '0 auto',
  },
  aboutText: {
    textAlign: 'center',
  },
  aboutDesc: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 1.8,
    margin: '0 0 20px 0',
  },
  aboutButton: {
    padding: '12px 28px',
    backgroundColor: colors.white,
    color: colors.primary,
    border: `2px solid ${colors.primary}`,
    borderRadius: 8,
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: 16,
    transition: 'all 0.2s',
  },
  cta: {
    padding: '80px 2rem',
    backgroundColor: colors.primary,
    textAlign: 'center',
  },
  ctaTitle: {
    fontSize: 36,
    fontWeight: 700,
    color: colors.white,
    margin: '0 0 16px 0',
    fontFamily: 'serif',
  },
  ctaText: {
    fontSize: 18,
    color: colors.white,
    margin: '0 0 32px 0',
    opacity: 0.9,
  },
  ctaButton: {
    padding: '14px 32px',
    backgroundColor: colors.white,
    color: colors.primary,
    border: 'none',
    borderRadius: 8,
    fontSize: 16,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
};
