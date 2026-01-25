/**
 * Función para obtener URLs de imágenes relevantes para productos y servicios
 * Usa diferentes IDs de Unsplash para cada tipo de producto
 */

// IDs de fotos de Unsplash relevantes a diferentes tipos de productos
const PRODUCT_IMAGE_IDS = {
  // Suplementos de colágeno
  collagen: [
    '1607619056574-7b8d3ee536b2',
    '1608571423902-eed4a5ad8108',
    '1559056199-641a0ac8b55e',
    '1584308666744-24d5c474f2ae',
    '1607619056574-7b8d3ee536b2',
  ],
  // Sérums y cuidado de la piel
  serum: [
    '1571875257727-256c39da42af',
    '1620916566398-39f1143ab7be',
    '1556228578-0d85b1a4d571',
    '1612817288484-6f916006741a',
    '1571875257727-256c39da42af',
  ],
  // Tratamientos faciales
  facial: [
    '1559757148-5c350d0d3c56',
    '1605497788044-5a32c7078486',
    '1616394584738-fc6e612e71b9',
    '1570172619644-dfd03ed5d881',
  ],
  // Tratamientos corporales
  body: [
    '1559757148-5c350d0d3c56',
    '1605497788044-5a32c7078486',
    '1616394584738-fc6e612e71b9',
    '1570172619644-dfd03ed5d881',
  ],
  // Suplementos generales
  supplement: [
    '1607619056574-7b8d3ee536b2',
    '1608571423902-eed4a5ad8108',
    '1559056199-641a0ac8b55e',
    '1584308666744-24d5c474f2ae',
  ],
};

export const getProductImage = (productName: string, category: string, productId: number): string => {
  const name = productName.toLowerCase();
  let imageIds: string[] = PRODUCT_IMAGE_IDS.supplement;
  
  // Determinar tipo de imagen según el nombre y categoría
  if (name.includes('colágeno') || name.includes('peptidos') || name.includes('péptidos')) {
    imageIds = PRODUCT_IMAGE_IDS.collagen;
  } else if (name.includes('sérum') || name.includes('serum') || category.includes('Sérums')) {
    imageIds = PRODUCT_IMAGE_IDS.serum;
  } else if (name.includes('capilar') || name.includes('hair') || name.includes('shampoo')) {
    imageIds = PRODUCT_IMAGE_IDS.serum; // Usar imágenes de productos de cuidado
  }
  
  // Usar el ID del producto para seleccionar una imagen de forma consistente
  const imageId = imageIds[productId % imageIds.length];
  return `https://images.unsplash.com/photo-${imageId}?w=500&h=500&fit=crop&q=80`;
};

export const getServiceImage = (serviceName: string, categoryId: string, serviceId: number): string => {
  const imageIds = categoryId === 'facial' ? PRODUCT_IMAGE_IDS.facial : PRODUCT_IMAGE_IDS.body;
  const imageId = imageIds[serviceId % imageIds.length];
  return `https://images.unsplash.com/photo-${imageId}?w=500&h=500&fit=crop&q=80`;
};
