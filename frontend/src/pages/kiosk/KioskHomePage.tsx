import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { productsApi } from '../../api/products';
import { ordersApi } from '../../api/orders';
import { kioskApi } from '../../api/kiosk';
import type { Product, ProductCategory } from '../../types';
import { HeroSection } from '../../components/kiosk/HeroSection';
import { CategoryCarousel } from '../../components/kiosk/CategoryCarousel';
import { CartModal } from '../../components/kiosk/CartModal';
import { AddToCartNotification } from '../../components/kiosk/AddToCartNotification';
import { SuccessModal } from '../../components/kiosk/SuccessModal';
import { OrderLimitsIndicator } from '../../components/kiosk/OrderLimitsIndicator';
import { LimitReachedModal } from '../../components/kiosk/LimitReachedModal';
import { WelcomeModal } from '../../components/kiosk/WelcomeModal';
import { useWebSocket } from '../../hooks/useWebSocket';
import { useKioskState } from '../../hooks/useKioskState';
import { colors } from '../../styles/colors';

const WS_BASE_URL = import.meta.env.VITE_WS_BASE_URL || 'ws://localhost:8000';

interface PatientInfo {
  full_name: string;
  room_code: string;
  staff_name: string;
  order_limits?: {
    DRINK?: number;
    SNACK?: number;
  };
}

export const KioskHomePage: React.FC = () => {
  const { deviceId } = useParams<{ deviceId: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [patientInfo, setPatientInfo] = useState<PatientInfo | null>(null);
  const [patientId, setPatientId] = useState<number | null>(null);
  const [featuredProduct, setFeaturedProduct] = useState<Product | null>(null);
  const [carouselCategories, setCarouselCategories] = useState<ProductCategory[]>([]);
  const [categoryProducts, setCategoryProducts] = useState<Map<number, Product[]>>(new Map());
  const [mostOrderedProducts, setMostOrderedProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<Map<number, number>>(new Map());
  const [showCart, setShowCart] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [lastAddedProduct, setLastAddedProduct] = useState<string>('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showLimitsIndicator, setShowLimitsIndicator] = useState(false);
  const [showLimitReachedModal, setShowLimitReachedModal] = useState(false);

  // Use kiosk state hook for persistent state management
  const { hasSeenWelcome, setHasSeenWelcome, updateActivity } = useKioskState(
    deviceId || '',
    patientId
  );

  const [showWelcomeModal, setShowWelcomeModal] = useState(!hasSeenWelcome);

  useEffect(() => {
    loadHomeData();
  }, [deviceId]);

  const loadHomeData = async () => {
    try {
      setLoading(true);

      // Check for active orders first - if any exist, redirect to orders page
      if (deviceId) {
        try {
          const ordersResponse = await ordersApi.getActiveOrdersPublic(deviceId);
          const activeOrders = ordersResponse.orders || [];

          if (activeOrders.length > 0) {
            // Patient has active orders, redirect to orders page
            console.log('Active orders found, redirecting to orders page');
            navigate(`/kiosk/${deviceId}/orders`, { replace: true });
            return; // Stop loading home data
          }
        } catch (error) {
          console.error('Error checking active orders:', error);
          // Continue loading home page even if order check fails
        }
      }

      // Load patient information
      if (deviceId) {
        try {
          const patientData = await kioskApi.getActivePatient(deviceId);
          setPatientId(patientData.patient.id);
          setPatientInfo({
            full_name: patientData.patient.full_name,
            room_code: patientData.room.code,
            staff_name: patientData.staff.full_name,
            order_limits: patientData.order_limits || {},
          });

          // Show welcome modal only if not seen before (managed by useKioskState)
          if (!hasSeenWelcome) {
            setTimeout(() => setShowWelcomeModal(true), 1000);
          }

        } catch (error) {
          console.error('Error loading patient data:', error);
        }
      }

      // Load featured product
      const featured = await productsApi.getFeaturedProduct();
      setFeaturedProduct(featured);

      // Load carousel categories
      const categories = await productsApi.getCarouselCategories();
      setCarouselCategories(categories);

      // Load most ordered products
      const mostOrdered = await productsApi.getMostOrderedProducts();
      setMostOrderedProducts(mostOrdered);

      // Load products for each category
      const productsMap = new Map<number, Product[]>();
      for (const category of categories) {
        const products = await productsApi.getProductsByCategory(category.id);
        productsMap.set(category.id, products);
      }
      setCategoryProducts(productsMap);

    } catch (error) {
      console.error('Error loading home data:', error);
    } finally {
      setLoading(false);
    }
  };

  // WebSocket message handler
  const handleWebSocketMessage = useCallback((message: any) => {
    console.log('WebSocket message received in KioskHomePage:', message);

    if (message.type === 'order_created_by_staff') {
      console.log('Order created by staff - redirecting to orders page');
      // Redirect to orders page when staff creates an order
      if (deviceId) {
        navigate(`/kiosk/${deviceId}/orders`, { replace: true });
      }
    } else if (message.type === 'patient_assigned') {
      console.log('New patient assigned - reloading home data');
      // Reload home data when a new patient is assigned
      loadHomeData();
    }
  }, [deviceId, navigate]);

  // WebSocket connection for real-time notifications
  const wsUrl = deviceId ? `${WS_BASE_URL}/ws/kiosk/orders/?device_uid=${deviceId}` : '';

  useWebSocket({
    url: wsUrl,
    onMessage: handleWebSocketMessage,
    onOpen: () => {
      console.log('✅ Kiosk Home WebSocket connected');
    },
    onClose: () => {
      console.log('❌ Kiosk Home WebSocket disconnected');
    },
    onError: (error) => {
      console.error('⚠️ Kiosk Home WebSocket error:', error);
    },
  });

  // Get all products for cart modal and notifications
  const allProducts: Product[] = [
    ...(featuredProduct ? [featuredProduct] : []),
    ...mostOrderedProducts,
    ...Array.from(categoryProducts.values()).flat(),
  ];

  const handleAddToCart = (productId: number) => {
    // Update activity timestamp
    updateActivity();

    // Find product
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;

    // Check if we have order limits configured
    if (patientInfo?.order_limits) {
      const limits = patientInfo.order_limits;
      const categoryType = product.category_type;

      // Only validate if product has a category type and there's a limit for it
      if (categoryType && (categoryType === 'DRINK' || categoryType === 'SNACK')) {
        const limit = limits[categoryType];
        if (limit && limit > 0) {
          // Count how many of this category type are already in cart
          let currentCount = 0;
          cart.forEach((quantity, prodId) => {
            const cartProduct = allProducts.find(p => p.id === prodId);
            if (cartProduct && cartProduct.category_type === categoryType) {
              currentCount += quantity;
            }
          });

          // Check if adding this would exceed the limit
          if (currentCount >= limit) {
            setShowLimitsIndicator(true);
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

  const handleCheckout = async () => {
    if (!deviceId || cart.size === 0) return;

    // Update activity timestamp
    updateActivity();

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
      setShowCart(false);

      // Show success modal
      setShowSuccessModal(true);
    } catch (error: any) {
      console.error('Error creating order:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);

      const errorData = error.response?.data;

      // Check if limit was reached
      if (errorData?.limit_reached) {
        // Clear cart and close modal
        setCart(new Map());
        setShowCart(false);

        // Show limit reached modal
        setShowLimitReachedModal(true);
      } else {
        // Show regular error message
        const errorMessage = errorData?.error || 'Error al confirmar la orden. Por favor intenta de nuevo.';
        alert(errorMessage);
      }
    }
  };

  const handleViewAll = (categoryId: number) => {
    navigate(`/kiosk/${deviceId}/category/${categoryId}`);
  };

  const handleViewOrders = () => {
    navigate(`/kiosk/${deviceId}/orders`);
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    navigate(`/kiosk/${deviceId}/orders`, { replace: true });
  };

  const handleLimitReachedViewOrders = () => {
    setShowLimitReachedModal(false);
    navigate(`/kiosk/${deviceId}/orders`, { replace: true });
  };

  const cartTotal = Array.from(cart.values()).reduce((sum, qty) => sum + qty, 0);

  if (loading) {
    return (
      <div style={styles.loading}>
        <div style={styles.spinner}></div>
        <p>Cargando...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <div>
          <h1 style={styles.headerTitle}>Orden de Servicio a Habitación</h1>
          {patientInfo && (
            <>
              <p style={styles.welcomeText}>Bienvenido, {patientInfo.full_name}</p>
              <p style={styles.nurseText}>Tu enfermera: {patientInfo.staff_name}</p>
            </>
          )}
        </div>
        <div style={styles.headerInfo}>
          {patientInfo && (
            <div style={styles.roomInfo}>
              <div style={styles.roomLabel}>Habitación: {patientInfo.room_code}</div>
              <div style={styles.deviceLabel}>Dispositivo: {deviceId}</div>
            </div>
          )}
          <div style={styles.headerRight}>
            <button style={styles.ordersButton} onClick={handleViewOrders}>
              Mis Órdenes
            </button>
            {cartTotal > 0 && (
              <button style={styles.cartButton} onClick={() => setShowCart(true)}>
                🛒 Carrito ({cartTotal})
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section - Featured Product */}
      {featuredProduct && (
        <HeroSection product={featuredProduct} onAddToCart={handleAddToCart} />
      )}

      {/* Most Ordered Products Carousel */}
      {mostOrderedProducts.length > 0 && (
        <CategoryCarousel
          category={{
            id: 0,
            name: 'Productos Más Pedidos',
            icon: '⭐',
            description: 'Los favoritos de nuestros pacientes',
            sort_order: 0,
            is_active: true,
            created_at: '',
            updated_at: '',
          }}
          products={mostOrderedProducts}
          onAddToCart={handleAddToCart}
          onViewAll={() => {}}
        />
      )}

      {/* Category Carousels */}
      {carouselCategories.map((category) => {
        const products = categoryProducts.get(category.id) || [];
        if (products.length === 0) return null;

        return (
          <CategoryCarousel
            key={category.id}
            category={category}
            products={products}
            onAddToCart={handleAddToCart}
            onViewAll={handleViewAll}
          />
        );
      })}

      {/* Cart Modal */}
      {showCart && (
        <CartModal
          cart={cart}
          products={allProducts}
          onClose={() => setShowCart(false)}
          onUpdateQuantity={handleUpdateQuantity}
          onCheckout={handleCheckout}
        />
      )}

      {/* Add to Cart Notification */}
      <AddToCartNotification
        show={showNotification}
        productName={lastAddedProduct}
        onHide={() => setShowNotification(false)}
      />

      {/* Success Modal */}
      <SuccessModal
        show={showSuccessModal}
        title="¡Orden confirmada!"
        message="Tu pedido está siendo preparado."
        onClose={handleSuccessModalClose}
      />

      {/* Order Limits Indicator */}
      {showLimitsIndicator && patientInfo?.order_limits && (
        <OrderLimitsIndicator
          limits={patientInfo.order_limits}
          onClose={() => setShowLimitsIndicator(false)}
        />
      )}

      {/* Limit Reached Modal */}
      <LimitReachedModal
        show={showLimitReachedModal}
        nurseName={patientInfo?.staff_name}
        onViewOrders={handleLimitReachedViewOrders}
      />

      {/* Welcome Modal */}
      <WelcomeModal
        show={showWelcomeModal}
        patientName={patientInfo?.full_name || ''}
        orderLimits={patientInfo?.order_limits}
        onClose={() => {
          setShowWelcomeModal(false);
          setHasSeenWelcome(true);
        }}
      />
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    minHeight: '100vh',
    backgroundColor: colors.grayBg,
    paddingBottom: '40px',
  },
  loading: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    backgroundColor: colors.grayBg,
  },
  spinner: {
    width: '48px',
    height: '48px',
    border: `4px solid ${colors.grayLight}`,
    borderTop: `4px solid ${colors.primary}`,
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  header: {
    position: 'sticky',
    top: 0,
    zIndex: 100,
    backgroundColor: colors.white,
    padding: '24px 40px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: `0 2px 8px ${colors.shadow}`,
  },
  headerTitle: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: colors.black,
    margin: '0 0 8px 0',
  },
  welcomeText: {
    fontSize: '16px',
    color: colors.gray,
    margin: '4px 0',
    fontWeight: '500',
  },
  nurseText: {
    fontSize: '14px',
    color: colors.gray,
    margin: '4px 0 0 0',
  },
  headerInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '24px',
  },
  roomInfo: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '4px',
  },
  roomLabel: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: colors.black,
  },
  deviceLabel: {
    fontSize: '12px',
    color: colors.gray,
  },
  headerRight: {
    display: 'flex',
    gap: '16px',
  },
  ordersButton: {
    padding: '12px 24px',
    backgroundColor: '#ff9800',
    color: colors.white,
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  cartButton: {
    padding: '12px 24px',
    backgroundColor: '#ff9800',
    color: colors.white,
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
};

// Add keyframes for spinner animation
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(styleSheet);
