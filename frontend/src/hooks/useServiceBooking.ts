import { useState, useCallback } from 'react';
import type { Service } from '../types/store';

export interface BookingState {
  service: Service | null;
  date: Date | null;
  timeSlot: string | null;
  notes: string;
}

export function useServiceBooking() {
  const [state, setState] = useState<BookingState>({
    service: null,
    date: null,
    timeSlot: null,
    notes: '',
  });

  const setService = useCallback((s: Service | null) => {
    setState((prev) => ({ ...prev, service: s, date: null, timeSlot: null }));
  }, []);

  const setDate = useCallback((d: Date | null) => {
    setState((prev) => ({ ...prev, date: d, timeSlot: null }));
  }, []);

  const setTimeSlot = useCallback((t: string | null) => {
    setState((prev) => ({ ...prev, timeSlot: t }));
  }, []);

  const setNotes = useCallback((n: string) => {
    setState((prev) => ({ ...prev, notes: n }));
  }, []);

  const reset = useCallback(() => {
    setState({
      service: null,
      date: null,
      timeSlot: null,
      notes: '',
    });
  }, []);

  return {
    ...state,
    setService,
    setDate,
    setTimeSlot,
    setNotes,
    reset,
  };
}

/** Genera slots mock para un día (ej. próximos 7 días). */
export function getMockTimeSlotsForDate(
  _date: Date,
  service: Service
): string[] {
  return service.timeSlots;
}
