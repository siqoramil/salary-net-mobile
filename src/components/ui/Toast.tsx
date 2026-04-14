import { useEffect } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

export type ToastType = 'error' | 'success' | 'info' | 'warning';

interface ToastProps {
  visible: boolean;
  type?: ToastType;
  title: string;
  message?: string;
  duration?: number;
  onDismiss: () => void;
}

const ICON_CLASSES: Record<ToastType, { bg: string; glyph: string }> = {
  error: { bg: 'bg-[#FF3B30]', glyph: '!' },
  success: { bg: 'bg-[#34C759]', glyph: '✓' },
  warning: { bg: 'bg-[#FF9500]', glyph: '!' },
  info: { bg: 'bg-[#007AFF]', glyph: 'i' },
};

export function Toast({
  visible,
  type = 'error',
  title,
  message,
  duration = 3500,
  onDismiss,
}: ToastProps) {
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(-160);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (!visible) {
      translateY.value = -160;
      opacity.value = 0;
      return;
    }

    translateY.value = withSequence(
      withSpring(0, { damping: 18, stiffness: 160, mass: 0.9 }),
      withDelay(
        duration,
        withTiming(-160, { duration: 280, easing: Easing.in(Easing.cubic) }),
      ),
    );

    opacity.value = withSequence(
      withTiming(1, { duration: 220, easing: Easing.out(Easing.quad) }),
      withDelay(
        duration,
        withTiming(
          0,
          { duration: 240, easing: Easing.in(Easing.quad) },
          (finished) => {
            if (finished) runOnJS(onDismiss)();
          },
        ),
      ),
    );
  }, [visible, duration, onDismiss, translateY, opacity, title, message]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  if (!visible) return null;

  const icon = ICON_CLASSES[type];

  return (
    <Animated.View
      pointerEvents="box-none"
      className="absolute left-0 right-0 z-[9999] items-center"
      style={[{ top: insets.top + 8 }, animStyle]}
    >
      <Pressable
        onPress={onDismiss}
        className="mx-3 w-[94%] max-w-[440px] active:opacity-95"
      >
        <View
          className="flex-row items-center rounded-[22px] bg-white/95 px-[14px] py-[12px] dark:bg-[#2C2C2E]/95"
          style={
            Platform.OS === 'ios'
              ? {
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 12 },
                  shadowOpacity: 0.18,
                  shadowRadius: 28,
                }
              : { elevation: 14 }
          }
        >
          {/* App-style icon badge */}
          <View
            className={`h-[38px] w-[38px] items-center justify-center rounded-[10px] ${icon.bg}`}
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.15,
              shadowRadius: 4,
            }}
          >
            <Text className="text-[20px] font-bold leading-[24px] text-white">
              {icon.glyph}
            </Text>
          </View>

          {/* Text block */}
          <View className="ml-3 flex-1">
            <View className="flex-row items-center justify-between">
              <Text
                className="flex-1 text-[15px] font-semibold text-black dark:text-white"
                numberOfLines={1}
              >
                {title}
              </Text>
              <Text className="ml-2 text-[12px] font-medium text-[#8E8E93] dark:text-[#8E8E93]">
                now
              </Text>
            </View>
            {message ? (
              <Text
                className="mt-[2px] text-[13px] leading-[17px] text-[#3C3C43]/80 dark:text-[#EBEBF5]/80"
                numberOfLines={2}
              >
                {message}
              </Text>
            ) : null}
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}
