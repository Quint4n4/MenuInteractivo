import React, { useState } from 'react';
import type { Product } from '../../types';
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

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={styles.header}>
          <h2 style={styles.title}>🛒 Tu Carrito</h2>
          <button style={styles.closeButton} onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Cart Items */}
        <div style={styles.itemsContainer}>
          {cartItems.length === 0 ? (
            <div style={styles.emptyCart}>
              <div style={styles.emptyIcon}>🛒</div>
              <p style={styles.emptyText}>Tu carrito está vacío</p>
              <p style={styles.emptySubtext}>Agrega productos para comenzar tu orden</p>
            </div>
          ) : (
            <>
              {cartItems.map(({ product, quantity }) => (
                <div key={product.id} style={styles.cartItem}>
                  {/* Product Image */}
                  <div style={styles.itemImage}>
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
                  <div style={styles.itemInfo}>
                    <h3 style={styles.itemName}>{product.name}</h3>
                    <p style={styles.itemUnit}>{product.unit_label}</p>
                  </div>

                  {/* Quantity Controls */}
                  <div style={styles.quantityControls}>
                    <button
                      style={styles.quantityButton}
                      onClick={() => handleDecrement(product.id, quantity)}
                    >
                      −
                    </button>
                    <span style={styles.quantity}>{quantity}</span>
                    <button
                      style={styles.quantityButton}
                      onClick={() => handleIncrement(product.id, quantity)}
                    >
                      +
                    </button>
                  </div>

                  {/* Remove Button */}
                  <button
                    style={styles.removeButton}
                    onClick={() => handleRemove(product.id)}
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Footer */}
        {cartItems.length > 0 && (
          <div style={styles.footer}>
            <div style={styles.summary}>
              <span style={styles.summaryLabel}>Total de items:</span>
              <span style={styles.summaryValue}>{totalItems}</span>
            </div>
            <button style={styles.checkoutButton} onClick={onCheckout}>
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
    zIndex: 1000,
  },
  modal: {
    backgroundColor: colors.white,
    borderRadius: '16px',
    maxWidth: '600px',
    width: '90%',
    maxHeight: '80vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: `0 20px 60px ${colors.shadowDark}`,
  },
  header: {
    padding: '24px',
    borderBottom: `1px solid ${colors.grayBg}`,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: colors.black,
    margin: 0,
  },
  closeButton: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    border: 'none',
    backgroundColor: colors.grayBg,
    color: colors.gray,
    fontSize: '20px',
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
    opacity: 0.3,
  },
  emptyText: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: colors.gray,
    margin: '0 0 8px 0',
  },
  emptySubtext: {
    fontSize: '14px',
    color: colors.grayLight,
    margin: 0,
  },
  cartItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '16px',
    backgroundColor: colors.grayBg,
    borderRadius: '12px',
    marginBottom: '12px',
  },
  itemImage: {
    width: '80px',
    height: '80px',
    flexShrink: 0,
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    borderRadius: '8px',
  },
  noImage: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderRadius: '8px',
    fontSize: '12px',
    color: colors.grayLight,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: colors.black,
    margin: '0 0 4px 0',
  },
  itemUnit: {
    fontSize: '14px',
    color: colors.gray,
    margin: 0,
  },
  quantityControls: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: colors.white,
    borderRadius: '8px',
    padding: '4px',
  },
  quantityButton: {
    width: '32px',
    height: '32px',
    borderRadius: '6px',
    border: 'none',
    backgroundColor: colors.primary,
    color: colors.white,
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
    color: colors.black,
    minWidth: '32px',
    textAlign: 'center',
  },
  removeButton: {
    width: '40px',
    height: '40px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: 'transparent',
    fontSize: '20px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  footer: {
    padding: '24px',
    borderTop: `1px solid ${colors.grayBg}`,
  },
  summary: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
    padding: '16px',
    backgroundColor: colors.grayBg,
    borderRadius: '8px',
  },
  summaryLabel: {
    fontSize: '16px',
    color: colors.gray,
  },
  summaryValue: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: colors.primary,
  },
  checkoutButton: {
    width: '100%',
    padding: '16px',
    backgroundColor: colors.primary,
    color: colors.white,
    border: 'none',
    borderRadius: '12px',
    fontSize: '18px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
};
