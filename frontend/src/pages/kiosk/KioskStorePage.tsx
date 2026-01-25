import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { productsApi } from '../../api/products';
import { kioskApi } from '../../api/kiosk';
import type { Product, ProductCategory } from '../../types';
import { ProductCard } from '../../components/kiosk/ProductCard';
import { CartModal } from '../../components/kiosk/CartModal';
import { colors } from '../../styles/colors';
import logoHorizontal from '../../assets/logos/logo-horizontal.png';

const CART_STORAGE_KEY = 'kiosk_cart';

export const KioskStorePage: React.FC = () => {
  const { deviceId } = useParams<{ deviceId: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [cart, setCart] = useState<Map<number, number>>(() => {
    try {
      const stored = localStorage.getItem(`${CART_STORAGE_KEY}_${deviceId}`);
      if (stored) {
        return new Map(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Error loading cart:', e);
    }
    return new Map();
  });
  const [showCart, setShowCart] = useState(false);
  const [patientInfo, setPatientInfo] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, [deviceId]);

  useEffect(() => {
    if (deviceId && cart.size > 0) {
      localStorage.setItem(
        `${CART_STORAGE_KEY}_${deviceId}`,
        JSON.stringify(Array.from(cart.entries()))
      );
    }
  }, [cart, deviceId]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load patient info
      if (deviceId) {
        const patientData = await kioskApi.getActivePatient(deviceId);
        setPatientInfo(patientData);
      }

      // Load categories and products
      const [categoriesData, productsData] = await Promise.all([
        productsApi.getPublicCategories(),
        productsApi.getPublicProducts()
      ]);

      setCategories(categoriesData);
      setProducts(productsData);
    } catch (error) {
      console.error('Error loading store data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (productId: number) => {
    const currentQty = cart.get(productId) || 0;
    setCart(new Map(cart.set(productId, currentQty + 1)));
  };

  const handleUpdateCart = (productId: number, quantity: number) => {
    const newCart = new Map(cart);
    if (quantity > 0) {
      newCart.set(productId, quantity);
    } else {
      newCart.delete(productId);
    }
    setCart(newCart);
  };

  const cartTotal = Array.from(cart.values()).reduce((sum, qty) => sum + qty, 0);

  const filteredProducts = selectedCategory
    ? products.filter(p => p.category === selectedCategory)
    : products;

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div>Cargando tienda...</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: colors.ivory }}>
      {/* Header */}
      <header style={{
        backgroundColor: colors.primary,
        padding: '1rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <img src={logoHorizontal} alt="CAMSA" style={{ height: '40px' }} />
          <h1 style={{ color: 'white', margin: 0 }}>Tienda CAMSA</h1>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {patientInfo && (
            <div style={{ color: 'white' }}>
              <div>Habitación: {patientInfo.room_code}</div>
            </div>
          )}
          <button
            onClick={() => navigate(`/kiosk/${deviceId}`)}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: 'transparent',
              border: '1px solid white',
              color: 'white',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            ← Volver
          </button>
          {cartTotal > 0 && (
            <button
              onClick={() => setShowCart(true)}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: colors.primary,
                border: 'none',
                color: 'white',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              🛒 Carrito ({cartTotal})
            </button>
          )}
        </div>
      </header>

      {/* Categories Filter */}
      <div style={{
        padding: '1rem 2rem',
        backgroundColor: 'white',
        borderBottom: `1px solid ${colors.border}`
      }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => setSelectedCategory(null)}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: selectedCategory === null ? colors.primary : 'transparent',
              color: selectedCategory === null ? 'white' : colors.textPrimary,
              border: `1px solid ${colors.border}`,
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            Todos
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: selectedCategory === cat.id ? colors.primary : 'transparent',
                color: selectedCategory === cat.id ? 'white' : colors.textPrimary,
                border: `1px solid ${colors.border}`,
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      <main style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
        {filteredProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: colors.textSecondary }}>
            No hay productos disponibles
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
            gap: '1.5rem'
          }}>
            {filteredProducts.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={handleAddToCart}
                variant="grid"
              />
            ))}
          </div>
        )}
      </main>

      {/* Cart Modal */}
      {showCart && (
        <CartModal
          cart={cart}
          products={products}
          onClose={() => setShowCart(false)}
          onUpdateQuantity={handleUpdateCart}
          onCheckout={() => navigate(`/kiosk/${deviceId}/store/checkout`)}
        />
      )}
    </div>
  );
};
