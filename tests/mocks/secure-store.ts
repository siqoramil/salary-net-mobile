// In-memory expo-secure-store stub. Keychain/EncryptedSharedPreferences
// are unavailable under Node, so we simulate them with a Map.

let store = new Map<string, string>();

export async function getItemAsync(key: string): Promise<string | null> {
  return store.has(key) ? store.get(key)! : null;
}

export async function setItemAsync(key: string, value: string): Promise<void> {
  store.set(key, value);
}

export async function deleteItemAsync(key: string): Promise<void> {
  store.delete(key);
}

export function __reset(): void {
  store = new Map();
}
