import { useEffect, useRef, useState } from 'react';
import {
  Alert,
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

import { useLatestConversation, useMessages, useSendMessage } from '@/src/hooks/useChat';
import { useCreateExpense } from '@/src/hooks/useExpenses';
import { CATEGORY_BY_ID } from '@/src/constants/categories';
import { MoneyText } from '@/src/components/ui/MoneyText';
import type { ChatMessage, CreateExpenseAction } from '@/src/types/chat';
import type { Currency } from '@/src/types/auth';
import { LoadingSpinner } from '@/src/components/ui/LoadingSpinner';
import type { ExpenseCategoryId } from '@/src/types/expense';

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

  const [input, setInput] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  const messages = messagesQuery.data ?? [];

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages.length, sendMutation.isPending]);

  const send = (text?: string) => {
    const content = (text ?? input).trim();
    if (!content) return;
    setInput('');
    sendMutation.mutate(content);
  };

  const confirmExpense = (action: CreateExpenseAction) => {
    createExpense.mutate(
      {
        amount: action.data.amount,
        currency: action.data.currency,
        category: action.data.category as ExpenseCategoryId,
        description: action.data.description,
        expenseDate: action.data.date,
      },
      {
        onSuccess: () => Alert.alert(t('chat.savedTitle'), t('chat.savedDesc')),
        onError: () => Alert.alert(t('common.error'), t('addExpense.saveFailed')),
      },
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F2F2F7] dark:bg-black" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center bg-white dark:bg-[#1C1C1E] px-5 py-3 shadow-sm">
        <View className="h-9 w-9 items-center justify-center rounded-full bg-[#007AFF]">
          <Text className="text-[16px]">✨</Text>
        </View>
        <View className="ml-3">
          <Text className="text-[17px] font-bold text-black dark:text-white">{t('chat.title')}</Text>
          <Text className="text-[11px] text-[#8E8E93]">{t('chat.subtitle')}</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
        className="flex-1"
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={{ padding: 16, paddingBottom: 8 }}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        >
          {convQuery.isLoading || messagesQuery.isLoading ? (
            <LoadingSpinner size="large" className="mt-10" />
          ) : messages.length === 0 ? (
            /* Empty state with quick actions */
            <View className="mt-8 items-center">
              <View className="h-20 w-20 items-center justify-center rounded-full bg-white dark:bg-[#1C1C1E]">
                <Text className="text-[44px]">✨</Text>
              </View>
              <Text className="mt-4 text-[20px] font-bold text-black dark:text-white">
                {t('chat.hiTitle')}
              </Text>
              <Text className="mt-2 text-center text-[14px] leading-5 text-[#8E8E93] px-6">
                {t('chat.hiDesc')}
              </Text>

              {/* Quick action cards */}
              <View className="mt-8 w-full flex-row flex-wrap justify-between gap-y-3">
                {QUICK_ACTIONS.map((q) => (
                  <Pressable
                    key={q.key}
                    onPress={() => send(q.text)}
                    className="w-[48%] rounded-[16px] bg-white dark:bg-[#1C1C1E] p-4 active:scale-[0.97]"
                    style={{
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.06,
                      shadowRadius: 8,
                      elevation: 3,
                    }}
                  >
                    <Text className="text-[24px]">{q.icon}</Text>
                    <Text className="mt-2 text-[13px] font-semibold text-black dark:text-white" numberOfLines={2}>
                      {t(`chat.${q.key}`)}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : (
            messages.map((m) => {
              const action = extractAction(m.metadata);
              return (
                <View key={m.id} className="mb-3">
                  <View
                    className={`max-w-[80%] rounded-[20px] px-4 py-3 ${
                      m.role === 'user'
                        ? 'self-end bg-[#007AFF]'
                        : 'self-start bg-white dark:bg-[#1C1C1E]'
                    }`}
                    style={
                      m.role !== 'user'
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
                        m.role === 'user' ? 'text-white' : 'text-black dark:text-white'
                      }`}
                    >
                      {stripJsonBlock(m.content) || '…'}
                    </Text>
                  </View>
                  {action ? (
                    <View
                      className="mt-2 self-start max-w-[85%] overflow-hidden rounded-[16px] bg-white dark:bg-[#1C1C1E] p-4"
                      style={{
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.08,
                        shadowRadius: 8,
                        elevation: 3,
                      }}
                    >
                      <Text className="text-[11px] font-semibold uppercase tracking-wider text-[#8E8E93]">
                        {t('chat.confirmExpense')}
                      </Text>
                      <View className="mt-3 flex-row items-center">
                        <View
                          className="h-11 w-11 items-center justify-center rounded-[14px]"
                          style={{
                            backgroundColor: `${CATEGORY_BY_ID[action.data.category as ExpenseCategoryId]?.color ?? '#AEB6BF'}20`,
                          }}
                        >
                          <Text className="text-[22px]">
                            {CATEGORY_BY_ID[action.data.category as ExpenseCategoryId]?.icon ?? '📦'}
                          </Text>
                        </View>
                        <View className="ml-3 flex-1">
                          <MoneyText
                            amount={action.data.amount}
                            currency={action.data.currency as Currency}
                            size={17}
                          />
                          <Text className="mt-[2px] text-[13px] text-[#8E8E93]">
                            {action.data.description}
                          </Text>
                        </View>
                      </View>
                      <Pressable
                        onPress={() => confirmExpense(action)}
                        className="mt-3 items-center rounded-[12px] bg-[#007AFF] py-[10px] active:opacity-80"
                      >
                        <Text className="text-[14px] font-semibold text-white">
                          {createExpense.isPending ? t('chat.saving') : t('chat.saveExpense')}
                        </Text>
                      </Pressable>
                    </View>
                  ) : null}
                </View>
              );
            })
          )}

          {sendMutation.isPending ? (
            <View
              className="self-start rounded-[20px] bg-white dark:bg-[#1C1C1E] px-4 py-3"
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.06,
                shadowRadius: 6,
                elevation: 2,
              }}
            >
              <Text className="text-[14px] text-[#8E8E93]">{t('chat.typing')}</Text>
            </View>
          ) : null}
        </ScrollView>

        {/* Quick replies (when conversation has messages) */}
        {messages.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 8, gap: 8 }}
            className="max-h-11"
          >
            {QUICK_ACTIONS.map((q) => (
              <Pressable
                key={q.key}
                onPress={() => send(q.text)}
                className="flex-row items-center gap-[6px] rounded-full bg-white dark:bg-[#1C1C1E] px-4 py-[6px] active:opacity-70"
                style={{
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.06,
                  shadowRadius: 4,
                  elevation: 2,
                }}
              >
                <Text className="text-[14px]">{q.icon}</Text>
                <Text className="text-[13px] font-medium text-black dark:text-white">{t(`chat.${q.key}`)}</Text>
              </Pressable>
            ))}
          </ScrollView>
        ) : null}

        {/* Input bar */}
        <View
          className="flex-row items-center gap-2 bg-white dark:bg-[#1C1C1E] px-4 py-2"
          style={{
            paddingBottom: Platform.OS === 'ios' ? 8 : 80,
            borderTopWidth: 0,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.04,
            shadowRadius: 8,
            elevation: 4,
          }}
        >
          <View className="flex-1 rounded-full bg-[#F2F2F7] dark:bg-[#2C2C2E] px-3 py-[6px]">
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder={t('chat.askPlaceholder')}
              placeholderTextColor="#8E8E93"
              className="text-[14px] text-black dark:text-white"
              returnKeyType="send"
              onSubmitEditing={() => send()}
            />
          </View>
          <Pressable
            onPress={() => send()}
            disabled={!input.trim() || sendMutation.isPending}
            className={`h-8 w-8 items-center justify-center rounded-full ${
              input.trim() ? 'bg-[#007AFF]' : 'bg-[#E5E5EA]'
            }`}
          >
            <Text className={`text-[15px] font-bold ${input.trim() ? 'text-white' : 'text-[#C7C7CC]'}`}>
              ↑
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
