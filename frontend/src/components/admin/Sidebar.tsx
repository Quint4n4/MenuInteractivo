import React from 'react';
import { Link, useLocation } from 'react-router-dom';

interface SidebarProps {
  onLogout: () => void;
  userEmail?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ onLogout, userEmail }) => {
  const location = useLocation();

  const menuItems = [
    { path: '/admin/dashboard', icon: '📊', label: 'Dashboard' },
    { path: '/admin/users', icon: '👥', label: 'Usuarios' },
    { path: '/admin/clients', icon: '👤', label: 'Clientes' },
    { path: '/admin/products', icon: '📦', label: 'Productos' },
    { path: '/admin/devices', icon: '📱', label: 'Dispositivos' },
    { path: '/staff/orders', icon: '📋', label: 'Órdenes' },
    { path: '/admin/feedback', icon: '💬', label: 'Feedback' },
    { path: '/admin/inventory', icon: '📦', label: 'Inventario' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div style={styles.sidebar}>
      <div style={styles.header}>
        <h2 style={styles.title}>CAMSA Admin</h2>
        <div style={styles.userInfo}>
          <div style={styles.userEmail}>{userEmail}</div>
          <div style={styles.badge}>Superadmin</div>
        </div>
      </div>

      <nav style={styles.nav}>
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            style={{
              ...styles.menuItem,
              ...(isActive(item.path) ? styles.menuItemActive : {}),
            }}
          >
            <span style={styles.menuIcon}>{item.icon}</span>
            <span style={styles.menuLabel}>{item.label}</span>
          </Link>
        ))}
      </nav>

      <button onClick={onLogout} style={styles.logoutButton}>
        <span style={styles.menuIcon}>🚪</span>
        <span>Cerrar Sesión</span>
      </button>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  sidebar: {
    width: '250px',
    height: '100vh',
    backgroundColor: '#1a1a2e',
    color: 'white',
    display: 'flex',
    flexDirection: 'column',
    position: 'fixed',
    left: 0,
    top: 0,
    zIndex: 1000,
  },
  header: {
    padding: '20px',
    borderBottom: '1px solid #2d2d44',
  },
  title: {
    margin: 0,
    marginBottom: '15px',
    fontSize: '24px',
    fontWeight: 'bold',
  },
  userInfo: {
    fontSize: '12px',
  },
  userEmail: {
    opacity: 0.8,
    marginBottom: '5px',
  },
  badge: {
    display: 'inline-block',
    backgroundColor: '#e74c3c',
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '10px',
    fontWeight: 'bold',
  },
  nav: {
    flex: 1,
    padding: '10px 0',
    overflowY: 'auto',
  },
  menuItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 20px',
    color: 'white',
    textDecoration: 'none',
    transition: 'background-color 0.2s',
    cursor: 'pointer',
  },
  menuItemActive: {
    backgroundColor: '#2d2d44',
    borderLeft: '4px solid #3498db',
  },
  menuIcon: {
    fontSize: '20px',
    marginRight: '12px',
    width: '24px',
  },
  menuLabel: {
    fontSize: '14px',
  },
  logoutButton: {
    display: 'flex',
    alignItems: 'center',
    padding: '15px 20px',
    backgroundColor: '#e74c3c',
    color: 'white',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
    margin: '10px',
    borderRadius: '5px',
  },
};

export default Sidebar;
