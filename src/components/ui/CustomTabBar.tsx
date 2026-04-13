import { useEffect } from 'react';
import { Platform, Pressable, View } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

import { useThemeStore } from '../../stores/themeStore';

const SPRING_CONFIG = { damping: 15, stiffness: 200 };

function TabItem({
  label,
  icon,
  isFocused,
  onPress,
  onLongPress,
  activeTint,
  inactiveTint,
}: {
  label: string;
  icon: (props: { color: string; size: number }) => React.ReactNode;
  isFocused: boolean;
  onPress: () => void;
  onLongPress: () => void;
  activeTint: string;
  inactiveTint: string;
}) {
  const progress = useSharedValue(isFocused ? 1 : 0);
  const scale = useSharedValue(1);

  useEffect(() => {
    progress.value = withSpring(isFocused ? 1 : 0, SPRING_CONFIG);
  }, [isFocused, progress]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value * (1 + progress.value * 0.1) }],
  }));

  const dotStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: progress.value }],
  }));

  const handlePress = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    scale.value = withSpring(0.85, { damping: 15, stiffness: 400 });
    setTimeout(() => {
      scale.value = withSpring(1, SPRING_CONFIG);
    }, 80);
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      onLongPress={onLongPress}
      accessibilityRole="button"
      accessibilityState={isFocused ? { selected: true } : {}}
      accessibilityLabel={label}
      style={{ flex: 1, alignItems: 'center', paddingVertical: 8 }}
    >
      <Animated.View style={iconStyle}>
        {icon({
          color: isFocused ? activeTint : inactiveTint,
          size: 26,
        })}
      </Animated.View>
      <Animated.View
        style={[
          {
            width: 4,
            height: 4,
            borderRadius: 2,
            backgroundColor: activeTint,
            marginTop: 3,
          },
          dotStyle,
        ]}
      />
    </Pressable>
  );
}

export function CustomTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const isDark = useThemeStore((s) => s.resolved) === 'dark';

  const focusedOptions = descriptors[state.routes[state.index].key].options;
  const activeTint =
    (focusedOptions.tabBarActiveTintColor as string) ?? '#007AFF';
  const inactiveTint =
    (focusedOptions.tabBarInactiveTintColor as string) ?? '#8E8E93';

  return (
    <View
      style={{
        position: 'absolute',
        bottom: Platform.OS === 'ios' ? 28 : 16,
        left: 20,
        right: 20,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
          borderRadius: 24,
          paddingVertical: 6,
          paddingHorizontal: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: isDark ? 0.3 : 0.12,
          shadowRadius: 24,
          elevation: 12,
          borderWidth: 1,
          borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
        }}
      >
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label =
            typeof options.tabBarLabel === 'string'
              ? options.tabBarLabel
              : typeof options.title === 'string'
                ? options.title
                : route.name;

          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          const icon = options.tabBarIcon as
            | ((props: { color: string; size: number }) => React.ReactNode)
            | undefined;

          return (
            <TabItem
              key={route.key}
              label={label}
              icon={icon ?? (() => null)}
              isFocused={isFocused}
              onPress={onPress}
              onLongPress={onLongPress}
              activeTint={activeTint}
              inactiveTint={inactiveTint}
            />
          );
        })}
      </View>
    </View>
  );
}
