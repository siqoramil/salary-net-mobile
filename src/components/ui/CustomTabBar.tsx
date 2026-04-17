import { useEffect, useState } from 'react';
import { Platform, Pressable, Text, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import * as Haptics from 'expo-haptics';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { useThemeStore } from '../../stores/themeStore';
import { useUIStore } from '../../stores/uiStore';

const SPRING_CONFIG = { damping: 15, stiffness: 200 };
const TAB_BAR_HEIGHT = 64;
const CORNER_RADIUS = 28;
const NOTCH_RADIUS = 28;
const NOTCH_LEAD = 16;
const FAB_SIZE = 58;
const FAB_OVERLAP = 22;
const ACTIVE_GRADIENT = ['#0A84FF', '#0051D5'] as const;

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
  const press = useSharedValue(1);

  useEffect(() => {
    progress.value = withSpring(isFocused ? 1 : 0, SPRING_CONFIG);
  }, [isFocused, progress]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: press.value * (1 + progress.value * 0.08) },
      { translateY: -progress.value * 2 },
    ],
  }));

  const labelStyle = useAnimatedStyle(() => ({
    opacity: 0.55 + progress.value * 0.45,
    transform: [{ translateY: -progress.value * 1 }],
  }));

  const indicatorStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scaleX: 0.4 + progress.value * 0.6 }],
  }));

  const handlePress = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    press.value = withSequence(
      withTiming(0.86, { duration: 80 }),
      withSpring(1, SPRING_CONFIG),
    );
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      onLongPress={onLongPress}
      accessibilityRole="button"
      accessibilityState={isFocused ? { selected: true } : {}}
      accessibilityLabel={label}
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingTop: 10,
      }}
    >
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: 0,
            width: 22,
            height: 3,
            borderRadius: 2,
            backgroundColor: activeTint,
          },
          indicatorStyle,
        ]}
      />
      <Animated.View style={iconStyle}>
        {icon({
          color: isFocused ? activeTint : inactiveTint,
          size: 24,
        })}
      </Animated.View>
      <Animated.Text
        numberOfLines={1}
        style={[
          {
            marginTop: 3,
            fontSize: 10,
            fontWeight: isFocused ? '700' : '500',
            color: isFocused ? activeTint : inactiveTint,
            letterSpacing: 0.1,
          },
          labelStyle,
        ]}
      >
        {label}
      </Animated.Text>
    </Pressable>
  );
}

function CenterFab() {
  const openAddExpense = useUIStore((s) => s.openAddExpense);
  const scale = useSharedValue(1);
  const rotate = useSharedValue(0);

  const fabStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotate.value}deg` },
    ],
  }));

  const handlePress = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    scale.value = withSequence(
      withSpring(0.88, { damping: 15, stiffness: 400 }),
      withSpring(1, { damping: 12, stiffness: 200 }),
    );
    rotate.value = withSequence(
      withTiming(90, { duration: 140 }),
      withTiming(0, { duration: 220 }),
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
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: ACTIVE_GRADIENT[1],
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.45,
          shadowRadius: 14,
          elevation: 14,
          overflow: 'hidden',
        },
        fabStyle,
      ]}
    >
      <Svg width={FAB_SIZE} height={FAB_SIZE} style={{ position: 'absolute' }}>
        <Defs>
          <LinearGradient id="fabGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={ACTIVE_GRADIENT[0]} />
            <Stop offset="1" stopColor={ACTIVE_GRADIENT[1]} />
          </LinearGradient>
        </Defs>
        <Path
          d={`M ${FAB_SIZE / 2} 0 A ${FAB_SIZE / 2} ${FAB_SIZE / 2} 0 1 0 ${FAB_SIZE / 2} ${FAB_SIZE} A ${FAB_SIZE / 2} ${FAB_SIZE / 2} 0 1 0 ${FAB_SIZE / 2} 0 Z`}
          fill="url(#fabGrad)"
        />
      </Svg>
      <View
        style={{
          width: 22,
          height: 2.5,
          borderRadius: 2,
          backgroundColor: '#fff',
          position: 'absolute',
        }}
      />
      <View
        style={{
          width: 2.5,
          height: 22,
          borderRadius: 2,
          backgroundColor: '#fff',
          position: 'absolute',
        }}
      />
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
    (focusedOptions.tabBarActiveTintColor as string) ?? ACTIVE_GRADIENT[0];
  const inactiveTint =
    (focusedOptions.tabBarInactiveTintColor as string) ?? '#8E8E93';

  const middleIndex = Math.floor(state.routes.length / 2);
  const fillColor = isDark ? '#1C1C1E' : '#FFFFFF';
  const strokeColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)';

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
        left: 16,
        right: 16,
      }}
    >
      <View
        onLayout={onBarLayout}
        style={{
          height: TAB_BAR_HEIGHT,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: isDark ? 0.4 : 0.12,
          shadowRadius: 24,
          elevation: 12,
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
            alignItems: 'stretch',
            height: TAB_BAR_HEIGHT,
            paddingHorizontal: 6,
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
