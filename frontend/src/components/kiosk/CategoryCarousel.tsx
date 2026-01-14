import React, { useRef } from 'react';
import type { ProductCategory, Product } from '../../types';
import { ProductCard } from './ProductCard';
import { colors } from '../../styles/colors';

interface CategoryCarouselProps {
  category: ProductCategory;
  products: Product[];
  onAddToCart: (productId: number) => void;
  onViewAll: (categoryId: number) => void;
}

export const CategoryCarousel: React.FC<CategoryCarouselProps> = ({
  category,
  products,
  onAddToCart,
  onViewAll,
}) => {
  const carouselRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    carouselRef.current?.scrollBy({ left: -320, behavior: 'smooth' });
  };

  const scrollRight = () => {
    carouselRef.current?.scrollBy({ left: 320, behavior: 'smooth' });
  };

  if (products.length === 0) {
    return null;
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          {category.icon && (
            <div style={styles.iconContainer}>
              <span style={styles.icon}>{category.icon}</span>
            </div>
          )}
          <div>
            <h2 style={styles.title}>{category.name}</h2>
            {category.description && (
              <p style={styles.description}>{category.description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Carousel */}
      <div style={styles.carouselWrapper}>
        {/* Left Arrow */}
        <button
          className="carousel-arrow"
          style={{ ...styles.arrow, ...styles.arrowLeft }}
          onClick={scrollLeft}
          aria-label="Scroll left"
        >
          ‹
        </button>

        {/* Products Container */}
        <div ref={carouselRef} style={styles.carousel}>
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={onAddToCart}
              variant="carousel"
            />
          ))}
        </div>

        {/* Right Arrow */}
        <button
          className="carousel-arrow"
          style={{ ...styles.arrow, ...styles.arrowRight }}
          onClick={scrollRight}
          aria-label="Scroll right"
        >
          ›
        </button>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    marginBottom: '48px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    padding: '0 20px',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  iconContainer: {
    width: '64px',
    height: '64px',
    borderRadius: '12px',
    backgroundColor: colors.primary,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: `0 4px 12px ${colors.shadow}`,
  },
  icon: {
    fontSize: '32px',
  },
  title: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: colors.black,
    margin: 0,
  },
  description: {
    fontSize: '14px',
    color: colors.gray,
    margin: '4px 0 0 0',
  },
  carouselWrapper: {
    position: 'relative',
    padding: '0 60px',
  },
  carousel: {
    display: 'flex',
    gap: '20px',
    overflowX: 'scroll',
    overflowY: 'hidden',
    scrollBehavior: 'smooth',
    padding: '10px 20px',
    scrollbarWidth: 'none', // Firefox
    msOverflowStyle: 'none', // IE/Edge
    WebkitOverflowScrolling: 'touch', // Smooth scrolling on iOS
    flexWrap: 'nowrap', // Prevent wrapping
  },
  arrow: {
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    backgroundColor: colors.white,
    color: colors.primary,
    border: `2px solid ${colors.primary}`,
    fontSize: '32px',
    fontWeight: 'bold',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    boxShadow: `0 4px 12px ${colors.shadow}`,
    transition: 'all 0.2s',
  },
  arrowLeft: {
    left: '0',
  },
  arrowRight: {
    right: '0',
  },
};

// Hide scrollbar for webkit browsers and add hover effects
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  .carousel::-webkit-scrollbar {
    display: none;
  }

  .carousel-arrow:hover {
    background-color: ${colors.primary} !important;
    color: ${colors.white} !important;
    transform: translateY(-50%) scale(1.1);
  }

  .carousel-arrow:active {
    transform: translateY(-50%) scale(0.95);
  }
`;
if (!document.head.querySelector('[data-carousel-styles]')) {
  styleSheet.setAttribute('data-carousel-styles', 'true');
  document.head.appendChild(styleSheet);
}
