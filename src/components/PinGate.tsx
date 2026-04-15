import { useEffect, useRef, useState } from 'react';
import { Pressable, Text, View, useColorScheme, useWindowDimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import { usePinStore } from '../stores/pinStore';
import { useAuthStore } from '../stores/authStore';
import { useUIStore } from '../stores/uiStore';

const PIN_LENGTH = 4;
const PRIMARY = '#6C63FF';

// ─── PIN dot ─────────────────────────────────────────────────────────────────
function PinDot({ filled, isDark }: { filled: boolean; isDark: boolean }) {
  const scale = useSharedValue(1);

  useEffect(() => {
    if (filled) {
      scale.value = withSequence(
        withTiming(1.2, { duration: 70 }),
        withSpring(1, { damping: 12, stiffness: 300 }),
      );
    }
  }, [filled, scale]);

  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View
      style={[
        {
          width: 54,
          height: 54,
          borderRadius: 27,
          borderWidth: filled ? 2 : 1.5,
          borderColor: filled ? PRIMARY : isDark ? '#48484A' : '#DCDCE4',
          backgroundColor: filled ? '#EDE9FF' : 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
          marginHorizontal: 10,
        },
        animStyle,
      ]}
    >
      {filled ? (
        <Text style={{ fontSize: 15, color: PRIMARY, fontWeight: '800' }}>✱</Text>
      ) : null}
    </Animated.View>
  );
}

// ─── PinGate ─────────────────────────────────────────────────────────────────
export function PinGate({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const isDark = useColorScheme() === 'dark';
  const { width: screenW } = useWindowDimensions();

  const { hasPin, unlocked, verifyPin, setPin } = usePinStore();
  const { user, clear: clearAuth } = useAuthStore();
  const showConfirm = useUIStore((s) => s.showConfirm);

  const [digits, setDigits] = useState<string[]>([]);
  const [isSetup, setIsSetup] = useState(false);
  const [setupStep, setSetupStep] = useState<'create' | 'confirm'>('create');
  const [firstPin, setFirstPin] = useState('');
  const [error, setError] = useState('');

  const didSetupRef = useRef(false);

  // Shake animation
  const shakeX = useSharedValue(0);
  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  // Fade-in on mount
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);
  const fadeStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  useEffect(() => {
    if ((hasPin && !unlocked) || isSetup) {
      opacity.value = withTiming(1, { duration: 340 });
      translateY.value = withSpring(0, { damping: 20, stiffness: 160 });
    }
  }, [hasPin, unlocked, isSetup, opacity, translateY]);

  useEffect(() => {
    if (!user) didSetupRef.current = false;
  }, [user]);

  useEffect(() => {
    if (user && !hasPin && !didSetupRef.current) {
      didSetupRef.current = true;
      setIsSetup(true);
      setSetupStep('create');
      setDigits([]);
      setFirstPin('');
      setError('');
    }
  }, [user, hasPin]);

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

  if (!((hasPin && !unlocked && user) || (isSetup && user))) {
    return <>{children}</>;
  }

  // ─── Grid math ───────────────────────────────────────────────────────────────
  // Each cell is exactly 1/3 of screen width; button is centered inside the cell.
  const CELL_W = Math.floor(screenW / 3);
  const CELL_H = Math.round(CELL_W * 0.9);
  const BTN    = Math.round(CELL_W * 0.62); // ≈ 80px on 390px screen
  const ICON_SIZE = Math.round(BTN * 0.38);
  const FONT_SIZE  = Math.round(BTN * 0.40);

  // ─── Colors ─────────────────────────────────────────────────────────────────
  const bg        = isDark ? '#000' : '#FFF';
  const textColor = isDark ? '#FFF' : '#1C1C1E';
  const btnBg     = isDark ? '#2C2C2E' : '#E4E4EB';
  const iconColor = isDark ? '#8E8E93' : '#636366';

  const title = isSetup
    ? setupStep === 'create' ? t('pin.createTitle') : t('pin.confirmTitle')
    : t('pin.enterTitle');

  const subtitle = isSetup
    ? setupStep === 'create' ? t('pin.createSubtitle') : t('pin.confirmSubtitle')
    : null;

  // ─── Cell wrapper — guarantees even grid placement ───────────────────────────
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
            <Text
              style={{
                fontSize: FONT_SIZE,
                fontWeight: '300',
                color: pressed && isDigit ? '#FFF' : textColor,
                includeFontPadding: false,
              }}
            >
              {children}
            </Text>
          ) : (
            children
          )
        }
      </Pressable>
    </View>
  );

  // ─── Forgot-PIN cell (not a round button, just centered text) ───────────────
  const ForgotCell = () => (
    <View style={{ width: CELL_W, height: CELL_H, alignItems: 'center', justifyContent: 'center' }}>
      {!isSetup ? (
        <Pressable onPress={handleForgetCode} hitSlop={12}>
          <Text
            style={{
              fontSize: 12,
              fontWeight: '600',
              color: PRIMARY,
              textAlign: 'center',
              lineHeight: 17,
            }}
          >
            {t('pin.forget')}?
          </Text>
        </Pressable>
      ) : null}
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      <Animated.View
        style={[
          { flex: 1, alignItems: 'center', justifyContent: 'center' },
          fadeStyle,
        ]}
      >
        {/* Lock icon */}
        <View
          style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: PRIMARY,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: PRIMARY,
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.32,
            shadowRadius: 18,
            elevation: 10,
          }}
        >
          <Ionicons
            name={isSetup ? 'lock-open-outline' : 'lock-closed-outline'}
            size={36}
            color="#fff"
          />
        </View>

        {/* Title */}
        <Text
          style={{
            marginTop: 20,
            fontSize: 22,
            fontWeight: '700',
            color: textColor,
            letterSpacing: -0.2,
          }}
        >
          {title}
        </Text>

        {/* Subtitle */}
        <Text
          style={{
            marginTop: 6,
            fontSize: 14,
            color: '#8E8E93',
            opacity: subtitle ? 1 : 0,
          }}
        >
          {subtitle ?? ' '}
        </Text>

        {/* PIN dots */}
        <Animated.View style={[{ flexDirection: 'row', marginTop: 28 }, shakeStyle]}>
          {Array.from({ length: PIN_LENGTH }).map((_, i) => (
            <PinDot key={i} filled={i < digits.length} isDark={isDark} />
          ))}
        </Animated.View>

        {/* Error */}
        <View style={{ height: 22, justifyContent: 'center', marginTop: 6 }}>
          {error ? (
            <Text style={{ fontSize: 13, color: '#FF3B30' }}>{error}</Text>
          ) : null}
        </View>

        {/* Numpad — each row is exactly screenW wide, cells use flex */}
        <View style={{ width: screenW, marginTop: 6 }}>
          {/* Rows 1–9 */}
          {([[1, 2, 3], [4, 5, 6], [7, 8, 9]] as number[][]).map((row, ri) => (
            <View key={ri} style={{ flexDirection: 'row' }}>
              {row.map((n) => (
                <Cell key={n} onPress={() => handleDigit(String(n))} isDigit>
                  {String(n)}
                </Cell>
              ))}
            </View>
          ))}

          {/* Bottom row */}
          <View style={{ flexDirection: 'row' }}>
            <ForgotCell />
            <Cell onPress={() => handleDigit('0')} isDigit>0</Cell>
            <Cell onPress={handleDelete}>
              <Ionicons name="backspace-outline" size={ICON_SIZE} color={iconColor} />
            </Cell>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}
