import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MOCK_PRODUCTS } from '../../types/store';
import { useStoreCart, getCartProducts } from '../../hooks/useStoreCart';
import { getStoredCoupon, clearStoredCoupon } from '../../components/store/CartSidebar';
import { OrderSummary } from '../../components/store/OrderSummary';
import { PaymentForm } from '../../components/store/PaymentForm';
import { colors } from '../../styles/colors';
import logoHorizontal from '../../assets/logos/logo-horizontal.png';

/** Prototipo: solo mock. Sin API ni carrito del kiosk. Pasarela de pago simulada. */
export const KioskStoreCheckout: React.FC = () => {
  const { deviceId } = useParams<{ deviceId: string }>();
  const navigate = useNavigate();
  const { cart, clear } = useStoreCart();
  const coupon = getStoredCoupon();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const items = getCartProducts(cart, MOCK_PRODUCTS);
  const subtotal = items.reduce(
    (s, { product, quantity }) => s + product.price * quantity,
    0
  );

  const handlePay = () => {
    setLoading(true);
    // Simular procesamiento
    setTimeout(() => {
      clear();
      clearStoredCoupon();
      setLoading(false);
      setSuccess(true);
    }, 800);
  };

  if (items.length === 0 && !success) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: colors.ivory }}>
        <header style={styles.header}>
          <div style={styles.headerLeft}>
            <img src={logoHorizontal} alt="CAMSA" style={styles.logo} />
            <h1 style={styles.title}>Checkout</h1>
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
          <div style={styles.empty}>
            <p>No hay productos en el carrito.</p>
            <button
              type="button"
              style={styles.btnShop}
              onClick={() => navigate(`/kiosk/${deviceId}/store`)}
            >
              Ir a tienda
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (success) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: colors.ivory }}>
        <header style={styles.header}>
          <div style={styles.headerLeft}>
            <img src={logoHorizontal} alt="CAMSA" style={styles.logo} />
            <h1 style={styles.title}>Checkout</h1>
          </div>
        </header>
        <main style={styles.main}>
          <div style={styles.successCard}>
            <div style={styles.successIcon}>✓</div>
            <h2 style={styles.successTitle}>¡Compra realizada!</h2>
            <p style={styles.successText}>
              Gracias por tu compra. Este es un prototipo; no se procesaron pagos reales.
            </p>
            <button
              type="button"
              style={styles.btnShop}
              onClick={() => navigate(`/kiosk/${deviceId}/store`)}
            >
              Volver a tienda
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
          <h1 style={styles.title}>Checkout</h1>
        </div>
        <button
          type="button"
          style={styles.btnBack}
          onClick={() => navigate(`/kiosk/${deviceId}/store/cart`)}
        >
          ← Volver al carrito
        </button>
      </header>

      <main style={styles.main}>
        <div style={styles.layout}>
          <div style={styles.formSection}>
            <h2 style={styles.sectionTitle}>Datos de pago</h2>
            <PaymentForm onSubmit={handlePay} loading={loading} />
          </div>
          <div style={styles.summarySection}>
            <OrderSummary subtotal={subtotal} coupon={coupon} />
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
  title: { margin: 0, fontSize: 22, color: colors.white, fontWeight: 700 },
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
  empty: {
    textAlign: 'center',
    padding: 48,
    color: colors.textMuted,
  },
  btnShop: {
    marginTop: 16,
    padding: '12px 24px',
    backgroundColor: colors.primary,
    color: colors.white,
    border: 'none',
    borderRadius: 8,
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
  },
  layout: {
    display: 'grid',
    gridTemplateColumns: '1fr 340px',
    gap: 24,
  },
  formSection: {},
  sectionTitle: { margin: '0 0 16px 0', fontSize: 18, color: colors.textPrimary },
  summarySection: { alignSelf: 'start', position: 'sticky', top: 24 },
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
    lineHeight: 1,
  },
  successTitle: { margin: '0 0 12px 0', fontSize: 24, color: colors.textPrimary },
  successText: {
    margin: '0 0 24px 0',
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 1.5,
  },
};
