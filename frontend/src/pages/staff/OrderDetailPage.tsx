import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ordersApi } from '../../api/orders';

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
        message: response.message,
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
            message: response.message,
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
        <button onClick={() => navigate('/staff/orders')} style={styles.backButton}>
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
                    {event.from_status || 'NUEVO'} → {event.to_status}
                  </div>
                  <div style={styles.timelineTime}>
                    {new Date(event.changed_at).toLocaleString('es-MX')}
                  </div>
                  {event.changed_by_email && (
                    <div style={styles.timelineUser}>Por: {event.changed_by_email}</div>
                  )}
                  {event.note && <div style={styles.timelineNote}>{event.note}</div>}
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
            >
              {action.label}
            </button>
          ))}
          {canCancel && (
            <button onClick={handleCancel} style={styles.cancelButton}>
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
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#2c3e50',
    color: 'white',
    padding: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
  },
  backButton: {
    padding: '10px 20px',
    backgroundColor: '#34495e',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
  },
  content: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
  },
  section: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    marginBottom: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
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
    borderLeft: '3px solid #3498db',
    marginBottom: '15px',
    backgroundColor: '#f8f9fa',
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
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    fontSize: '16px',
    cursor: 'pointer',
    fontWeight: 'bold',
  },
  cancelButton: {
    padding: '12px 30px',
    backgroundColor: '#e74c3c',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    fontSize: '16px',
    cursor: 'pointer',
    fontWeight: 'bold',
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

export default OrderDetailPage;
