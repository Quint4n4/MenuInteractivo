import React, { useState, useMemo } from 'react';
import type { StoreProduct, Service } from '../../types/store';
import { getCartItems, type CartItem } from '../../hooks/useStoreCart';
import { CouponInput, type AppliedCoupon } from './CouponInput';
import { OrderSummary } from './OrderSummary';
import { colors } from '../../styles/colors';

export const STORE_PROTOTYPE_COUPON_KEY = 'store_prototype_coupon';

const formatPrice = (n: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n);

interface CartSidebarProps {
  cart: Map<number, CartItem>;
  cartVersion?: number;
  products: StoreProduct[];
  services?: Service[];
  onClose: () => void;
  onUpdateQuantity: (itemId: number, quantity: number) => void;
  onCheckout: () => void;
}

export const CartSidebar: React.FC<CartSidebarProps> = ({
  cart,
  cartVersion = 0,
  products,
  services = [],
  onClose,
  onUpdateQuantity,
  onCheckout,
}) => {
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  
  // Recalculate items when cart or cartVersion changes
  const items = useMemo(() => {
    return getCartItems(cart, products, services);
  }, [cart, cartVersion, products, services]);
  
  const subtotal = useMemo(() => {
    return items.reduce((s, { item, quantity }) => s + item.price * quantity, 0);
  }, [items]);

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
          <div style={styles.headerLeft}>
            <span style={styles.cartIcon}>🛒</span>
            <h2 style={styles.title}>Tu Carrito</h2>
            {items.length > 0 && (
              <span style={styles.cartBadge}>{items.reduce((s, { quantity }) => s + quantity, 0)}</span>
            )}
          </div>
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
                        onClick={() => onUpdateQuantity(item.id, Math.max(0, quantity - 1))}
                      >
                        −
                      </button>
                      <span style={styles.qty}>{quantity}</span>
                      <button
                        type="button"
                        style={styles.qtyBtn}
                        onClick={() => onUpdateQuantity(item.id, quantity + 1)}
                      >
                        +
                      </button>
                      <button
                        type="button"
                        style={styles.deleteBtn}
                        onClick={() => onUpdateQuantity(item.id, 0)}
                        aria-label="Eliminar"
                      >
                        🗑️
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
            <div style={styles.subtotalRow}>
              <span style={styles.subtotalLabel}>Subtotal</span>
              <span style={styles.subtotalAmount}>
                {formatPrice(subtotal)}
              </span>
            </div>
            <button type="button" style={styles.checkoutBtn} onClick={handleCheckout}>
              Proceder al Pago
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
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    position: 'relative',
  },
  cartIcon: {
    fontSize: 20,
  },
  title: { margin: 0, fontSize: 20, fontWeight: 700, color: colors.textPrimary },
  cartBadge: {
    width: 20,
    height: 20,
    borderRadius: '50%',
    backgroundColor: colors.primary,
    color: colors.white,
    fontSize: 11,
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
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
    gap: 12,
    padding: 12,
    backgroundColor: colors.cream,
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
  itemName: {
    fontSize: 14,
    fontWeight: 600,
    color: colors.textPrimary,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: 700,
    color: colors.primary,
  },
  reservationInfo: {
    marginTop: 4,
  },
  reservationText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  itemActions: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
  },
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
  deleteBtn: {
    width: 32,
    height: 32,
    borderRadius: 6,
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    fontSize: 16,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: colors.error,
  },
  couponSection: { marginTop: 8 },
  footer: {
    padding: 20,
    borderTop: `1px solid ${colors.border}`,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  subtotalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subtotalLabel: {
    fontSize: 16,
    fontWeight: 600,
    color: colors.textPrimary,
  },
  subtotalAmount: {
    fontSize: 18,
    fontWeight: 700,
    color: colors.textPrimary,
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
