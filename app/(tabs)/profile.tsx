import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';

import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { Toast, type ToastType } from '@/src/components/ui/Toast';
import { UserAvatar } from '@/src/components/ui/UserAvatar';
import { LoadingSpinner } from '@/src/components/ui/LoadingSpinner';
import { useAuthStore } from '@/src/stores/authStore';
import { useThemeStore, type ThemeMode } from '@/src/stores/themeStore';
import { useLocaleStore, type Locale } from '@/src/stores/localeStore';
import { usePinStore } from '@/src/stores/pinStore';
import { authApi } from '@/src/services/auth.service';
import { api } from '@/src/services/api';
import { uploadApi } from '@/src/services/upload.service';

const THEME_LABELS: Record<ThemeMode, string> = {
  system: 'profile.themeSystem',
  light: 'profile.themeLight',
  dark: 'profile.themeDark',
};

export default function ProfileScreen() {
  const { t } = useTranslation();
  const { user, refreshToken, clear, updateUser } = useAuthStore();
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const themeMode = useThemeStore((s) => s.mode);
  const setThemeMode = useThemeStore((s) => s.setMode);
  const locale = useLocaleStore((s) => s.locale);
  const setLocale = useLocaleStore((s) => s.setLocale);
  const { hasPin, clearPin } = usePinStore();

  const [passwordModal, setPasswordModal] = useState(false);
  const [pinModal, setPinModal] = useState(false);
  const [toast, setToast] = useState({ visible: false, type: 'success' as ToastType, title: '', message: '' });

  const onLogout = () => {
    Alert.alert(t('profile.signOutTitle'), t('profile.signOutConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('profile.signOut'),
        style: 'destructive',
        onPress: async () => {
          try {
            if (refreshToken) await authApi.logout(refreshToken);
          } catch { /* ignore */ }
          clearPin();
          clear();
        },
      },
    ]);
  };

  const pickAvatar = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(t('common.permissionDenied'), t('common.allowPhotoAccess'));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (result.canceled || !result.assets[0]) return;

    try {
      setUploadingAvatar(true);
      const url = await uploadApi.uploadReceipt(result.assets[0].uri);
      await api.patch('/users/me', { avatarUrl: url });
      updateUser({ avatarUrl: url });
      setToast({ visible: true, type: 'success', title: t('common.success'), message: t('profile.avatarUpdated') });
    } catch {
      Alert.alert(t('common.error'), t('profile.avatarFailed'));
    } finally {
      setUploadingAvatar(false);
    }
  };

  const onResetPin = () => {
    Alert.alert(t('profile.resetPinTitle'), t('profile.resetPinDesc'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.confirm'),
        style: 'destructive',
        onPress: () => {
          clearPin();
          setToast({ visible: true, type: 'success', title: t('common.success'), message: t('profile.pinResetDone') });
        },
      },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F2F2F7] dark:bg-black">
      <Toast visible={toast.visible} type={toast.type} title={toast.title} message={toast.message} onDismiss={() => setToast((v) => ({ ...v, visible: false }))} />

      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Avatar */}
        <View className="items-center pt-6">
          <Pressable onPress={pickAvatar} className="active:opacity-70">
            <UserAvatar uri={user?.avatarUrl} name={user?.fullName} size={80} />
            {uploadingAvatar ? (
              <View className="absolute inset-0 items-center justify-center rounded-full bg-black/40">
                <LoadingSpinner color="#fff" />
              </View>
            ) : (
              <View className="absolute bottom-0 right-0 h-7 w-7 items-center justify-center rounded-full bg-white dark:bg-[#2C2C2E] border-2 border-[#F2F2F7] dark:border-[#1C1C1E]">
                <Text className="text-[13px]">📷</Text>
              </View>
            )}
          </Pressable>
          <Text className="mt-3 text-[20px] font-bold text-black dark:text-white">
            {user?.fullName}
          </Text>
          <Text className="text-[14px] text-[#8E8E93]">{user?.email}</Text>
        </View>

        {/* Preferences */}
        <Text className="mx-5 mt-8 mb-1 text-[13px] uppercase text-[#8E8E93]">
          {t('profile.preferences')}
        </Text>
        <View className="mx-5 overflow-hidden rounded-[14px] bg-white dark:bg-[#1C1C1E]">
          {/* Language */}
          <View className="border-b border-[#F2F2F7] dark:border-[#38383A] px-4 py-3">
            <Text className="text-[15px] text-black dark:text-white">{t('profile.language')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 8, gap: 6 }}>
              {([
                { code: 'en' as Locale, flag: '🇬🇧', label: 'EN' },
                { code: 'ru' as Locale, flag: '🇷🇺', label: 'RU' },
                { code: 'fr' as Locale, flag: '🇫🇷', label: 'FR' },
                { code: 'es' as Locale, flag: '🇪🇸', label: 'ES' },
                { code: 'ar' as Locale, flag: '🇸🇦', label: 'عر' },
                { code: 'zh' as Locale, flag: '🇨🇳', label: '中' },
                { code: 'ko' as Locale, flag: '🇰🇷', label: '한' },
                { code: 'ja' as Locale, flag: '🇯🇵', label: '日' },
              ]).map((lng) => (
                <Pressable
                  key={lng.code}
                  onPress={() => setLocale(lng.code)}
                  className={`flex-row items-center rounded-full px-3 py-1 ${
                    locale === lng.code ? 'bg-[#007AFF]' : 'bg-[#E5E5EA] dark:bg-[#38383A]'
                  }`}
                  style={{ gap: 4 }}
                >
                  <Text className="text-[14px]">{lng.flag}</Text>
                  <Text className={`text-[13px] ${locale === lng.code ? 'font-semibold text-white' : 'text-black dark:text-white'}`}>
                    {lng.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {/* Theme */}
          <View className="px-4 py-3">
            <Text className="text-[15px] text-black dark:text-white">{t('profile.theme')}</Text>
            <View className="mt-2 flex-row gap-2">
              {(['system', 'light', 'dark'] as ThemeMode[]).map((mode) => (
                <Pressable
                  key={mode}
                  onPress={() => setThemeMode(mode)}
                  className={`rounded-full px-3 py-1 ${
                    themeMode === mode ? 'bg-[#007AFF]' : 'bg-[#E5E5EA] dark:bg-[#38383A]'
                  }`}
                >
                  <Text className={`text-[13px] ${themeMode === mode ? 'font-semibold text-white' : 'text-black dark:text-white'}`}>
                    {t(THEME_LABELS[mode])}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>

        {/* Security */}
        <Text className="mx-5 mt-6 mb-1 text-[13px] uppercase text-[#8E8E93]">
          {t('profile.security')}
        </Text>
        <View className="mx-5 overflow-hidden rounded-[14px] bg-white dark:bg-[#1C1C1E]">
          {/* Change password */}
          <Pressable
            onPress={() => setPasswordModal(true)}
            className="flex-row items-center justify-between border-b border-[#F2F2F7] dark:border-[#38383A] px-4 py-3.5 active:opacity-70"
          >
            <View className="flex-row items-center" style={{ gap: 10 }}>
              <Text className="text-[18px]">🔑</Text>
              <Text className="text-[15px] text-black dark:text-white">{t('profile.changePassword')}</Text>
            </View>
            <Text className="text-[16px] text-[#8E8E93]">›</Text>
          </Pressable>

          {/* PIN */}
          <Pressable
            onPress={hasPin ? onResetPin : () => { clearPin(); /* triggers setup on next open */ }}
            className="flex-row items-center justify-between px-4 py-3.5 active:opacity-70"
          >
            <View className="flex-row items-center" style={{ gap: 10 }}>
              <Text className="text-[18px]">🔒</Text>
              <Text className="text-[15px] text-black dark:text-white">{t('profile.pinCode')}</Text>
            </View>
            <Text className="text-[13px] text-[#8E8E93]">
              {hasPin ? t('profile.pinReset') : t('profile.pinSet')}
            </Text>
          </Pressable>
        </View>

        {/* Sign out */}
        <View className="mx-5 mt-8">
          <Button title={t('profile.signOut')} variant="primary" onPress={onLogout} />
        </View>

        {/* App version */}
        <Text className="mt-4 text-center text-[12px] text-[#8E8E93]">
          SalaryNet v1.0.0
        </Text>
      </ScrollView>

      {/* Change Password Modal */}
      <ChangePasswordModal
        visible={passwordModal}
        onClose={() => setPasswordModal(false)}
        onSuccess={() => {
          setPasswordModal(false);
          setToast({ visible: true, type: 'success', title: t('common.success'), message: t('profile.passwordChanged') });
        }}
      />
    </SafeAreaView>
  );
}

function ChangePasswordModal({
  visible,
  onClose,
  onSuccess,
}: {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { t } = useTranslation();
  const [current, setCurrent] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: async () => {
      await api.patch('/users/me/password', {
        currentPassword: current,
        newPassword: newPw,
      });
    },
    onSuccess: () => {
      setCurrent('');
      setNewPw('');
      setConfirm('');
      setError('');
      onSuccess();
    },
    onError: (e: { response?: { data?: { message?: string } } }) => {
      setError(e.response?.data?.message ?? t('common.error'));
    },
  });

  const isValidNew =
    newPw.length >= 8 &&
    /[A-Z]/.test(newPw) &&
    /[0-9]/.test(newPw) &&
    /[^A-Za-z0-9]/.test(newPw);

  const canSubmit = current.length >= 1 && isValidNew && newPw === confirm;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/40" onPress={onClose}>
        <View className="mt-auto" />
      </Pressable>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="absolute bottom-0 left-0 right-0"
      >
        <View className="rounded-t-[24px] bg-white dark:bg-[#1C1C1E] p-5 pb-8">
          <View className="mb-4 self-center h-1 w-10 rounded-full bg-[#D1D1D6] dark:bg-[#48484A]" />
          <Text className="text-center text-[20px] font-bold text-black dark:text-white">
            {t('profile.changePassword')}
          </Text>

          <View className="mt-4">
            <Input
              label={t('profile.currentPassword')}
              value={current}
              onChangeText={setCurrent}
              isPassword
              placeholder="••••••••"
            />
            <Input
              label={t('profile.newPassword')}
              value={newPw}
              onChangeText={setNewPw}
              isPassword
              placeholder={t('auth.placeholderPassword')}
              error={
                newPw.length > 0 && !isValidNew
                  ? newPw.length < 8
                    ? t('auth.passwordTooShort')
                    : !/[A-Z]/.test(newPw)
                      ? t('auth.passwordNeedsUppercase')
                      : !/[0-9]/.test(newPw)
                        ? t('auth.passwordNeedsNumber')
                        : t('auth.passwordNeedsSpecial')
                  : undefined
              }
            />
            <Input
              label={t('auth.confirmPassword')}
              value={confirm}
              onChangeText={setConfirm}
              isPassword
              placeholder={t('auth.placeholderConfirmPassword')}
              error={confirm.length > 0 && confirm !== newPw ? t('auth.passwordsDontMatch') : undefined}
            />
            {error ? (
              <Text className="mb-2 text-center text-[13px] text-[#FF3B30]">{error}</Text>
            ) : null}
          </View>

          <View className="mt-2 flex-row gap-3">
            <Button title={t('common.cancel')} variant="secondary" className="flex-1" onPress={onClose} />
            <Button
              title={t('common.save')}
              className="flex-1"
              loading={mutation.isPending}
              disabled={!canSubmit}
              onPress={() => mutation.mutate()}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
