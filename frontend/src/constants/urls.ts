/**
 * External URLs - opens in new tab without affecting kiosk flow
 */
export const TIENDA_CAMSA_URL = 'https://camsashop.com';
export const RESTAURANTES_CAMSA_URL = 'https://tienda-camsa-production.up.railway.app/restaurantes';

/**
 * YouTube video IDs used by kiosk commercial landing.
 * Priority: env variable, then fallback IDs below.
 *
 * Configure env as:
 * VITE_KIOSK_LANDING_YOUTUBE_IDS=id1,id2,id3
 */
const envVideoIds = (import.meta.env.VITE_KIOSK_LANDING_YOUTUBE_IDS || '')
  .split(',')
  .map((id: string) => id.trim())
  .filter(Boolean);

const fallbackVideoIds = [
  'FKRxvkO7BO4',
  'puNTSPXyrrQ',
];

export const KIOSK_LANDING_VIDEO_IDS = envVideoIds.length > 0 ? envVideoIds : fallbackVideoIds;

/** Path donde el frontend sirve los íconos de productos del kiosk (copia en public/media/category-icons). */
const CATEGORY_ICONS_PATH = '/media/category-icons';

/**
 * Devuelve la URL de un ícono de producto para el kiosk.
 * En producción las imágenes se sirven desde el mismo frontend (public/media/category-icons).
 */
export const getProductImageUrl = (filename: string): string =>
  `${CATEGORY_ICONS_PATH}/${filename}`;

/**
 * Imágenes de productos para los círculos del kiosk (landing y página de pedidos).
 * Se sirven desde el frontend: public/media/category-icons/
 */
export const KIOSK_PRODUCT_IMAGES: { label: string; filename: string }[] = [
  { label: 'Acuaminerales', filename: 'ACUAMINERALES.png' },
  { label: 'Nanopartículas', filename: 'MANOPARTICULASDECOBREIONICO.png' },
  { label: 'Nano exom', filename: 'Nano-exom.png' },
  { label: 'Nasagest', filename: 'NASAGEST.png' },
  { label: 'Sales', filename: 'SALES.png' },
  { label: 'Shot 5', filename: 'Shot5-2.png' },
];

export const getYoutubeEmbedUrl = (videoId: string): string => {
  const params = new URLSearchParams({
    autoplay: '1',
    mute: '1',
    controls: '0',
    rel: '0',
    modestbranding: '1',
    loop: '1',
    playlist: videoId,
    playsinline: '1',
  });

  return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
};
