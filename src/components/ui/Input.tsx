import { forwardRef, useEffect, useState } from 'react';
import {
  Pressable,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  isPassword?: boolean;
  containerClassName?: string;
}

export const Input = forwardRef<TextInput, InputProps>(function Input(
  { label, error, isPassword, containerClassName = '', ...props },
  ref,
) {
  const { t } = useTranslation();
  const [hidden, setHidden] = useState(!!isPassword);

  const errorOpacity = useSharedValue(0);
  const errorY = useSharedValue(6);
  const shakeX = useSharedValue(0);

  useEffect(() => {
    if (error) {
      errorOpacity.value = withTiming(1, { duration: 200 });
      errorY.value = withSpring(0, { damping: 14, stiffness: 200 });
      shakeX.value = withSequence(
        withTiming(-6, { duration: 40 }),
        withTiming(6, { duration: 40 }),
        withTiming(-4, { duration: 40 }),
        withTiming(4, { duration: 40 }),
        withTiming(0, { duration: 40 }),
      );
    } else {
      errorOpacity.value = withTiming(0, { duration: 150 });
      errorY.value = 6;
    }
  }, [error, errorOpacity, errorY, shakeX]);

  const errorStyle = useAnimatedStyle(() => ({
    opacity: errorOpacity.value,
    transform: [{ translateY: errorY.value }],
  }));

  const containerShake = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  return (
    <View className={`mb-3 ${containerClassName}`}>
      {label ? (
        <Text className="mb-1.5 text-[13px] font-medium text-[#3C3C43] dark:text-[#EBEBF5]">
          {label}
        </Text>
      ) : null}
      <Animated.View style={containerShake}>
        <View
          className={`flex-row items-center rounded-[12px] bg-[#F2F2F7] dark:bg-[#2C2C2E] px-4 ${
            error ? 'border border-[#FF3B30]' : ''
          }`}
          style={{ height: 48 }}
        >
          <TextInput
            ref={ref}
            className="flex-1 text-[17px] text-black dark:text-white"
            placeholderTextColor="#8E8E93"
            secureTextEntry={hidden}
            autoCapitalize={isPassword ? 'none' : props.autoCapitalize}
            {...props}
            // Transparent TextInput background softens the iOS autofill /
            // Strong-Password yellow highlight that paints the TextInput's
            // own layer. Kept after spread so caller-provided style merges
            // on top but the transparent fallback always applies.
            style={[{ backgroundColor: 'transparent' }, props.style as object]}
          />
          {isPassword ? (
            <Pressable onPress={() => setHidden((v) => !v)} hitSlop={12}>
              <Text className="text-[15px] text-[#007AFF]">
                {hidden ? t('auth.showPassword') : t('auth.hidePassword')}
              </Text>
            </Pressable>
          ) : null}
        </View>
      </Animated.View>
      {error ? (
        <Animated.View style={[{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }, errorStyle]}>
          <View
            style={{
              width: 14,
              height: 14,
              borderRadius: 7,
              backgroundColor: '#FF3B30',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 5,
            }}
          >
            <Text style={{ color: '#fff', fontSize: 9, fontWeight: '700' }}>!</Text>
          </View>
          <Text style={{ fontSize: 12, color: '#FF3B30', flex: 1 }}>{error}</Text>
        </Animated.View>
      ) : null}
    </View>
  );
});
