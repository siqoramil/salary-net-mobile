import { create } from 'zustand';
import { Appearance } from 'react-native';
import { storage, StorageKeys } from '../lib/storage';

export type ThemeMode = 'system' | 'light' | 'dark';

interface ThemeState {
  mode: ThemeMode;
  resolved: 'light' | 'dark';
  hydrate: () => void;
  setMode: (mode: ThemeMode) => void;
}

function resolve(mode: ThemeMode): 'light' | 'dark' {
  if (mode === 'system') return Appearance.getColorScheme() ?? 'light';
  return mode;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  mode: 'system',
  resolved: Appearance.getColorScheme() ?? 'light',
  hydrate: () => {
    const stored = (storage.getString(StorageKeys.THEME) as ThemeMode | undefined) ?? 'system';
    set({ mode: stored, resolved: resolve(stored) });

    Appearance.addChangeListener(({ colorScheme }) => {
      if (get().mode === 'system') {
        set({ resolved: colorScheme ?? 'light' });
      }
    });
  },
  setMode: (mode) => {
    storage.set(StorageKeys.THEME, mode);
    set({ mode, resolved: resolve(mode) });
  },
}));
