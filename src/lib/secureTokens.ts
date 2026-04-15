import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

/**
 * Secure storage for tokens, user PII, and the PIN code.
 *
 * On iOS this uses the Keychain, on Android EncryptedSharedPreferences.
 * Values are cached in memory so consumers can read them synchronously
 * after `hydrateTokens()` has run once at boot.
 */

const KEYS = {
  ACCESS: 'auth.accessToken',
  REFRESH: 'auth.refreshToken',
  USER: 'auth.user',
  PIN: 'app.pinCode',
} as const;

// Legacy AsyncStorage keys that previous versions used. Kept so we can
// migrate and then wipe them.
const LEGACY_USER_KEY = 'auth.user';
const LEGACY_PIN_KEY = 'app.pinCode';

const memCache: Record<string, string | null> = {
  [KEYS.ACCESS]: null,
  [KEYS.REFRESH]: null,
  [KEYS.USER]: null,
  [KEYS.PIN]: null,
};

let hydrated = false;

/**
 * One-shot migration: previous versions stored tokens, user profile, and
 * the PIN in AsyncStorage. Move anything found into SecureStore and then
 * delete the plaintext copies. Safe to run every boot — does nothing once
 * the values already live in SecureStore.
 */
async function migrateFromAsyncStorage(): Promise<void> {
  try {
    const [rawAccess, rawRefresh, rawUser, rawPin] = await Promise.all([
      AsyncStorage.getItem(KEYS.ACCESS),
      AsyncStorage.getItem(KEYS.REFRESH),
      AsyncStorage.getItem(LEGACY_USER_KEY),
      AsyncStorage.getItem(LEGACY_PIN_KEY),
    ]);

    const pairs: Array<[keyof typeof KEYS, string | null]> = [
      ['ACCESS', rawAccess ? stripQuotes(rawAccess) : null],
      ['REFRESH', rawRefresh ? stripQuotes(rawRefresh) : null],
      ['USER', rawUser ? unwrapJson(rawUser) : null],
      ['PIN', rawPin ? stripQuotes(rawPin) : null],
    ];

    for (const [name, value] of pairs) {
      if (!value) continue;
      const key = KEYS[name];
      await SecureStore.setItemAsync(key, value).catch(() => {});
      memCache[key] = value;
    }

    await Promise.all([
      rawAccess ? AsyncStorage.removeItem(KEYS.ACCESS) : Promise.resolve(),
      rawRefresh ? AsyncStorage.removeItem(KEYS.REFRESH) : Promise.resolve(),
      rawUser ? AsyncStorage.removeItem(LEGACY_USER_KEY) : Promise.resolve(),
      rawPin ? AsyncStorage.removeItem(LEGACY_PIN_KEY) : Promise.resolve(),
    ]);
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

// User is stored as a JSON-encoded object. AsyncStorage previously wrote it
// double-encoded (the sync-facade JSON.stringify wrapped an already-stringified
// object), so unwrap one layer if needed and always return a JSON string.
function unwrapJson(raw: string): string | null {
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed === 'string') {
      // double-encoded
      try {
        JSON.parse(parsed);
        return parsed;
      } catch {
        return null;
      }
    }
    if (parsed && typeof parsed === 'object') return JSON.stringify(parsed);
    return null;
  } catch {
    return null;
  }
}

export async function hydrateTokens(): Promise<void> {
  if (hydrated) return;
  try {
    const [access, refresh, user, pin] = await Promise.all([
      SecureStore.getItemAsync(KEYS.ACCESS),
      SecureStore.getItemAsync(KEYS.REFRESH),
      SecureStore.getItemAsync(KEYS.USER),
      SecureStore.getItemAsync(KEYS.PIN),
    ]);
    memCache[KEYS.ACCESS] = access;
    memCache[KEYS.REFRESH] = refresh;
    memCache[KEYS.USER] = user;
    memCache[KEYS.PIN] = pin;
  } catch {
    // SecureStore can throw on some devices; treat as "nothing stored".
  }
  // If nothing is in SecureStore yet, attempt a one-time migration from
  // the old AsyncStorage layout.
  const allEmpty =
    !memCache[KEYS.ACCESS] &&
    !memCache[KEYS.REFRESH] &&
    !memCache[KEYS.USER] &&
    !memCache[KEYS.PIN];
  if (allEmpty) {
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
    memCache[KEYS.USER] = null;
    void SecureStore.deleteItemAsync(KEYS.ACCESS).catch(() => {});
    void SecureStore.deleteItemAsync(KEYS.REFRESH).catch(() => {});
    void SecureStore.deleteItemAsync(KEYS.USER).catch(() => {});
  },
};

// PII (user profile) lives alongside tokens — stored in SecureStore,
// returned synchronously after hydration so zustand selectors stay sync.
export const secureUser = {
  get(): string | null {
    return memCache[KEYS.USER];
  },
  set(value: string): void {
    memCache[KEYS.USER] = value;
    void SecureStore.setItemAsync(KEYS.USER, value).catch(() => {});
  },
  clear(): void {
    memCache[KEYS.USER] = null;
    void SecureStore.deleteItemAsync(KEYS.USER).catch(() => {});
  },
};

export const securePin = {
  get(): string | null {
    return memCache[KEYS.PIN];
  },
  set(value: string): void {
    memCache[KEYS.PIN] = value;
    void SecureStore.setItemAsync(KEYS.PIN, value).catch(() => {});
  },
  clear(): void {
    memCache[KEYS.PIN] = null;
    void SecureStore.deleteItemAsync(KEYS.PIN).catch(() => {});
  },
};
