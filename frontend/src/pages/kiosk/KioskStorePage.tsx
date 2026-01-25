import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MOCK_PRODUCTS, MOCK_SERVICES, type StoreItem } from '../../types/store';
import { useStoreCart } from '../../hooks/useStoreCart';
import { UnifiedItemCard } from '../../components/store/UnifiedItemCard';
import { ServiceReservationModal } from '../../components/services/ServiceReservationModal';
import { CartSidebar } from '../../components/store/CartSidebar';
import { colors } from '../../styles/colors';
import logoHorizontal from '../../assets/logos/logo-horizontal.png';

/** Prototipo: Tienda unificada de Renova Clinic con productos y servicios */
export const KioskStorePage: React.FC = () => {
  const { deviceId } = useParams<{ deviceId: string }>();
  const navigate = useNavigate();
  const { cart, add, addServiceWithReservation, update, totalItems } = useStoreCart();

  const [selectedType, setSelectedType] = useState<'all' | 'product' | 'service'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCart, setShowCart] = useState(false);
  const [reservationService, setReservationService] = useState<StoreItem | null>(null);

  // Combinar productos y servicios
  const allItems: StoreItem[] = useMemo(() => {
    return [...MOCK_PRODUCTS, ...MOCK_SERVICES];
  }, []);

  // Filtrar items
  const filtered = useMemo(() => {
    let items = allItems;

    // Filtro por tipo (producto o servicio)
    if (selectedType !== 'all') {
      items = items.filter((item) => item.type === selectedType);
    }

    // Filtro por búsqueda
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      items = items.filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query)
      );
    }

    return items;
  }, [allItems, selectedType, searchQuery]);

  const handleAddItem = (item: StoreItem) => {
    if (item.type === 'service') {
      setReservationService(item);
    } else {
      add(item.id, 1, 'product');
    }
  };

  const handleConfirmReservation = (date: Date, timeSlot: string, notes?: string) => {
    if (reservationService && reservationService.type === 'service') {
      addServiceWithReservation(reservationService.id, date, timeSlot, notes);
      setReservationService(null);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: colors.ivory }}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.logoCircle}>
            <span style={styles.logoR}>R</span>
          </div>
          <h1 style={styles.brandName}>Renova Clinic</h1>
        </div>
        <nav style={styles.nav}>
          <a href="#" style={styles.navLink}>Inicio</a>
          <a href="#" style={{ ...styles.navLink, ...styles.navLinkActive }}>Tienda</a>
          <a href="#" style={styles.navLink}>Nosotros</a>
          <a href="#" style={styles.navLink}>Contacto</a>
        </nav>
        <div style={styles.headerRight}>
          <button
            type="button"
            style={styles.cartIconBtn}
            onClick={() => setShowCart(true)}
          >
            🛒
            {totalItems > 0 && (
              <span style={styles.cartBadge}>{totalItems}</span>
            )}
          </button>
        </div>
      </header>

      {/* Search and Filter Bar */}
      <div style={styles.searchBar}>
        <div style={styles.searchInputWrap}>
          <span style={styles.searchIcon}>🔍</span>
          <input
            type="text"
            placeholder="Buscar productos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={styles.searchInput}
          />
        </div>
        <select style={styles.sortSelect}>
          <option>Relevancia</option>
          <option>Precio: Menor a Mayor</option>
          <option>Precio: Mayor a Menor</option>
          <option>Nombre A-Z</option>
        </select>
      </div>

      {/* Type Filters - Productos y Servicios */}
      <div style={styles.typeFilters}>
        <button
          type="button"
          style={{
            ...styles.typeBtn,
            ...(selectedType === 'all' ? styles.typeBtnActive : {}),
          }}
          onClick={() => setSelectedType('all')}
        >
          Todos
        </button>
        <button
          type="button"
          style={{
            ...styles.typeBtn,
            ...(selectedType === 'product' ? styles.typeBtnActive : {}),
          }}
          onClick={() => setSelectedType('product')}
        >
          Productos
        </button>
        <button
          type="button"
          style={{
            ...styles.typeBtn,
            ...(selectedType === 'service' ? styles.typeBtnActive : {}),
          }}
          onClick={() => setSelectedType('service')}
        >
          Servicios
        </button>
      </div>

      {/* Products Count */}
      <div style={styles.productsCount}>
        Mostrando {filtered.length} {filtered.length === 1 ? 'producto' : 'productos'}
      </div>

      {/* Main Content */}
      <main style={styles.main}>
        {filtered.length === 0 ? (
          <p style={styles.empty}>No hay productos en esta categoría.</p>
        ) : (
          <div style={styles.grid}>
            {filtered.map((item) => (
              <UnifiedItemCard
                key={`${item.type}-${item.id}`}
                item={item}
                onAdd={handleAddItem}
              />
            ))}
          </div>
        )}
      </main>

      {/* Cart Sidebar */}
      {showCart && (
        <CartSidebar
          cart={cart}
          products={MOCK_PRODUCTS}
          services={MOCK_SERVICES}
          onClose={() => setShowCart(false)}
          onUpdateQuantity={update}
          onCheckout={() => {
            setShowCart(false);
            navigate(`/kiosk/${deviceId}/store/checkout`);
          }}
        />
      )}

      {/* Service Reservation Modal */}
      {reservationService && reservationService.type === 'service' && (
        <ServiceReservationModal
          service={reservationService}
          onConfirm={handleConfirmReservation}
          onClose={() => setReservationService(null)}
        />
      )}
    </div>
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
    color: colors.textPrimary,
    textDecoration: 'none',
    fontSize: 15,
    fontWeight: 500,
    fontFamily: 'serif',
  },
  navLinkActive: {
    fontWeight: 700,
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
  searchBar: {
    display: 'flex',
    gap: 16,
    padding: '1rem 2rem',
    backgroundColor: colors.white,
    borderBottom: `1px solid ${colors.border}`,
  },
  searchInputWrap: {
    flex: 1,
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  searchIcon: {
    position: 'absolute',
    left: 12,
    fontSize: 16,
  },
  searchInput: {
    width: '100%',
    padding: '10px 12px 10px 36px',
    borderRadius: 8,
    border: `1px solid ${colors.border}`,
    fontSize: 14,
    backgroundColor: colors.white,
  },
  sortSelect: {
    padding: '10px 12px',
    borderRadius: 8,
    border: `1px solid ${colors.border}`,
    fontSize: 14,
    backgroundColor: colors.white,
    cursor: 'pointer',
    minWidth: 150,
  },
  typeFilters: {
    display: 'flex',
    gap: 10,
    padding: '1rem 2rem',
    backgroundColor: colors.white,
    borderBottom: `1px solid ${colors.border}`,
  },
  typeBtn: {
    padding: '10px 20px',
    backgroundColor: colors.white,
    color: colors.textPrimary,
    border: `1px solid ${colors.border}`,
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  typeBtnActive: {
    backgroundColor: colors.primary,
    color: colors.white,
    borderColor: colors.primary,
  },
  productsCount: {
    padding: '1rem 2rem',
    fontSize: 14,
    color: colors.textSecondary,
  },
  main: {
    padding: '2rem',
    maxWidth: 1400,
    margin: '0 auto',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: 24,
  },
  empty: {
    textAlign: 'center',
    color: colors.textMuted,
    padding: 48,
    fontSize: 16,
  },
};
