import React, { useState, useEffect } from 'react';
import { ordersApi } from '../../api/orders';
import { productsApi } from '../../api/products';
import { useWindowSize } from '../../utils/responsive';
import { colors } from '../../styles/colors';
import type { Product } from '../../types';

interface ProductRatingsModalProps {
  patientAssignmentId: number;
  onNext: (productRatings: { [orderId: string]: { [productId: string]: number } }) => void;
}

interface Order {
  id: number;
  status: string;
  items: Array<{
    id: number;
    product: number;
    product_name: string;
    quantity: number;
    unit_label: string;
  }>;
}

const ProductRatingsModal: React.FC<ProductRatingsModalProps> = ({
  patientAssignmentId,
  onNext,
}) => {
  const { isMobile } = useWindowSize();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Map<number, Product>>(new Map());
  const [productRatings, setProductRatings] = useState<{
    [orderId: string]: { [productId: string]: number };
  }>({});

  useEffect(() => {
    loadOrders();
  }, [patientAssignmentId]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const ordersResponse = await ordersApi.getDeliveredOrdersByAssignment(patientAssignmentId);
      const deliveredOrders = (ordersResponse.orders || []) as Order[];
      setOrders(deliveredOrders);

      // Load product images
      const productIds = new Set<number>();
      deliveredOrders.forEach((order: Order) => {
        order.items.forEach((item) => {
          productIds.add(item.product);
        });
      });

      // Fetch all products to get images
      const allProducts = await productsApi.getPublicProducts();
      const productsMap = new Map<number, Product>();
      (allProducts.results || allProducts).forEach((product: Product) => {
        if (productIds.has(product.id)) {
          productsMap.set(product.id, product);
        }
      });
      setProducts(productsMap);

      // Initialize product ratings
      const initialRatings: { [orderId: string]: { [productId: string]: number } } = {};
      deliveredOrders.forEach((order: Order) => {
        initialRatings[order.id.toString()] = {};
        order.items.forEach((item) => {
          initialRatings[order.id.toString()][item.product.toString()] = 0;
        });
      });
      setProductRatings(initialRatings);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProductRating = (orderId: number, productId: number, rating: number) => {
    setProductRatings((prev) => ({
      ...prev,
      [orderId.toString()]: {
        ...prev[orderId.toString()],
        [productId.toString()]: rating,
      },
    }));
  };

  const handleNext = () => {
    // Validate all product ratings are set (greater than 0)
    for (const order of orders) {
      for (const item of order.items) {
        const rating = productRatings[order.id.toString()]?.[item.product.toString()];
        if (rating === undefined || rating === null || rating === 0) {
          alert('Por favor califica todos los productos (mínimo 1 estrella)');
          return;
        }
      }
    }
    onNext(productRatings);
  };

  const StarRating: React.FC<{
    value: number;
    onChange: (value: number) => void;
  }> = ({ value, onChange }) => (
    <div style={styles.starContainer}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          style={{
            ...styles.starButton,
            color: star <= value ? colors.primary : colors.gray,
          }}
          onClick={() => onChange(star)}
          onMouseEnter={(e) => {
            if (star <= value) {
              e.currentTarget.style.color = colors.primaryDark;
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = star <= value ? colors.primary : colors.gray;
          }}
        >
          ★
        </button>
      ))}
    </div>
  );

  if (loading) {
    return (
      <div style={styles.overlay}>
        <div style={styles.modal}>
          <p>Cargando productos...</p>
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div style={styles.overlay}>
        <div style={styles.modal}>
          <p>No hay órdenes entregadas para calificar.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.overlay}>
      <div style={{ ...styles.modal, ...(isMobile && responsiveStyles.modal) }}>
        <h2 style={{ ...styles.title, ...(isMobile && responsiveStyles.title) }}>
          1. Califica los productos que ordenaste
        </h2>

        <div style={styles.ordersContainer}>
          {orders.map((order) => (
            <div key={order.id} style={styles.orderSection}>
              <h3 style={styles.orderTitle}>Orden #{order.id}</h3>
              <div style={styles.productsGrid}>
                {order.items.map((item) => {
                  const product = products.get(item.product);
                  const rating = productRatings[order.id.toString()]?.[item.product.toString()] || 0;
                  
                  return (
                    <div key={item.id} style={styles.productCard}>
                      {product?.image_url && (
                        <img
                          src={product.image_url}
                          alt={item.product_name}
                          style={styles.productImage}
                        />
                      )}
                      <div style={styles.productInfo}>
                        <h4 style={styles.productName}>{item.product_name}</h4>
                        <p style={styles.productQuantity}>
                          {item.quantity} {item.unit_label}
                        </p>
                        <StarRating
                          value={rating}
                          onChange={(rating) => handleProductRating(order.id, item.product, rating)}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={handleNext}
          style={{
            ...styles.nextButton,
            ...(isMobile && responsiveStyles.nextButton),
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = colors.primaryDark;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = colors.primary;
          }}
        >
          Continuar
        </button>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px',
  },
  modal: {
    backgroundColor: colors.white,
    borderRadius: '16px',
    padding: '40px',
    maxWidth: '900px',
    width: '100%',
    maxHeight: '90vh',
    overflowY: 'auto',
    boxShadow: colors.shadowGold,
    border: `1px solid ${colors.primaryMuted}`,
  },
  title: {
    fontSize: '28px',
    fontWeight: 600,
    color: colors.textPrimary,
    marginBottom: '30px',
    textAlign: 'center',
  },
  ordersContainer: {
    marginBottom: '30px',
  },
  orderSection: {
    marginBottom: '30px',
    padding: '20px',
    backgroundColor: colors.cream,
    borderRadius: '12px',
  },
  orderTitle: {
    fontSize: '20px',
    fontWeight: 600,
    color: colors.primaryDark,
    marginBottom: '20px',
  },
  productsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '20px',
  },
  productCard: {
    backgroundColor: colors.white,
    borderRadius: '12px',
    padding: '15px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '10px',
  },
  productImage: {
    width: '100%',
    height: '150px',
    objectFit: 'cover',
    borderRadius: '8px',
  },
  productInfo: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
  },
  productName: {
    fontSize: '16px',
    fontWeight: 600,
    color: colors.textPrimary,
    textAlign: 'center',
    margin: 0,
  },
  productQuantity: {
    fontSize: '14px',
    color: colors.textSecondary,
    margin: 0,
  },
  starContainer: {
    display: 'flex',
    gap: '5px',
    justifyContent: 'center',
  },
  starButton: {
    background: 'none',
    border: 'none',
    fontSize: '28px',
    cursor: 'pointer',
    padding: 0,
    transition: 'color 0.2s',
  },
  nextButton: {
    width: '100%',
    backgroundColor: colors.primary,
    color: colors.white,
    border: 'none',
    borderRadius: '8px',
    padding: '16px 32px',
    fontSize: '18px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
};

const responsiveStyles: { [key: string]: React.CSSProperties } = {
  modal: {
    padding: '20px',
    maxHeight: '95vh',
  },
  title: {
    fontSize: '24px',
  },
  productsGrid: {
    gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
    gap: '15px',
  },
  nextButton: {
    padding: '14px 24px',
    fontSize: '16px',
  },
};

export default ProductRatingsModal;
