import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ordersApi } from '../../api/orders';
import { kioskApi } from '../../api/kiosk';
import { OrderStatusProgress } from '../../components/kiosk/OrderStatusProgress';
import { SatisfactionModal } from '../../components/kiosk/SatisfactionModal';
import { ThankYouModal } from '../../components/kiosk/ThankYouModal';
import WaitingForSurveyModal from '../../components/kiosk/WaitingForSurveyModal';
import ProductRatingsModal from '../../components/kiosk/ProductRatingsModal';
import StaffRatingModal from '../../components/kiosk/StaffRatingModal';
import StayRatingModal from '../../components/kiosk/StayRatingModal';
import { useWebSocket } from '../../hooks/useWebSocket';
import { useSurvey } from '../../contexts/SurveyContext';
import { useWindowSize } from '../../utils/responsive';
import { colors } from '../../styles/colors';
import logoHorizontal from '../../assets/logos/logo-horizontal.png';

const WS_BASE_URL = import.meta.env.VITE_WS_BASE_URL || 'ws://localhost:8000';

interface PatientInfo {
  full_name: string;
  room_code: string;
  staff_name: string;
  survey_enabled?: boolean;
  can_patient_order?: boolean;
  patient_assignment_id?: number;
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
  const { isMobile } = useWindowSize();

  const [loading, setLoading] = useState(true);
  const [patientInfo, setPatientInfo] = useState<PatientInfo | null>(null);
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [expandedOrders, setExpandedOrders] = useState<Set<number>>(new Set());
  const [satisfactionModal, setSatisfactionModal] = useState<{
    show: boolean;
    orderId: number | null;
  }>({ show: false, orderId: null });
  const [showThankYouModal, setShowThankYouModal] = useState(false);
  const [showWaitingForSurveyModal, setShowWaitingForSurveyModal] = useState(false);

  // Survey context
  const { surveyState, startSurvey, setProductRatings, setStaffRating, completeSurvey, closeSurvey } = useSurvey();

  // WebSocket message handler
  const handleWebSocketMessage = useCallback(async (message: any) => {
    console.log('WebSocket message received:', message);

    if (message.type === 'order_status_changed') {
      console.log('Order status changed:', message);

      // If order was marked as delivered, show waiting for survey modal
      if (message.status === 'DELIVERED') {
        // Check if there are any delivered orders
        const hasDeliveredOrders = activeOrders.some(order => order.status === 'DELIVERED');
        if (hasDeliveredOrders || message.status === 'DELIVERED') {
          setShowWaitingForSurveyModal(true);
          // Update can_patient_order to false
          setPatientInfo(prev => prev ? { ...prev, can_patient_order: false } : null);
        }
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
    } else if (message.type === 'survey_enabled') {
      console.log('Survey enabled via WebSocket - starting survey immediately');
      // When survey is enabled, start survey immediately using global context
      setShowWaitingForSurveyModal(false);
      
      const assignmentId = message.assignment_id;
      const staffName = patientInfo?.staff_name || 'Personal';
      
      setPatientInfo(prev => prev ? {
        ...prev,
        survey_enabled: true,
        can_patient_order: false,
        patient_assignment_id: assignmentId || prev.patient_assignment_id
      } : null);
      
      // Start survey immediately using global context (works from any page)
      if (assignmentId || patientInfo?.patient_assignment_id) {
        startSurvey(assignmentId || patientInfo?.patient_assignment_id!, staffName);
      }
    } else if (message.type === 'session_ended') {
      console.log('Patient session ended - closing modals and redirecting to home page');
      // When session ends (either by staff or after feedback), close all modals and redirect
      setShowWaitingForSurveyModal(false);
      setShowThankYouModal(false);
      closeSurvey(); // Close any open survey modals
      // Redirect to the home page (shows welcome screen)
      if (deviceId) {
        navigate(`/kiosk/${deviceId}`, { replace: true });
      }
    } else if (message.type === 'limits_updated') {
      console.log('Order limits updated:', message);
      // When limits are updated, reactivate patient orders
      setPatientInfo(prev => prev ? { ...prev, can_patient_order: message.can_patient_order ?? true } : null);
      setShowWaitingForSurveyModal(false);
    }
  }, [deviceId, navigate, patientInfo, startSurvey, closeSurvey]);

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
  }, [deviceId, startSurvey]);

  // Block back navigation when waiting for survey
  useEffect(() => {
    if (showWaitingForSurveyModal) {
      // Push current state to prevent back navigation
      window.history.pushState(null, '', window.location.href);
      
      const handlePopState = (event: PopStateEvent) => {
        // Prevent back navigation - stay on current page and keep modal open
        window.history.pushState(null, '', window.location.href);
        setShowWaitingForSurveyModal(true);
      };

      window.addEventListener('popstate', handlePopState);

      return () => {
        window.removeEventListener('popstate', handlePopState);
      };
    }
  }, [showWaitingForSurveyModal]);

  // Intercept back navigation when there are active orders
  useEffect(() => {
    const hasActiveOrders = activeOrders.some(
      (order) => ['PLACED', 'PREPARING', 'READY'].includes(order.status)
    );

    if (hasActiveOrders && !showWaitingForSurveyModal) {
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
            survey_enabled: patientData.survey_enabled || false,
            can_patient_order: patientData.can_patient_order !== false, // Default to true
            patient_assignment_id: patientData.id,
          });
          
          // Check if there are delivered orders and survey is not enabled
          const ordersResponse = await ordersApi.getActiveOrdersPublic(deviceId);
          const deliveredOrders = (ordersResponse.orders || []).filter((order: Order) => order.status === 'DELIVERED');
          if (deliveredOrders.length > 0 && !patientData.survey_enabled) {
            setShowWaitingForSurveyModal(true);
          }
          
          // Check if survey is enabled - start survey immediately using global context
          if (patientData.survey_enabled && patientData.id) {
            // Check if there are delivered orders to rate
            const deliveredOrders = (ordersResponse.orders || []).filter((order: Order) => order.status === 'DELIVERED');
            if (deliveredOrders.length > 0) {
              setShowWaitingForSurveyModal(false);
              // Start survey using global context
              startSurvey(patientData.id, patientData.staff.full_name);
            }
          }
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
              <div style={styles.deviceLabel}>
                Dispositivo: {deviceId}
                <span
                  style={{
                    marginLeft: '10px',
                    color: isConnected ? colors.success : colors.error,
                    fontSize: '12px',
                  }}
                >
                  {isConnected ? '● En Línea' : '○ Desconectado'}
                </span>
              </div>
            </div>
          )}
          {!hasActiveOrders && (
            <button 
              style={{ ...styles.viewMenuButton, ...(isMobile && responsiveStyles.button) }} 
              onClick={handleNewOrder}
              className="kiosk-btn-outline"
            >
              Ver Menú
            </button>
          )}
        </div>
      </header>

      {/* Orders Section */}
      <div style={{ ...styles.ordersSection, ...(isMobile && responsiveStyles.ordersSection) }}>
        <div style={{ ...styles.ordersHeader, ...(isMobile && responsiveStyles.ordersHeader) }}>
          <h2 style={{ ...styles.ordersTitle, ...(isMobile && responsiveStyles.ordersTitle) }}>Mis pedidos activos</h2>
          {!hasActiveOrders && (
            <button style={{ ...styles.newOrderButton, ...(isMobile && responsiveStyles.button) }} onClick={handleNewOrder}>
              {isMobile ? '+ Nuevo pedido' : '+ Hacer nuevo pedido'}
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
                <div key={order.id} style={{ ...styles.orderCard, ...(isMobile && responsiveStyles.orderCard) }}>
                  {/* Order Header */}
                  <div style={{ ...styles.orderCardHeader, ...(isMobile && responsiveStyles.orderCardHeader) }}>
                    <div>
                      <h3 style={{ ...styles.orderNumber, ...(isMobile && responsiveStyles.orderNumber) }}>Orden #{order.id}</h3>
                      <p style={{ ...styles.orderTime, ...(isMobile && responsiveStyles.orderTime) }}>
                        Realizada: {new Date(order.placed_at).toLocaleString('es-MX', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    <button
                      style={{ ...styles.detailsButton, ...(isMobile && responsiveStyles.detailsButton) }}
                      onClick={() => toggleOrderDetails(order.id)}
                    >
                      {isExpanded ? (isMobile ? 'Ocultar ▲' : 'Ocultar Detalles ▲') : (isMobile ? 'Ver ▼' : 'Ver Detalles ▼')}
                    </button>
                  </div>

                  {/* Order Status Progress */}
                  <OrderStatusProgress currentStatus={order.status} />

                  {/* Order Details (Collapsible) */}
                  {isExpanded && (
                    <div style={styles.orderDetails}>
                      <h4 style={styles.detailsTitle}>Productos del Pedido</h4>
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

      {/* Waiting for Survey Modal */}
      {showWaitingForSurveyModal && (
        <WaitingForSurveyModal
          onReturnToMenu={() => {
            setShowWaitingForSurveyModal(false);
            navigate(`/kiosk/${deviceId}`, { replace: true });
          }}
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
              loadData(); // Reload data to reflect session end
            } catch (error: any) {
              console.error('Error completing survey:', error);
              const errorMessage = error.response?.data?.error || 'Error al enviar la encuesta. Por favor intenta de nuevo.';
              alert(errorMessage);
            }
          }}
        />
      )}

      {/* Satisfaction Modal (deprecated - kept for backward compatibility) */}
      <SatisfactionModal
        show={satisfactionModal.show}
        orderId={satisfactionModal.orderId || 0}
        onClose={() => setSatisfactionModal({ show: false, orderId: null })}
        onSubmit={handleSatisfactionSubmit}
      />

      {/* Thank You Modal */}
      <ThankYouModal
        show={showThankYouModal}
        onClose={() => {
          setShowThankYouModal(false);
          closeSurvey();
          loadData(); // Reload data to reflect session end
        }}
      />
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    minHeight: '100vh',
    backgroundColor: colors.ivory,
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
  viewMenuButton: {
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
    color: colors.textPrimary,
    margin: 0,
  },
  newOrderButton: {
    padding: '14px 28px',
    backgroundColor: colors.primary,
    color: colors.white,
    border: `2px solid ${colors.primary}`,
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  emptyState: {
    textAlign: 'center',
    padding: '80px 20px',
    backgroundColor: colors.white,
    borderRadius: '12px',
    boxShadow: `0 2px 12px ${colors.shadowGold}`,
    border: `1px solid ${colors.primaryMuted}`,
  },
  emptyIcon: {
    fontSize: '64px',
    marginBottom: '20px',
  },
  startOrderButton: {
    marginTop: '24px',
    padding: '14px 32px',
    backgroundColor: colors.primary,
    color: colors.white,
    border: `2px solid ${colors.primary}`,
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  ordersList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  orderCard: {
    backgroundColor: colors.white,
    borderRadius: '12px',
    boxShadow: `0 2px 12px ${colors.shadowGold}`,
    border: `1px solid ${colors.primaryMuted}`,
    overflow: 'hidden',
  },
  orderCardHeader: {
    padding: '24px 32px',
    backgroundColor: colors.cream,
    borderBottom: `1px solid ${colors.primaryMuted}`,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderNumber: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: colors.textPrimary,
    margin: '0 0 4px 0',
  },
  orderTime: {
    fontSize: '14px',
    color: colors.textSecondary,
    margin: 0,
  },
  detailsButton: {
    padding: '10px 20px',
    backgroundColor: colors.primary,
    color: colors.white,
    border: `2px solid ${colors.primary}`,
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  orderDetails: {
    padding: '24px 32px',
    borderTop: `1px solid ${colors.primaryMuted}`,
    backgroundColor: colors.ivory,
  },
  detailsTitle: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: colors.textPrimary,
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
    border: `1px solid ${colors.primaryMuted}`,
  },
  orderItemInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  orderItemName: {
    fontSize: '15px',
    fontWeight: '500',
    color: colors.textPrimary,
  },
  orderItemUnit: {
    fontSize: '13px',
    color: colors.textSecondary,
  },
  orderItemQuantity: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: colors.primary,
  },
  deliveredInfo: {
    marginTop: '16px',
    padding: '12px 16px',
    backgroundColor: colors.success + '15', // 15 = ~8% opacity
    borderRadius: '8px',
    border: `1px solid ${colors.success}40`, // 40 = ~25% opacity
    display: 'flex',
    gap: '8px',
  },
  deliveredLabel: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: colors.success,
  },
  deliveredTime: {
    fontSize: '14px',
    color: colors.success,
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
  logo: {
    height: '40px',
  },
  button: {
    width: '100%',
    padding: '12px 16px',
    fontSize: '14px',
  },
  ordersSection: {
    padding: '16px',
  },
  ordersHeader: {
    flexDirection: 'column',
    gap: '12px',
    alignItems: 'stretch',
    marginBottom: '20px',
  },
  ordersTitle: {
    fontSize: '24px',
  },
  orderCard: {
    marginBottom: '16px',
  },
  orderCardHeader: {
    flexDirection: 'column',
    gap: '12px',
    padding: '16px 20px',
  },
  orderNumber: {
    fontSize: '18px',
  },
  orderTime: {
    fontSize: '13px',
  },
  detailsButton: {
    width: '100%',
    padding: '10px 16px',
    fontSize: '13px',
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
`;
if (!document.head.querySelector('[data-kiosk-orders-styles]')) {
  styleSheet.setAttribute('data-kiosk-orders-styles', 'true');
  document.head.appendChild(styleSheet);
}
