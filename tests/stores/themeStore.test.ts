import { describe, it, expect, beforeEach } from 'vitest';
import { useThemeStore } from '../../src/stores/themeStore';
import { storage, StorageKeys } from '../../src/lib/storage';
import { Appearance } from '../mocks/react-native';
import AsyncStorageStub from '../mocks/async-storage';

describe('useThemeStore', () => {
  beforeEach(() => {
    AsyncStorageStub.__reset();
    Appearance.__reset();
    useThemeStore.setState({ mode: 'system', resolved: 'light' });
  });

  it('setMode persists + resolves to explicit mode', () => {
    useThemeStore.getState().setMode('dark');
    expect(useThemeStore.getState().mode).toBe('dark');
    expect(useThemeStore.getState().resolved).toBe('dark');
    expect(storage.getString(StorageKeys.THEME)).toBe('dark');
  });

  it('setMode("system") resolves against Appearance.getColorScheme', () => {
    Appearance.__set('dark');
    useThemeStore.getState().setMode('system');
    expect(useThemeStore.getState().resolved).toBe('dark');
  });

  it('hydrate reads persisted theme and responds to appearance changes while in system mode', () => {
    storage.set(StorageKeys.THEME, 'system');
    Appearance.__set('light');
    useThemeStore.getState().hydrate();
    expect(useThemeStore.getState().mode).toBe('system');
    expect(useThemeStore.getState().resolved).toBe('light');

    // OS flips to dark — system-mode should follow it.
    Appearance.__set('dark');
    expect(useThemeStore.getState().resolved).toBe('dark');
  });

  it('appearance changes are ignored when user picked a fixed mode', () => {
    useThemeStore.getState().setMode('light');
    useThemeStore.getState().hydrate();
    Appearance.__set('dark');
    expect(useThemeStore.getState().resolved).toBe('light');
  });
});
