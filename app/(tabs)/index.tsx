import { useState } from 'react';
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
  withTiming,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Svg, { Path } from 'react-native-svg';

import { useAuthStore } from '@/src/stores/authStore';
import { useThemeStore } from '@/src/stores/themeStore';
import { useExpenseSummary, useExpenses, useDeleteExpense } from '@/src/hooks/useExpenses';
import { CATEGORY_BY_ID } from '@/src/constants/categories';
import { formatTime, groupByDay } from '@/src/utils/format';
import { MoneyText } from '@/src/components/ui/MoneyText';
import type { Expense } from '@/src/services/expense/expense.types';
import { LoadingSpinner } from '@/src/components/ui/LoadingSpinner';
import { BalanceAmountSkeleton, HomeListSkeleton } from '@/src/components/ui/HomeScreenSkeleton';
import { EditExpenseSheet } from '@/src/components/expense/EditExpenseSheet';
import { UserAvatar } from '@/src/components/ui/UserAvatar';

type Period = 'daily' | 'weekly' | 'monthly';

const ACTION_WIDTH = 82;
const SWIPE_FRICTION = 0.35;
const SNAP_SPRING = { damping: 26, stiffness: 70, mass: 1.1 };

const INITIAL_VISIBLE = 10;
const STEP = 10;

export default function HomeScreen() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);

  const [period, setPeriod] = useState<Period>('daily');
  const [editExpense, setEditExpense] = useState<Expense | null>(null);
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);

  const summaryQuery = useExpenseSummary(period);
  const listQuery = useExpenses({ limit: 30 });
  const deleteMutation = useDeleteExpense();

  const flatItems = listQuery.data?.pages.flatMap((p) => p.items) ?? [];
  const visibleItems = flatItems.slice(0, visibleCount);
  const groups = groupByDay(visibleItems, t('home.today'), t('home.yesterday'));
  const hasMoreLoaded = flatItems.length > visibleCount;
  const canLoadMore = hasMoreLoaded || (listQuery.hasNextPage ?? false);

  const onShowMore = () => {
    if (flatItems.length > visibleCount) {
      setVisibleCount((c) => c + STEP);
      return;
    }
    if (listQuery.hasNextPage && !listQuery.isFetchingNextPage) {
      void listQuery.fetchNextPage().then(() => setVisibleCount((c) => c + STEP));
    }
  };

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
            {t('home.totalLabel', {
              period: t(
                `home.period${period.charAt(0).toUpperCase() + period.slice(1)}` as 'home.periodDaily',
              ),
            })}
          </Text>

          {summaryQuery.isLoading ? (
            <BalanceAmountSkeleton />
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
                  {t(
                    `home.period${p.charAt(0).toUpperCase() + p.slice(1)}` as 'home.periodDaily',
                  )}
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
            {flatItems.length > 0
              ? t('home.showingCount', {
                  shown: Math.min(visibleCount, flatItems.length),
                  total: flatItems.length,
                })
              : ''}
          </Text>
        </View>

        {/* Expense list */}
        {listQuery.isLoading ? (
          <HomeListSkeleton />
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
          <>
            {groups.map((group) => (
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
            ))}

            {canLoadMore ? (
              <View className="mt-4 px-5">
                <Pressable
                  onPress={onShowMore}
                  disabled={listQuery.isFetchingNextPage}
                  className="items-center rounded-[14px] bg-white py-[14px] active:opacity-70 dark:bg-[#1C1C1E]"
                >
                  {listQuery.isFetchingNextPage ? (
                    <LoadingSpinner />
                  ) : (
                    <Text className="text-[15px] font-semibold text-[#007AFF]">
                      {t('home.showMore')}
                    </Text>
                  )}
                </Pressable>
              </View>
            ) : null}
          </>
        )}
      </ScrollView>

      <EditExpenseSheet
        expense={editExpense}
        visible={!!editExpense}
        onClose={() => setEditExpense(null)}
      />
    </SafeAreaView>
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
      const raw = e.translationX * SWIPE_FRICTION;
      if (raw < 0) {
        translateX.value = Math.max(raw, -ACTION_WIDTH);
      } else {
        translateX.value = Math.min(raw, ACTION_WIDTH);
      }
    })
    .onEnd(() => {
      if (translateX.value < -ACTION_WIDTH / 2) {
        translateX.value = withSpring(-ACTION_WIDTH, SNAP_SPRING);
      } else if (translateX.value > ACTION_WIDTH / 2) {
        translateX.value = withSpring(ACTION_WIDTH, SNAP_SPRING);
      } else {
        translateX.value = withSpring(0, SNAP_SPRING);
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
    translateX.value = withTiming(-400, { duration: 450 }, () => {
      runOnJS(onDelete)();
    });
  };

  const handleEdit = () => {
    translateX.value = withSpring(0, SNAP_SPRING);
    onEdit();
  };

  return (
    <View
      style={{ overflow: 'hidden', backgroundColor: rowBg }}
      className={isLast ? '' : 'border-b border-[#F2F2F7] dark:border-[#38383A]'}
    >
      <GestureDetector gesture={pan}>
        <Animated.View style={[{ flexDirection: 'row' }, rowStyle]}>
          {/* Edit action (revealed on right swipe) */}
          <Pressable
            onPress={handleEdit}
            android_ripple={{ color: 'rgba(255,255,255,0.15)' }}
            style={{
              width: ACTION_WIDTH,
              marginLeft: -ACTION_WIDTH,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#007AFF',
            }}
          >
            <Animated.View style={editActionStyle} className="items-center">
              <PencilIcon size={26} color="#fff" />
              <Text className="mt-[6px] text-[12px] font-semibold text-white tracking-wide">
                {t('common.edit')}
              </Text>
            </Animated.View>
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

          {/* Delete action (revealed on left swipe) */}
          <Pressable
            onPress={handleDelete}
            android_ripple={{ color: 'rgba(255,255,255,0.15)' }}
            style={{
              width: ACTION_WIDTH,
              marginRight: -ACTION_WIDTH,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#FF3B30',
            }}
          >
            <Animated.View style={deleteActionStyle} className="items-center">
              <TrashIcon size={22} color="#fff" />
              <Text className="mt-1 text-[11px] font-semibold text-white">
                {t('common.delete')}
              </Text>
            </Animated.View>
          </Pressable>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

function PencilIcon({ size = 22, color = '#fff' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M15.232 3.232l3.536 3.536M14.5 4l-11 11v4h4l11-11-4-4z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function TrashIcon({ size = 22, color = '#fff' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 6h18"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
      <Path
        d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M10 11v6M14 11v6"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  );
}
