import { create } from 'zustand';
import { storage } from '../lib/storage';

const PIN_KEY = 'app.pinCode';

interface PinState {
  hasPin: boolean;
  unlocked: boolean;
  setPin: (pin: string) => void;
  clearPin: () => void;
  verifyPin: (pin: string) => boolean;
  setUnlocked: (v: boolean) => void;
  hydrate: () => void;
}

export const usePinStore = create<PinState>((set, get) => ({
  hasPin: false,
  unlocked: false,

  setPin: (pin) => {
    storage.set(PIN_KEY, pin);
    set({ hasPin: true, unlocked: true });
  },

  clearPin: () => {
    storage.delete(PIN_KEY);
    set({ hasPin: false, unlocked: true });
  },

  verifyPin: (pin) => {
    const stored = storage.getString(PIN_KEY);
    if (stored === pin) {
      set({ unlocked: true });
      return true;
    }
    return false;
  },

  setUnlocked: (v) => set({ unlocked: v }),

  hydrate: () => {
    const stored = storage.getString(PIN_KEY);
    const hasPin = !!stored && stored.length === 4;
    set({ hasPin, unlocked: !hasPin });
  },
}));
