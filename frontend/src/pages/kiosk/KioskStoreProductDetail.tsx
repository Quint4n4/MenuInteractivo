import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { productsApi } from '../../api/products';
import { colors } from '../../styles/colors';
import logoHorizontal from '../../assets/logos/logo-horizontal.png';

const CART_STORAGE_KEY = 'kiosk_cart';

export const KioskStoreProductDetail: React.FC = () => {
  const { deviceId, productId } = useParams<{ deviceId: string; productId: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
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

  useEffect(() => {
    loadProduct();
  }, [productId]);

  const loadProduct = async () => {
    try {
      if (productId) {
        const products = await productsApi.getPublicProducts();
        const found = products.find((p: { id: number }) => p.id === parseInt(productId));
        setProduct(found || null);
      }
    } catch (error) {
      console.error('Error loading product:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    if (product) {
      const newCart = new Map(cart);
      const currentQty = newCart.get(product.id) || 0;
      newCart.set(product.id, currentQty + quantity);
      setCart(newCart);
      if (deviceId) {
        localStorage.setItem(
          `${CART_STORAGE_KEY}_${deviceId}`,
          JSON.stringify(Array.from(newCart.entries()))
        );
      }
      navigate(`/kiosk/${deviceId}/store`);
    }
  };

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Cargando...</div>;
  }

  if (!product) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Producto no encontrado</p>
        <button onClick={() => navigate(`/kiosk/${deviceId}/store`)}>
          Volver a Tienda
        </button>
      </div>
    );
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
          <h1 style={{ color: 'white', margin: 0 }}>{product.name}</h1>
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
          ← Volver
        </button>
      </header>
      <main style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '12px' }}>
          {product.image_url && (
            <img
              src={product.image_url}
              alt={product.name}
              style={{ width: '100%', maxHeight: '400px', objectFit: 'cover', borderRadius: '8px', marginBottom: '1rem' }}
            />
          )}
          <h2>{product.name}</h2>
          {product.description && <p>{product.description}</p>}
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginTop: '2rem' }}>
            <label>Cantidad:</label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              style={{ padding: '0.5rem', width: '80px' }}
            />
            <button
              onClick={handleAddToCart}
              style={{
                padding: '0.75rem 2rem',
                backgroundColor: colors.primary,
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: 'bold'
              }}
            >
              Agregar al Carrito
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};
