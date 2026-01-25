import { useState, useCallback, useEffect } from 'react';
import type { StoreProduct } from '../types/store';

/** localStorage key solo para el prototipo de tienda. No usa kiosk_cart. */
const STORE_PROTOTYPE_CART_KEY = 'store_prototype_cart';

export function useStoreCart() {
  const [cart, setCart] = useState<Map<number, number>>(() => {
    try {
      const stored = localStorage.getItem(STORE_PROTOTYPE_CART_KEY);
      if (stored) return new Map(JSON.parse(stored));
    } catch (e) {
      console.error('Error loading store prototype cart:', e);
    }
    return new Map();
  });

  useEffect(() => {
    if (cart.size > 0) {
      localStorage.setItem(
        STORE_PROTOTYPE_CART_KEY,
        JSON.stringify(Array.from(cart.entries()))
      );
    } else {
      localStorage.removeItem(STORE_PROTOTYPE_CART_KEY);
    }
  }, [cart]);

  const add = useCallback((productId: number, qty = 1) => {
    setCart((prev) => {
      const next = new Map(prev);
      next.set(productId, (next.get(productId) ?? 0) + qty);
      return next;
    });
  }, []);

  const update = useCallback((productId: number, qty: number) => {
    setCart((prev) => {
      const next = new Map(prev);
      if (qty <= 0) next.delete(productId);
      else next.set(productId, qty);
      return next;
    });
  }, []);

  const remove = useCallback((productId: number) => {
    setCart((prev) => {
      const next = new Map(prev);
      next.delete(productId);
      return next;
    });
  }, []);

  const clear = useCallback(() => setCart(new Map()), []);

  const totalItems = Array.from(cart.values()).reduce((s, q) => s + q, 0);

  return { cart, add, update, remove, clear, totalItems };
}

export function getCartProducts(
  cart: Map<number, number>,
  products: StoreProduct[]
): { product: StoreProduct; quantity: number }[] {
  const items: { product: StoreProduct; quantity: number }[] = [];
  cart.forEach((qty, id) => {
    const p = products.find((x) => x.id === id);
    if (p && qty > 0) items.push({ product: p, quantity: qty });
  });
  return items;
}
