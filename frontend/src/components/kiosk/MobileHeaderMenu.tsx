import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { colors } from '../../styles/colors';

export interface MobileHeaderMenuAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  badgeText?: string;
  disabled?: boolean;
  group?: 'navigation' | 'actions';
}

interface MobileHeaderMenuProps {
  actions: MobileHeaderMenuAction[];
  buttonLabel?: string;
}

export const MobileHeaderMenu: React.FC<MobileHeaderMenuProps> = ({
  actions,
  buttonLabel = 'Abrir menu',
}) => {
  const location = useLocation();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  const handleActionClick = (action: MobileHeaderMenuAction) => {
    if (action.disabled) return;
    action.onClick();
    setOpen(false);
  };

  return (
    <div style={styles.root}>
      <button
        type="button"
        aria-label={buttonLabel}
        onClick={() => setOpen((prev) => !prev)}
        style={styles.toggleButton}
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.button
              type="button"
              aria-label="Cerrar menu"
              style={styles.backdrop}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, y: -24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -24 }}
              transition={{ duration: 0.28, ease: 'easeOut' }}
              style={styles.panel}
              drag="y"
              dragConstraints={{ top: -40, bottom: 40 }}
              dragElastic={0.12}
              onDragEnd={(_, info) => {
                if (info.offset.y < -45 || info.velocity.y < -450) {
                  setOpen(false);
                }
              }}
            >
              <div style={styles.closeHint}>Desliza hacia arriba para cerrar</div>
              {(['navigation', 'actions'] as const).map((groupKey) => {
                const groupedActions = actions.filter((a) => (a.group || 'navigation') === groupKey);
                if (groupedActions.length === 0) return null;

                return (
                  <div key={groupKey} style={styles.group}>
                    <div style={styles.groupTitle}>{groupKey === 'navigation' ? 'Navegacion' : 'Acciones'}</div>
                    {groupedActions.map((action) => (
                      <button
                        key={action.id}
                        type="button"
                        onClick={() => handleActionClick(action)}
                        disabled={action.disabled}
                        style={{
                          ...styles.actionButton,
                          opacity: action.disabled ? 0.5 : 1,
                          cursor: action.disabled ? 'not-allowed' : 'pointer',
                        }}
                      >
                        <span style={styles.actionLeft}>
                          <span style={styles.iconWrap}>{action.icon}</span>
                          <span>{action.label}</span>
                        </span>
                        {action.badgeText && <span style={styles.badge}>{action.badgeText}</span>}
                      </button>
                    ))}
                  </div>
                );
              })}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  root: {
    position: 'relative',
    zIndex: 260,
  },
  toggleButton: {
    width: '44px',
    height: '44px',
    borderRadius: '10px',
    border: `1px solid ${colors.primary}`,
    backgroundColor: colors.white,
    color: colors.primaryDark,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    boxShadow: `0 2px 8px ${colors.shadow}`,
  },
  backdrop: {
    position: 'fixed',
    inset: 0,
    border: 'none',
    margin: 0,
    padding: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.22)',
    zIndex: 250,
    cursor: 'pointer',
  },
  panel: {
    position: 'fixed',
    top: '70px',
    // B6 fix: antes usaba left:50% + transform:translateX(-50%) para centrar,
    // pero framer-motion sobrescribe el transform al animar -> el panel se
    // corria a la derecha y el texto 'Desliza hacia arriba para cerrar' se
    // cortaba. Posicionar con left/right + margin:auto evita el conflicto.
    left: '12px',
    right: '12px',
    maxWidth: '380px',
    margin: '0 auto',
    maxHeight: 'calc(100vh - 120px)',
    overflowY: 'auto',
    backgroundColor: colors.white,
    border: `1px solid ${colors.parchment}`,
    borderRadius: '12px',
    padding: '8px',
    zIndex: 260,
    boxShadow: `0 10px 28px ${colors.shadowDark}`,
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  closeHint: {
    fontSize: '11px',
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: '2px',
  },
  group: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  groupTitle: {
    fontSize: '11px',
    fontWeight: 700,
    color: colors.textMuted,
    letterSpacing: '0.4px',
    textTransform: 'uppercase',
    padding: '2px 4px',
  },
  actionButton: {
    minHeight: '44px',
    borderRadius: '10px',
    border: `1px solid ${colors.parchment}`,
    backgroundColor: colors.ivory,
    color: colors.textPrimary,
    fontSize: '14px',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '10px',
    padding: '10px 12px',
  },
  actionLeft: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '10px',
  },
  iconWrap: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: colors.primaryDark,
  },
  badge: {
    minWidth: '20px',
    height: '20px',
    borderRadius: '10px',
    padding: '0 6px',
    backgroundColor: colors.primary,
    color: colors.white,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '11px',
    fontWeight: 700,
  },
};
