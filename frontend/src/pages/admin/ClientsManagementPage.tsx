import React, { useState, useEffect } from 'react';
import { adminApi } from '../../api/admin';
import { colors } from '../../styles/colors';
import { useAuth } from '../../auth/AuthContext';
import Sidebar from '../../components/admin/Sidebar';

interface Patient {
  id: number;
  full_name: string;
  phone_e164: string;
  email?: string;
  is_active: boolean;
  total_orders: number;
  total_feedbacks: number;
  assignments_count: number;
  last_visit?: string;
  created_at: string;
  updated_at: string;
}

interface PatientDetails {
  patient: Patient;
  statistics: {
    total_orders: number;
    total_feedbacks: number;
    total_assignments: number;
    avg_staff_rating: number;
    avg_stay_rating: number;
  };
  orders: any[];
  feedbacks: any[];
  assignments: any[];
}

const ClientsManagementPage: React.FC = () => {
  const { user, logout } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState<PatientDetails | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all');

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getPatients();
      const patientsArray = response.results || (Array.isArray(response) ? response : []);
      setPatients(patientsArray);
    } catch (err) {
      console.error('Failed to load patients:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadPatientDetails = async (patientId: number) => {
    try {
      setLoadingDetails(true);
      const details = await adminApi.getPatientDetails(patientId);
      setSelectedPatient(details);
      setShowDetailModal(true);
    } catch (err) {
      console.error('Failed to load patient details:', err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const filteredPatients = patients.filter((patient) => {
    const matchesSearch = 
      patient.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.phone_e164.includes(searchTerm) ||
      (patient.email && patient.email.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesFilter = 
      activeFilter === 'all' ||
      (activeFilter === 'active' && patient.is_active) ||
      (activeFilter === 'inactive' && !patient.is_active);
    
    return matchesSearch && matchesFilter;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div style={styles.pageContainer}>
        <Sidebar onLogout={logout} userEmail={user?.email} />
        <div style={styles.mainContent}>
          <div style={styles.loadingContainer}>
            <div style={styles.spinner}></div>
            <p>Cargando clientes...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.pageContainer}>
      <Sidebar onLogout={logout} userEmail={user?.email} />
      <div style={styles.mainContent}>
        <div style={styles.header}>
          <h1 style={styles.title}>Gestión de Clientes</h1>
          <p style={styles.subtitle}>
            Total de clientes: {patients.length} | Mostrando: {filteredPatients.length}
          </p>
        </div>

        <div style={styles.toolbar}>
          <div style={styles.searchContainer}>
            <input
              type="text"
              placeholder="Buscar por nombre, teléfono o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={styles.searchInput}
            />
          </div>

          <div style={styles.filterButtons}>
            <button
              onClick={() => setActiveFilter('all')}
              style={{
                ...styles.filterButton,
                ...(activeFilter === 'all' ? styles.filterButtonActive : {}),
              }}
            >
              Todos
            </button>
            <button
              onClick={() => setActiveFilter('active')}
              style={{
                ...styles.filterButton,
                ...(activeFilter === 'active' ? styles.filterButtonActive : {}),
              }}
            >
              Activos
            </button>
            <button
              onClick={() => setActiveFilter('inactive')}
              style={{
                ...styles.filterButton,
                ...(activeFilter === 'inactive' ? styles.filterButtonActive : {}),
              }}
            >
              Inactivos
            </button>
          </div>
        </div>

        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.tableHeader}>
                <th style={styles.th}>Nombre</th>
                <th style={styles.th}>Teléfono</th>
                <th style={styles.th}>Email</th>
                <th style={styles.th}>Órdenes</th>
                <th style={styles.th}>Feedbacks</th>
                <th style={styles.th}>Última Visita</th>
                <th style={styles.th}>Estado</th>
                <th style={styles.th}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredPatients.map((patient) => (
                <tr key={patient.id} style={styles.tableRow}>
                  <td style={styles.td}>{patient.full_name}</td>
                  <td style={styles.td}>{patient.phone_e164}</td>
                  <td style={styles.td}>{patient.email || 'N/A'}</td>
                  <td style={styles.td}>
                    <span style={styles.badge}>{patient.total_orders}</span>
                  </td>
                  <td style={styles.td}>
                    <span style={styles.badge}>{patient.total_feedbacks}</span>
                  </td>
                  <td style={styles.td}>
                    {patient.last_visit ? formatDate(patient.last_visit) : 'N/A'}
                  </td>
                  <td style={styles.td}>
                    <span
                      style={{
                        ...styles.statusBadge,
                        ...(patient.is_active
                          ? styles.statusActive
                          : styles.statusInactive),
                      }}
                    >
                      {patient.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <button
                      onClick={() => loadPatientDetails(patient.id)}
                      style={styles.detailButton}
                    >
                      Ver Detalles
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredPatients.length === 0 && (
            <div style={styles.emptyState}>
              <p>No se encontraron clientes</p>
            </div>
          )}
        </div>

        {/* Detail Modal */}
        {showDetailModal && selectedPatient && (
          <div style={styles.modalOverlay} onClick={() => setShowDetailModal(false)}>
            <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <div style={styles.modalHeader}>
                <h2 style={styles.modalTitle}>
                  Detalles del Cliente: {selectedPatient.patient.full_name}
                </h2>
                <button
                  onClick={() => setShowDetailModal(false)}
                  style={styles.closeButton}
                >
                  ✕
                </button>
              </div>

              <div style={styles.modalBody}>
                {/* Statistics Section */}
                <div style={styles.statsGrid}>
                  <div style={styles.statCard}>
                    <div style={styles.statLabel}>Total Órdenes</div>
                    <div style={styles.statValue}>
                      {selectedPatient.statistics.total_orders}
                    </div>
                  </div>
                  <div style={styles.statCard}>
                    <div style={styles.statLabel}>Total Feedbacks</div>
                    <div style={styles.statValue}>
                      {selectedPatient.statistics.total_feedbacks}
                    </div>
                  </div>
                  <div style={styles.statCard}>
                    <div style={styles.statLabel}>Asignaciones</div>
                    <div style={styles.statValue}>
                      {selectedPatient.statistics.total_assignments}
                    </div>
                  </div>
                  <div style={styles.statCard}>
                    <div style={styles.statLabel}>Calificación Personal</div>
                    <div style={styles.statValue}>
                      ⭐ {selectedPatient.statistics.avg_staff_rating.toFixed(1)}/5
                    </div>
                  </div>
                  <div style={styles.statCard}>
                    <div style={styles.statLabel}>Calificación Estancia</div>
                    <div style={styles.statValue}>
                      ⭐ {selectedPatient.statistics.avg_stay_rating.toFixed(1)}/5
                    </div>
                  </div>
                </div>

                {/* Recent Orders */}
                <div style={styles.section}>
                  <h3 style={styles.sectionTitle}>Últimas Órdenes</h3>
                  {selectedPatient.orders.length > 0 ? (
                    <div style={styles.listContainer}>
                      {selectedPatient.orders.map((order) => (
                        <div key={order.id} style={styles.listItem}>
                          <div>
                            <strong>Orden #{order.id}</strong>
                            <span style={{ marginLeft: '10px', fontSize: '12px' }}>
                              {formatDate(order.placed_at)}
                            </span>
                          </div>
                          <div style={{ fontSize: '12px', marginTop: '5px' }}>
                            {order.items.length} producto(s) - Estado: {order.status_display}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={styles.emptyText}>No hay órdenes registradas</p>
                  )}
                </div>

                {/* Recent Feedbacks */}
                <div style={styles.section}>
                  <h3 style={styles.sectionTitle}>Últimos Feedbacks</h3>
                  {selectedPatient.feedbacks.length > 0 ? (
                    <div style={styles.listContainer}>
                      {selectedPatient.feedbacks.map((feedback) => (
                        <div key={feedback.id} style={styles.listItem}>
                          <div>
                            <strong>Feedback #{feedback.id}</strong>
                            <span style={{ marginLeft: '10px', fontSize: '12px' }}>
                              {formatDate(feedback.created_at)}
                            </span>
                          </div>
                          <div style={{ fontSize: '12px', marginTop: '5px' }}>
                            Personal: ⭐ {feedback.staff_rating}/5 | Estancia: ⭐{' '}
                            {feedback.stay_rating}/5
                          </div>
                          {feedback.comment && (
                            <div
                              style={{
                                fontSize: '12px',
                                marginTop: '5px',
                                fontStyle: 'italic',
                              }}
                            >
                              "{feedback.comment}"
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={styles.emptyText}>No hay feedbacks registrados</p>
                  )}
                </div>

                {/* Recent Assignments */}
                <div style={styles.section}>
                  <h3 style={styles.sectionTitle}>Últimas Asignaciones</h3>
                  {selectedPatient.assignments.length > 0 ? (
                    <div style={styles.listContainer}>
                      {selectedPatient.assignments.map((assignment) => (
                        <div key={assignment.id} style={styles.listItem}>
                          <div>
                            <strong>
                              Habitación: {assignment.room_details?.code || 'N/A'}
                            </strong>
                            <span style={{ marginLeft: '10px', fontSize: '12px' }}>
                              {formatDate(assignment.started_at)}
                            </span>
                          </div>
                          <div style={{ fontSize: '12px', marginTop: '5px' }}>
                            Enfermera: {assignment.staff_details?.full_name || 'N/A'} |
                            Estado: {assignment.is_active ? 'Activa' : 'Finalizada'}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={styles.emptyText}>No hay asignaciones registradas</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  pageContainer: {
    display: 'flex',
    minHeight: '100vh',
    backgroundColor: colors.ivory,
  },
  mainContent: {
    marginLeft: '250px',
    flex: 1,
    padding: '30px',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
  },
  spinner: {
    border: '4px solid rgba(0, 0, 0, 0.1)',
    borderLeft: `4px solid ${colors.primary}`,
    borderRadius: '50%',
    width: '40px',
    height: '40px',
    animation: 'spin 1s linear infinite',
  },
  header: {
    marginBottom: '30px',
  },
  title: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: '10px',
  },
  subtitle: {
    fontSize: '14px',
    color: colors.textSecondary,
  },
  toolbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    gap: '15px',
  },
  searchContainer: {
    flex: 1,
  },
  searchInput: {
    width: '100%',
    padding: '12px',
    fontSize: '14px',
    border: `1px solid ${colors.border}`,
    borderRadius: '8px',
    outline: 'none',
  },
  filterButtons: {
    display: 'flex',
    gap: '10px',
  },
  filterButton: {
    padding: '10px 20px',
    fontSize: '14px',
    border: `1px solid ${colors.border}`,
    borderRadius: '8px',
    backgroundColor: 'white',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
    color: 'white',
    borderColor: colors.primary,
  },
  tableContainer: {
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    overflow: 'hidden',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  tableHeader: {
    backgroundColor: colors.cream,
  },
  th: {
    padding: '15px',
    textAlign: 'left',
    fontSize: '14px',
    fontWeight: '600',
    color: colors.textPrimary,
    borderBottom: `2px solid ${colors.border}`,
  },
  tableRow: {
    borderBottom: `1px solid ${colors.border}`,
    transition: 'background-color 0.2s',
  },
  td: {
    padding: '15px',
    fontSize: '14px',
    color: colors.textSecondary,
  },
  badge: {
    backgroundColor: colors.cream,
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '600',
    color: colors.primary,
  },
  statusBadge: {
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '600',
  },
  statusActive: {
    backgroundColor: '#d4edda',
    color: '#155724',
  },
  statusInactive: {
    backgroundColor: '#f8d7da',
    color: '#721c24',
  },
  detailButton: {
    padding: '8px 16px',
    fontSize: '12px',
    backgroundColor: colors.primary,
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  emptyState: {
    padding: '40px',
    textAlign: 'center',
    color: colors.textSecondary,
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: '12px',
    width: '90%',
    maxWidth: '900px',
    maxHeight: '90vh',
    overflow: 'auto',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 30px',
    borderBottom: `1px solid ${colors.border}`,
  },
  modalTitle: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: colors.textSecondary,
  },
  modalBody: {
    padding: '30px',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '15px',
    marginBottom: '30px',
  },
  statCard: {
    backgroundColor: colors.cream,
    padding: '20px',
    borderRadius: '8px',
    textAlign: 'center',
  },
  statLabel: {
    fontSize: '12px',
    color: colors.textSecondary,
    marginBottom: '8px',
  },
  statValue: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: colors.primary,
  },
  section: {
    marginBottom: '30px',
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: '15px',
  },
  listContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  listItem: {
    padding: '15px',
    backgroundColor: colors.cream,
    borderRadius: '8px',
  },
  emptyText: {
    fontSize: '14px',
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
};

export default ClientsManagementPage;
