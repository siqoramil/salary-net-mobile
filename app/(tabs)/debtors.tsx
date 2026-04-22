import { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import Animated, {
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { Ionicons } from '@expo/vector-icons';

import { BottomSheet } from '@/src/components/ui/BottomSheet';
import { MoneyText } from '@/src/components/ui/MoneyText';
import { LoadingSpinner } from '@/src/components/ui/LoadingSpinner';
import { DebtListSkeleton } from '@/src/components/ui/DebtorsScreenSkeleton';
import { DateTimePicker } from '@/src/components/ui/DateTimePicker';
import { ToastHost } from '@/src/components/ui/ToastHost';
import { useUIStore } from '@/src/stores/uiStore';
import { useThemeStore } from '@/src/stores/themeStore';
import { formatAmountInput } from '@/src/utils/format';
import {
  useDebtors,
  useCreateDebt,
  useMarkSettled,
  useDeleteDebt,
} from '@/src/hooks/useDebtors';
import type { Currency } from '@/src/services/auth/auth.types';
import type { DebtRecord, DebtType } from '@/src/services/debtor/debtor.types';

type StatusFilter = 'pending' | 'settled' | 'all';

const CURRENCIES: Currency[] = ['UZS', 'USD', 'EUR', 'RUB'];

const QUICK_AMOUNTS: Record<Currency, number[]> = {
  UZS: [50_000, 100_000, 500_000, 1_000_000],
  USD: [10, 50, 100, 500],
  EUR: [10, 50, 100, 500],
  RUB: [500, 1_000, 5_000, 10_000],
};

const TYPE_GRADIENTS: Record<DebtType, [string, string]> = {
  lent: ['#0A84FF', '#0051D5'],
  borrowed: ['#FF9F0A', '#FF7A00'],
};

function compactAmountLabel(n: number): string {
  if (n >= 1_000_000) {
    const v = n / 1_000_000;
    return `${v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)}M`;
  }
  if (n >= 1_000) {
    const v = n / 1_000;
    return `${v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)}K`;
  }
  return String(n);
}

function smartDateLabel(d: Date, todayLabel: string, yesterdayLabel: string): string {
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
  if (sameDay(d, today)) return todayLabel;
  if (sameDay(d, yesterday)) return yesterdayLabel;
  return d.toLocaleDateString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

// ─── Add Debt Modal ──────────────────────────────────────────────────────────

function TypeToggle({
  debtType,
  onChange,
  isDark,
  t,
}: {
  debtType: DebtType;
  onChange: (t: DebtType) => void;
  isDark: boolean;
  t: (k: string) => string;
}) {
  const [width, setWidth] = useState(0);
  const offset = useSharedValue(debtType === 'lent' ? 0 : 1);

  useEffect(() => {
    offset.value = withSpring(debtType === 'lent' ? 0 : 1, { damping: 18, stiffness: 200 });
  }, [debtType, offset]);

  const indicatorStyle = useAnimatedStyle(() => {
    const halfW = width > 0 ? (width - 8) / 2 : 0;
    return {
      transform: [{ translateX: offset.value * halfW }],
      width: halfW,
    };
  });

  const accent = TYPE_GRADIENTS[debtType][0];

  return (
    <View
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      style={{
        flexDirection: 'row',
        backgroundColor: isDark ? '#1C1C1E' : '#EEEEF2',
        borderRadius: 12,
        padding: 4,
        height: 44,
      }}
    >
      {width > 0 ? (
        <Animated.View
          style={[
            {
              position: 'absolute',
              top: 4,
              left: 4,
              bottom: 4,
              borderRadius: 9,
              backgroundColor: accent,
            },
            indicatorStyle,
          ]}
        />
      ) : null}
      {(['lent', 'borrowed'] as DebtType[]).map((tt) => {
        const isActive = debtType === tt;
        return (
          <Pressable
            key={tt}
            onPress={() => {
              if (Platform.OS === 'ios') Haptics.selectionAsync();
              onChange(tt);
            }}
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1,
            }}
          >
            <Text
              style={{
                fontSize: 14,
                fontWeight: '700',
                color: isActive ? '#fff' : '#8E8E93',
              }}
            >
              {tt === 'lent' ? t('debtors.typeLent') : t('debtors.typeBorrowed')}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function FieldLabel({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <Text
      style={{
        fontSize: 11,
        fontWeight: '700',
        color,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        marginBottom: 7,
        marginLeft: 4,
      }}
    >
      {children}
    </Text>
  );
}

function AddDebtModal({
  visible,
  onClose,
  initialType = 'lent',
}: {
  visible: boolean;
  onClose: () => void;
  initialType?: DebtType;
}) {
  const { t } = useTranslation();
  const showToast = useUIStore((s) => s.showToast);
  const createDebt = useCreateDebt();
  const isDark = useThemeStore((s) => s.resolved) === 'dark';

  const [debtType, setDebtType] = useState<DebtType>(initialType);
  const [name, setName] = useState('');
  const [amountText, setAmountText] = useState('');
  const [currency, setCurrency] = useState<Currency>('UZS');
  const [date, setDate] = useState(new Date());
  const [description, setDescription] = useState('');
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [nameError, setNameError] = useState('');
  const [amountError, setAmountError] = useState('');

  useEffect(() => {
    if (visible) setDebtType(initialType);
  }, [visible, initialType]);

  const accent = TYPE_GRADIENTS[debtType][0];
  const accentDeep = TYPE_GRADIENTS[debtType][1];
  const bg = isDark ? '#000000' : '#F2F2F7';
  const cardBg = isDark ? '#1C1C1E' : '#FFFFFF';
  const textColor = isDark ? '#FFFFFF' : '#000000';
  const subtleText = '#8E8E93';

  const numericAmount = useMemo(() => {
    const n = Number(amountText.replace(/[^0-9.]/g, ''));
    return Number.isFinite(n) ? n : 0;
  }, [amountText]);

  const amountFontSize = useMemo(() => {
    const len = amountText.length || 1;
    if (len <= 8) return 38;
    if (len <= 12) return 30;
    return 24;
  }, [amountText]);

  const resetForm = () => {
    setDebtType(initialType);
    setName('');
    setAmountText('');
    setCurrency('UZS');
    setDate(new Date());
    setDescription('');
    setNameError('');
    setAmountError('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleQuickAmount = (n: number) => {
    if (Platform.OS === 'ios') Haptics.selectionAsync();
    setAmountText(formatAmountInput(String(numericAmount + n)));
    if (amountError) setAmountError('');
  };

  const handleSave = async () => {
    let valid = true;
    if (!name.trim()) {
      setNameError(t('debtors.enterName'));
      valid = false;
    } else {
      setNameError('');
    }
    if (!amountText || numericAmount <= 0) {
      setAmountError(t('debtors.enterValidAmount'));
      valid = false;
    } else {
      setAmountError('');
    }
    if (!valid) {
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
      return;
    }

    try {
      await createDebt.mutateAsync({
        type: debtType,
        personName: name.trim(),
        amount: numericAmount,
        currency,
        date: date.toISOString(),
        description: description.trim(),
      });
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      showToast({ type: 'success', title: t('common.success') });
      handleClose();
    } catch (err) {
      console.error('[AddDebtModal] save failed:', err);
      showToast({ type: 'error', title: t('debtors.saveFailed') });
    }
  };

  const canSave = name.trim().length > 0 && numericAmount > 0;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: bg }} edges={['top', 'bottom']}>
          {/* Pull handle */}
          <View style={{ alignItems: 'center', paddingTop: 6, paddingBottom: 4 }}>
            <View style={{ width: 38, height: 5, borderRadius: 3, backgroundColor: isDark ? '#48484A' : '#D1D1D6' }} />
          </View>

          {/* iOS-style header — Save in top right ALWAYS visible */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 16,
              paddingTop: 6,
              paddingBottom: 14,
            }}
          >
            <Pressable
              onPress={handleClose}
              hitSlop={12}
              className="active:opacity-50"
              style={{ paddingVertical: 6, paddingRight: 12 }}
            >
              <Text style={{ fontSize: 16, fontWeight: '500', color: subtleText }}>
                {t('common.cancel')}
              </Text>
            </Pressable>

            <Text
              style={{
                flex: 1,
                textAlign: 'center',
                fontSize: 17,
                fontWeight: '700',
                color: textColor,
              }}
              numberOfLines={1}
            >
              {t('debtors.addRecord')}
            </Text>

            <Pressable
              onPress={() => void handleSave()}
              disabled={createDebt.isPending}
              hitSlop={12}
              className="items-center rounded-[18px] active:opacity-70"
              style={{
                paddingVertical: 8,
                paddingHorizontal: 18,
                backgroundColor: canSave ? accent : isDark ? '#2C2C2E' : '#E5E5EA',
                shadowColor: accentDeep,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: canSave ? 0.3 : 0,
                shadowRadius: 8,
                elevation: canSave ? 4 : 0,
                minWidth: 64,
              }}
            >
              {createDebt.isPending ? (
                <LoadingSpinner color="#fff" size="small" />
              ) : (
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: '800',
                    color: canSave ? '#fff' : subtleText,
                  }}
                >
                  {t('common.save')}
                </Text>
              )}
            </Pressable>
          </View>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{
              paddingHorizontal: 16,
              paddingTop: 4,
              paddingBottom: 32,
              gap: 18,
            }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Type toggle */}
            <Animated.View entering={FadeInUp.duration(280)}>
              <TypeToggle debtType={debtType} onChange={setDebtType} isDark={isDark} t={t} />
            </Animated.View>

            {/* AMOUNT */}
            <Animated.View entering={FadeInUp.delay(60).duration(320)}>
              <FieldLabel color={subtleText}>{t('debtors.amount')}</FieldLabel>
              <View
                style={{
                  backgroundColor: cardBg,
                  borderRadius: 16,
                  paddingHorizontal: 18,
                  paddingTop: 16,
                  paddingBottom: 14,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
                  <TextInput
                    value={amountText}
                    onChangeText={(v) => {
                      setAmountText(formatAmountInput(v));
                      if (amountError) setAmountError('');
                    }}
                    placeholder="0"
                    placeholderTextColor={isDark ? '#3A3A3C' : '#C7C7CC'}
                    style={{
                      fontSize: amountFontSize,
                      fontWeight: '800',
                      color: textColor,
                      flex: 1,
                      padding: 0,
                      letterSpacing: -0.5,
                    }}
                    keyboardType="decimal-pad"
                    returnKeyType="done"
                    selectionColor={accent}
                  />
                  <Text
                    style={{
                      fontSize: 18,
                      fontWeight: '700',
                      color: subtleText,
                      paddingBottom: 6,
                      marginLeft: 8,
                    }}
                  >
                    {currency}
                  </Text>
                </View>

                {amountError ? (
                  <Animated.Text
                    entering={FadeInDown.duration(200)}
                    style={{ fontSize: 12, color: '#FF3B30', marginTop: 4, fontWeight: '600' }}
                  >
                    {amountError}
                  </Animated.Text>
                ) : null}

                {/* Currency selector */}
                <View
                  style={{
                    flexDirection: 'row',
                    gap: 6,
                    marginTop: 14,
                    paddingTop: 12,
                    borderTopWidth: 1,
                    borderTopColor: isDark ? '#2C2C2E' : '#F2F2F7',
                  }}
                >
                  {CURRENCIES.map((c) => {
                    const active = currency === c;
                    return (
                      <Pressable
                        key={c}
                        onPress={() => {
                          if (Platform.OS === 'ios') Haptics.selectionAsync();
                          setCurrency(c);
                        }}
                        style={{
                          flex: 1,
                          paddingVertical: 8,
                          borderRadius: 10,
                          backgroundColor: active ? `${accent}18` : 'transparent',
                          alignItems: 'center',
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 13,
                            fontWeight: active ? '800' : '600',
                            color: active ? accent : subtleText,
                          }}
                        >
                          {c}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                {/* Quick amounts */}
                <View style={{ flexDirection: 'row', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
                  {QUICK_AMOUNTS[currency].map((q) => (
                    <Pressable
                      key={q}
                      onPress={() => handleQuickAmount(q)}
                      className="rounded-full active:opacity-70"
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7',
                      }}
                    >
                      <Text style={{ fontSize: 12, fontWeight: '700', color: textColor }}>
                        +{compactAmountLabel(q)}
                      </Text>
                    </Pressable>
                  ))}
                  {numericAmount > 0 ? (
                    <Pressable
                      onPress={() => {
                        if (Platform.OS === 'ios') Haptics.selectionAsync();
                        setAmountText('');
                      }}
                      className="rounded-full active:opacity-70"
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        backgroundColor: 'transparent',
                        borderWidth: 1,
                        borderColor: isDark ? '#2C2C2E' : '#E5E5EA',
                      }}
                    >
                      <Text style={{ fontSize: 12, fontWeight: '700', color: subtleText }}>
                        ↺
                      </Text>
                    </Pressable>
                  ) : null}
                </View>
              </View>
            </Animated.View>

            {/* PERSON */}
            <Animated.View entering={FadeInUp.delay(120).duration(320)}>
              <FieldLabel color={subtleText}>
                {debtType === 'lent' ? t('debtors.personNameLent') : t('debtors.personNameBorrowed')}
              </FieldLabel>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: cardBg,
                  borderRadius: 14,
                  paddingHorizontal: 14,
                  height: 56,
                }}
              >
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: name.trim() ? `${accent}1F` : (isDark ? '#2C2C2E' : '#F2F2F7'),
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ fontSize: 15, fontWeight: '800', color: name.trim() ? accent : subtleText }}>
                    {name.trim() ? name.trim().charAt(0).toUpperCase() : '?'}
                  </Text>
                </View>
                <TextInput
                  value={name}
                  onChangeText={(v) => { setName(v); if (nameError) setNameError(''); }}
                  placeholder={t('debtors.personNamePlaceholder')}
                  placeholderTextColor={subtleText}
                  style={{
                    flex: 1,
                    marginLeft: 12,
                    fontSize: 16,
                    fontWeight: '600',
                    color: textColor,
                    padding: 0,
                  }}
                  autoCapitalize="words"
                  returnKeyType="next"
                />
              </View>
              {nameError ? (
                <Animated.Text
                  entering={FadeInDown.duration(200)}
                  style={{ marginTop: 6, marginLeft: 16, fontSize: 12, color: '#FF3B30', fontWeight: '600' }}
                >
                  {nameError}
                </Animated.Text>
              ) : null}
            </Animated.View>

            {/* DATE — iOS row, matches AMOUNT/PERSON style */}
            <Animated.View entering={FadeInUp.delay(180).duration(320)}>
              <FieldLabel color={subtleText}>{t('debtors.date')}</FieldLabel>
              <Pressable
                onPress={() => {
                  if (Platform.OS === 'ios') Haptics.selectionAsync();
                  setDatePickerOpen(true);
                }}
                className="flex-row items-center rounded-[14px] px-4 active:opacity-70"
                style={{
                  backgroundColor: cardBg,
                  height: 56,
                }}
              >
                <Text style={{ flex: 1, fontSize: 16, fontWeight: '600', color: textColor }}>
                  {smartDateLabel(date, t('debtors.today'), t('debtors.yesterday'))}
                </Text>
                <Text style={{ fontSize: 14, fontWeight: '600', color: subtleText, marginRight: 8 }}>
                  {date.toLocaleDateString(undefined, { day: '2-digit', month: 'short' })}
                </Text>
                <Text style={{ fontSize: 18, color: isDark ? '#48484A' : '#C7C7CC' }}>›</Text>
              </Pressable>
            </Animated.View>

            {/* NOTE — textarea card, matches AMOUNT/PERSON style */}
            <Animated.View entering={FadeInUp.delay(240).duration(320)}>
              <FieldLabel color={subtleText}>{t('debtors.description')}</FieldLabel>
              <View
                style={{
                  backgroundColor: cardBg,
                  borderRadius: 14,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                }}
              >
                <TextInput
                  value={description}
                  onChangeText={setDescription}
                  placeholder={t('debtors.descriptionPlaceholder')}
                  placeholderTextColor={subtleText}
                  style={{
                    fontSize: 16,
                    fontWeight: '500',
                    color: textColor,
                    minHeight: 80,
                    textAlignVertical: 'top',
                    padding: 0,
                    lineHeight: 22,
                  }}
                  multiline
                  numberOfLines={4}
                  maxLength={200}
                />
              </View>
            </Animated.View>
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>

      <ToastHost />

      <DateTimePicker
        visible={datePickerOpen}
        value={date}
        dateOnly
        onConfirm={(d) => { setDate(d); setDatePickerOpen(false); }}
        onCancel={() => setDatePickerOpen(false)}
        confirmLabel={t('common.confirm')}
        cancelLabel={t('common.cancel')}
      />
    </Modal>
  );
}

// ─── Balance Hero ────────────────────────────────────────────────────────────

function BalanceHero({ records }: { records: DebtRecord[] }) {
  const { t } = useTranslation();
  const isDark = useThemeStore((s) => s.resolved) === 'dark';
  const cardBg = isDark ? '#1C1C1E' : '#FFFFFF';
  const textColor = isDark ? '#FFFFFF' : '#000000';
  const subtleText = '#8E8E93';

  // Compute totals per currency from pending records only — settled debts
  // don't contribute to the current balance the user cares about.
  const byCurrency = useMemo(() => {
    const map = new Map<string, { owedToMe: number; iOwe: number }>();
    records.forEach((r) => {
      if (r.isSettled) return;
      const entry = map.get(r.currency) ?? { owedToMe: 0, iOwe: 0 };
      if (r.type === 'lent') entry.owedToMe += r.amount;
      else entry.iOwe += r.amount;
      map.set(r.currency, entry);
    });
    const arr = Array.from(map.entries());
    arr.sort((a, b) => {
      const ta = a[1].owedToMe + a[1].iOwe;
      const tb = b[1].owedToMe + b[1].iOwe;
      return tb - ta;
    });
    return arr;
  }, [records]);

  const primary = byCurrency[0];
  const primaryCurrency = (primary?.[0] ?? 'UZS') as Currency;
  const owed = primary?.[1].owedToMe ?? 0;
  const iOwe = primary?.[1].iOwe ?? 0;
  const net = owed - iOwe;
  const netColor = net > 0 ? '#34C759' : net < 0 ? '#FF3B30' : textColor;
  const otherCount = Math.max(0, byCurrency.length - 1);

  return (
    <View
      style={{
        marginHorizontal: 16,
        marginTop: 12,
        padding: 20,
        borderRadius: 20,
        backgroundColor: cardBg,
      }}
    >
      {/* Top label */}
      <Text
        style={{
          fontSize: 11,
          fontWeight: '700',
          color: subtleText,
          letterSpacing: 0.8,
          textTransform: 'uppercase',
        }}
      >
        {t('debtors.netBalance')}
      </Text>

      {/* Big net amount */}
      <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 6 }}>
        {net !== 0 ? (
          <Text
            style={{
              fontSize: 32,
              fontWeight: '800',
              color: netColor,
              letterSpacing: -0.8,
              marginRight: 2,
            }}
          >
            {net > 0 ? '+' : '−'}
          </Text>
        ) : null}
        <MoneyText
          amount={Math.abs(net)}
          currency={primaryCurrency}
          size={32}
          weight="800"
          color={netColor}
        />
      </View>

      {otherCount > 0 ? (
        <Text style={{ fontSize: 12, color: subtleText, marginTop: 4, fontWeight: '500' }}>
          {t('debtors.plusOtherCurrencies', { count: otherCount })}
        </Text>
      ) : null}

      {/* Divider */}
      <View
        style={{
          height: 0.5,
          backgroundColor: isDark ? '#38383A' : '#EEEEF2',
          marginTop: 18,
          marginBottom: 14,
        }}
      />

      {/* Two mini metrics side by side */}
      <View style={{ flexDirection: 'row' }}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#34C759' }} />
            <Text style={{ fontSize: 11, color: subtleText, fontWeight: '700', letterSpacing: 0.4, textTransform: 'uppercase' }}>
              {t('debtors.owedToMe')}
            </Text>
          </View>
          <MoneyText
            amount={owed}
            currency={primaryCurrency}
            size={17}
            weight="700"
            color={textColor}
          />
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#FF9500' }} />
            <Text style={{ fontSize: 11, color: subtleText, fontWeight: '700', letterSpacing: 0.4, textTransform: 'uppercase' }}>
              {t('debtors.iOwe')}
            </Text>
          </View>
          <MoneyText
            amount={iOwe}
            currency={primaryCurrency}
            size={17}
            weight="700"
            color={textColor}
          />
        </View>
      </View>
    </View>
  );
}

// ─── Segmented tabs (Lent / Borrowed) ────────────────────────────────────────

function SegmentedTabs({
  activeType,
  onChange,
  lentCount,
  borrowedCount,
}: {
  activeType: DebtType;
  onChange: (t: DebtType) => void;
  lentCount: number;
  borrowedCount: number;
}) {
  const { t } = useTranslation();
  const isDark = useThemeStore((s) => s.resolved) === 'dark';
  const trackBg = isDark ? '#1C1C1E' : '#EEEEF2';
  const thumbBg = isDark ? '#3A3A3C' : '#FFFFFF';
  const [width, setWidth] = useState(0);
  const offset = useSharedValue(activeType === 'lent' ? 0 : 1);

  useEffect(() => {
    offset.value = withSpring(activeType === 'lent' ? 0 : 1, { damping: 22, stiffness: 220 });
  }, [activeType, offset]);

  const indicatorStyle = useAnimatedStyle(() => {
    const halfW = width > 0 ? (width - 8) / 2 : 0;
    return {
      transform: [{ translateX: offset.value * halfW }],
      width: halfW,
    };
  });

  return (
    <View
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      style={{
        marginHorizontal: 16,
        marginTop: 14,
        flexDirection: 'row',
        backgroundColor: trackBg,
        borderRadius: 11,
        padding: 4,
        height: 40,
      }}
    >
      {width > 0 ? (
        <Animated.View
          style={[
            {
              position: 'absolute',
              top: 4,
              left: 4,
              bottom: 4,
              borderRadius: 8,
              backgroundColor: thumbBg,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.08,
              shadowRadius: 4,
              elevation: 2,
            },
            indicatorStyle,
          ]}
        />
      ) : null}
      {(['lent', 'borrowed'] as DebtType[]).map((tt) => {
        const isActive = activeType === tt;
        const count = tt === 'lent' ? lentCount : borrowedCount;
        const activeColor = isDark ? '#FFFFFF' : '#000000';
        return (
          <Pressable
            key={tt}
            onPress={() => {
              if (Platform.OS === 'ios') Haptics.selectionAsync();
              onChange(tt);
            }}
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              zIndex: 1,
            }}
          >
            <Text
              style={{
                fontSize: 14,
                fontWeight: '600',
                color: isActive ? activeColor : '#8E8E93',
              }}
            >
              {tt === 'lent' ? t('debtors.tabLent') : t('debtors.tabBorrowed')}
            </Text>
            <Text
              style={{
                fontSize: 12,
                fontWeight: '700',
                color: isActive ? '#8E8E93' : '#C7C7CC',
                fontVariant: ['tabular-nums'],
              }}
            >
              {count}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// ─── Filter pills (Pending / Settled / All) ─────────────────────────────────

function FilterPills({
  value,
  onChange,
  counts,
}: {
  value: StatusFilter;
  onChange: (v: StatusFilter) => void;
  counts: { pending: number; settled: number; all: number };
}) {
  const { t } = useTranslation();
  const isDark = useThemeStore((s) => s.resolved) === 'dark';

  const pills: { key: StatusFilter; labelKey: string }[] = [
    { key: 'pending', labelKey: 'debtors.filterPending' },
    { key: 'settled', labelKey: 'debtors.filterSettled' },
    { key: 'all', labelKey: 'debtors.filterAll' },
  ];

  return (
    <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginTop: 14 }}>
      {pills.map((f) => {
        const active = value === f.key;
        const count = counts[f.key];
        const bg = active ? '#007AFF' : isDark ? '#1C1C1E' : '#FFFFFF';
        const textColor = active ? '#FFFFFF' : '#8E8E93';
        const countColor = active ? 'rgba(255,255,255,0.7)' : isDark ? '#48484A' : '#C7C7CC';
        return (
          <Pressable
            key={f.key}
            onPress={() => {
              if (Platform.OS === 'ios') Haptics.selectionAsync();
              onChange(f.key);
            }}
            className="flex-row items-center rounded-full active:opacity-75"
            style={{
              paddingHorizontal: 14,
              paddingVertical: 7,
              backgroundColor: bg,
            }}
          >
            <Text
              style={{
                fontSize: 13,
                fontWeight: active ? '700' : '600',
                color: textColor,
                marginRight: 5,
              }}
            >
              {t(f.labelKey)}
            </Text>
            <Text style={{ fontSize: 12, fontWeight: '700', color: countColor, fontVariant: ['tabular-nums'] }}>
              {count}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// ─── Debt row (list cell) ────────────────────────────────────────────────────

function DebtRow({
  record,
  onPress,
  isLast,
}: {
  record: DebtRecord;
  onPress: () => void;
  isLast: boolean;
}) {
  const { t, i18n } = useTranslation();
  const isDark = useThemeStore((s) => s.resolved) === 'dark';
  const textColor = isDark ? '#FFFFFF' : '#000000';
  const subtleText = '#8E8E93';

  const isLent = record.type === 'lent';
  const amountColor = record.isSettled ? '#34C759' : isLent ? '#007AFF' : '#FF9500';
  const avatarColor = record.isSettled ? '#34C759' : isLent ? '#007AFF' : '#FF9500';
  const avatarBg = record.isSettled
    ? 'rgba(52,199,89,0.12)'
    : isLent
      ? 'rgba(0,122,255,0.12)'
      : 'rgba(255,149,10,0.12)';

  const dateLabel = smartDateLabel(
    new Date(record.date),
    t('debtors.today'),
    t('debtors.yesterday'),
  );

  const initial = record.personName.trim().charAt(0).toUpperCase() || '?';

  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center px-4 active:bg-[#F7F7FA] dark:active:bg-[#2C2C2E]"
      style={{ paddingVertical: 12 }}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: avatarBg,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 12,
        }}
      >
        <Text style={{ fontSize: 16, fontWeight: '700', color: avatarColor }}>
          {initial}
        </Text>
        {record.isSettled ? (
          <View
            style={{
              position: 'absolute',
              bottom: -2,
              right: -2,
              width: 16,
              height: 16,
              borderRadius: 8,
              backgroundColor: '#34C759',
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 2,
              borderColor: isDark ? '#1C1C1E' : '#FFFFFF',
            }}
          >
            <Text style={{ fontSize: 8, color: '#FFFFFF', fontWeight: '900', lineHeight: 10 }}>
              ✓
            </Text>
          </View>
        ) : null}
      </View>

      <View style={{ flex: 1, marginRight: 10 }}>
        <Text style={{ fontSize: 15, fontWeight: '600', color: textColor }} numberOfLines={1}>
          {record.personName}
        </Text>
        <Text style={{ fontSize: 12, color: subtleText, marginTop: 2 }} numberOfLines={1}>
          {dateLabel}
          {record.description ? ` · ${record.description}` : ''}
        </Text>
      </View>

      <MoneyText
        amount={record.amount}
        currency={record.currency}
        size={15}
        weight="700"
        color={amountColor}
        prefix={record.isSettled ? '' : isLent ? '+' : '−'}
      />
      {!isLast ? null : null}
    </Pressable>
  );
}

// ─── Debt actions bottom sheet ──────────────────────────────────────────────

function DebtActionSheet({
  record,
  onClose,
  onSettle,
  onDelete,
}: {
  record: DebtRecord | null;
  onClose: () => void;
  onSettle: () => void;
  onDelete: () => void;
}) {
  const { t, i18n } = useTranslation();
  const isDark = useThemeStore((s) => s.resolved) === 'dark';
  const textColor = isDark ? '#FFFFFF' : '#000000';
  const subtleText = '#8E8E93';

  if (!record) return <BottomSheet visible={false} onClose={onClose}><View /></BottomSheet>;

  const isLent = record.type === 'lent';
  const accent = record.isSettled ? '#34C759' : isLent ? '#007AFF' : '#FF9500';
  const accentBg = record.isSettled
    ? 'rgba(52,199,89,0.14)'
    : isLent
      ? 'rgba(0,122,255,0.14)'
      : 'rgba(255,149,10,0.14)';
  const fullDate = new Date(record.date).toLocaleDateString(i18n.language, {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  return (
    <BottomSheet visible={record !== null} onClose={onClose}>
      <View className="mb-4 self-center h-1 w-10 rounded-full bg-[#D1D1D6] dark:bg-[#48484A]" />

      {/* Person + amount summary */}
      <View style={{ alignItems: 'center', marginBottom: 18 }}>
        <View
          style={{
            width: 60,
            height: 60,
            borderRadius: 30,
            backgroundColor: accentBg,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 12,
          }}
        >
          <Text style={{ fontSize: 24, fontWeight: '700', color: accent }}>
            {record.personName.trim().charAt(0).toUpperCase() || '?'}
          </Text>
        </View>
        <Text style={{ fontSize: 17, fontWeight: '700', color: textColor }}>
          {record.personName}
        </Text>
        <View style={{ marginTop: 6 }}>
          <MoneyText
            amount={record.amount}
            currency={record.currency}
            size={26}
            weight="800"
            color={accent}
            prefix={record.isSettled ? '' : isLent ? '+' : '−'}
          />
        </View>
        <Text style={{ fontSize: 12, color: subtleText, marginTop: 4, fontWeight: '500' }}>
          {fullDate}
          {record.isSettled ? ` · ${t('debtors.settled')}` : ''}
        </Text>
        {record.description ? (
          <Text
            style={{
              fontSize: 14,
              color: subtleText,
              marginTop: 12,
              textAlign: 'center',
              lineHeight: 19,
              paddingHorizontal: 8,
            }}
          >
            {record.description}
          </Text>
        ) : null}
      </View>

      {/* Actions */}
      <View style={{ gap: 10 }}>
        {!record.isSettled ? (
          <Pressable
            onPress={onSettle}
            className="h-[54px] items-center justify-center rounded-[14px] active:opacity-85"
            style={{
              backgroundColor: '#34C759',
              shadowColor: '#34C759',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.25,
              shadowRadius: 12,
              elevation: 6,
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#FFFFFF', letterSpacing: 0.1 }}>
              {t('debtors.markSettled')}
            </Text>
          </Pressable>
        ) : null}

        <Pressable
          onPress={onDelete}
          className="h-[54px] items-center justify-center rounded-[14px] active:opacity-60"
          style={{ borderWidth: 1.5, borderColor: '#FF3B30' }}
        >
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#FF3B30' }}>
            {t('common.delete')}
          </Text>
        </Pressable>

        <Pressable
          onPress={onClose}
          className="h-[48px] items-center justify-center active:opacity-50"
        >
          <Text style={{ fontSize: 15, fontWeight: '500', color: subtleText }}>
            {t('common.cancel')}
          </Text>
        </Pressable>
      </View>
    </BottomSheet>
  );
}

// ─── Empty state ────────────────────────────────────────────────────────────

function EmptyState({
  type,
  statusFilter,
}: {
  type: DebtType;
  statusFilter: StatusFilter;
}) {
  const { t } = useTranslation();
  const isDark = useThemeStore((s) => s.resolved) === 'dark';
  const textColor = isDark ? '#FFFFFF' : '#000000';

  const isLent = type === 'lent';
  const title =
    statusFilter === 'settled'
      ? t('debtors.noSettled')
      : isLent
        ? t('debtors.noRecordsLent')
        : t('debtors.noRecordsBorrowed');
  const desc =
    statusFilter === 'settled'
      ? undefined
      : isLent
        ? t('debtors.noRecordsLentDesc')
        : t('debtors.noRecordsBorrowedDesc');

  return (
    <View style={{ alignItems: 'center', paddingHorizontal: 40, paddingTop: 60 }}>
      <View
        style={{
          width: 72,
          height: 72,
          borderRadius: 36,
          backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 14,
        }}
      >
        <Text style={{ fontSize: 34 }}>{isLent ? '💸' : '🤝'}</Text>
      </View>
      <Text style={{ fontSize: 17, fontWeight: '700', color: textColor, textAlign: 'center' }}>
        {title}
      </Text>
      {desc ? (
        <Text
          style={{
            marginTop: 8,
            fontSize: 14,
            color: '#8E8E93',
            textAlign: 'center',
            lineHeight: 20,
            maxWidth: 280,
          }}
        >
          {desc}
        </Text>
      ) : null}
    </View>
  );
}

// ─── Main Screen ────────────────────────────────────────────────────────────

export default function DebtorsScreen() {
  const { t } = useTranslation();
  const isDark = useThemeStore((s) => s.resolved) === 'dark';
  const showConfirm = useUIStore((s) => s.showConfirm);
  const showToast = useUIStore((s) => s.showToast);
  const markSettled = useMarkSettled();
  const deleteDebt = useDeleteDebt();

  const [activeType, setActiveType] = useState<DebtType>('lent');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending');
  const [addOpen, setAddOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<DebtRecord | null>(null);

  // Single query for everything — cheap to derive counts + filtered list
  // from one array, avoids a cascade of separate useDebtors() calls.
  const { data: allDebts, isLoading } = useDebtors({});
  const all = allDebts ?? [];

  const lent = useMemo(() => all.filter((r) => r.type === 'lent'), [all]);
  const borrowed = useMemo(() => all.filter((r) => r.type === 'borrowed'), [all]);
  const typeRecords = activeType === 'lent' ? lent : borrowed;
  const pendingList = useMemo(() => typeRecords.filter((r) => !r.isSettled), [typeRecords]);
  const settledList = useMemo(() => typeRecords.filter((r) => r.isSettled), [typeRecords]);

  const listRecords =
    statusFilter === 'pending' ? pendingList : statusFilter === 'settled' ? settledList : typeRecords;

  const sortedRecords = useMemo(
    () => [...listRecords].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [listRecords],
  );

  const bg = isDark ? '#000000' : '#F2F2F7';
  const textColor = isDark ? '#FFFFFF' : '#000000';
  const cardBg = isDark ? '#1C1C1E' : '#FFFFFF';

  const handleSettle = () => {
    if (!selectedRecord) return;
    const record = selectedRecord;
    setSelectedRecord(null);
    showConfirm({
      title: t('debtors.confirmSettle'),
      message: t('debtors.confirmSettleDesc'),
      confirmLabel: t('common.confirm'),
      cancelLabel: t('common.cancel'),
      onConfirm: async () => {
        try {
          await markSettled.mutateAsync(record.id);
        } catch {
          showToast({ type: 'error', title: t('debtors.saveFailed') });
        }
      },
    });
  };

  const handleDelete = () => {
    if (!selectedRecord) return;
    const record = selectedRecord;
    setSelectedRecord(null);
    showConfirm({
      variant: 'destructive',
      title: t('debtors.confirmDelete'),
      message: t('debtors.confirmDeleteDesc'),
      confirmLabel: t('common.delete'),
      cancelLabel: t('common.cancel'),
      onConfirm: async () => {
        try {
          await deleteDebt.mutateAsync(record.id);
        } catch {
          showToast({ type: 'error', title: t('debtors.deleteFailed') });
        }
      },
    });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }} edges={['top']}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View
          className="flex-row items-center"
          style={{ paddingHorizontal: 20, paddingTop: 8 }}
        >
          <Text
            style={{
              flex: 1,
              fontSize: 32,
              fontWeight: '800',
              color: textColor,
              letterSpacing: -0.5,
            }}
          >
            {t('debtors.title')}
          </Text>
          <Pressable
            onPress={() => {
              if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setAddOpen(true);
            }}
            className="items-center justify-center rounded-full active:opacity-85"
            style={{
              width: 38,
              height: 38,
              backgroundColor: '#007AFF',
              shadowColor: '#007AFF',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.28,
              shadowRadius: 10,
              elevation: 6,
            }}
          >
            <Ionicons name="add" size={24} color="#FFFFFF" />
          </Pressable>
        </View>

        {/* Balance hero */}
        <Animated.View entering={FadeInUp.duration(260)}>
          <BalanceHero records={all} />
        </Animated.View>

        {/* Segmented tabs */}
        <SegmentedTabs
          activeType={activeType}
          onChange={setActiveType}
          lentCount={lent.length}
          borrowedCount={borrowed.length}
        />

        {/* Status filter pills */}
        <FilterPills
          value={statusFilter}
          onChange={setStatusFilter}
          counts={{
            pending: pendingList.length,
            settled: settledList.length,
            all: typeRecords.length,
          }}
        />

        {/* List */}
        {isLoading ? (
          <View style={{ marginTop: 14 }}>
            <DebtListSkeleton />
          </View>
        ) : sortedRecords.length === 0 ? (
          <EmptyState type={activeType} statusFilter={statusFilter} />
        ) : (
          <View
            style={{
              marginHorizontal: 16,
              marginTop: 14,
              borderRadius: 16,
              backgroundColor: cardBg,
              overflow: 'hidden',
            }}
          >
            {sortedRecords.map((record, idx) => (
              <View key={record.id}>
                {idx > 0 ? (
                  <View
                    style={{
                      height: 0.5,
                      backgroundColor: isDark ? '#38383A' : '#EEEEF2',
                      marginLeft: 68,
                    }}
                  />
                ) : null}
                <DebtRow
                  record={record}
                  onPress={() => setSelectedRecord(record)}
                  isLast={idx === sortedRecords.length - 1}
                />
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <DebtActionSheet
        record={selectedRecord}
        onClose={() => setSelectedRecord(null)}
        onSettle={handleSettle}
        onDelete={handleDelete}
      />

      <AddDebtModal
        visible={addOpen}
        onClose={() => setAddOpen(false)}
        initialType={activeType}
      />
    </SafeAreaView>
  );
}
