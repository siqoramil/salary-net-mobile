import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';

interface LoadingSpinnerProps {
  color?: string;
  size?: 'small' | 'large';
  className?: string;
}

const DOT_COUNT = 3;
const DURATION = 400;
const STAGGER = 150;

function Dot({ index, color, dotSize }: { index: number; color: string; dotSize: number }) {
  const scale = useSharedValue(0.4);
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    const delay = index * STAGGER;
    scale.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: DURATION, easing: Easing.out(Easing.ease) }),
          withTiming(0.4, { duration: DURATION, easing: Easing.in(Easing.ease) }),
        ),
        -1,
      ),
    );
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: DURATION, easing: Easing.out(Easing.ease) }),
          withTiming(0.3, { duration: DURATION, easing: Easing.in(Easing.ease) }),
        ),
        -1,
      ),
    );
  }, [index, scale, opacity]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      style={[
        {
          width: dotSize,
          height: dotSize,
          borderRadius: dotSize / 2,
          backgroundColor: color,
          marginHorizontal: dotSize * 0.4,
        },
        style,
      ]}
    />
  );
}

export function LoadingSpinner({
  color = '#007AFF',
  size = 'small',
  className = '',
}: LoadingSpinnerProps) {
  const dotSize = size === 'large' ? 10 : 7;

  return (
    <View className={`flex-row items-center justify-center ${className}`}>
      {Array.from({ length: DOT_COUNT }).map((_, i) => (
        <Dot key={i} index={i} color={color} dotSize={dotSize} />
      ))}
    </View>
  );
}
