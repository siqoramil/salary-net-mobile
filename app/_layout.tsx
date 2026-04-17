import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import {
  Stack,
  useRootNavigationState,
  useRouter,
  useSegments,
} from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClientProvider } from '@tanstack/react-query';
import { useColorScheme as useNwColorScheme } from 'nativewind';
import { I18nextProvider } from 'react-i18next';
import 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import '../global.css';
import i18n from '../src/lib/i18n';

import { queryClient } from '../src/lib/queryClient';
import { useAuthStore } from '../src/stores/authStore';
import { useThemeStore } from '../src/stores/themeStore';
import { useLocaleStore } from '../src/stores/localeStore';
import { LoadingSpinner } from '../src/components/ui/LoadingSpinner';
import { ToastHost } from '../src/components/ui/ToastHost';
import { ConfirmDialog } from '../src/components/ui/ConfirmDialog';
import { AddExpenseSheet } from '../src/components/expense/AddExpenseSheet';
import { useUIStore } from '../src/stores/uiStore';
import { hydrateStorage, storage, StorageKeys } from '../src/lib/storage';
import { revenuecatService } from '../src/revenuecat/revenuecat.service';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

function RootLayoutNav({ resolved }: { resolved: 'light' | 'dark' }) {
  const router = useRouter();
  const segments = useSegments();
  const navigationState = useRootNavigationState();
  const { user, isHydrated, hydrate } = useAuthStore();
  const addExpenseOpen = useUIStore((s) => s.addExpenseOpen);
  const closeAddExpense = useUIStore((s) => s.closeAddExpense);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!navigationState?.key) return;
    if (!isHydrated) return;

    const hasSeenOnboarding = storage.getBoolean(StorageKeys.HAS_SEEN_ONBOARDING) ?? false;
    const inAuthGroup = segments[0] === '(auth)';
    const onOnboarding = segments[0] === 'onboarding';

    if (!hasSeenOnboarding && !onOnboarding) {
      router.replace('/onboarding');
      return;
    }
    if (hasSeenOnboarding && !user && !inAuthGroup) {
      router.replace('/(auth)/sign-in');
      return;
    }
    if (user && (inAuthGroup || onOnboarding)) {
      router.replace('/(tabs)');
    }
  }, [user, isHydrated, segments, router, navigationState?.key]);

  return (
    <ThemeProvider value={resolved === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <AddExpenseSheet visible={addExpenseOpen} onClose={closeAddExpense} />
      <ToastHost />
      <ConfirmDialog />
      <StatusBar style={resolved === 'dark' ? 'light' : 'dark'} />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  const [storageReady, setStorageReady] = useState(false);
  const hydrateTheme = useThemeStore((s) => s.hydrate);
  const resolved = useThemeStore((s) => s.resolved);
  const hydrateLocale = useLocaleStore((s) => s.hydrate);
  const locale = useLocaleStore((s) => s.locale);
  const { setColorScheme } = useNwColorScheme();

  useEffect(() => {
    void (async () => {
      await hydrateStorage();
      hydrateLocale();
      hydrateTheme();
      revenuecatService.init();
      setStorageReady(true);
    })();
  }, [hydrateTheme, hydrateLocale]);

  useEffect(() => {
    setColorScheme(resolved);
  }, [resolved, setColorScheme]);

  if (!storageReady) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: resolved === 'dark' ? '#000' : '#fff',
        }}
      >
        <LoadingSpinner size="large" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <I18nextProvider i18n={i18n} key={locale}>
        <QueryClientProvider client={queryClient}>
          <RootLayoutNav resolved={resolved} />
        </QueryClientProvider>
      </I18nextProvider>
    </GestureHandlerRootView>
  );
}
