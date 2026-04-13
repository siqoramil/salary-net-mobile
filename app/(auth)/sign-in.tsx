import { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';

import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { Toast } from '../../src/components/ui/Toast';
import { authApi } from '../../src/services/auth.service';
import { useAuthStore } from '../../src/stores/authStore';

export default function SignIn() {
  const { t } = useTranslation();
  const setSession = useAuthStore((s) => s.setSession);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [touched, setTouched] = useState({ email: false, password: false });
  const [toast, setToast] = useState({ visible: false, title: '', message: '' });

  const emailError =
    touched.email && email.length > 0 && (!email.includes('@') || !email.includes('.'))
      ? t('auth.invalidEmail')
      : undefined;

  const passwordError =
    touched.password && password.length > 0 && password.length < 8
      ? t('auth.passwordTooShort')
      : undefined;

  const mutation = useMutation({
    mutationFn: () => authApi.signIn(email.trim().toLowerCase(), password),
    onSuccess: (data) => setSession(data),
    onError: (e: { response?: { data?: { message?: string } } }) =>
      setToast({
        visible: true,
        title: t('common.error'),
        message: e.response?.data?.message ?? t('auth.invalidCredentials'),
      }),
  });

  const canSubmit = email.includes('@') && email.includes('.') && password.length >= 8;
  const dismissToast = useCallback(() => setToast((v) => ({ ...v, visible: false })), []);

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-black">
      <Toast
        visible={toast.visible}
        type="error"
        title={toast.title}
        message={toast.message}
        onDismiss={dismissToast}
      />

      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24, justifyContent: 'center' }} keyboardShouldPersistTaps="handled">
        <Text className="text-center text-[34px] font-bold text-black dark:text-white">
          {t('auth.welcomeBack')}
        </Text>
        <Text className="mt-1 text-center text-[17px] text-[#8E8E93]">
          {t('auth.signInSubtitle')}
        </Text>

        <View className="mt-10">
          <Input
            label={t('auth.email')}
            value={email}
            onChangeText={setEmail}
            onBlur={() => setTouched((v) => ({ ...v, email: true }))}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            placeholder={t('auth.placeholderEmail')}
            error={emailError}
          />
          <Input
            label={t('auth.password')}
            value={password}
            onChangeText={setPassword}
            onBlur={() => setTouched((v) => ({ ...v, password: true }))}
            isPassword
            placeholder={t('auth.placeholderPassword')}
            error={passwordError}
          />

          <View className="mb-6 items-end">
            <Link href="/(auth)/forgot-password" asChild>
              <Pressable hitSlop={8}>
                <Text className="text-[15px] text-[#007AFF]">{t('auth.forgotPassword')}</Text>
              </Pressable>
            </Link>
          </View>

          <Button
            title={t('auth.signIn')}
            onPress={() => mutation.mutate()}
            loading={mutation.isPending}
            disabled={!canSubmit}
          />
        </View>

        <View className="mt-8 flex-row justify-center">
          <Text className="text-[15px] text-[#8E8E93]">{t('auth.noAccount')} </Text>
          <Link href="/(auth)/sign-up" asChild>
            <Pressable hitSlop={8}>
              <Text className="text-[15px] font-semibold text-[#007AFF]">{t('auth.signUp')}</Text>
            </Pressable>
          </Link>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
