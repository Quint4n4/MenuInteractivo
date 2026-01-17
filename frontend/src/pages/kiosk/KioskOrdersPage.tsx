import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ordersApi } from '../../api/orders';
import { kioskApi } from '../../api/kiosk';
import { OrderStatusProgress } from '../../components/kiosk/OrderStatusProgress';
import { SatisfactionModal } from '../../components/kiosk/SatisfactionModal';
import { ThankYouModal } from '../../components/kiosk/ThankYouModal';
import { useWebSocket } from '../../hooks/useWebSocket';
import { colors } from '../../styles/colors';

const WS_BASE_URL = import.meta.env.VITE_WS_BASE_URL || 'ws://localhost:8000';

interface PatientInfo {
  full_name: string;
  room_code: string;
  staff_name: string;
}

interface OrderItem {
  id: number;
  product_name: string;
  quantity: number;
  unit_label: string;
}

interface Order {
  id: number;
  status: 'PLACED' | 'PREPARING' | 'READY' | 'DELIVERED' | 'CANCELLED';
  status_display: string;
  placed_at: string;
  delivered_at: string | null;
  items: OrderItem[];
}

export const KioskOrdersPage: React.FC = () => {
  const { deviceId } = useParams<{ deviceId: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [patientInfo, setPatientInfo] = useState<PatientInfo | null>(null);
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [expandedOrders, setExpandedOrders] = useState<Set<number>>(new Set());
  const [satisfactionModal, setSatisfactionModal] = useState<{
    show: boolean;
    orderId: number | null;
  }>({ show: false, orderId: null });
  const [showThankYouModal, setShowThankYouModal] = useState(false);

  // WebSocket message handler
  const handleWebSocketMessage = useCallback(async (message: any) => {
    console.log('WebSocket message received:', message);

    if (message.type === 'order_status_changed') {
      console.log('Order status changed:', message);

      // If order was marked as delivered, show satisfaction modal
      if (message.status === 'DELIVERED') {
        setSatisfactionModal({
          show: true,
          orderId: message.order_id,
        });
      }

      // Reload active orders to update the list
      if (deviceId) {
        try {
          const ordersResponse = await ordersApi.getActiveOrdersPublic(deviceId);
          setActiveOrders(ordersResponse.orders || []);
        } catch (error) {
          console.error('Failed to reload orders:', error);
        }
      }
    } else if (message.type === 'order_created_by_staff') {
      console.log('Order created by staff:', message);

      // Reload active orders to show the new order
      if (deviceId) {
        try {
          const ordersResponse = await ordersApi.getActiveOrdersPublic(deviceId);
          setActiveOrders(ordersResponse.orders || []);
        } catch (error) {
          console.error('Failed to reload orders:', error);
        }
      }
    } else if (message.type === 'session_ended') {
      console.log('Patient session ended by staff - redirecting to home page');
      // When staff ends the session, redirect to the home page (shows welcome screen)
      if (deviceId) {
        navigate(`/kiosk/${deviceId}/home`, { replace: true });
      }
    }
  }, [deviceId, navigate]);

  // WebSocket connection for real-time order updates
  const wsUrl = deviceId ? `${WS_BASE_URL}/ws/kiosk/orders/?device_uid=${deviceId}` : '';

  const { isConnected } = useWebSocket({
    url: wsUrl,
    onMessage: handleWebSocketMessage,
    onOpen: () => {
      console.log('✅ Kiosk Orders WebSocket connected');
    },
    onClose: () => {
      console.log('❌ Kiosk Orders WebSocket disconnected');
    },
    onError: (error) => {
      console.error('⚠️ Kiosk Orders WebSocket error:', error);
    },
  });

  useEffect(() => {
    loadData();
  }, [deviceId]);

  // Intercept back navigation when there are active orders
  useEffect(() => {
    const hasActiveOrders = activeOrders.some(
      (order) => ['PLACED', 'PREPARING', 'READY'].includes(order.status)
    );

    if (hasActiveOrders) {
      const handlePopState = (e: PopStateEvent) => {
        e.preventDefault();
        // Prevent going back to menu if there are active orders
        window.history.pushState(null, '', window.location.href);
        console.log('Cannot navigate back - active orders exist');
      };

      // Push initial state
      window.history.pushState(null, '', window.location.href);
      window.addEventListener('popstate', handlePopState);

      return () => {
        window.removeEventListener('popstate', handlePopState);
      };
    }
  }, [activeOrders]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load patient information
      if (deviceId) {
        try {
          const patientData = await kioskApi.getActivePatient(deviceId);
          setPatientInfo({
            full_name: patientData.patient.full_name,
            room_code: patientData.room.code,
            staff_name: patientData.staff.full_name,
          });
        } catch (error) {
          console.error('Error loading patient data:', error);
        }
      }

      // Load active orders
      if (deviceId) {
        const ordersResponse = await ordersApi.getActiveOrdersPublic(deviceId);
        setActiveOrders(ordersResponse.orders || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleOrderDetails = (orderId: number) => {
    setExpandedOrders((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

  const handleNewOrder = () => {
    navigate(`/kiosk/${deviceId}`);
  };

  const handleSatisfactionSubmit = async (rating: number, comment?: string) => {
    if (!satisfactionModal.orderId || !deviceId) return;

    try {
      console.log(`Submitting satisfaction rating for order #${satisfactionModal.orderId}: ${rating}`);

      await ordersApi.submitFeedback(satisfactionModal.orderId, {
        device_uid: deviceId,
        satisfaction_rating: rating,
        comment: comment || undefined,
      });

      // Close satisfaction modal
      setSatisfactionModal({ show: false, orderId: null });

      // Show thank you modal
      setShowThankYouModal(true);

      // Reload orders
      if (deviceId) {
        try {
          const ordersResponse = await ordersApi.getActiveOrdersPublic(deviceId);
          setActiveOrders(ordersResponse.orders || []);
        } catch (error) {
          console.error('Failed to reload orders:', error);
        }
      }
    } catch (error: any) {
      console.error('Failed to submit satisfaction rating:', error);
      const errorMessage = error.response?.data?.error || 'Error al enviar feedback. Por favor intenta de nuevo.';
      alert(errorMessage);
    }
  };

  if (loading) {
    return (
      <div style={styles.loading}>
        <div style={styles.spinner}></div>
        <p>Cargando órdenes...</p>
      </div>
    );
  }

  // Check if there are any truly active orders (not delivered or cancelled)
  const hasActiveOrders = activeOrders.some(
    (order) => ['PLACED', 'PREPARING', 'READY'].includes(order.status)
  );

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
              <div style={styles.deviceLabel}>
                Dispositivo: {deviceId}
                <span
                  style={{
                    marginLeft: '10px',
                    color: isConnected ? '#4caf50' : '#f44336',
                    fontSize: '12px',
                  }}
                >
                  {isConnected ? '● En Línea' : '○ Desconectado'}
                </span>
              </div>
            </div>
          )}
          {!hasActiveOrders && (
            <button style={styles.viewMenuButton} onClick={handleNewOrder}>
              Ver Menú
            </button>
          )}
        </div>
      </header>

      {/* Orders Section */}
      <div style={styles.ordersSection}>
        <div style={styles.ordersHeader}>
          <h2 style={styles.ordersTitle}>Mis pedidos activos</h2>
          {!hasActiveOrders && (
            <button style={styles.newOrderButton} onClick={handleNewOrder}>
              + Hacer nuevo pedido
            </button>
          )}
        </div>

        {activeOrders.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>📋</div>
            <h3>No tienes pedidos activos</h3>
            <p>Realiza tu primer pedido para comenzar</p>
            <button style={styles.startOrderButton} onClick={handleNewOrder}>
              Hacer un pedido
            </button>
          </div>
        ) : (
          <div style={styles.ordersList}>
            {activeOrders.map((order) => {
              const isExpanded = expandedOrders.has(order.id);
              return (
                <div key={order.id} style={styles.orderCard}>
                  {/* Order Header */}
                  <div style={styles.orderCardHeader}>
                    <div>
                      <h3 style={styles.orderNumber}>Orden #{order.id}</h3>
                      <p style={styles.orderTime}>
                        Realizada: {new Date(order.placed_at).toLocaleString('es-MX', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    <button
                      style={styles.detailsButton}
                      onClick={() => toggleOrderDetails(order.id)}
                    >
                      {isExpanded ? 'Ocultar Detalles ▲' : 'Ver Detalles ▼'}
                    </button>
                  </div>

                  {/* Order Status Progress */}
                  <OrderStatusProgress currentStatus={order.status} />

                  {/* Order Details (Collapsible) */}
                  {isExpanded && (
                    <div style={styles.orderDetails}>
                      <h4 style={styles.detailsTitle}>Order Items</h4>
                      <div style={styles.orderItems}>
                        {order.items.map((item) => (
                          <div key={item.id} style={styles.orderItem}>
                            <div style={styles.orderItemInfo}>
                              <span style={styles.orderItemName}>{item.product_name}</span>
                              <span style={styles.orderItemUnit}>{item.unit_label}</span>
                            </div>
                            <span style={styles.orderItemQuantity}>x{item.quantity}</span>
                          </div>
                        ))}
                      </div>
                      {order.delivered_at && (
                        <div style={styles.deliveredInfo}>
                          <span style={styles.deliveredLabel}>Delivered:</span>
                          <span style={styles.deliveredTime}>
                            {new Date(order.delivered_at).toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Satisfaction Modal */}
      <SatisfactionModal
        show={satisfactionModal.show}
        orderId={satisfactionModal.orderId || 0}
        onClose={() => setSatisfactionModal({ show: false, orderId: null })}
        onSubmit={handleSatisfactionSubmit}
      />

      {/* Thank You Modal */}
      <ThankYouModal
        show={showThankYouModal}
        onClose={() => setShowThankYouModal(false)}
      />
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    minHeight: '100vh',
    backgroundColor: colors.grayBg,
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
  viewMenuButton: {
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
  ordersSection: {
    padding: '40px',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  ordersHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '32px',
  },
  ordersTitle: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: colors.black,
    margin: 0,
  },
  newOrderButton: {
    padding: '14px 28px',
    backgroundColor: '#ff9800',
    color: colors.white,
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  emptyState: {
    textAlign: 'center',
    padding: '80px 20px',
    backgroundColor: colors.white,
    borderRadius: '12px',
    boxShadow: `0 2px 8px ${colors.shadow}`,
  },
  emptyIcon: {
    fontSize: '64px',
    marginBottom: '20px',
  },
  startOrderButton: {
    marginTop: '24px',
    padding: '14px 32px',
    backgroundColor: '#ff9800',
    color: colors.white,
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  ordersList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  orderCard: {
    backgroundColor: colors.white,
    borderRadius: '12px',
    boxShadow: `0 2px 8px ${colors.shadow}`,
    overflow: 'hidden',
  },
  orderCardHeader: {
    padding: '24px 32px',
    backgroundColor: '#f8f9fa',
    borderBottom: `1px solid ${colors.grayLight}`,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderNumber: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: colors.black,
    margin: '0 0 4px 0',
  },
  orderTime: {
    fontSize: '14px',
    color: colors.gray,
    margin: 0,
  },
  detailsButton: {
    padding: '10px 20px',
    backgroundColor: '#ff9800',
    color: colors.white,
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  orderDetails: {
    padding: '24px 32px',
    borderTop: `1px solid ${colors.grayLight}`,
    backgroundColor: '#fafafa',
  },
  detailsTitle: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: colors.black,
    margin: '0 0 16px 0',
  },
  orderItems: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  orderItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    backgroundColor: colors.white,
    borderRadius: '8px',
  },
  orderItemInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  orderItemName: {
    fontSize: '15px',
    fontWeight: '500',
    color: colors.black,
  },
  orderItemUnit: {
    fontSize: '13px',
    color: colors.gray,
  },
  orderItemQuantity: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#ff9800',
  },
  deliveredInfo: {
    marginTop: '16px',
    padding: '12px 16px',
    backgroundColor: '#e8f5e9',
    borderRadius: '8px',
    display: 'flex',
    gap: '8px',
  },
  deliveredLabel: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#2e7d32',
  },
  deliveredTime: {
    fontSize: '14px',
    color: '#2e7d32',
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
