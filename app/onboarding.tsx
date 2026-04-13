import { useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Pressable,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Button } from '../src/components/ui/Button';
import { storage, StorageKeys } from '../src/lib/storage';
import {
  ChartsIllustration,
  ChatIllustration,
  MicIllustration,
  WalletIllustration,
} from '../src/components/onboarding/illustrations';

const { width } = Dimensions.get('window');

type SlideKey = '1' | '2' | '3' | '4';

type Slide = {
  key: SlideKey;
  Illustration: React.ComponentType;
  titleKey: string;
  descKey: string;
};

const SLIDES: Slide[] = [
  { key: '1', Illustration: WalletIllustration, titleKey: 'onboarding.slide1Title', descKey: 'onboarding.slide1Desc' },
  { key: '2', Illustration: ChartsIllustration, titleKey: 'onboarding.slide2Title', descKey: 'onboarding.slide2Desc' },
  { key: '3', Illustration: ChatIllustration, titleKey: 'onboarding.slide3Title', descKey: 'onboarding.slide3Desc' },
  { key: '4', Illustration: MicIllustration, titleKey: 'onboarding.slide4Title', descKey: 'onboarding.slide4Desc' },
];

export default function Onboarding() {
  const { t } = useTranslation();
  const router = useRouter();
  const listRef = useRef<FlatList<Slide>>(null);
  const [index, setIndex] = useState(0);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / width);
    if (i !== index) setIndex(i);
  };

  const finish = () => {
    storage.set(StorageKeys.HAS_SEEN_ONBOARDING, true);
    router.replace('/(auth)/sign-in');
  };

  const next = () => {
    if (index < SLIDES.length - 1) {
      listRef.current?.scrollToIndex({ index: index + 1, animated: true });
    } else {
      finish();
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-black">
      <View className="flex-row justify-end px-5 pt-2">
        <Pressable onPress={finish} hitSlop={12}>
          <Text className="text-[17px] text-[#007AFF]">{t('common.skip')}</Text>
        </Pressable>
      </View>

      <FlatList
        ref={listRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.key}
        onScroll={onScroll}
        scrollEventThrottle={16}
        renderItem={({ item, index: i }) => (
          <SlideView slide={item} active={index === i} />
        )}
      />

      {/* Pagination dots */}
      <View className="flex-row justify-center gap-2 pb-6">
        {SLIDES.map((_, i) => (
          <PaginationDot key={i} active={i === index} />
        ))}
      </View>

      <View className="px-5 pb-8">
        <Button
          title={index === SLIDES.length - 1 ? t('onboarding.getStarted') : t('common.next')}
          onPress={next}
        />
      </View>
    </SafeAreaView>
  );
}

function SlideView({ slide, active }: { slide: Slide; active: boolean }) {
  const fade = useSharedValue(active ? 1 : 0);
  const scale = useSharedValue(active ? 1 : 0.92);
  const titleY = useSharedValue(active ? 0 : 20);

  // Re-trigger entrance animation when becoming active
  if (active) {
    fade.value = withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) });
    scale.value = withSpring(1, { damping: 12, stiffness: 90 });
    titleY.value = withTiming(0, { duration: 600, easing: Easing.out(Easing.cubic) });
  }

  const illoStyle = useAnimatedStyle(() => ({
    opacity: fade.value,
    transform: [{ scale: scale.value }],
  }));
  const textStyle = useAnimatedStyle(() => ({
    opacity: fade.value,
    transform: [{ translateY: titleY.value }],
  }));

  const { Illustration } = slide;
  const { t } = useTranslation();

  return (
    <View style={{ width }} className="items-center justify-center px-8">
      <Animated.View style={illoStyle}>
        <Illustration />
      </Animated.View>

      <Animated.View style={[{ marginTop: 32, alignItems: 'center' }, textStyle]}>
        <Text className="text-center text-[28px] font-bold text-black dark:text-white">{t(slide.titleKey)}</Text>
        <Text className="mt-3 text-center text-[16px] leading-[22px] text-[#8E8E93]">
          {t(slide.descKey)}
        </Text>
      </Animated.View>
    </View>
  );
}

function PaginationDot({ active }: { active: boolean }) {
  const w = useSharedValue(active ? 20 : 8);
  w.value = withSpring(active ? 20 : 8, { damping: 14, stiffness: 150 });

  const style = useAnimatedStyle(() => ({
    width: w.value,
    backgroundColor: active ? '#007AFF' : '#C7C7CC',
  }));

  return <Animated.View style={[{ height: 8, borderRadius: 4 }, style]} />;
}
