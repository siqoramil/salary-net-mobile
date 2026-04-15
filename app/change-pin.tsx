import { useState } from 'react';
import { Pressable, Text, View, useColorScheme, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { usePinStore } from '@/src/stores/pinStore';
import { useUIStore } from '@/src/stores/uiStore';

const PIN_LENGTH = 4;
const BLUE         = '#5B88D6';
const BLUE_BG      = '#D8E9F8';
const BLUE_PRESSED = '#C2D8F2';

type Step = 'verify' | 'create' | 'confirm';

export default function ChangePinScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const isDark = useColorScheme() === 'dark';
  const { width: screenW } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const { hasPin, verifyPin, setPin } = usePinStore();
  const showToast = useUIStore((s) => s.showToast);

  const [step, setStep] = useState<Step>(hasPin ? 'verify' : 'create');
  const [digits, setDigits] = useState<string[]>([]);
  const [firstPin, setFirstPin] = useState('');
  const [error, setError] = useState('');

  const shakeX = useSharedValue(0);
  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  const shake = () => {
    shakeX.value = withSequence(
      withTiming(-10, { duration: 45 }),
      withTiming(10, { duration: 45 }),
      withTiming(-7, { duration: 45 }),
      withTiming(7, { duration: 45 }),
      withTiming(0, { duration: 45 }),
    );
  };

  const handleDigit = (d: string) => {
    if (digits.length >= PIN_LENGTH) return;
    const next = [...digits, d];
    setDigits(next);
    setError('');

    if (next.length === PIN_LENGTH) {
      const pin = next.join('');

      if (step === 'verify') {
        if (verifyPin(pin)) {
          setStep('create');
          setDigits([]);
        } else {
          shake();
          setError(t('pin.wrong'));
          setTimeout(() => setDigits([]), 500);
        }
      } else if (step === 'create') {
        setFirstPin(pin);
        setStep('confirm');
        setDigits([]);
      } else {
        if (pin === firstPin) {
          setPin(pin);
          showToast({
            type: 'success',
            title: t('common.success'),
            message: t('profile.pinChanged'),
          });
          router.back();
        } else {
          shake();
          setError(t('pin.mismatch'));
          setTimeout(() => {
            setDigits([]);
            setStep('create');
            setFirstPin('');
          }, 600);
        }
      }
    }
  };

  const handleDelete = () => {
    setDigits((prev) => prev.slice(0, -1));
    setError('');
  };

  // ─── Grid ─────────────────────────────────────────────────────────────────
  const CELL_W  = Math.floor(screenW / 3);
  const CELL_H  = Math.round(CELL_W * 1.08);
  const BTN     = Math.round(CELL_W * 0.76);
  const ICON_SZ = Math.round(BTN * 0.36);
  const FONT_SZ = Math.round(BTN * 0.38);

  const bg        = isDark ? '#000' : '#FFF';
  const textColor = isDark ? '#FFF' : '#1C1C1E';
  const btnBg     = isDark ? '#1C2740' : BLUE_BG;
  const btnPressed = isDark ? '#243252' : BLUE_PRESSED;
  const iconColor = isDark ? '#8E8E93' : '#3C3C43';

  const title =
    step === 'verify'
      ? t('pin.enterCurrentTitle')
      : step === 'create'
        ? t('pin.createTitle')
        : t('pin.confirmTitle');

  const subtitle =
    step === 'verify'
      ? t('pin.enterSubtitle')
      : step === 'create'
        ? t('pin.createSubtitle')
        : t('pin.confirmSubtitle');

  // ─── Cell ─────────────────────────────────────────────────────────────────
  const Cell = ({
    onPress,
    children,
  }: {
    onPress?: () => void;
    children: React.ReactNode;
  }) => (
    <View style={{ width: CELL_W, height: CELL_H, alignItems: 'center', justifyContent: 'center' }}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => ({
          width: BTN,
          height: BTN,
          borderRadius: BTN / 2,
          backgroundColor: !onPress ? 'transparent' : pressed ? btnPressed : btnBg,
          alignItems: 'center',
          justifyContent: 'center',
        })}
      >
        {children}
      </Pressable>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      {/* Header */}
      <View style={{
        paddingTop: insets.top + 8,
        paddingHorizontal: 16,
        paddingBottom: 8,
        flexDirection: 'row',
        alignItems: 'center',
      }}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          style={({ pressed }) => ({
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: pressed ? (isDark ? '#2C2C2E' : '#F2F2F7') : 'transparent',
            alignItems: 'center',
            justifyContent: 'center',
          })}
        >
          <Ionicons name="chevron-back" size={24} color={textColor} />
        </Pressable>
        <Text style={{
          flex: 1,
          textAlign: 'center',
          fontSize: 17,
          fontWeight: '600',
          color: textColor,
          marginRight: 36,
        }}>
          {t('profile.pinCode')}
        </Text>
      </View>

      {/* Content */}
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        {/* Title */}
        <Text style={{
          fontSize: 22,
          fontWeight: '700',
          color: textColor,
          letterSpacing: -0.2,
        }}>
          {title}
        </Text>

        {/* Subtitle */}
        <Text style={{ marginTop: 6, fontSize: 14, color: '#8E8E93' }}>
          {subtitle}
        </Text>

        {/* PIN dots */}
        <Animated.View style={[{ flexDirection: 'row', marginTop: 28, marginBottom: 6 }, shakeStyle]}>
          {Array.from({ length: PIN_LENGTH }).map((_, i) => (
            <View key={i} style={{
              width: 14,
              height: 14,
              borderRadius: 7,
              marginHorizontal: 10,
              backgroundColor: i < digits.length ? BLUE : (isDark ? '#3A3A3C' : '#D1D8E8'),
            }} />
          ))}
        </Animated.View>

        {/* Error */}
        <View style={{ height: 22, justifyContent: 'center' }}>
          {error ? (
            <Text style={{ fontSize: 13, color: '#FF3B30' }}>{error}</Text>
          ) : null}
        </View>

        {/* Numpad */}
        <View style={{ width: screenW, marginTop: 12 }}>
          {([[1, 2, 3], [4, 5, 6], [7, 8, 9]] as number[][]).map((row, ri) => (
            <View key={ri} style={{ flexDirection: 'row' }}>
              {row.map((n) => (
                <Cell key={n} onPress={() => handleDigit(String(n))}>
                  <Text style={{ fontSize: FONT_SZ, fontWeight: '300', color: BLUE, includeFontPadding: false }}>
                    {String(n)}
                  </Text>
                </Cell>
              ))}
            </View>
          ))}

          {/* Bottom row */}
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: CELL_W, height: CELL_H }} />
            <Cell onPress={() => handleDigit('0')}>
              <Text style={{ fontSize: FONT_SZ, fontWeight: '300', color: BLUE, includeFontPadding: false }}>0</Text>
            </Cell>
            <Cell onPress={handleDelete}>
              <Ionicons name="backspace-outline" size={ICON_SZ} color={iconColor} />
            </Cell>
          </View>
        </View>
      </View>
    </View>
  );
}
