import { useEffect, useState } from 'react';
import {
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import { useAuthStore } from '@/src/stores/authStore';
import { useThemeStore } from '@/src/stores/themeStore';
import { useExpenseSummary, useExpenses, useDeleteExpense } from '@/src/hooks/useExpenses';
import { CATEGORY_BY_ID } from '@/src/constants/categories';
import { formatTime, groupByDay } from '@/src/utils/format';
import { MoneyText } from '@/src/components/ui/MoneyText';
import type { Expense } from '@/src/types/expense';
import { LoadingSpinner } from '@/src/components/ui/LoadingSpinner';
import { AddExpenseSheet } from '@/src/components/expense/AddExpenseSheet';
import { EditExpenseSheet } from '@/src/components/expense/EditExpenseSheet';
import { UserAvatar } from '@/src/components/ui/UserAvatar';

type Period = 'daily' | 'weekly' | 'monthly';

const ACTION_WIDTH = 72;

export default function HomeScreen() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);

  const [period, setPeriod] = useState<Period>('daily');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editExpense, setEditExpense] = useState<Expense | null>(null);

  const summaryQuery = useExpenseSummary(period);
  const listQuery = useExpenses({ limit: 30 });
  const deleteMutation = useDeleteExpense();

  const flatItems = listQuery.data?.pages.flatMap((p) => p.items) ?? [];
  const groups = groupByDay(flatItems, t('home.today'), t('home.yesterday'));

  const totals = summaryQuery.data?.byCurrency ?? [];
  const primary = totals[0];

  return (
    <SafeAreaView className="flex-1 bg-[#F2F2F7] dark:bg-black" edges={['top']}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 160 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={listQuery.isRefetching}
            onRefresh={() => {
              void listQuery.refetch();
              void summaryQuery.refetch();
            }}
          />
        }
      >
        {/* Header */}
        <View className="flex-row items-center px-5 pb-2 pt-3">
          <UserAvatar uri={user?.avatarUrl} name={user?.fullName} size={44} />
          <View className="ml-3 flex-1">
            <Text className="text-[13px] text-[#8E8E93]">{t('common.appName')}</Text>
            <Text className="text-[18px] font-bold text-black dark:text-white">
              {user?.fullName ?? ''}
            </Text>
          </View>
        </View>

        {/* Balance card */}
        <View className="mx-5 mt-3 overflow-hidden rounded-[20px] bg-[#007AFF] p-5">
          <Text className="text-[13px] font-medium text-white/70">
            {t('home.totalLabel', { period: t(`home.period${period.charAt(0).toUpperCase() + period.slice(1)}` as 'home.periodDaily') })}
          </Text>

          {summaryQuery.isLoading ? (
            <LoadingSpinner color="#fff" className="mt-3" />
          ) : (
            <View className="mt-2">
              <MoneyText
                amount={primary ? primary.total : 0}
                currency={(primary?.currency as 'UZS') ?? user?.defaultCurrency ?? 'UZS'}
                size={36}
                color="#fff"
                weight="800"
              />
            </View>
          )}

          <View className="mt-3 flex-row items-center">
            <View className="rounded-full bg-white/20 px-3 py-1">
              <Text className="text-[12px] font-semibold text-white">
                {t('home.transactions', { count: primary?.count ?? 0 })}
              </Text>
            </View>
          </View>

          {/* Period selector inside card */}
          <View className="mt-4 flex-row rounded-[12px] bg-white/15 p-1">
            {(['daily', 'weekly', 'monthly'] as Period[]).map((p) => (
              <Pressable
                key={p}
                onPress={() => setPeriod(p)}
                className={`flex-1 items-center rounded-[10px] py-2 ${
                  period === p ? 'bg-white' : ''
                }`}
              >
                <Text
                  className={`text-[13px] font-semibold ${
                    period === p ? 'text-[#007AFF]' : 'text-white/80'
                  }`}
                >
                  {t(`home.period${p.charAt(0).toUpperCase() + p.slice(1)}` as 'home.periodDaily')}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Section header */}
        <View className="mt-5 flex-row items-center justify-between px-5">
          <Text className="text-[17px] font-bold text-black dark:text-white">
            {t('home.recentExpenses') ?? 'Recent'}
          </Text>
          <Text className="text-[13px] text-[#8E8E93]">
            {flatItems.length > 0 ? `${flatItems.length} ${t('common.items')}` : ''}
          </Text>
        </View>

        {/* Expense list */}
        {listQuery.isLoading ? (
          <LoadingSpinner size="large" className="mt-10" />
        ) : groups.length === 0 ? (
          <View className="mx-5 mt-6 items-center rounded-[20px] bg-white dark:bg-[#1C1C1E] px-8 py-12">
            <View className="h-20 w-20 items-center justify-center rounded-full bg-[#F2F2F7] dark:bg-[#2C2C2E]">
              <Text className="text-[40px]">📋</Text>
            </View>
            <Text className="mt-4 text-[18px] font-bold text-black dark:text-white">
              {t('home.noExpensesTitle')}
            </Text>
            <Text className="mt-2 text-center text-[14px] leading-5 text-[#8E8E93]">
              {t('home.noExpensesDesc')}
            </Text>
          </View>
        ) : (
          groups.map((group) => (
            <View key={group.day} className="mt-4 px-5">
              <Text className="mb-2 ml-1 text-[13px] font-semibold uppercase tracking-wider text-[#8E8E93]">
                {group.label}
              </Text>
              <View className="overflow-hidden rounded-[16px] bg-white dark:bg-[#1C1C1E]">
                {group.items.map((expense, idx) => (
                  <SwipeableExpenseRow
                    key={expense.id}
                    expense={expense}
                    isLast={idx === group.items.length - 1}
                    onDelete={() => deleteMutation.mutate(expense.id)}
                    onEdit={() => setEditExpense(expense)}
                  />
                ))}
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* FAB */}
      <AnimatedFab onPress={() => setSheetOpen(true)} />

      <AddExpenseSheet visible={sheetOpen} onClose={() => setSheetOpen(false)} />
      <EditExpenseSheet
        expense={editExpense}
        visible={!!editExpense}
        onClose={() => setEditExpense(null)}
      />
    </SafeAreaView>
  );
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const FAB_SIZE = 56;

function AnimatedFab({ onPress }: { onPress: () => void }) {
  const scale = useSharedValue(0);

  useEffect(() => {
    scale.value = withSpring(1, { damping: 14, stiffness: 160 });
  }, [scale]);

  const fabStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    scale.value = withSequence(
      withSpring(0.88, { damping: 15, stiffness: 400 }),
      withSpring(1, { damping: 12, stiffness: 200 }),
    );
    onPress();
  };

  return (
    <View className="absolute bottom-28 left-0 right-0 items-center">
      <AnimatedPressable
        onPress={handlePress}
        style={[
          {
            height: FAB_SIZE,
            width: FAB_SIZE,
            borderRadius: FAB_SIZE / 2,
            backgroundColor: '#007AFF',
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#007AFF',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.35,
            shadowRadius: 10,
            elevation: 8,
          },
          fabStyle,
        ]}
      >
        <Text style={{ color: '#fff', fontSize: 28, fontWeight: '400' }}>+</Text>
      </AnimatedPressable>
    </View>
  );
}

function SwipeableExpenseRow({
  expense,
  isLast,
  onDelete,
  onEdit,
}: {
  expense: Expense;
  isLast: boolean;
  onDelete: () => void;
  onEdit: () => void;
}) {
  const { t } = useTranslation();
  const isDark = useThemeStore((s) => s.resolved) === 'dark';
  const rowBg = isDark ? '#1C1C1E' : '#FFFFFF';
  const cat = CATEGORY_BY_ID[expense.category];
  const translateX = useSharedValue(0);

  const pan = Gesture.Pan()
    .activeOffsetX([-15, 15])
    .failOffsetY([-10, 10])
    .onUpdate((e) => {
      // Clamp: left max -ACTION_WIDTH, right max +ACTION_WIDTH
      if (e.translationX < 0) {
        translateX.value = Math.max(e.translationX, -ACTION_WIDTH);
      } else {
        translateX.value = Math.min(e.translationX, ACTION_WIDTH);
      }
    })
    .onEnd((e) => {
      if (e.translationX < -ACTION_WIDTH / 2) {
        // Swiped left enough → snap to show delete
        translateX.value = withSpring(-ACTION_WIDTH, { damping: 20, stiffness: 200 });
      } else if (e.translationX > ACTION_WIDTH / 2) {
        // Swiped right enough → snap to show edit
        translateX.value = withSpring(ACTION_WIDTH, { damping: 20, stiffness: 200 });
      } else {
        // Snap back
        translateX.value = withSpring(0, { damping: 20, stiffness: 200 });
      }
    });

  const rowStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const deleteActionStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, -ACTION_WIDTH], [0, 1]),
    transform: [{ scale: interpolate(translateX.value, [0, -ACTION_WIDTH], [0.5, 1]) }],
  }));

  const editActionStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, ACTION_WIDTH], [0, 1]),
    transform: [{ scale: interpolate(translateX.value, [0, ACTION_WIDTH], [0.5, 1]) }],
  }));

  const handleDelete = () => {
    translateX.value = withTiming(-400, { duration: 250 }, () => {
      runOnJS(onDelete)();
    });
  };

  const handleEdit = () => {
    translateX.value = withSpring(0, { damping: 20, stiffness: 200 });
    onEdit();
  };

  return (
    <View
      style={{ overflow: 'hidden', backgroundColor: rowBg }}
      className={isLast ? '' : 'border-b border-[#F2F2F7] dark:border-[#38383A]'}
    >
      <GestureDetector gesture={pan}>
        <Animated.View style={[{ flexDirection: 'row' }, rowStyle]}>
          {/* Edit action (off-screen left) */}
          <Pressable
            onPress={handleEdit}
            style={{
              width: ACTION_WIDTH,
              marginLeft: -ACTION_WIDTH,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: rowBg,
            }}
          >
            <Text style={{ fontSize: 20 }}>✏️</Text>
            <Text style={{ fontSize: 10, color: '#007AFF', fontWeight: '600', marginTop: 2 }}>
              {t('common.edit')}
            </Text>
          </Pressable>

          {/* Row content */}
          <View
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 16,
              paddingVertical: 14,
              backgroundColor: rowBg,
            }}
          >
            {expense.receiptUrl ? (
              <Image
                source={{ uri: expense.receiptUrl }}
                style={{
                  height: 44,
                  width: 44,
                  borderRadius: 14,
                  backgroundColor: '#E5E5EA',
                }}
              />
            ) : (
              <View
                style={{
                  height: 44,
                  width: 44,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 14,
                  backgroundColor: `${cat?.color ?? '#AEB6BF'}20`,
                }}
              >
                <Text style={{ fontSize: 22 }}>{cat?.icon ?? '📦'}</Text>
              </View>
            )}
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text
                numberOfLines={1}
                style={{ fontSize: 15, fontWeight: '600', color: isDark ? '#fff' : '#000' }}
              >
                {expense.description || cat?.id || t('home.expense')}
              </Text>
              <Text style={{ fontSize: 12, color: '#8E8E93', marginTop: 2 }}>
                {formatTime(expense.expenseDate)}
              </Text>
            </View>
            <MoneyText
              amount={expense.amount}
              currency={expense.currency}
              prefix="-"
              size={16}
              color="#FF3B30"
            />
          </View>

          {/* Delete action (off-screen right) */}
          <Pressable
            onPress={handleDelete}
            style={{
              width: ACTION_WIDTH,
              marginRight: -ACTION_WIDTH,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: rowBg,
            }}
          >
            <Text style={{ fontSize: 20 }}>🗑</Text>
            <Text style={{ fontSize: 10, color: '#FF3B30', fontWeight: '600', marginTop: 2 }}>
              {t('common.delete')}
            </Text>
          </Pressable>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}
