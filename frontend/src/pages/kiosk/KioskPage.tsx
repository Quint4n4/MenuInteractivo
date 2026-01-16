import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { productsApi } from '../../api/products';
import { ordersApi } from '../../api/orders';
import axios from 'axios';
import { useWebSocket } from '../../hooks/useWebSocket';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const WS_BASE_URL = import.meta.env.VITE_WS_BASE_URL || 'ws://localhost:8000';

const KioskPage: React.FC = () => {
  const { deviceId } = useParams<{ deviceId: string }>();
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [cart, setCart] = useState<Map<number, number>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [patientInfo, setPatientInfo] = useState<any>(null);
  const [noPatientAssigned, setNoPatientAssigned] = useState(false);
  const [activeOrders, setActiveOrders] = useState<any[]>([]);
  const [showOrders, setShowOrders] = useState(false);
  const [satisfactionModal, setSatisfactionModal] = useState<{ show: boolean; order: any | null }>({
    show: false,
    order: null,
  });
  const [satisfactionComment, setSatisfactionComment] = useState('');
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [showCommentStep, setShowCommentStep] = useState(false);
  const [deviceAssignmentId, setDeviceAssignmentId] = useState<number | null>(null);
  const [showCart, setShowCart] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    show: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    confirmText?: string;
    cancelText?: string;
  }>({
    show: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });
  const [successModal, setSuccessModal] = useState<{
    show: boolean;
    title: string;
    message: string;
  }>({
    show: false,
    title: '',
    message: '',
  });

  const deviceUid = deviceId || '01';

  // Use ref to store latest activeOrders for WebSocket callback
  const activeOrdersRef = useRef<any[]>([]);
  const showOrdersRef = useRef<boolean>(false);

  useEffect(() => {
    activeOrdersRef.current = activeOrders;
  }, [activeOrders]);

  useEffect(() => {
    showOrdersRef.current = showOrders;
  }, [showOrders]);

  // WebSocket message handler with useCallback
  const handleWebSocketMessage = useCallback(async (message: any) => {
    console.log('WebSocket message received:', message);

    if (message.type === 'order_status_changed') {
      console.log('Order status changed:', message);

      // If order was marked as delivered, show satisfaction modal
      if (message.status === 'DELIVERED') {
        // Find the order details from active orders or fetch it
        let order = activeOrdersRef.current.find((o: any) => o.id === message.order_id);

        // If order not in active list, fetch all orders to get it
        if (!order) {
          try {
            const response = await ordersApi.getActiveOrdersPublic(deviceUid);
            const allOrders = response.orders || [];
            order = allOrders.find((o: any) => o.id === message.order_id);
          } catch (err) {
            console.error('Failed to fetch order details:', err);
          }
        }

        if (order) {
          setSatisfactionModal({
            show: true,
            order: order,
          });
        }
      }

      // Reload active orders to update the list
      if (showOrdersRef.current) {
        loadActiveOrders();
      }
    } else if (message.type === 'patient_assigned') {
      console.log('New patient assigned:', message);
      // Reload patient info and close the "no patient" screen
      loadData();
    } else if (message.type === 'order_created_by_staff') {
      console.log('Order created by staff:', message);
      // Automatically navigate to order status view
      setShowOrders(true);
      loadActiveOrders();
    }
  }, [deviceUid]);

  // WebSocket connection for real-time order updates
  const wsUrl = `${WS_BASE_URL}/ws/kiosk/orders/?device_uid=${deviceUid}`;

  const { isConnected } = useWebSocket({
    url: wsUrl,
    onMessage: handleWebSocketMessage,
    onOpen: () => {
      console.log('✅ Kiosk WebSocket connected');
    },
    onClose: () => {
      console.log('❌ Kiosk WebSocket disconnected');
    },
    onError: (error) => {
      console.error('⚠️ Kiosk WebSocket error:', error);
    },
  });

  useEffect(() => {
    loadData();
  }, [deviceId]);

  useEffect(() => {
    if (showOrders) {
      loadActiveOrders();
    }
  }, [showOrders]);

  // Handle window resize for responsive design
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Helper functions for responsive breakpoints
  const isMobile = windowWidth < 768;
  const isTablet = windowWidth >= 768 && windowWidth < 1024;
  const isDesktop = windowWidth >= 1024;

  const loadData = async () => {
    try {
      setLoading(true);
      setNoPatientAssigned(false);
      console.log('Loading data for device:', deviceUid);

      // Load patient info for this device
      try {
        const patientResponse = await axios.get(
          `${API_BASE_URL}/api/public/kiosk/device/${deviceUid}/active-patient/`
        );
        console.log('Patient info:', patientResponse.data);
        setPatientInfo(patientResponse.data);
        setDeviceAssignmentId(patientResponse.data.assignment_id);
      } catch (err: any) {
        if (err.response?.status === 404) {
          console.log('No patient assigned to this device');
          setNoPatientAssigned(true);
          setPatientInfo(null);
          setDeviceAssignmentId(null);
        } else {
          throw err;
        }
      }

      // Load products and categories
      const [productsData, categoriesData] = await Promise.all([
        productsApi.getPublicProducts(),
        productsApi.getPublicCategories(),
      ]);

      const productsArray = productsData?.results || (Array.isArray(productsData) ? productsData : []);
      const categoriesArray = categoriesData?.results || (Array.isArray(categoriesData) ? categoriesData : []);

      setProducts(productsArray);
      setCategories(categoriesArray);
      setError(null);
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.message || 'Failed to load data';
      setError(errorMsg);
      console.error('Load data error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadActiveOrders = useCallback(async () => {
    try {
      const response = await ordersApi.getActiveOrdersPublic(deviceUid);
      setActiveOrders(response.orders || []);
    } catch (err) {
      console.error('Failed to load active orders:', err);
    }
  }, [deviceUid]);

  const handleRatingSelect = (rating: number) => {
    setSelectedRating(rating);
    setShowCommentStep(true);
  };

  const handleSatisfactionSubmit = async (includeComment: boolean) => {
    if (!satisfactionModal.order || selectedRating === null) return;

    try {
      console.log(`Submitting satisfaction rating for order #${satisfactionModal.order.id}: ${selectedRating}`);

      // Submit feedback to backend
      await ordersApi.submitFeedback(satisfactionModal.order.id, {
        device_uid: deviceUid,
        satisfaction_rating: selectedRating,
        comment: includeComment ? satisfactionComment || undefined : undefined,
      });

      // Close satisfaction modal and reset state
      setSatisfactionModal({ show: false, order: null });
      setSatisfactionComment('');
      setSelectedRating(null);
      setShowCommentStep(false);

      // Show thank you message with success modal
      setSuccessModal({
        show: true,
        title: 'Thank You!',
        message: 'Your feedback has been submitted successfully. We appreciate your response!',
      });

      // Reload orders
      if (showOrders) {
        loadActiveOrders();
      }
    } catch (err: any) {
      console.error('Failed to submit satisfaction rating:', err);

      const errorMessage = err.response?.data?.error || 'Failed to submit feedback. Please try again.';

      setConfirmModal({
        show: true,
        title: 'Error',
        message: errorMessage,
        onConfirm: () => setConfirmModal({ ...confirmModal, show: false }),
        confirmText: 'OK',
        cancelText: undefined,
      });
    }
  };

  const addToCart = (productId: number) => {
    setCart((prev) => {
      const newCart = new Map(prev);
      newCart.set(productId, (newCart.get(productId) || 0) + 1);
      return newCart;
    });
  };

  const removeFromCart = (productId: number) => {
    setCart((prev) => {
      const newCart = new Map(prev);
      const currentQty = newCart.get(productId) || 0;
      if (currentQty > 1) {
        newCart.set(productId, currentQty - 1);
      } else {
        newCart.delete(productId);
      }
      return newCart;
    });
  };

  const handlePlaceOrder = async () => {
    if (cartTotal === 0) {
      setConfirmModal({
        show: true,
        title: 'Empty Cart',
        message: 'Please add items to your cart before placing an order.',
        onConfirm: () => setConfirmModal({ ...confirmModal, show: false }),
        confirmText: 'OK',
        cancelText: undefined,
      });
      return;
    }

    setConfirmModal({
      show: true,
      title: 'Confirm Order',
      message: `You have ${cartTotal} item${cartTotal > 1 ? 's' : ''} in your cart. Do you want to place this order?`,
      onConfirm: async () => {
        setConfirmModal({ ...confirmModal, show: false });

        try {
          const items = Array.from(cart.entries()).map(([productId, quantity]) => ({
            product_id: productId,
            quantity,
          }));

          const response = await ordersApi.createOrderPublic({
            device_uid: deviceUid,
            items,
          });

          setSuccessModal({
            show: true,
            title: 'Order Placed!',
            message: `Your order #${response.order.id} has been placed successfully. Our staff will prepare it shortly.`,
          });

          setCart(new Map());
          setShowCart(false);

          // Automatically switch to "My Orders" view
          setShowOrders(true);
          loadActiveOrders();
        } catch (err: any) {
          const errorMsg = err.response?.data?.error || 'Failed to place order';
          setConfirmModal({
            show: true,
            title: 'Order Failed',
            message: errorMsg,
            onConfirm: () => setConfirmModal({ ...confirmModal, show: false }),
            confirmText: 'OK',
            cancelText: undefined,
          });
          console.error(err);
        }
      },
      confirmText: 'Place Order',
      cancelText: 'Cancel',
    });
  };

  const filteredProducts = selectedCategory
    ? products.filter((p) => p.category === selectedCategory)
    : products;

  const cartTotal = Array.from(cart.values()).reduce((sum, qty) => sum + qty, 0);

  const cartItems = Array.from(cart.entries()).map(([productId, qty]) => {
    const product = products.find(p => p.id === productId);
    return { product, quantity: qty };
  }).filter(item => item.product);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PLACED':
        return '#e74c3c';
      case 'PREPARING':
        return '#f39c12';
      case 'READY':
        return '#3498db';
      case 'DELIVERED':
        return '#27ae60';
      case 'CANCELLED':
        return '#95a5a6';
      default:
        return '#95a5a6';
    }
  };

  if (loading) {
    return <div style={styles.container}>Loading...</div>;
  }

  if (error) {
    return <div style={styles.container}>{error}</div>;
  }

  if (noPatientAssigned) {
    return (
      <div style={styles.container}>
        <header style={styles.header}>
          <h1>Room Service - No Patient Assigned</h1>
          <div style={styles.deviceInfo}>Device: {deviceUid}</div>
        </header>
        <div style={styles.noPatient}>
          <h2>⚠️ No Patient Assigned</h2>
          <p>There is currently no patient assigned to this device.</p>
          <p>Please contact the staff to register a patient.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <header style={{
        ...styles.header,
        flexDirection: isMobile ? 'column' as const : 'row' as const,
        alignItems: isMobile ? 'flex-start' : 'center',
        gap: isMobile ? '15px' : '0',
        padding: isMobile ? '15px' : '20px'
      }}>
        <div>
          <h1 style={{fontSize: isMobile ? '20px' : '28px', margin: 0}}>Room Service Order</h1>
          {patientInfo && (
            <>
              <div style={{...styles.patientWelcome, fontSize: isMobile ? '14px' : '16px'}}>
                Welcome, <strong>{patientInfo.patient.full_name}</strong>
              </div>
              <div style={{...styles.staffInfo, fontSize: isMobile ? '12px' : '14px'}}>
                Your nurse: <strong>{patientInfo.staff.full_name}</strong>
              </div>
            </>
          )}
        </div>
        <div style={{...styles.headerRight, textAlign: isMobile ? 'left' as const : 'right' as const}}>
          {patientInfo && (
            <div style={styles.roomInfo}>
              Room: <strong>{patientInfo.room.code}</strong>
            </div>
          )}
          <div style={styles.deviceInfo}>
            Device: {deviceUid}
            <span style={{
              marginLeft: '10px',
              color: isConnected ? '#27ae60' : '#e74c3c',
              fontSize: '12px'
            }}>
              {isConnected ? '● Live' : '○ Offline'}
            </span>
          </div>
          {!showOrders && cartTotal > 0 && (
            <button
              style={styles.cartButtonHeader}
              onClick={() => setShowCart(true)}
            >
              🛒 Cart ({cartTotal})
            </button>
          )}
        </div>
      </header>

      <div style={{
        ...styles.topBar,
        flexDirection: isMobile ? 'column' as const : 'row' as const,
        gap: isMobile ? '15px' : '0',
        padding: isMobile ? '15px' : '20px'
      }}>
        <div style={styles.categories}>
          <button
            style={{
              ...(selectedCategory === null ? styles.categoryButtonActive : styles.categoryButton),
              padding: isMobile ? '8px 15px' : '10px 20px',
              fontSize: isMobile ? '14px' : '16px'
            }}
            onClick={() => setSelectedCategory(null)}
          >
            All
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              style={{
                ...(selectedCategory === category.id ? styles.categoryButtonActive : styles.categoryButton),
                padding: isMobile ? '8px 15px' : '10px 20px',
                fontSize: isMobile ? '14px' : '16px'
              }}
              onClick={() => setSelectedCategory(category.id)}
            >
              {category.name}
            </button>
          ))}
        </div>
        <button
          style={{
            ...(showOrders ? styles.viewOrdersButtonActive : styles.viewOrdersButton),
            marginLeft: isMobile ? '0' : '20px',
            width: isMobile ? '100%' : 'auto',
            padding: isMobile ? '12px 20px' : '10px 20px'
          }}
          onClick={() => setShowOrders(!showOrders)}
        >
          {showOrders ? 'View Menu' : 'My Orders'}
        </button>
      </div>

      {showOrders ? (
        <div style={styles.ordersContainer}>
          <div style={styles.ordersHeader}>
            <h2 style={styles.ordersTitle}>Mis pedidos activos</h2>
            <button onClick={() => setShowOrders(false)} style={styles.newOrderButton}>
              + Hacer nuevo pedido
            </button>
          </div>
          {activeOrders.length === 0 ? (
            <div style={styles.emptyOrders}>
              <p>No tienes pedidos activos</p>
              <button onClick={() => setShowOrders(false)} style={styles.startOrderButton}>
                Hacer un pedido
              </button>
            </div>
          ) : (
            <div style={styles.ordersList}>
              {activeOrders.map((order: any) => (
                <div key={order.id} style={styles.orderCard}>
                  <div style={styles.orderHeader}>
                    <h3>Order #{order.id}</h3>
                    <span style={{
                      ...styles.orderStatus,
                      backgroundColor: getStatusColor(order.status),
                    }}>
                      {order.status_display}
                    </span>
                  </div>
                  <div style={styles.orderItems}>
                    {order.items.map((item: any) => (
                      <div key={item.id} style={styles.orderItem}>
                        <span>{item.product_name} x{item.quantity}</span>
                      </div>
                    ))}
                  </div>
                  <div style={styles.orderTime}>
                    Placed: {new Date(order.placed_at).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div style={{
          ...styles.productsGrid,
          gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(auto-fill, minmax(200px, 1fr))' : 'repeat(auto-fill, minmax(250px, 1fr))',
          gap: isMobile ? '15px' : '20px',
          padding: isMobile ? '15px' : '20px'
        }}>
          {filteredProducts.map((product) => {
            const qty = cart.get(product.id) || 0;
            const isOutOfStock = product.is_available === false;

            return (
              <div
                key={product.id}
                style={{
                  ...styles.productCard,
                  opacity: isOutOfStock ? 0.6 : 1,
                }}
              >
                <div style={{ position: 'relative' }}>
                  {product.image_url_full && (
                    <img
                      src={product.image_url_full}
                      alt={product.name}
                      style={{
                        ...styles.productImage,
                        filter: isOutOfStock ? 'grayscale(100%)' : 'none',
                      }}
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  )}
                  {isOutOfStock && (
                    <div style={styles.outOfStockBadge}>
                      Agotado
                    </div>
                  )}
                </div>
                <div style={styles.productContent}>
                  <h3>{product.name}</h3>
                  <p style={styles.description}>{product.description}</p>
                  <p style={styles.unit}>{product.unit_label}</p>
                  {product.available !== null && product.available !== undefined && !isOutOfStock && (
                    <p style={styles.stockInfo}>
                      Disponibles: {product.available}
                    </p>
                  )}
                </div>
                <div style={styles.productActions}>
                  {isOutOfStock ? (
                    <button
                      style={{
                        ...styles.addButton,
                        backgroundColor: '#95a5a6',
                        cursor: 'not-allowed',
                      }}
                      disabled
                    >
                      No disponible
                    </button>
                  ) : qty > 0 ? (
                    <div style={styles.quantityControl}>
                      <button onClick={() => removeFromCart(product.id)} style={styles.qtyButton}>
                        -
                      </button>
                      <span style={styles.quantity}>{qty}</span>
                      <button onClick={() => addToCart(product.id)} style={styles.qtyButton}>
                        +
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => addToCart(product.id)} style={styles.addButton}>
                      Add to Order
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Cart Sidebar Modal */}
      {showCart && (
        <div style={styles.cartSidebarOverlay} onClick={() => setShowCart(false)}>
          <div style={{
            ...styles.cartSidebar,
            width: isMobile ? '100%' : isTablet ? '350px' : '400px',
            maxWidth: isMobile ? '100%' : '90%'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={styles.cartHeader}>
              <h2>Your Cart ({cartTotal} items)</h2>
              <button style={styles.closeCartButton} onClick={() => setShowCart(false)}>
                ✕
              </button>
            </div>

            <div style={styles.cartBody}>
              {cartItems.length === 0 ? (
                <div style={styles.emptyCart}>
                  <p>Your cart is empty</p>
                </div>
              ) : (
                <>
                  {cartItems.map(({ product, quantity }) => (
                    <div key={product!.id} style={styles.cartItem}>
                      <div style={styles.cartItemInfo}>
                        <h4>{product!.name}</h4>
                        <p style={styles.cartItemUnit}>{product!.unit_label}</p>
                      </div>
                      <div style={styles.cartItemControls}>
                        <button
                          style={styles.cartQtyButton}
                          onClick={() => removeFromCart(product!.id)}
                        >
                          -
                        </button>
                        <span style={styles.cartItemQty}>{quantity}</span>
                        <button
                          style={styles.cartQtyButton}
                          onClick={() => addToCart(product!.id)}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>

            <div style={styles.cartFooterSidebar}>
              <button
                style={styles.placeOrderButtonSidebar}
                onClick={handlePlaceOrder}
                disabled={cartTotal === 0}
              >
                Place Order ({cartTotal} items)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal.show && (
        <div style={styles.modalOverlay} onClick={() => !confirmModal.cancelText && setConfirmModal({ ...confirmModal, show: false })}>
          <div style={{
            ...styles.confirmModalContent,
            padding: isMobile ? '20px' : '30px',
            margin: isMobile ? '10px' : '0'
          }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{...styles.confirmModalTitle, fontSize: isMobile ? '20px' : '24px'}}>{confirmModal.title}</h2>
            <p style={{...styles.confirmModalMessage, fontSize: isMobile ? '14px' : '16px'}}>{confirmModal.message}</p>
            <div style={{
              ...styles.confirmModalButtons,
              flexDirection: isMobile ? 'column' as const : 'row' as const,
              gap: isMobile ? '10px' : '15px'
            }}>
              {confirmModal.cancelText && (
                <button
                  style={styles.cancelButton}
                  onClick={() => setConfirmModal({ ...confirmModal, show: false })}
                >
                  {confirmModal.cancelText}
                </button>
              )}
              <button
                style={styles.confirmButton}
                onClick={confirmModal.onConfirm}
              >
                {confirmModal.confirmText || 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {successModal.show && (
        <div style={styles.modalOverlay} onClick={() => setSuccessModal({ ...successModal, show: false })}>
          <div style={styles.successModalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.successIcon}>✓</div>
            <h2 style={styles.successModalTitle}>{successModal.title}</h2>
            <p style={styles.successModalMessage}>{successModal.message}</p>
            <button
              style={styles.successButton}
              onClick={() => setSuccessModal({ ...successModal, show: false })}
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* Satisfaction Modal */}
      {satisfactionModal.show && (
        <div style={styles.modalOverlay} onClick={() => {
          setSatisfactionModal({ show: false, order: null });
          setSatisfactionComment('');
          setSelectedRating(null);
          setShowCommentStep(false);
        }}>
          <div style={{
            ...styles.modalContent,
            padding: isMobile ? '20px' : '40px'
          }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{...styles.modalTitle, fontSize: isMobile ? '24px' : '32px'}}>¡Pedido entregado!</h2>
            <p style={{...styles.modalSubtitle, fontSize: isMobile ? '16px' : '18px'}}>
              Su pedido n° {satisfactionModal.order?.id} ha sido entregado
            </p>

            {!showCommentStep ? (
              <>
                {/* Step 1: Rating Selection */}
                <p style={{...styles.modalQuestion, fontSize: isMobile ? '18px' : '20px'}}>¿Qué tan satisfecho está usted con su pedido?</p>
                <div style={{
                  ...styles.ratingButtons,
                  flexDirection: isMobile ? 'column' as const : 'row' as const,
                  gap: isMobile ? '15px' : '10px'
                }}>
                  <button
                    style={{ ...styles.ratingButton, backgroundColor: '#e74c3c' }}
                    onClick={() => handleRatingSelect(1)}
                  >
                    😞<br />Muy<br />insatisfecho
                  </button>
                  <button
                    style={{ ...styles.ratingButton, backgroundColor: '#f39c12' }}
                    onClick={() => handleRatingSelect(2)}
                  >
                    😕<br />Insatisfecho
                  </button>
                  <button
                    style={{ ...styles.ratingButton, backgroundColor: '#f1c40f' }}
                    onClick={() => handleRatingSelect(3)}
                  >
                    😐<br />Neutral
                  </button>
                  <button
                    style={{ ...styles.ratingButton, backgroundColor: '#3498db' }}
                    onClick={() => handleRatingSelect(4)}
                  >
                    🙂<br />Satisfecho
                  </button>
                  <button
                    style={{ ...styles.ratingButton, backgroundColor: '#27ae60' }}
                    onClick={() => handleRatingSelect(5)}
                  >
                    😄<br />Muy<br />satisfecho
                  </button>
                </div>
                <button
                  style={styles.skipButton}
                  onClick={() => {
                    setSatisfactionModal({ show: false, order: null });
                    setSatisfactionComment('');
                    setSelectedRating(null);
                    setShowCommentStep(false);
                  }}
                >
                  Saltar
                </button>
              </>
            ) : (
              <>
                {/* Step 2: Comment Section */}
                <p style={styles.commentLabel}>Comentarios adicionales (opcionales)</p>
                <textarea
                  style={styles.commentTextarea}
                  placeholder="Cuéntanos más sobre tu experiencia..."
                  value={satisfactionComment}
                  onChange={(e) => setSatisfactionComment(e.target.value)}
                  rows={4}
                  autoFocus
                />

                <div style={styles.commentButtons}>
                  <button
                    style={styles.submitWithoutCommentButton}
                    onClick={() => handleSatisfactionSubmit(false)}
                  >
                    Enviar sin comentario
                  </button>
                  <button
                    style={styles.submitWithCommentButton}
                    onClick={() => handleSatisfactionSubmit(true)}
                  >
                    Enviar con comentario
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
    paddingBottom: '100px',
  },
  header: {
    backgroundColor: '#2c3e50',
    color: 'white',
    padding: '20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerRight: {
    textAlign: 'right',
  },
  patientWelcome: {
    fontSize: '16px',
    marginTop: '8px',
    opacity: 0.9,
  },
  staffInfo: {
    fontSize: '14px',
    marginTop: '5px',
    opacity: 0.8,
  },
  roomInfo: {
    fontSize: '16px',
    marginBottom: '8px',
  },
  deviceInfo: {
    fontSize: '14px',
    opacity: 0.8,
  },
  noPatient: {
    textAlign: 'center',
    padding: '60px 20px',
    color: '#666',
  },
  topBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px',
    backgroundColor: 'white',
    borderBottom: '1px solid #ddd',
  },
  categories: {
    display: 'flex',
    gap: '10px',
    overflowX: 'auto',
    flex: 1,
  },
  viewOrdersButton: {
    padding: '10px 20px',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontWeight: 'bold',
    marginLeft: '20px',
    whiteSpace: 'nowrap',
  },
  viewOrdersButtonActive: {
    padding: '10px 20px',
    backgroundColor: '#2980b9',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontWeight: 'bold',
    marginLeft: '20px',
    whiteSpace: 'nowrap',
  },
  categoryButton: {
    padding: '10px 20px',
    border: '1px solid #ddd',
    borderRadius: '20px',
    backgroundColor: 'white',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  categoryButtonActive: {
    padding: '10px 20px',
    border: '1px solid #3498db',
    borderRadius: '20px',
    backgroundColor: '#3498db',
    color: 'white',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  productsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
    gap: '20px',
    padding: '20px',
  },
  productCard: {
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    overflow: 'hidden' as const,
    display: 'flex' as const,
    flexDirection: 'column' as const,
  },
  productImage: {
    width: '100%',
    height: '200px',
    objectFit: 'contain' as const,
    backgroundColor: '#f8f9fa',
    padding: '10px',
  },
  productContent: {
    padding: '15px 20px',
    flex: 1,
  },
  description: {
    color: '#666',
    fontSize: '14px',
    margin: '10px 0',
  },
  unit: {
    color: '#999',
    fontSize: '12px',
  },
  stockInfo: {
    color: '#27ae60',
    fontSize: '13px',
    fontWeight: 'bold',
    marginTop: '8px',
  },
  outOfStockBadge: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    color: 'white',
    padding: '10px 20px',
    borderRadius: '8px',
    fontSize: '18px',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    zIndex: 10,
  },
  productActions: {
    padding: '0 20px 20px 20px',
  },
  addButton: {
    width: '100%',
    padding: '10px',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '16px',
  },
  quantityControl: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '15px',
  },
  qtyButton: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    border: '1px solid #3498db',
    backgroundColor: 'white',
    color: '#3498db',
    fontSize: '20px',
    cursor: 'pointer',
  },
  quantity: {
    fontSize: '18px',
    fontWeight: 'bold',
    minWidth: '30px',
    textAlign: 'center',
  },
  cartFooter: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    padding: '20px',
    boxShadow: '0 -2px 10px rgba(0,0,0,0.1)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cartInfo: {
    fontSize: '16px',
    fontWeight: 'bold',
  },
  placeOrderButton: {
    padding: '15px 40px',
    backgroundColor: '#27ae60',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    fontSize: '18px',
    cursor: 'pointer',
    fontWeight: 'bold',
  },
  ordersContainer: {
    padding: '20px',
  },
  ordersHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  ordersTitle: {
    fontSize: '24px',
    margin: 0,
    color: '#2c3e50',
  },
  newOrderButton: {
    padding: '12px 24px',
    backgroundColor: '#27ae60',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold',
    transition: 'background-color 0.2s',
  },
  emptyOrders: {
    textAlign: 'center',
    padding: '60px 20px',
    color: '#666',
  },
  startOrderButton: {
    marginTop: '20px',
    padding: '12px 30px',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold',
  },
  ordersList: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '20px',
  },
  orderCard: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  orderHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '15px',
  },
  orderStatus: {
    padding: '5px 12px',
    borderRadius: '20px',
    color: 'white',
    fontSize: '12px',
    fontWeight: 'bold',
  },
  orderItems: {
    marginBottom: '15px',
  },
  orderItem: {
    padding: '8px 0',
    borderBottom: '1px solid #f0f0f0',
    fontSize: '14px',
  },
  orderTime: {
    fontSize: '12px',
    color: '#999',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: 'white',
    padding: '40px',
    borderRadius: '12px',
    maxWidth: '600px',
    width: '90%',
    textAlign: 'center',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
  },
  modalTitle: {
    fontSize: '32px',
    color: '#27ae60',
    marginBottom: '10px',
  },
  modalSubtitle: {
    fontSize: '18px',
    color: '#666',
    marginBottom: '30px',
  },
  modalQuestion: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: '30px',
  },
  ratingButtons: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '10px',
    marginBottom: '30px',
  },
  ratingButton: {
    flex: 1,
    padding: '20px 10px',
    border: 'none',
    borderRadius: '8px',
    color: 'white',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'transform 0.2s',
    lineHeight: '1.5',
  },
  skipButton: {
    padding: '12px 30px',
    backgroundColor: '#95a5a6',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    fontSize: '16px',
    cursor: 'pointer',
  },
  commentSection: {
    marginTop: '30px',
    marginBottom: '20px',
    textAlign: 'left',
  },
  commentLabel: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: '15px',
    textAlign: 'center',
  },
  commentTextarea: {
    width: '100%',
    padding: '15px',
    fontSize: '16px',
    border: '2px solid #ddd',
    borderRadius: '8px',
    resize: 'vertical',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
    marginBottom: '20px',
  },
  commentButtons: {
    display: 'flex',
    gap: '15px',
    marginTop: '20px',
  },
  submitWithoutCommentButton: {
    flex: 1,
    padding: '15px 20px',
    backgroundColor: '#95a5a6',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  submitWithCommentButton: {
    flex: 1,
    padding: '15px 20px',
    backgroundColor: '#27ae60',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  cartButtonHeader: {
    padding: '10px 20px',
    backgroundColor: '#27ae60',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    marginLeft: '10px',
  },
  cartSidebarOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 999,
  },
  cartSidebar: {
    position: 'fixed',
    top: 0,
    right: 0,
    bottom: 0,
    width: '400px',
    maxWidth: '90%',
    backgroundColor: 'white',
    boxShadow: '-2px 0 10px rgba(0, 0, 0, 0.2)',
    display: 'flex',
    flexDirection: 'column',
    zIndex: 1000,
  },
  cartHeader: {
    padding: '20px',
    borderBottom: '1px solid #ddd',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#2c3e50',
    color: 'white',
  },
  closeCartButton: {
    backgroundColor: 'transparent',
    border: 'none',
    color: 'white',
    fontSize: '24px',
    cursor: 'pointer',
    padding: '5px 10px',
  },
  cartBody: {
    flex: 1,
    overflowY: 'auto',
    padding: '20px',
  },
  emptyCart: {
    textAlign: 'center',
    padding: '40px 20px',
    color: '#999',
  },
  cartItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '15px',
    borderBottom: '1px solid #f0f0f0',
    marginBottom: '10px',
    backgroundColor: '#f9f9f9',
    borderRadius: '5px',
  },
  cartItemInfo: {
    flex: 1,
  },
  cartItemUnit: {
    fontSize: '12px',
    color: '#999',
    margin: '5px 0 0 0',
  },
  cartItemControls: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  cartQtyButton: {
    width: '30px',
    height: '30px',
    borderRadius: '50%',
    border: '1px solid #3498db',
    backgroundColor: 'white',
    color: '#3498db',
    fontSize: '16px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartItemQty: {
    fontSize: '16px',
    fontWeight: 'bold',
    minWidth: '30px',
    textAlign: 'center',
  },
  cartFooterSidebar: {
    padding: '20px',
    borderTop: '1px solid #ddd',
    backgroundColor: '#f9f9f9',
  },
  placeOrderButtonSidebar: {
    width: '100%',
    padding: '15px',
    backgroundColor: '#27ae60',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    fontSize: '18px',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  confirmModalContent: {
    backgroundColor: 'white',
    padding: '30px',
    borderRadius: '12px',
    maxWidth: '450px',
    width: '90%',
    textAlign: 'center',
  },
  confirmModalTitle: {
    fontSize: '24px',
    color: '#2c3e50',
    marginBottom: '15px',
  },
  confirmModalMessage: {
    fontSize: '16px',
    color: '#666',
    marginBottom: '25px',
    lineHeight: '1.5',
  },
  confirmModalButtons: {
    display: 'flex',
    gap: '10px',
    justifyContent: 'center',
  },
  cancelButton: {
    padding: '12px 30px',
    backgroundColor: '#95a5a6',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    fontSize: '16px',
    cursor: 'pointer',
    fontWeight: 'bold',
  },
  confirmButton: {
    padding: '12px 30px',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    fontSize: '16px',
    cursor: 'pointer',
    fontWeight: 'bold',
  },
  successModalContent: {
    backgroundColor: 'white',
    padding: '40px',
    borderRadius: '12px',
    maxWidth: '450px',
    width: '90%',
    textAlign: 'center',
  },
  successIcon: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    backgroundColor: '#27ae60',
    color: 'white',
    fontSize: '48px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 20px',
  },
  successModalTitle: {
    fontSize: '24px',
    color: '#27ae60',
    marginBottom: '15px',
  },
  successModalMessage: {
    fontSize: '16px',
    color: '#666',
    marginBottom: '25px',
    lineHeight: '1.5',
  },
  successButton: {
    padding: '12px 40px',
    backgroundColor: '#27ae60',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    fontSize: '16px',
    cursor: 'pointer',
    fontWeight: 'bold',
  },
};

export default KioskPage;
