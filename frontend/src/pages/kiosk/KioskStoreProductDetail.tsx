import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MOCK_PRODUCTS } from '../../types/store';
import { useStoreCart } from '../../hooks/useStoreCart';
import { colors } from '../../styles/colors';
import logoHorizontal from '../../assets/logos/logo-horizontal.png';

const formatPrice = (n: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n);

/** Prototipo: solo mock. Sin API ni carrito del kiosk. */
export const KioskStoreProductDetail: React.FC = () => {
  const { deviceId, productId } = useParams<{ deviceId: string; productId: string }>();
  const navigate = useNavigate();
  const { add } = useStoreCart();
  const [qty, setQty] = useState(1);

  const product = MOCK_PRODUCTS.find((p) => p.id === parseInt(productId || '0', 10));

  if (!product) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Producto no encontrado.</p>
        <button
          type="button"
          onClick={() => navigate(`/kiosk/${deviceId}/store`)}
          style={{ marginTop: 16, padding: '10px 20px', cursor: 'pointer' }}
        >
          Volver a tienda
        </button>
      </div>
    );
  }

  const hasDiscount = product.originalPrice != null && product.originalPrice > product.price;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: colors.ivory }}>
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <img src={logoHorizontal} alt="CAMSA" style={styles.logo} />
          <h1 style={styles.title}>{product.name}</h1>
        </div>
        <button
          type="button"
          style={styles.btnBack}
          onClick={() => navigate(`/kiosk/${deviceId}/store`)}
        >
          ← Volver
        </button>
      </header>

      <main style={styles.main}>
        <div style={styles.card}>
          <div style={styles.imageWrap}>
            {product.image ? (
              <img src={product.image} alt={product.name} style={styles.image} />
            ) : (
              <div style={styles.placeholder}>🛍️</div>
            )}
          </div>
          <div style={styles.info}>
            <h2 style={styles.name}>{product.name}</h2>
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
            <div style={styles.actions}>
              <label style={styles.label}>Cantidad:</label>
              <input
                type="number"
                min={1}
                max={product.stock}
                value={qty}
                onChange={(e) =>
                  setQty(Math.max(1, parseInt(e.target.value, 10) || 1))
                }
                style={styles.input}
              />
              <button
                type="button"
                style={styles.btnAdd}
                onClick={() => {
                  add(product.id, qty);
                }}
              >
                Agregar al carrito
              </button>
              <button
                type="button"
                style={styles.btnBuy}
                onClick={() => {
                  add(product.id, qty);
                  navigate(`/kiosk/${deviceId}/store/cart`);
                }}
              >
                Comprar ahora
              </button>
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
  main: {
    padding: '2rem',
    maxWidth: 800,
    margin: '0 auto',
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    overflow: 'hidden',
    boxShadow: `0 2px 12px ${colors.shadow}`,
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 24,
  },
  imageWrap: {
    aspectRatio: '1',
    backgroundColor: colors.cream,
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
  info: { padding: 24, display: 'flex', flexDirection: 'column', gap: 16 },
  name: { margin: 0, fontSize: 24, color: colors.textPrimary },
  desc: { margin: 0, fontSize: 15, color: colors.textSecondary, lineHeight: 1.5 },
  priceRow: { display: 'flex', gap: 12, alignItems: 'center' },
  originalPrice: {
    fontSize: 16,
    color: colors.textMuted,
    textDecoration: 'line-through',
  },
  price: { fontSize: 24, fontWeight: 'bold', color: colors.primary },
  stock: { margin: 0, fontSize: 14, color: colors.textMuted },
  actions: { display: 'flex', flexDirection: 'column', gap: 12, marginTop: 'auto' },
  label: { fontSize: 14, fontWeight: 600 },
  input: {
    width: 100,
    padding: 12,
    borderRadius: 8,
    border: `1px solid ${colors.border}`,
    fontSize: 16,
  },
  btnAdd: {
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
