import React, { useState } from 'react';
import type { StoreProduct } from '../../types/store';
import { getCartProducts } from '../../hooks/useStoreCart';
import { CouponInput, type AppliedCoupon } from './CouponInput';
import { OrderSummary } from './OrderSummary';
import { colors } from '../../styles/colors';

export const STORE_PROTOTYPE_COUPON_KEY = 'store_prototype_coupon';

const formatPrice = (n: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n);

interface CartSidebarProps {
  cart: Map<number, number>;
  products: StoreProduct[];
  onClose: () => void;
  onUpdateQuantity: (productId: number, quantity: number) => void;
  onCheckout: () => void;
}

export const CartSidebar: React.FC<CartSidebarProps> = ({
  cart,
  products,
  onClose,
  onUpdateQuantity,
  onCheckout,
}) => {
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const items = getCartProducts(cart, products);
  const subtotal = items.reduce((s, { product, quantity }) => s + product.price * quantity, 0);

  const handleCheckout = () => {
    if (appliedCoupon) {
      try {
        sessionStorage.setItem(STORE_PROTOTYPE_COUPON_KEY, JSON.stringify(appliedCoupon));
      } catch (e) {
        console.warn('Could not persist coupon', e);
      }
    } else {
      sessionStorage.removeItem(STORE_PROTOTYPE_COUPON_KEY);
    }
    onCheckout();
  };

  return (
    <>
      <div style={styles.overlay} onClick={onClose} aria-hidden="true" />
      <aside style={styles.sidebar}>
        <div style={styles.header}>
          <h2 style={styles.title}>Carrito</h2>
          <button type="button" style={styles.close} onClick={onClose} aria-label="Cerrar">
            ✕
          </button>
        </div>
        <div style={styles.body}>
          {items.length === 0 ? (
            <p style={styles.empty}>El carrito está vacío</p>
          ) : (
            <>
              <ul style={styles.list}>
                {items.map(({ product, quantity }) => (
                  <li key={product.id} style={styles.item}>
                    <div style={styles.itemInfo}>
                      <span style={styles.itemName}>{product.name}</span>
                      <span style={styles.itemPrice}>
                        {formatPrice(product.price)} × {quantity}
                      </span>
                    </div>
                    <div style={styles.itemActions}>
                      <button
                        type="button"
                        style={styles.qtyBtn}
                        onClick={() => onUpdateQuantity(product.id, Math.max(0, quantity - 1))}
                      >
                        −
                      </button>
                      <span style={styles.qty}>{quantity}</span>
                      <button
                        type="button"
                        style={styles.qtyBtn}
                        onClick={() => onUpdateQuantity(product.id, quantity + 1)}
                      >
                        +
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
              <div style={styles.couponSection}>
                <CouponInput
                  onApply={setAppliedCoupon}
                  applied={appliedCoupon}
                />
              </div>
              <OrderSummary subtotal={subtotal} coupon={appliedCoupon} />
            </>
          )}
        </div>
        {items.length > 0 && (
          <div style={styles.footer}>
            <button type="button" style={styles.checkoutBtn} onClick={handleCheckout}>
              Proceder al pago
            </button>
          </div>
        )}
      </aside>
    </>
  );
};

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: colors.overlay,
    zIndex: 999,
  },
  sidebar: {
    position: 'fixed',
    top: 0,
    right: 0,
    width: '100%',
    maxWidth: 400,
    height: '100%',
    backgroundColor: colors.white,
    boxShadow: `-4px 0 24px ${colors.shadowDark}`,
    zIndex: 1000,
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    borderBottom: `1px solid ${colors.border}`,
  },
  title: { margin: 0, fontSize: 20, fontWeight: 700, color: colors.textPrimary },
  close: {
    width: 44,
    height: 44,
    borderRadius: 8,
    border: 'none',
    backgroundColor: colors.grayBg,
    cursor: 'pointer',
    fontSize: 18,
  },
  body: {
    flex: 1,
    overflow: 'auto',
    padding: 20,
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
  },
  empty: {
    margin: 0,
    color: colors.textMuted,
    textAlign: 'center',
    padding: 32,
  },
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
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: colors.ivory,
    borderRadius: 12,
    border: `1px solid ${colors.border}`,
  },
  itemInfo: { display: 'flex', flexDirection: 'column', gap: 4 },
  itemName: { fontSize: 14, fontWeight: 600, color: colors.textPrimary },
  itemPrice: { fontSize: 13, color: colors.textSecondary },
  itemActions: { display: 'flex', alignItems: 'center', gap: 8 },
  qtyBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    border: `1px solid ${colors.border}`,
    backgroundColor: colors.white,
    cursor: 'pointer',
    fontSize: 18,
  },
  qty: { minWidth: 24, textAlign: 'center', fontWeight: 600 },
  couponSection: { marginTop: 8 },
  footer: {
    padding: 20,
    borderTop: `1px solid ${colors.border}`,
  },
  checkoutBtn: {
    width: '100%',
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

export function getStoredCoupon(): AppliedCoupon | null {
  try {
    const raw = sessionStorage.getItem(STORE_PROTOTYPE_COUPON_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AppliedCoupon;
    if (parsed?.code && typeof parsed.discountPercent === 'number') return parsed;
  } catch (e) {
    console.warn('Could not read stored coupon', e);
  }
  return null;
}

export function clearStoredCoupon(): void {
  sessionStorage.removeItem(STORE_PROTOTYPE_COUPON_KEY);
}
