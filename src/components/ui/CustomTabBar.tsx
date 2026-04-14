import { useEffect, useState } from 'react';
import { Platform, Pressable, Text, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import * as Haptics from 'expo-haptics';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from 'react-native-reanimated';

import { useThemeStore } from '../../stores/themeStore';
import { useUIStore } from '../../stores/uiStore';

const SPRING_CONFIG = { damping: 15, stiffness: 200 };
const TAB_BAR_HEIGHT = 50;
const CORNER_RADIUS = 23;
const NOTCH_RADIUS = 26;
const NOTCH_LEAD = 14;
const FAB_SIZE = 54;
const FAB_OVERLAP = 20;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function buildTabBarPath(w: number): string {
  const cx = w / 2;
  const r = NOTCH_RADIUS;
  const h = TAB_BAR_HEIGHT;
  const cr = CORNER_RADIUS;
  const lead = NOTCH_LEAD;
  return [
    `M ${cr} 0`,
    `H ${cx - r - lead}`,
    `C ${cx - r} 0, ${cx - r} ${r}, ${cx} ${r}`,
    `C ${cx + r} ${r}, ${cx + r} 0, ${cx + r + lead} 0`,
    `H ${w - cr}`,
    `Q ${w} 0, ${w} ${cr}`,
    `V ${h - cr}`,
    `Q ${w} ${h}, ${w - cr} ${h}`,
    `H ${cr}`,
    `Q 0 ${h}, 0 ${h - cr}`,
    `V ${cr}`,
    `Q 0 0, ${cr} 0`,
    'Z',
  ].join(' ');
}

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
      style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
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

function CenterFab() {
  const openAddExpense = useUIStore((s) => s.openAddExpense);
  const scale = useSharedValue(1);

  const fabStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    scale.value = withSequence(
      withSpring(0.9, { damping: 15, stiffness: 400 }),
      withSpring(1, { damping: 12, stiffness: 200 }),
    );
    openAddExpense();
  };

  return (
    <AnimatedPressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel="Add expense"
      style={[
        {
          width: FAB_SIZE,
          height: FAB_SIZE,
          borderRadius: FAB_SIZE / 2,
          backgroundColor: '#007AFF',
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: '#007AFF',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.4,
          shadowRadius: 12,
          elevation: 12,
        },
        fabStyle,
      ]}
    >
      <Text style={{ color: '#fff', fontSize: 28, fontWeight: '300', lineHeight: 32 }}>
        +
      </Text>
    </AnimatedPressable>
  );
}

export function CustomTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const isDark = useThemeStore((s) => s.resolved) === 'dark';
  const [barWidth, setBarWidth] = useState(0);

  const focusedOptions = descriptors[state.routes[state.index].key].options;
  const activeTint =
    (focusedOptions.tabBarActiveTintColor as string) ?? '#007AFF';
  const inactiveTint =
    (focusedOptions.tabBarInactiveTintColor as string) ?? '#8E8E93';

  const middleIndex = Math.floor(state.routes.length / 2);
  const fillColor = isDark ? '#1C1C1E' : '#FFFFFF';
  const strokeColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)';

  const onBarLayout = (e: LayoutChangeEvent) => {
    const w = Math.round(e.nativeEvent.layout.width);
    if (w !== barWidth) setBarWidth(w);
  };

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        bottom: Platform.OS === 'ios' ? 28 : 16,
        left: 20,
        right: 20,
      }}
    >
      <View
        onLayout={onBarLayout}
        style={{
          height: TAB_BAR_HEIGHT,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: isDark ? 0.3 : 0.1,
          shadowRadius: 20,
          elevation: 10,
        }}
      >
        {barWidth > 0 ? (
          <Svg
            width={barWidth}
            height={TAB_BAR_HEIGHT}
            style={{ position: 'absolute', top: 0, left: 0 }}
          >
            <Path
              d={buildTabBarPath(barWidth)}
              fill={fillColor}
              stroke={strokeColor}
              strokeWidth={1}
            />
          </Svg>
        ) : null}

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'flex-end',
            height: TAB_BAR_HEIGHT,
            paddingHorizontal: 8,
            paddingBottom: 8,
          }}
        >
          {state.routes.flatMap((route, index) => {
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

            const tab = (
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

            if (index === middleIndex) {
              return [
                <View
                  key="fab-spacer"
                  style={{ width: NOTCH_RADIUS * 2 + NOTCH_LEAD * 2 }}
                />,
                tab,
              ];
            }
            return [tab];
          })}
        </View>
      </View>

      {/* Floating FAB — sits in the notch */}
      <View
        pointerEvents="box-none"
        style={{
          position: 'absolute',
          top: -(FAB_SIZE - FAB_OVERLAP),
          left: 0,
          right: 0,
          alignItems: 'center',
        }}
      >
        <CenterFab />
      </View>
    </View>
  );
}
