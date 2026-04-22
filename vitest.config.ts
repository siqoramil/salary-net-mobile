import { defineConfig } from 'vitest/config';
import path from 'node:path';

// We test pure logic (format helpers, zustand stores, lib helpers), not
// React Native components. React-native, expo-secure-store, and
// async-storage get stubbed in `tests/setup.ts` so imports resolve under
// Node without pulling in the native runtime.
export default defineConfig({
  test: {
    globals: false,
    environment: 'node',
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
    setupFiles: ['tests/setup.ts'],
    testTimeout: 10_000,
  },
  resolve: {
    alias: {
      '@react-native-async-storage/async-storage': path.resolve(
        __dirname,
        'tests/mocks/async-storage.ts',
      ),
      'expo-secure-store': path.resolve(__dirname, 'tests/mocks/secure-store.ts'),
      'react-native': path.resolve(__dirname, 'tests/mocks/react-native.ts'),
      i18next: path.resolve(__dirname, 'tests/mocks/i18next.ts'),
    },
  },
});
