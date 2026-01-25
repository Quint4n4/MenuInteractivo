import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { RenovaHeader } from '../../components/store/RenovaHeader';
import { colors } from '../../styles/colors';

export const RenovaAboutPage: React.FC = () => {
  const { deviceId } = useParams<{ deviceId: string }>();
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', backgroundColor: colors.ivory }}>
      <RenovaHeader activePage="about" />

      {/* Hero Section */}
      <section style={styles.hero}>
        <div style={styles.container}>
          <h1 style={styles.heroTitle}>Sobre Renova Clinic</h1>
          <p style={styles.heroSubtitle}>
            Medicina regenerativa de vanguardia para tu bienestar integral
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section style={styles.section}>
        <div style={styles.container}>
          <div style={styles.contentBlock}>
            <h2 style={styles.sectionTitle}>Nuestra Misión</h2>
            <p style={styles.text}>
              En Renova Clinic nos dedicamos a proporcionar tratamientos de medicina
              regenerativa de última generación, combinando terapias avanzadas con productos
              de alta calidad para promover la regeneración celular y el bienestar integral
              de nuestros pacientes.
            </p>
            <p style={styles.text}>
              Creemos en un enfoque holístico que integra tratamientos faciales, corporales
              y suplementos regenerativos, diseñados para optimizar tu salud y vitalidad
              desde el interior hacia el exterior.
            </p>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section style={styles.sectionAlt}>
        <div style={styles.container}>
          <h2 style={styles.sectionTitle}>Nuestros Valores</h2>
          <div style={styles.valuesGrid}>
            <div style={styles.valueCard}>
              <div style={styles.valueIcon}>🔬</div>
              <h3 style={styles.valueTitle}>Innovación</h3>
              <p style={styles.valueText}>
                Utilizamos las tecnologías más avanzadas en medicina regenerativa
              </p>
            </div>
            <div style={styles.valueCard}>
              <div style={styles.valueIcon}>💚</div>
              <h3 style={styles.valueTitle}>Bienestar Integral</h3>
              <p style={styles.valueText}>
                Enfoque holístico para tu salud física y mental
              </p>
            </div>
            <div style={styles.valueCard}>
              <div style={styles.valueIcon}>✨</div>
              <h3 style={styles.valueTitle}>Calidad</h3>
              <p style={styles.valueText}>
                Productos y tratamientos de la más alta calidad certificada
              </p>
            </div>
            <div style={styles.valueCard}>
              <div style={styles.valueIcon}>🤝</div>
              <h3 style={styles.valueTitle}>Compromiso</h3>
              <p style={styles.valueText}>
                Dedicados a tu transformación y resultados duraderos
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Services Overview */}
      <section style={styles.section}>
        <div style={styles.container}>
          <h2 style={styles.sectionTitle}>Nuestros Servicios</h2>
          <div style={styles.servicesList}>
            <div style={styles.serviceItem}>
              <h3 style={styles.serviceTitle}>Tratamientos Faciales</h3>
              <p style={styles.serviceText}>
                Terapias avanzadas de rejuvenecimiento y regeneración celular facial,
                incluyendo PRP Facial, Mesoterapia y tratamientos con factores de crecimiento.
              </p>
            </div>
            <div style={styles.serviceItem}>
              <h3 style={styles.serviceTitle}>Tratamientos Corporales</h3>
              <p style={styles.serviceText}>
                Procedimientos regenerativos para el cuerpo, diseñados para mejorar
                la elasticidad, tono y regeneración de tejidos corporales.
              </p>
            </div>
            <div style={styles.serviceItem}>
              <h3 style={styles.serviceTitle}>Suplementos Regenerativos</h3>
              <p style={styles.serviceText}>
                Productos de última generación como Alivium, Aquaminerales, NanoExom
                y otros suplementos diseñados para potenciar la regeneración celular.
              </p>
            </div>
            <div style={styles.serviceItem}>
              <h3 style={styles.serviceTitle}>Cuidado en Casa</h3>
              <p style={styles.serviceText}>
                Productos profesionales para mantener y potenciar los resultados
                de tus tratamientos en la comodidad de tu hogar.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={styles.cta}>
        <div style={styles.container}>
          <h2 style={styles.ctaTitle}>¿Listo para comenzar?</h2>
          <p style={styles.ctaText}>
            Explora nuestros productos y servicios, y agenda tu consulta
          </p>
          <div style={styles.ctaButtons}>
            <button
              type="button"
              style={styles.ctaButtonPrimary}
              onClick={() => navigate(`/kiosk/${deviceId}/store`)}
            >
              Ver Tienda
            </button>
            <button
              type="button"
              style={styles.ctaButtonSecondary}
              onClick={() => navigate(`/kiosk/${deviceId}/renova/contact`)}
            >
              Contactar
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  hero: {
    background: `linear-gradient(135deg, ${colors.primaryMuted} 0%, ${colors.cream} 100%)`,
    padding: '60px 2rem',
    textAlign: 'center',
  },
  container: {
    maxWidth: 1000,
    margin: '0 auto',
  },
  heroTitle: {
    fontSize: 42,
    fontWeight: 700,
    color: colors.textPrimary,
    margin: '0 0 16px 0',
    fontFamily: 'serif',
  },
  heroSubtitle: {
    fontSize: 18,
    color: colors.textSecondary,
    margin: 0,
    lineHeight: 1.6,
  },
  section: {
    padding: '60px 2rem',
    backgroundColor: colors.white,
  },
  sectionAlt: {
    padding: '60px 2rem',
    backgroundColor: colors.ivory,
  },
  contentBlock: {
    maxWidth: 800,
    margin: '0 auto',
  },
  sectionTitle: {
    fontSize: 32,
    fontWeight: 700,
    color: colors.textPrimary,
    margin: '0 0 24px 0',
    textAlign: 'center',
    fontFamily: 'serif',
  },
  text: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 1.8,
    margin: '0 0 20px 0',
  },
  valuesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: 24,
    marginTop: 40,
  },
  valueCard: {
    textAlign: 'center',
    padding: '32px 20px',
    backgroundColor: colors.white,
    borderRadius: 12,
    border: `1px solid ${colors.border}`,
  },
  valueIcon: {
    fontSize: 40,
    marginBottom: 16,
  },
  valueTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: colors.textPrimary,
    margin: '0 0 12px 0',
  },
  valueText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 1.6,
    margin: 0,
  },
  servicesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 24,
    marginTop: 40,
  },
  serviceItem: {
    padding: '24px',
    backgroundColor: colors.ivory,
    borderRadius: 12,
    border: `1px solid ${colors.border}`,
  },
  serviceTitle: {
    fontSize: 20,
    fontWeight: 700,
    color: colors.primary,
    margin: '0 0 12px 0',
  },
  serviceText: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 1.7,
    margin: 0,
  },
  cta: {
    padding: '60px 2rem',
    backgroundColor: colors.primary,
    textAlign: 'center',
  },
  ctaTitle: {
    fontSize: 32,
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
  ctaButtons: {
    display: 'flex',
    gap: 16,
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  ctaButtonPrimary: {
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
  ctaButtonSecondary: {
    padding: '14px 32px',
    backgroundColor: 'transparent',
    color: colors.white,
    border: `2px solid ${colors.white}`,
    borderRadius: 8,
    fontSize: 16,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
};
