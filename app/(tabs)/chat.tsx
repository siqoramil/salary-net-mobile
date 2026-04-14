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

import { useLatestConversation, useMessages, useSendMessage } from '@/src/hooks/useChat';
import { useCreateExpense } from '@/src/hooks/useExpenses';
import { CATEGORY_BY_ID } from '@/src/constants/categories';
import { MoneyText } from '@/src/components/ui/MoneyText';
import type { ChatMessage, CreateExpenseAction } from '@/src/types/chat';
import type { Currency } from '@/src/types/auth';
import { LoadingSpinner } from '@/src/components/ui/LoadingSpinner';
import type { ExpenseCategoryId } from '@/src/types/expense';
import { useUIStore } from '@/src/stores/uiStore';

const QUICK_ACTIONS = [
  { key: 'quickHowMuch', icon: '💰', text: 'How much today?' },
  { key: 'quickMonthly', icon: '📊', text: 'Monthly summary' },
  { key: 'quickSavingTips', icon: '💡', text: 'Saving tips' },
  { key: 'quickAddExample', icon: '🍔', text: 'Add 50000 lunch' },
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

export default function ChatScreen() {
  const { t } = useTranslation();
  const convQuery = useLatestConversation();
  const conversationId = convQuery.data?.id;
  const messagesQuery = useMessages(conversationId);
  const sendMutation = useSendMessage(conversationId);
  const createExpense = useCreateExpense();
  const showToast = useUIStore((s) => s.showToast);

  const [input, setInput] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  const messages = messagesQuery.data ?? [];

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages.length, sendMutation.isPending]);

  const send = (text?: string) => {
    const content = (text ?? input).trim();
    if (!content) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setInput('');
    sendMutation.mutate(content);
  };

  const confirmExpense = (action: CreateExpenseAction) => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    createExpense.mutate(
      {
        amount: action.data.amount,
        currency: action.data.currency,
        category: action.data.category as ExpenseCategoryId,
        description: action.data.description,
        expenseDate: action.data.date,
      },
      {
        onSuccess: () =>
          showToast({
            type: 'success',
            title: t('chat.savedTitle'),
            message: t('chat.savedDesc'),
          }),
        onError: (e) => {
          const msg =
            (e as { response?: { data?: { message?: string } } }).response?.data?.message ??
            t('addExpense.saveFailed');
          showToast({ type: 'error', title: t('common.error'), message: msg });
        },
      },
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F2F2F7] dark:bg-black" edges={['top']}>
      <HeroHeader title={t('chat.title')} subtitle={t('chat.subtitle')} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
        className="flex-1"
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={{ padding: 16, paddingTop: 12, paddingBottom: 8 }}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
          showsVerticalScrollIndicator={false}
        >
          {convQuery.isLoading || messagesQuery.isLoading ? (
            <LoadingSpinner size="large" className="mt-10" />
          ) : messages.length === 0 ? (
            <EmptyState
              title={t('chat.hiTitle')}
              desc={t('chat.hiDesc')}
              onQuickAction={(text) => send(text)}
              t={t}
            />
          ) : (
            messages.map((m, idx) => {
              const action = extractAction(m.metadata);
              const isUser = m.role === 'user';
              return (
                <Animated.View
                  key={m.id}
                  entering={FadeInUp.delay(Math.min(idx, 3) * 40).duration(300)}
                  className="mb-3"
                >
                  <View
                    className={`flex-row items-end ${
                      isUser ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {!isUser ? <BotAvatar size={28} /> : null}
                    <View
                      className={`${
                        !isUser ? 'ml-2' : ''
                      } max-w-[78%] px-4 py-3 ${
                        isUser
                          ? 'rounded-[22px] rounded-br-[6px] bg-[#007AFF]'
                          : 'rounded-[22px] rounded-bl-[6px] bg-white dark:bg-[#1C1C1E]'
                      }`}
                      style={
                        !isUser
                          ? {
                              shadowColor: '#000',
                              shadowOffset: { width: 0, height: 1 },
                              shadowOpacity: 0.06,
                              shadowRadius: 6,
                              elevation: 2,
                            }
                          : undefined
                      }
                    >
                      <Text
                        className={`text-[15px] leading-[21px] ${
                          isUser ? 'text-white' : 'text-black dark:text-white'
                        }`}
                      >
                        {stripJsonBlock(m.content) || '…'}
                      </Text>
                    </View>
                  </View>
                  {action ? (
                    <ConfirmExpenseCard
                      action={action}
                      pending={createExpense.isPending}
                      onConfirm={() => confirmExpense(action)}
                      t={t}
                    />
                  ) : null}
                </Animated.View>
              );
            })
          )}

          {sendMutation.isPending ? (
            <Animated.View
              entering={FadeIn.duration(200)}
              className="mb-3 flex-row items-end"
            >
              <BotAvatar size={28} />
              <View
                className="ml-2 rounded-[22px] rounded-bl-[6px] bg-white dark:bg-[#1C1C1E] px-4 py-[14px]"
                style={{
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.06,
                  shadowRadius: 6,
                  elevation: 2,
                }}
              >
                <TypingDots />
              </View>
            </Animated.View>
          ) : null}
        </ScrollView>

        {messages.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 10, gap: 8 }}
            className="max-h-12"
          >
            {QUICK_ACTIONS.map((q) => (
              <Pressable
                key={q.key}
                onPress={() => send(q.text)}
                className="flex-row items-center gap-[6px] rounded-full bg-white dark:bg-[#1C1C1E] px-4 py-2 active:opacity-70"
                style={{
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.06,
                  shadowRadius: 4,
                  elevation: 2,
                }}
              >
                <Text className="text-[14px]">{q.icon}</Text>
                <Text className="text-[13px] font-medium text-black dark:text-white">
                  {t(`chat.${q.key}`)}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        ) : null}

        <View
          className="flex-row items-end gap-2 bg-white dark:bg-[#1C1C1E] px-4 pt-2"
          style={{
            paddingBottom: Platform.OS === 'ios' ? 10 : 80,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.05,
            shadowRadius: 10,
            elevation: 6,
          }}
        >
          <View className="flex-1 rounded-[22px] bg-[#F2F2F7] dark:bg-[#2C2C2E] px-4 py-[10px]">
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder={t('chat.askPlaceholder')}
              placeholderTextColor="#8E8E93"
              className="text-[15px] text-black dark:text-white"
              returnKeyType="send"
              onSubmitEditing={() => send()}
              multiline
              style={{ maxHeight: 100 }}
            />
          </View>
          <SendButton
            active={!!input.trim() && !sendMutation.isPending}
            onPress={() => send()}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function HeroHeader({ title, subtitle }: { title: string; subtitle: string }) {
  const pulse = useSharedValue(0);
  const glow = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1, { duration: 2400, easing: Easing.out(Easing.quad) }),
      -1,
      false,
    );
    glow.value = withRepeat(
      withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, [pulse, glow]);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + pulse.value * 0.6 }],
    opacity: 0.35 * (1 - pulse.value),
  }));

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + glow.value * 0.06 }],
  }));

  return (
    <View className="mx-4 mt-3 overflow-hidden rounded-[22px] bg-[#007AFF] px-5 py-4">
      <View className="flex-row items-center">
        <View
          style={{
            width: 48,
            height: 48,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Animated.View
            pointerEvents="none"
            style={[
              {
                position: 'absolute',
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: '#fff',
              },
              ringStyle,
            ]}
          />
          <Animated.View
            style={[
              {
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: 'rgba(255,255,255,0.22)',
                alignItems: 'center',
                justifyContent: 'center',
              },
              iconStyle,
            ]}
          >
            <Text style={{ fontSize: 24 }}>✨</Text>
          </Animated.View>
        </View>
        <View className="ml-3 flex-1">
          <Text className="text-[20px] font-bold text-white">{title}</Text>
          <View className="mt-[3px] flex-row items-center">
            <View
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: '#34C759',
                marginRight: 6,
              }}
            />
            <Text className="text-[12px] text-white/85">{subtitle}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

function BotAvatar({ size = 28 }: { size?: number }) {
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
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 3,
      }}
    >
      <Text style={{ fontSize: size * 0.52 }}>✨</Text>
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

  const dot = { width: 6, height: 6, borderRadius: 3, backgroundColor: '#8E8E93' };

  return (
    <View className="flex-row items-center" style={{ gap: 4 }}>
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
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: active ? '#007AFF' : '#E5E5EA',
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#007AFF',
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: active ? 0.3 : 0,
            shadowRadius: 6,
            elevation: active ? 4 : 0,
          },
          style,
        ]}
      >
        <Text
          style={{
            fontSize: 17,
            fontWeight: '700',
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
      withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, [pulse, breath]);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + pulse.value * 0.7 }],
    opacity: 0.25 * (1 - pulse.value),
  }));

  const heroStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + breath.value * 0.06 }],
  }));

  return (
    <View className="mt-4 items-center">
      <View
        style={{
          width: 96,
          height: 96,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Animated.View
          pointerEvents="none"
          style={[
            {
              position: 'absolute',
              width: 96,
              height: 96,
              borderRadius: 48,
              backgroundColor: '#007AFF',
            },
            ringStyle,
          ]}
        />
        <Animated.View
          style={[
            {
              width: 96,
              height: 96,
              borderRadius: 48,
              backgroundColor: '#007AFF',
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: '#007AFF',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.35,
              shadowRadius: 18,
              elevation: 12,
            },
            heroStyle,
          ]}
        >
          <Text style={{ fontSize: 44 }}>✨</Text>
        </Animated.View>
      </View>

      <Text className="mt-5 text-[22px] font-bold text-black dark:text-white">
        {title}
      </Text>
      <Text className="mt-2 px-6 text-center text-[14px] leading-5 text-[#8E8E93]">
        {desc}
      </Text>

      <View className="mt-7 w-full flex-row flex-wrap justify-between gap-y-3">
        {QUICK_ACTIONS.map((q, idx) => (
          <Animated.View
            key={q.key}
            entering={FadeInUp.delay(150 + idx * 80).duration(420)}
            className="w-[48%]"
          >
            <Pressable
              onPress={() => onQuickAction(q.text)}
              className="rounded-[18px] bg-white p-4 active:scale-[0.97] dark:bg-[#1C1C1E]"
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: 0.08,
                shadowRadius: 10,
                elevation: 4,
              }}
            >
              <View
                className="h-10 w-10 items-center justify-center rounded-[12px]"
                style={{ backgroundColor: 'rgba(0,122,255,0.12)' }}
              >
                <Text className="text-[20px]">{q.icon}</Text>
              </View>
              <Text
                className="mt-3 text-[13px] font-semibold text-black dark:text-white"
                numberOfLines={2}
              >
                {t(`chat.${q.key}`)}
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
      entering={FadeInUp.duration(380)}
      className="mt-2 self-start overflow-hidden rounded-[18px] bg-white p-4 dark:bg-[#1C1C1E]"
      style={{
        marginLeft: 36,
        maxWidth: '85%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
      }}
    >
      <Text className="text-[11px] font-semibold uppercase tracking-wider text-[#8E8E93]">
        {t('chat.confirmExpense')}
      </Text>
      <View className="mt-3 flex-row items-center">
        <View
          className="h-12 w-12 items-center justify-center rounded-[14px]"
          style={{ backgroundColor: `${cat?.color ?? '#AEB6BF'}25` }}
        >
          <Text className="text-[24px]">{cat?.icon ?? '📦'}</Text>
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
        className="mt-4 items-center rounded-[14px] bg-[#007AFF] py-[12px] active:opacity-80"
        style={{
          shadowColor: '#007AFF',
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.25,
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
