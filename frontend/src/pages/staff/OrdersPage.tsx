import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ordersApi } from '../../api/orders';
import { useAuth } from '../../auth/AuthContext';
import { useWebSocket } from '../../hooks/useWebSocket';
import { colors } from '../../styles/colors';

const WS_BASE_URL = import.meta.env.VITE_WS_BASE_URL || 'ws://localhost:8000';

const OrdersPage: React.FC = () => {
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('PLACED,PREPARING');
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  // WebSocket connection for real-time updates
  const token = localStorage.getItem('access_token');
  const wsUrl = `${WS_BASE_URL}/ws/staff/orders/?token=${token}`;

  const { isConnected } = useWebSocket({
    url: wsUrl,
    onMessage: (message: any) => {
      if (message.type === 'new_order') {
        console.log('✅ New order received:', message.order_id);
        loadOrders();
      }
    },
    onOpen: () => {
      console.log('✅ WebSocket connected');
    },
    onClose: () => {
      console.log('❌ WebSocket disconnected');
    },
    onError: (error) => {
      console.error('⚠️ WebSocket error:', error);
    },
    reconnectInterval: 5000,  // Wait 5 seconds before reconnecting
    maxReconnectAttempts: 3,  // Only try 3 times
  });

  useEffect(() => {
    loadOrders();
  }, [filter]);

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

  const loadOrders = async () => {
    try {
      setLoading(true);
      // Admins see all orders, staff see only their assigned patient's orders
      const myOrdersFilter = !user?.is_superuser;
      const response = await ordersApi.getOrderQueue(filter, myOrdersFilter);
      setOrders(response.orders);
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setLoading(false);
    }
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
          <h1 style={{fontSize: isMobile ? '20px' : '28px', margin: 0}}>Panel de Órdenes</h1>
          <div style={{...styles.userInfo, fontSize: isMobile ? '12px' : '14px'}}>
            {user?.email} |
            <span style={{ marginLeft: '10px', color: isConnected ? colors.success : colors.error }}>
              {isConnected ? '● Conectado' : '○ Desconectado'}
            </span>
          </div>
        </div>
        <div style={{
          ...styles.headerButtons,
          width: isMobile ? '100%' : 'auto',
          flexDirection: isMobile ? 'column' as const : 'row' as const,
          gap: isMobile ? '10px' : '10px'
        }}>
          <Link to="/admin/dashboard" style={{
            ...styles.backButton,
            width: isMobile ? '100%' : 'auto',
            textAlign: 'center' as const,
            padding: isMobile ? '12px' : '10px 20px'
          }} className="back-button">
            ← Volver al Panel
          </Link>
          <button onClick={handleLogout} style={{
            ...styles.logoutButton,
            width: isMobile ? '100%' : 'auto',
            padding: isMobile ? '12px' : '10px 20px'
          }} className="logout-button">
            Cerrar Sesión
          </button>
        </div>
      </header>

      <div style={{
        ...styles.filters,
        flexWrap: isMobile ? 'wrap' as const : 'nowrap' as const,
        gap: isMobile ? '10px' : '15px',
        padding: isMobile ? '15px' : '20px'
      }}>
        <button
          onClick={() => setFilter('PLACED,PREPARING')}
          style={filter === 'PLACED,PREPARING' ? styles.filterButtonActive : styles.filterButton}
          className="filter-button"
        >
          Órdenes Activas
        </button>
        <button
          onClick={() => setFilter('READY')}
          style={filter === 'READY' ? styles.filterButtonActive : styles.filterButton}
          className="filter-button"
        >
          Listas
        </button>
        <button
          onClick={() => setFilter('DELIVERED')}
          style={filter === 'DELIVERED' ? styles.filterButtonActive : styles.filterButton}
          className="filter-button"
        >
          Entregadas
        </button>
        <button
          onClick={() => setFilter('PLACED,PREPARING,READY,DELIVERED,CANCELLED')}
          style={filter === 'PLACED,PREPARING,READY,DELIVERED,CANCELLED' ? styles.filterButtonActive : styles.filterButton}
          className="filter-button"
        >
          Todas
        </button>
      </div>

      {loading ? (
        <div style={styles.loading}>Cargando órdenes...</div>
      ) : (
        <div style={{
          ...styles.ordersGrid,
          gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(auto-fill, minmax(280px, 1fr))' : 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: isMobile ? '15px' : '20px',
          padding: isMobile ? '15px' : '20px'
        }}>
          {orders.length === 0 ? (
            <div style={styles.emptyState}>No se encontraron órdenes</div>
          ) : (
            orders.map((order) => (
              <Link
                key={order.id}
                to={`/staff/orders/${order.id}`}
                style={styles.orderCard}
                className="order-card"
              >
                <div style={styles.orderHeader}>
                  <h3>Orden #{order.id}</h3>
                  <span
                    style={{
                      ...styles.statusBadge,
                      backgroundColor: getStatusColor(order.status),
                    }}
                  >
                    {order.status_display}
                  </span>
                </div>
                <div style={styles.orderInfo}>
                  <p>Habitación: {order.room_code || 'N/A'}</p>
                  <p>Dispositivo: {order.device_uid || 'N/A'}</p>
                  <p>Artículos: {order.items.length}</p>
                  <p style={styles.timestamp}>
                    {new Date(order.placed_at).toLocaleString()}
                  </p>
                </div>
              </Link>
            ))
          )}
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
  headerButtons: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
  },
  backButton: {
    padding: '10px 20px',
    backgroundColor: colors.primaryDark,
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    textDecoration: 'none',
    fontSize: '14px',
    transition: 'all 0.2s',
    fontWeight: '600',
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
  filters: {
    display: 'flex',
    gap: '10px',
    padding: '20px',
    backgroundColor: colors.white,
    borderBottom: `1px solid ${colors.primaryMuted}`,
  },
  filterButton: {
    padding: '10px 20px',
    border: `1px solid ${colors.primaryMuted}`,
    borderRadius: '8px',
    backgroundColor: colors.white,
    color: colors.textPrimary,
    cursor: 'pointer',
    transition: 'all 0.2s',
    fontWeight: '500',
  },
  filterButtonActive: {
    padding: '10px 20px',
    border: `2px solid ${colors.primary}`,
    borderRadius: '8px',
    backgroundColor: colors.primary,
    color: 'white',
    cursor: 'pointer',
    fontWeight: '600',
  },
  loading: {
    textAlign: 'center',
    padding: '40px',
    fontSize: '18px',
    color: '#666',
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px',
    fontSize: '18px',
    color: '#999',
  },
  ordersGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '20px',
    padding: '20px',
  },
  orderCard: {
    backgroundColor: colors.white,
    padding: '20px',
    borderRadius: '12px',
    boxShadow: colors.shadowGold,
    textDecoration: 'none',
    color: 'inherit',
    transition: 'transform 0.2s, box-shadow 0.2s',
    cursor: 'pointer',
    border: `1px solid ${colors.primaryMuted}`,
  },
  orderHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '15px',
  },
  statusBadge: {
    padding: '5px 10px',
    borderRadius: '20px',
    color: 'white',
    fontSize: '12px',
    fontWeight: 'bold',
  },
  orderInfo: {
    fontSize: '14px',
    color: '#666',
  },
  timestamp: {
    fontSize: '12px',
    color: '#999',
    marginTop: '10px',
  },
};

// Add hover effects
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  .order-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px ${colors.shadowGold} !important;
  }
  
  .back-button:hover {
    background-color: ${colors.primary} !important;
    transform: scale(1.02);
  }
  
  .logout-button:hover {
    background-color: ${colors.error} !important;
    transform: scale(1.02);
  }
  
  .filter-button:hover {
    border-color: ${colors.primary} !important;
    color: ${colors.primary} !important;
  }
`;
if (!document.head.querySelector('[data-staff-orders-styles]')) {
  styleSheet.setAttribute('data-staff-orders-styles', 'true');
  document.head.appendChild(styleSheet);
}

export default OrdersPage;
