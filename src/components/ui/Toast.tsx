import { useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

export type ToastType = 'error' | 'success' | 'info';

interface ToastProps {
  visible: boolean;
  type?: ToastType;
  title: string;
  message?: string;
  duration?: number;
  onDismiss: () => void;
}

const COLORS: Record<ToastType, { bg: string; border: string; icon: string }> = {
  error: { bg: '#FFF2F2', border: '#FF3B30', icon: '✕' },
  success: { bg: '#F0FFF4', border: '#007AFF', icon: '✓' },
  info: { bg: '#F0F6FF', border: '#007AFF', icon: 'i' },
};

const DARK_COLORS: Record<ToastType, { bg: string; border: string }> = {
  error: { bg: '#2C1010', border: '#FF3B30' },
  success: { bg: '#0A1F10', border: '#007AFF' },
  info: { bg: '#0A1520', border: '#007AFF' },
};

export function Toast({
  visible,
  type = 'error',
  title,
  message,
  duration = 3500,
  onDismiss,
}: ToastProps) {
  const translateY = useSharedValue(-120);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      translateY.value = withTiming(0, { duration: 350, easing: Easing.out(Easing.cubic) });
      opacity.value = withTiming(1, { duration: 300 });

      // Auto dismiss
      translateY.value = withDelay(
        duration,
        withTiming(-120, { duration: 300, easing: Easing.in(Easing.cubic) }),
      );
      opacity.value = withDelay(duration, withTiming(0, { duration: 250 }, () => {
        runOnJS(onDismiss)();
      }));
    }
  }, [visible, duration, onDismiss, translateY, opacity]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  if (!visible) return null;

  const c = COLORS[type];

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          top: 60,
          left: 16,
          right: 16,
          zIndex: 9999,
        },
        animStyle,
      ]}
    >
      <Pressable onPress={onDismiss}>
        <View
          className="dark:border-opacity-50"
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: c.bg,
            borderRadius: 16,
            borderLeftWidth: 4,
            borderLeftColor: c.border,
            paddingHorizontal: 16,
            paddingVertical: 14,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.12,
            shadowRadius: 12,
            elevation: 8,
          }}
        >
          {/* Icon */}
          <View
            style={{
              width: 28,
              height: 28,
              borderRadius: 14,
              backgroundColor: c.border,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 12,
            }}
          >
            <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>{c.icon}</Text>
          </View>

          {/* Text */}
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 15, fontWeight: '600', color: '#000' }}>{title}</Text>
            {message ? (
              <Text style={{ fontSize: 13, color: '#8E8E93', marginTop: 2 }}>{message}</Text>
            ) : null}
          </View>

          {/* Close */}
          <Text style={{ fontSize: 18, color: '#8E8E93', marginLeft: 8 }}>×</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}
