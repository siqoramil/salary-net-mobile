import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';

import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { authApi } from '../../src/services/auth/auth.service';
import { useAuthStore } from '../../src/stores/authStore';
import { useUIStore } from '../../src/stores/uiStore';

export default function SignUp() {
  const { t } = useTranslation();
  const setSession = useAuthStore((s) => s.setSession);
  const showToast = useUIStore((s) => s.showToast);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [touched, setTouched] = useState({ name: false, email: false, password: false, confirm: false });

  const nameError =
    touched.name && fullName.length > 0 && fullName.length < 2
      ? t('auth.nameTooShort')
      : undefined;

  const emailError =
    touched.email && email.length > 0 && (!email.includes('@') || !email.includes('.'))
      ? t('auth.invalidEmail')
      : undefined;

  const passwordError = (() => {
    if (!touched.password || password.length === 0) return undefined;
    if (password.length < 8) return t('auth.passwordTooShort');
    if (!/[A-Z]/.test(password)) return t('auth.passwordNeedsUppercase');
    if (!/[0-9]/.test(password)) return t('auth.passwordNeedsNumber');
    if (!/[^A-Za-z0-9]/.test(password)) return t('auth.passwordNeedsSpecial');
    return undefined;
  })();

  const confirmError =
    touched.confirm && confirmPassword.length > 0 && confirmPassword !== password
      ? t('auth.passwordsDontMatch')
      : undefined;

  const mutation = useMutation({
    mutationFn: () =>
      authApi.signUp({
        fullName,
        email: email.trim().toLowerCase(),
        password,
        confirmPassword,
      }),
    onSuccess: (data) => setSession(data),
    onError: (e: { response?: { data?: { message?: string } } }) =>
      showToast({
        type: 'error',
        title: t('common.error'),
        message: e.response?.data?.message ?? t('auth.signUpFailed'),
      }),
  });

  const isValidPassword =
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[^A-Za-z0-9]/.test(password);

  const canSubmit =
    fullName.length >= 2 &&
    email.includes('@') && email.includes('.') &&
    isValidPassword &&
    password === confirmPassword;

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-black">
      <ScrollView contentContainerStyle={{ padding: 24 }} keyboardShouldPersistTaps="handled">
        <Text className="mt-6 text-[28px] font-bold text-black dark:text-white">{t('auth.createAccount')}</Text>

        <View className="mt-6">
          <Input
            label={t('auth.fullName')}
            value={fullName}
            onChangeText={setFullName}
            onBlur={() => setTouched((v) => ({ ...v, name: true }))}
            autoComplete="name"
            textContentType="name"
            placeholder={t('auth.placeholderName')}
            error={nameError}
          />
          <Input
            label={t('auth.email')}
            value={email}
            onChangeText={setEmail}
            onBlur={() => setTouched((v) => ({ ...v, email: true }))}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType="username"
            placeholder={t('auth.placeholderEmail')}
            error={emailError}
          />
          <Input
            label={t('auth.password')}
            value={password}
            onChangeText={setPassword}
            onBlur={() => setTouched((v) => ({ ...v, password: true }))}
            isPassword
            autoComplete="new-password"
            textContentType="newPassword"
            placeholder={t('auth.placeholderPassword')}
            error={passwordError}
          />
          <Input
            label={t('auth.confirmPassword')}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            onBlur={() => setTouched((v) => ({ ...v, confirm: true }))}
            isPassword
            autoComplete="new-password"
            textContentType="newPassword"
            placeholder={t('auth.placeholderConfirmPassword')}
            error={confirmError}
          />

          <Button
            title={t('auth.signUp')}
            onPress={() => mutation.mutate()}
            loading={mutation.isPending}
            disabled={!canSubmit}
            className="mt-2"
          />
        </View>

        <View className="mt-8 flex-row justify-center">
          <Text className="text-[15px] text-[#8E8E93]">{t('auth.haveAccount')} </Text>
          <Link href="/(auth)/sign-in" asChild>
            <Pressable hitSlop={8}>
              <Text className="text-[15px] font-semibold text-[#007AFF]">{t('auth.signIn')}</Text>
            </Pressable>
          </Link>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
