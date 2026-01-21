import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { productsApi } from '../../api/products';
import { ordersApi } from '../../api/orders';
import { kioskApi } from '../../api/kiosk';
import type { Product, ProductCategory } from '../../types';
import { HeroSection } from '../../components/kiosk/HeroSection';
import { CategoryCarousel } from '../../components/kiosk/CategoryCarousel';
import { CategoryQuickNav } from '../../components/kiosk/CategoryQuickNav';
import { CartModal } from '../../components/kiosk/CartModal';
import { AddToCartNotification } from '../../components/kiosk/AddToCartNotification';
import { OrderLimitsIndicator } from '../../components/kiosk/OrderLimitsIndicator';
import { LimitReachedModal } from '../../components/kiosk/LimitReachedModal';
import { WelcomeModal } from '../../components/kiosk/WelcomeModal';
import { InitialWelcomeScreen } from '../../components/kiosk/InitialWelcomeScreen';
import CannotOrderModal from '../../components/kiosk/CannotOrderModal';
import ProductRatingsModal from '../../components/kiosk/ProductRatingsModal';
import StaffRatingModal from '../../components/kiosk/StaffRatingModal';
import StayRatingModal from '../../components/kiosk/StayRatingModal';
import { ThankYouModal } from '../../components/kiosk/ThankYouModal';
import { useWebSocket } from '../../hooks/useWebSocket';
import { useKioskState } from '../../hooks/useKioskState';
import { useSurvey } from '../../contexts/SurveyContext';
import { useWindowSize } from '../../utils/responsive';
import { colors } from '../../styles/colors';
import logoHorizontal from '../../assets/logos/logo-horizontal.png';

const WS_BASE_URL = import.meta.env.VITE_WS_BASE_URL || 'ws://localhost:8000';

interface PatientInfo {
  full_name: string;
  room_code: string;
  staff_name: string;
  order_limits?: {
    DRINK?: number;
    SNACK?: number;
  };
  can_patient_order?: boolean;
  survey_enabled?: boolean;
  patient_assignment_id?: number;
}

// Storage key for cart persistence
const CART_STORAGE_KEY = 'kiosk_cart';

export const KioskHomePage: React.FC = () => {
  const { deviceId } = useParams<{ deviceId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { isMobile, isTablet } = useWindowSize();

  // Refs for category carousels (for scroll targeting)
  const categoryRefs = useRef<Map<number, HTMLDivElement | null>>(new Map());

  const [loading, setLoading] = useState(true);
  const [patientInfo, setPatientInfo] = useState<PatientInfo | null>(null);
  const [patientId, setPatientId] = useState<number | null>(null);
  const [featuredProduct, setFeaturedProduct] = useState<Product | null>(null);
  const [carouselCategories, setCarouselCategories] = useState<ProductCategory[]>([]);
  const [categoryProducts, setCategoryProducts] = useState<Map<number, Product[]>>(new Map());
  const [mostOrderedProducts, setMostOrderedProducts] = useState<Product[]>([]);

  // Initialize cart from localStorage or from navigation state
  const [cart, setCart] = useState<Map<number, number>>(() => {
    // Check if we have cart state from navigation (returning from category page)
    const navState = location.state as { cart?: Map<number, number> } | null;
    if (navState?.cart) {
      return new Map(navState.cart);
    }
    // Otherwise try localStorage
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

  const [showCart, setShowCart] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [lastAddedProduct, setLastAddedProduct] = useState<string>('');
  const [showLimitsIndicator, setShowLimitsIndicator] = useState(false);
  const [showLimitReachedModal, setShowLimitReachedModal] = useState(false);
  const [activeOrdersItems, setActiveOrdersItems] = useState<Map<string, number>>(new Map());

  // Use kiosk state hook for persistent state management
  const { hasSeenWelcome, setHasSeenWelcome, updateActivity } = useKioskState(
    deviceId || '',
    patientId
  );

  const [showWelcomeModal, setShowWelcomeModal] = useState(!hasSeenWelcome);
  const [showInitialWelcome, setShowInitialWelcome] = useState(true);
  const [checkingPatient, setCheckingPatient] = useState(false);
  const [patientAssigned, setPatientAssigned] = useState(false);
  const [showCannotOrderModal, setShowCannotOrderModal] = useState(false);
  const [showThankYouModal, setShowThankYouModal] = useState(false);

  // Survey context
  const { surveyState, startSurvey, setProductRatings, setStaffRating, completeSurvey, closeSurvey } = useSurvey();

  useEffect(() => {
    loadHomeData();
  }, [deviceId]);

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

  // Function to scroll to a category carousel
  const scrollToCategory = (categoryId: number) => {
    const element = categoryRefs.current.get(categoryId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Get all products for cart modal, notifications, and limit calculations
  const allProducts: Product[] = [
    ...(featuredProduct ? [featuredProduct] : []),
    ...mostOrderedProducts,
    ...Array.from(categoryProducts.values()).flat(),
  ];

  // Calculate current counts for category limits (cart + active orders)
  const getCurrentCounts = useCallback(() => {
    const counts = new Map<string, number>();

    // Add items from cart
    cart.forEach((quantity, productId) => {
      const product = allProducts.find(p => p.id === productId);
      if (product?.category_type) {
        const current = counts.get(product.category_type) || 0;
        counts.set(product.category_type, current + quantity);
      }
    });

    // Add items from active orders
    activeOrdersItems.forEach((quantity, categoryType) => {
      const current = counts.get(categoryType) || 0;
      counts.set(categoryType, current + quantity);
    });

    return counts;
  }, [cart, activeOrdersItems, allProducts]);

  // Check for patient assignment periodically when on initial welcome screen
  useEffect(() => {
    if (!showInitialWelcome || patientAssigned) return;

    const checkPatient = async () => {
      try {
        if (deviceId) {
          const patientData = await kioskApi.getActivePatient(deviceId);
          if (patientData && patientData.patient) {
            setPatientAssigned(true);
          }
        }
      } catch (error) {
        // No patient assigned yet
        setPatientAssigned(false);
      }
    };

    // Check immediately
    checkPatient();

    // Then check every 3 seconds
    const interval = setInterval(checkPatient, 3000);

    return () => clearInterval(interval);
  }, [deviceId, showInitialWelcome, patientAssigned]);

  const loadHomeData = async () => {
    try {
      setLoading(true);

      // ALWAYS check for active orders first - if any exist, redirect to orders page
      if (deviceId) {
        try {
          const ordersResponse = await ordersApi.getActiveOrdersPublic(deviceId);
          const activeOrders = ordersResponse.orders || [];

          // Check if there are any orders that are not yet delivered or cancelled
          const hasActiveOrders = activeOrders.some((order: any) =>
            ['PLACED', 'PREPARING', 'READY'].includes(order.status)
          );

          if (hasActiveOrders) {
            // Patient has active orders, MUST redirect to orders page
            console.log('Active orders found (PLACED/PREPARING/READY), redirecting to orders page');
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
            can_patient_order: patientData.can_patient_order !== false, // Default to true
            survey_enabled: patientData.survey_enabled || false,
            patient_assignment_id: patientData.id,
          });

          // If survey is enabled, start it immediately
          if (patientData.survey_enabled && patientData.id) {
            startSurvey(patientData.id, patientData.staff.full_name);
          }

          // Hide initial welcome screen when patient is assigned
          setShowInitialWelcome(false);

          // Show welcome modal only if not seen before (managed by useKioskState)
          if (!hasSeenWelcome) {
            setTimeout(() => setShowWelcomeModal(true), 1000);
          }

        } catch (error) {
          console.error('Error loading patient data:', error);
          // No patient assigned - show initial welcome screen
          setShowInitialWelcome(true);
          setPatientInfo(null);
          setPatientId(null);
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

      // Load products for each category (for carousels)
      // Try most ordered first, fallback to all products if empty or error
      const productsMap = new Map<number, Product[]>();
      for (const category of categories) {
        let products: Product[] = [];

        try {
          // First try to get most ordered products
          products = await productsApi.getMostOrderedByCategory(category.id, 5);
        } catch (error) {
          console.log(`Most ordered endpoint not available for category ${category.id}, using fallback`);
          products = [];
        }

        // If no most-ordered products (empty or error), fallback to all products
        if (!products || products.length === 0) {
          try {
            const allProducts = await productsApi.getProductsByCategory(category.id);
            products = allProducts.slice(0, 5);
          } catch (fallbackError) {
            console.error(`Error loading fallback products for category ${category.id}:`, fallbackError);
            products = [];
          }
        }

        productsMap.set(category.id, products);
      }
      setCategoryProducts(productsMap);

      // Load active orders to track items already ordered (for limit validation)
      if (deviceId) {
        try {
          const ordersResponse = await ordersApi.getActiveOrdersPublic(deviceId);
          const activeOrders = ordersResponse.orders || [];

          // Count items from active orders (PLACED, PREPARING, READY)
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
          console.log('Active orders items count:', Object.fromEntries(itemsMap));
        } catch (error) {
          console.error('Error loading active orders for limits:', error);
        }
      }

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
      console.log('New patient assigned - updating state and reloading');
      // Update patient assigned state immediately for button enable
      setPatientAssigned(true);
      // Reload home data when a new patient is assigned
      loadHomeData();
    } else if (message.type === 'order_status_changed') {
      console.log('Order status changed - reloading active orders for limits');
      // If an order status changed, we need to recalculate limits
      // Reload home data to update activeOrdersItems
      loadHomeData();
    } else if (message.type === 'limits_updated') {
      console.log('Order limits updated by staff - reloading patient data');
      // When staff updates limits, reload patient data to get new limits and reactivate orders
      loadHomeData();
      setPatientInfo(prev => prev ? { ...prev, can_patient_order: message.can_patient_order ?? true } : null);
    } else if (message.type === 'survey_enabled') {
      console.log('Survey enabled - starting survey immediately');
      // When survey is enabled, block patient orders and start survey immediately
      const assignmentId = message.assignment_id;
      const staffName = patientInfo?.staff_name || 'Personal';
      
      setPatientInfo(prev => prev ? { 
        ...prev, 
        can_patient_order: false, 
        survey_enabled: true,
        patient_assignment_id: assignmentId || prev.patient_assignment_id
      } : null);
      
      // Start survey immediately using global context (works from any page)
      if (assignmentId || patientInfo?.patient_assignment_id) {
        startSurvey(assignmentId || patientInfo?.patient_assignment_id!, staffName);
      }
    } else if (message.type === 'session_ended') {
      console.log('Patient session ended by staff - returning to welcome screen');
      // Reset all state to show initial welcome screen
      setPatientInfo(null);
      setPatientId(null);
      setPatientAssigned(false);
      setShowInitialWelcome(true);
      setShowWelcomeModal(false);
      setCart(new Map());
      setActiveOrdersItems(new Map());
      setShowThankYouModal(false);
      closeSurvey(); // Close any open survey modals
    }
  }, [deviceId, navigate, startSurvey, patientInfo, closeSurvey]);

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

  const handleAddToCart = (productId: number) => {
    // Check if patient can order
    if (patientInfo && patientInfo.can_patient_order === false) {
      setShowCannotOrderModal(true);
      return;
    }

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
          let cartCount = 0;
          cart.forEach((quantity, prodId) => {
            const cartProduct = allProducts.find(p => p.id === prodId);
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

  const handleViewMenu = async () => {
    setCheckingPatient(true);
    try {
      if (deviceId) {
        // Check if patient is assigned
        const patientData = await kioskApi.getActivePatient(deviceId);
        if (patientData && patientData.patient) {
          // Patient is assigned, proceed to menu
          await loadHomeData();
        }
      }
    } catch (error) {
      console.log('No patient assigned yet, staying on welcome screen');
      // Keep showing initial welcome screen
    } finally {
      setCheckingPatient(false);
    }
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

      // Redirect directly to orders page
      navigate(`/kiosk/${deviceId}/orders`, { replace: true });
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
    // Pass cart state to category page to maintain session
    navigate(`/kiosk/${deviceId}/category/${categoryId}`, {
      state: {
        cart: Array.from(cart.entries()),
        orderLimits: patientInfo?.order_limits,
        activeOrdersItems: Array.from(activeOrdersItems.entries()),
      }
    });
  };

  const handleViewOrders = () => {
    navigate(`/kiosk/${deviceId}/orders`);
  };

  const handleLimitReachedClose = () => {
    setShowLimitReachedModal(false);
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

  // Show initial welcome screen if no patient is assigned
  if (showInitialWelcome && !patientInfo) {
    return (
      <InitialWelcomeScreen
        deviceUid={deviceId || ''}
        onViewMenu={handleViewMenu}
        loading={checkingPatient}
        patientAssigned={patientAssigned}
      />
    );
  }

  const headerStyles = {
    ...styles.header,
    ...(isMobile && responsiveStyles.header),
  };
  
  const headerLeftStyles = {
    ...styles.headerLeft,
    ...(isMobile && responsiveStyles.headerLeft),
  };
  
  const headerInfoStyles = {
    ...styles.headerInfo,
    ...(isMobile && responsiveStyles.headerInfo),
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={headerStyles}>
        <div style={headerLeftStyles}>
          <img src={logoHorizontal} alt="Clínica CAMSA" style={{ ...styles.logo, ...(isMobile && responsiveStyles.logo) }} />
          {!isMobile && <div style={styles.headerDivider} />}
          <div style={isMobile ? responsiveStyles.headerText : {}}>
            <h1 style={{ ...styles.headerTitle, ...(isMobile && responsiveStyles.headerTitle) }}>Servicio a Habitación</h1>
            {patientInfo && (
              <>
                <p style={{ ...styles.welcomeText, ...(isMobile && responsiveStyles.welcomeText) }}>Bienvenido, {patientInfo.full_name}</p>
                {!isMobile && <p style={styles.nurseText}>Tu enfermera: {patientInfo.staff_name}</p>}
              </>
            )}
          </div>
        </div>
        <div style={headerInfoStyles}>
          {patientInfo && !isMobile && (
            <div style={styles.roomInfo}>
              <div style={styles.roomLabel}>Habitación: {patientInfo.room_code}</div>
              <div style={styles.deviceLabel}>Dispositivo: {deviceId}</div>
            </div>
          )}
          <div style={{ ...styles.headerRight, ...(isMobile && responsiveStyles.headerRight) }}>
            <button
              style={{ ...styles.ordersButton, ...(isMobile && responsiveStyles.button) }}
              onClick={handleViewOrders}
              className="kiosk-btn-outline"
            >
              {isMobile ? 'Órdenes' : 'Mis Órdenes'}
            </button>
            {cartTotal > 0 && (
              <button
                style={{ ...styles.cartButton, ...(isMobile && responsiveStyles.button) }}
                onClick={() => setShowCart(true)}
                className="kiosk-btn-primary"
              >
                {isMobile ? `🛒 ${cartTotal}` : `🛒 Carrito (${cartTotal})`}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section - Featured Product */}
      {featuredProduct && (
        <HeroSection product={featuredProduct} onAddToCart={handleAddToCart} />
      )}

      {/* Category Quick Navigation */}
      {carouselCategories.length > 0 && (
        <CategoryQuickNav
          categories={carouselCategories}
          onCategoryClick={scrollToCategory}
          onFoodClick={() => navigate(`/kiosk/${deviceId}/food`)}
          orderLimits={patientInfo?.order_limits}
          currentCounts={getCurrentCounts()}
        />
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
          showViewAllButton={false}
        />
      )}

      {/* Category Carousels */}
      {carouselCategories.map((category) => {
        // Skip FOOD category carousel (it navigates to separate page)
        const isFoodCategory =
          category.category_type === 'FOOD' ||
          category.name.toLowerCase().includes('comida') ||
          category.name.toLowerCase().includes('ordenar');

        if (isFoodCategory) {
          return null;
        }

        const products = categoryProducts.get(category.id) || [];

        return (
          <div
            key={category.id}
            ref={(el) => {
              if (el) categoryRefs.current.set(category.id, el);
            }}
            style={{ scrollMarginTop: '100px' }}
          >
            {products.length > 0 && (
              <CategoryCarousel
                category={category}
                products={products}
                onAddToCart={handleAddToCart}
                onViewAll={handleViewAll}
              />
            )}
          </div>
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
          orderLimits={patientInfo?.order_limits || {}}
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
        onClose={handleLimitReachedClose}
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

      {/* Cannot Order Modal */}
      {showCannotOrderModal && (
        <CannotOrderModal
          onClose={() => setShowCannotOrderModal(false)}
        />
      )}

      {/* Survey Modals - Global Context */}
      {surveyState.showProductRatings && surveyState.patientAssignmentId && (
        <ProductRatingsModal
          patientAssignmentId={surveyState.patientAssignmentId}
          onNext={(ratings) => {
            setProductRatings(ratings);
          }}
        />
      )}

      {surveyState.showStaffRating && surveyState.patientAssignmentId && (
        <StaffRatingModal
          staffName={surveyState.staffName}
          onNext={(rating) => {
            setStaffRating(rating);
          }}
        />
      )}

      {surveyState.showStayRating && surveyState.patientAssignmentId && (
        <StayRatingModal
          onComplete={async (stayRating, comment) => {
            try {
              await completeSurvey(stayRating, comment);
              setShowThankYouModal(true);
            } catch (error: any) {
              console.error('Error completing survey:', error);
              const errorMessage = error.response?.data?.error || 'Error al enviar la encuesta. Por favor intenta de nuevo.';
              alert(errorMessage);
            }
          }}
        />
      )}

      {/* Thank You Modal */}
      {showThankYouModal && (
        <ThankYouModal
          show={showThankYouModal}
          onClose={() => {
            setShowThankYouModal(false);
            closeSurvey();
            // Reload data to reflect session end
            loadHomeData();
          }}
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
    position: 'sticky',
    top: 0,
    zIndex: 100,
    backgroundColor: colors.white,
    padding: '16px 40px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: `0 2px 12px ${colors.shadowGold}`,
    borderBottom: `1px solid ${colors.primaryMuted}`,
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
  },
  logo: {
    height: '50px',
    width: 'auto',
  },
  headerDivider: {
    width: '1px',
    height: '40px',
    backgroundColor: colors.primaryMuted,
  },
  headerTitle: {
    fontSize: '22px',
    fontWeight: '600',
    color: colors.textPrimary,
    margin: '0 0 4px 0',
  },
  welcomeText: {
    fontSize: '14px',
    color: colors.primary,
    margin: '2px 0',
    fontWeight: '500',
  },
  nurseText: {
    fontSize: '13px',
    color: colors.textSecondary,
    margin: '2px 0 0 0',
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
    gap: '2px',
    padding: '8px 16px',
    backgroundColor: colors.cream,
    borderRadius: '8px',
    border: `1px solid ${colors.primaryMuted}`,
  },
  roomLabel: {
    fontSize: '15px',
    fontWeight: '600',
    color: colors.primary,
  },
  deviceLabel: {
    fontSize: '11px',
    color: colors.textMuted,
  },
  headerRight: {
    display: 'flex',
    gap: '12px',
  },
  ordersButton: {
    padding: '12px 24px',
    backgroundColor: colors.white,
    color: colors.primary,
    border: `2px solid ${colors.primary}`,
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  cartButton: {
    padding: '12px 24px',
    backgroundColor: colors.primary,
    color: colors.white,
    border: `2px solid ${colors.primary}`,
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
};

// Responsive styles for mobile
const responsiveStyles: { [key: string]: React.CSSProperties } = {
  header: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: '12px 16px',
    gap: '12px',
  },
  headerLeft: {
    flexDirection: 'column',
    gap: '12px',
    width: '100%',
  },
  headerText: {
    width: '100%',
  },
  headerTitle: {
    fontSize: '18px',
    marginBottom: '4px',
  },
  welcomeText: {
    fontSize: '13px',
  },
  headerInfo: {
    flexDirection: 'column',
    width: '100%',
    gap: '12px',
    alignItems: 'stretch',
  },
  headerRight: {
    width: '100%',
    flexDirection: 'column',
    gap: '8px',
  },
  logo: {
    height: '40px',
  },
  button: {
    width: '100%',
    padding: '12px 16px',
    fontSize: '14px',
  },
};

// Add keyframes and button hover styles
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .kiosk-btn-outline {
    background-color: ${colors.white} !important;
    color: ${colors.primary} !important;
    border: 2px solid ${colors.primary} !important;
  }

  .kiosk-btn-outline:hover {
    background-color: ${colors.primary} !important;
    color: ${colors.white} !important;
  }

  .kiosk-btn-outline:active {
    background-color: ${colors.primaryDark} !important;
    border-color: ${colors.primaryDark} !important;
  }

  .kiosk-btn-primary {
    background-color: ${colors.primary} !important;
    color: ${colors.white} !important;
    border: 2px solid ${colors.primary} !important;
  }

  .kiosk-btn-primary:hover {
    background-color: ${colors.primaryDark} !important;
    border-color: ${colors.primaryDark} !important;
  }

  .kiosk-btn-primary:active {
    background-color: ${colors.goldDark} !important;
    border-color: ${colors.goldDark} !important;
  }
`;
if (!document.head.querySelector('[data-kiosk-home-styles]')) {
  styleSheet.setAttribute('data-kiosk-home-styles', 'true');
  document.head.appendChild(styleSheet);
}
