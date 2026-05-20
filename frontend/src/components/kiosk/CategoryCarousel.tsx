import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart } from 'lucide-react';
import type { ProductCategory, Product } from '../../types';
import { useWindowSize } from '../../utils/responsive';
import { StarRating } from './StarRating';

const GOLD = '#C9A227';
const GOLD_LIGHT = '#E8C547';
const GOLD_DARK = '#B8860B';

interface CategoryCarouselProps {
  category: ProductCategory;
  products: Product[];
  onAddToCart: (productId: number) => void;
  onViewAll: (categoryId: number) => void;
  showViewAllButton?: boolean;
  maxVisible?: number;
}

export const CategoryCarousel: React.FC<CategoryCarouselProps> = ({
  category,
  products,
  onAddToCart,
  onViewAll,
  showViewAllButton = true,
  maxVisible = 3,
}) => {
  const { isMobile } = useWindowSize();
  const [addedId, setAddedId] = useState<number | null>(null);

  const visibleProducts = products.slice(0, isMobile ? 2 : maxVisible);

  const handleAdd = (productId: number) => {
    setAddedId(productId);
    onAddToCart(productId);
    setTimeout(() => setAddedId(null), 1200);
  };

  if (products.length === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      style={{
        ...sectionWrap,
        margin: isMobile ? '0 12px 16px' : '0 auto 24px',
        maxWidth: '1200px',
        borderRadius: isMobile ? '16px' : '20px',
      }}
    >
      {/* Header */}
      <div style={{
        ...sectionHeader,
        padding: isMobile ? '14px 16px' : '20px 28px',
      }}>
        <div style={headerLeft}>
          {(category.icon_image_url || category.icon) && (
            <div style={{
              ...iconBadge,
              width: isMobile ? '36px' : '46px',
              height: isMobile ? '36px' : '46px',
            }}>
              {category.icon_image_url ? (
                <img
                  src={category.icon_image_url}
                  alt={category.name}
                  style={{ width: isMobile ? 24 : 30, height: isMobile ? 24 : 30, objectFit: 'contain' }}
                  draggable={false}
                />
              ) : (
                <span style={{ fontSize: isMobile ? '18px' : '24px' }}>{category.icon}</span>
              )}
            </div>
          )}
          <div>
            <h2 style={{ ...sectionTitle, fontSize: isMobile ? '17px' : '22px' }}>
              {category.name}
            </h2>
            {!isMobile && category.description && (
              <p style={sectionDesc}>{category.description}</p>
            )}
          </div>
        </div>
        {/* B3 fix: 'Ver todo' se movio al fondo del card (despues del
            productGrid). El header del card solo lleva icono + titulo. */}
      </div>

      {/* Product Grid */}
      <div style={{
        ...productGrid,
        padding: isMobile ? '0 12px 16px' : '0 28px 24px',
        gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : `repeat(${Math.min(visibleProducts.length, maxVisible)}, 1fr)`,
        gap: isMobile ? '12px' : '20px',
      }}>
        {visibleProducts.map((product, i) => {
          const isOutOfStock = product.is_available === false;
          const isAdded = addedId === product.id;
          const mainTag = product.tags && product.tags.length > 0 ? product.tags[0] : null;
          const isFood = product.category_type === 'FOOD';

          return (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, duration: 0.35 }}
              whileHover={!isOutOfStock ? { y: -4, scale: 1.01 } : {}}
              style={{
                ...cardBase,
                opacity: isOutOfStock ? 0.6 : 1,
              }}
            >
              {/* Image */}
              <div style={{ ...imageWrap, height: isMobile ? '130px' : '200px' }}>
                {product.image_url_full && (
                  <img
                    src={product.image_url_full}
                    alt={product.name}
                    style={{
                      ...imageStyle,
                      filter: isOutOfStock ? 'grayscale(90%) brightness(0.75)' : 'none',
                    }}
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                  />
                )}
                {mainTag && !isOutOfStock && (
                  <div style={{ ...tagBadgeStyle, backgroundColor: mainTag.color }}>
                    {mainTag.icon && <span style={{ marginRight: '3px' }}>{mainTag.icon}</span>}
                    {mainTag.name}
                  </div>
                )}
                {isOutOfStock && (
                  <div style={outOfStockBadge}>AGOTADO</div>
                )}
              </div>

              {/* Content */}
              <div style={{ ...cardContent, padding: isMobile ? '10px 10px 0' : '14px 16px 0' }}>
                <h3 style={{ ...cardTitle, fontSize: isMobile ? '14px' : '16px' }}>
                  {product.name}
                </h3>
                {!isMobile && product.description && (
                  <p style={cardDesc}>{product.description}</p>
                )}
                {product.unit_label && (
                  <p style={cardUnit}>{product.unit_label}</p>
                )}
                {product.rating !== undefined && product.rating > 0 && (
                  <div style={{ marginTop: '4px' }}>
                    <StarRating rating={product.rating} size="large" showCount={false} count={product.rating_count} />
                  </div>
                )}
              </div>

              {/* Action */}
              <div style={{ padding: isMobile ? '8px 10px 10px' : '10px 16px 14px' }}>
                {isOutOfStock ? (
                  <button style={disabledBtn} disabled>No disponible</button>
                ) : (
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.95 }}
                    style={{
                      ...addBtn,
                      background: isAdded ? `linear-gradient(135deg, ${GOLD_LIGHT} 0%, ${GOLD} 100%)` : '#fff',
                      color: isAdded ? '#fff' : '#1a1a1a',
                      fontSize: isMobile ? '12px' : '14px',
                      padding: isMobile ? '8px 8px' : '12px 16px',
                    }}
                    onClick={() => handleAdd(product.id)}
                  >
                    <AnimatePresence mode="wait">
                      {isAdded ? (
                        <motion.span
                          key="added"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0 }}
                          style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}
                        >
                          ✓ ¡Agregado!
                        </motion.span>
                      ) : (
                        <motion.span
                          key="add"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}
                        >
                          <ShoppingCart size={isMobile ? 13 : 15} />
                          {isFood ? 'Agregar (Pago adicional)' : 'Agregar a la Orden'}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* B3 fix: 'Ver todo' como link al fondo del card, fuera del header.
          Usamos <motion.a> (anchor) en vez de <button> porque la regla CSS
          global 'button { width: 100% !important }' en mobile no aplica a
          anchors, asi que el pill mantiene su ancho compacto. */}
      {showViewAllButton && category.id > 0 && (
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          padding: isMobile ? '6px 16px 14px' : '4px 28px 20px',
        }}>
          <motion.a
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            href="#"
            onClick={(e) => {
              e.preventDefault();
              onViewAll(category.id);
            }}
            style={{
              ...viewAllBtn,
              padding: isMobile ? '6px 14px' : '8px 20px',
              fontSize: isMobile ? '12px' : '14px',
              textDecoration: 'none',
              userSelect: 'none',
            }}
          >
            Ver todo →
          </motion.a>
        </div>
      )}
    </motion.section>
  );
};

/* ── Styles ─────────────────────────────────────────── */

const sectionWrap: React.CSSProperties = {
  backgroundColor: '#fff',
  border: '1px solid rgba(212, 175, 55, 0.15)',
  boxShadow: '0 2px 16px rgba(0,0,0,0.04)',
  overflow: 'hidden',
};

const sectionHeader: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  // B3 fix: en mobile, sin un 'gap' explicito el boton 'Ver todo' se montaba
  // visualmente sobre el titulo (justify-content space-between no siempre
  // basta cuando el contenedor padre constringe el ancho). Garantizamos
  // separacion minima entre titulo y boton.
  gap: '12px',
  borderBottom: '1px solid rgba(212, 175, 55, 0.12)',
};

const headerLeft: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  minWidth: 0,
  // Permite al lado izquierdo crecer/encogerse manteniendo al boton 'Ver todo'
  // anclado a la derecha sin invadir el espacio del titulo.
  flex: '1 1 auto',
};

const iconBadge: React.CSSProperties = {
  borderRadius: '12px',
  backgroundColor: 'rgba(212, 175, 55, 0.08)',
  border: '1px solid rgba(212, 175, 55, 0.2)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
};

const sectionTitle: React.CSSProperties = {
  fontFamily: 'var(--font-serif)',
  fontWeight: 700,
  color: '#1a1a1a',
  margin: 0,
};

const sectionDesc: React.CSSProperties = {
  fontSize: '13px',
  color: '#888',
  margin: '2px 0 0 0',
};

const viewAllBtn: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  borderRadius: '999px',
  backgroundColor: 'rgba(212, 175, 55, 0.08)',
  color: GOLD_DARK,
  border: '1px solid rgba(212, 175, 55, 0.25)',
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: 'inherit',
  whiteSpace: 'nowrap',
  // B3 fix: el boton nunca se encoge ni se mueve al espacio del titulo.
  flexShrink: 0,
};

const productGrid: React.CSSProperties = {
  display: 'grid',
  paddingTop: '16px',
};

const cardBase: React.CSSProperties = {
  backgroundColor: '#FAFAF5',
  borderRadius: '16px',
  border: '1px solid rgba(212, 175, 55, 0.15)',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  transition: 'box-shadow 0.2s, transform 0.2s',
  boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
};

const imageWrap: React.CSSProperties = {
  position: 'relative',
  width: '100%',
  backgroundColor: '#fff',
  overflow: 'hidden',
};

const imageStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  objectFit: 'contain',
  display: 'block',
  padding: '8px',
};

const tagBadgeStyle: React.CSSProperties = {
  position: 'absolute',
  top: '8px',
  right: '8px',
  color: '#fff',
  padding: '3px 8px',
  borderRadius: '999px',
  fontSize: '10px',
  fontWeight: 600,
  display: 'flex',
  alignItems: 'center',
  boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
};

const outOfStockBadge: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: 'rgba(0,0,0,0.45)',
  color: '#fff',
  fontSize: '14px',
  fontWeight: 700,
  letterSpacing: '2px',
};

const cardContent: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
};

const cardTitle: React.CSSProperties = {
  fontWeight: 700,
  color: '#1a1a1a',
  margin: 0,
  lineHeight: 1.3,
};

const cardDesc: React.CSSProperties = {
  fontSize: '13px',
  color: '#777',
  margin: 0,
  lineHeight: 1.5,
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
};

const cardUnit: React.CSSProperties = {
  fontSize: '11px',
  color: '#aaa',
  margin: 0,
  textTransform: 'uppercase',
  letterSpacing: '0.4px',
  fontWeight: 500,
};

const addBtn: React.CSSProperties = {
  width: '100%',
  border: '1px solid rgba(212, 175, 55, 0.2)',
  borderRadius: '10px',
  fontWeight: 700,
  cursor: 'pointer',
  fontFamily: 'inherit',
  transition: 'box-shadow 0.2s',
  boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
};

const disabledBtn: React.CSSProperties = {
  width: '100%',
  padding: '12px 16px',
  backgroundColor: '#f5f5f0',
  color: '#bbb',
  border: '1px solid #eee',
  borderRadius: '10px',
  fontSize: '13px',
  fontWeight: 600,
  cursor: 'not-allowed',
  fontFamily: 'inherit',
};

// B3 fix: anular la regla global de styles/responsive.css que en mobile
// fuerza 'button { width: 100% !important; padding: 12px 16px !important }'.
// Esa regla hacia que el boton 'Ver todo' se expandiera a todo el ancho del
// card y tapara el titulo de la seccion. Restauramos ancho automatico y el
// padding tipo pill chico que define viewAllBtn (6px 14px en mobile).
if (typeof document !== 'undefined' && !document.head.querySelector('[data-category-carousel-styles]')) {
  const styleSheet = document.createElement('style');
  styleSheet.setAttribute('data-category-carousel-styles', 'true');
  styleSheet.textContent = `
    .cat-view-all-btn {
      width: auto !important;
      padding: 8px 20px !important;
    }
    @media (max-width: 767px) {
      .cat-view-all-btn {
        width: auto !important;
        padding: 6px 14px !important;
      }
    }
  `;
  document.head.appendChild(styleSheet);
}
