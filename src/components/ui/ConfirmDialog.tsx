import { useEffect } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

import { useUIStore, type ConfirmVariant } from '../../stores/uiStore';

const VARIANTS: Record<ConfirmVariant, { accent: string; ring: string }> = {
  default: { accent: '#007AFF', ring: 'rgba(0,122,255,0.12)' },
  destructive: { accent: '#FF3B30', ring: 'rgba(255,59,48,0.12)' },
};

export function ConfirmDialog() {
  const { t } = useTranslation();
  const confirm = useUIStore((s) => s.confirm);
  const hide = useUIStore((s) => s.hideConfirm);

  const scale = useSharedValue(0.9);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (confirm.visible) {
      opacity.value = withTiming(1, { duration: 200, easing: Easing.out(Easing.quad) });
      scale.value = withSpring(1, { damping: 18, stiffness: 260, mass: 0.9 });
    } else {
      opacity.value = withTiming(0, { duration: 160 });
      scale.value = withTiming(0.92, { duration: 160 });
    }
  }, [confirm.visible, opacity, scale]);

  const backdropStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  const cardStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const handleCancel = () => {
    confirm.onCancel?.();
    hide();
  };

  const handleConfirm = () => {
    confirm.onConfirm?.();
    hide();
  };

  const v = VARIANTS[confirm.variant];

  return (
    <Modal
      visible={confirm.visible}
      transparent
      animationType="none"
      onRequestClose={handleCancel}
      statusBarTranslucent
    >
      <View className="flex-1 items-center justify-center">
        <Animated.View
          pointerEvents="auto"
          style={[
            {
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.55)',
            },
            backdropStyle,
          ]}
        >
          <Pressable className="flex-1" onPress={handleCancel} />
        </Animated.View>

        <Animated.View
          className="w-[86%] max-w-[340px] overflow-hidden rounded-[22px] bg-white dark:bg-[#1C1C1E]"
          style={[
            {
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 12 },
              shadowOpacity: 0.3,
              shadowRadius: 28,
              elevation: 16,
            },
            cardStyle,
          ]}
        >
          {/* Icon */}
          {confirm.icon ? (
            <View className="mt-5 items-center">
              <View
                className="h-[56px] w-[56px] items-center justify-center rounded-full"
                style={{ backgroundColor: v.ring }}
              >
                <Text style={{ fontSize: 28 }}>{confirm.icon}</Text>
              </View>
            </View>
          ) : null}

          {/* Title + message */}
          <View className={`px-6 ${confirm.icon ? 'mt-3' : 'mt-6'}`}>
            <Text
              className="text-center text-[18px] font-bold text-black dark:text-white"
              numberOfLines={2}
            >
              {confirm.title}
            </Text>
            {confirm.message ? (
              <Text className="mt-2 text-center text-[14px] leading-[19px] text-[#3C3C43]/75 dark:text-[#EBEBF5]/70">
                {confirm.message}
              </Text>
            ) : null}
          </View>

          {/* Actions */}
          <View className="mt-5 flex-row border-t border-[#F2F2F7] dark:border-[#38383A]">
            <Pressable
              onPress={handleCancel}
              className="flex-1 items-center justify-center border-r border-[#F2F2F7] py-[14px] active:bg-[#F2F2F7] dark:border-[#38383A] dark:active:bg-[#2C2C2E]"
            >
              <Text className="text-[16px] font-medium text-[#8E8E93]">
                {confirm.cancelLabel ?? t('common.cancel')}
              </Text>
            </Pressable>
            <Pressable
              onPress={handleConfirm}
              className="flex-1 items-center justify-center py-[14px] active:bg-[#F2F2F7] dark:active:bg-[#2C2C2E]"
            >
              <Text
                className="text-[16px] font-semibold"
                style={{ color: v.accent }}
              >
                {confirm.confirmLabel ?? t('common.confirm')}
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
