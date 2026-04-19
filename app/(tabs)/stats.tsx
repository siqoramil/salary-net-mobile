import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import Animated, { FadeInUp } from 'react-native-reanimated';

import {
  useExpenses,
  useExpensesByCategory,
  useExpenseSummary,
} from '@/src/hooks/useExpenses';
import { CATEGORY_BY_ID } from '@/src/constants/categories';
import { MoneyText } from '@/src/components/ui/MoneyText';
import { BarChart } from '@/src/components/charts/BarChart';
import { DateTimePicker } from '@/src/components/ui/DateTimePicker';
import {
  StatValueSkeleton,
  ChartSkeleton,
  CategorySkeleton,
  BreakdownSkeleton,
} from '@/src/components/ui/StatsScreenSkeleton';
import type { ExpenseCategoryId } from '@/src/services/expense/expense.types';
import type { Currency } from '@/src/services/auth/auth.types';

type Period = 'daily' | 'weekly' | 'monthly' | 'yearly';

const PERIODS: { key: Period; labelKey: string }[] = [
  { key: 'daily', labelKey: 'stats.daily' },
  { key: 'weekly', labelKey: 'stats.weekly' },
  { key: 'monthly', labelKey: 'stats.monthly' },
  { key: 'yearly', labelKey: 'stats.yearly' },
];

function periodRange(period: Period): { from: Date; to: Date } {
  const now = new Date();
  const from = new Date(now);
  const to = new Date(now);
  if (period === 'daily') {
    from.setHours(0, 0, 0, 0);
    to.setHours(23, 59, 59, 999);
  } else if (period === 'weekly') {
    const day = (from.getDay() + 6) % 7;
    from.setDate(from.getDate() - day);
    from.setHours(0, 0, 0, 0);
    to.setTime(from.getTime());
    to.setDate(to.getDate() + 6);
    to.setHours(23, 59, 59, 999);
  } else if (period === 'monthly') {
    from.setDate(1);
    from.setHours(0, 0, 0, 0);
    to.setMonth(from.getMonth() + 1, 0);
    to.setHours(23, 59, 59, 999);
  } else {
    from.setMonth(0, 1);
    from.setHours(0, 0, 0, 0);
    to.setMonth(11, 31);
    to.setHours(23, 59, 59, 999);
  }
  return { from, to };
}

function formatDateRange(from: Date, to: Date, period: Period, locale: string): string {
  try {
    if (period === 'yearly') return String(from.getFullYear());
    if (period === 'daily') {
      return from.toLocaleDateString(locale, {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      });
    }
    if (period === 'monthly') {
      return from.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
    }
    const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
    return `${from.toLocaleDateString(locale, opts)} — ${to.toLocaleDateString(locale, opts)}`;
  } catch {
    return '';
  }
}

function buildTrend(
  items: { amount: number; expenseDate: string }[],
  period: Period,
  range: { from: Date; to: Date },
): { label: string; value: number }[] {
  const buckets: Record<string, number> = {};
  const labels: string[] = [];

  if (period === 'daily') {
    // 24 hours in 4h buckets
    for (let h = 0; h < 24; h += 4) {
      const key = String(h);
      buckets[key] = 0;
      labels.push(h === 0 ? '0' : `${h}`);
    }
    items.forEach((it) => {
      const d = new Date(it.expenseDate);
      const h = d.getHours();
      const key = String(Math.floor(h / 4) * 4);
      if (key in buckets) buckets[key] += it.amount;
    });
  } else if (period === 'weekly') {
    // Mon..Sun
    const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    for (let i = 0; i < 7; i++) {
      buckets[String(i)] = 0;
      labels.push(dayLabels[i]);
    }
    items.forEach((it) => {
      const d = new Date(it.expenseDate);
      const idx = (d.getDay() + 6) % 7;
      buckets[String(idx)] += it.amount;
    });
  } else if (period === 'monthly') {
    // Weeks of month (W1..W5)
    for (let w = 0; w < 5; w++) {
      buckets[String(w)] = 0;
      labels.push(`W${w + 1}`);
    }
    items.forEach((it) => {
      const d = new Date(it.expenseDate);
      const w = Math.min(4, Math.floor((d.getDate() - 1) / 7));
      buckets[String(w)] += it.amount;
    });
  } else {
    // Yearly — 12 months
    const monthLabels = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
    for (let m = 0; m < 12; m++) {
      buckets[String(m)] = 0;
      labels.push(monthLabels[m]);
    }
    items.forEach((it) => {
      const d = new Date(it.expenseDate);
      buckets[String(d.getMonth())] += it.amount;
    });
  }

  return labels.map((label, i) => ({
    label,
    value: buckets[String(i)] ?? 0,
  }));
}

function daysInPeriod(period: Period, range: { from: Date; to: Date }): number {
  const ms = range.to.getTime() - range.from.getTime();
  const days = Math.max(1, Math.round(ms / 86_400_000));
  return days;
}

export default function StatsScreen() {
  const { t, i18n } = useTranslation();
  const [period, setPeriod] = useState<Period>('monthly');
  const [pickedDate, setPickedDate] = useState<Date | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);

  // When a specific date is picked, override period range with that day.
  const range = useMemo(() => {
    if (pickedDate) {
      const from = new Date(pickedDate);
      from.setHours(0, 0, 0, 0);
      const to = new Date(pickedDate);
      to.setHours(23, 59, 59, 999);
      return { from, to };
    }
    return periodRange(period);
  }, [period, pickedDate]);

  const fromIso = range.from.toISOString();
  const toIso = range.to.toISOString();

  const summaryQuery = useExpenseSummary(period);
  const byCategoryQuery = useExpensesByCategory(fromIso, toIso);
  const listQuery = useExpenses({ from: fromIso, to: toIso, limit: 100 });

  const items = listQuery.data?.pages.flatMap((p) => p.items) ?? [];

  // When a date is picked, compute the day total locally (server summary uses period keys).
  const localTotal = useMemo(() => {
    if (!pickedDate) return null;
    const byCurrency = new Map<string, { total: number; count: number }>();
    for (const it of items) {
      const existing = byCurrency.get(it.currency) ?? { total: 0, count: 0 };
      existing.total += it.amount;
      existing.count += 1;
      byCurrency.set(it.currency, existing);
    }
    const first = Array.from(byCurrency.entries())[0];
    if (!first) return { total: 0, count: 0, currency: 'UZS' };
    return { currency: first[0], total: first[1].total, count: first[1].count };
  }, [pickedDate, items]);

  const total = pickedDate ? localTotal : summaryQuery.data?.byCurrency[0];

  const slices = useMemo(() => {
    return (byCategoryQuery.data ?? []).map((row) => {
      const cat = CATEGORY_BY_ID[row.category as ExpenseCategoryId];
      return {
        label: cat?.id ?? row.category,
        value: row.total,
        color: cat?.color ?? '#AEB6BF',
        icon: cat?.icon ?? '📦',
      };
    });
  }, [byCategoryQuery.data]);

  const trend = useMemo(() => buildTrend(items, period, range), [items, period, range]);

  const top = useMemo(
    () => [...items].sort((a, b) => b.amount - a.amount).slice(0, 5),
    [items],
  );

  const isLoading = summaryQuery.isLoading || byCategoryQuery.isLoading;
  const totalAmount = total?.total ?? 0;
  const totalCurrency = (total?.currency ?? 'UZS') as Currency;
  const totalCount = total?.count ?? 0;
  const daysCount = daysInPeriod(period, range);
  const avgPerDay = totalAmount / daysCount;

  const cardShadow = {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 3,
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F2F2F7] dark:bg-black" edges={['top']}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="flex-row items-start px-5 pt-4">
          <View className="flex-1">
            <Text className="text-[32px] font-bold text-black dark:text-white">
              {t('stats.title')}
            </Text>
            <Text className="mt-1 text-[14px] text-[#8E8E93]">
              {pickedDate
                ? `${String(pickedDate.getDate()).padStart(2, '0')}.${String(pickedDate.getMonth() + 1).padStart(2, '0')}.${pickedDate.getFullYear()}`
                : formatDateRange(range.from, range.to, period, i18n.language)}
            </Text>
          </View>
          <CalendarButton
            picked={pickedDate}
            onPress={() => setCalendarOpen(true)}
          />
        </View>

        {/* Period pills — hidden when a specific date is picked */}
        {!pickedDate ? (
          <View
            className="mx-5 mt-4 flex-row rounded-full bg-white p-[5px] dark:bg-[#1C1C1E]"
            style={cardShadow}
          >
            {PERIODS.map((p) => {
              const isActive = period === p.key;
              return (
                <Pressable
                  key={p.key}
                  onPress={() => setPeriod(p.key)}
                  className={`flex-1 items-center rounded-full py-[8px] ${
                    isActive ? 'bg-[#007AFF]' : ''
                  }`}
                >
                  <Text
                    className={`text-[12px] ${
                      isActive ? 'font-semibold text-white' : 'font-medium text-[#8E8E93]'
                    }`}
                  >
                    {t(p.labelKey)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ) : (
          <Pressable
            onPress={() => setPickedDate(null)}
            className="mx-5 mt-4 flex-row items-center justify-center rounded-full bg-white py-[10px] dark:bg-[#1C1C1E]"
            style={cardShadow}
          >
            <Text className="text-[13px] font-semibold text-[#007AFF]">
              ← {t('stats.clearDate')}
            </Text>
          </Pressable>
        )}

        {/* Stat rows — each on its own line so big numbers have room */}
        <Animated.View
          entering={FadeInUp.duration(320)}
          className="mx-5 mt-4"
          style={{ gap: 10 }}
        >
          <StatRow
            label={t('stats.totalSpent')}
            isLoading={isLoading}
            shadow={cardShadow}
            accent="#007AFF"
          >
            <MoneyText
              amount={totalAmount}
              currency={totalCurrency}
              size={15}
              weight="700"
            />
          </StatRow>
          <StatRow
            label={t('stats.avgPerDay')}
            isLoading={isLoading}
            shadow={cardShadow}
            accent="#34C759"
          >
            <MoneyText
              amount={Math.round(avgPerDay)}
              currency={totalCurrency}
              size={15}
              weight="700"
            />
          </StatRow>
          <StatRow
            label={t('stats.transactions')}
            isLoading={isLoading}
            shadow={cardShadow}
            accent="#FF9500"
          >
            <Text className="text-[15px] font-bold text-black dark:text-white">
              {totalCount}
            </Text>
          </StatRow>
        </Animated.View>

        {/* Trend bar chart */}
        {isLoading ? (
          <ChartSkeleton />
        ) : (
        <Animated.View
          entering={FadeInUp.delay(80).duration(320)}
          className="mx-5 mt-4 rounded-[22px] bg-white p-5 dark:bg-[#1C1C1E]"
          style={cardShadow}
        >
          <View className="flex-row items-center justify-between">
            <Text className="text-[17px] font-bold text-black dark:text-white">
              {t('stats.trend')}
            </Text>
            <View className="flex-row items-center" style={{ gap: 6 }}>
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: '#007AFF',
                }}
              />
              <Text className="text-[11px] text-[#8E8E93]">
                {t('stats.spending')}
              </Text>
            </View>
          </View>
          <View className="mt-4">
            <BarChart
              data={trend}
              color="#007AFF"
              height={140}
              noDataText={t('stats.noData')}
            />
          </View>
        </Animated.View>
        )}

        {/* Donut + legend */}
        {isLoading ? (
          <CategorySkeleton />
        ) : slices.length > 0 ? (
          <Animated.View
            entering={FadeInUp.delay(160).duration(320)}
            className="mx-5 mt-4 rounded-[22px] bg-white p-5 dark:bg-[#1C1C1E]"
            style={cardShadow}
          >
            <View className="flex-row items-center justify-between">
              <Text className="text-[15px] font-bold text-black dark:text-white">
                {t('stats.byCategory')}
              </Text>
              <Text className="text-[11px] font-semibold uppercase tracking-wider text-[#8E8E93]">
                {t('stats.categoriesCount', { count: slices.length })}
              </Text>
            </View>

            {/* Stacked horizontal bar — single line split by category colors */}
            <View
              className="mt-4 h-[14px] flex-row overflow-hidden rounded-full bg-[#F2F2F7] dark:bg-[#2C2C2E]"
            >
              {slices.map((s, idx) => {
                const pct = totalAmount > 0 ? (s.value / totalAmount) * 100 : 0;
                if (pct <= 0) return null;
                return (
                  <View
                    key={s.label}
                    style={{
                      width: `${pct}%`,
                      backgroundColor: s.color,
                      marginLeft: idx === 0 ? 0 : 1,
                    }}
                  />
                );
              })}
            </View>

            {/* Top 4 legend — 2 columns */}
            <View className="mt-4 flex-row flex-wrap">
              {slices.slice(0, 4).map((s, idx) => {
                const pct = totalAmount > 0 ? (s.value / totalAmount) * 100 : 0;
                const isLeft = idx % 2 === 0;
                return (
                  <View
                    key={s.label}
                    style={{
                      width: '50%',
                      paddingRight: isLeft ? 12 : 0,
                      paddingLeft: isLeft ? 0 : 6,
                      marginTop: idx < 2 ? 0 : 12,
                    }}
                    className="flex-row items-center"
                  >
                    <View
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: s.color,
                        marginRight: 6,
                      }}
                    />
                    <Text style={{ fontSize: 13, marginRight: 4 }}>
                      {s.icon}
                    </Text>
                    <Text
                      className="flex-1 text-[12px] font-medium capitalize text-black dark:text-white"
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {s.label}
                    </Text>
                    <Text
                      className="ml-[6px] text-[11px] font-bold text-[#8E8E93]"
                      style={{ fontVariant: ['tabular-nums'] }}
                    >
                      {pct.toFixed(0)}%
                    </Text>
                  </View>
                );
              })}
            </View>
          </Animated.View>
        ) : null}

        {/* Category breakdown with progress */}
        {isLoading ? (
          <BreakdownSkeleton />
        ) : slices.length > 0 ? (
          <Animated.View
            entering={FadeInUp.delay(240).duration(320)}
            className="mx-5 mt-4 rounded-[22px] bg-white p-5 dark:bg-[#1C1C1E]"
            style={cardShadow}
          >
            <Text className="text-[17px] font-bold text-black dark:text-white">
              {t('stats.breakdown')}
            </Text>
            <View className="mt-2">
              {slices.map((s, idx) => {
                const pct = totalAmount > 0 ? (s.value / totalAmount) * 100 : 0;
                return (
                  <View
                    key={s.label}
                    className={`flex-row items-center ${idx > 0 ? 'mt-4' : 'mt-3'}`}
                  >
                    <View
                      className="h-10 w-10 items-center justify-center rounded-[12px]"
                      style={{ backgroundColor: `${s.color}22` }}
                    >
                      <Text className="text-[19px]">{s.icon}</Text>
                    </View>
                    <View className="ml-3 flex-1">
                      <View className="flex-row items-center justify-between">
                        <Text className="text-[14px] font-semibold capitalize text-black dark:text-white">
                          {s.label}
                        </Text>
                        <MoneyText
                          amount={s.value}
                          currency={totalCurrency}
                          size={14}
                          weight="700"
                        />
                      </View>
                      <View className="mt-[6px] flex-row items-center">
                        <View className="mr-2 h-[5px] flex-1 overflow-hidden rounded-full bg-[#F2F2F7] dark:bg-[#2C2C2E]">
                          <View
                            className="h-full rounded-full"
                            style={{
                              width: `${Math.min(pct, 100)}%`,
                              backgroundColor: s.color,
                            }}
                          />
                        </View>
                        <Text className="text-[11px] font-semibold text-[#8E8E93]">
                          {pct.toFixed(1)}%
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          </Animated.View>
        ) : null}

        {/* Empty state */}
        {!isLoading && slices.length === 0 ? (
          <Animated.View
            entering={FadeInUp.duration(320)}
            className="mx-5 mt-4 items-center rounded-[22px] bg-white px-8 py-12 dark:bg-[#1C1C1E]"
            style={cardShadow}
          >
            <View className="h-20 w-20 items-center justify-center rounded-full bg-[#F2F2F7] dark:bg-[#2C2C2E]">
              <Text className="text-[40px]">📊</Text>
            </View>
            <Text className="mt-4 text-[18px] font-bold text-black dark:text-white">
              {t('stats.noData')}
            </Text>
            <Text className="mt-2 text-center text-[14px] leading-5 text-[#8E8E93]">
              {t('stats.noDataPeriod')}
            </Text>
          </Animated.View>
        ) : null}

        {/* Top expenses */}
        {top.length > 0 ? (
          <Animated.View
            entering={FadeInUp.delay(320).duration(320)}
            className="mx-5 mt-4 rounded-[22px] bg-white p-5 dark:bg-[#1C1C1E]"
            style={cardShadow}
          >
            <Text className="text-[17px] font-bold text-black dark:text-white">
              {t('stats.topExpenses')}
            </Text>
            <View className="mt-3">
              {top.map((e, i) => {
                const cat = CATEGORY_BY_ID[e.category];
                const rank = i + 1;
                return (
                  <View
                    key={e.id}
                    className={`flex-row items-center py-3 ${
                      i < top.length - 1
                        ? 'border-b border-[#F2F2F7] dark:border-[#38383A]'
                        : ''
                    }`}
                  >
                    <View className="h-7 w-7 items-center justify-center rounded-full bg-[#F2F2F7] dark:bg-[#2C2C2E]">
                      <Text className="text-[11px] font-bold text-[#8E8E93]">
                        {rank}
                      </Text>
                    </View>
                    <View
                      className="ml-3 h-10 w-10 items-center justify-center rounded-[12px]"
                      style={{ backgroundColor: `${cat?.color ?? '#AEB6BF'}22` }}
                    >
                      <Text className="text-[20px]">{cat?.icon ?? '📦'}</Text>
                    </View>
                    <View className="ml-3 flex-1">
                      <Text
                        className="text-[14px] font-semibold text-black dark:text-white"
                        numberOfLines={1}
                      >
                        {e.description || cat?.id || t('home.expense')}
                      </Text>
                      <Text className="text-[11px] text-[#8E8E93]">
                        {new Date(e.expenseDate).toLocaleDateString(i18n.language)}
                      </Text>
                    </View>
                    <MoneyText
                      amount={e.amount}
                      currency={e.currency}
                      prefix="−"
                      size={14}
                      color="#FF3B30"
                      weight="700"
                    />
                  </View>
                );
              })}
            </View>
          </Animated.View>
        ) : null}
      </ScrollView>

      <DateTimePicker
        visible={calendarOpen}
        value={pickedDate ?? new Date()}
        onConfirm={(d) => {
          setPickedDate(d);
          setCalendarOpen(false);
        }}
        onCancel={() => setCalendarOpen(false)}
        confirmLabel={t('common.confirm')}
        cancelLabel={t('common.cancel')}
        dateOnly
      />
    </SafeAreaView>
  );
}

function CalendarButton({
  picked,
  onPress,
}: {
  picked: Date | null;
  onPress: () => void;
}) {
  // Recreates the iOS Calendar app icon: red header strip with two
  // silver spiral rings, white body, today's (or picked) day number in
  // dark gray. Composed from plain Views so it scales crisply and does
  // not depend on any icon font.
  const SIZE = 32;
  const RADIUS = SIZE * 0.22;
  const HEADER_HEIGHT = SIZE * 0.3;
  const day = (picked ?? new Date()).getDate();

  return (
    <Pressable
      onPress={onPress}
      className="ml-2 mt-1 active:opacity-80"
      hitSlop={12}
      style={{
        width: SIZE,
        height: SIZE,
      }}
    >
      <View
        style={{
          width: SIZE,
          height: SIZE,
          borderRadius: RADIUS,
          backgroundColor: '#FFFFFF',
          overflow: 'hidden',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.18,
          shadowRadius: 5,
          elevation: 4,
        }}
      >
        {/* Red header strip */}
        <View
          style={{
            width: '100%',
            height: HEADER_HEIGHT,
            backgroundColor: '#E4453A',
          }}
        />

        {/* Two silver ring binders poking through the red */}
        {[0.3, 0.7].map((pos) => (
          <View
            key={pos}
            style={{
              position: 'absolute',
              top: -2,
              left: SIZE * pos - 2,
              width: 4,
              height: HEADER_HEIGHT * 0.7,
              borderRadius: 2,
              backgroundColor: '#D0D0D0',
            }}
          >
            <View
              style={{
                position: 'absolute',
                top: 3,
                left: 0,
                width: 4,
                height: 4,
                borderRadius: 2,
                backgroundColor: '#8A8A8A',
              }}
            />
          </View>
        ))}

        {/* Day number centered in the white body */}
        <View
          style={{
            position: 'absolute',
            top: HEADER_HEIGHT,
            left: 0,
            right: 0,
            bottom: 0,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text
            style={{
              fontSize: SIZE * 0.44,
              fontWeight: '600',
              color: '#3A3A3A',
              fontVariant: ['tabular-nums'],
              includeFontPadding: false,
              lineHeight: SIZE * 0.5,
            }}
          >
            {day}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

function StatRow({
  label,
  children,
  isLoading,
  shadow,
  accent,
}: {
  label: string;
  children: React.ReactNode;
  isLoading?: boolean;
  shadow: object;
  accent: string;
}) {
  return (
    <View
      className="flex-row items-center overflow-hidden rounded-[16px] bg-white px-[16px] py-[14px] dark:bg-[#1C1C1E]"
      style={shadow}
    >
      <View
        style={{
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: accent,
          marginRight: 10,
        }}
      />
      <Text
        className="text-[12px] font-semibold uppercase tracking-wider text-[#8E8E93]"
        numberOfLines={1}
        style={{ flexShrink: 1 }}
      >
        {label}
      </Text>
      <View
        style={{
          marginLeft: 12,
          flex: 1,
          flexShrink: 1,
          alignItems: 'flex-end',
        }}
      >
        {isLoading ? <StatValueSkeleton /> : children}
      </View>
    </View>
  );
}
