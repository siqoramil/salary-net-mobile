import Constants from 'expo-constants';
import { Platform } from 'react-native';

const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, string | undefined>;

/**
 * Resolve API base URL.
 *
 * Priority:
 * 1. EXPO_PUBLIC_API_URL env var (set by user / .env)
 * 2. extra.API_URL from app.json
 * 3. Auto-detect from Expo dev server host (works on physical devices via Expo Go)
 * 4. Platform-aware localhost fallback (Android emulator uses 10.0.2.2)
 */
function resolveApiUrl(): string {
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL;
  if (extra.API_URL) return extra.API_URL;

  // Production builds MUST have an explicit API URL. Shipping a release
  // with localhost fallback would be a broken app; fail loudly at startup.
  if (!__DEV__) {
    throw new Error(
      'EXPO_PUBLIC_API_URL is not set. Production builds require an explicit API URL — ' +
        'set EXPO_PUBLIC_API_URL in .env before building.',
    );
  }

  // Expo dev server host: e.g. "192.168.1.5:8081"
  const hostUri =
    Constants.expoConfig?.hostUri ??
    (Constants as unknown as { manifest?: { debuggerHost?: string } }).manifest?.debuggerHost;
  if (hostUri && typeof hostUri === 'string') {
    const host = hostUri.split(':')[0];
    if (host && host !== 'localhost' && host !== '127.0.0.1') {
      return `http://${host}:4000/api/v1`;
    }
  }

  if (Platform.OS === 'android') return 'http://10.0.2.2:4000/api/v1';
  return 'http://localhost:4000/api/v1';
}

export const env = {
  API_URL: resolveApiUrl(),
};
