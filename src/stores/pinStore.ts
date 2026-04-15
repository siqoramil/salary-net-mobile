import { create } from 'zustand';
import { securePin } from '../lib/secureTokens';

interface PinState {
  hasPin: boolean;
  unlocked: boolean;
  setPin: (pin: string) => void;
  clearPin: () => void;
  verifyPin: (pin: string) => boolean;
  setUnlocked: (v: boolean) => void;
  hydrate: () => void;
}

// PIN is stored in SecureStore (Keychain / EncryptedSharedPreferences) so
// it is encrypted at rest and not readable from the app's sandboxed file
// system without OS-level entitlements. Comparison stays in-memory against
// the hydrated value.
export const usePinStore = create<PinState>((set) => ({
  hasPin: false,
  unlocked: false,

  setPin: (pin) => {
    securePin.set(pin);
    set({ hasPin: true, unlocked: true });
  },

  clearPin: () => {
    securePin.clear();
    set({ hasPin: false, unlocked: true });
  },

  verifyPin: (pin) => {
    const stored = securePin.get();
    if (stored && stored === pin) {
      set({ unlocked: true });
      return true;
    }
    return false;
  },

  setUnlocked: (v) => set({ unlocked: v }),

  hydrate: () => {
    const stored = securePin.get();
    const hasPin = !!stored && stored.length === 4;
    set({ hasPin, unlocked: !hasPin });
  },
}));
