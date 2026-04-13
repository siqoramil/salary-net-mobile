import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { useExpenses, useExpensesByCategory, useExpenseSummary } from '@/src/hooks/useExpenses';
import { CATEGORY_BY_ID } from '@/src/constants/categories';
import { MoneyText } from '@/src/components/ui/MoneyText';
import { DonutChart } from '@/src/components/charts/DonutChart';
import type { ExpenseCategoryId } from '@/src/types/expense';
import type { Currency } from '@/src/types/auth';
import { LoadingSpinner } from '@/src/components/ui/LoadingSpinner';

type Period = 'daily' | 'weekly' | 'monthly' | 'yearly';

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

export default function StatsScreen() {
  const { t } = useTranslation();
  const [period, setPeriod] = useState<Period>('monthly');
  const range = useMemo(() => periodRange(period), [period]);
  const fromIso = range.from.toISOString();
  const toIso = range.to.toISOString();

  const summaryQuery = useExpenseSummary(period);
  const byCategoryQuery = useExpensesByCategory(fromIso, toIso);
  const listQuery = useExpenses({ from: fromIso, to: toIso, limit: 100 });

  const items = listQuery.data?.pages.flatMap((p) => p.items) ?? [];
  const total = summaryQuery.data?.byCurrency[0];

  // Donut data — group by category, summing UZS-equivalent (just sum amounts since most users use one currency)
  const slices = (byCategoryQuery.data ?? []).map((row) => {
    const cat = CATEGORY_BY_ID[row.category as ExpenseCategoryId];
    return {
      label: cat?.id ?? row.category,
      value: row.total,
      color: cat?.color ?? '#AEB6BF',
    };
  });

  // Top expenses
  const top = [...items].sort((a, b) => b.amount - a.amount).slice(0, 5);

  return (
    <SafeAreaView className="flex-1 bg-[#F2F2F7] dark:bg-black">
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <View className="px-5 pt-2">
          <Text className="text-[28px] font-bold text-black dark:text-white">{t('stats.title')}</Text>
        </View>

        {/* Period selector */}
        <View className="mx-5 mt-4 flex-row rounded-[10px] bg-[#E5E5EA] dark:bg-[#2C2C2E] p-1">
          {(['daily', 'weekly', 'monthly', 'yearly'] as Period[]).map((p) => (
            <Pressable
              key={p}
              onPress={() => setPeriod(p)}
              className={`flex-1 items-center rounded-[8px] py-2 ${
                period === p ? 'bg-white shadow' : ''
              }`}
            >
              <Text className={`text-[13px] ${period === p ? 'font-semibold' : 'text-[#8E8E93]'}`}>
                {t(`stats.${p}`)}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Donut */}
        <View className="mx-5 mt-4 rounded-[16px] bg-white dark:bg-[#1C1C1E] p-5 items-center">
          <Text className="self-start text-[15px] font-semibold text-black dark:text-white">{t('stats.byCategory')}</Text>
          {byCategoryQuery.isLoading ? (
            <LoadingSpinner size="large" className="my-10" />
          ) : (
            <DonutChart
              data={slices}
              noDataText={t('stats.noData')}
              centerContent={
                total ? (
                  <MoneyText amount={total.total} currency={total.currency as Currency} size={20} />
                ) : undefined
              }
              centerSubtext={`${total?.count ?? 0} txns`}
            />
          )}
          <View className="mt-3 w-full">
            {slices.slice(0, 5).map((s) => {
              const pct = total?.total ? Math.round((s.value / total.total) * 100) : 0;
              return (
                <View key={s.label} className="flex-row items-center py-1">
                  <View
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: s.color }}
                  />
                  <Text className="ml-2 flex-1 text-[15px] text-black dark:text-white">
                    {CATEGORY_BY_ID[s.label as ExpenseCategoryId]?.icon ?? '📦'} {s.label}
                  </Text>
                  <Text className="text-[14px] text-[#8E8E93]">{pct}%</Text>
                  <View className="ml-3">
                    {total ? (
                      <MoneyText amount={s.value} currency={total.currency as Currency} size={14} weight="600" />
                    ) : (
                      <Text className="text-[14px] font-semibold text-black dark:text-white">{s.value}</Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Top expenses */}
        <View className="mx-5 mt-4 rounded-[16px] bg-white dark:bg-[#1C1C1E] p-5">
          <Text className="text-[15px] font-semibold text-black dark:text-white">{t('stats.topExpenses')}</Text>
          {top.length === 0 ? (
            <Text className="mt-3 text-[13px] text-[#8E8E93]">{t('stats.noDataPeriod')}</Text>
          ) : (
            top.map((e, i) => {
              const cat = CATEGORY_BY_ID[e.category];
              return (
                <View
                  key={e.id}
                  className={`flex-row items-center py-2 ${
                    i < top.length - 1 ? 'border-b border-[#F2F2F7] dark:border-[#38383A]' : ''
                  }`}
                >
                  <Text className="text-[20px]">{cat?.icon ?? '📦'}</Text>
                  <View className="ml-3 flex-1">
                    <Text className="text-[15px] text-black dark:text-white">{e.description || e.category}</Text>
                    <Text className="text-[11px] text-[#8E8E93]">
                      {new Date(e.expenseDate).toLocaleDateString()}
                    </Text>
                  </View>
                  <MoneyText
                    amount={e.amount}
                    currency={e.currency}
                    prefix="-"
                    size={14}
                    color="#FF3B30"
                    weight="600"
                  />
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
