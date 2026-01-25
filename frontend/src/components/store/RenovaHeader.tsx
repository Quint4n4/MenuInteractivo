import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { colors } from '../../styles/colors';
import { useStoreCart } from '../../hooks/useStoreCart';

interface RenovaHeaderProps {
  activePage?: 'home' | 'store' | 'about' | 'contact';
  onCartClick?: () => void;
}

export const RenovaHeader: React.FC<RenovaHeaderProps> = ({ activePage = 'home', onCartClick }) => {
  const { deviceId } = useParams<{ deviceId: string }>();
  const navigate = useNavigate();
  const { totalItems } = useStoreCart();

  return (
    <header style={styles.header}>
      <div style={styles.headerLeft}>
        <div style={styles.logoCircle}>
          <span style={styles.logoR}>R</span>
        </div>
        <h1 style={styles.brandName}>Renova Clinic</h1>
      </div>
      <nav style={styles.nav}>
        <button
          type="button"
          style={{
            ...styles.navLink,
            ...(activePage === 'home' ? styles.navLinkActive : {}),
          }}
          onClick={() => navigate(`/kiosk/${deviceId}/renova/home`)}
        >
          Inicio
        </button>
        <button
          type="button"
          style={{
            ...styles.navLink,
            ...(activePage === 'store' ? styles.navLinkActive : {}),
          }}
          onClick={() => navigate(`/kiosk/${deviceId}/store`)}
        >
          Tienda
        </button>
        <button
          type="button"
          style={{
            ...styles.navLink,
            ...(activePage === 'about' ? styles.navLinkActive : {}),
          }}
          onClick={() => navigate(`/kiosk/${deviceId}/renova/about`)}
        >
          Nosotros
        </button>
        <button
          type="button"
          style={{
            ...styles.navLink,
            ...(activePage === 'contact' ? styles.navLinkActive : {}),
          }}
          onClick={() => navigate(`/kiosk/${deviceId}/renova/contact`)}
        >
          Contacto
        </button>
      </nav>
      <div style={styles.headerRight}>
        <button
          type="button"
          style={styles.cartIconBtn}
          onClick={() => {
            if (onCartClick) {
              onCartClick();
            } else {
              navigate(`/kiosk/${deviceId}/store`);
            }
          }}
        >
          🛒
          {totalItems > 0 && (
            <span style={styles.cartBadge}>{totalItems}</span>
          )}
        </button>
      </div>
    </header>
  );
};

const styles: Record<string, React.CSSProperties> = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem 2rem',
    backgroundColor: colors.white,
    borderBottom: `1px solid ${colors.border}`,
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  logoCircle: {
    width: 40,
    height: 40,
    borderRadius: '50%',
    backgroundColor: colors.primary,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoR: {
    color: colors.white,
    fontSize: 20,
    fontWeight: 700,
  },
  brandName: {
    margin: 0,
    fontSize: 20,
    fontWeight: 600,
    color: colors.textPrimary,
    fontFamily: 'serif',
  },
  nav: {
    display: 'flex',
    gap: 24,
  },
  navLink: {
    background: 'none',
    border: 'none',
    color: colors.textPrimary,
    textDecoration: 'none',
    fontSize: 15,
    fontWeight: 500,
    fontFamily: 'serif',
    cursor: 'pointer',
    padding: '4px 8px',
    transition: 'all 0.2s',
  },
  navLinkActive: {
    fontWeight: 700,
    color: colors.primary,
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  cartIconBtn: {
    position: 'relative',
    width: 40,
    height: 40,
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    fontSize: 20,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: '50%',
    backgroundColor: colors.primary,
    color: colors.white,
    fontSize: 11,
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
};
