import React from 'react';
import type { Service } from '../../types/store';
import { colors } from '../../styles/colors';

interface ServiceDetailModalProps {
  service: Service;
  onClose: () => void;
  onReserve: () => void;
}

const formatPrice = (n: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n);

export const ServiceDetailModal: React.FC<ServiceDetailModalProps> = ({
  service,
  onClose,
  onReserve,
}) => {
  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          style={styles.close}
          onClick={onClose}
          aria-label="Cerrar"
        >
          ✕
        </button>
        <div style={styles.body}>
          <div style={styles.imageWrap}>
            {service.image ? (
              <img src={service.image} alt={service.name} style={styles.image} />
            ) : (
              <div style={styles.placeholder}>
                <span style={{ fontSize: 64 }}>🏥</span>
              </div>
            )}
          </div>
          <div style={styles.info}>
            <h2 style={styles.title}>{service.name}</h2>
            <p style={styles.desc}>{service.description}</p>
            <div style={styles.meta}>
              <span style={styles.price}>{formatPrice(service.price)}</span>
              <span>{service.duration} min</span>
            </div>
            <p style={styles.days}>
              Días: {service.availableDays.join(', ')}
            </p>
            <p style={styles.slots}>
              Horarios: {service.timeSlots.join(', ')}
            </p>
            <button
              type="button"
              style={styles.btn}
              onClick={() => {
                onReserve();
                onClose();
              }}
            >
              Reservar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: colors.overlay,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: 16,
  },
  modal: {
    backgroundColor: colors.white,
    borderRadius: 16,
    maxWidth: 500,
    width: '100%',
    maxHeight: '90vh',
    overflow: 'auto',
    position: 'relative',
    boxShadow: `0 8px 32px ${colors.shadowDark}`,
  },
  close: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 44,
    height: 44,
    borderRadius: 8,
    border: 'none',
    backgroundColor: colors.grayBg,
    cursor: 'pointer',
    fontSize: 18,
    zIndex: 1,
  },
  body: { padding: 24 },
  imageWrap: {
    width: '100%',
    aspectRatio: '16/9',
    backgroundColor: '#E8F4F8',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  image: { width: '100%', height: '100%', objectFit: 'cover' },
  placeholder: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { display: 'flex', flexDirection: 'column', gap: 12 },
  title: { margin: 0, fontSize: 22, color: colors.textPrimary },
  desc: { margin: 0, fontSize: 15, color: colors.textSecondary, lineHeight: 1.5 },
  meta: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    fontSize: 16,
    color: colors.textMuted,
  },
  price: { fontSize: 20, fontWeight: 'bold', color: colors.primary },
  days: { margin: 0, fontSize: 14, color: colors.textSecondary },
  slots: { margin: 0, fontSize: 14, color: colors.textSecondary },
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
