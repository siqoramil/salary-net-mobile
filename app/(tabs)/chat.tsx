import { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import Animated, {
  Easing,
  FadeIn,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import type { TFunction } from 'i18next';

import { useLatestConversation, useMessages, useSendMessage, useClearHistory } from '@/src/hooks/useChat';
import { useCreateExpense } from '@/src/hooks/useExpenses';
import { CATEGORY_BY_ID } from '@/src/constants/categories';
import { MoneyText } from '@/src/components/ui/MoneyText';
import type { ChatMessage, CreateExpenseAction } from '@/src/types/chat';
import type { Currency } from '@/src/types/auth';
import { LoadingSpinner } from '@/src/components/ui/LoadingSpinner';
import type { ExpenseCategoryId } from '@/src/types/expense';
import { useUIStore } from '@/src/stores/uiStore';

const QUICK_ACTIONS = [
  { key: 'quickHowMuch', icon: '💰', text: 'How much today?', accent: '#007AFF' },
  { key: 'quickMonthly', icon: '📊', text: 'Monthly summary', accent: '#34C759' },
  { key: 'quickSavingTips', icon: '💡', text: 'Saving tips', accent: '#FF9500' },
  { key: 'quickAddExample', icon: '🍔', text: 'Add 50000 lunch', accent: '#AF52DE' },
];

function stripJsonBlock(text: string): string {
  return text.replace(/```json[\s\S]*?```/g, '').trim();
}

function extractAction(metadata: ChatMessage['metadata']): CreateExpenseAction | null {
  if (
    metadata &&
    typeof metadata === 'object' &&
    'action' in metadata &&
    metadata.action === 'create_expense'
  ) {
    return metadata as CreateExpenseAction;
  }
  return null;
}

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

export default function ChatScreen() {
  const { t } = useTranslation();
  const showConfirm = useUIStore((s) => s.showConfirm);
  const showToast = useUIStore((s) => s.showToast);
  const convQuery = useLatestConversation();
  const conversationId = convQuery.data?.id;
  const clearMutation = useClearHistory(conversationId);

  const onClearHistory = () => {
    showConfirm({
      variant: 'destructive',
      icon: '🗑️',
      title: t('chat.clearHistoryTitle'),
      message: t('chat.clearHistoryDesc'),
      confirmLabel: t('chat.clearHistoryConfirm'),
      onConfirm: () => {
        clearMutation.mutate(undefined, {
          onSuccess: () =>
            showToast({
              type: 'success',
              title: t('common.success'),
              message: t('chat.historyCleared'),
            }),
        });
      },
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F2F2F7] dark:bg-black" edges={['top']}>
      <CompactHeader
        title={t('chat.title')}
        subtitle={t('chat.maintenanceStatus')}
        isTyping={false}
        onClearHistory={conversationId ? onClearHistory : undefined}
        clearPending={clearMutation.isPending}
      />
      <MaintenanceBanner />
    </SafeAreaView>
  );
}

function MaintenanceBanner() {
  const { t } = useTranslation();

  const spin = useSharedValue(0);
  const float = useSharedValue(0);

  useEffect(() => {
    spin.value = withRepeat(
      withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
    float.value = withRepeat(
      withTiming(1, { duration: 2400, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, [spin, float]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: -float.value * 8 },
    ],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: 0.15 + float.value * 0.12,
    transform: [{ scale: 1 + float.value * 0.12 }],
  }));

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
      {/* Animated icon */}
      <View style={{ alignItems: 'center', justifyContent: 'center', width: 120, height: 120 }}>
        <Animated.View
          pointerEvents="none"
          style={[
            {
              position: 'absolute',
              width: 110,
              height: 110,
              borderRadius: 55,
              backgroundColor: '#FF9500',
            },
            glowStyle,
          ]}
        />
        <Animated.View
          style={[
            {
              width: 88,
              height: 88,
              borderRadius: 44,
              backgroundColor: '#FF9500',
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: '#FF9500',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.35,
              shadowRadius: 16,
              elevation: 10,
            },
            iconStyle,
          ]}
        >
          <Text style={{ fontSize: 40 }}>🛠️</Text>
        </Animated.View>
      </View>

      {/* Title */}
      <Text
        style={{
          marginTop: 28,
          fontSize: 22,
          fontWeight: '700',
          color: '#000',
          textAlign: 'center',
        }}
        className="dark:text-white"
      >
        {t('chat.maintenanceTitle')}
      </Text>

      {/* Description */}
      <Text
        style={{
          marginTop: 10,
          fontSize: 15,
          lineHeight: 22,
          color: '#8E8E93',
          textAlign: 'center',
        }}
      >
        {t('chat.maintenanceDesc')}
      </Text>

      {/* Status chip */}
      <View
        style={{
          marginTop: 28,
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: '#FF950018',
          borderRadius: 20,
          paddingHorizontal: 16,
          paddingVertical: 8,
          gap: 6,
        }}
      >
        <View
          style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: '#FF9500' }}
        />
        <Text style={{ fontSize: 13, fontWeight: '600', color: '#FF9500' }}>
          {t('chat.maintenanceChip')}
        </Text>
      </View>
    </View>
  );
}

function CompactHeader({
  title,
  subtitle,
  isTyping,
  onClearHistory,
  clearPending,
}: {
  title: string;
  subtitle: string;
  isTyping: boolean;
  onClearHistory?: () => void;
  clearPending?: boolean;
}) {
  const pulse = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, [pulse]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: 0.4 + pulse.value * 0.6,
    transform: [{ scale: 1 + pulse.value * 0.15 }],
  }));

  return (
    <View className="flex-row items-center px-5 pb-3 pt-2">
      <View style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
        <Animated.View
          pointerEvents="none"
          style={[
            {
              position: 'absolute',
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: '#007AFF',
            },
            glowStyle,
          ]}
        />
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: '#007AFF',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontSize: 20 }}>✨</Text>
        </View>
      </View>
      <View className="ml-3 flex-1">
        <Text className="text-[18px] font-bold text-black dark:text-white">
          {title}
        </Text>
        <View className="mt-[2px] flex-row items-center">
          <View
            style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: isTyping ? '#FF9500' : '#34C759',
              marginRight: 6,
            }}
          />
          <Text className="text-[12px] text-[#8E8E93]">{subtitle}</Text>
        </View>
      </View>

      {/* Clear history button */}
      {onClearHistory ? (
        <Pressable
          onPress={clearPending ? undefined : onClearHistory}
          hitSlop={12}
          style={({ pressed }) => ({
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: pressed ? '#FFE5E5' : '#F2F2F7',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: clearPending ? 0.5 : 1,
          })}
          className="dark:bg-[#2C2C2E]"
        >
          <Text style={{ fontSize: 17 }}>🗑️</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function BotAvatar({ size = 30 }: { size?: number }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: '#007AFF',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#007AFF',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.35,
        shadowRadius: 4,
        elevation: 3,
      }}
    >
      <Text style={{ fontSize: size * 0.5 }}>✨</Text>
    </View>
  );
}

function TypingDots() {
  const d1 = useSharedValue(0);
  const d2 = useSharedValue(0);
  const d3 = useSharedValue(0);

  useEffect(() => {
    const makeLoop = () =>
      withRepeat(
        withSequence(
          withTiming(1, { duration: 380, easing: Easing.out(Easing.quad) }),
          withTiming(0, { duration: 380, easing: Easing.in(Easing.quad) }),
          withTiming(0, { duration: 380 }),
        ),
        -1,
      );
    d1.value = makeLoop();
    d2.value = withDelay(150, makeLoop());
    d3.value = withDelay(300, makeLoop());
  }, [d1, d2, d3]);

  const s1 = useAnimatedStyle(() => ({
    opacity: 0.3 + d1.value * 0.7,
    transform: [{ translateY: -d1.value * 4 }],
  }));
  const s2 = useAnimatedStyle(() => ({
    opacity: 0.3 + d2.value * 0.7,
    transform: [{ translateY: -d2.value * 4 }],
  }));
  const s3 = useAnimatedStyle(() => ({
    opacity: 0.3 + d3.value * 0.7,
    transform: [{ translateY: -d3.value * 4 }],
  }));

  const dot = { width: 7, height: 7, borderRadius: 4, backgroundColor: '#8E8E93' };

  return (
    <View className="flex-row items-center" style={{ gap: 5 }}>
      <Animated.View style={[dot, s1]} />
      <Animated.View style={[dot, s2]} />
      <Animated.View style={[dot, s3]} />
    </View>
  );
}

function SendButton({ active, onPress }: { active: boolean; onPress: () => void }) {
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Pressable
      onPress={active ? onPress : undefined}
      onPressIn={() => {
        scale.value = withSpring(0.88, { damping: 12, stiffness: 400 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 12, stiffness: 300 });
      }}
      disabled={!active}
    >
      <Animated.View
        style={[
          {
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: active ? '#007AFF' : '#E5E5EA',
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#007AFF',
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: active ? 0.4 : 0,
            shadowRadius: 6,
            elevation: active ? 4 : 0,
          },
          style,
        ]}
      >
        <Text
          style={{
            fontSize: 17,
            fontWeight: '800',
            color: active ? '#fff' : '#C7C7CC',
          }}
        >
          ↑
        </Text>
      </Animated.View>
    </Pressable>
  );
}

function EmptyState({
  title,
  desc,
  onQuickAction,
  t,
}: {
  title: string;
  desc: string;
  onQuickAction: (text: string) => void;
  t: TFunction;
}) {
  const pulse = useSharedValue(0);
  const breath = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1, { duration: 2400, easing: Easing.out(Easing.quad) }),
      -1,
      false,
    );
    breath.value = withRepeat(
      withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, [pulse, breath]);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + pulse.value * 0.8 }],
    opacity: 0.3 * (1 - pulse.value),
  }));

  const ring2Style = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + pulse.value * 1.3 }],
    opacity: 0.18 * (1 - pulse.value),
  }));

  const heroStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + breath.value * 0.05 }],
  }));

  return (
    <View className="mt-6 items-center">
      <View
        style={{
          width: 120,
          height: 120,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Animated.View
          pointerEvents="none"
          style={[
            {
              position: 'absolute',
              width: 120,
              height: 120,
              borderRadius: 60,
              backgroundColor: '#007AFF',
            },
            ring2Style,
          ]}
        />
        <Animated.View
          pointerEvents="none"
          style={[
            {
              position: 'absolute',
              width: 104,
              height: 104,
              borderRadius: 52,
              backgroundColor: '#007AFF',
            },
            ringStyle,
          ]}
        />
        <Animated.View
          style={[
            {
              width: 88,
              height: 88,
              borderRadius: 44,
              backgroundColor: '#007AFF',
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: '#007AFF',
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.4,
              shadowRadius: 20,
              elevation: 12,
            },
            heroStyle,
          ]}
        >
          <Text style={{ fontSize: 42 }}>✨</Text>
        </Animated.View>
      </View>

      <Text className="mt-5 text-[22px] font-bold text-black dark:text-white">
        {title}
      </Text>
      <Text className="mt-2 px-6 text-center text-[14px] leading-5 text-[#8E8E93]">
        {desc}
      </Text>

      <View className="mt-8 w-full px-2">
        {QUICK_ACTIONS.map((q, idx) => (
          <Animated.View
            key={q.key}
            entering={FadeInUp.delay(150 + idx * 70).duration(360)}
          >
            <Pressable
              onPress={() => onQuickAction(q.text)}
              className="mb-[10px] flex-row items-center rounded-[18px] bg-white p-[14px] active:opacity-85 dark:bg-[#1C1C1E]"
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: 0.06,
                shadowRadius: 10,
                elevation: 2,
              }}
            >
              <View
                className="h-[42px] w-[42px] items-center justify-center rounded-[12px]"
                style={{ backgroundColor: `${q.accent}1A` }}
              >
                <Text style={{ fontSize: 22 }}>{q.icon}</Text>
              </View>
              <Text className="ml-3 flex-1 text-[14px] font-semibold text-black dark:text-white">
                {t(`chat.${q.key}`)}
              </Text>
              <Text className="text-[18px]" style={{ color: q.accent }}>
                ›
              </Text>
            </Pressable>
          </Animated.View>
        ))}
      </View>
    </View>
  );
}

function ConfirmExpenseCard({
  action,
  pending,
  onConfirm,
  t,
}: {
  action: CreateExpenseAction;
  pending: boolean;
  onConfirm: () => void;
  t: TFunction;
}) {
  const cat = CATEGORY_BY_ID[action.data.category as ExpenseCategoryId];
  return (
    <Animated.View
      entering={FadeInUp.duration(360)}
      className="mt-2 max-w-[88%] self-start overflow-hidden rounded-[18px] bg-white p-[14px] dark:bg-[#1C1C1E]"
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 3,
        borderWidth: 1,
        borderColor: 'rgba(0,122,255,0.15)',
      }}
    >
      <Text className="text-[10px] font-bold uppercase tracking-wider text-[#007AFF]">
        {t('chat.confirmExpense')}
      </Text>
      <View className="mt-2 flex-row items-center">
        <View
          className="h-11 w-11 items-center justify-center rounded-[14px]"
          style={{ backgroundColor: `${cat?.color ?? '#AEB6BF'}25` }}
        >
          <Text className="text-[22px]">{cat?.icon ?? '📦'}</Text>
        </View>
        <View className="ml-3 flex-1">
          <MoneyText
            amount={action.data.amount}
            currency={action.data.currency as Currency}
            size={18}
          />
          <Text
            className="mt-[2px] text-[13px] text-[#8E8E93]"
            numberOfLines={1}
          >
            {action.data.description}
          </Text>
        </View>
      </View>
      <Pressable
        onPress={onConfirm}
        className="mt-3 items-center rounded-[12px] bg-[#007AFF] py-[10px] active:opacity-80"
        style={{
          shadowColor: '#007AFF',
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 4,
        }}
      >
        <Text className="text-[14px] font-semibold text-white">
          {pending ? t('chat.saving') : t('chat.saveExpense')}
        </Text>
      </Pressable>
    </Animated.View>
  );
}
