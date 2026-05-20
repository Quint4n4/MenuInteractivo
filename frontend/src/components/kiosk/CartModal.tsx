import React, { useState } from 'react';
import type { Product } from '../../types';
import { useWindowSize } from '../../utils/responsive';
import { colors } from '../../styles/colors';

interface CartItem {
  product: Product;
  quantity: number;
}

interface CartModalProps {
  cart: Map<number, number>;
  products: Product[];
  onClose: () => void;
  onUpdateQuantity: (productId: number, quantity: number) => void;
  onCheckout: () => void;
  orderLimits?: { [key: string]: number };
  activeOrdersItems?: Map<string, number>;
  onLimitReached?: () => void;
}

export const CartModal: React.FC<CartModalProps> = ({
  cart,
  products,
  onClose,
  onUpdateQuantity,
  onCheckout,
  orderLimits = {},
  activeOrdersItems = new Map(),
  onLimitReached,
}) => {
  const { isMobile } = useWindowSize();
  const cartItems: CartItem[] = [];

  cart.forEach((quantity, productId) => {
    const product = products.find(p => p.id === productId);
    if (product && quantity > 0) {
      cartItems.push({ product, quantity });
    }
  });

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const handleIncrement = (productId: number, currentQty: number) => {
    // Find the product to check its category type
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const categoryType = product.category_type || 'OTHER';
    const limit = orderLimits[categoryType];

    // If there's a limit for this category, validate
    if (limit !== undefined) {
      // Count current items in cart for this category
      let cartCount = 0;
      cart.forEach((quantity, prodId) => {
        const cartProduct = products.find(p => p.id === prodId);
        if (cartProduct && cartProduct.category_type === categoryType) {
          // Add the increment for the current product
          if (prodId === productId) {
            cartCount += quantity + 1; // Include the new quantity
          } else {
            cartCount += quantity;
          }
        }
      });

      // Count items in active orders for this category
      const ordersCount = activeOrdersItems.get(categoryType) || 0;
      const totalCount = cartCount + ordersCount;

      console.log(`Validating limit for ${categoryType}: cart=${cartCount}, orders=${ordersCount}, total=${totalCount}, limit=${limit}`);

      if (totalCount > limit) {
        console.log(`Cannot increment: would exceed limit for ${categoryType}`);
        if (onLimitReached) {
          onLimitReached();
        }
        return;
      }
    }

    onUpdateQuantity(productId, currentQty + 1);
  };

  const handleDecrement = (productId: number, currentQty: number) => {
    if (currentQty > 1) {
      onUpdateQuantity(productId, currentQty - 1);
    } else {
      onUpdateQuantity(productId, 0); // Remove from cart
    }
  };

  const handleRemove = (productId: number) => {
    onUpdateQuantity(productId, 0);
  };

  const modalStyles = {
    ...styles.modal,
    ...(isMobile && responsiveStyles.modal),
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={modalStyles} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{ ...styles.header, ...(isMobile && responsiveStyles.header) }}>
          <h2 style={{ ...styles.title, ...(isMobile && responsiveStyles.title) }}>🛒 Tu Carrito</h2>
          <button style={{ ...styles.closeButton, ...(isMobile && responsiveStyles.closeButton) }} onClick={onClose} className="cart-close-btn">
            ✕
          </button>
        </div>

        {/* Cart Items */}
        <div style={{
          ...styles.itemsContainer,
          ...(isMobile && responsiveStyles.itemsContainer)
        }}>
          {cartItems.length === 0 ? (
            <div style={styles.emptyCart}>
              <div style={styles.emptyIcon}>🛒</div>
              <p style={styles.emptyText}>Tu carrito está vacío</p>
              <p style={styles.emptySubtext}>Agrega productos para comenzar tu orden</p>
            </div>
          ) : (
            <>
              {cartItems.map(({ product, quantity }) => (
                <div key={product.id} style={{
                  ...styles.cartItem,
                  ...(isMobile && responsiveStyles.cartItem)
                }}>
                  {/* Product Image */}
                  <div style={{
                    ...styles.itemImage,
                    ...(isMobile && responsiveStyles.itemImage)
                  }}>
                    {product.image_url_full ? (
                      <img
                        src={product.image_url_full}
                        alt={product.name}
                        style={styles.image}
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div style={styles.noImage}>Sin imagen</div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div style={{
                    ...styles.itemInfo,
                    ...(isMobile && responsiveStyles.itemInfo)
                  }}>
                    <h3 style={{
                      ...styles.itemName,
                      ...(isMobile && responsiveStyles.itemName)
                    }}>{product.name}</h3>
                    <p style={{
                      ...styles.itemUnit,
                      ...(isMobile && responsiveStyles.itemUnit)
                    }}>{product.unit_label}</p>
                  </div>

                  {/* Quantity Controls and Remove Button Container */}
                  <div style={{
                    ...styles.controlsContainer,
                    ...(isMobile && responsiveStyles.controlsContainer)
                  }}>
                    {/* Quantity Controls */}
                    <div style={{
                      ...styles.quantityControls,
                      ...(isMobile && responsiveStyles.quantityControls)
                    }}>
                      <button
                        style={{
                          ...styles.quantityButton,
                          ...(isMobile && responsiveStyles.quantityButton)
                        }}
                        onClick={() => handleDecrement(product.id, quantity)}
                        className="cart-qty-btn"
                      >
                        −
                      </button>
                      <span style={{
                        ...styles.quantity,
                        ...(isMobile && responsiveStyles.quantity)
                      }}>{quantity}</span>
                      <button
                        style={{
                          ...styles.quantityButton,
                          ...(isMobile && responsiveStyles.quantityButton)
                        }}
                        onClick={() => handleIncrement(product.id, quantity)}
                        className="cart-qty-btn"
                      >
                        +
                      </button>
                    </div>

                    {/* Remove Button */}
                    <button
                      style={{
                        ...styles.removeButton,
                        ...(isMobile && responsiveStyles.removeButton)
                      }}
                      onClick={() => handleRemove(product.id)}
                      className="cart-remove-btn"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Footer */}
        {cartItems.length > 0 && (
          <div style={{
            ...styles.footer,
            ...(isMobile && responsiveStyles.footer)
          }}>
            <div style={{
              ...styles.summary,
              ...(isMobile && responsiveStyles.summary)
            }}>
              <span style={{
                ...styles.summaryLabel,
                ...(isMobile && responsiveStyles.summaryLabel)
              }}>Total de items:</span>
              <span style={{
                ...styles.summaryValue,
                ...(isMobile && responsiveStyles.summaryValue)
              }}>{totalItems}</span>
            </div>
            <button style={{
              ...styles.checkoutButton,
              ...(isMobile && responsiveStyles.checkoutButton)
            }} onClick={onCheckout} className="cart-checkout-btn">
              Confirmar Orden
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.overlay,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    // B2 fix: el toast 'AddToCartNotification' usa zIndex 2000 y en mobile
    // se posiciona en bottom: 16px -> tapaba el boton 'Confirmar Orden'
    // del carrito. Subimos a 2100 para que el modal quede ENCIMA del toast.
    zIndex: 2100,
  },
  modal: {
    backgroundColor: colors.white,
    borderRadius: '20px',
    maxWidth: '600px',
    width: '90%',
    maxHeight: '80vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: `0 20px 60px ${colors.shadowGold}`,
    border: `2px solid ${colors.primaryMuted}`,
  },
  header: {
    padding: '24px',
    borderBottom: `2px solid ${colors.primaryMuted}`,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.cream,
    borderRadius: '18px 18px 0 0',
  },
  title: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: colors.textPrimary,
    margin: 0,
  },
  closeButton: {
    width: '40px',
    height: '40px',
    minWidth: '40px',
    minHeight: '40px',
    flexShrink: 0,
    borderRadius: '50%',
    border: `1px solid ${colors.primaryMuted}`,
    backgroundColor: colors.white,
    color: colors.textSecondary,
    fontSize: '18px',
    fontWeight: 400,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s',
  },
  itemsContainer: {
    flex: 1,
    overflowY: 'auto',
    padding: '16px 24px',
    backgroundColor: colors.ivory,
    boxSizing: 'border-box',
  },
  emptyCart: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 20px',
  },
  emptyIcon: {
    fontSize: '64px',
    marginBottom: '16px',
    opacity: 0.5,
  },
  emptyText: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: colors.textSecondary,
    margin: '0 0 8px 0',
  },
  emptySubtext: {
    fontSize: '14px',
    color: colors.textMuted,
    margin: 0,
  },
  cartItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px',
    backgroundColor: colors.white,
    borderRadius: '12px',
    marginBottom: '12px',
    border: `1px solid ${colors.primaryMuted}`,
    boxShadow: `0 2px 8px ${colors.shadow}`,
    position: 'relative',
    width: '100%',
    boxSizing: 'border-box',
  },
  controlsContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: '8px',
    flexShrink: 0,
    width: 'auto',
  },
  itemImage: {
    width: '80px',
    height: '80px',
    flexShrink: 0,
    borderRadius: '10px',
    overflow: 'hidden',
    border: `1px solid ${colors.primaryMuted}`,
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
  },
  noImage: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cream,
    fontSize: '12px',
    color: colors.textMuted,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: '16px',
    fontWeight: '600',
    color: colors.textPrimary,
    margin: '0 0 4px 0',
  },
  itemUnit: {
    fontSize: '14px',
    color: colors.textSecondary,
    margin: 0,
  },
  quantityControls: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: colors.primaryMuted,
    borderRadius: '10px',
    padding: '6px',
    border: `1px solid ${colors.primary}`,
  },
  quantityButton: {
    width: '34px',
    height: '34px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: colors.white,
    color: colors.primary,
    fontSize: '18px',
    fontWeight: 'bold',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s',
  },
  quantity: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: colors.primaryDark,
    minWidth: '32px',
    textAlign: 'center',
  },
  removeButton: {
    width: '36px',
    height: '36px',
    minWidth: '36px',
    flexShrink: 0,
    borderRadius: '8px',
    border: 'none',
    backgroundColor: colors.cream,
    color: colors.textMuted,
    fontSize: '16px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s',
  },
  footer: {
    padding: '24px',
    borderTop: `2px solid ${colors.primaryMuted}`,
    backgroundColor: colors.cream,
    borderRadius: '0 0 18px 18px',
  },
  summary: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
    padding: '16px',
    backgroundColor: colors.white,
    borderRadius: '12px',
    border: `1px solid ${colors.primaryMuted}`,
  },
  summaryLabel: {
    fontSize: '16px',
    color: colors.textSecondary,
  },
  summaryValue: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: colors.primary,
  },
  checkoutButton: {
    width: '100%',
    padding: '16px',
    backgroundColor: colors.white,
    color: colors.primary,
    border: `2px solid ${colors.primary}`,
    borderRadius: '12px',
    fontSize: '18px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
};

// Responsive styles for mobile
const responsiveStyles: { [key: string]: React.CSSProperties } = {
  modal: {
    width: '100%',
    maxWidth: '100%',
    height: '100vh',
    maxHeight: '100vh',
    borderRadius: 0,
    margin: 0,
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    padding: '12px 16px',
  },
  title: {
    fontSize: '18px',
  },
  closeButton: {
    width: '36px',
    height: '36px',
    minWidth: '36px',
    minHeight: '36px',
    fontSize: '16px',
  },
  cartItem: {
    gap: '8px',
    padding: '10px',
    marginBottom: '8px',
    flexWrap: 'nowrap',
    alignItems: 'center',
    width: '100%',
    boxSizing: 'border-box',
  },
  itemImage: {
    width: '40px',
    height: '40px',
    flexShrink: 0,
    borderRadius: '8px',
  },
  itemInfo: {
    flex: 1,
    minWidth: 0,
    maxWidth: 'none',
    overflow: 'hidden',
    paddingRight: '8px',
  },
  itemName: {
    fontSize: '13px',
    lineHeight: '1.3',
    wordBreak: 'break-word',
    marginBottom: '2px',
  },
  itemUnit: {
    fontSize: '10px',
  },
  controlsContainer: {
    flexDirection: 'row',
    gap: '6px',
    alignItems: 'center',
    flexShrink: 0,
    width: 'auto',
  },
  quantityControls: {
    gap: '4px',
    padding: '3px',
  },
  quantityButton: {
    width: '24px',
    height: '24px',
    fontSize: '12px',
  },
  quantity: {
    fontSize: '12px',
    minWidth: '18px',
  },
  removeButton: {
    width: '32px',
    height: '32px',
    minWidth: '32px',
    fontSize: '14px',
    padding: 0,
  },
  itemsContainer: {
    padding: '12px',
    overflowY: 'auto',
    flex: 1,
    minHeight: 0,
  },
  footer: {
    padding: '16px',
  },
  summary: {
    padding: '12px',
    marginBottom: '12px',
  },
  summaryLabel: {
    fontSize: '14px',
  },
  summaryValue: {
    fontSize: '20px',
  },
  checkoutButton: {
    padding: '12px',
    fontSize: '16px',
  },
};

// Add hover effects for buttons (override responsive.css full-width on mobile)
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  .cart-close-btn {
    width: 40px !important;
    min-width: 40px !important;
    max-width: 40px !important;
    height: 40px !important;
  }
  @media (max-width: 767px) {
    .cart-close-btn {
      width: 36px !important;
      min-width: 36px !important;
      max-width: 36px !important;
      height: 36px !important;
    }
  }
  .cart-close-btn:hover {
    background-color: ${colors.primary} !important;
    color: ${colors.white} !important;
    transform: scale(1.05);
  }

  .cart-remove-btn {
    width: 36px !important;
    min-width: 36px !important;
    max-width: 36px !important;
    height: 36px !important;
  }
  @media (max-width: 767px) {
    .cart-remove-btn {
      width: 32px !important;
      min-width: 32px !important;
      max-width: 32px !important;
      height: 32px !important;
    }
  }
  .cart-remove-btn:hover {
    background-color: ${colors.primaryMuted} !important;
    color: ${colors.error} !important;
  }

  .cart-qty-btn:hover {
    background-color: ${colors.primary} !important;
    color: ${colors.white} !important;
    transform: scale(1.08);
  }

  .cart-qty-btn:active {
    background-color: ${colors.primaryDark} !important;
    transform: scale(0.95);
  }


  .cart-checkout-btn:hover {
    background-color: ${colors.primary} !important;
    color: ${colors.white} !important;
    transform: scale(1.02);
    box-shadow: 0 4px 16px ${colors.shadowGold} !important;
  }

  .cart-checkout-btn:active {
    background-color: ${colors.primaryDark} !important;
    transform: scale(0.98);
  }
`;
if (!document.head.querySelector('[data-cart-modal-styles]')) {
  styleSheet.setAttribute('data-cart-modal-styles', 'true');
  document.head.appendChild(styleSheet);
}
