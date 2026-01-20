import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../../api/admin';
import { useAuth } from '../../auth/AuthContext';

const FeedbackPage: React.FC = () => {
  const { logout } = useAuth();
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedFeedback, setSelectedFeedback] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Filters
  const [filters, setFilters] = useState({
    rating: '',
    staff: '',
    room: '',
    date_from: '',
    date_to: '',
  });

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Build params object
      const params: any = {};
      if (filters.rating) params.rating = filters.rating;
      if (filters.staff) params.staff = filters.staff;
      if (filters.room) params.room = filters.room;
      if (filters.date_from) params.date_from = filters.date_from;
      if (filters.date_to) params.date_to = filters.date_to;

      const [feedbacksData, statsData] = await Promise.all([
        adminApi.getFeedbacks(params),
        adminApi.getFeedbackStats(),
      ]);

      setFeedbacks(Array.isArray(feedbacksData) ? feedbacksData : feedbacksData.results || []);
      setStats(statsData);
    } catch (err) {
      console.error('Failed to load feedback data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = (feedback: any) => {
    setSelectedFeedback(feedback);
    setShowDetailModal(true);
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} style={{ color: i < rating ? '#f1c40f' : '#ddd', fontSize: '20px' }}>
        ★
      </span>
    ));
  };

  const clearFilters = () => {
    setFilters({
      rating: '',
      staff: '',
      room: '',
      date_from: '',
      date_to: '',
    });
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div>
          <Link to="/admin/dashboard" style={styles.backLink}>← Volver al Panel</Link>
          <h1>Satisfacción del Cliente y Retroalimentación</h1>
        </div>
        <button onClick={() => logout()} style={styles.logoutButton}>
          Cerrar Sesión
        </button>
      </header>

      <div style={styles.content}>
        {/* Statistics Cards */}
        {stats && (
          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <div style={styles.statIcon}>📊</div>
              <div style={styles.statValue}>{stats.total_feedbacks}</div>
              <div style={styles.statLabel}>Retroalimentaciones Totales</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statIcon}>⭐</div>
              <div style={styles.statValue}>
                {stats.average_rating && typeof stats.average_rating === 'number' 
                  ? stats.average_rating.toFixed(1) 
                  : '0.0'}/5
              </div>
              <div style={styles.statLabel}>Calificación Promedio</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statIcon}>📅</div>
              <div style={styles.statValue}>{stats.today_feedbacks || 0}</div>
              <div style={styles.statLabel}>Retroalimentaciones de Hoy</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statIcon}>📈</div>
              <div style={styles.statValue}>
                {stats.response_rate && typeof stats.response_rate === 'number' 
                  ? stats.response_rate.toFixed(1) 
                  : '0.0'}%
              </div>
              <div style={styles.statLabel}>Tasa de Respuesta</div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div style={styles.filtersCard}>
          <h3 style={styles.filtersTitle}>Filtros</h3>
          <div style={styles.filtersGrid}>
            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>Calificación</label>
              <select
                value={filters.rating}
                onChange={(e) => setFilters({ ...filters, rating: e.target.value })}
                style={styles.filterSelect}
              >
                <option value="">Todas las Calificaciones</option>
                <option value="5">5 Estrellas</option>
                <option value="4">4 Estrellas</option>
                <option value="3">3 Estrellas</option>
                <option value="2">2 Estrellas</option>
                <option value="1">1 Estrella</option>
              </select>
            </div>

            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>Fecha Desde</label>
              <input
                type="date"
                value={filters.date_from}
                onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
                style={styles.filterInput}
              />
            </div>

            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>Fecha Hasta</label>
              <input
                type="date"
                value={filters.date_to}
                onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
                style={styles.filterInput}
              />
            </div>

            <div style={styles.filterGroup}>
              <button onClick={clearFilters} style={styles.clearButton}>
                Limpiar Filtros
              </button>
            </div>
          </div>
        </div>

        {/* Feedbacks Table */}
        <div style={styles.tableCard}>
          <h3 style={styles.tableTitle}>Lista de Retroalimentación ({feedbacks.length})</h3>

          {loading ? (
            <div style={styles.loading}>Cargando retroalimentaciones...</div>
          ) : feedbacks.length === 0 ? (
            <div style={styles.empty}>No se encontraron retroalimentaciones</div>
          ) : (
            <div style={styles.tableContainer}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>ID de Asignación</th>
                    <th style={styles.th}>Fecha</th>
                    <th style={styles.th}>Paciente</th>
                    <th style={styles.th}>Enfermera/Personal</th>
                    <th style={styles.th}>Habitación</th>
                    <th style={styles.th}>Calificación Personal</th>
                    <th style={styles.th}>Calificación Estancia</th>
                    <th style={styles.th}>Comentario</th>
                    <th style={styles.th}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {feedbacks.map((feedback) => (
                    <tr key={feedback.id} style={styles.tr}>
                      <td style={styles.td}>#{feedback.patient_assignment_id || feedback.patient_assignment || 'N/A'}</td>
                      <td style={styles.td}>
                        {new Date(feedback.created_at).toLocaleDateString()}
                      </td>
                      <td style={styles.td}>{feedback.patient_name || 'N/A'}</td>
                      <td style={styles.td}>{feedback.staff_name || 'N/A'}</td>
                      <td style={styles.td}>{feedback.room_code || 'N/A'}</td>
                      <td style={styles.td}>{renderStars(feedback.staff_rating || 0)}</td>
                      <td style={styles.td}>{renderStars(feedback.stay_rating || 0)}</td>
                      <td style={styles.td}>
                        {feedback.comment ? (
                          <span style={styles.hasComment}>💬</span>
                        ) : (
                          <span style={styles.noComment}>-</span>
                        )}
                      </td>
                      <td style={styles.td}>
                        <button
                          onClick={() => handleViewDetail(feedback)}
                          style={styles.viewButton}
                        >
                          Ver
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedFeedback && (
        <div style={styles.modalOverlay} onClick={() => setShowDetailModal(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>Detalles de Retroalimentación</h2>

            <div style={styles.detailSection}>
              <div style={styles.detailRow}>
                <strong>ID de Asignación:</strong> #{selectedFeedback.patient_assignment_id || selectedFeedback.patient_assignment || 'N/A'}
              </div>
              <div style={styles.detailRow}>
                <strong>Fecha:</strong> {new Date(selectedFeedback.created_at).toLocaleString()}
              </div>
              <div style={styles.detailRow}>
                <strong>Paciente:</strong> {selectedFeedback.patient_name || 'N/A'}
              </div>
              <div style={styles.detailRow}>
                <strong>Enfermera/Personal:</strong> {selectedFeedback.staff_name || 'N/A'}
              </div>
              {selectedFeedback.staff_email && (
                <div style={styles.detailRow}>
                  <strong>Correo del Personal:</strong> {selectedFeedback.staff_email}
                </div>
              )}
              <div style={styles.detailRow}>
                <strong>Habitación:</strong> {selectedFeedback.room_code || 'N/A'}
              </div>
              <div style={styles.detailRow}>
                <strong>Calificación del Personal:</strong> {renderStars(selectedFeedback.staff_rating || 0)}
                <span style={{ marginLeft: '10px', fontSize: '18px', fontWeight: 'bold' }}>
                  {selectedFeedback.staff_rating || 0}/5
                </span>
              </div>
              <div style={styles.detailRow}>
                <strong>Calificación de Estancia:</strong> {renderStars(selectedFeedback.stay_rating || 0)}
                <span style={{ marginLeft: '10px', fontSize: '18px', fontWeight: 'bold' }}>
                  {selectedFeedback.stay_rating || 0}/5
                </span>
              </div>
              {selectedFeedback.product_ratings && Object.keys(selectedFeedback.product_ratings).length > 0 && (
                <div style={styles.detailRow}>
                  <strong>Calificaciones de Productos:</strong>
                  <div style={{ marginTop: '10px', paddingLeft: '20px' }}>
                    {Object.entries(selectedFeedback.product_ratings).map(([orderId, products]: [string, any]) => (
                      <div key={orderId} style={{ marginBottom: '10px' }}>
                        <strong>Orden #{orderId}:</strong>
                        {Object.entries(products).map(([productId, rating]: [string, any]) => (
                          <div key={productId} style={{ marginLeft: '20px', fontSize: '14px' }}>
                            Producto #{productId}: {renderStars(rating)} ({rating}/5)
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {selectedFeedback.comment && (
              <div style={styles.commentSection}>
                <strong>Comentario:</strong>
                <div style={styles.commentBox}>{selectedFeedback.comment}</div>
              </div>
            )}

            <button
              style={styles.closeButton}
              onClick={() => setShowDetailModal(false)}
            >
              Cerrar
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
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
    marginBottom: '30px',
  },
  statCard: {
    backgroundColor: 'white',
    padding: '30px',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    textAlign: 'center',
  },
  statIcon: {
    fontSize: '48px',
    marginBottom: '15px',
  },
  statValue: {
    fontSize: '36px',
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: '10px',
  },
  statLabel: {
    fontSize: '14px',
    color: '#7f8c8d',
    textTransform: 'uppercase',
    letterSpacing: '1px',
  },
  filtersCard: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    marginBottom: '30px',
  },
  filtersTitle: {
    marginBottom: '20px',
    color: '#2c3e50',
  },
  filtersGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '15px',
  },
  filterGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  filterLabel: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#555',
  },
  filterSelect: {
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '5px',
    fontSize: '14px',
  },
  filterInput: {
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '5px',
    fontSize: '14px',
  },
  clearButton: {
    padding: '10px 20px',
    backgroundColor: '#95a5a6',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    marginTop: '24px',
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
  hasComment: {
    fontSize: '20px',
    cursor: 'pointer',
  },
  noComment: {
    color: '#ddd',
  },
  viewButton: {
    padding: '6px 16px',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
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
    maxWidth: '600px',
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
  detailSection: {
    marginBottom: '20px',
  },
  detailRow: {
    padding: '10px 0',
    borderBottom: '1px solid #eee',
    fontSize: '16px',
  },
  commentSection: {
    marginTop: '20px',
    marginBottom: '20px',
  },
  commentBox: {
    marginTop: '10px',
    padding: '15px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    border: '1px solid #ddd',
    fontSize: '14px',
    lineHeight: '1.6',
    whiteSpace: 'pre-wrap',
  },
  closeButton: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    fontSize: '16px',
    cursor: 'pointer',
    fontWeight: 'bold',
  },
};

export default FeedbackPage;
