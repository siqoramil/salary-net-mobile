// In-memory AsyncStorage stub. Mirrors the subset of the real API that
// src/lib/storage.ts and src/lib/secureTokens.ts actually call.

let store = new Map<string, string>();

const AsyncStorage = {
  async getItem(key: string): Promise<string | null> {
    return store.has(key) ? store.get(key)! : null;
  },
  async setItem(key: string, value: string): Promise<void> {
    store.set(key, value);
  },
  async removeItem(key: string): Promise<void> {
    store.delete(key);
  },
  async clear(): Promise<void> {
    store.clear();
  },
  async getAllKeys(): Promise<string[]> {
    return Array.from(store.keys());
  },
  async multiGet(keys: string[]): Promise<[string, string | null][]> {
    return keys.map((k) => [k, store.has(k) ? store.get(k)! : null]);
  },
  // Test-only helper so specs can reset between runs
  __reset(): void {
    store = new Map();
  },
};

export default AsyncStorage;
