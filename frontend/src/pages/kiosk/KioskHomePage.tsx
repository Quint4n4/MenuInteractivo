import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ClipboardList, ShoppingCart, Loader2 } from 'lucide-react';
import { productsApi } from '../../api/products';
import { ordersApi } from '../../api/orders';
import { kioskApi } from '../../api/kiosk';
import type { Product, ProductCategory } from '../../types';
import { HeroSection } from '../../components/kiosk/HeroSection';
import { CategoryCarousel } from '../../components/kiosk/CategoryCarousel';
import { CategoryQuickNav } from '../../components/kiosk/CategoryQuickNav';
import { MobileHeaderMenu, type MobileHeaderMenuAction } from '../../components/kiosk/MobileHeaderMenu';
import { CartModal } from '../../components/kiosk/CartModal';
import { AddToCartNotification } from '../../components/kiosk/AddToCartNotification';
import { OrderLimitsIndicator } from '../../components/kiosk/OrderLimitsIndicator';
import { LimitReachedModal } from '../../components/kiosk/LimitReachedModal';
import { WelcomeModal } from '../../components/kiosk/WelcomeModal';
import { InitialWelcomeScreen } from '../../components/kiosk/InitialWelcomeScreen';
import { CannotOrderModal } from '../../components/kiosk/CannotOrderModal';
import ProductRatingsModal from '../../components/kiosk/ProductRatingsModal';
import StaffRatingModal from '../../components/kiosk/StaffRatingModal';
import StayRatingModal from '../../components/kiosk/StayRatingModal';
import { useWebSocket } from '../../hooks/useWebSocket';
import { useKioskState } from '../../hooks/useKioskState';
import { useSurvey } from '../../contexts/SurveyContext';
import { useWindowSize } from '../../utils/responsive';
import { colors, gradients } from '../../styles/colors';
import { TIENDA_CAMSA_URL, RESTAURANTES_CAMSA_URL } from '../../constants/urls';
import logoHorizontal from '../../assets/logos/logo-horizontal.png';
import iconTe from '../../assets/icons/te.png';
import iconStore from '../../assets/icons/store.png';
import iconComida from '../../assets/icons/comida.png';

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
}

// Storage key for cart persistence
const CART_STORAGE_KEY = 'kiosk_cart';

export const KioskHomePage: React.FC = () => {
  const { deviceId } = useParams<{ deviceId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { isMobile } = useWindowSize();

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
  const { hasSeenWelcome, setHasSeenWelcome, updateActivity, resetState } = useKioskState(
    deviceId || '',
    patientId
  );

  const [showWelcomeModal, setShowWelcomeModal] = useState(!hasSeenWelcome);
  const [welcomeModalMode, setWelcomeModalMode] = useState<'welcome' | 'limitsUpdated'>('welcome');
  const [showInitialWelcome, setShowInitialWelcome] = useState(true);
  const [checkingPatient, setCheckingPatient] = useState(false);
  const [patientAssigned, setPatientAssigned] = useState(false);
  const [showCannotOrderModal, setShowCannotOrderModal] = useState(false);

  // Keep modal visibility synced with persisted welcome state
  useEffect(() => {
    if (!showInitialWelcome && !loading) {
      // Keep limits-updated modal open until user explicitly closes it
      if (welcomeModalMode !== 'limitsUpdated') {
        setShowWelcomeModal(!hasSeenWelcome);
        if (!hasSeenWelcome) {
          setWelcomeModalMode('welcome');
        }
      }
    }
  }, [hasSeenWelcome, showInitialWelcome, loading, welcomeModalMode]);
  
  // Survey context
  const { surveyState, startSurvey, setProductRatings, setStaffRating, completeSurvey } = useSurvey();

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

  // Ref para el sondeo de paciente: permite que el intervalo se detenga solo
  // sin estar en las dependencias del efecto. Antes, tener `patientAssigned`
  // en las deps recreaba el intervalo en cada poll/render (flood de peticiones
  // que ademas presionaba la memoria de la pantalla LG).
  const patientAssignedRef = useRef(false);

  // Check for patient assignment periodically when on initial welcome screen
  useEffect(() => {
    if (!showInitialWelcome) return;

    let stopped = false;

    const checkPatient = async () => {
      if (stopped || patientAssignedRef.current || !deviceId) return;
      try {
        const patientData = await kioskApi.getActivePatient(deviceId);
        if (patientData && patientData.patient) {
          patientAssignedRef.current = true;
          setPatientAssigned(true);
        }
      } catch (error) {
        // 404 = aun no hay paciente asignado (estado normal mientras la
        // enfermera registra). Seguimos sondeando: cuando el backend
        // responda, el kiosko se recupera solo sin intervencion.
      }
    };

    // Check immediately
    checkPatient();

    // Then check every 5 seconds (un solo intervalo, creado una sola vez)
    const interval = setInterval(checkPatient, 5000);

    return () => {
      stopped = true;
      clearInterval(interval);
    };
  }, [deviceId, showInitialWelcome]);

  const loadHomeData = async () => {
    try {
      setLoading(true);

      // Check for active orders - but allow patient to stay on home if waiting for survey
      if (deviceId) {
        try {
          const ordersResponse = await ordersApi.getActiveOrdersPublic(deviceId);
          const activeOrders = ordersResponse.orders || [];

          // Check if there are any orders that are not yet delivered or cancelled
          const hasActiveOrders = activeOrders.some((order: any) =>
            ['PLACED', 'PREPARING', 'READY'].includes(order.status)
          );

          // Only redirect to orders page if patient can still order
          // If patient is waiting for survey (can_patient_order = false), they can view orders
          // but we don't force redirect - they can navigate manually if they want
          // This allows them to stay on home page if they prefer
          if (hasActiveOrders) {
            // Check patient info first to see if they can order
            try {
              const patientData = await kioskApi.getActivePatient(deviceId);
              // If patient can order, redirect to orders page
              // If patient cannot order (waiting for survey), allow them to stay on home
              if (patientData.can_patient_order !== false) {
                console.log('Active orders found and patient can order, redirecting to orders page');
                navigate(`/kiosk/${deviceId}/orders`, { replace: true });
                return; // Stop loading home data
              } else {
                console.log('Active orders found but patient cannot order (waiting for survey), staying on home');
                // Patient can view orders manually if they want, but we don't force redirect
              }
            } catch (patientError) {
              // If we can't get patient data, default to redirecting for active orders
              console.log('Active orders found, redirecting to orders page');
              navigate(`/kiosk/${deviceId}/orders`, { replace: true });
              return;
            }
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
          });

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
      // Cargar todos los productos de cada categoría para poder deslizarlos todos
      const productsMap = new Map<number, Product[]>();
      for (const category of categories) {
        let products: Product[] = [];
        try {
          // Traer todos los productos de la categoría (sin límite)
          products = await productsApi.getProductsByCategory(category.id);
        } catch (error) {
          console.error(`Error loading products for category ${category.id}:`, error);
          products = [];
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
      console.log('Order created by staff');
      // If patient can order, redirect to orders page
      // If patient cannot order (waiting for survey), allow them to stay on current page
      // They can navigate to orders manually to view the order
      if (deviceId && patientInfo && patientInfo.can_patient_order !== false) {
        navigate(`/kiosk/${deviceId}/orders`, { replace: true });
      } else {
        console.log('Order created by staff but patient cannot order - staying on current page');
        // Patient can view orders manually if they want
      }
    } else if (message.type === 'patient_assigned') {
      console.log('New patient assigned - updating state and reloading');
      // New assignment must always show WelcomeModal
      resetState();
      setWelcomeModalMode('welcome');
      setShowWelcomeModal(false);
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
      // Reload patient data and show modal with updated limits
      loadHomeData().then(() => {
        setWelcomeModalMode('limitsUpdated');
        setShowWelcomeModal(true);
      });
    } else if (message.type === 'survey_enabled') {
      console.log('Survey enabled via WebSocket - starting survey immediately');
      // When survey is enabled, start survey immediately using global context
      const assignmentId = message.assignment_id;
      // Get staff name from patient info or load it
      const staffName = patientInfo?.staff_name || 'Personal';
      
      if (assignmentId) {
        startSurvey(assignmentId, staffName);
      } else {
        // If no assignment_id, try to get it from patient data
        if (deviceId) {
          kioskApi.getActivePatient(deviceId).then(patientData => {
            if (patientData.id) {
              startSurvey(patientData.id, patientData.staff?.full_name || staffName);
            }
          });
        }
      }
      
      // Update patient info
      setPatientInfo(prev => prev ? {
        ...prev,
        survey_enabled: true,
        can_patient_order: false,
      } : null);
    } else if (message.type === 'session_ended') {
      console.log('Patient session ended by staff - returning to welcome screen');
      resetState();
      // Reset all state to show initial welcome screen
      setPatientInfo(null);
      setPatientId(null);
      setPatientAssigned(false);
      setShowInitialWelcome(true);
      setShowWelcomeModal(false);
      setCart(new Map());
      setActiveOrdersItems(new Map());
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

  const handleAddToCart = (productId: number) => {
    // Check if patient can order
    if (patientInfo && patientInfo.can_patient_order === false) {
      // Patient cannot order, show modal
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

  const handleOpenTienda = () => {
    window.open(TIENDA_CAMSA_URL, '_blank', 'noopener,noreferrer');
  };

  const handleOpenRestaurantes = () => {
    window.open(RESTAURANTES_CAMSA_URL, '_blank', 'noopener,noreferrer');
  };

  const handleLimitReachedClose = () => {
    setShowLimitReachedModal(false);
  };

  const cartTotal = Array.from(cart.values()).reduce((sum, qty) => sum + qty, 0);
  const mobileMenuActions: MobileHeaderMenuAction[] = [
    {
      id: 'orders',
      label: 'Ordenes',
      icon: (
        <img
          src={iconTe}
          alt="Órdenes"
          style={{ width: 18, height: 18, objectFit: 'contain' }}
          draggable={false}
        />
      ),
      group: 'navigation',
      onClick: handleViewOrders,
    }
  ];

  if (loading) {
    return (
      <div style={styles.loading}>
        <Loader2 size={44} color={colors.primary} style={{ animation: 'spin 1s linear infinite', marginBottom: '16px' }} />
        <p style={{ color: colors.textSecondary, fontWeight: 500 }}>Cargando...</p>
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

  return (
    <div style={styles.container}>
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        style={{
          ...styles.header,
          ...(isMobile && responsiveStyles.header),
          flexDirection: isMobile ? 'column' : 'row',
          padding: isMobile ? '10px 14px' : '14px 36px',
        }}
      >
        {/* Left: logo + title */}
        <div style={{ ...styles.headerLeft, ...(isMobile && responsiveStyles.headerLeft) }}>
          <img src={logoHorizontal} alt="Clínica CAMSA" style={{ height: isMobile ? 36 : 48, width: 'auto' }} />
          {!isMobile && <div style={styles.headerDivider} />}
          <div>
            <h1 style={{ ...styles.headerTitle, fontSize: isMobile ? '15px' : '20px', fontFamily: 'var(--font-serif)' }}>
              Servicio a Habitación
            </h1>
            {patientInfo && (
              <>
                <p style={{ ...styles.welcomeText, fontSize: isMobile ? '15px' : '18px' }}>
                  Bienvenido, {patientInfo.full_name}
                </p>
                <p style={{ ...styles.nurseText, fontSize: isMobile ? '13px' : '15px' }}>
                  Tu enfermera: {patientInfo.staff_name}
                </p>
              </>
            )}
          </div>
        </div>

        {/* Right: room info + nav buttons */}
        <div style={{
          ...styles.headerInfo,
          ...(isMobile && responsiveStyles.headerInfo),
          flexDirection: isMobile ? 'column' : 'row',
        }}>
          {patientInfo && (
            <div style={{ ...styles.roomInfo, ...(isMobile && responsiveStyles.roomInfo) }}>
              <div style={{ ...styles.roomLabel, fontSize: isMobile ? '15px' : '18px' }}>
                Habitación: {patientInfo.room_code}
              </div>
              <div style={{ ...styles.deviceLabel }}>Dispositivo: {deviceId}</div>
            </div>
          )}
          {isMobile ? (
            <div style={styles.mobileControlsWrap}>
              {cartTotal > 0 && (
                <motion.button
                  initial={{ scale: 0.92, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.92, opacity: 0 }}
                  whileTap={{ scale: 0.96 }}
                  style={{ ...styles.cartButton, ...styles.mobileCartButton }}
                  onClick={() => setShowCart(true)}
                  aria-label="Carrito"
                >
                  <ShoppingCart size={16} style={{ flexShrink: 0 }} />
                  <span style={{ ...cartBadge, ...styles.mobileCartBadge }}>{cartTotal}</span>
                </motion.button>
              )}
              <div style={styles.mobileMenuWrap}>
                <MobileHeaderMenu actions={mobileMenuActions} buttonLabel="Menu principal" />
              </div>
            </div>
          ) : (
            <div style={styles.headerRight}>
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                style={styles.navButton}
                onClick={handleViewOrders}
              >
                <img
                  src={iconTe}
                  alt="Mis órdenes"
                  style={{ width: 18, height: 18, objectFit: 'contain', marginRight: 6, flexShrink: 0 }}
                  draggable={false}
                />
                Mis Órdenes
              </motion.button>
              <AnimatePresence>
                {cartTotal > 0 && (
                  <motion.button
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    whileHover={{ scale: 1.05, y: -1 }}
                    whileTap={{ scale: 0.96 }}
                    style={styles.cartButton}
                    onClick={() => setShowCart(true)}
                  >
                    <ShoppingCart size={16} style={{ marginRight: '6px', flexShrink: 0 }} />
                    Carrito
                    <span style={cartBadge}>{cartTotal}</span>
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </motion.header>

      {/* Hero Section - Featured Product */}
      {featuredProduct && (
        <HeroSection product={featuredProduct} onAddToCart={handleAddToCart} />
      )}

      {/* External links: tienda + comida */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: isMobile ? '10px' : '16px',
          flexDirection: isMobile ? 'column' : 'row',
          padding: isMobile ? '0 12px' : '0 20px',
          margin: '4px auto 8px',
          maxWidth: '1200px',
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        <a href={TIENDA_CAMSA_URL} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', display: 'block', width: isMobile ? '100%' : 'auto' }}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            borderRadius: '999px',
            padding: isMobile ? '14px 24px' : '14px 32px',
            fontSize: '15px',
            fontWeight: 600,
            fontFamily: 'inherit',
            background: 'linear-gradient(135deg, #E8C547 0%, #C9A227 100%)',
            color: '#fff',
            boxShadow: '0 4px 18px rgba(212, 175, 55, 0.28)',
            whiteSpace: 'nowrap',
            width: isMobile ? '100%' : 'auto',
            boxSizing: 'border-box',
          }}>
            <img src={iconStore} alt="" style={{ width: 18, height: 18, objectFit: 'contain' }} draggable={false} />
            Visitar tienda online
          </span>
        </a>
        <a href={RESTAURANTES_CAMSA_URL} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', display: 'block', width: isMobile ? '100%' : 'auto' }}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            borderRadius: '999px',
            padding: isMobile ? '14px 24px' : '14px 32px',
            fontSize: '15px',
            fontWeight: 600,
            fontFamily: 'inherit',
            background: 'linear-gradient(135deg, #C9A227 0%, #B8860B 100%)',
            color: '#fff',
            boxShadow: '0 4px 18px rgba(184, 134, 11, 0.28)',
            whiteSpace: 'nowrap',
            width: isMobile ? '100%' : 'auto',
            boxSizing: 'border-box',
          }}>
            <img src={iconComida} alt="" style={{ width: 18, height: 18, objectFit: 'contain' }} draggable={false} />
            Pedir comida
          </span>
        </a>
      </motion.div>

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
        mode={welcomeModalMode}
        onClose={() => {
          setShowWelcomeModal(false);
          if (welcomeModalMode === 'welcome') {
            setHasSeenWelcome(true);
          }
          setWelcomeModalMode('welcome');
        }}
      />

      {/* Cannot Order Modal */}
      <CannotOrderModal
        show={showCannotOrderModal}
        onClose={() => setShowCannotOrderModal(false)}
      />

      {/* Survey Modals - Global Context - Show from any page */}
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
              // After survey completion, session will end automatically via WebSocket
              navigate(`/kiosk/${deviceId}`, { replace: true });
            } catch (error: any) {
              console.error('Error completing survey:', error);
              const errorMessage = error.response?.data?.error || 'Error al enviar la encuesta. Por favor intenta de nuevo.';
              alert(errorMessage);
            }
          }}
        />
      )}
    </div>
  );
};

const cartBadge: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: '20px',
  height: '20px',
  padding: '0 5px',
  backgroundColor: colors.white,
  color: colors.espresso,
  borderRadius: '10px',
  fontSize: '12px',
  fontWeight: 700,
  marginLeft: '8px',
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#FAFAF5',
    paddingBottom: '48px',
  },
  loading: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    backgroundColor: '#FAFAF5',
    color: colors.textMuted,
  },
  header: {
    position: 'sticky',
    top: 0,
    zIndex: 100,
    backgroundColor: colors.white,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: `0 2px 16px ${colors.shadowGold}, 0 1px 4px ${colors.shadow}`,
    borderBottom: `2px solid ${colors.primaryMuted}`,
    gap: '12px',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '18px',
    flexShrink: 0,
  },
  headerDivider: {
    width: '1px',
    height: '36px',
    backgroundColor: colors.parchment,
  },
  headerTitle: {
    fontWeight: 700,
    color: colors.espresso,
    margin: '0 0 3px 0',
    lineHeight: 1.2,
  },
  welcomeText: {
    color: colors.primary,
    margin: '2px 0',
    fontWeight: 600,
  },
  nurseText: {
    color: colors.textSecondary,
    margin: '1px 0 0 0',
  },
  headerInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    justifyContent: 'flex-end',
    flex: '1 1 auto',
    minWidth: 0,
    flexWrap: 'wrap',
  },
  roomInfo: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '2px',
    padding: '7px 14px',
    backgroundColor: colors.cream,
    borderRadius: '10px',
    border: `1px solid ${colors.parchment}`,
    flexShrink: 0,
  },
  roomLabel: {
    fontWeight: 700,
    color: colors.primary,
  },
  deviceLabel: {
    fontSize: '11px',
    color: colors.textMuted,
  },
  headerRight: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  mobileMenuWrap: {
    display: 'flex',
    justifyContent: 'flex-end',
  },
  mobileControlsWrap: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    gap: '8px',
  },
  mobileCartButton: {
    width: '44px',
    height: '44px',
    padding: '0',
    borderRadius: '10px',
    boxShadow: `0 2px 8px ${colors.shadowGold}`,
    justifyContent: 'center',
    position: 'relative',
  },
  mobileCartBadge: {
    position: 'absolute',
    top: '-6px',
    right: '-6px',
    marginLeft: 0,
    minWidth: '18px',
    height: '18px',
    fontSize: '10px',
    padding: '0 4px',
  },
  navButton: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '10px 18px',
    backgroundColor: colors.white,
    color: colors.primary,
    border: `2px solid ${colors.primary}`,
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'inherit',
    letterSpacing: '0.2px',
    whiteSpace: 'nowrap',
  },
  cartButton: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '10px 18px',
    background: gradients.gold,
    color: colors.white,
    border: 'none',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'inherit',
    boxShadow: `0 3px 12px ${colors.shadowGold}`,
    whiteSpace: 'nowrap',
  },
};

const responsiveStyles: { [key: string]: React.CSSProperties } = {
  header: {
    alignItems: 'flex-start',
    gap: '8px',
  },
  headerLeft: {
    gap: '10px',
    width: '100%',
  },
  headerInfo: {
    width: '100%',
    gap: '8px',
    alignItems: 'stretch',
  },
  roomInfo: {
    padding: '5px 10px',
    alignItems: 'flex-start',
  },
  headerRight: {
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    gap: '6px',
  },
  button: {
    padding: '8px 12px',
    fontSize: '12px',
  },
};

const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
if (!document.head.querySelector('[data-kiosk-home-styles]')) {
  styleSheet.setAttribute('data-kiosk-home-styles', 'true');
  document.head.appendChild(styleSheet);
}
