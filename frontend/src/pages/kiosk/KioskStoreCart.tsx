import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MOCK_PRODUCTS, MOCK_SERVICES } from '../../types/store';
import { useStoreCart, getCartItems } from '../../hooks/useStoreCart';
import { CouponInput, type AppliedCoupon } from '../../components/store/CouponInput';
import { OrderSummary } from '../../components/store/OrderSummary';
import {
  getStoredCoupon,
  STORE_PROTOTYPE_COUPON_KEY,
} from '../../components/store/CartSidebar';
import { colors } from '../../styles/colors';
import logoHorizontal from '../../assets/logos/logo-horizontal.png';

const formatPrice = (n: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n);

/** Prototipo: solo mock. Sin API ni carrito del kiosk. */
export const KioskStoreCart: React.FC = () => {
  const { deviceId } = useParams<{ deviceId: string }>();
  const navigate = useNavigate();
  const { cart, cartVersion, update } = useStoreCart();
  const [coupon, setCoupon] = useState<AppliedCoupon | null>(() =>
    getStoredCoupon()
  );

  // Recalculate items when cart or cartVersion changes
  const items = useMemo(() => {
    return getCartItems(cart, MOCK_PRODUCTS, MOCK_SERVICES);
  }, [cart, cartVersion]);

  const subtotal = useMemo(() => {
    return items.reduce(
      (s, { item, quantity }) => s + item.price * quantity,
      0
    );
  }, [items]);

  const handleCheckout = () => {
    if (coupon) {
      try {
        sessionStorage.setItem(STORE_PROTOTYPE_COUPON_KEY, JSON.stringify(coupon));
      } catch (e) {
        console.warn('Could not persist coupon', e);
      }
    } else {
      sessionStorage.removeItem(STORE_PROTOTYPE_COUPON_KEY);
    }
    navigate(`/kiosk/${deviceId}/store/checkout`);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: colors.ivory }}>
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <img src={logoHorizontal} alt="CAMSA" style={styles.logo} />
          <h1 style={styles.title}>Carrito</h1>
        </div>
        <button
          type="button"
          style={styles.btnBack}
          onClick={() => navigate(`/kiosk/${deviceId}/store`)}
        >
          ← Volver a tienda
        </button>
      </header>

      <main style={styles.main}>
        {items.length === 0 ? (
          <div style={styles.empty}>
            <p>El carrito está vacío.</p>
            <button
              type="button"
              style={styles.btnShop}
              onClick={() => navigate(`/kiosk/${deviceId}/store`)}
            >
              Ir a tienda
            </button>
          </div>
        ) : (
          <div style={styles.content}>
            <div style={styles.listSection}>
              <h2 style={styles.sectionTitle}>Productos</h2>
              <ul style={styles.list}>
                {items.map(({ item, quantity, reservationDate, reservationTime }) => (
                  <li key={`${item.type}-${item.id}`} style={styles.item}>
                    {item.image && (
                      <img src={item.image} alt={item.name} style={styles.itemImage} />
                    )}
                    <div style={styles.itemInfo}>
                      <span style={styles.itemName}>{item.name}</span>
                      <span style={styles.itemPrice}>
                        {formatPrice(item.price)}
                        {quantity > 1 && ` × ${quantity}`}
                      </span>
                      {item.type === 'service' && reservationDate && reservationTime && (
                        <div style={styles.reservationInfo}>
                          <span style={styles.reservationText}>
                            📅 {reservationDate.toLocaleDateString('es-MX')} a las {reservationTime}
                          </span>
                        </div>
                      )}
                    </div>
                    <div style={styles.itemActions}>
                      <button
                        type="button"
                        style={styles.qtyBtn}
                        onClick={() =>
                          update(item.id, Math.max(0, quantity - 1))
                        }
                      >
                        −
                      </button>
                      <span style={styles.qty}>{quantity}</span>
                      <button
                        type="button"
                        style={styles.qtyBtn}
                        onClick={() => update(item.id, quantity + 1)}
                      >
                        +
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
              <div style={styles.couponSection}>
                <CouponInput onApply={setCoupon} applied={coupon} />
              </div>
            </div>
            <div style={styles.summarySection}>
              <OrderSummary subtotal={subtotal} coupon={coupon} />
              <button
                type="button"
                style={styles.checkoutBtn}
                onClick={handleCheckout}
              >
                Proceder al pago
              </button>
            </div>
          </div>
        )}
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
    cursor: 'pointer',
  },
  content: {
    display: 'grid',
    gridTemplateColumns: '1fr 340px',
    gap: 24,
  },
  listSection: { display: 'flex', flexDirection: 'column', gap: 16 },
  sectionTitle: { margin: 0, fontSize: 18, color: colors.textPrimary },
  list: {
    margin: 0,
    padding: 0,
    listStyle: 'none',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  item: {
    display: 'flex',
    gap: 12,
    padding: 16,
    backgroundColor: colors.white,
    borderRadius: 12,
    border: `1px solid ${colors.border}`,
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    objectFit: 'cover',
    flexShrink: 0,
  },
  itemInfo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    minWidth: 0,
  },
  itemName: { fontSize: 15, fontWeight: 600, color: colors.textPrimary },
  itemPrice: { fontSize: 14, fontWeight: 700, color: colors.primary },
  reservationInfo: {
    marginTop: 4,
  },
  reservationText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  itemActions: { display: 'flex', alignItems: 'center', gap: 10 },
  qtyBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    border: `1px solid ${colors.border}`,
    backgroundColor: colors.white,
    cursor: 'pointer',
    fontSize: 18,
  },
  qty: { minWidth: 28, textAlign: 'center', fontWeight: 600 },
  couponSection: { marginTop: 8 },
  summarySection: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    alignSelf: 'start',
    position: 'sticky',
    top: 24,
  },
  checkoutBtn: {
    padding: 16,
    backgroundColor: colors.primary,
    color: colors.white,
    border: 'none',
    borderRadius: 8,
    fontSize: 16,
    fontWeight: 600,
    cursor: 'pointer',
  },
};
