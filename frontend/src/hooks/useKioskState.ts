import { useState, useEffect } from 'react';

interface KioskState {
  hasSeenWelcome: boolean;
  currentPatientId: number | null;
  lastActivityTimestamp: number;
}

const KIOSK_STATE_KEY = 'kiosk_state';
const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes

export const useKioskState = (deviceUid: string, currentPatientId: number | null) => {
  const storageKey = `${KIOSK_STATE_KEY}_${deviceUid}`;

  const getStoredState = (): KioskState | null => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (!stored) return null;

      const state: KioskState = JSON.parse(stored);

      // Check if state is still valid (not expired)
      const timeSinceLastActivity = Date.now() - state.lastActivityTimestamp;
      if (timeSinceLastActivity > INACTIVITY_TIMEOUT) {
        // State expired, clear it
        localStorage.removeItem(storageKey);
        return null;
      }

      // Check if patient has changed
      if (state.currentPatientId !== currentPatientId) {
        // Patient changed, reset state
        localStorage.removeItem(storageKey);
        return null;
      }

      return state;
    } catch (error) {
      console.error('Failed to parse kiosk state:', error);
      return null;
    }
  };

  const [hasSeenWelcome, setHasSeenWelcome] = useState<boolean>(() => {
    const stored = getStoredState();
    return stored?.hasSeenWelcome || false;
  });

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (currentPatientId === null) {
      // No patient assigned, clear state
      localStorage.removeItem(storageKey);
      setHasSeenWelcome(false);
      return;
    }

    const state: KioskState = {
      hasSeenWelcome,
      currentPatientId,
      lastActivityTimestamp: Date.now(),
    };

    localStorage.setItem(storageKey, JSON.stringify(state));
  }, [hasSeenWelcome, currentPatientId, storageKey]);

  // Update activity timestamp on user interaction
  const updateActivity = () => {
    const stored = getStoredState();
    if (stored && currentPatientId) {
      const state: KioskState = {
        ...stored,
        lastActivityTimestamp: Date.now(),
      };
      localStorage.setItem(storageKey, JSON.stringify(state));
    }
  };

  // Reset state (for when patient changes or session ends)
  const resetState = () => {
    localStorage.removeItem(storageKey);
    setHasSeenWelcome(false);
  };

  return {
    hasSeenWelcome,
    setHasSeenWelcome,
    updateActivity,
    resetState,
  };
};
