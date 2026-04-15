import { useState } from 'react';
import { Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import Constants from 'expo-constants';

import { BottomSheet } from '@/src/components/ui/BottomSheet';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { UserAvatar } from '@/src/components/ui/UserAvatar';
import { LoadingSpinner } from '@/src/components/ui/LoadingSpinner';
import { useAuthStore } from '@/src/stores/authStore';
import { useThemeStore, type ThemeMode } from '@/src/stores/themeStore';
import { useLocaleStore, type Locale } from '@/src/stores/localeStore';
import { usePinStore } from '@/src/stores/pinStore';
import { useUIStore } from '@/src/stores/uiStore';
import { authApi } from '@/src/services/auth.service';
import { api } from '@/src/services/api';
import { uploadApi } from '@/src/services/upload.service';

const THEME_LABELS: Record<ThemeMode, string> = {
  system: 'profile.themeSystem',
  light: 'profile.themeLight',
  dark: 'profile.themeDark',
};

const THEME_OPTIONS: { mode: ThemeMode; icon: string }[] = [
  { mode: 'system', icon: '📱' },
  { mode: 'light', icon: '☀️' },
  { mode: 'dark', icon: '🌙' },
];

const LANGUAGES: { code: Locale; flag: string; name: string; native: string }[] = [
  { code: 'en', flag: '🇬🇧', name: 'English', native: 'English' },
  { code: 'ru', flag: '🇷🇺', name: 'Russian', native: 'Русский' },
  { code: 'fr', flag: '🇫🇷', name: 'French', native: 'Français' },
  { code: 'es', flag: '🇪🇸', name: 'Spanish', native: 'Español' },
  { code: 'ar', flag: '🇸🇦', name: 'Arabic', native: 'العربية' },
  { code: 'zh', flag: '🇨🇳', name: 'Chinese', native: '中文' },
  { code: 'ko', flag: '🇰🇷', name: 'Korean', native: '한국어' },
  { code: 'ja', flag: '🇯🇵', name: 'Japanese', native: '日本語' },
];

export default function ProfileScreen() {
  const { t } = useTranslation();
  const { user, refreshToken, clear, updateUser } = useAuthStore();
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const themeMode = useThemeStore((s) => s.mode);
  const setThemeMode = useThemeStore((s) => s.setMode);
  const locale = useLocaleStore((s) => s.locale);
  const setLocale = useLocaleStore((s) => s.setLocale);
  const { hasPin, clearPin } = usePinStore();
  const showToast = useUIStore((s) => s.showToast);
  const showConfirm = useUIStore((s) => s.showConfirm);
  const queryClient = useQueryClient();

  const [passwordModal, setPasswordModal] = useState(false);
  const [profileModal, setProfileModal] = useState(false);
  const [pinModal, setPinModal] = useState(false);
  const [langSheet, setLangSheet] = useState(false);
  const [themeSheet, setThemeSheet] = useState(false);

  const onLogout = () => {
    showConfirm({
      variant: 'destructive',
      icon: '👋',
      title: t('profile.signOutTitle'),
      message: t('profile.signOutConfirm'),
      confirmLabel: t('profile.signOut'),
      onConfirm: async () => {
        try {
          if (refreshToken) await authApi.logout(refreshToken);
        } catch {
          /* ignore */
        }
        clearPin();
        clear();
        // Drop all cached queries so the next logged-in user never sees
        // stale expenses, profile, or chat data from the previous session.
        queryClient.clear();
      },
    });
  };

  const pickAvatar = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      showToast({
        type: 'warning',
        title: t('common.permissionDenied'),
        message: t('common.allowPhotoAccess'),
      });
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      exif: false,
    });
    if (result.canceled || !result.assets[0]) return;

    try {
      setUploadingAvatar(true);
      const url = await uploadApi.uploadReceipt(result.assets[0].uri);
      await api.patch('/users/me', { avatarUrl: url });
      updateUser({ avatarUrl: url });
      showToast({
        type: 'success',
        title: t('common.success'),
        message: t('profile.avatarUpdated'),
      });
    } catch {
      showToast({
        type: 'error',
        title: t('common.error'),
        message: t('profile.avatarFailed'),
      });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const onResetPin = () => {
    showConfirm({
      variant: 'destructive',
      icon: '🔒',
      title: t('profile.resetPinTitle'),
      message: t('profile.resetPinDesc'),
      onConfirm: () => {
        clearPin();
        showToast({
          type: 'success',
          title: t('common.success'),
          message: t('profile.pinResetDone'),
        });
      },
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F2F2F7] dark:bg-black">

      <ScrollView
        contentContainerStyle={{ paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero card */}
        <View
          className="mx-4 mt-3 overflow-hidden rounded-[24px] bg-[#007AFF] px-5 py-5"
          style={{
            shadowColor: '#007AFF',
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.28,
            shadowRadius: 24,
            elevation: 10,
          }}
        >
          <View className="flex-row items-center">
            <Pressable onPress={pickAvatar} className="active:opacity-80">
              <View
                style={{
                  borderWidth: 3,
                  borderColor: 'rgba(255,255,255,0.35)',
                  borderRadius: 44,
                }}
              >
                <UserAvatar uri={user?.avatarUrl} name={user?.fullName} size={72} />
              </View>
              {uploadingAvatar ? (
                <View className="absolute inset-0 items-center justify-center rounded-full bg-black/40">
                  <LoadingSpinner color="#fff" />
                </View>
              ) : (
                <View className="absolute -bottom-1 -right-1 h-[26px] w-[26px] items-center justify-center rounded-full bg-white">
                  <Text style={{ fontSize: 12 }}>📷</Text>
                </View>
              )}
            </Pressable>
            <View className="ml-4 flex-1">
              <Text
                className="text-[20px] font-bold text-white"
                numberOfLines={1}
              >
                {user?.fullName}
              </Text>
              <Text
                className="mt-[2px] text-[13px] text-white/80"
                numberOfLines={1}
              >
                {user?.email}
              </Text>
              <Pressable
                onPress={() => setProfileModal(true)}
                className="mt-[10px] self-start rounded-full bg-white/20 px-[14px] py-[6px] active:bg-white/30"
              >
                <Text className="text-[12px] font-semibold text-white">
                  {t('profile.editProfile')}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* Preferences */}
        <SectionHeader label={t('profile.preferences')} />
        <View className="mx-4 overflow-hidden rounded-[16px] bg-white dark:bg-[#1C1C1E]">
          <SettingsRow
            emoji="🌐"
            color="#5856D6"
            label={t('profile.language')}
            value={`${LANGUAGES.find((l) => l.code === locale)?.flag ?? ''} ${
              LANGUAGES.find((l) => l.code === locale)?.name ?? locale.toUpperCase()
            }`}
            onPress={() => setLangSheet(true)}
          />
          <RowDivider />
          <SettingsRow
            emoji="🎨"
            color="#FF2D55"
            label={t('profile.theme')}
            value={`${THEME_OPTIONS.find((o) => o.mode === themeMode)?.icon ?? ''} ${t(
              THEME_LABELS[themeMode],
            )}`}
            onPress={() => setThemeSheet(true)}
            isLast
          />
        </View>

        {/* Security */}
        <SectionHeader label={t('profile.security')} />
        <View className="mx-4 overflow-hidden rounded-[16px] bg-white dark:bg-[#1C1C1E]">
          <SettingsRow
            emoji="🔑"
            color="#FF9500"
            label={t('profile.changePassword')}
            onPress={() => setPasswordModal(true)}
          />
          <RowDivider />
          <SettingsRow
            emoji="🔒"
            color="#34C759"
            label={t('profile.pinCode')}
            value={hasPin ? t('profile.pinReset') : t('profile.pinSet')}
            onPress={hasPin ? onResetPin : () => clearPin()}
            isLast
          />
        </View>

        {/* About */}
        <SectionHeader label={t('profile.about')} />
        <View className="mx-4 overflow-hidden rounded-[16px] bg-white dark:bg-[#1C1C1E]">
          <InfoRow
            emoji="🏷️"
            color="#007AFF"
            label={t('profile.appVersion')}
            value={`v${Constants.expoConfig?.version ?? '1.0.0'}`}
          />
          <RowDivider />
          <SettingsRow
            emoji="🔐"
            color="#34C759"
            label={t('profile.privacyPolicy')}
            onPress={() => Linking.openURL('https://salarynet.app/privacy')}
          />
          <RowDivider />
          <SettingsRow
            emoji="📄"
            color="#007AFF"
            label={t('profile.termsOfService')}
            onPress={() => Linking.openURL('https://salarynet.app/terms')}
          />
          <RowDivider />
          <SettingsRow
            emoji="✉️"
            color="#FF3B30"
            label={t('profile.supportContact')}
            onPress={() => Linking.openURL('mailto:support@salarynet.app')}
            isLast
          />
        </View>

        {/* Sign out */}
        <View className="mx-4 mt-8">
          <Pressable
            onPress={onLogout}
            className="items-center rounded-[16px] bg-white py-[15px] active:opacity-70 dark:bg-[#1C1C1E]"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 3 },
              shadowOpacity: 0.08,
              shadowRadius: 10,
              elevation: 3,
            }}
          >
            <Text className="text-[16px] font-semibold text-[#FF3B30]">
              {t('profile.signOut')}
            </Text>
          </Pressable>
        </View>

        {/* App version footer */}
        <Text className="mt-5 text-center text-[12px] text-[#8E8E93]">
          SalaryNet v{Constants.expoConfig?.version ?? '1.0.0'}
        </Text>
      </ScrollView>

      {/* Change Password Modal */}
      <ChangePasswordModal
        visible={passwordModal}
        onClose={() => setPasswordModal(false)}
        onSuccess={() => {
          setPasswordModal(false);
          showToast({
            type: 'success',
            title: t('common.success'),
            message: t('profile.passwordChanged'),
          });
        }}
      />

      {/* Language picker sheet */}
      <BottomSheet visible={langSheet} onClose={() => setLangSheet(false)}>
        <View className="mb-4 self-center h-1 w-10 rounded-full bg-[#D1D1D6] dark:bg-[#48484A]" />
        <Text className="text-center text-[18px] font-bold text-black dark:text-white">
          {t('profile.language')}
        </Text>
        <View className="mt-4">
          {LANGUAGES.map((lng, idx) => {
            const active = locale === lng.code;
            return (
              <Pressable
                key={lng.code}
                onPress={() => {
                  setLocale(lng.code);
                  setLangSheet(false);
                }}
                className={`flex-row items-center py-[12px] ${
                  idx < LANGUAGES.length - 1
                    ? 'border-b border-[#F2F2F7] dark:border-[#38383A]'
                    : ''
                }`}
              >
                <Text style={{ fontSize: 24 }}>{lng.flag}</Text>
                <View className="ml-3 flex-1">
                  <Text className="text-[15px] font-semibold text-black dark:text-white">
                    {lng.native}
                  </Text>
                  <Text className="text-[12px] text-[#8E8E93]">{lng.name}</Text>
                </View>
                {active ? (
                  <Text className="text-[18px] font-bold text-[#007AFF]">✓</Text>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      </BottomSheet>

      {/* Theme picker sheet */}
      <BottomSheet visible={themeSheet} onClose={() => setThemeSheet(false)}>
        <View className="mb-4 self-center h-1 w-10 rounded-full bg-[#D1D1D6] dark:bg-[#48484A]" />
        <Text className="text-center text-[18px] font-bold text-black dark:text-white">
          {t('profile.theme')}
        </Text>
        <View className="mt-4">
          {THEME_OPTIONS.map((opt, idx) => {
            const active = themeMode === opt.mode;
            return (
              <Pressable
                key={opt.mode}
                onPress={() => {
                  setThemeMode(opt.mode);
                  setThemeSheet(false);
                }}
                className={`flex-row items-center py-[14px] ${
                  idx < THEME_OPTIONS.length - 1
                    ? 'border-b border-[#F2F2F7] dark:border-[#38383A]'
                    : ''
                }`}
              >
                <Text style={{ fontSize: 24 }}>{opt.icon}</Text>
                <View className="ml-3 flex-1">
                  <Text className="text-[15px] font-semibold text-black dark:text-white">
                    {t(THEME_LABELS[opt.mode])}
                  </Text>
                  <Text className="text-[12px] text-[#8E8E93]">
                    {opt.mode === 'system'
                      ? t('profile.themeSystemDesc')
                      : opt.mode === 'light'
                        ? t('profile.themeLightDesc')
                        : t('profile.themeDarkDesc')}
                  </Text>
                </View>
                {active ? (
                  <Text className="text-[18px] font-bold text-[#007AFF]">✓</Text>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      </BottomSheet>

      {/* Edit Profile Modal */}
      <EditProfileModal
        visible={profileModal}
        initialName={user?.fullName ?? ''}
        initialEmail={user?.email ?? ''}
        onClose={() => setProfileModal(false)}
        onSuccess={(updated) => {
          updateUser(updated);
          setProfileModal(false);
          showToast({
            type: 'success',
            title: t('common.success'),
            message: t('profile.profileUpdated'),
          });
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
    <BottomSheet visible={visible} onClose={onClose}>
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
    </BottomSheet>
  );
}

function EditProfileModal({
  visible,
  initialName,
  initialEmail,
  onClose,
  onSuccess,
}: {
  visible: boolean;
  initialName: string;
  initialEmail: string;
  onClose: () => void;
  onSuccess: (updated: { fullName: string; email: string; emailVerified: boolean }) => void;
}) {
  const { t } = useTranslation();
  const [step, setStep] = useState<'form' | 'verify'>('form');
  const [fullName, setFullName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  const [pendingEmail, setPendingEmail] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const reset = () => {
    setStep('form');
    setFullName(initialName);
    setEmail(initialEmail);
    setPendingEmail('');
    setCode('');
    setError('');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const nameChanged = fullName.trim() !== initialName;
      const emailChanged = email.trim().toLowerCase() !== initialEmail.toLowerCase();

      let updatedUser: { fullName: string; email: string; emailVerified: boolean } | null = null;

      if (nameChanged) {
        const { data } = await api.patch('/users/me', { fullName: fullName.trim() });
        updatedUser = data;
      }

      if (emailChanged) {
        const newEmail = email.trim().toLowerCase();
        await api.post('/users/me/email/request-change', { newEmail });
        return { needsVerification: true as const, newEmail, updatedUser };
      }

      return { needsVerification: false as const, updatedUser };
    },
    onSuccess: (result) => {
      setError('');
      if (result.needsVerification) {
        if (result.updatedUser) {
          onSuccess({
            fullName: result.updatedUser.fullName,
            email: result.updatedUser.email,
            emailVerified: result.updatedUser.emailVerified,
          });
        }
        setPendingEmail(result.newEmail);
        setCode('');
        setStep('verify');
      } else {
        if (result.updatedUser) {
          onSuccess({
            fullName: result.updatedUser.fullName,
            email: result.updatedUser.email,
            emailVerified: result.updatedUser.emailVerified,
          });
        } else {
          handleClose();
        }
      }
    },
    onError: (e: { response?: { data?: { message?: string } } }) => {
      setError(e.response?.data?.message ?? t('common.error'));
    },
  });

  const verifyMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/users/me/email/confirm-change', { code: code.trim() });
      return data as { fullName: string; email: string; emailVerified: boolean };
    },
    onSuccess: (data) => {
      setError('');
      onSuccess({
        fullName: data.fullName,
        email: data.email,
        emailVerified: data.emailVerified,
      });
      reset();
    },
    onError: (e: { response?: { data?: { message?: string } } }) => {
      setError(e.response?.data?.message ?? t('common.error'));
    },
  });

  const resendMutation = useMutation({
    mutationFn: async () => {
      await api.post('/users/me/email/request-change', { newEmail: pendingEmail });
    },
    onSuccess: () => {
      setError('');
      setCode('');
    },
    onError: (e: { response?: { data?: { message?: string } } }) => {
      setError(e.response?.data?.message ?? t('common.error'));
    },
  });

  const nameValid = fullName.trim().length >= 2;
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const changed =
    fullName.trim() !== initialName || email.trim().toLowerCase() !== initialEmail.toLowerCase();
  const canSave = nameValid && emailValid && changed && !saveMutation.isPending;
  const canVerify = code.trim().length === 8 && !verifyMutation.isPending;

  return (
    <BottomSheet visible={visible} onClose={handleClose}>
      <View className="mb-4 self-center h-1 w-10 rounded-full bg-[#D1D1D6] dark:bg-[#48484A]" />

      {step === 'form' ? (
        <>
          <Text className="text-center text-[20px] font-bold text-black dark:text-white">
            {t('profile.editProfile')}
          </Text>

          <View className="mt-4">
            <Input
              label={t('auth.fullName')}
              value={fullName}
              onChangeText={setFullName}
              placeholder={t('auth.placeholderName')}
              autoCapitalize="words"
              error={fullName.length > 0 && !nameValid ? t('auth.nameTooShort') : undefined}
            />
            <Input
              label={t('auth.email')}
              value={email}
              onChangeText={setEmail}
              placeholder={t('auth.placeholderEmail')}
              autoCapitalize="none"
              keyboardType="email-address"
              error={email.length > 0 && !emailValid ? t('auth.invalidEmail') : undefined}
            />
            {error ? (
              <Text className="mb-2 text-center text-[13px] text-[#FF3B30]">{error}</Text>
            ) : null}
          </View>

          <View className="mt-2 flex-row gap-3">
            <Button title={t('common.cancel')} variant="secondary" className="flex-1" onPress={handleClose} />
            <Button
              title={t('common.save')}
              className="flex-1"
              loading={saveMutation.isPending}
              disabled={!canSave}
              onPress={() => saveMutation.mutate()}
            />
          </View>
        </>
      ) : (
        <>
          <Text className="text-center text-[20px] font-bold text-black dark:text-white">
            {t('profile.verifyEmailTitle')}
          </Text>
          <Text className="mt-2 text-center text-[13px] leading-[18px] text-[#8E8E93]">
            {t('profile.verifyEmailDesc', { email: pendingEmail })}
          </Text>

          <View className="mt-4">
            <Input
              label={t('profile.verificationCode')}
              value={code}
              onChangeText={(v) =>
                setCode(v.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 8))
              }
              placeholder="ABCD2345"
              autoCapitalize="characters"
              maxLength={8}
            />
            {error ? (
              <Text className="mb-2 text-center text-[13px] text-[#FF3B30]">{error}</Text>
            ) : null}

            <Pressable
              onPress={() => resendMutation.mutate()}
              disabled={resendMutation.isPending}
              className="mt-1 items-center py-2 active:opacity-60"
            >
              <Text className="text-[13px] font-semibold text-[#007AFF]">
                {resendMutation.isPending ? t('profile.sending') : t('profile.resendCode')}
              </Text>
            </Pressable>
          </View>

          <View className="mt-2 flex-row gap-3">
            <Button
              title={t('common.cancel')}
              variant="secondary"
              className="flex-1"
              onPress={handleClose}
            />
            <Button
              title={t('profile.verify')}
              className="flex-1"
              loading={verifyMutation.isPending}
              disabled={!canVerify}
              onPress={() => verifyMutation.mutate()}
            />
          </View>
        </>
      )}
    </BottomSheet>
  );
}

function SectionHeader({ label }: { label: string }) {
  return (
    <Text className="mx-5 mb-[6px] mt-6 text-[12px] font-semibold uppercase tracking-wider text-[#8E8E93]">
      {label}
    </Text>
  );
}

function RowDivider() {
  return <View className="ml-[58px] h-[0.5px] bg-[#F2F2F7] dark:bg-[#38383A]" />;
}

function IconBadge({
  emoji,
  color,
  darkColor,
}: {
  emoji: string;
  color: string;
  darkColor?: string;
}) {
  const isDark = useThemeStore((s) => s.resolved) === 'dark';
  const bg = isDark && darkColor ? darkColor : color;
  return (
    <View
      style={{
        width: 30,
        height: 30,
        borderRadius: 8,
        backgroundColor: bg,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ fontSize: 15 }}>{emoji}</Text>
    </View>
  );
}

function SettingsRow({
  emoji,
  color,
  label,
  value,
  onPress,
  isLast,
}: {
  emoji: string;
  color: string;
  label: string;
  value?: string;
  onPress?: () => void;
  isLast?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center px-4 py-[11px] active:bg-[#F2F2F7] dark:active:bg-[#2C2C2E] ${
        isLast ? 'rounded-b-[16px]' : ''
      }`}
    >
      <IconBadge emoji={emoji} color={color} />
      <Text className="ml-3 flex-1 text-[15px] font-medium text-black dark:text-white">
        {label}
      </Text>
      {value ? (
        <Text className="mr-1 text-[13px] text-[#8E8E93]">{value}</Text>
      ) : null}
      <Text className="text-[18px] text-[#C7C7CC]">›</Text>
    </Pressable>
  );
}

function InfoRow({
  emoji,
  color,
  label,
  value,
  isLast: _isLast,
}: {
  emoji: string;
  color: string;
  label: string;
  value: string;
  isLast?: boolean;
}) {
  return (
    <View className="flex-row items-center px-4 py-[11px]">
      <IconBadge emoji={emoji} color={color} />
      <Text className="ml-3 flex-1 text-[15px] font-medium text-black dark:text-white">
        {label}
      </Text>
      <Text
        className="max-w-[55%] text-right text-[13px] text-[#8E8E93]"
        numberOfLines={1}
      >
        {value}
      </Text>
    </View>
  );
}
