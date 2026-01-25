import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { productsApi } from '../../api/products';
import { CartModal } from '../../components/kiosk/CartModal';
import { colors } from '../../styles/colors';
import logoHorizontal from '../../assets/logos/logo-horizontal.png';

const CART_STORAGE_KEY = 'kiosk_cart';

export const KioskStoreCart: React.FC = () => {
  const { deviceId } = useParams<{ deviceId: string }>();
  const navigate = useNavigate();
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
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProducts();
  }, [deviceId]);

  const loadProducts = async () => {
    try {
      const productsData = await productsApi.getPublicProducts();
      setProducts(productsData);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateQuantity = (productId: number, quantity: number) => {
    const newCart = new Map(cart);
    if (quantity > 0) {
      newCart.set(productId, quantity);
    } else {
      newCart.delete(productId);
    }
    setCart(newCart);
    if (deviceId) {
      localStorage.setItem(
        `${CART_STORAGE_KEY}_${deviceId}`,
        JSON.stringify(Array.from(newCart.entries()))
      );
    }
  };

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Cargando...</div>;
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: colors.ivory }}>
      <header style={{
        backgroundColor: colors.primary,
        padding: '1rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <img src={logoHorizontal} alt="CAMSA" style={{ height: '40px' }} />
          <h1 style={{ color: 'white', margin: 0 }}>Carrito</h1>
        </div>
        <button
          onClick={() => navigate(`/kiosk/${deviceId}/store`)}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: 'transparent',
            border: '1px solid white',
            color: 'white',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          ← Volver a Tienda
        </button>
      </header>
      <main style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
        <CartModal
          cart={cart}
          products={products}
          onClose={() => navigate(`/kiosk/${deviceId}/store`)}
          onUpdateQuantity={handleUpdateQuantity}
          onCheckout={() => navigate(`/kiosk/${deviceId}/store/checkout`)}
        />
      </main>
    </div>
  );
};
