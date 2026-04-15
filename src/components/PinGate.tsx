import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

import { usePinStore } from '../stores/pinStore';
import { useAuthStore } from '../stores/authStore';
import { useUIStore } from '../stores/uiStore';

const PIN_LENGTH = 4;

function PinDot({ filled, index }: { filled: boolean; index: number }) {
  const scale = useSharedValue(0);

  useEffect(() => {
    scale.value = withDelay(
      index * 60,
      withSpring(filled ? 1 : 0.6, { damping: 12, stiffness: 200 }),
    );
  }, [filled, index, scale]);

  const style = useAnimatedStyle(() => ({
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: filled ? '#007AFF' : '#E5E5EA',
    transform: [{ scale: scale.value }],
    marginHorizontal: 10,
  }));

  return <Animated.View style={style} />;
}

function NumpadButton({
  value,
  onPress,
}: {
  value: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: pressed ? '#D6E4FF' : '#EDF2FA',
        alignItems: 'center',
        justifyContent: 'center',
        margin: 8,
      })}
    >
      <Text style={{ fontSize: 28, fontWeight: '500', color: '#007AFF' }}>
        {value}
      </Text>
    </Pressable>
  );
}

export function PinGate({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const { hasPin, unlocked, verifyPin, setPin } = usePinStore();
  const { user, clear: clearAuth } = useAuthStore();
  const showConfirm = useUIStore((s) => s.showConfirm);

  const [digits, setDigits] = useState<string[]>([]);
  const [isSetup, setIsSetup] = useState(false);
  const [setupStep, setSetupStep] = useState<'create' | 'confirm'>('create');
  const [firstPin, setFirstPin] = useState('');
  const [error, setError] = useState('');

  // Shake animation on wrong PIN
  const shakeX = useSharedValue(0);
  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  // Entry animations
  const headerOpacity = useSharedValue(0);
  const padScale = useSharedValue(0.9);

  useEffect(() => {
    if ((hasPin && !unlocked) || isSetup) {
      headerOpacity.value = withTiming(1, { duration: 400 });
      padScale.value = withSpring(1, { damping: 14 });
    }
  }, [hasPin, unlocked, isSetup, headerOpacity, padScale]);

  const headerStyle = useAnimatedStyle(() => ({ opacity: headerOpacity.value }));
  const padStyle = useAnimatedStyle(() => ({
    transform: [{ scale: padScale.value }],
  }));

  // Check if user is logged in but has no PIN → prompt setup
  useEffect(() => {
    if (user && !hasPin && !unlocked) {
      setIsSetup(true);
      setSetupStep('create');
    }
  }, [user, hasPin, unlocked]);

  const shake = () => {
    shakeX.value = withSequence(
      withTiming(-12, { duration: 50 }),
      withTiming(12, { duration: 50 }),
      withTiming(-8, { duration: 50 }),
      withTiming(8, { duration: 50 }),
      withTiming(0, { duration: 50 }),
    );
  };

  const handleDigit = (d: string) => {
    if (digits.length >= PIN_LENGTH) return;
    const next = [...digits, d];
    setDigits(next);
    setError('');

    if (next.length === PIN_LENGTH) {
      const pin = next.join('');

      if (isSetup) {
        if (setupStep === 'create') {
          setFirstPin(pin);
          setSetupStep('confirm');
          setDigits([]);
        } else {
          if (pin === firstPin) {
            setPin(pin);
            setIsSetup(false);
          } else {
            shake();
            setError(t('pin.mismatch'));
            setTimeout(() => {
              setDigits([]);
              setSetupStep('create');
              setFirstPin('');
            }, 600);
          }
        }
      } else {
        const ok = verifyPin(pin);
        if (!ok) {
          shake();
          setError(t('pin.wrong'));
          setTimeout(() => setDigits([]), 500);
        }
      }
    }
  };

  const handleDelete = () => {
    setDigits((prev) => prev.slice(0, -1));
    setError('');
  };

  const handleForgetCode = () => {
    showConfirm({
      variant: 'destructive',
      icon: '🔑',
      title: t('pin.forgetTitle'),
      message: t('pin.forgetDesc'),
      confirmLabel: t('profile.signOut'),
      onConfirm: () => {
        usePinStore.getState().clearPin();
        clearAuth();
      },
    });
  };

  const handleLogout = () => {
    showConfirm({
      variant: 'destructive',
      icon: '👋',
      title: t('profile.signOutTitle'),
      message: t('profile.signOutConfirm'),
      confirmLabel: t('profile.signOut'),
      onConfirm: () => {
        usePinStore.getState().clearPin();
        clearAuth();
      },
    });
  };

  // Show PIN screen if locked or in setup mode
  if ((hasPin && !unlocked && user) || (isSetup && user)) {
    const title = isSetup
      ? setupStep === 'create'
        ? t('pin.createTitle')
        : t('pin.confirmTitle')
      : t('pin.enterTitle');

    const initials = user?.fullName
      ? user.fullName
          .split(' ')
          .slice(0, 2)
          .map((w) => w[0])
          .join('')
          .toUpperCase()
      : '?';

    return (
      <View className="flex-1 bg-[#F2F2F7] dark:bg-black">
        <View className="flex-1 items-center justify-center px-6">
          {/* User avatar & name */}
          <Animated.View style={[{ alignItems: 'center' }, headerStyle]}>
            <View style={{ width: 72, height: 72, alignItems: 'center', justifyContent: 'center' }}>
              <Svg width={72} height={72}>
                <Defs>
                  <LinearGradient id="avatarGrad" x1="0" y1="0" x2="1" y2="1">
                    <Stop offset="0" stopColor="#339AFF" />
                    <Stop offset="1" stopColor="#007AFF" />
                  </LinearGradient>
                </Defs>
                <Circle cx={36} cy={36} r={34} fill="url(#avatarGrad)" />
                <Circle cx={36} cy={36} r={32} stroke="#fff" strokeWidth={2} fill="none" opacity={0.2} />
              </Svg>
              <Text style={{ position: 'absolute', fontSize: 24, fontWeight: '700', color: '#fff' }}>
                {initials}
              </Text>
            </View>
            <Text className="mt-2 text-[18px] font-bold text-black dark:text-white">
              {user?.fullName}
            </Text>

            {/* Title */}
            <Text className="mt-5 text-[17px] text-black dark:text-white">
              {title}
            </Text>

            {/* PIN dots */}
            <Animated.View style={[{ flexDirection: 'row', marginTop: 20 }, shakeStyle]}>
              {Array.from({ length: PIN_LENGTH }).map((_, i) => (
                <PinDot key={i} index={i} filled={i < digits.length} />
              ))}
            </Animated.View>

            {/* Error */}
            {error ? (
              <Text className="mt-3 text-[13px] text-[#FF3B30]">{error}</Text>
            ) : (
              <View style={{ height: 22 }} />
            )}
          </Animated.View>

          {/* Numpad */}
          <Animated.View style={[{ marginTop: 20, alignItems: 'center' }, padStyle]}>
            {[[1, 2, 3], [4, 5, 6], [7, 8, 9]].map((row, ri) => (
              <View key={ri} style={{ flexDirection: 'row' }}>
                {row.map((n) => (
                  <NumpadButton
                    key={n}
                    value={String(n)}
                    onPress={() => handleDigit(String(n))}
                  />
                ))}
              </View>
            ))}
            <View style={{ flexDirection: 'row' }}>
              {/* Forget code */}
              {!isSetup ? (
                <Pressable
                  onPress={handleForgetCode}
                  style={{ width: 80, height: 80, margin: 8, alignItems: 'center', justifyContent: 'center' }}
                >
                  <Text style={{ fontSize: 12, color: '#8E8E93', textAlign: 'center' }}>
                    {t('pin.forget')}
                  </Text>
                </Pressable>
              ) : (
                <View style={{ width: 96, height: 96 }} />
              )}

              {/* 0 */}
              <NumpadButton value="0" onPress={() => handleDigit('0')} />

              {/* Delete */}
              <Pressable
                onPress={handleDelete}
                style={{ width: 80, height: 80, margin: 8, alignItems: 'center', justifyContent: 'center' }}
              >
                <Text style={{ fontSize: 24, color: '#007AFF' }}>⌫</Text>
              </Pressable>
            </View>
          </Animated.View>

          {/* Logout */}
          {!isSetup ? (
            <Pressable onPress={handleLogout} style={{ marginTop: 20 }}>
              <Text className="text-[14px] text-[#8E8E93]">{t('profile.signOut')}</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    );
  }

  return <>{children}</>;
}
