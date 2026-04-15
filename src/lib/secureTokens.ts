import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

/**
 * Secure storage for access/refresh tokens.
 *
 * On iOS this uses the Keychain, on Android EncryptedSharedPreferences.
 * Tokens are cached in memory so consumers can read them synchronously
 * after `hydrateTokens()` has run once at boot.
 */

const KEYS = {
  ACCESS: 'auth.accessToken',
  REFRESH: 'auth.refreshToken',
} as const;

const memCache: Record<string, string | null> = {
  [KEYS.ACCESS]: null,
  [KEYS.REFRESH]: null,
};

let hydrated = false;

/**
 * One-shot migration: previous versions stored tokens in AsyncStorage under
 * the same key names. Move them into secure storage, then delete the plain
 * copies. Safe to run every boot — does nothing once tokens already live in
 * SecureStore.
 */
async function migrateFromAsyncStorage(): Promise<void> {
  try {
    const rawAccess = await AsyncStorage.getItem(KEYS.ACCESS);
    const rawRefresh = await AsyncStorage.getItem(KEYS.REFRESH);
    const access = rawAccess ? stripQuotes(rawAccess) : null;
    const refresh = rawRefresh ? stripQuotes(rawRefresh) : null;
    if (access) {
      await SecureStore.setItemAsync(KEYS.ACCESS, access).catch(() => {});
      memCache[KEYS.ACCESS] = access;
      await AsyncStorage.removeItem(KEYS.ACCESS).catch(() => {});
    }
    if (refresh) {
      await SecureStore.setItemAsync(KEYS.REFRESH, refresh).catch(() => {});
      memCache[KEYS.REFRESH] = refresh;
      await AsyncStorage.removeItem(KEYS.REFRESH).catch(() => {});
    }
  } catch {
    // ignore — migration is best-effort
  }
}

function stripQuotes(raw: string): string {
  // storage.set() JSON-encoded strings, so we might see '"abc"' — unwrap.
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed === 'string' ? parsed : raw;
  } catch {
    return raw;
  }
}

export async function hydrateTokens(): Promise<void> {
  if (hydrated) return;
  try {
    memCache[KEYS.ACCESS] = await SecureStore.getItemAsync(KEYS.ACCESS);
    memCache[KEYS.REFRESH] = await SecureStore.getItemAsync(KEYS.REFRESH);
  } catch {
    // SecureStore can throw on some devices; treat as "no token".
  }
  if (!memCache[KEYS.ACCESS] && !memCache[KEYS.REFRESH]) {
    await migrateFromAsyncStorage();
  }
  hydrated = true;
}

export const secureTokens = {
  getAccess(): string | null {
    return memCache[KEYS.ACCESS];
  },
  getRefresh(): string | null {
    return memCache[KEYS.REFRESH];
  },
  setAccess(value: string): void {
    memCache[KEYS.ACCESS] = value;
    void SecureStore.setItemAsync(KEYS.ACCESS, value).catch(() => {});
  },
  setRefresh(value: string): void {
    memCache[KEYS.REFRESH] = value;
    void SecureStore.setItemAsync(KEYS.REFRESH, value).catch(() => {});
  },
  clear(): void {
    memCache[KEYS.ACCESS] = null;
    memCache[KEYS.REFRESH] = null;
    void SecureStore.deleteItemAsync(KEYS.ACCESS).catch(() => {});
    void SecureStore.deleteItemAsync(KEYS.REFRESH).catch(() => {});
  },
};
