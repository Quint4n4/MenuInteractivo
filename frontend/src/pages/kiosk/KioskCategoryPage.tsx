import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { productsApi } from '../../api/products';
import { ordersApi } from '../../api/orders';
import { kioskApi } from '../../api/kiosk';
import type { Product, ProductCategory } from '../../types';
import { ProductCard } from '../../components/kiosk/ProductCard';
import { CartModal } from '../../components/kiosk/CartModal';
import { AddToCartNotification } from '../../components/kiosk/AddToCartNotification';
import { LimitReachedModal } from '../../components/kiosk/LimitReachedModal';
import CannotOrderModal from '../../components/kiosk/CannotOrderModal';
import { colors } from '../../styles/colors';

// Storage key for cart persistence
const CART_STORAGE_KEY = 'kiosk_cart';

interface LocationState {
  cart?: [number, number][];
  orderLimits?: { DRINK?: number; SNACK?: number };
  activeOrdersItems?: [string, number][];
}

export const KioskCategoryPage: React.FC = () => {
  const { deviceId, categoryId } = useParams<{ deviceId: string; categoryId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<ProductCategory | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [cartProducts, setCartProducts] = useState<Product[]>([]); // Products from cart (may be from other categories)
  const [patientInfo, setPatientInfo] = useState<{
    full_name: string;
    room_code: string;
    staff_name: string;
    order_limits?: { DRINK?: number; SNACK?: number };
    can_patient_order?: boolean;
  } | null>(null);

  // Initialize cart from location state or localStorage
  const [cart, setCart] = useState<Map<number, number>>(() => {
    const navState = location.state as LocationState | null;
    if (navState?.cart) {
      return new Map(navState.cart);
    }
    try {
      const stored = localStorage.getItem(`${CART_STORAGE_KEY}_${deviceId}`);
      if (stored) {
        return new Map(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Error loading cart from localStorage:', e);
    }
    return new Map();
  });

  // Initialize order limits and active orders from location state
  const [orderLimits, setOrderLimits] = useState<{ DRINK?: number; SNACK?: number }>(() => {
    const navState = location.state as LocationState | null;
    return navState?.orderLimits || {};
  });

  const [activeOrdersItems, setActiveOrdersItems] = useState<Map<string, number>>(() => {
    const navState = location.state as LocationState | null;
    if (navState?.activeOrdersItems) {
      return new Map(navState.activeOrdersItems);
    }
    return new Map();
  });

  const [showCart, setShowCart] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [lastAddedProduct, setLastAddedProduct] = useState<string>('');
  const [showLimitReachedModal, setShowLimitReachedModal] = useState(false);
  const [showCannotOrderModal, setShowCannotOrderModal] = useState(false);

  useEffect(() => {
    loadCategoryData();
  }, [categoryId]);

  // Persist cart to localStorage whenever it changes
  useEffect(() => {
    if (deviceId && cart.size > 0) {
      try {
        localStorage.setItem(
          `${CART_STORAGE_KEY}_${deviceId}`,
          JSON.stringify(Array.from(cart.entries()))
        );
      } catch (e) {
        console.error('Error saving cart to localStorage:', e);
      }
    } else if (deviceId && cart.size === 0) {
      localStorage.removeItem(`${CART_STORAGE_KEY}_${deviceId}`);
    }
  }, [cart, deviceId]);

  const loadCategoryData = async () => {
    if (!categoryId) return;

    try {
      setLoading(true);

      // Load patient info if not passed in state
      if (deviceId && !patientInfo) {
        try {
          const patientData = await kioskApi.getActivePatient(deviceId);
          setPatientInfo({
            full_name: patientData.patient.full_name,
            room_code: patientData.room.code,
            staff_name: patientData.staff.full_name,
            order_limits: patientData.order_limits || {},
            can_patient_order: patientData.can_patient_order !== false, // Default to true
          });
          setOrderLimits(patientData.order_limits || {});
        } catch (error) {
          console.error('Error loading patient data:', error);
        }
      }

      // Load category details
      const categories = await productsApi.getPublicCategories();
      const categoryData = categories.results?.find((c: ProductCategory) => c.id === parseInt(categoryId)) || null;
      setCategory(categoryData);

      // Load ALL products for this category (not just most ordered)
      const productsData = await productsApi.getProductsByCategory(parseInt(categoryId));
      setProducts(productsData);

      // Load products that are in the cart but not in this category
      // This is needed for the CartModal to display all cart items
      const currentCart = cart;
      if (currentCart.size > 0) {
        const productIdsInCart = Array.from(currentCart.keys());
        const productIdsInCategory = new Set(productsData.map((p: Product) => p.id));
        const missingProductIds = productIdsInCart.filter(id => !productIdsInCategory.has(id));

        if (missingProductIds.length > 0) {
          try {
            // Load all public products to find the missing ones
            const allPublicProducts = await productsApi.getPublicProducts();
            const missingProducts = allPublicProducts.results?.filter((p: Product) =>
              missingProductIds.includes(p.id)
            ) || [];
            setCartProducts(missingProducts);
          } catch (error) {
            console.error('Error loading cart products:', error);
          }
        }
      }

      // Load active orders if not passed in state
      if (deviceId && activeOrdersItems.size === 0) {
        try {
          const ordersResponse = await ordersApi.getActiveOrdersPublic(deviceId);
          const activeOrders = ordersResponse.orders || [];
          const itemsMap = new Map<string, number>();
          activeOrders
            .filter((order: any) => ['PLACED', 'PREPARING', 'READY'].includes(order.status))
            .forEach((order: any) => {
              order.items?.forEach((item: any) => {
                const categoryType = item.category_type || 'OTHER';
                const currentCount = itemsMap.get(categoryType) || 0;
                itemsMap.set(categoryType, currentCount + item.quantity);
              });
            });
          setActiveOrdersItems(itemsMap);
        } catch (error) {
          console.error('Error loading active orders:', error);
        }
      }

    } catch (error) {
      console.error('Error loading category data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (productId: number) => {
    // Check if patient can order
    if (patientInfo && patientInfo.can_patient_order === false) {
      setShowCannotOrderModal(true);
      return;
    }

    const product = products.find(p => p.id === productId);
    if (!product) return;

    // Check if we have order limits configured
    const limits = orderLimits || patientInfo?.order_limits;
    if (limits) {
      const categoryType = product.category_type;

      // Only validate if product has a category type with a limit (DRINK or SNACK)
      // FOOD has no limit
      if (categoryType && (categoryType === 'DRINK' || categoryType === 'SNACK')) {
        const limit = limits[categoryType];
        if (limit && limit > 0) {
          // Count how many of this category type are already in cart
          let cartCount = 0;
          cart.forEach((quantity, prodId) => {
            const cartProduct = products.find(p => p.id === prodId);
            if (cartProduct && cartProduct.category_type === categoryType) {
              cartCount += quantity;
            }
          });

          // Count how many are in active orders
          const ordersCount = activeOrdersItems.get(categoryType) || 0;

          // Total count = cart + active orders
          const totalCount = cartCount + ordersCount;

          // Check if adding this would exceed the limit
          if (totalCount >= limit) {
            console.log(`Limit reached for ${categoryType}: ${totalCount}/${limit}`);
            setShowLimitReachedModal(true);
            return;
          }
        }
      }
    }

    // Add to cart
    setLastAddedProduct(product.name);
    setShowNotification(true);

    setCart((prev) => {
      const newCart = new Map(prev);
      newCart.set(productId, (newCart.get(productId) || 0) + 1);
      return newCart;
    });
  };

  const handleUpdateQuantity = (productId: number, quantity: number) => {
    setCart((prev) => {
      const newCart = new Map(prev);
      if (quantity <= 0) {
        newCart.delete(productId);
      } else {
        newCart.set(productId, quantity);
      }
      return newCart;
    });
  };

  const handleBack = () => {
    // Navigate back to home and pass cart state
    navigate(`/kiosk/${deviceId}`, {
      state: {
        cart: Array.from(cart.entries()),
      }
    });
  };

  const handleViewOrders = () => {
    navigate(`/kiosk/${deviceId}/orders`);
  };

  const handleCheckout = async () => {
    if (!deviceId || cart.size === 0) return;

    try {
      const items = Array.from(cart.entries()).map(([product_id, quantity]) => ({
        product_id,
        quantity,
      }));

      const orderData = {
        device_uid: deviceId,
        items,
      };

      console.log('Sending order data:', orderData);
      const response = await ordersApi.createOrderPublic(orderData);
      console.log('Order created successfully:', response);

      // Clear cart and close modal
      setCart(new Map());
      localStorage.removeItem(`${CART_STORAGE_KEY}_${deviceId}`);
      setShowCart(false);

      // Redirect to orders page
      navigate(`/kiosk/${deviceId}/orders`, { replace: true });
    } catch (error: any) {
      console.error('Error creating order:', error);
      const errorData = error.response?.data;

      if (errorData?.limit_reached) {
        setCart(new Map());
        setShowCart(false);
        setShowLimitReachedModal(true);
      } else {
        const errorMessage = errorData?.error || 'Error al confirmar la orden. Por favor intenta de nuevo.';
        alert(errorMessage);
      }
    }
  };

  // Get all products including those in cart from other categories
  const getAllProducts = (): Product[] => {
    // Combine products from this category with products from cart (other categories)
    const allProducts = [...products, ...cartProducts];
    // Remove duplicates by id
    const uniqueProducts = allProducts.filter((product, index, self) =>
      index === self.findIndex(p => p.id === product.id)
    );
    return uniqueProducts;
  };

  const cartTotal = Array.from(cart.values()).reduce((sum, qty) => sum + qty, 0);

  if (loading) {
    return (
      <div style={styles.loading}>
        <div style={styles.spinner}></div>
        <p>Cargando productos...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <button style={styles.backButton} onClick={handleBack} className="cat-back-btn">
            ← Volver
          </button>
          <div>
            <h1 style={styles.headerTitle}>
              {category?.icon && <span style={styles.categoryIcon}>{category.icon}</span>}
              {category?.name || 'Productos'}
            </h1>
            <p style={styles.headerSubtitle}>
              {patientInfo ? `Habitación: ${patientInfo.room_code}` : `Dispositivo: ${deviceId}`}
            </p>
          </div>
        </div>
        <div style={styles.headerRight}>
          <button style={styles.ordersButton} onClick={handleViewOrders} className="cat-orders-btn">
            Mis Órdenes
          </button>
          {cartTotal > 0 && (
            <button style={styles.cartButton} onClick={() => setShowCart(true)} className="cat-cart-btn">
              🛒 Carrito ({cartTotal})
            </button>
          )}
        </div>
      </header>

      {/* Products Grid */}
      <div style={styles.content}>
        {products.length === 0 ? (
          <div style={styles.emptyState}>
            <p style={styles.emptyText}>No hay productos disponibles en esta categoría</p>
            <button style={styles.emptyButton} onClick={handleBack} className="cat-empty-btn">
              Volver al inicio
            </button>
          </div>
        ) : (
          <div style={styles.productsGrid}>
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={handleAddToCart}
                variant="grid"
              />
            ))}
          </div>
        )}
      </div>

      {/* Cart Modal */}
      {showCart && (
        <CartModal
          cart={cart}
          products={getAllProducts()}
          onClose={() => setShowCart(false)}
          onUpdateQuantity={handleUpdateQuantity}
          onCheckout={handleCheckout}
          orderLimits={orderLimits || patientInfo?.order_limits || {}}
          activeOrdersItems={activeOrdersItems}
          onLimitReached={() => setShowLimitReachedModal(true)}
        />
      )}

      {/* Add to Cart Notification */}
      <AddToCartNotification
        show={showNotification}
        productName={lastAddedProduct}
        onHide={() => setShowNotification(false)}
      />

      {/* Limit Reached Modal */}
      <LimitReachedModal
        show={showLimitReachedModal}
        nurseName={patientInfo?.staff_name}
        onClose={() => setShowLimitReachedModal(false)}
      />

      {/* Cannot Order Modal */}
      {showCannotOrderModal && (
        <CannotOrderModal
          onClose={() => setShowCannotOrderModal(false)}
        />
      )}
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    minHeight: '100vh',
    backgroundColor: colors.ivory,
    paddingBottom: '40px',
  },
  loading: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    backgroundColor: colors.ivory,
    color: colors.textSecondary,
  },
  spinner: {
    width: '48px',
    height: '48px',
    border: `4px solid ${colors.primaryMuted}`,
    borderTop: `4px solid ${colors.primary}`,
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  header: {
    backgroundColor: colors.white,
    padding: '24px 40px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: `0 2px 12px ${colors.shadowGold}`,
    marginBottom: '32px',
    borderBottom: `2px solid ${colors.primaryMuted}`,
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '24px',
  },
  backButton: {
    padding: '10px 20px',
    backgroundColor: colors.white,
    color: colors.primary,
    border: `2px solid ${colors.primary}`,
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  headerTitle: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: colors.textPrimary,
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  categoryIcon: {
    fontSize: '32px',
  },
  headerSubtitle: {
    fontSize: '16px',
    color: colors.textSecondary,
    margin: '8px 0 0 0',
  },
  headerRight: {
    display: 'flex',
    gap: '16px',
  },
  ordersButton: {
    padding: '12px 24px',
    backgroundColor: colors.white,
    color: colors.primary,
    border: `2px solid ${colors.primary}`,
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  cartButton: {
    padding: '12px 24px',
    backgroundColor: colors.primary,
    color: colors.white,
    border: `2px solid ${colors.primary}`,
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  content: {
    padding: '0 40px',
  },
  productsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '24px',
  },
  emptyState: {
    textAlign: 'center',
    padding: '80px 20px',
    backgroundColor: colors.white,
    borderRadius: '16px',
    border: `1px solid ${colors.primaryMuted}`,
  },
  emptyText: {
    fontSize: '18px',
    color: colors.textSecondary,
    marginBottom: '24px',
  },
  emptyButton: {
    padding: '14px 32px',
    backgroundColor: colors.white,
    color: colors.primary,
    border: `2px solid ${colors.primary}`,
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
};

// Add hover effects
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .cat-back-btn:hover {
    background-color: ${colors.primary} !important;
    color: ${colors.white} !important;
  }

  .cat-orders-btn:hover {
    background-color: ${colors.primary} !important;
    color: ${colors.white} !important;
    transform: scale(1.02);
  }

  .cat-cart-btn:hover {
    background-color: ${colors.primaryDark} !important;
    transform: scale(1.02);
    box-shadow: 0 4px 12px ${colors.shadowGold};
  }

  .cat-empty-btn:hover {
    background-color: ${colors.primary} !important;
    color: ${colors.white} !important;
  }
`;
if (!document.head.querySelector('[data-category-page-styles]')) {
  styleSheet.setAttribute('data-category-page-styles', 'true');
  document.head.appendChild(styleSheet);
}
