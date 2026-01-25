import React from 'react';
import type { StoreProduct } from '../../types/store';
import { colors } from '../../styles/colors';

interface ProductCardProps {
  product: StoreProduct;
  onAddToCart: (productId: number) => void;
  onViewDetail?: (productId: number) => void;
}

const formatPrice = (n: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n);

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onAddToCart,
  onViewDetail,
}) => {
  const hasDiscount = product.originalPrice != null && product.originalPrice > product.price;

  return (
    <div style={styles.card}>
      <div style={styles.imageWrap}>
        {product.image ? (
          <img src={product.image} alt={product.name} style={styles.image} />
        ) : (
          <div style={styles.placeholder}>
            <span style={styles.placeholderText}>🛍️</span>
          </div>
        )}
        {hasDiscount && (
          <div style={styles.badge}>Descuento</div>
        )}
      </div>
      <div style={styles.content}>
        <h3 style={styles.title}>{product.name}</h3>
        <p style={styles.desc}>{product.description}</p>
        <div style={styles.priceRow}>
          {hasDiscount && (
            <span style={styles.originalPrice}>
              {formatPrice(product.originalPrice!)}
            </span>
          )}
          <span style={styles.price}>{formatPrice(product.price)}</span>
        </div>
        <div style={styles.actions}>
          {onViewDetail && (
            <button
              type="button"
              style={{ ...styles.btn, ...styles.btnSecondary }}
              onClick={() => onViewDetail(product.id)}
            >
              Ver detalles
            </button>
          )}
          <button
            type="button"
            style={styles.btn}
            onClick={() => onAddToCart(product.id)}
          >
            Agregar al carrito
          </button>
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
    minHeight: 320,
  },
  imageWrap: {
    position: 'relative',
    width: '100%',
    aspectRatio: '16/9',
    backgroundColor: colors.cream,
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
    backgroundColor: colors.cream,
  },
  placeholderText: { fontSize: 48 },
  badge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: colors.warning,
    color: colors.white,
    padding: '6px 12px',
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 'bold',
  },
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
  priceRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  originalPrice: {
    fontSize: 14,
    color: colors.textMuted,
    textDecoration: 'line-through',
  },
  price: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
  },
  actions: {
    display: 'flex',
    gap: 8,
    marginTop: 8,
  },
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
