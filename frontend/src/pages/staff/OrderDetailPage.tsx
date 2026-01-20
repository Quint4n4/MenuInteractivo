import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ordersApi } from '../../api/orders';
import { colors } from '../../styles/colors';

const OrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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

  useEffect(() => {
    if (id) {
      loadOrder(parseInt(id));
    }
  }, [id]);

  const loadOrder = async (orderId: number) => {
    try {
      setLoading(true);
      const data = await ordersApi.getOrderById(orderId);
      setOrder(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al cargar la orden');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string, note?: string) => {
    if (!order) return;

    try {
      const response = await ordersApi.changeOrderStatus(order.id, {
        to_status: newStatus,
        note,
      });
      setOrder(response.order);
      setSuccessModal({
        show: true,
        title: 'Estado Actualizado',
        message: translateMessage(response.message),
      });
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Error al actualizar el estado';
      setConfirmModal({
        show: true,
        title: 'Error',
        message: errorMsg,
        onConfirm: () => setConfirmModal({ ...confirmModal, show: false }),
        confirmText: 'OK',
        cancelText: undefined,
      });
      console.error(err);
    }
  };

  const handleCancel = async () => {
    if (!order) return;

    setConfirmModal({
      show: true,
      title: 'Cancelar Orden',
      message: '¿Estás seguro de que deseas cancelar esta orden? Esta acción no se puede deshacer.',
      onConfirm: async () => {
        setConfirmModal({ ...confirmModal, show: false });

        try {
          const response = await ordersApi.cancelOrder(order.id, 'Cancelada por el personal');
          setOrder(response.order);
          setSuccessModal({
            show: true,
            title: 'Orden Cancelada',
            message: translateMessage(response.message),
          });
        } catch (err: any) {
          const errorMsg = err.response?.data?.error || 'Error al cancelar la orden';
          setConfirmModal({
            show: true,
            title: 'Error',
            message: errorMsg,
            onConfirm: () => setConfirmModal({ ...confirmModal, show: false }),
            confirmText: 'OK',
            cancelText: undefined,
          });
          console.error(err);
        }
      },
      confirmText: 'Sí, Cancelar Orden',
      cancelText: 'No, Mantener Orden',
    });
  };

  const translateStatus = (status: string): string => {
    const statusMap: { [key: string]: string } = {
      'NUEVO': 'Nuevo',
      'PLACED': 'Realizada',
      'PREPARING': 'Preparando',
      'READY': 'Lista',
      'DELIVERED': 'Entregada',
      'CANCELLED': 'Cancelada',
    };
    return statusMap[status] || status;
  };

  const translateMessage = (message: string): string => {
    // Traducir mensajes comunes del backend
    if (message.includes('Order status changed from')) {
      return message
        .replace(/Order status changed from (\w+) to (\w+)/i, (match, from, to) => {
          return `Estado de orden cambiado de ${translateStatus(from)} a ${translateStatus(to)}`;
        })
        .replace(/Order status changed/i, 'Estado de orden cambiado');
    }
    if (message.includes('Order cancelled')) {
      return message.replace(/Order cancelled/i, 'Orden cancelada');
    }
    if (message.includes('Order created')) {
      return message.replace(/Order created/i, 'Orden creada');
    }
    if (message.includes('Order placed')) {
      return message.replace(/Order placed/i, 'Orden realizada');
    }
    // Si no coincide con ningún patrón, devolver el mensaje original
    return message;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PLACED':
        return colors.orderPlaced;
      case 'PREPARING':
        return colors.orderPreparing;
      case 'READY':
        return colors.orderReady;
      case 'DELIVERED':
        return colors.orderDelivered;
      case 'CANCELLED':
        return colors.orderCancelled;
      default:
        return colors.orderCancelled;
    }
  };

  const getNextActions = (currentStatus: string) => {
    switch (currentStatus) {
      case 'PLACED':
        return [{ status: 'PREPARING', label: 'Comenzar Preparación' }];
      case 'PREPARING':
        return [{ status: 'READY', label: 'Marcar como Lista' }];
      case 'READY':
        return [{ status: 'DELIVERED', label: 'Marcar como Entregada' }];
      default:
        return [];
    }
  };

  if (loading) {
    return <div style={styles.container}>Cargando...</div>;
  }

  if (error || !order) {
    return (
      <div style={styles.container}>
        <div style={styles.error}>{error || 'Orden no encontrada'}</div>
        <button onClick={() => navigate('/staff/orders')} style={styles.backButton}>
          Volver a Órdenes
        </button>
      </div>
    );
  }

  const nextActions = getNextActions(order.status);
  const canCancel = order.status !== 'DELIVERED' && order.status !== 'CANCELLED';

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button onClick={() => navigate('/staff/orders')} style={styles.backButton} className="back-button">
          ← Atrás
        </button>
        <h1>Orden #{order.id}</h1>
      </div>

      <div style={styles.content}>
        <div style={styles.section}>
          <h2>Estado</h2>
          <div
            style={{
              ...styles.statusBadge,
              backgroundColor: getStatusColor(order.status),
            }}
          >
            {order.status_display}
          </div>
        </div>

        <div style={styles.section}>
          <h2>Información de la Orden</h2>
          <div style={styles.infoGrid}>
            <div>
              <strong>Habitación:</strong> {order.room_code || 'N/A'}
            </div>
            <div>
              <strong>Dispositivo:</strong> {order.device_uid || 'N/A'}
            </div>
            <div>
              <strong>Paciente:</strong> {order.patient_name || 'N/A'}
            </div>
            <div>
              <strong>Realizada:</strong> {new Date(order.placed_at).toLocaleString('es-MX')}
            </div>
            {order.delivered_at && (
              <div>
                <strong>Entregada:</strong> {new Date(order.delivered_at).toLocaleString('es-MX')}
              </div>
            )}
            {order.cancelled_at && (
              <div>
                <strong>Cancelada:</strong> {new Date(order.cancelled_at).toLocaleString('es-MX')}
              </div>
            )}
          </div>
        </div>

        <div style={styles.section}>
          <h2>Artículos</h2>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Producto</th>
                <th style={styles.th}>Categoría</th>
                <th style={styles.th}>Cantidad</th>
                <th style={styles.th}>Unidad</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item: any) => (
                <tr key={item.id}>
                  <td style={styles.td}>{item.product_name}</td>
                  <td style={styles.td}>{item.product_category}</td>
                  <td style={styles.td}>{item.quantity}</td>
                  <td style={styles.td}>{item.unit_label}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {order.status_events && order.status_events.length > 0 && (
          <div style={styles.section}>
            <h2>Historial de Estados</h2>
            <div style={styles.timeline}>
              {order.status_events.map((event: any) => (
                <div key={event.id} style={styles.timelineItem}>
                  <div style={styles.timelineStatus}>
                    {translateStatus(event.from_status || 'NUEVO')} → {translateStatus(event.to_status)}
                  </div>
                  <div style={styles.timelineTime}>
                    {new Date(event.changed_at).toLocaleString('es-MX')}
                  </div>
                  {event.changed_by_email && (
                    <div style={styles.timelineUser}>Por: {event.changed_by_email}</div>
                  )}
                  {event.note && (
                    <div style={styles.timelineNote}>
                      {event.note === 'Order placed from kiosk' ? 'Orden realizada desde kiosco' : event.note}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={styles.actions}>
          {nextActions.map((action) => (
            <button
              key={action.status}
              onClick={() => handleStatusChange(action.status)}
              style={styles.actionButton}
              className="action-button"
            >
              {action.label}
            </button>
          ))}
          {canCancel && (
            <button onClick={handleCancel} style={styles.cancelButton} className="cancel-button">
              Cancelar Orden
            </button>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmModal.show && (
        <div style={styles.modalOverlay} onClick={() => !confirmModal.cancelText && setConfirmModal({ ...confirmModal, show: false })}>
          <div style={styles.confirmModalContent} onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.confirmModalTitle}>{confirmModal.title}</h2>
            <p style={styles.confirmModalMessage}>{confirmModal.message}</p>
            <div style={styles.confirmModalButtons}>
              {confirmModal.cancelText && (
                <button
                  style={styles.modalCancelButton}
                  onClick={() => setConfirmModal({ ...confirmModal, show: false })}
                >
                  {confirmModal.cancelText}
                </button>
              )}
              <button
                style={styles.modalConfirmButton}
                onClick={confirmModal.onConfirm}
                className="modal-confirm-button"
              >
                {confirmModal.confirmText || 'Confirmar'}
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
              className="success-button"
            >
              OK
            </button>
          </div>
        </div>
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
    alignItems: 'center',
    gap: '20px',
    boxShadow: colors.shadowGold,
    borderBottom: `2px solid ${colors.primaryMuted}`,
  },
  backButton: {
    padding: '10px 20px',
    backgroundColor: colors.primaryDark,
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    transition: 'all 0.2s',
  },
  content: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
  },
  section: {
    backgroundColor: colors.white,
    padding: '24px',
    borderRadius: '12px',
    marginBottom: '20px',
    boxShadow: colors.shadowGold,
    border: `1px solid ${colors.primaryMuted}`,
  },
  statusBadge: {
    display: 'inline-block',
    padding: '10px 20px',
    borderRadius: '20px',
    color: 'white',
    fontSize: '16px',
    fontWeight: 'bold',
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '15px',
    marginTop: '15px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '15px',
  },
  th: {
    textAlign: 'left',
    padding: '10px',
    borderBottom: '2px solid #ddd',
    backgroundColor: '#f8f9fa',
  },
  td: {
    padding: '10px',
    borderBottom: '1px solid #ddd',
  },
  timeline: {
    marginTop: '15px',
  },
  timelineItem: {
    padding: '15px',
    borderLeft: `3px solid ${colors.primary}`,
    marginBottom: '15px',
    backgroundColor: colors.cream,
    borderRadius: '0 8px 8px 0',
  },
  timelineStatus: {
    fontWeight: 'bold',
    marginBottom: '5px',
  },
  timelineTime: {
    fontSize: '12px',
    color: '#666',
    marginBottom: '5px',
  },
  timelineUser: {
    fontSize: '12px',
    color: '#666',
    marginBottom: '5px',
  },
  timelineNote: {
    fontSize: '14px',
    color: '#555',
    marginTop: '5px',
  },
  actions: {
    display: 'flex',
    gap: '10px',
    marginTop: '20px',
  },
  actionButton: {
    padding: '12px 30px',
    backgroundColor: colors.primary,
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    cursor: 'pointer',
    fontWeight: 'bold',
    transition: 'all 0.2s',
  },
  cancelButton: {
    padding: '12px 30px',
    backgroundColor: colors.error,
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    cursor: 'pointer',
    fontWeight: 'bold',
    transition: 'all 0.2s',
  },
  error: {
    padding: '20px',
    backgroundColor: '#fee',
    color: '#c33',
    borderRadius: '5px',
    margin: '20px',
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
  modalCancelButton: {
    padding: '12px 30px',
    backgroundColor: '#95a5a6',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    fontSize: '16px',
    cursor: 'pointer',
    fontWeight: 'bold',
  },
  modalConfirmButton: {
    padding: '12px 30px',
    backgroundColor: colors.primary,
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    cursor: 'pointer',
    fontWeight: 'bold',
    transition: 'all 0.2s',
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
    backgroundColor: colors.primary,
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    cursor: 'pointer',
    fontWeight: 'bold',
    transition: 'all 0.2s',
  },
};

// Add hover effects
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  .back-button:hover {
    background-color: ${colors.primary} !important;
    transform: scale(1.02);
  }
  
  .action-button:hover {
    background-color: ${colors.primaryDark} !important;
    transform: scale(1.02);
  }
  
  .cancel-button:hover {
    background-color: ${colors.error} !important;
    transform: scale(1.02);
  }
  
  .modal-confirm-button:hover {
    background-color: ${colors.primaryDark} !important;
    transform: scale(1.02);
  }
  
  .success-button:hover {
    background-color: ${colors.primaryDark} !important;
    transform: scale(1.02);
  }
`;
if (!document.head.querySelector('[data-staff-order-detail-styles]')) {
  styleSheet.setAttribute('data-staff-order-detail-styles', 'true');
  document.head.appendChild(styleSheet);
}

export default OrderDetailPage;
