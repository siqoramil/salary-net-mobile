import { Tabs } from 'expo-router';
import React from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { CustomTabBar } from '@/src/components/ui/CustomTabBar';
import { AddExpenseSheet } from '@/src/components/expense/AddExpenseSheet';
import { useUIStore } from '@/src/stores/uiStore';

export default function TabLayout() {
  const { t } = useTranslation();
  const addExpenseOpen = useUIStore((s) => s.addExpenseOpen);
  const closeAddExpense = useUIStore((s) => s.closeAddExpense);

  return (
    <View style={{ flex: 1 }}>
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.home'),
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: t('tabs.stats'),
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="chart.bar.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: t('tabs.chat'),
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="sparkles" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tabs.profile'),
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="person.fill" color={color} />,
        }}
      />
    </Tabs>
      <AddExpenseSheet visible={addExpenseOpen} onClose={closeAddExpense} />
    </View>
  );
}
