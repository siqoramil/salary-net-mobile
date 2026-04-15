import { useEffect, useRef, useState } from 'react';
import { Image, Pressable, Text, TouchableOpacity, View, useColorScheme, useWindowDimensions } from 'react-native';
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
const BLUE         = '#5B88D6';
const BLUE_BG      = '#D8E9F8';
const BLUE_PRESSED = '#C2D8F2';

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
          width: 14,
          height: 14,
          borderRadius: 7,
          backgroundColor: filled ? BLUE : (isDark ? '#3A3A3C' : '#D1D8E8'),
          marginHorizontal: 10,
        },
        animStyle,
      ]}
    />
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

  const shakeX = useSharedValue(0);
  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);
  const fadeStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  useEffect(() => {
    if ((hasPin && !unlocked) || isSetup) {
      opacity.value = withTiming(1, { duration: 300 });
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

  // ─── Grid ─────────────────────────────────────────────────────────────────
  const CELL_W  = Math.floor(screenW / 3);
  const CELL_H  = Math.round(CELL_W * 0.88);
  const BTN     = Math.round(CELL_W * 0.56);
  const ICON_SZ = Math.round(BTN * 0.36);
  const FONT_SZ = Math.round(BTN * 0.38);

  const bg        = isDark ? '#000' : '#FFF';
  const textColor = isDark ? '#FFF' : '#1C1C1E';
  const btnBg     = isDark ? '#1C2740' : BLUE_BG;
  const btnPressed = isDark ? '#243252' : BLUE_PRESSED;
  const iconColor = isDark ? '#8E8E93' : '#3C3C43';

  const title = isSetup
    ? setupStep === 'create' ? t('pin.createTitle') : t('pin.confirmTitle')
    : t('pin.enterTitle');

  const subtitle = isSetup
    ? setupStep === 'create' ? t('pin.createSubtitle') : t('pin.confirmSubtitle')
    : null;

  // ─── Numpad cell ──────────────────────────────────────────────────────────
  const numBg = isDark ? '#1C2740' : BLUE_BG;

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      <Animated.View style={[{ flex: 1 }, fadeStyle]}>

        {/* ── Top: logo + title + dots ── */}
        <View style={{ alignItems: 'center', paddingTop: 40 }}>
          <Image
            source={require('../../assets/images/icon.png')}
            style={{ width: 200, height: 200, borderRadius: 42 }}
            resizeMode="contain"
          />
          <Text style={{ marginTop: 12, fontSize: 22, fontWeight: '700', color: textColor, letterSpacing: -0.2 }}>
            {title}
          </Text>
          <Text style={{ marginTop: 4, fontSize: 14, color: '#8E8E93', opacity: subtitle ? 1 : 0 }}>
            {subtitle ?? ' '}
          </Text>
          <Animated.View style={[{ flexDirection: 'row', marginTop: 12 }, shakeStyle]}>
            {Array.from({ length: PIN_LENGTH }).map((_, i) => (
              <PinDot key={i} filled={i < digits.length} isDark={isDark} />
            ))}
          </Animated.View>
          <View style={{ height: 20, justifyContent: 'center', marginTop: 6 }}>
            {error ? <Text style={{ fontSize: 13, color: '#FF3B30' }}>{error}</Text> : null}
          </View>
        </View>

        {/* ── Bottom: numpad + sign out ── */}
        <View style={{ flex: 1, justifyContent: 'flex-end', paddingBottom: 36 }}>
          {/* Numpad */}
          <View style={{ width: screenW }}>
            {([[1, 2, 3], [4, 5, 6], [7, 8, 9]] as number[][]).map((row, ri) => (
              <View key={ri} style={{ flexDirection: 'row' }}>
                {row.map((n) => (
                  <View key={n} style={{ width: CELL_W, height: CELL_H, alignItems: 'center', justifyContent: 'center' }}>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => handleDigit(String(n))}
                      style={{ width: BTN, height: BTN, borderRadius: BTN / 2, backgroundColor: numBg, alignItems: 'center', justifyContent: 'center' }}
                    >
                      <Text style={{ fontSize: FONT_SZ, fontWeight: '300', color: BLUE, includeFontPadding: false }}>
                        {String(n)}
                      </Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            ))}

            {/* Bottom row */}
            <View style={{ flexDirection: 'row' }}>
              <View style={{ width: CELL_W, height: CELL_H, alignItems: 'center', justifyContent: 'center' }}>
                {!isSetup ? (
                  <Pressable onPress={handleForgetCode} hitSlop={12}>
                    <Text style={{ fontSize: 13, fontWeight: '500', color: BLUE, textAlign: 'center', lineHeight: 18 }}>
                      {t('pin.forget')}
                    </Text>
                  </Pressable>
                ) : null}
              </View>
              <View style={{ width: CELL_W, height: CELL_H, alignItems: 'center', justifyContent: 'center' }}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => handleDigit('0')}
                  style={{ width: BTN, height: BTN, borderRadius: BTN / 2, backgroundColor: numBg, alignItems: 'center', justifyContent: 'center' }}
                >
                  <Text style={{ fontSize: FONT_SZ, fontWeight: '300', color: BLUE, includeFontPadding: false }}>0</Text>
                </TouchableOpacity>
              </View>
              <View style={{ width: CELL_W, height: CELL_H, alignItems: 'center', justifyContent: 'center' }}>
                <TouchableOpacity activeOpacity={0.7} onPress={handleDelete}
                  style={{ width: BTN, height: BTN, borderRadius: BTN / 2, alignItems: 'center', justifyContent: 'center' }}
                >
                  <Ionicons name="backspace-outline" size={ICON_SZ} color={iconColor} />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Sign out */}
          {!isSetup ? (
            <Pressable onPress={handleForgetCode} style={{ alignSelf: 'center', marginTop: 20 }} hitSlop={10}>
              <Text style={{ fontSize: 15, color: '#AEAEAE', textDecorationLine: 'underline' }}>
                {t('profile.signOut')}
              </Text>
            </Pressable>
          ) : null}
        </View>

      </Animated.View>
    </View>
  );
}
