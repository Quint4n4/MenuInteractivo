import { useState, useCallback, useEffect, useMemo } from 'react';
import type { StoreProduct, Service, StoreItem } from '../types/store';

/** localStorage key solo para el prototipo de tienda. No usa kiosk_cart. */
const STORE_PROTOTYPE_CART_KEY = 'store_prototype_cart';

export interface CartItem {
  itemId: number;
  type: 'product' | 'service';
  quantity: number;
  // Para servicios con reservación
  reservationDate?: Date | null;
  reservationTime?: string | null;
  reservationNotes?: string;
}

export function useStoreCart() {
  const [cart, setCart] = useState<Map<number, CartItem>>(() => {
    try {
      const stored = localStorage.getItem(STORE_PROTOTYPE_CART_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const map = new Map<number, CartItem>();
        Object.entries(parsed).forEach(([key, value]: [string, any]) => {
          const item: CartItem = {
            ...value,
            reservationDate: value.reservationDate ? new Date(value.reservationDate) : null,
          };
          map.set(Number(key), item);
        });
        return map;
      }
    } catch (e) {
      console.error('Error loading store prototype cart:', e);
    }
    return new Map();
  });

  // Force re-render when cart changes by using a version counter
  const [cartVersion, setCartVersion] = useState(0);

  useEffect(() => {
    if (cart.size > 0) {
      const serializable: Record<string, any> = {};
      cart.forEach((item, id) => {
        serializable[id] = {
          ...item,
          reservationDate: item.reservationDate?.toISOString() || null,
        };
      });
      localStorage.setItem(STORE_PROTOTYPE_CART_KEY, JSON.stringify(serializable));
    } else {
      localStorage.removeItem(STORE_PROTOTYPE_CART_KEY);
    }
  }, [cart]);

  const add = useCallback((itemId: number, qty = 1, type: 'product' | 'service' = 'product') => {
    setCart((prev) => {
      const next = new Map(prev);
      const existing = next.get(itemId);
      if (existing) {
        next.set(itemId, { ...existing, quantity: existing.quantity + qty });
      } else {
        next.set(itemId, { itemId, type, quantity: qty });
      }
      setCartVersion((v) => v + 1);
      return next;
    });
  }, []);

  const addServiceWithReservation = useCallback((
    serviceId: number,
    date: Date,
    timeSlot: string,
    notes?: string
  ) => {
    setCart((prev) => {
      const next = new Map(prev);
      next.set(serviceId, {
        itemId: serviceId,
        type: 'service',
        quantity: 1,
        reservationDate: date,
        reservationTime: timeSlot,
        reservationNotes: notes,
      });
      setCartVersion((v) => v + 1);
      return next;
    });
  }, []);

  const update = useCallback((itemId: number, qty: number) => {
    setCart((prev) => {
      const next = new Map(prev);
      const existing = next.get(itemId);
      if (!existing) return next;
      if (qty <= 0) {
        next.delete(itemId);
      } else {
        next.set(itemId, { ...existing, quantity: qty });
      }
      setCartVersion((v) => v + 1);
      return next;
    });
  }, []);

  const remove = useCallback((itemId: number) => {
    setCart((prev) => {
      const next = new Map(prev);
      next.delete(itemId);
      setCartVersion((v) => v + 1);
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    setCart(new Map());
    setCartVersion((v) => v + 1);
  }, []);

  // Recalculate totalItems when cart or cartVersion changes
  const totalItems = useMemo(() => {
    return Array.from(cart.values()).reduce((s, item) => s + item.quantity, 0);
  }, [cart, cartVersion]);

  // Include cartVersion in return to force re-renders in components that use cart
  return { cart, cartVersion, add, addServiceWithReservation, update, remove, clear, totalItems };
}

export function getCartItems(
  cart: Map<number, CartItem>,
  products: StoreProduct[],
  services: Service[]
): Array<{ item: StoreItem; quantity: number; reservationDate?: Date | null; reservationTime?: string | null; reservationNotes?: string }> {
  const items: Array<{ item: StoreItem; quantity: number; reservationDate?: Date | null; reservationTime?: string | null; reservationNotes?: string }> = [];
  cart.forEach((cartItem) => {
    if (cartItem.type === 'product') {
      const product = products.find((p) => p.id === cartItem.itemId);
      if (product) {
        items.push({ item: product, quantity: cartItem.quantity });
      }
    } else {
      const service = services.find((s) => s.id === cartItem.itemId);
      if (service) {
        items.push({
          item: service,
          quantity: cartItem.quantity,
          reservationDate: cartItem.reservationDate,
          reservationTime: cartItem.reservationTime,
          reservationNotes: cartItem.reservationNotes,
        });
      }
    }
  });
  return items;
}

// Función de compatibilidad para mantener código existente
export function getCartProducts(
  cart: Map<number, CartItem>,
  products: StoreProduct[]
): { product: StoreProduct; quantity: number }[] {
  const items: { product: StoreProduct; quantity: number }[] = [];
  cart.forEach((cartItem) => {
    if (cartItem.type === 'product') {
      const product = products.find((p) => p.id === cartItem.itemId);
      if (product) {
        items.push({ product, quantity: cartItem.quantity });
      }
    }
  });
  return items;
}
