import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';

import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { authApi } from '../../src/services/auth.service';
import { useUIStore } from '../../src/stores/uiStore';

export default function ForgotPassword() {
  const { t } = useTranslation();
  const router = useRouter();
  const { resetToken } = useLocalSearchParams<{ resetToken?: string }>();
  const showToast = useUIStore((s) => s.showToast);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [touched, setTouched] = useState({ email: false, password: false, confirm: false });

  const emailError =
    touched.email && email.length > 0 && (!email.includes('@') || !email.includes('.'))
      ? t('auth.invalidEmail')
      : undefined;

  const passwordError =
    touched.password && password.length > 0 && password.length < 8
      ? t('auth.passwordTooShort')
      : undefined;

  const confirmError =
    touched.confirm && confirm.length > 0 && confirm !== password
      ? t('auth.passwordsDontMatch')
      : undefined;

  const requestMutation = useMutation({
    mutationFn: () => authApi.forgotPassword(email.trim().toLowerCase()),
    onSuccess: () =>
      showToast({
        type: 'success',
        title: t('auth.checkEmail'),
        message: t('auth.checkEmailDesc', { email: email.trim() }),
      }),
    onError: (e: { response?: { data?: { message?: string } } }) =>
      showToast({
        type: 'error',
        title: t('common.error'),
        message: e.response?.data?.message ?? t('auth.requestFailed'),
      }),
  });

  const resetMutation = useMutation({
    mutationFn: () => authApi.resetPassword(resetToken!, password, confirm),
    onSuccess: () => {
      showToast({
        type: 'success',
        title: t('common.success'),
        message: t('auth.passwordUpdated'),
      });
      setTimeout(() => router.replace('/(auth)/sign-in'), 2000);
    },
    onError: (e: { response?: { data?: { message?: string } } }) =>
      showToast({
        type: 'error',
        title: t('common.error'),
        message: e.response?.data?.message ?? t('auth.resetFailed'),
      }),
  });

  if (resetToken) {
    return (
      <SafeAreaView className="flex-1 bg-white dark:bg-black">
        <ScrollView contentContainerStyle={{ padding: 24 }} keyboardShouldPersistTaps="handled">
          <Text className="mt-6 text-[28px] font-bold text-black dark:text-white">{t('auth.newPassword')}</Text>
          <View className="mt-6">
            <Input
              label={t('auth.password')}
              value={password}
              onChangeText={setPassword}
              onBlur={() => setTouched((v) => ({ ...v, password: true }))}
              isPassword
              placeholder={t('auth.placeholderPassword')}
              error={passwordError}
            />
            <Input
              label={t('auth.confirmPassword')}
              value={confirm}
              onChangeText={setConfirm}
              onBlur={() => setTouched((v) => ({ ...v, confirm: true }))}
              isPassword
              placeholder={t('auth.placeholderConfirmPassword')}
              error={confirmError}
            />
            <Button
              title={t('common.save')}
              onPress={() => resetMutation.mutate()}
              loading={resetMutation.isPending}
              disabled={password.length < 8 || password !== confirm}
              className="mt-2"
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-black">
      <ScrollView contentContainerStyle={{ padding: 24 }} keyboardShouldPersistTaps="handled">
        <Text className="mt-6 text-[28px] font-bold text-black dark:text-white">{t('auth.forgotPassword')}</Text>
        <Text className="mt-2 text-[15px] text-[#8E8E93]">
          {t('auth.forgotIntro')}
        </Text>

        <View className="mt-6">
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
          <Button
            title={t('common.continue')}
            onPress={() => requestMutation.mutate()}
            loading={requestMutation.isPending}
            disabled={!email.includes('@') || !email.includes('.')}
            className="mt-2"
          />
        </View>

        <View className="mt-8 items-center">
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <Text className="text-[15px] text-[#007AFF]">{t('common.back')}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
