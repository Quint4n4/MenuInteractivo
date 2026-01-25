/**
 * Tipos y datos mock para el prototipo de Tienda y Servicios.
 * Sin conexión a BD ni al sistema kiosk.
 */

export interface StoreProduct {
  id: number;
  name: string;
  price: number;
  originalPrice?: number;
  image?: string;
  description: string;
  stock: number;
  category: string;
}

export interface StoreCategory {
  id: string;
  name: string;
}

export interface StoreCoupon {
  code: string;
  discountPercent: number;
}

export interface Service {
  id: number;
  name: string;
  price: number;
  image?: string;
  description: string;
  duration: number;
  availableDays: string[];
  timeSlots: string[];
}

/** Cupones de ejemplo: CAMSA10 (10%), CAMSA20 (20%) */
export const MOCK_COUPONS: StoreCoupon[] = [
  { code: 'CAMSA10', discountPercent: 10 },
  { code: 'CAMSA20', discountPercent: 20 },
];

export const MOCK_PRODUCTS: StoreProduct[] = [
  {
    id: 1,
    name: 'Kit de Cuidado Personal',
    price: 299.99,
    originalPrice: 349.99,
    description: 'Kit completo con productos esenciales para tu estancia.',
    stock: 50,
    category: 'Cuidado Personal',
  },
  {
    id: 2,
    name: 'Snack Saludable',
    price: 45.0,
    description: 'Barras de granola y frutos secos.',
    stock: 100,
    category: 'Snacks',
  },
  {
    id: 3,
    name: 'Agua Mineral 500ml',
    price: 25.0,
    description: 'Agua purificada.',
    stock: 200,
    category: 'Bebidas',
  },
  {
    id: 4,
    name: 'Jugo Natural',
    price: 55.0,
    description: 'Jugo de naranja o manzana recién exprimido.',
    stock: 80,
    category: 'Bebidas',
  },
  {
    id: 5,
    name: 'Toallas Desechables',
    price: 89.99,
    originalPrice: 99.99,
    description: 'Pack de 6 toallas húmedas.',
    stock: 60,
    category: 'Higiene',
  },
];

export const MOCK_CATEGORIES: StoreCategory[] = [
  { id: 'all', name: 'Todos' },
  { id: 'Cuidado Personal', name: 'Cuidado Personal' },
  { id: 'Snacks', name: 'Snacks' },
  { id: 'Bebidas', name: 'Bebidas' },
  { id: 'Higiene', name: 'Higiene' },
];

/** Días en formato corto para CalendarPicker (Lun, Mar, Mié, Jue, Vie, Sáb) */
export const MOCK_SERVICES: Service[] = [
  {
    id: 1,
    name: 'Consulta Médica General',
    price: 500.0,
    description: 'Consulta médica completa con especialista.',
    duration: 30,
    availableDays: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'],
    timeSlots: ['9:00', '10:00', '11:00', '14:00', '15:00', '16:00'],
  },
  {
    id: 2,
    name: 'Laboratorio Básico',
    price: 350.0,
    description: 'Estudios de laboratorio básicos.',
    duration: 45,
    availableDays: ['Lun', 'Mié', 'Vie'],
    timeSlots: ['8:00', '9:00', '10:00', '11:00'],
  },
  {
    id: 3,
    name: 'Terapia Física',
    price: 600.0,
    description: 'Sesión de rehabilitación o terapia física.',
    duration: 60,
    availableDays: ['Mar', 'Jue'],
    timeSlots: ['9:00', '10:30', '12:00', '16:00'],
  },
];
