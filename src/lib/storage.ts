import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Sync facade over AsyncStorage.
 *
 * AsyncStorage is async-only, but our consumers (auth store, theme store, i18n)
 * were written against MMKV's sync API. Instead of refactoring every callsite,
 * we keep an in-memory cache that mirrors AsyncStorage. The app must call
 * `hydrateStorage()` once at boot before reading anything.
 */

const cache = new Map<string, string | boolean | number>();
let hydrated = false;

export async function hydrateStorage(): Promise<void> {
  if (hydrated) return;
  try {
    const keys = await AsyncStorage.getAllKeys();
    if (keys.length > 0) {
      const entries = await AsyncStorage.multiGet([...keys]);
      for (const [k, raw] of entries) {
        if (raw == null) continue;
        try {
          cache.set(k, JSON.parse(raw));
        } catch {
          cache.set(k, raw);
        }
      }
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('Storage hydration failed', err);
  }
  hydrated = true;
}

export const storage = {
  getString(key: string): string | undefined {
    const v = cache.get(key);
    return typeof v === 'string' ? v : undefined;
  },
  getBoolean(key: string): boolean | undefined {
    const v = cache.get(key);
    return typeof v === 'boolean' ? v : undefined;
  },
  getNumber(key: string): number | undefined {
    const v = cache.get(key);
    return typeof v === 'number' ? v : undefined;
  },
  set(key: string, value: string | boolean | number): void {
    cache.set(key, value);
    void AsyncStorage.setItem(key, JSON.stringify(value));
  },
  delete(key: string): void {
    cache.delete(key);
    void AsyncStorage.removeItem(key);
  },
  clearAll(): void {
    cache.clear();
    void AsyncStorage.clear();
  },
};

export const StorageKeys = {
  ACCESS_TOKEN: 'auth.accessToken',
  REFRESH_TOKEN: 'auth.refreshToken',
  USER: 'auth.user',
  HAS_SEEN_ONBOARDING: 'app.hasSeenOnboarding',
  LOCALE: 'app.locale',
  THEME: 'app.theme',
} as const;
