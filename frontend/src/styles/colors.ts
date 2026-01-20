/**
 * Color palette for the Kiosk application
 * Elegant white and gold theme based on Clínica CAMSA branding
 */

export const colors = {
  // Primary colors (gold/dorado elegante)
  primary: '#C9A961',        // Dorado elegante cálido
  primaryLight: '#E5D4B1',   // Dorado claro cálido
  primaryDark: '#9E8142',    // Dorado oscuro cálido
  primaryMuted: '#E5D4B1',   // Dorado muy suave para fondos sutiles

  // Secondary gold tones
  gold: '#C9A961',
  goldLight: '#E5D4B1',
  goldDark: '#9E8142',
  goldGradientStart: '#E5D4B1',
  goldGradientEnd: '#9E8142',

  // Neutral colors
  white: '#FFFFFF',
  ivory: '#FBF9F7',          // Blanco cálido/marfil para fondos
  cream: '#FAF8F5',          // Crema suave
  black: '#2D2D2D',          // Negro suave, no tan duro
  gray: '#666666',
  grayLight: '#999999',
  grayBg: '#FAFAFA',         // Fondo gris muy claro
  grayDark: '#333333',

  // Text colors
  textPrimary: '#2D2D2D',
  textSecondary: '#666666',
  textMuted: '#999999',
  textGold: '#9E8142',

  // Status colors (mantenemos para funcionalidad)
  success: '#4CAF50',        // Verde más elegante
  error: '#E53935',          // Rojo más suave
  warning: '#FFA726',        // Naranja cálido
  info: '#42A5F5',           // Azul suave

  // Order status colors
  orderPlaced: '#E53935',
  orderPreparing: '#FFA726',
  orderReady: '#42A5F5',
  orderDelivered: '#4CAF50',
  orderCancelled: '#9E9E9E',

  // UI element colors
  border: '#E0E0E0',
  borderGold: '#C9A961',
  shadow: 'rgba(0, 0, 0, 0.08)',
  shadowMedium: 'rgba(0, 0, 0, 0.12)',
  shadowDark: 'rgba(0, 0, 0, 0.16)',
  shadowGold: 'rgba(201, 169, 97, 0.3)',
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayDark: 'rgba(0, 0, 0, 0.7)',
  overlayLight: 'rgba(255, 255, 255, 0.9)',
};

export const gradients = {
  // Gradiente dorado elegante (basado en el logo)
  gold: `linear-gradient(135deg, ${colors.goldGradientStart} 0%, ${colors.goldGradientEnd} 100%)`,
  goldVertical: `linear-gradient(180deg, ${colors.goldGradientStart} 0%, ${colors.goldGradientEnd} 100%)`,
  goldSubtle: `linear-gradient(135deg, ${colors.primaryMuted} 0%, ${colors.cream} 100%)`,

  // Fondos elegantes
  hero: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
  subtle: `linear-gradient(180deg, ${colors.white} 0%, ${colors.ivory} 100%)`,
  card: `linear-gradient(180deg, ${colors.white} 0%, ${colors.cream} 100%)`,
};

// Estilos de botones reutilizables
export const buttonStyles = {
  // Botón principal: blanco con borde dorado, hover dorado
  primary: {
    default: {
      backgroundColor: colors.white,
      color: colors.primary,
      border: `2px solid ${colors.primary}`,
    },
    hover: {
      backgroundColor: colors.primary,
      color: colors.white,
      border: `2px solid ${colors.primary}`,
    },
    active: {
      backgroundColor: colors.primaryDark,
      color: colors.white,
      border: `2px solid ${colors.primaryDark}`,
    },
  },
  // Botón secundario: dorado sólido
  secondary: {
    default: {
      backgroundColor: colors.primary,
      color: colors.white,
      border: `2px solid ${colors.primary}`,
    },
    hover: {
      backgroundColor: colors.primaryDark,
      color: colors.white,
      border: `2px solid ${colors.primaryDark}`,
    },
  },
  // Botón outline sutil
  outline: {
    default: {
      backgroundColor: 'transparent',
      color: colors.primary,
      border: `1px solid ${colors.primary}`,
    },
    hover: {
      backgroundColor: colors.primaryMuted,
      color: colors.primaryDark,
      border: `1px solid ${colors.primary}`,
    },
  },
};
