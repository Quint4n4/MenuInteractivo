import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MOCK_SERVICES } from '../../types/store';
import { useServiceBooking, getMockTimeSlotsForDate } from '../../hooks/useServiceBooking';
import { CalendarPicker } from '../../components/services/CalendarPicker';
import { TimeSlotPicker } from '../../components/services/TimeSlotPicker';
import { PaymentForm } from '../../components/store/PaymentForm';
import { colors } from '../../styles/colors';
import logoHorizontal from '../../assets/logos/logo-horizontal.png';

const formatPrice = (n: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n);

/** Prototipo: solo mock. Sin API. Calendario, horarios y pago simulados. */
export const KioskServiceBooking: React.FC = () => {
  const { deviceId, serviceId } = useParams<{ deviceId: string; serviceId: string }>();
  const navigate = useNavigate();
  const booking = useServiceBooking();
  const [loading, setLoading] = React.useState(false);
  const [success, setSuccess] = React.useState(false);

  const service = MOCK_SERVICES.find(
    (s) => s.id === parseInt(serviceId || '0', 10)
  );

  useEffect(() => {
    if (service) booking.setService(service);
  }, [service, booking.setService]);

  const slots =
    booking.date && booking.service
      ? getMockTimeSlotsForDate(booking.date, booking.service)
      : [];

  const handlePay = () => {
    if (!booking.service || !booking.date || !booking.timeSlot) return;
    setLoading(true);
    setTimeout(() => {
      booking.reset();
      setLoading(false);
      setSuccess(true);
    }, 800);
  };

  const canPay =
    booking.service &&
    booking.date &&
    booking.timeSlot;

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

  if (success) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: colors.ivory }}>
        <header style={styles.header}>
          <div style={styles.headerLeft}>
            <img src={logoHorizontal} alt="CAMSA" style={styles.logo} />
            <h1 style={styles.title}>Reserva</h1>
          </div>
        </header>
        <main style={styles.main}>
          <div style={styles.successCard}>
            <div style={styles.successIcon}>✓</div>
            <h2 style={styles.successTitle}>¡Reserva confirmada!</h2>
            <p style={styles.successText}>
              Este es un prototipo; no se procesaron pagos reales.
            </p>
            <button
              type="button"
              style={styles.btnShop}
              onClick={() => navigate(`/kiosk/${deviceId}/services`)}
            >
              Volver a servicios
            </button>
          </div>
        </main>
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
          onClick={() => navigate(`/kiosk/${deviceId}/services/${serviceId}`)}
        >
          ← Volver
        </button>
      </header>

      <main style={styles.main}>
        <div style={styles.layout}>
          <div style={styles.formSection}>
            <section style={styles.section}>
              <h2 style={styles.sectionTitle}>Fecha</h2>
              <CalendarPicker
                selectedDate={booking.date}
                onSelectDate={(d) => booking.setDate(d)}
                availableDays={service.availableDays}
              />
            </section>
            {booking.date && (
              <section style={styles.section}>
                <h2 style={styles.sectionTitle}>Horario</h2>
                <TimeSlotPicker
                  slots={slots}
                  selected={booking.timeSlot}
                  onSelect={(s) => booking.setTimeSlot(s)}
                  duration={service.duration}
                />
              </section>
            )}
            <section style={styles.section}>
              <label style={styles.label}>Notas (opcional)</label>
              <textarea
                value={booking.notes}
                onChange={(e) => booking.setNotes(e.target.value)}
                placeholder="Detalles adicionales..."
                style={styles.textarea}
              />
            </section>
            {canPay && (
              <section style={styles.section}>
                <h2 style={styles.sectionTitle}>Pago</h2>
                <PaymentForm onSubmit={handlePay} loading={loading} />
              </section>
            )}
          </div>
          <div style={styles.summarySection}>
            <div style={styles.summaryCard}>
              <h3 style={styles.summaryTitle}>Resumen</h3>
              <p style={styles.summaryService}>{service.name}</p>
              <p style={styles.summaryMeta}>
                {service.duration} min • {formatPrice(service.price)}
              </p>
              {booking.date && (
                <p style={styles.summaryMeta}>
                  Fecha: {booking.date.toLocaleDateString('es-MX')}
                </p>
              )}
              {booking.timeSlot && (
                <p style={styles.summaryMeta}>Hora: {booking.timeSlot}</p>
              )}
              <p style={styles.total}>{formatPrice(service.price)}</p>
            </div>
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
  main: { padding: '2rem', maxWidth: 900, margin: '0 auto' },
  layout: {
    display: 'grid',
    gridTemplateColumns: '1fr 340px',
    gap: 24,
  },
  formSection: { display: 'flex', flexDirection: 'column', gap: 24 },
  section: {},
  sectionTitle: { margin: '0 0 12px 0', fontSize: 18, color: colors.textPrimary },
  label: { display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 600 },
  textarea: {
    width: '100%',
    minHeight: 100,
    padding: 12,
    borderRadius: 8,
    border: `1px solid ${colors.border}`,
    fontSize: 15,
    fontFamily: 'inherit',
  },
  summarySection: { alignSelf: 'start', position: 'sticky', top: 24 },
  summaryCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 20,
    border: `1px solid ${colors.border}`,
  },
  summaryTitle: { margin: '0 0 12px 0', fontSize: 16, color: colors.textPrimary },
  summaryService: { margin: '0 0 8px 0', fontSize: 15, fontWeight: 600 },
  summaryMeta: { margin: '0 0 4px 0', fontSize: 14, color: colors.textSecondary },
  total: { marginTop: 12, fontSize: 20, fontWeight: 700, color: colors.primary },
  successCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 48,
    textAlign: 'center',
    maxWidth: 480,
    margin: '0 auto',
    boxShadow: `0 2px 12px ${colors.shadow}`,
  },
  successIcon: {
    width: 64,
    height: 64,
    borderRadius: '50%',
    backgroundColor: colors.success,
    color: colors.white,
    fontSize: 32,
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 24px',
  },
  successTitle: { margin: '0 0 12px 0', fontSize: 24, color: colors.textPrimary },
  successText: {
    margin: '0 0 24px 0',
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 1.5,
  },
  btnShop: {
    padding: '12px 24px',
    backgroundColor: colors.primary,
    color: colors.white,
    border: 'none',
    borderRadius: 8,
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
  },
};
