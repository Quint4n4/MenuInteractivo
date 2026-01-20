import React, { useState, useEffect } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { adminApi } from '../../api/admin';
import Sidebar from '../../components/admin/Sidebar';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

const NewAdminDashboardPage: React.FC = () => {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardStats();
    // Refresh every 30 seconds
    const interval = setInterval(loadDashboardStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboardStats = async () => {
    try {
      const data = await adminApi.getDashboardStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <Sidebar onLogout={logout} userEmail={user?.email} />
        <div style={styles.mainContent}>
          <div style={styles.loading}>Cargando dashboard...</div>
        </div>
      </div>
    );
  }

  // Prepare data for charts
  const orderStatusData = stats?.orders?.by_status ? [
    { name: 'Nuevas', value: stats.orders.by_status.PLACED || 0, color: '#3498db' },
    { name: 'Preparando', value: stats.orders.by_status.PREPARING || 0, color: '#f39c12' },
    { name: 'Listas', value: stats.orders.by_status.READY || 0, color: '#9b59b6' },
    { name: 'Entregadas', value: stats.orders.by_status.DELIVERED || 0, color: '#27ae60' },
    { name: 'Canceladas', value: stats.orders.by_status.CANCELLED || 0, color: '#e74c3c' },
  ] : [];

  const deviceTypeData = stats?.devices?.by_type?.map((item: any) => ({
    name: item.device_type === 'IPAD' ? 'iPad' : item.device_type === 'WEB' ? 'Web' : 'Otro',
    value: item.count,
  })) || [];

  const satisfactionDistData = stats?.satisfaction?.distribution?.map((item: any) => ({
    stars: `${item.satisfaction_rating || item.rating || 0} ⭐`,
    cantidad: item.count || 0,
  })) || [];

  const topProductsData = stats?.products?.top_requested?.map((item: any) => ({
    name: item.product__name?.substring(0, 20) || 'N/A',
    cantidad: item.total_quantity,
  })) || [];

  const COLORS = ['#3498db', '#f39c12', '#9b59b6', '#27ae60', '#e74c3c', '#1abc9c'];

  return (
    <div style={styles.container}>
      <Sidebar onLogout={logout} userEmail={user?.email} />

      <div style={styles.mainContent}>
        <div style={styles.header}>
          <h1 style={styles.pageTitle}>Dashboard de Administración</h1>
          <div style={styles.refreshInfo}>
            Última actualización: {new Date().toLocaleTimeString()}
          </div>
        </div>

        <div style={styles.dashboardGrid}>
          {/* Panel 1: Órdenes en Tiempo Real */}
          <div style={styles.panel}>
            <h3 style={styles.panelTitle}>📋 Órdenes en Tiempo Real</h3>
            <div style={styles.kpiRow}>
              <div style={styles.kpi}>
                <div style={styles.kpiValue}>{stats?.orders?.active_count || 0}</div>
                <div style={styles.kpiLabel}>Órdenes Activas</div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={orderStatusData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#3498db">
                  {orderStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Panel 2: Ocupación de Salas */}
          <div style={styles.panel}>
            <h3 style={styles.panelTitle}>🏥 Ocupación de Salas</h3>
            <div style={styles.kpiRow}>
              <div style={styles.kpi}>
                <div style={styles.kpiValue}>{stats?.rooms?.total_active || 0}</div>
                <div style={styles.kpiLabel}>Salas Ocupadas</div>
              </div>
              <div style={styles.kpi}>
                <div style={styles.kpiValue}>{stats?.rooms?.total_rooms || 0}</div>
                <div style={styles.kpiLabel}>Total Salas</div>
              </div>
            </div>
            <div style={styles.roomsList}>
              {stats?.rooms?.occupied?.slice(0, 5).map((room: any, index: number) => (
                <div key={index} style={styles.roomItem}>
                  <div style={styles.roomCode}>{room.room_code}</div>
                  <div style={styles.roomInfo}>
                    <span>{room.patients?.length || 0} paciente(s)</span>
                    <span style={styles.roomOrders}>
                      {room.order_count > 0 && `${room.order_count} orden(es)`}
                    </span>
                  </div>
                </div>
              ))}
              {(!stats?.rooms?.occupied || stats.rooms.occupied.length === 0) && (
                <div style={styles.emptyMessage}>No hay salas ocupadas</div>
              )}
            </div>
          </div>

          {/* Panel 3: Dispositivos Activos */}
          <div style={styles.panel}>
            <h3 style={styles.panelTitle}>📱 Dispositivos Activos</h3>
            <div style={styles.kpiRow}>
              <div style={styles.kpi}>
                <div style={styles.kpiValue}>{stats?.devices?.active || 0}</div>
                <div style={styles.kpiLabel}>Activos Ahora</div>
              </div>
              <div style={styles.kpi}>
                <div style={styles.kpiValue}>{stats?.devices?.total || 0}</div>
                <div style={styles.kpiLabel}>Total</div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={deviceTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {deviceTypeData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Panel 4: Satisfacción del Cliente */}
          <div style={styles.panel}>
            <h3 style={styles.panelTitle}>⭐ Satisfacción del Cliente</h3>
            <div style={styles.kpiRow}>
              <div style={styles.kpi}>
                <div style={styles.kpiValue}>
                  {stats?.satisfaction?.average 
                    ? typeof stats.satisfaction.average === 'number' 
                      ? stats.satisfaction.average.toFixed(2) 
                      : stats.satisfaction.average 
                    : '0.00'}
                </div>
                <div style={styles.kpiLabel}>Promedio (de 5)</div>
              </div>
              <div style={styles.kpi}>
                <div style={styles.kpiValue}>{stats?.satisfaction?.total_responses || 0}</div>
                <div style={styles.kpiLabel}>Respuestas (7d)</div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={satisfactionDistData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="stars" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="cantidad" fill="#f1c40f" />
              </BarChart>
            </ResponsiveContainer>
            {stats?.satisfaction?.top_staff && stats.satisfaction.top_staff.length > 0 && (
              <div style={styles.topStaffSection}>
                <div style={styles.sectionTitle}>Mejor Personal</div>
                {stats.satisfaction.top_staff.map((staff: any, index: number) => (
                  <div key={index} style={styles.staffItem}>
                    <span>{staff.staff__full_name || 'N/A'}</span>
                    <span style={styles.staffRating}>
                      {staff.avg_rating && typeof staff.avg_rating === 'number' 
                        ? staff.avg_rating.toFixed(1) 
                        : '0.0'} ⭐ ({staff.count || 0})
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Panel 5: Productos Más Solicitados */}
          <div style={styles.panelWide}>
            <h3 style={styles.panelTitle}>🔥 Productos Más Solicitados (últimos 7 días)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topProductsData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={150} />
                <Tooltip />
                <Bar dataKey="cantidad" fill="#3498db" />
              </BarChart>
            </ResponsiveContainer>
            {stats?.products?.low_stock && stats.products.low_stock.length > 0 && (
              <div style={styles.lowStockSection}>
                <div style={styles.alertTitle}>⚠️ Alertas de Inventario Bajo</div>
                <div style={styles.lowStockList}>
                  {stats.products.low_stock.map((item: any, index: number) => (
                    <div key={index} style={styles.lowStockItem}>
                      <span>{item.product__name}</span>
                      <span style={styles.stockLevel}>Existencias: {item.on_hand}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: 'flex',
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
  },
  mainContent: {
    marginLeft: '250px',
    flex: 1,
    padding: '20px',
    overflowY: 'auto',
  },
  header: {
    marginBottom: '20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pageTitle: {
    margin: 0,
    fontSize: '28px',
    color: '#2c3e50',
  },
  refreshInfo: {
    fontSize: '12px',
    color: '#7f8c8d',
  },
  loading: {
    textAlign: 'center',
    padding: '40px',
    fontSize: '18px',
    color: '#666',
  },
  dashboardGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
    gap: '20px',
  },
  panel: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  panelWide: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    gridColumn: '1 / -1',
  },
  panelTitle: {
    margin: 0,
    marginBottom: '15px',
    fontSize: '18px',
    color: '#2c3e50',
    fontWeight: 'bold',
  },
  kpiRow: {
    display: 'flex',
    gap: '15px',
    marginBottom: '20px',
  },
  kpi: {
    flex: 1,
    padding: '15px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    textAlign: 'center',
  },
  kpiValue: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#3498db',
    marginBottom: '5px',
  },
  kpiLabel: {
    fontSize: '12px',
    color: '#7f8c8d',
    textTransform: 'uppercase',
  },
  roomsList: {
    marginTop: '15px',
  },
  roomItem: {
    padding: '10px',
    borderBottom: '1px solid #eee',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  roomCode: {
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  roomInfo: {
    fontSize: '12px',
    color: '#7f8c8d',
    display: 'flex',
    gap: '10px',
  },
  roomOrders: {
    color: '#3498db',
    fontWeight: 'bold',
  },
  emptyMessage: {
    textAlign: 'center',
    padding: '20px',
    color: '#999',
    fontSize: '14px',
  },
  topStaffSection: {
    marginTop: '15px',
    paddingTop: '15px',
    borderTop: '1px solid #eee',
  },
  sectionTitle: {
    fontSize: '14px',
    fontWeight: 'bold',
    marginBottom: '10px',
    color: '#2c3e50',
  },
  staffItem: {
    padding: '8px 0',
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '13px',
  },
  staffRating: {
    fontWeight: 'bold',
    color: '#f1c40f',
  },
  lowStockSection: {
    marginTop: '20px',
    padding: '15px',
    backgroundColor: '#fff3cd',
    borderRadius: '8px',
    border: '1px solid #ffc107',
  },
  alertTitle: {
    fontSize: '14px',
    fontWeight: 'bold',
    marginBottom: '10px',
    color: '#856404',
  },
  lowStockList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  lowStockItem: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '13px',
    color: '#856404',
  },
  stockLevel: {
    fontWeight: 'bold',
  },
};

export default NewAdminDashboardPage;
