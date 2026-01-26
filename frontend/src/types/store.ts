/**
 * Tipos y datos mock para el prototipo de Tienda y Servicios.
 * Sin conexión a BD ni al sistema kiosk.
 * Productos de Medicina Regenerativa con imágenes reales.
 */

// Importar imágenes de productos reales
import AliviumImg from '../assets/products/Alivium.jpg';
import AquamineralesImg from '../assets/products/aquaminerales_Mesa_de_trabajo_1_copia_6.jpg';
import NanoCobreImg from '../assets/products/ionescobre_Mesa_de_trabajo_1.jpg';
import NanoExomImg from '../assets/products/Nano-exom.jpg';
import SalesImg from '../assets/products/Sales.jpg';
import Shot5Img from '../assets/products/Shot5-1.jpg';

export type ItemType = 'product' | 'service';

export interface StoreProduct {
  id: number;
  name: string;
  price: number;
  originalPrice?: number;
  image?: string;
  description: string;
  stock: number;
  category: string;
  categoryId: string; // ID de categoría de Clínica CAMSA
  type: 'product';
}

export interface StoreCategory {
  id: string;
  name: string;
  icon?: string; // Icono para la categoría
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
  categoryId: string; // ID de categoría de Clínica CAMSA
  type: 'service';
}

// Tipo unificado para productos y servicios
export type StoreItem = StoreProduct | Service;

/** Cupones de ejemplo: CAMSA10 (10%), CAMSA20 (20%) */
export const MOCK_COUPONS: StoreCoupon[] = [
  { code: 'CAMSA10', discountPercent: 10 },
  { code: 'CAMSA20', discountPercent: 20 },
];

export const MOCK_PRODUCTS: StoreProduct[] = [
  // PRODUCTOS REALES DE CLÍNICA CAMSA (1-6)
  {
    id: 1,
    name: 'Alivium',
    price: 899.00,
    originalPrice: 1099.00,
    image: AliviumImg,
    description: 'Suplemento regenerativo avanzado para alivio y regeneración celular profunda.',
    stock: 45,
    category: 'Suplementos',
    categoryId: 'suplementos',
    type: 'product',
  },
  {
    id: 2,
    name: 'Aquaminerales',
    price: 1299.00,
    image: AquamineralesImg,
    description: 'Minerales marinos esenciales para regeneración y salud celular óptima.',
    stock: 32,
    category: 'Suplementos',
    categoryId: 'suplementos',
    type: 'product',
  },
  {
    id: 3,
    name: 'Nano Partículas de Cobre',
    price: 1599.00,
    originalPrice: 1899.00,
    image: NanoCobreImg,
    description: 'Nanopartículas de cobre para regeneración celular avanzada y anti-envejecimiento.',
    stock: 28,
    category: 'Suplementos',
    categoryId: 'suplementos',
    type: 'product',
  },
  {
    id: 4,
    name: 'NanoExom',
    price: 1199.00,
    image: NanoExomImg,
    description: 'Tecnología de exosomas en nanopartículas para regeneración celular profunda y rejuvenecimiento.',
    stock: 40,
    category: 'Suplementos',
    categoryId: 'suplementos',
    type: 'product',
  },
  {
    id: 5,
    name: 'Sales Regenerativas',
    price: 1099.00,
    image: SalesImg,
    description: 'Sales minerales esenciales para equilibrio y regeneración del organismo.',
    stock: 55,
    category: 'Suplementos',
    categoryId: 'suplementos',
    type: 'product',
  },
  {
    id: 6,
    name: 'Shot 5',
    price: 1899.00,
    image: Shot5Img,
    description: 'Complejo regenerativo premium con 5 componentes activos para máxima eficacia celular.',
    stock: 20,
    category: 'Suplementos',
    categoryId: 'suplementos',
    type: 'product',
  },
];

export const MOCK_CATEGORIES: StoreCategory[] = [
  { id: 'all', name: 'Todos', icon: '▦' },
  { id: 'facial', name: 'Tratamientos Faciales', icon: '✨' },
  { id: 'corporal', name: 'Tratamientos Corporales', icon: '❤️' },
  { id: 'suplementos', name: 'Suplementos', icon: '🔗' },
  { id: 'cuidado-casa', name: 'Cuidado en Casa', icon: '🏠' },
];

/** Días en formato corto para CalendarPicker (Lun, Mar, Mié, Jue, Vie, Sáb) */
export const MOCK_SERVICES: Service[] = [
  {
    id: 1,
    name: 'Tratamiento PRP Facial',
    price: 450.0,
    description: 'Sesión de plasma rico en plaquetas para rejuvenecimiento facial y regeneración celular.',
    duration: 60,
    availableDays: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'],
    timeSlots: ['9:00', '10:00', '11:00', '14:00', '15:00', '16:00'],
    categoryId: 'facial',
    type: 'service',
    image: 'https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=500&h=500&fit=crop&q=80&auto=format',
  },
  {
    id: 2,
    name: 'Mesoterapia Corporal',
    price: 320.0,
    description: 'Tratamiento de mesoterapia para reducción de celulitis y reafirmación de la piel.',
    duration: 45,
    availableDays: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'],
    timeSlots: ['9:00', '10:30', '12:00', '14:00', '15:30', '16:00'],
    categoryId: 'corporal',
    type: 'service',
    image: 'https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=500&h=500&fit=crop&q=80&auto=format',
  },
  {
    id: 3,
    name: 'Peeling Regenerativo',
    price: 180.0,
    description: 'Peeling químico con ácidos orgánicos para renovación celular y mejora de la textura.',
    duration: 30,
    availableDays: ['Lun', 'Mié', 'Vie'],
    timeSlots: ['9:00', '10:00', '11:00', '14:00', '15:00'],
    categoryId: 'facial',
    type: 'service',
    image: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=500&h=500&fit=crop&q=80&auto=format',
  },
  {
    id: 4,
    name: 'Radiofrecuencia Facial',
    price: 250.0,
    description: 'Sesión de radiofrecuencia para tensado y rejuvenecimiento facial no invasivo.',
    duration: 45,
    availableDays: ['Mar', 'Jue', 'Sáb'],
    timeSlots: ['9:00', '10:30', '12:00', '14:00', '15:30'],
    categoryId: 'facial',
    type: 'service',
    image: 'https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=500&h=500&fit=crop&q=80&auto=format',
  },
  {
    id: 5,
    name: 'Terapia con Células Madre',
    price: 1200.0,
    description: 'Tratamiento avanzado con células madre para regeneración profunda y rejuvenecimiento.',
    duration: 90,
    availableDays: ['Lun', 'Mié', 'Vie'],
    timeSlots: ['9:00', '11:00', '14:00', '16:00'],
    categoryId: 'corporal',
    type: 'service',
    image: 'https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=500&h=500&fit=crop&q=80&auto=format',
  },
  {
    id: 6,
    name: 'Carboxiterapia Corporal',
    price: 220.0,
    description: 'Tratamiento con dióxido de carbono para mejorar circulación y reducir grasa localizada.',
    duration: 30,
    availableDays: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'],
    timeSlots: ['9:00', '10:00', '11:00', '14:00', '15:00', '16:00'],
    categoryId: 'corporal',
    type: 'service',
    image: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=500&h=500&fit=crop&q=80&auto=format',
  },
];
