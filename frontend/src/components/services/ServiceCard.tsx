import React from 'react';
import type { Service } from '../../types/store';
import { colors } from '../../styles/colors';

interface ServiceCardProps {
  service: Service;
  onViewDetail?: (serviceId: number) => void;
  onReserve?: (serviceId: number) => void;
}

const formatPrice = (n: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n);

export const ServiceCard: React.FC<ServiceCardProps> = ({
  service,
  onViewDetail,
  onReserve,
}) => {
  return (
    <div style={styles.card}>
      <div style={styles.imageWrap}>
        {service.image ? (
          <img src={service.image} alt={service.name} style={styles.image} />
        ) : (
          <div style={styles.placeholder}>
            <span style={styles.placeholderIcon}>🏥</span>
          </div>
        )}
      </div>
      <div style={styles.content}>
        <h3 style={styles.title}>{service.name}</h3>
        <p style={styles.desc}>{service.description}</p>
        <div style={styles.meta}>
          <span>{formatPrice(service.price)}</span>
          <span>•</span>
          <span>{service.duration} min</span>
        </div>
        <div style={styles.actions}>
          {onViewDetail && (
            <button
              type="button"
              style={{ ...styles.btn, ...styles.btnSecondary }}
              onClick={() => onViewDetail(service.id)}
            >
              Ver más
            </button>
          )}
          {onReserve && (
            <button
              type="button"
              style={styles.btn}
              onClick={() => onReserve(service.id)}
            >
              Reservar
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    boxShadow: `0 2px 8px ${colors.shadow}`,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    border: `1px solid ${colors.primaryMuted}`,
    minHeight: 300,
  },
  imageWrap: {
    width: '100%',
    aspectRatio: '16/9',
    backgroundColor: '#E8F4F8',
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  placeholder: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderIcon: { fontSize: 48 },
  content: {
    padding: 16,
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  title: {
    margin: 0,
    fontSize: 17,
    fontWeight: 600,
    color: colors.textPrimary,
  },
  desc: {
    margin: 0,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 1.4,
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
    flex: 1,
  },
  meta: {
    fontSize: 14,
    color: colors.textMuted,
    display: 'flex',
    gap: 8,
  },
  actions: { display: 'flex', gap: 8, marginTop: 8 },
  btn: {
    flex: 1,
    padding: '12px 16px',
    backgroundColor: colors.primary,
    color: colors.white,
    border: 'none',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },
  btnSecondary: {
    backgroundColor: colors.white,
    color: colors.primary,
    border: `2px solid ${colors.primary}`,
  },
};
