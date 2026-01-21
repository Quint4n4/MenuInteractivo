import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { useWebSocket } from '../../hooks/useWebSocket';
import apiClient from '../../api/client';
import { OrderLimitsConfigurator } from '../../components/staff/OrderLimitsConfigurator';
import { CreateOrderModal } from '../../components/staff/CreateOrderModal';
import { colors } from '../../styles/colors';

const WS_BASE_URL = import.meta.env.VITE_WS_BASE_URL || 'ws://localhost:8000';

const DashboardPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [devices, setDevices] = useState<any[]>([]);
  const [activeAssignment, setActiveAssignment] = useState<any>(null);
  const [stats, setStats] = useState({
    activeOrders: 0,
    todayOrders: 0,
    readyOrders: 0,
  });
  const [loading, setLoading] = useState(true);
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [patientForm, setPatientForm] = useState<{
    full_name: string;
    phone_e164: string;
    email: string;
  }>({
    full_name: '',
    phone_e164: '',
    email: '',
  });
  const [activeNotifications, setActiveNotifications] = useState<Array<{id: number; orderId: number; message: string}>>([]);
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);
  const [showLimitsConfigurator, setShowLimitsConfigurator] = useState(false);
  const [showCreateOrderModal, setShowCreateOrderModal] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    show: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'confirm';
    onConfirm?: () => void;
  }>({
    show: false,
    title: '',
    message: '',
    type: 'success'
  });

  // WebSocket connection for real-time order notifications
  const token = localStorage.getItem('access_token');
  const wsUrl = `${WS_BASE_URL}/ws/staff/orders/?token=${token}`;

  const { isConnected } = useWebSocket({
    url: wsUrl,
    onMessage: (message: any) => {
      if (message.type === 'new_order') {
        console.log('🔔 New order notification:', message.order_id);
        addNotification(message.order_id);
        playNotificationSound();
        // Reload stats to show updated numbers
        loadData();
      } else if (message.type === 'order_updated') {
        console.log('📦 Order updated:', message.order_id, message.status);
        // If order is delivered or cancelled, remove the notification
        if (message.status === 'DELIVERED' || message.status === 'CANCELLED') {
          removeNotification(message.order_id);
        }
        loadData();
      } else if (message.type === 'patient_assignment_ended') {
        console.log('✅ Patient assignment ended:', message.assignment_id);
        // Reload data to reflect that staff is now free
        // This happens when patient completes survey and session ends automatically
        loadData();
      }
    },
    onOpen: () => {
      console.log('✅ WebSocket connected to dashboard');
    },
    onClose: () => {
      console.log('❌ WebSocket disconnected from dashboard');
    },
    onError: (error) => {
      console.error('⚠️ WebSocket error:', error);
    },
    reconnectInterval: 5000,
    maxReconnectAttempts: 3,
  });

  useEffect(() => {
    loadData();
  }, []);

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

  const addNotification = (orderId: number) => {
    const newNotification = {
      id: Date.now(),
      orderId: orderId,
      message: `¡Nueva orden #${orderId} recibida!`
    };
    setActiveNotifications(prev => [...prev, newNotification]);
  };

  const removeNotification = (orderId: number) => {
    setActiveNotifications(prev => prev.filter(n => n.orderId !== orderId));
  };

  const playNotificationSound = () => {
    // Create a simple beep sound using Web Audio API
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800; // Frequency in Hz
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.error('Failed to play notification sound:', error);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);

      // Get devices assigned to current user
      const devicesResponse = await apiClient.get('/clinic/devices/', {
        params: { my_devices: 'true' }
      });
      const devicesData = devicesResponse.data;
      const devicesArray = devicesData.results || (Array.isArray(devicesData) ? devicesData : []);
      setDevices(devicesArray);

      // Get active patient assignment
      try {
        const assignmentResponse = await apiClient.get('/clinic/patient-assignments/my_active/');
        setActiveAssignment(assignmentResponse.data);
      } catch (err: any) {
        if (err.response?.status !== 404) {
          console.error('Failed to load active assignment:', err);
        }
        setActiveAssignment(null);
      }

      // Get order stats - admins see all, staff see only their assigned patient's orders
      const params: any = { status: 'PLACED,PREPARING,READY' };
      if (!user?.is_superuser) {
        params.my_orders = 'true';
      }
      const ordersResponse = await apiClient.get('/orders/queue/', { params });
      const ordersData = ordersResponse.data;
      const orders = ordersData.orders || [];

      setStats({
        activeOrders: orders.filter((o: any) => o.status === 'PLACED' || o.status === 'PREPARING').length,
        todayOrders: orders.length,
        readyOrders: orders.filter((o: any) => o.status === 'READY').length,
      });
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  const showModal = (title: string, message: string, type: 'success' | 'error' | 'warning' | 'confirm', onConfirm?: () => void) => {
    setConfirmModal({ show: true, title, message, type, onConfirm });
  };

  const closeModal = () => {
    setConfirmModal({ show: false, title: '', message: '', type: 'success' });
  };

  const handleLogout = async () => {
    await logout();
    navigate('/staff/login');
  };

  const handleCreatePatient = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate that user has an assigned device
    if (devices.length === 0) {
      showModal('Sin Dispositivo Asignado', 'Necesitas tener un dispositivo asignado antes de registrar un paciente', 'error');
      return;
    }

    // Check if there's already an active assignment
    if (activeAssignment) {
      showModal('Paciente Activo', `Ya estás atendiendo a ${activeAssignment.patient_details.full_name}. Por favor finaliza esa atención primero.`, 'warning');
      return;
    }

    // Validate phone number is exactly 10 digits
    if (!/^\d{10}$/.test(patientForm.phone_e164)) {
      showModal('Número de Teléfono Inválido', 'El número de teléfono debe tener exactamente 10 dígitos', 'error');
      return;
    }

    const firstDevice = devices[0];

    try {
      // Create patient with phone in E.164 format (+52 for Mexico)
      const patientData: any = {
        full_name: patientForm.full_name,
        phone_e164: `+52${patientForm.phone_e164}`
      };
      
      // Add email if provided
      if (patientForm.email && patientForm.email.trim()) {
        patientData.email = patientForm.email.trim();
      }
      
      const patientResponse = await apiClient.post('/clinic/patients/', patientData);
      const patient = patientResponse.data;

      // Create patient assignment
      await apiClient.post('/clinic/patient-assignments/', {
        patient: patient.id,
        staff: user?.id,
        device: firstDevice.id,
        room: firstDevice.room
      });

      showModal('¡Éxito!', '¡Paciente registrado y asignado exitosamente!', 'success');
      setShowPatientModal(false);
      setPatientForm({ full_name: '', phone_e164: '', email: '' });

      // Reload data to show new assignment
      loadData();
    } catch (err: any) {
      console.error('Failed to create patient:', err);
      const errorMsg = err.response?.data?.phone_e164?.[0]
        || err.response?.data?.detail
        || err.response?.data?.non_field_errors?.[0]
        || 'Error al registrar paciente';
      showModal('Registro Fallido', errorMsg, 'error');
    }
  };

  const handleEndCare = async () => {
    if (!activeAssignment) return;

    showModal(
      'Finalizar Atención del Paciente',
      `¿Estás seguro de que deseas finalizar la atención de ${activeAssignment.patient_details.full_name}?`,
      'confirm',
      async () => {
        try {
          await apiClient.post(`/clinic/patient-assignments/${activeAssignment.id}/end_care/`);
          showModal('¡Éxito!', 'Atención del paciente finalizada exitosamente', 'success');
          loadData();
        } catch (err: any) {
          console.error('Failed to end care:', err);
          showModal('Error', err.response?.data?.detail || 'Error al finalizar la atención del paciente', 'error');
        }
      }
    );
  };

  const handleSaveLimits = async (limits: { DRINK: number; SNACK: number }) => {
    if (!activeAssignment) return;

    try {
      await apiClient.patch(`/clinic/patient-assignments/${activeAssignment.id}/update_limits/`, limits);
      showModal('¡Éxito!', 'Límites de orden actualizados exitosamente. El paciente ahora puede ordenar nuevamente.', 'success');
      setShowLimitsConfigurator(false);
      loadData(); // Reload to show updated limits
    } catch (err: any) {
      console.error('Failed to update limits:', err);
      showModal('Error', err.response?.data?.detail || 'Error al actualizar límites de orden', 'error');
    }
  };

  const handleEnableSurvey = async () => {
    if (!activeAssignment) return;

    showModal(
      'Habilitar Encuesta',
      `¿Deseas habilitar la encuesta para ${activeAssignment.patient_details.full_name}? El paciente podrá calificar su experiencia.`,
      'confirm',
      async () => {
        try {
          await apiClient.post(`/clinic/patient-assignments/${activeAssignment.id}/enable_survey/`);
          showModal('¡Éxito!', 'Encuesta habilitada exitosamente. El paciente ahora puede responder la encuesta.', 'success');
          loadData();
        } catch (err: any) {
          console.error('Failed to enable survey:', err);
          showModal('Error', err.response?.data?.detail || 'Error al habilitar la encuesta', 'error');
        }
      }
    );
  };

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
          <h1 style={{fontSize: isMobile ? '20px' : '28px', margin: 0}}>Panel de Enfermería</h1>
          <div style={{...styles.userInfo, fontSize: isMobile ? '12px' : '14px'}}>
            {user?.full_name || user?.email} |
            <span style={{ marginLeft: '10px', color: isConnected ? colors.success : colors.error }}>
              {isConnected ? '● En Línea' : '○ Desconectado'}
            </span>
          </div>
        </div>
        <div style={{
          ...styles.headerActions,
          width: isMobile ? '100%' : 'auto',
          justifyContent: isMobile ? 'space-between' : 'flex-end'
        }}>
          {/* Notification Bell */}
          <div style={styles.notificationBellContainer}>
            <button
              onClick={() => setShowNotificationsDropdown(!showNotificationsDropdown)}
              style={{
                ...styles.notificationBell,
                padding: isMobile ? '6px 10px' : '8px 12px',
                fontSize: isMobile ? '20px' : '24px'
              }}
              title="Notificaciones"
            >
              🔔
              {activeNotifications.length > 0 && (
                <span style={styles.notificationBadge}>
                  {activeNotifications.length}
                </span>
              )}
            </button>

            {/* Dropdown */}
            {showNotificationsDropdown && (
              <div style={{
                ...styles.notificationsDropdown,
                width: isMobile ? 'calc(100vw - 20px)' : isTablet ? '350px' : '380px',
                right: isMobile ? '-10px' : '0'
              }}>
                <div style={styles.dropdownHeader}>
                  <strong>Notificaciones</strong>
                  <button
                    onClick={() => setShowNotificationsDropdown(false)}
                    style={styles.dropdownCloseButton}
                  >
                    ×
                  </button>
                </div>
                <div style={styles.dropdownContent}>
                  {activeNotifications.length === 0 ? (
                    <div style={styles.emptyNotifications}>
                      <p>No hay notificaciones nuevas</p>
                    </div>
                  ) : (
                    activeNotifications.map((notification) => (
                      <div key={notification.id} style={styles.notificationItem}>
                        <div style={styles.notificationItemIcon}>🔔</div>
                        <div style={styles.notificationItemContent}>
                          <strong>¡Nueva Orden!</strong>
                          <p style={{margin: '5px 0', fontSize: '14px'}}>
                            {notification.message}
                          </p>
                          <Link
                            to="/staff/orders"
                            style={styles.viewOrderLink}
                            onClick={() => setShowNotificationsDropdown(false)}
                          >
                            Ver Órdenes →
                          </Link>
                        </div>
                        <button
                          onClick={() => removeNotification(notification.orderId)}
                          style={styles.dismissButton}
                          title="Descartar"
                        >
                          ×
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <button onClick={handleLogout} style={styles.logoutButton} className="logout-button">
            Cerrar Sesión
          </button>
        </div>
      </header>

      <div style={styles.content}>
        {loading ? (
          <div style={styles.loading}>Cargando...</div>
        ) : (
          <>
            {/* Active Patient Assignment */}
            {activeAssignment && (
              <div style={styles.activePatientSection}>
                <div style={styles.activePatientHeader}>
                  <h2>🏥 Paciente Actualmente en Atención</h2>
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <button onClick={() => setShowCreateOrderModal(true)} style={styles.createOrderButton} className="create-order-button">
                      🛒 Crear Orden
                    </button>
                    <button onClick={() => setShowLimitsConfigurator(true)} style={styles.configureLimitsButton} className="configure-limits-button">
                      ⚙️ Configurar Límites
                    </button>
                    {activeAssignment && !activeAssignment.survey_enabled && !activeAssignment.can_patient_order && (
                      <button onClick={handleEnableSurvey} style={styles.enableSurveyButton} className="enable-survey-button">
                        📝 Habilitar Encuesta
                      </button>
                    )}
                    <button onClick={handleEndCare} style={styles.endCareButton} className="end-care-button">
                      Finalizar Atención
                    </button>
                  </div>
                </div>
                <div style={styles.activePatientCard}>
                  <div style={styles.patientIcon}>👤</div>
                  <div style={styles.patientInfo}>
                    <h3>{activeAssignment.patient_details.full_name}</h3>
                    <div style={styles.patientDetails}>
                      <div style={styles.detailRow}>
                        <span style={styles.detailLabel}>Teléfono:</span>
                        <span>{activeAssignment.patient_details.phone_e164}</span>
                      </div>
                      <div style={styles.detailRow}>
                        <span style={styles.detailLabel}>Habitación:</span>
                        <span>{activeAssignment.room_details.code}</span>
                      </div>
                      <div style={styles.detailRow}>
                        <span style={styles.detailLabel}>Dispositivo:</span>
                        <span>{activeAssignment.device_details.device_uid}</span>
                      </div>
                      <div style={styles.detailRow}>
                        <span style={styles.detailLabel}>Inicio:</span>
                        <span>{new Date(activeAssignment.started_at).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Device & Room Info */}
            <div style={styles.deviceSection}>
              <h2>Mis Dispositivos y Habitaciones Asignadas</h2>
              {devices.length === 0 ? (
                <div style={styles.noDevices}>
                  <p>⚠️ Aún no tienes dispositivos asignados.</p>
                  <p style={{ fontSize: '14px', color: '#666' }}>
                    Por favor contacta a tu administrador para que te asigne un dispositivo y habitación.
                  </p>
                </div>
              ) : (
                <div style={{
                  ...styles.devicesGrid,
                  gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(auto-fill, minmax(200px, 1fr))' : 'repeat(auto-fill, minmax(250px, 1fr))',
                  gap: isMobile ? '15px' : '20px'
                }}>
                  {devices.map((device) => (
                    <div key={device.id} style={styles.deviceCard} className="device-card">
                      <div style={styles.deviceIcon}>📱</div>
                      <h3>{device.device_uid}</h3>
                      <p style={styles.deviceType}>{device.device_type_display}</p>
                      <div style={styles.deviceInfo}>
                        <div style={styles.infoRow}>
                          <span style={styles.infoLabel}>Habitación:</span>
                          <span style={styles.infoValue}>
                            {device.room_code || 'Sin habitación asignada'}
                          </span>
                        </div>
                        <div style={styles.infoRow}>
                          <span style={styles.infoLabel}>Estado:</span>
                          <span style={{
                            ...styles.statusBadge,
                            backgroundColor: device.is_active ? colors.success : colors.textSecondary
                          }}>
                            {device.is_active ? 'Activo' : 'Inactivo'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Stats */}
            <div style={styles.statsSection}>
              <h2 style={{fontSize: isMobile ? '20px' : '24px'}}>Estadísticas de Órdenes</h2>
              <div style={{
                ...styles.statsGrid,
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
                gap: isMobile ? '15px' : '20px'
              }}>
                <div style={styles.statCard} className="stat-card">
                  <div style={styles.statIcon}>📋</div>
                  <div style={styles.statValue}>{stats.activeOrders}</div>
                  <div style={styles.statLabel}>Órdenes Activas</div>
                </div>
                <div style={styles.statCard} className="stat-card">
                  <div style={styles.statIcon}>✅</div>
                  <div style={styles.statValue}>{stats.readyOrders}</div>
                  <div style={styles.statLabel}>Listas para Entrega</div>
                </div>
                <div style={styles.statCard} className="stat-card">
                  <div style={styles.statIcon}>📊</div>
                  <div style={styles.statValue}>{stats.todayOrders}</div>
                  <div style={styles.statLabel}>Órdenes de Hoy</div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div style={styles.actionsSection}>
              <h2 style={{fontSize: isMobile ? '20px' : '24px'}}>Acciones Rápidas</h2>
              <div style={{
                ...styles.actionsGrid,
                gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(250px, 1fr))',
                gap: isMobile ? '15px' : '20px'
              }}>
                <Link to="/staff/orders" style={styles.actionCard} className="action-card">
                  <div style={{...styles.actionIcon, backgroundColor: colors.primary}}>📦</div>
                  <h3>Ver Órdenes</h3>
                  <p>Ver y gestionar todas las órdenes de tus habitaciones asignadas</p>
                </Link>

                <Link to="/staff/inventory" style={styles.actionCard} className="action-card">
                  <div style={{...styles.actionIcon, backgroundColor: colors.primaryDark}}>📊</div>
                  <h3>Ver Inventario</h3>
                  <p>Consultar niveles de stock actuales de todos los productos</p>
                </Link>

                <button onClick={() => setShowPatientModal(true)} style={styles.actionCardButton} className="action-card-button">
                  <div style={{...styles.actionIcon, backgroundColor: colors.primary}}>👤</div>
                  <h3>Registrar Paciente</h3>
                  <p>Agregar un nuevo paciente al sistema</p>
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Patient Registration Modal */}
      {showPatientModal && (
        <div style={styles.modalOverlay} onClick={() => setShowPatientModal(false)}>
          <div style={{
            ...styles.modal,
            padding: isMobile ? '20px' : '30px',
            maxWidth: isMobile ? '95%' : '500px',
            margin: isMobile ? '10px' : '0'
          }} onClick={(e) => e.stopPropagation()}>
            <h2>Registrar Nuevo Paciente</h2>
            <form onSubmit={handleCreatePatient} style={styles.form}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Nombre Completo *</label>
                <input
                  type="text"
                  value={patientForm.full_name}
                  onChange={(e) => setPatientForm({...patientForm, full_name: e.target.value})}
                  style={styles.input}
                  required
                  placeholder="Juan Pérez"
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Número de Teléfono *</label>
                <input
                  type="tel"
                  value={patientForm.phone_e164}
                  onChange={(e) => {
                    // Only allow digits and limit to 10 characters
                    const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setPatientForm({...patientForm, phone_e164: value});
                  }}
                  style={styles.input}
                  required
                  placeholder="1234567890"
                  maxLength={10}
                />
                <small style={{ color: '#666', fontSize: '12px' }}>
                  Ingresa 10 dígitos (ej. 5551234567). El sistema agregará +52 automáticamente.
                </small>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Correo Electrónico (Opcional)</label>
                <input
                  type="email"
                  value={patientForm.email}
                  onChange={(e) => setPatientForm({...patientForm, email: e.target.value})}
                  style={styles.input}
                  placeholder="juan.perez@example.com"
                />
              </div>
              <div style={styles.formActions}>
                <button type="button" onClick={() => setShowPatientModal(false)} style={styles.cancelButton}>
                  Cancelar
                </button>
                <button type="submit" style={styles.submitButton} className="submit-button">
                  Registrar Paciente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation/Alert Modal */}
      {confirmModal.show && (
        <div style={styles.modalOverlay}>
          <div style={styles.confirmModalContent}>
            <div style={{
              ...styles.modalHeader,
              backgroundColor: confirmModal.type === 'success' ? colors.success :
                               confirmModal.type === 'error' ? colors.error :
                               confirmModal.type === 'warning' ? colors.warning : colors.primary
            }}>
              <h2 style={{ margin: 0, fontSize: '20px' }}>
                {confirmModal.type === 'success' && '✓ '}
                {confirmModal.type === 'error' && '✕ '}
                {confirmModal.type === 'warning' && '⚠ '}
                {confirmModal.type === 'confirm' && '? '}
                {confirmModal.title}
              </h2>
            </div>
            <div style={styles.modalBody}>
              <p style={{ margin: '20px 0', fontSize: '16px', lineHeight: '1.5' }}>
                {confirmModal.message}
              </p>
            </div>
            <div style={styles.modalFooter}>
              {confirmModal.type === 'confirm' ? (
                <>
                  <button onClick={closeModal} style={styles.modalCancelButton}>
                    Cancelar
                  </button>
                  <button
                    onClick={() => {
                      confirmModal.onConfirm?.();
                      closeModal();
                    }}
                    style={styles.modalConfirmButton}
                    className="modal-confirm-button"
                  >
                    Confirmar
                  </button>
                </>
              ) : (
                <button onClick={closeModal} style={styles.modalOkButton} className="modal-ok-button">
                  OK
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Order Limits Configurator Modal */}
      {showLimitsConfigurator && activeAssignment && (
        <OrderLimitsConfigurator
          currentLimits={activeAssignment.order_limits || {}}
          onSave={handleSaveLimits}
          onCancel={() => setShowLimitsConfigurator(false)}
        />
      )}

      {/* Create Order Modal */}
      {showCreateOrderModal && activeAssignment && (
        <CreateOrderModal
          assignmentId={activeAssignment.id}
          patientName={activeAssignment.patient_details.full_name}
          onClose={() => setShowCreateOrderModal(false)}
          onSuccess={() => {
            setShowCreateOrderModal(false);
            showModal('¡Éxito!', 'Orden creada exitosamente para el paciente', 'success');
            loadData();
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
  },
  header: {
    backgroundColor: colors.white,
    color: colors.textPrimary,
    padding: '20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: colors.shadowGold,
    borderBottom: `2px solid ${colors.primaryMuted}`,
  },
  userInfo: {
    fontSize: '14px',
    opacity: 0.9,
    marginTop: '5px',
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
  },
  notificationBellContainer: {
    position: 'relative',
  },
  notificationBell: {
    background: 'rgba(255,255,255,0.1)',
    border: 'none',
    color: 'white',
    fontSize: '24px',
    cursor: 'pointer',
    padding: '8px 12px',
    borderRadius: '5px',
    position: 'relative',
    transition: 'background 0.2s',
  },
  notificationBadge: {
    position: 'absolute',
    top: '2px',
    right: '2px',
    backgroundColor: colors.error,
    color: 'white',
    borderRadius: '50%',
    width: '20px',
    height: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: 'bold',
  },
  notificationsDropdown: {
    position: 'absolute',
    top: '50px',
    right: '0',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
    width: '380px',
    maxHeight: '500px',
    display: 'flex',
    flexDirection: 'column',
    zIndex: 1000,
  },
  dropdownHeader: {
    padding: '15px 20px',
    borderBottom: '1px solid #e0e0e0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px 8px 0 0',
  },
  dropdownCloseButton: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: '#666',
    padding: '0',
    width: '24px',
    height: '24px',
  },
  dropdownContent: {
    maxHeight: '440px',
    overflowY: 'auto',
  },
  emptyNotifications: {
    padding: '40px 20px',
    textAlign: 'center',
    color: '#999',
  },
  notificationItem: {
    padding: '15px 20px',
    borderBottom: '1px solid #f0f0f0',
    display: 'flex',
    gap: '12px',
    alignItems: 'flex-start',
    backgroundColor: 'white',
    transition: 'background 0.2s',
  },
  notificationItemIcon: {
    fontSize: '24px',
    flexShrink: 0,
  },
  notificationItemContent: {
    flex: 1,
    color: '#333',
  },
  viewOrderLink: {
    display: 'inline-block',
    marginTop: '5px',
    color: '#3498db',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: '600',
  },
  dismissButton: {
    background: '#f0f0f0',
    border: 'none',
    color: '#666',
    fontSize: '20px',
    cursor: 'pointer',
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    flexShrink: 0,
    transition: 'background 0.2s',
  },
  logoutButton: {
    padding: '10px 20px',
    backgroundColor: colors.error,
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    transition: 'all 0.2s',
  },
  content: {
    padding: '20px',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  loading: {
    textAlign: 'center',
    padding: '40px',
    fontSize: '18px',
    color: '#666',
  },
  activePatientSection: {
    marginBottom: '30px',
    backgroundColor: colors.cream,
    padding: '20px',
    borderRadius: '12px',
    border: `2px solid ${colors.primary}`,
    boxShadow: colors.shadowGold,
  },
  activePatientHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '15px',
  },
  endCareButton: {
    padding: '10px 20px',
    backgroundColor: colors.error,
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 'bold',
    transition: 'all 0.2s',
  },
  activePatientCard: {
    backgroundColor: colors.white,
    padding: '20px',
    borderRadius: '12px',
    display: 'flex',
    gap: '20px',
    alignItems: 'flex-start',
    boxShadow: `0 2px 8px ${colors.shadow}`,
  },
  patientIcon: {
    fontSize: '64px',
    flexShrink: 0,
  },
  patientInfo: {
    flex: 1,
  },
  patientDetails: {
    marginTop: '15px',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '10px',
  },
  detailRow: {
    display: 'flex',
    gap: '10px',
  },
  detailLabel: {
    fontWeight: 'bold',
    color: '#555',
  },
  deviceSection: {
    marginBottom: '30px',
  },
  noDevices: {
    backgroundColor: '#fff3cd',
    border: '1px solid #ffc107',
    borderRadius: '8px',
    padding: '20px',
    textAlign: 'center',
  },
  devicesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '20px',
    marginTop: '15px',
  },
  deviceCard: {
    backgroundColor: colors.white,
    padding: '20px',
    borderRadius: '12px',
    boxShadow: colors.shadowGold,
    textAlign: 'center',
    border: `1px solid ${colors.primaryMuted}`,
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  deviceIcon: {
    fontSize: '48px',
    marginBottom: '10px',
  },
  deviceType: {
    color: '#666',
    fontSize: '14px',
    marginBottom: '15px',
  },
  deviceInfo: {
    marginTop: '15px',
    paddingTop: '15px',
    borderTop: '1px solid #eee',
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  infoLabel: {
    fontSize: '14px',
    color: '#666',
  },
  infoValue: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  statusBadge: {
    padding: '6px 14px',
    borderRadius: '16px',
    color: 'white',
    fontSize: '12px',
    fontWeight: 'bold',
  },
  statsSection: {
    marginBottom: '30px',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
    marginTop: '15px',
  },
  statCard: {
    backgroundColor: colors.white,
    padding: '24px',
    borderRadius: '12px',
    boxShadow: colors.shadowGold,
    textAlign: 'center',
    border: `1px solid ${colors.primaryMuted}`,
    transition: 'transform 0.2s',
  },
  statIcon: {
    fontSize: '32px',
    marginBottom: '10px',
  },
  statValue: {
    fontSize: '36px',
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: '8px',
  },
  statLabel: {
    fontSize: '14px',
    color: '#7f8c8d',
  },
  actionsSection: {
    marginBottom: '30px',
  },
  actionsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
    gap: '20px',
    marginTop: '15px',
  },
  actionCard: {
    backgroundColor: colors.white,
    padding: '30px',
    borderRadius: '12px',
    boxShadow: colors.shadowGold,
    textDecoration: 'none',
    color: 'inherit',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s',
    border: `1px solid ${colors.primaryMuted}`,
  },
  actionCardButton: {
    backgroundColor: colors.white,
    padding: '30px',
    borderRadius: '12px',
    boxShadow: colors.shadowGold,
    border: `1px solid ${colors.primaryMuted}`,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  actionIcon: {
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '28px',
    marginBottom: '15px',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: 'white',
    padding: '30px',
    borderRadius: '8px',
    width: '90%',
    maxWidth: '500px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#333',
  },
  input: {
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
  },
  formActions: {
    display: 'flex',
    gap: '12px',
    marginTop: '16px',
  },
  cancelButton: {
    flex: 1,
    padding: '12px',
    backgroundColor: '#95a5a6',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  submitButton: {
    flex: 1,
    padding: '12px',
    backgroundColor: colors.primary,
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 'bold',
    transition: 'all 0.2s',
  },
  confirmModalContent: {
    backgroundColor: 'white',
    borderRadius: '8px',
    width: '90%',
    maxWidth: '450px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
    overflow: 'hidden',
  },
  modalHeader: {
    padding: '20px',
    color: 'white',
  },
  modalBody: {
    padding: '0 20px',
    color: '#333',
  },
  modalFooter: {
    padding: '20px',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
    borderTop: '1px solid #e0e0e0',
  },
  modalOkButton: {
    padding: '10px 30px',
    backgroundColor: colors.primary,
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '600',
    transition: 'all 0.2s',
  },
  modalCancelButton: {
    padding: '10px 30px',
    backgroundColor: '#95a5a6',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '16px',
  },
  modalConfirmButton: {
    padding: '10px 30px',
    backgroundColor: colors.primary,
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '600',
    transition: 'all 0.2s',
  },
  configureLimitsButton: {
    padding: '12px 24px',
    backgroundColor: colors.primary,
    color: colors.white,
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  createOrderButton: {
    padding: '12px 24px',
    backgroundColor: colors.primary,
    color: colors.white,
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  enableSurveyButton: {
    padding: '12px 24px',
    backgroundColor: colors.primaryDark,
    color: colors.white,
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
};

// Add hover effects
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  .device-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px ${colors.shadowGold} !important;
  }
  
  .stat-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px ${colors.shadowGold} !important;
  }
  
  .action-card:hover, .action-card-button:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px ${colors.shadowGold} !important;
  }
  
  .logout-button:hover {
    background-color: ${colors.error} !important;
    transform: scale(1.05);
  }
  
  .create-order-button:hover, .configure-limits-button:hover {
    background-color: ${colors.primaryDark} !important;
    transform: scale(1.02);
  }
  
  .end-care-button:hover {
    background-color: ${colors.error} !important;
    transform: scale(1.02);
  }
  
  .submit-button:hover, .modal-confirm-button:hover, .modal-ok-button:hover {
    background-color: ${colors.primaryDark} !important;
    transform: scale(1.02);
  }
`;
if (!document.head.querySelector('[data-staff-dashboard-styles]')) {
  styleSheet.setAttribute('data-staff-dashboard-styles', 'true');
  document.head.appendChild(styleSheet);
}

export default DashboardPage;
