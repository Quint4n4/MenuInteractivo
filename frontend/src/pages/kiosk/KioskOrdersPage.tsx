import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PackageSearch, ClipboardList, ChevronDown, ChevronUp } from 'lucide-react';
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
import { MobileHeaderMenu, type MobileHeaderMenuAction } from '../../components/kiosk/MobileHeaderMenu';
import { colors } from '../../styles/colors';
import { TIENDA_CAMSA_URL, RESTAURANTES_CAMSA_URL, KIOSK_LANDING_VIDEO_IDS, KIOSK_PRODUCT_IMAGES, getYoutubeEmbedUrl, getProductImageUrl } from '../../constants/urls';
import logoHorizontal from '../../assets/logos/logo-horizontal.png';
import iconTe from '../../assets/icons/te.png';
import iconStore from '../../assets/icons/store.png';
import iconComida from '../../assets/icons/comida.png';

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
  product?: number;
  product_name: string;
  product_image_url?: string | null;
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
      // Only if patient cannot order (waiting for survey)
      if (message.status === 'DELIVERED') {
        // Reload orders to get updated status
        if (deviceId) {
          try {
            const ordersResponse = await ordersApi.getActiveOrdersPublic(deviceId);
            const updatedOrders = ordersResponse.orders || [];
            setActiveOrders(updatedOrders);
            
            // Check if there are delivered orders and patient cannot order
            const hasDeliveredOrders = updatedOrders.some((order: Order) => order.status === 'DELIVERED');
            if (hasDeliveredOrders && patientInfo && !patientInfo.can_patient_order && !patientInfo.survey_enabled) {
              setShowWaitingForSurveyModal(true);
            }
          } catch (error) {
            console.error('Failed to reload orders:', error);
          }
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
      // Patient can view orders created by staff even while waiting for survey
      if (deviceId) {
        try {
          const ordersResponse = await ordersApi.getActiveOrdersPublic(deviceId);
          setActiveOrders(ordersResponse.orders || []);
          
          // If patient is waiting for survey and can't order, keep the waiting modal visible
          // Don't close it just because a new order was created by staff
          if (patientInfo && !patientInfo.can_patient_order && !patientInfo.survey_enabled) {
            // Check if there are delivered orders to show waiting modal
            const deliveredOrders = (ordersResponse.orders || []).filter((order: Order) => order.status === 'DELIVERED');
            if (deliveredOrders.length > 0) {
              setShowWaitingForSurveyModal(true);
            }
          }
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
      
      // Update patient info
      setPatientInfo(prev => prev ? {
        ...prev,
        survey_enabled: true,
        can_patient_order: false,
        patient_assignment_id: assignmentId || prev.patient_assignment_id
      } : null);
      
      // Start survey immediately using global context (works from any page)
      // Use assignment_id from message, or from patient info, or reload patient data
      if (assignmentId) {
        startSurvey(assignmentId, staffName);
      } else if (patientInfo?.patient_assignment_id) {
        startSurvey(patientInfo.patient_assignment_id, staffName);
      } else {
        // Reload patient data to get assignment_id
        if (deviceId) {
          kioskApi.getActivePatient(deviceId).then(patientData => {
            if (patientData.id) {
              startSurvey(patientData.id, patientData.staff?.full_name || staffName);
            }
          });
        }
      }
    } else if (message.type === 'session_ended') {
      console.log('Patient session ended - closing modals and redirecting to home page');
      // When session ends (either by staff or after feedback), close all modals and redirect
      setShowWaitingForSurveyModal(false);
      setShowThankYouModal(false);
      closeSurvey(); // Close any open survey modals
      // Redirect to the home page (shows initial welcome screen)
      if (deviceId) {
        navigate(`/kiosk/${deviceId}`, { replace: true });
      }
    } else if (message.type === 'limits_updated') {
      console.log('Order limits updated:', message);
      // When limits are updated, reactivate patient orders if can_patient_order is true
      const canOrder = message.can_patient_order ?? true;
      setPatientInfo(prev => prev ? { ...prev, can_patient_order: canOrder } : null);
      
      // Only close waiting modal if patient can now order again
      if (canOrder) {
        setShowWaitingForSurveyModal(false);
      }
    }
  }, [deviceId, navigate, patientInfo, startSurvey, closeSurvey]);

  // WebSocket connection for real-time order updates
  const wsUrl = deviceId ? `${WS_BASE_URL}/ws/kiosk/orders/?device_uid=${deviceId}` : '';

  const { isConnected } = useWebSocket({
    url: wsUrl,
    onMessage: handleWebSocketMessage,
    onOpen: () => {
      console.log('✅ Kiosk Orders WebSocket connected');
      // Reconciliacion tras (re)conexion: si se perdio un session_ended
      // durante el desconectado del WS, re-consultar active-patient.
      // Si 404 (la sesion ya cerro), cerrar modales y volver a home.
      if (deviceId) {
        kioskApi.getActivePatient(deviceId).catch(() => {
          console.log('No active patient on WS reconnect — closing session and returning to home');
          setShowWaitingForSurveyModal(false);
          setShowThankYouModal(false);
          closeSurvey();
          navigate(`/kiosk/${deviceId}`, { replace: true });
        });
      }
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
          
          // Show waiting modal if:
          // 1. There are delivered orders
          // 2. Survey is not enabled yet
          // 3. Patient cannot order (waiting for survey)
          if (deliveredOrders.length > 0 && !patientData.survey_enabled && !patientData.can_patient_order) {
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

  const handleOpenTienda = () => {
    window.open(TIENDA_CAMSA_URL, '_blank', 'noopener,noreferrer');
  };

  const handleOpenRestaurantes = () => {
    window.open(RESTAURANTES_CAMSA_URL, '_blank', 'noopener,noreferrer');
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
  const mobileMenuActions: MobileHeaderMenuAction[] = [
    ...(!hasActiveOrders
      ? [
          {
            id: 'new-order',
            label: 'Ver menu',
            icon: (
              <img
                src={iconTe}
                alt="Ver menú"
                style={{ width: 18, height: 18, objectFit: 'contain' }}
                draggable={false}
              />
            ),
            onClick: handleNewOrder,
          },
        ]
      : []),
  ];

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
          {isMobile ? (
            <div style={styles.mobileMenuWrap}>
              <MobileHeaderMenu actions={mobileMenuActions} buttonLabel="Menu de ordenes" />
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
              {!hasActiveOrders && (
                <button
                  style={styles.viewMenuButton}
                  onClick={handleNewOrder}
                  className="kiosk-btn-outline"
                >
                  Ver Menú
                </button>
              )}
            </div>
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

        {hasActiveOrders && (
          <div
            style={{
              ...styles.tiendaBanner,
              ...(isMobile && responsiveStyles.tiendaBanner),
            }}
          >
            <div style={styles.tiendaBannerButtons}>
              <button
                type="button"
                onClick={handleOpenTienda}
                style={{
                  ...styles.tiendaBannerButton,
                  ...(isMobile && responsiveStyles.tiendaBannerButton),
                }}
                className="kiosk-btn-outline"
              >
                <img
                  src={iconStore}
                  alt="Conoce productos"
                  style={{ width: 20, height: 20, objectFit: 'contain' }}
                  draggable={false}
                />
                <span>Conoce productos</span>
              </button>
              <button
                type="button"
                onClick={handleOpenRestaurantes}
                style={{
                  ...styles.tiendaBannerButton,
                  ...(isMobile && responsiveStyles.tiendaBannerButton),
                }}
                className="kiosk-btn-outline"
              >
                <img
                  src={iconComida}
                  alt="Pedir comida"
                  style={{ width: 20, height: 20, objectFit: 'contain' }}
                  draggable={false}
                />
                <span>Pedir comida</span>
              </button>
            </div>
          </div>
        )}

        {activeOrders.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>
              <ClipboardList size={54} />
            </div>
            <h3>No tienes pedidos activos</h3>
            <p>Realiza tu primer pedido para comenzar</p>
            <button style={styles.startOrderButton} onClick={handleNewOrder}>
              Hacer un pedido
            </button>
          </div>
        ) : (
          <>
            <div style={styles.ordersList}>
              {(() => {
                const currentOrder = activeOrders[0];
                const isExpanded = expandedOrders.has(currentOrder.id);
                return (
                  <div key={currentOrder.id} style={{ ...styles.orderCard, ...(isMobile && responsiveStyles.orderCard) }}>
                    <div style={{ ...styles.orderCardHeader, ...(isMobile && responsiveStyles.orderCardHeader) }}>
                      <div>
                        <h3 style={{ ...styles.orderNumber, ...(isMobile && responsiveStyles.orderNumber) }}>Orden #{currentOrder.id}</h3>
                        <p style={{ ...styles.orderTime, ...(isMobile && responsiveStyles.orderTime) }}>
                          Realizada: {new Date(currentOrder.placed_at).toLocaleString('es-MX', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                      <button
                        style={{ ...styles.detailsButton, ...(isMobile && responsiveStyles.detailsButton) }}
                        onClick={() => toggleOrderDetails(currentOrder.id)}
                      >
                        {isExpanded ? (
                          <>
                            {isMobile ? 'Ocultar' : 'Ocultar Detalles'} <ChevronUp size={14} />
                          </>
                        ) : (
                          <>
                            {isMobile ? 'Ver' : 'Ver Detalles'} <ChevronDown size={14} />
                          </>
                        )}
                      </button>
                    </div>

                    <OrderStatusProgress currentStatus={currentOrder.status} />

                    {isExpanded && (
                      <div style={styles.orderDetails}>
                        <h4 style={styles.detailsTitle}>Productos del Pedido</h4>
                        <div style={styles.orderItems}>
                          {currentOrder.items.map((item) => (
                            <div key={item.id} style={styles.orderItem}>
                              <div style={styles.orderItemImageWrap}>
                                <div style={styles.orderItemCircle}>
                                  {item.product_image_url ? (
                                    <img
                                      src={item.product_image_url}
                                      alt={item.product_name}
                                      style={styles.orderItemCircleImg}
                                      draggable={false}
                                    />
                                  ) : (
                                    <div style={styles.orderItemCirclePlaceholder}>
                                      <PackageSearch size={24} color="currentColor" />
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div style={styles.orderItemInfo}>
                                <span style={styles.orderItemName}>{item.product_name}</span>
                                <span style={styles.orderItemUnit}>{item.unit_label}</span>
                              </div>
                              <span style={styles.orderItemQuantity}>x{item.quantity}</span>
                            </div>
                          ))}
                        </div>
                        {currentOrder.delivered_at && (
                          <div style={styles.deliveredInfo}>
                            <span style={styles.deliveredLabel}>Entregado:</span>
                            <span style={styles.deliveredTime}>
                              {new Date(currentOrder.delivered_at).toLocaleString('es-MX', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                        )}
                        {currentOrder.status === 'DELIVERED' && (
                          <div style={styles.exploreMoreBlock}>
                            <h4 style={styles.exploreMoreTitle}>Explora más productos</h4>
                            <div style={styles.exploreMoreActions}>
                              <a
                                href={TIENDA_CAMSA_URL}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={styles.exploreMoreLink}
                              >
                                <img src={iconStore} alt="" style={styles.exploreMoreIcon} draggable={false} />
                                Visitar tienda online
                              </a>
                            </div>
                            {KIOSK_LANDING_VIDEO_IDS.length > 0 && (
                              <div style={styles.exploreMoreVideoWrap}>
                                <div style={styles.videoCircleLarge}>
                                  <iframe
                                    title="Productos CAMSA"
                                    src={getYoutubeEmbedUrl(KIOSK_LANDING_VIDEO_IDS[0])}
                                    style={styles.videoIframe}
                                    allow="autoplay; encrypted-media; picture-in-picture"
                                    referrerPolicy="strict-origin-when-cross-origin"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Sección de video debajo de la orden: video cuadrado grande + productos abajo con separación */}
            {KIOSK_LANDING_VIDEO_IDS.length > 0 && (
              <div style={styles.landingVideoSection}>
                <h3 style={styles.landingVideoTitle}>Descubre más productos</h3>
                <div style={styles.videoSquareWrap}>
                  <div style={styles.videoSquareLarge}>
                    <iframe
                      title="Productos CAMSA"
                      src={getYoutubeEmbedUrl(KIOSK_LANDING_VIDEO_IDS[0])}
                      style={styles.videoIframeSquare}
                      allow="autoplay; encrypted-media; picture-in-picture"
                      referrerPolicy="strict-origin-when-cross-origin"
                    />
                  </div>
                </div>
                <div style={styles.productsRowWrap}>
                  {KIOSK_PRODUCT_IMAGES.map((product) => (
                    <a
                      key={product.label}
                      href={TIENDA_CAMSA_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={styles.productThumbCircleBelow}
                      title={product.label}
                    >
                      <img
                        src={getProductImageUrl(product.filename)}
                        alt={product.label}
                        style={styles.productThumbImg}
                        draggable={false}
                      />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </>
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
              // Show thank you modal briefly, then redirect to home
              setShowThankYouModal(true);
              // After 2 seconds, redirect to home (session will be ended by backend)
              setTimeout(() => {
                setShowThankYouModal(false);
                closeSurvey();
                // Redirect to home page which will show initial welcome screen
                navigate(`/kiosk/${deviceId}`, { replace: true });
              }, 2000);
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
    backgroundColor: '#FAFAF5',
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
    boxShadow: `0 2px 10px ${colors.shadow}`,
    borderBottom: `1px solid ${colors.parchment}`,
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
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
  },
  mobileMenuWrap: {
    display: 'flex',
    justifyContent: 'flex-end',
    width: '100%',
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
    fontFamily: 'var(--font-serif)',
  },
  newOrderButton: {
    padding: '14px 28px',
    backgroundColor: colors.ivory,
    color: colors.primaryDark,
    border: `1px solid ${colors.primary}`,
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
    boxShadow: `0 4px 18px ${colors.shadow}`,
    border: `1px solid ${colors.parchment}`,
  },
  emptyIcon: {
    color: colors.primary,
    marginBottom: '20px',
    display: 'flex',
    justifyContent: 'center',
  },
  startOrderButton: {
    marginTop: '24px',
    padding: '14px 32px',
    backgroundColor: colors.ivory,
    color: colors.primaryDark,
    border: `1px solid ${colors.primary}`,
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  tiendaBanner: {
    marginBottom: '24px',
    display: 'flex',
    justifyContent: 'center',
  },
  tiendaBannerButtons: {
    display: 'flex',
    gap: '16px',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  tiendaBannerButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px 32px',
    backgroundColor: colors.white,
    color: colors.primary,
    border: `1px solid ${colors.primary}`,
    borderRadius: '12px',
    fontSize: '18px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: `0 3px 10px ${colors.shadow}`,
  },
  ordersList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  orderCard: {
    backgroundColor: colors.white,
    borderRadius: '12px',
    boxShadow: `0 4px 14px ${colors.shadow}`,
    border: `1px solid ${colors.parchment}`,
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
    padding: '10px 16px',
    backgroundColor: colors.ivory,
    color: colors.primaryDark,
    border: `1px solid ${colors.primary}`,
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
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
    alignItems: 'center',
    gap: '16px',
    padding: '12px 16px',
    backgroundColor: colors.white,
    borderRadius: '8px',
    border: `1px solid ${colors.primaryMuted}`,
  },
  orderItemImageWrap: {
    flexShrink: 0,
  },
  orderItemCircle: {
    width: 48,
    height: 48,
    borderRadius: '50%',
    overflow: 'hidden',
    border: '2px solid rgba(212, 175, 55, 0.35)',
    backgroundColor: colors.cream,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderItemCircleImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  orderItemCirclePlaceholder: {
    color: colors.primaryMuted,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderItemInfo: {
    flex: 1,
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
  /* Explora más (pedidos entregados) */
  exploreMoreBlock: {
    marginTop: '20px',
    padding: '20px',
    backgroundColor: colors.white,
    borderRadius: '12px',
    border: `1px solid ${colors.primaryMuted}`,
  },
  exploreMoreTitle: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: colors.textPrimary,
    margin: '0 0 12px 0',
  },
  exploreMoreActions: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '12px',
  },
  exploreMoreLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '10px',
    padding: '12px 24px',
    backgroundColor: colors.ivory,
    color: colors.primaryDark,
    border: `1px solid ${colors.primary}`,
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: 600,
    textDecoration: 'none',
    transition: 'all 0.2s ease',
  },
  exploreMoreIcon: {
    width: 20,
    height: 20,
    objectFit: 'contain',
  },
  exploreMoreVideoWrap: {
    marginTop: '16px',
    display: 'flex',
    justifyContent: 'center',
  },
  /* Video círculo (landing style) */
  videoCircle: {
    width: 200,
    height: 200,
    borderRadius: '50%',
    overflow: 'hidden',
    border: '3px solid rgba(212, 175, 55, 0.35)',
    boxShadow: '0 10px 50px rgba(212, 175, 55, 0.14), 0 2px 12px rgba(0,0,0,0.04)',
    position: 'relative',
  },
  videoCircleLarge: {
    width: 400,
    height: 400,
    borderRadius: '50%',
    overflow: 'hidden',
    border: '3px solid rgba(212, 175, 55, 0.35)',
    boxShadow: '0 10px 50px rgba(212, 175, 55, 0.14), 0 2px 12px rgba(0,0,0,0.04)',
    position: 'relative',
  },
  videoCircleLargeCentered: {
    width: 400,
    height: 400,
    borderRadius: '50%',
    overflow: 'hidden',
    border: '3px solid rgba(212, 175, 55, 0.35)',
    boxShadow: '0 10px 50px rgba(212, 175, 55, 0.14), 0 2px 12px rgba(0,0,0,0.04)',
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
  },
  videoSquareWrap: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: 0,
  },
  videoSquareLarge: {
    width: 720,
    height: 520,
    maxWidth: '100%',
    borderRadius: '12px',
    overflow: 'hidden',
    border: '3px solid rgba(212, 175, 55, 0.35)',
    boxShadow: '0 10px 50px rgba(212, 175, 55, 0.14), 0 2px 12px rgba(0,0,0,0.04)',
    position: 'relative',
    backgroundColor: '#000',
  },
  videoIframeSquare: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: '177.78%',
    height: '100%',
    transform: 'translate(-50%, -50%)',
    border: 'none',
    pointerEvents: 'none',
  },
  productsRowWrap: {
    marginTop: '48px',
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: '24px',
  },
  productThumbCircleBelow: {
    width: 100,
    height: 100,
    borderRadius: '50%',
    overflow: 'hidden',
    border: '2px solid rgba(212, 175, 55, 0.4)',
    boxShadow: '0 4px 20px rgba(212, 175, 55, 0.15), 0 1px 6px rgba(0,0,0,0.05)',
    cursor: 'pointer',
    display: 'block',
    textDecoration: 'none',
    backgroundColor: colors.white,
    flexShrink: 0,
  },
  landingVideoOrbitWrap: {
    position: 'relative',
    width: 620,
    height: 620,
    margin: '0 auto',
  },
  productThumbCircle: {
    position: 'absolute',
    borderRadius: '50%',
    overflow: 'hidden',
    border: '2px solid rgba(212, 175, 55, 0.4)',
    boxShadow: '0 4px 20px rgba(212, 175, 55, 0.15), 0 1px 6px rgba(0,0,0,0.05)',
    cursor: 'pointer',
    display: 'block',
    textDecoration: 'none',
    backgroundColor: colors.white,
  },
  productThumbImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
  },
  videoIframe: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: '200%',
    height: '200%',
    transform: 'translate(-50%, -50%)',
    border: 'none',
    pointerEvents: 'none',
  },
  landingVideoSection: {
    marginBottom: '28px',
    padding: '24px',
    backgroundColor: colors.white,
    borderRadius: '12px',
    border: `1px solid ${colors.parchment}`,
    textAlign: 'center',
  },
  landingVideoTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: colors.textPrimary,
    margin: '0 0 16px 0',
  },
  landingVideoWrap: {
    display: 'flex',
    justifyContent: 'center',
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
    padding: '12px 16px',
  },
  ordersHeader: {
    flexDirection: 'column',
    gap: '12px',
    alignItems: 'stretch',
    marginBottom: '20px',
  },
  tiendaBanner: {
    marginBottom: '16px',
  },
  tiendaBannerButton: {
    width: '100%',
    padding: '14px 24px',
    fontSize: '16px',
    justifyContent: 'center',
  },
  ordersTitle: {
    fontSize: '20px',
  },
  orderCard: {
    marginBottom: '12px',
  },
  orderCardHeader: {
    flexDirection: 'column',
    gap: '12px',
    padding: '14px 16px',
  },
  orderNumber: {
    fontSize: '16px',
  },
  orderTime: {
    fontSize: '12px',
  },
  detailsButton: {
    width: 'auto',
    padding: '8px 14px',
    fontSize: '12px',
    alignSelf: 'flex-start',
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
    background-color: ${colors.ivory} !important;
    color: ${colors.primaryDark} !important;
    border: 1px solid ${colors.primary} !important;
  }

  .kiosk-btn-outline:hover {
    background-color: ${colors.primaryMuted} !important;
    color: ${colors.primaryDark} !important;
    transform: translateY(-1px);
  }

  .kiosk-btn-outline:active {
    background-color: ${colors.cream} !important;
    border-color: ${colors.primaryDark} !important;
  }
`;
if (!document.head.querySelector('[data-kiosk-orders-styles]')) {
  styleSheet.setAttribute('data-kiosk-orders-styles', 'true');
  document.head.appendChild(styleSheet);
}
