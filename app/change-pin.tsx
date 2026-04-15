import { useEffect, useState } from 'react';
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

const PRIMARY = '#6C63FF';
const PIN_LENGTH = 4;

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

  // Shake animation
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

  // ─── Layout ────────────────────────────────────────────────────────────────
  const CELL_W = Math.floor(screenW / 3);
  const CELL_H = Math.round(CELL_W * 0.9);
  const BTN = Math.round(CELL_W * 0.62);
  const ICON_SIZE = Math.round(BTN * 0.38);
  const FONT_SIZE = Math.round(BTN * 0.40);

  // ─── Colors ────────────────────────────────────────────────────────────────
  const bg = isDark ? '#000' : '#FFF';
  const textColor = isDark ? '#FFF' : '#1C1C1E';
  const btnBg = isDark ? '#2C2C2E' : '#E4E4EB';
  const iconColor = isDark ? '#8E8E93' : '#636366';

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
    isDigit = false,
  }: {
    onPress?: () => void;
    children: React.ReactNode;
    isDigit?: boolean;
  }) => (
    <View style={{ width: CELL_W, height: CELL_H, alignItems: 'center', justifyContent: 'center' }}>
      <Pressable
        onPress={onPress}
        disabled={!onPress}
        style={({ pressed }) => ({
          width: BTN,
          height: BTN,
          borderRadius: BTN / 2,
          backgroundColor: onPress
            ? pressed && isDigit ? PRIMARY : pressed ? `${PRIMARY}22` : btnBg
            : 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
        })}
      >
        {({ pressed }) =>
          typeof children === 'string' ? (
            <Text style={{
              fontSize: FONT_SIZE,
              fontWeight: '300',
              color: pressed && isDigit ? '#FFF' : textColor,
              includeFontPadding: false,
            }}>
              {children}
            </Text>
          ) : children
        }
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
        {/* Lock icon */}
        <View style={{
          width: 72,
          height: 72,
          borderRadius: 36,
          backgroundColor: PRIMARY,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: PRIMARY,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.30,
          shadowRadius: 16,
          elevation: 10,
        }}>
          <Ionicons name="lock-closed-outline" size={32} color="#fff" />
        </View>

        {/* Title */}
        <Text style={{
          marginTop: 20,
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
        <Animated.View style={[{ flexDirection: 'row', marginTop: 32 }, shakeStyle]}>
          {Array.from({ length: PIN_LENGTH }).map((_, i) => (
            <View key={i} style={{
              width: 14,
              height: 14,
              borderRadius: 7,
              marginHorizontal: 10,
              backgroundColor: i < digits.length ? PRIMARY : (isDark ? '#48484A' : '#DCDCE4'),
            }} />
          ))}
        </Animated.View>

        {/* Error */}
        <View style={{ height: 22, justifyContent: 'center', marginTop: 10 }}>
          {error ? (
            <Text style={{ fontSize: 13, color: '#FF3B30' }}>{error}</Text>
          ) : null}
        </View>

        {/* Numpad */}
        <View style={{ width: screenW, marginTop: 8 }}>
          {([[1, 2, 3], [4, 5, 6], [7, 8, 9]] as number[][]).map((row, ri) => (
            <View key={ri} style={{ flexDirection: 'row' }}>
              {row.map((n) => (
                <Cell key={n} onPress={() => handleDigit(String(n))} isDigit>
                  {String(n)}
                </Cell>
              ))}
            </View>
          ))}
          <View style={{ flexDirection: 'row' }}>
            {/* empty left cell */}
            <View style={{ width: CELL_W, height: CELL_H }} />
            <Cell onPress={() => handleDigit('0')} isDigit>0</Cell>
            <Cell onPress={handleDelete}>
              <Ionicons name="backspace-outline" size={ICON_SIZE} color={iconColor} />
            </Cell>
          </View>
        </View>
      </View>
    </View>
  );
}
