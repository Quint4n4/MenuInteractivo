import React from 'react';
import type { StoreProduct } from '../../types/store';
import { colors } from '../../styles/colors';

interface ProductDetailModalProps {
  product: StoreProduct;
  onClose: () => void;
  onAddToCart: (productId: number, qty?: number) => void;
  onBuyNow?: () => void;
}

const formatPrice = (n: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n);

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  onAddToCart,
  onBuyNow,
}) => {
  const [qty, setQty] = React.useState(1);
  const hasDiscount = product.originalPrice != null && product.originalPrice > product.price;

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
            {product.image ? (
              <img src={product.image} alt={product.name} style={styles.image} />
            ) : (
              <div style={styles.placeholder}>
                <span style={{ fontSize: 64 }}>🛍️</span>
              </div>
            )}
          </div>
          <div style={styles.info}>
            <h2 style={styles.title}>{product.name}</h2>
            <p style={styles.desc}>{product.description}</p>
            <div style={styles.priceRow}>
              {hasDiscount && (
                <span style={styles.originalPrice}>
                  {formatPrice(product.originalPrice!)}
                </span>
              )}
              <span style={styles.price}>{formatPrice(product.price)}</span>
            </div>
            <p style={styles.stock}>Stock: {product.stock}</p>
            <div style={styles.quantityRow}>
              <label style={styles.label}>Cantidad:</label>
              <input
                type="number"
                min={1}
                max={product.stock}
                value={qty}
                onChange={(e) => setQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
                style={styles.input}
              />
            </div>
            <div style={styles.actions}>
              <button
                type="button"
                style={styles.btnAdd}
                onClick={() => {
                  onAddToCart(product.id, qty);
                  onClose();
                }}
              >
                Agregar al carrito
              </button>
              <button
                type="button"
                style={styles.btnBuy}
                onClick={() => {
                  onAddToCart(product.id, qty);
                  onClose();
                  onBuyNow?.();
                }}
              >
                Comprar ahora
              </button>
            </div>
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
    maxWidth: 600,
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
  body: {
    display: 'flex',
    flexDirection: 'column',
    padding: 24,
  },
  imageWrap: {
    width: '100%',
    aspectRatio: '16/9',
    backgroundColor: colors.cream,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
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
  info: { display: 'flex', flexDirection: 'column', gap: 12 },
  title: { margin: 0, fontSize: 22, color: colors.textPrimary },
  desc: { margin: 0, fontSize: 15, color: colors.textSecondary, lineHeight: 1.5 },
  priceRow: { display: 'flex', alignItems: 'center', gap: 12 },
  originalPrice: {
    fontSize: 16,
    color: colors.textMuted,
    textDecoration: 'line-through',
  },
  price: { fontSize: 24, fontWeight: 'bold', color: colors.primary },
  stock: { margin: 0, fontSize: 14, color: colors.textMuted },
  quantityRow: { display: 'flex', alignItems: 'center', gap: 12 },
  label: { fontSize: 14, color: colors.textPrimary },
  input: {
    width: 80,
    padding: '8px 12px',
    borderRadius: 8,
    border: `1px solid ${colors.border}`,
    fontSize: 16,
  },
  actions: { display: 'flex', gap: 12, marginTop: 16 },
  btnAdd: {
    flex: 1,
    padding: 14,
    backgroundColor: colors.white,
    color: colors.primary,
    border: `2px solid ${colors.primary}`,
    borderRadius: 8,
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
  },
  btnBuy: {
    flex: 1,
    padding: 14,
    backgroundColor: colors.primary,
    color: colors.white,
    border: 'none',
    borderRadius: 8,
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
  },
};
