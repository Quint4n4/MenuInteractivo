import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../../api/admin';
import { useAuth } from '../../auth/AuthContext';

const InventoryPage: React.FC = () => {
  const { logout } = useAuth();
  const [balances, setBalances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedBalance, setSelectedBalance] = useState<any>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Form states
  const [receiveQuantity, setReceiveQuantity] = useState('');
  const [receiveNote, setReceiveNote] = useState('');
  const [adjustDelta, setAdjustDelta] = useState('');
  const [adjustNote, setAdjustNote] = useState('');

  useEffect(() => {
    loadBalances();
  }, []);

  const loadBalances = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getInventoryBalances();
      setBalances(Array.isArray(data) ? data : data.results || []);
    } catch (err) {
      console.error('Failed to load inventory balances:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReceiveStock = async () => {
    if (!selectedBalance || !receiveQuantity) return;

    try {
      const data: any = {
        product_id: selectedBalance.product,
        quantity: parseInt(receiveQuantity),
      };

      if (receiveNote && receiveNote.trim()) {
        data.note = receiveNote;
      }

      console.log('Sending data to API:', data);
      await adminApi.receiveStock(data);

      setShowReceiveModal(false);
      setSelectedBalance(null);
      setReceiveQuantity('');
      setReceiveNote('');
      loadBalances();
      setSuccessMessage(`Stock recibido exitosamente. Se agregaron ${receiveQuantity} unidades.`);
      setShowSuccessModal(true);
    } catch (err: any) {
      console.error('Failed to receive stock:', err);
      console.error('Error response:', err.response?.data);
      const errorData = err.response?.data;
      let errorMsg = 'Error al recibir stock';

      if (errorData) {
        if (errorData.error) {
          errorMsg = errorData.error;
        } else if (errorData.product_id) {
          errorMsg = Array.isArray(errorData.product_id) ? errorData.product_id[0] : errorData.product_id;
        } else if (errorData.quantity) {
          errorMsg = Array.isArray(errorData.quantity) ? errorData.quantity[0] : errorData.quantity;
        } else if (errorData.note) {
          errorMsg = Array.isArray(errorData.note) ? errorData.note[0] : errorData.note;
        } else {
          errorMsg = JSON.stringify(errorData);
        }
      }

      alert(errorMsg);
    }
  };

  const handleAdjustStock = async () => {
    if (!selectedBalance || !adjustDelta) return;

    try {
      const data: any = {
        product_id: selectedBalance.product,
        delta: parseInt(adjustDelta),
      };

      if (adjustNote && adjustNote.trim()) {
        data.note = adjustNote;
      }

      await adminApi.adjustStock(data);

      setShowAdjustModal(false);
      setSelectedBalance(null);
      const deltaValue = parseInt(adjustDelta);
      setAdjustDelta('');
      setAdjustNote('');
      loadBalances();
      setSuccessMessage(`Inventario ajustado exitosamente. Cambio: ${deltaValue > 0 ? '+' : ''}${deltaValue} unidades.`);
      setShowSuccessModal(true);
    } catch (err: any) {
      console.error('Failed to adjust stock:', err);
      const errorMsg = err.response?.data?.error || err.response?.data?.product_id?.[0] || err.response?.data?.delta?.[0] || 'Error al ajustar inventario';
      alert(errorMsg);
    }
  };

  const openReceiveModal = (balance: any) => {
    setSelectedBalance(balance);
    setShowReceiveModal(true);
  };

  const openAdjustModal = (balance: any) => {
    setSelectedBalance(balance);
    setShowAdjustModal(true);
  };

  const getStockStatus = (balance: any) => {
    const available = balance.available || 0;
    const reorderLevel = balance.reorder_level || 0;

    if (available === 0) {
      return { text: 'Sin stock', color: '#e74c3c' };
    } else if (available <= reorderLevel) {
      return { text: 'Stock bajo', color: '#f39c12' };
    } else {
      return { text: 'Stock normal', color: '#27ae60' };
    }
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div>
          <Link to="/admin/dashboard" style={styles.backLink}>← Volver al Panel</Link>
          <h1>Gestión de Inventario</h1>
        </div>
        <button onClick={() => logout()} style={styles.logoutButton}>
          Cerrar Sesión
        </button>
      </header>

      <div style={styles.content}>
        <div style={styles.tableCard}>
          <h3 style={styles.tableTitle}>Inventario de Productos</h3>

          {loading ? (
            <div style={styles.loading}>Cargando inventario...</div>
          ) : balances.length === 0 ? (
            <div style={styles.empty}>No hay productos en inventario</div>
          ) : (
            <div style={styles.tableContainer}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Producto</th>
                    <th style={styles.th}>Categoría</th>
                    <th style={styles.th}>En Stock</th>
                    <th style={styles.th}>Reservado</th>
                    <th style={styles.th}>Disponible</th>
                    <th style={styles.th}>Nivel de Reorden</th>
                    <th style={styles.th}>Estado</th>
                    <th style={styles.th}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {balances.map((balance) => {
                    const status = getStockStatus(balance);
                    return (
                      <tr key={balance.id} style={styles.tr}>
                        <td style={styles.td}>
                          <div style={styles.productName}>{balance.product_name}</div>
                          <div style={styles.productSku}>SKU: {balance.product_sku}</div>
                        </td>
                        <td style={styles.td}>{balance.product_category || 'N/A'}</td>
                        <td style={styles.td}>
                          <strong>{balance.on_hand || 0}</strong>
                        </td>
                        <td style={styles.td}>{balance.reserved || 0}</td>
                        <td style={styles.td}>
                          <strong style={{ color: status.color }}>
                            {balance.available || 0}
                          </strong>
                        </td>
                        <td style={styles.td}>{balance.reorder_level || 0}</td>
                        <td style={styles.td}>
                          <span style={{ ...styles.statusBadge, backgroundColor: status.color }}>
                            {status.text}
                          </span>
                        </td>
                        <td style={styles.td}>
                          <div style={styles.actionButtons}>
                            <button
                              onClick={() => openReceiveModal(balance)}
                              style={styles.receiveButton}
                              title="Recibir stock"
                            >
                              + Recibir
                            </button>
                            <button
                              onClick={() => openAdjustModal(balance)}
                              style={styles.adjustButton}
                              title="Ajustar inventario"
                            >
                              ⚙ Ajustar
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Receive Stock Modal */}
      {showReceiveModal && selectedBalance && (
        <div style={styles.modalOverlay} onClick={() => setShowReceiveModal(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>Recibir Stock</h2>

            <div style={styles.modalInfo}>
              <strong>Producto:</strong> {selectedBalance.product_name}
            </div>
            <div style={styles.modalInfo}>
              <strong>Stock actual:</strong> {selectedBalance.on_hand || 0}
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Cantidad a Recibir *</label>
              <input
                type="number"
                min="1"
                value={receiveQuantity}
                onChange={(e) => setReceiveQuantity(e.target.value)}
                style={styles.input}
                placeholder="Ej: 50"
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Nota (Opcional)</label>
              <textarea
                value={receiveNote}
                onChange={(e) => setReceiveNote(e.target.value)}
                style={styles.textarea}
                placeholder="Ej: Recepción de proveedor ABC, factura #12345"
                rows={3}
              />
            </div>

            <div style={styles.modalButtons}>
              <button
                onClick={handleReceiveStock}
                style={styles.submitButton}
                disabled={!receiveQuantity || parseInt(receiveQuantity) <= 0}
              >
                Recibir Productos
              </button>
              <button
                onClick={() => {
                  setShowReceiveModal(false);
                  setSelectedBalance(null);
                  setReceiveQuantity('');
                  setReceiveNote('');
                }}
                style={styles.cancelButton}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Adjust Stock Modal */}
      {showAdjustModal && selectedBalance && (
        <div style={styles.modalOverlay} onClick={() => setShowAdjustModal(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>Ajustar Inventario</h2>

            <div style={styles.modalInfo}>
              <strong>Producto:</strong> {selectedBalance.product_name}
            </div>
            <div style={styles.modalInfo}>
              <strong>Stock actual:</strong> {selectedBalance.on_hand || 0}
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Ajuste (+ o -) *</label>
              <input
                type="number"
                value={adjustDelta}
                onChange={(e) => setAdjustDelta(e.target.value)}
                style={styles.input}
                placeholder="Ej: -5 para reducir, +10 para aumentar"
              />
              <small style={styles.helpText}>
                Ingresa un número positivo para aumentar o negativo para reducir
              </small>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Motivo del Ajuste</label>
              <textarea
                value={adjustNote}
                onChange={(e) => setAdjustNote(e.target.value)}
                style={styles.textarea}
                placeholder="Ej: Producto dañado, corrección de inventario, desperdicio"
                rows={3}
              />
            </div>

            <div style={styles.modalButtons}>
              <button
                onClick={handleAdjustStock}
                style={styles.submitButton}
                disabled={!adjustDelta || parseInt(adjustDelta) === 0}
              >
                Ajustar Inventario
              </button>
              <button
                onClick={() => {
                  setShowAdjustModal(false);
                  setSelectedBalance(null);
                  setAdjustDelta('');
                  setAdjustNote('');
                }}
                style={styles.cancelButton}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div style={styles.modalOverlay} onClick={() => setShowSuccessModal(false)}>
          <div style={styles.successModalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.successIcon}>✓</div>
            <h2 style={styles.successTitle}>Operación Exitosa</h2>
            <p style={styles.successMessage}>{successMessage}</p>
            <button
              onClick={() => setShowSuccessModal(false)}
              style={styles.successButton}
            >
              Aceptar
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
    backgroundColor: '#1a1a2e',
    color: 'white',
    padding: '20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backLink: {
    color: '#3498db',
    textDecoration: 'none',
    fontSize: '14px',
    display: 'block',
    marginBottom: '10px',
  },
  logoutButton: {
    padding: '10px 20px',
    backgroundColor: '#e74c3c',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
  },
  content: {
    padding: '20px',
  },
  tableCard: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  tableTitle: {
    marginBottom: '20px',
    color: '#2c3e50',
  },
  loading: {
    textAlign: 'center',
    padding: '40px',
    fontSize: '18px',
    color: '#666',
  },
  empty: {
    textAlign: 'center',
    padding: '40px',
    fontSize: '16px',
    color: '#999',
  },
  tableContainer: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    padding: '12px',
    textAlign: 'left',
    borderBottom: '2px solid #ddd',
    backgroundColor: '#f8f9fa',
    fontWeight: 'bold',
    fontSize: '14px',
  },
  tr: {
    borderBottom: '1px solid #eee',
  },
  td: {
    padding: '12px',
    fontSize: '14px',
  },
  productName: {
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  productSku: {
    fontSize: '12px',
    color: '#7f8c8d',
    marginTop: '4px',
  },
  statusBadge: {
    padding: '4px 12px',
    borderRadius: '12px',
    color: 'white',
    fontSize: '12px',
    fontWeight: 'bold',
    display: 'inline-block',
  },
  actionButtons: {
    display: 'flex',
    gap: '8px',
  },
  receiveButton: {
    padding: '6px 12px',
    backgroundColor: '#27ae60',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '13px',
  },
  adjustButton: {
    padding: '6px 12px',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '13px',
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
    padding: '30px',
    borderRadius: '12px',
    maxWidth: '500px',
    width: '90%',
    maxHeight: '80vh',
    overflow: 'auto',
  },
  modalTitle: {
    fontSize: '24px',
    color: '#2c3e50',
    marginBottom: '20px',
    borderBottom: '2px solid #3498db',
    paddingBottom: '10px',
  },
  modalInfo: {
    padding: '10px 0',
    fontSize: '16px',
    color: '#555',
  },
  formGroup: {
    marginTop: '20px',
    marginBottom: '20px',
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: '8px',
  },
  input: {
    width: '100%',
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '5px',
    fontSize: '14px',
    boxSizing: 'border-box',
  },
  textarea: {
    width: '100%',
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '5px',
    fontSize: '14px',
    boxSizing: 'border-box',
    resize: 'vertical',
  },
  helpText: {
    display: 'block',
    fontSize: '12px',
    color: '#7f8c8d',
    marginTop: '5px',
  },
  modalButtons: {
    display: 'flex',
    gap: '10px',
    marginTop: '20px',
  },
  submitButton: {
    flex: 1,
    padding: '12px',
    backgroundColor: '#27ae60',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    fontSize: '16px',
    cursor: 'pointer',
    fontWeight: 'bold',
  },
  cancelButton: {
    flex: 1,
    padding: '12px',
    backgroundColor: '#95a5a6',
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
    maxWidth: '400px',
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
    fontWeight: 'bold',
  },
  successTitle: {
    fontSize: '24px',
    color: '#2c3e50',
    marginBottom: '15px',
  },
  successMessage: {
    fontSize: '16px',
    color: '#555',
    marginBottom: '25px',
    lineHeight: '1.5',
  },
  successButton: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#27ae60',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    fontSize: '16px',
    cursor: 'pointer',
    fontWeight: 'bold',
  },
};

export default InventoryPage;
