import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MOCK_PRODUCTS, MOCK_CATEGORIES } from '../../types/store';
import type { StoreProduct } from '../../types/store';
import { useStoreCart } from '../../hooks/useStoreCart';
import { ProductCard } from '../../components/store/ProductCard';
import { ProductDetailModal } from '../../components/store/ProductDetailModal';
import { CartSidebar } from '../../components/store/CartSidebar';
import { colors } from '../../styles/colors';
import logoHorizontal from '../../assets/logos/logo-horizontal.png';

/** Prototipo: solo mock. Sin API ni carrito del kiosk. */
export const KioskStorePage: React.FC = () => {
  const { deviceId } = useParams<{ deviceId: string }>();
  const navigate = useNavigate();
  const { cart, add, update, totalItems } = useStoreCart();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showCart, setShowCart] = useState(false);
  const [detailProduct, setDetailProduct] = useState<StoreProduct | null>(null);

  const filtered = useMemo(() => {
    if (selectedCategory === 'all') return MOCK_PRODUCTS;
    return MOCK_PRODUCTS.filter((p) => p.category === selectedCategory);
  }, [selectedCategory]);

  const handleAdd = (id: number, qty?: number) => {
    add(id, qty ?? 1);
  };

  const handleBuyNow = () => {
    navigate(`/kiosk/${deviceId}/store/cart`);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: colors.ivory }}>
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <img src={logoHorizontal} alt="CAMSA" style={styles.logo} />
          <h1 style={styles.title}>Tienda CAMSA</h1>
        </div>
        <div style={styles.headerRight}>
          <button
            type="button"
            style={styles.btnSecondary}
            onClick={() => navigate(`/kiosk/${deviceId}`)}
          >
            ← Volver
          </button>
          {totalItems > 0 && (
            <button
              type="button"
              style={styles.cartBtn}
              onClick={() => setShowCart(true)}
            >
              🛒 Carrito ({totalItems})
            </button>
          )}
        </div>
      </header>

      <div style={styles.filters}>
        {MOCK_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            style={{
              ...styles.filterBtn,
              ...(selectedCategory === cat.id ? styles.filterBtnActive : {}),
            }}
            onClick={() => setSelectedCategory(cat.id)}
          >
            {cat.name}
          </button>
        ))}
      </div>

      <main style={styles.main}>
        {filtered.length === 0 ? (
          <p style={styles.empty}>No hay productos en esta categoría.</p>
        ) : (
          <div style={styles.grid}>
            {filtered.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={(id) => handleAdd(id)}
                onViewDetail={(id) => {
                  const p = MOCK_PRODUCTS.find((x) => x.id === id);
                  if (p) setDetailProduct(p);
                }}
              />
            ))}
          </div>
        )}
      </main>

      {showCart && (
        <CartSidebar
          cart={cart}
          products={MOCK_PRODUCTS}
          onClose={() => setShowCart(false)}
          onUpdateQuantity={update}
          onCheckout={() => {
            setShowCart(false);
            navigate(`/kiosk/${deviceId}/store/checkout`);
          }}
        />
      )}

      {detailProduct && (
        <ProductDetailModal
          product={detailProduct}
          onClose={() => setDetailProduct(null)}
          onAddToCart={(id, qty) => handleAdd(id, qty)}
          onBuyNow={handleBuyNow}
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
    backgroundColor: colors.primary,
    boxShadow: `0 2px 8px ${colors.shadow}`,
  },
  headerLeft: { display: 'flex', alignItems: 'center', gap: 16 },
  logo: { height: 40 },
  title: { margin: 0, fontSize: 22, color: colors.white, fontWeight: 700 },
  headerRight: { display: 'flex', gap: 12, alignItems: 'center' },
  btnSecondary: {
    padding: '10px 18px',
    backgroundColor: 'transparent',
    color: colors.white,
    border: `2px solid ${colors.white}`,
    borderRadius: 8,
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
  },
  cartBtn: {
    padding: '10px 18px',
    backgroundColor: colors.white,
    color: colors.primary,
    border: 'none',
    borderRadius: 8,
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
  },
  filters: {
    display: 'flex',
    gap: 10,
    flexWrap: 'wrap',
    padding: '1rem 2rem',
    backgroundColor: colors.white,
    borderBottom: `1px solid ${colors.border}`,
  },
  filterBtn: {
    padding: '8px 16px',
    backgroundColor: 'transparent',
    color: colors.textPrimary,
    border: `1px solid ${colors.border}`,
    borderRadius: 8,
    fontSize: 14,
    cursor: 'pointer',
  },
  filterBtnActive: {
    backgroundColor: colors.primary,
    color: colors.white,
    borderColor: colors.primary,
  },
  main: {
    padding: '2rem',
    maxWidth: 1200,
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
  },
};
