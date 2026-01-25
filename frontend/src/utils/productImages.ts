/**
 * URLs de imágenes de productos y servicios
 * Usando Unsplash con fotos específicas relevantes a cada tipo de producto
 */

// Imágenes para suplementos de colágeno
export const COLLAGEN_IMAGES = [
  'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=500&h=500&fit=crop&q=80',
  'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&h=500&fit=crop&q=80',
  'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=500&h=500&fit=crop&q=80',
  'https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?w=500&h=500&fit=crop&q=80',
  'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=500&h=500&fit=crop&q=80',
];

// Imágenes para suplementos articulares
export const JOINT_IMAGES = [
  'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&h=500&fit=crop&q=80',
  'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=500&h=500&fit=crop&q=80',
  'https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?w=500&h=500&fit=crop&q=80',
  'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=500&h=500&fit=crop&q=80',
];

// Imágenes para antioxidantes
export const ANTIOXIDANT_IMAGES = [
  'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&h=500&fit=crop&q=80',
  'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=500&h=500&fit=crop&q=80',
  'https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?w=500&h=500&fit=crop&q=80',
  'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=500&h=500&fit=crop&q=80',
];

// Imágenes para sérums y cuidado de la piel
export const SERUM_IMAGES = [
  'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=500&h=500&fit=crop&q=80',
  'https://images.unsplash.com/photo-1571875257727-256c39da42af?w=500&h=500&fit=crop&q=80',
  'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=500&h=500&fit=crop&q=80',
  'https://images.unsplash.com/photo-1612817288484-6f916006741a?w=500&h=500&fit=crop&q=80',
];

// Imágenes para productos capilares
export const HAIR_IMAGES = [
  'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=500&h=500&fit=crop&q=80',
  'https://images.unsplash.com/photo-1571875257727-256c39da42af?w=500&h=500&fit=crop&q=80',
  'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=500&h=500&fit=crop&q=80',
];

// Imágenes para suplementos nutricionales
export const NUTRITION_IMAGES = [
  'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&h=500&fit=crop&q=80',
  'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=500&h=500&fit=crop&q=80',
  'https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?w=500&h=500&fit=crop&q=80',
  'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=500&h=500&fit=crop&q=80',
];

// Imágenes para tratamientos faciales
export const FACIAL_TREATMENT_IMAGES = [
  'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=500&h=500&fit=crop&q=80',
  'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=500&h=500&fit=crop&q=80',
  'https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=500&h=500&fit=crop&q=80',
  'https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=500&h=500&fit=crop&q=80',
];

// Imágenes para tratamientos corporales
export const BODY_TREATMENT_IMAGES = [
  'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=500&h=500&fit=crop&q=80',
  'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=500&h=500&fit=crop&q=80',
  'https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=500&h=500&fit=crop&q=80',
  'https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=500&h=500&fit=crop&q=80',
];

// Función helper para obtener imagen según el tipo de producto
export const getProductImage = (productName: string, category: string): string => {
  const name = productName.toLowerCase();
  
  // Colágeno
  if (name.includes('colágeno') || name.includes('peptidos')) {
    return COLLAGEN_IMAGES[Math.floor(Math.random() * COLLAGEN_IMAGES.length)];
  }
  
  // Articular
  if (name.includes('glucosamina') || name.includes('condroitina') || name.includes('articular') || name.includes('msm')) {
    return JOINT_IMAGES[Math.floor(Math.random() * JOINT_IMAGES.length)];
  }
  
  // Antioxidantes
  if (name.includes('resveratrol') || name.includes('q10') || name.includes('nmn') || name.includes('antioxidante')) {
    return ANTIOXIDANT_IMAGES[Math.floor(Math.random() * ANTIOXIDANT_IMAGES.length)];
  }
  
  // Sérums
  if (name.includes('sérum') || name.includes('serum') || category.includes('Sérums')) {
    return SERUM_IMAGES[Math.floor(Math.random() * SERUM_IMAGES.length)];
  }
  
  // Capilar
  if (name.includes('capilar') || name.includes('hair') || name.includes('shampoo') || name.includes('biotina')) {
    return HAIR_IMAGES[Math.floor(Math.random() * HAIR_IMAGES.length)];
  }
  
  // Nutricionales
  if (name.includes('omega') || name.includes('magnesio') || name.includes('zinc') || name.includes('vitamina') || name.includes('probiotico')) {
    return NUTRITION_IMAGES[Math.floor(Math.random() * NUTRITION_IMAGES.length)];
  }
  
  // Default: suplemento genérico
  return COLLAGEN_IMAGES[0];
};

// Función helper para obtener imagen de servicio
export const getServiceImage = (serviceName: string, categoryId: string): string => {
  if (categoryId === 'facial') {
    return FACIAL_TREATMENT_IMAGES[Math.floor(Math.random() * FACIAL_TREATMENT_IMAGES.length)];
  }
  if (categoryId === 'corporal') {
    return BODY_TREATMENT_IMAGES[Math.floor(Math.random() * BODY_TREATMENT_IMAGES.length)];
  }
  return FACIAL_TREATMENT_IMAGES[0];
};
