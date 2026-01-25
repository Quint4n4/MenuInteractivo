import React from 'react';
import type { StoreItem } from '../../types/store';
import { colors } from '../../styles/colors';

interface UnifiedItemCardProps {
  item: StoreItem;
  onAdd: (item: StoreItem) => void;
  onViewDetail?: (item: StoreItem) => void;
}

const formatPrice = (n: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n);

// Mapeo de categoryId a etiqueta de categoría para mostrar
const getCategoryLabel = (categoryId: string): string => {
  const labels: Record<string, string> = {
    'facial': 'TRATAMIENTO FACIAL',
    'corporal': 'TRATAMIENTO CORPORAL',
    'suplementos': 'SUPLEMENTO',
    'cuidado-casa': 'CUIDADO EN CASA',
  };
  return labels[categoryId] || 'PRODUCTO';
};

export const UnifiedItemCard: React.FC<UnifiedItemCardProps> = ({
  item,
  onAdd,
  onViewDetail,
}) => {
  const isService = item.type === 'service';
  const categoryLabel = getCategoryLabel(item.categoryId);

  return (
    <div style={styles.card}>
      <div style={styles.imageWrap}>
        {item.image ? (
          <img src={item.image} alt={item.name} style={styles.image} />
        ) : (
          <div style={styles.placeholder}>
            <span style={styles.placeholderText}>
              {isService ? '🏥' : '🛍️'}
            </span>
          </div>
        )}
        {/* Borde dorado decorativo para servicios */}
        {isService && <div style={styles.goldBorder} />}
      </div>
      <div style={styles.content}>
        <div style={styles.categoryTag}>{categoryLabel}</div>
        <h3 style={styles.title}>{item.name}</h3>
        <p style={styles.desc}>{item.description}</p>
        <div style={styles.footer}>
          <span style={styles.price}>{formatPrice(item.price)}</span>
          <button
            type="button"
            style={styles.addBtn}
            onClick={() => onAdd(item)}
          >
            {isService ? (
              <>
                <span style={styles.icon}>📅</span>
                <span>Añadir</span>
              </>
            ) : (
              <>
                <span style={styles.icon}>✓</span>
                <span>Añadir</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    boxShadow: `0 2px 8px ${colors.shadow}`,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    border: `1px solid ${colors.border}`,
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  imageWrap: {
    position: 'relative',
    width: '100%',
    aspectRatio: '16/9',
    backgroundColor: colors.cream,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    backgroundColor: colors.white,
  },
  placeholder: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cream,
  },
  placeholderText: { fontSize: 48 },
  goldBorder: {
    position: 'absolute',
    inset: 8,
    border: `2px solid ${colors.gold}`,
    borderRadius: 8,
    pointerEvents: 'none',
    boxShadow: `0 0 0 1px ${colors.goldLight} inset`,
  },
  content: {
    padding: 16,
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  categoryTag: {
    fontSize: 11,
    fontWeight: 600,
    color: colors.gold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  title: {
    margin: 0,
    fontSize: 16,
    fontWeight: 700,
    color: colors.textPrimary,
    lineHeight: 1.3,
  },
  desc: {
    margin: 0,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 1.4,
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
    flex: 1,
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    gap: 12,
  },
  price: {
    fontSize: 18,
    fontWeight: 700,
    color: colors.textPrimary,
    flex: 1,
  },
  addBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 12px',
    backgroundColor: colors.cream,
    color: colors.textPrimary,
    border: `1px solid ${colors.border}`,
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background-color 0.2s, border-color 0.2s',
    whiteSpace: 'nowrap',
  },
  icon: {
    fontSize: 14,
    display: 'inline-flex',
    alignItems: 'center',
  },
};
