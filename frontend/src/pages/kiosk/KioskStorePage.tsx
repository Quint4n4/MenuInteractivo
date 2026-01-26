import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MOCK_PRODUCTS, MOCK_SERVICES, type StoreItem } from '../../types/store';
import { useStoreCart } from '../../hooks/useStoreCart';
import { UnifiedItemCard } from '../../components/store/UnifiedItemCard';
import { ServiceReservationModal } from '../../components/services/ServiceReservationModal';
import { CartSidebar } from '../../components/store/CartSidebar';
import { RenovaHeader } from '../../components/store/RenovaHeader';
import { AddToCartNotification } from '../../components/store/AddToCartNotification';
import { kioskApi } from '../../api/kiosk';
import { useSurvey } from '../../contexts/SurveyContext';
import ProductRatingsModal from '../../components/kiosk/ProductRatingsModal';
import StaffRatingModal from '../../components/kiosk/StaffRatingModal';
import StayRatingModal from '../../components/kiosk/StayRatingModal';
import { CannotOrderModal } from '../../components/kiosk/CannotOrderModal';
import { useWebSocket } from '../../hooks/useWebSocket';
import { colors } from '../../styles/colors';

const WS_BASE_URL = import.meta.env.VITE_WS_BASE_URL || 'ws://localhost:8000';

/** Prototipo: Tienda unificada de Clínica CAMSA con productos y servicios */
export const KioskStorePage: React.FC = () => {
  const { deviceId } = useParams<{ deviceId: string }>();
  const navigate = useNavigate();
  const { cart, cartVersion, add, addServiceWithReservation, update, totalItems } = useStoreCart();
  const { surveyState, startSurvey, setProductRatings, setStaffRating, completeSurvey } = useSurvey();

  const [selectedType, setSelectedType] = useState<'all' | 'product' | 'service'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCart, setShowCart] = useState(false);
  const [reservationService, setReservationService] = useState<StoreItem | null>(null);
  const [notificationItem, setNotificationItem] = useState<string | null>(null);
  const [canPatientOrder, setCanPatientOrder] = useState<boolean>(true);
  const [showCannotOrderModal, setShowCannotOrderModal] = useState(false);

  // Load patient info to check can_patient_order
  useEffect(() => {
    const loadPatientInfo = async () => {
      if (deviceId) {
        try {
          const patientData = await kioskApi.getActivePatient(deviceId);
          setCanPatientOrder(patientData.can_patient_order !== false);
          
          // Check if survey is enabled and start it immediately
          if (patientData.survey_enabled && patientData.id) {
            startSurvey(patientData.id, patientData.staff?.full_name || 'Personal');
          }
        } catch (error) {
          console.error('Error loading patient info:', error);
          setCanPatientOrder(true); // Default to true if error
        }
      }
    };
    loadPatientInfo();
  }, [deviceId]);

  // WebSocket to listen for survey_enabled and session_ended
  const wsUrl = deviceId ? `${WS_BASE_URL}/ws/kiosk/orders/?device_uid=${deviceId}` : '';
  
  useWebSocket({
    url: wsUrl,
    onMessage: (message: any) => {
      if (message.type === 'survey_enabled') {
        console.log('Survey enabled via WebSocket - starting survey immediately');
        const assignmentId = message.assignment_id;
        
        // Update can_patient_order to false
        setCanPatientOrder(false);
        
        // Get staff name from patient data and start survey
        kioskApi.getActivePatient(deviceId!).then(patientData => {
          const finalAssignmentId = assignmentId || patientData.id;
          const staffName = patientData.staff?.full_name || 'Personal';
          
          if (finalAssignmentId) {
            startSurvey(finalAssignmentId, staffName);
          }
        }).catch(error => {
          console.error('Error loading patient data for survey:', error);
          // Try with assignment_id from message if available
          if (assignmentId) {
            startSurvey(assignmentId, 'Personal');
          }
        });
      } else if (message.type === 'session_ended') {
        console.log('Session ended - redirecting to home');
        navigate(`/kiosk/${deviceId}`, { replace: true });
      } else if (message.type === 'limits_updated') {
        // Reload patient info to update can_patient_order
        kioskApi.getActivePatient(deviceId!).then(patientData => {
          setCanPatientOrder(patientData.can_patient_order !== false);
        });
      }
    },
    onOpen: () => console.log('✅ Store WebSocket connected'),
    onClose: () => console.log('❌ Store WebSocket disconnected'),
    onError: (error) => console.error('⚠️ Store WebSocket error:', error),
  });

  // Combinar productos y servicios
  const allItems: StoreItem[] = useMemo(() => {
    return [...MOCK_PRODUCTS, ...MOCK_SERVICES];
  }, []);

  // Filtrar items
  const filtered = useMemo(() => {
    let items = allItems;

    // Filtro por tipo (producto o servicio)
    if (selectedType !== 'all') {
      items = items.filter((item) => item.type === selectedType);
    }

    // Filtro por búsqueda
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      items = items.filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query)
      );
    }

    return items;
  }, [allItems, selectedType, searchQuery]);

  const handleAddItem = (item: StoreItem) => {
    // Check if patient can order
    if (!canPatientOrder) {
      setShowCannotOrderModal(true);
      return;
    }

    if (item.type === 'service') {
      setReservationService(item);
    } else {
      add(item.id, 1, 'product');
      setNotificationItem(item.name);
    }
  };

  const handleConfirmReservation = (date: Date, timeSlot: string, notes?: string) => {
    if (reservationService && reservationService.type === 'service') {
      addServiceWithReservation(reservationService.id, date, timeSlot, notes);
      setNotificationItem(reservationService.name);
      setReservationService(null);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: colors.ivory }}>
      <RenovaHeader activePage="store" onCartClick={() => setShowCart(true)} />
      
      {/* Back to Menu Button */}
      <div style={styles.backButtonContainer}>
        <button
          onClick={() => navigate(`/kiosk/${deviceId}`)}
          style={styles.backButton}
        >
          ← Volver al Menú
        </button>
      </div>

      {/* Search and Filter Bar */}
      <div style={styles.searchBar}>
        <div style={styles.searchInputWrap}>
          <span style={styles.searchIcon}>🔍</span>
          <input
            type="text"
            placeholder="Buscar productos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={styles.searchInput}
          />
        </div>
        <select style={styles.sortSelect}>
          <option>Relevancia</option>
          <option>Precio: Menor a Mayor</option>
          <option>Precio: Mayor a Menor</option>
          <option>Nombre A-Z</option>
        </select>
      </div>

      {/* Type Filters - Productos y Servicios */}
      <div style={styles.typeFilters}>
        <button
          type="button"
          style={{
            ...styles.typeBtn,
            ...(selectedType === 'all' ? styles.typeBtnActive : {}),
          }}
          onClick={() => setSelectedType('all')}
        >
          Todos
        </button>
        <button
          type="button"
          style={{
            ...styles.typeBtn,
            ...(selectedType === 'product' ? styles.typeBtnActive : {}),
          }}
          onClick={() => setSelectedType('product')}
        >
          Productos
        </button>
        <button
          type="button"
          style={{
            ...styles.typeBtn,
            ...(selectedType === 'service' ? styles.typeBtnActive : {}),
          }}
          onClick={() => setSelectedType('service')}
        >
          Servicios
        </button>
      </div>

      {/* Products Count */}
      <div style={styles.productsCount}>
        Mostrando {filtered.length} {filtered.length === 1 ? 'producto' : 'productos'}
      </div>

      {/* Main Content */}
      <main style={styles.main}>
        {filtered.length === 0 ? (
          <p style={styles.empty}>No hay productos en esta categoría.</p>
        ) : (
          <div style={styles.grid}>
            {filtered.map((item) => (
              <UnifiedItemCard
                key={`${item.type}-${item.id}`}
                item={item}
                onAdd={handleAddItem}
              />
            ))}
          </div>
        )}
      </main>

      {/* Cart Sidebar */}
      {showCart && (
        <CartSidebar
          cart={cart}
          cartVersion={cartVersion}
          products={MOCK_PRODUCTS}
          services={MOCK_SERVICES}
          onClose={() => setShowCart(false)}
          onUpdateQuantity={update}
          onCheckout={() => {
            setShowCart(false);
            navigate(`/kiosk/${deviceId}/store/checkout`);
          }}
        />
      )}

      {/* Service Reservation Modal */}
      {reservationService && reservationService.type === 'service' && (
        <ServiceReservationModal
          service={reservationService}
          onConfirm={handleConfirmReservation}
          onClose={() => setReservationService(null)}
        />
      )}

      {/* Add to Cart Notification */}
      <AddToCartNotification
        itemName={notificationItem || ''}
        isVisible={notificationItem !== null}
        onClose={() => setNotificationItem(null)}
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

      {/* Cannot Order Modal */}
      <CannotOrderModal
        show={showCannotOrderModal}
        onClose={() => setShowCannotOrderModal(false)}
      />
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  searchBar: {
    display: 'flex',
    gap: 16,
    padding: '1rem 2rem',
    backgroundColor: colors.white,
    borderBottom: `1px solid ${colors.border}`,
  },
  searchInputWrap: {
    flex: 1,
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  searchIcon: {
    position: 'absolute',
    left: 12,
    fontSize: 16,
  },
  searchInput: {
    width: '100%',
    padding: '10px 12px 10px 36px',
    borderRadius: 8,
    border: `1px solid ${colors.border}`,
    fontSize: 14,
    backgroundColor: colors.white,
  },
  sortSelect: {
    padding: '10px 12px',
    borderRadius: 8,
    border: `1px solid ${colors.border}`,
    fontSize: 14,
    backgroundColor: colors.white,
    cursor: 'pointer',
    minWidth: 150,
  },
  typeFilters: {
    display: 'flex',
    gap: 10,
    padding: '1rem 2rem',
    backgroundColor: colors.white,
    borderBottom: `1px solid ${colors.border}`,
  },
  typeBtn: {
    padding: '10px 20px',
    backgroundColor: colors.white,
    color: colors.textPrimary,
    border: `1px solid ${colors.border}`,
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  typeBtnActive: {
    backgroundColor: colors.primary,
    color: colors.white,
    borderColor: colors.primary,
  },
  productsCount: {
    padding: '1rem 2rem',
    fontSize: 14,
    color: colors.textSecondary,
  },
  main: {
    padding: '2rem',
    maxWidth: 1400,
    margin: '0 auto',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: 32,
  },
  empty: {
    textAlign: 'center',
    color: colors.textMuted,
    padding: 48,
    fontSize: 16,
  },
  backButtonContainer: {
    padding: '1rem 2rem',
    backgroundColor: colors.white,
    borderBottom: `1px solid ${colors.border}`,
  },
  backButton: {
    padding: '10px 20px',
    backgroundColor: colors.white,
    color: colors.primary,
    border: `2px solid ${colors.primary}`,
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
};
