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
              style={({ pressed }) => ({
                paddingVertical: 6,
                paddingRight: 12,
                opacity: pressed ? 0.5 : 1,
              })}
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
              style={({ pressed }) => ({
                paddingVertical: 8,
                paddingHorizontal: 18,
                borderRadius: 18,
                backgroundColor: canSave ? accent : (isDark ? '#2C2C2E' : '#E5E5EA'),
                opacity: pressed ? 0.7 : 1,
                shadowColor: accentDeep,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: canSave ? 0.3 : 0,
                shadowRadius: 8,
                elevation: canSave ? 4 : 0,
                minWidth: 64,
                alignItems: 'center',
              })}
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
                      style={({ pressed }) => ({
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 999,
                        backgroundColor: pressed
                          ? (isDark ? '#3A3A3C' : '#E5E5EA')
                          : (isDark ? '#2C2C2E' : '#F2F2F7'),
                      })}
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
                      style={({ pressed }) => ({
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 999,
                        backgroundColor: pressed
                          ? (isDark ? '#3A3A3C' : '#E5E5EA')
                          : 'transparent',
                        borderWidth: 1,
                        borderColor: isDark ? '#2C2C2E' : '#E5E5EA',
                      })}
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
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: cardBg,
                  borderRadius: 14,
                  paddingHorizontal: 16,
                  height: 56,
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <Text style={{ flex: 1, fontSize: 16, fontWeight: '600', color: textColor }}>
                  {smartDateLabel(date, 'Today', 'Yesterday')}
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

// ─── Debt Card ───────────────────────────────────────────────────────────────

function DebtCard({ record }: { record: DebtRecord }) {
  const { t, i18n } = useTranslation();
  const showConfirm = useUIStore((s) => s.showConfirm);
  const showToast = useUIStore((s) => s.showToast);
  const markSettled = useMarkSettled();
  const deleteDebt = useDeleteDebt();
  const isDark = useThemeStore((s) => s.resolved) === 'dark';

  const isLent = record.type === 'lent';
  const accent = isLent ? '#007AFF' : '#FF9500';
  const cardBg = isDark ? '#1C1C1E' : '#FFFFFF';
  const textColor = isDark ? '#FFFFFF' : '#000000';

  const recordDate = new Date(record.date);
  const formattedDate = recordDate.toLocaleDateString(i18n.language, { day: '2-digit', month: '2-digit', year: 'numeric' });
  const formattedTime = recordDate.toLocaleTimeString(i18n.language, { hour: '2-digit', minute: '2-digit' });

  const handleSettle = () => {
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
    showConfirm({
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
    <View
      style={{
        borderRadius: 20,
        backgroundColor: cardBg,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
      }}
    >
      {/* Left accent stripe */}
      <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, backgroundColor: record.isSettled ? '#34C759' : accent }} />

      <View style={{ padding: 16, paddingLeft: 20 }}>
        {/* Top row: avatar + name/date + badge */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: record.isSettled ? '#34C75922' : `${accent}1A`, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: record.isSettled ? '#34C759' : accent }}>
              {record.personName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: textColor }} numberOfLines={1}>
              {record.personName}
            </Text>
            <Text style={{ fontSize: 12, color: '#8E8E93', marginTop: 2 }}>
              {formattedDate} · {formattedTime}
            </Text>
          </View>
          <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: record.isSettled ? '#34C75918' : `${accent}18` }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: record.isSettled ? '#34C759' : accent }}>
              {record.isSettled ? t('debtors.settled') : t('debtors.pending')}
            </Text>
          </View>
        </View>

        {/* Amount */}
        <View style={{ marginTop: 12 }}>
          <MoneyText
            amount={record.amount}
            currency={record.currency as Currency}
            size={24}
            weight="800"
            color={record.isSettled ? '#34C759' : accent}
          />
        </View>

        {/* Description */}
        {record.description ? (
          <Text style={{ marginTop: 6, fontSize: 13, color: '#8E8E93', lineHeight: 18 }} numberOfLines={2}>
            {record.description}
          </Text>
        ) : null}

        {/* Actions */}
        {!record.isSettled ? (
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 14 }}>
            <Pressable
              onPress={handleSettle}
              style={{ flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 12, backgroundColor: '#34C75915' }}
            >
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#34C759' }}>
                ✓ {t('debtors.markSettled')}
              </Text>
            </Pressable>
            <Pressable
              onPress={handleDelete}
              style={{ paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, backgroundColor: '#FF3B3012' }}
            >
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#FF3B30' }}>{t('common.delete')}</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable
            onPress={handleDelete}
            style={{ marginTop: 12, alignItems: 'center', paddingVertical: 9, borderRadius: 12, backgroundColor: '#FF3B3012' }}
          >
            <Text style={{ fontSize: 13, fontWeight: '600', color: '#FF3B30' }}>{t('common.delete')}</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

// ─── Tab content ─────────────────────────────────────────────────────────────

function DebtList({
  debtType,
  statusFilter,
  onAdd,
}: {
  debtType: DebtType;
  statusFilter: StatusFilter;
  onAdd: () => void;
}) {
  const { t } = useTranslation();
  const isDark = useThemeStore((s) => s.resolved) === 'dark';
  const isLent = debtType === 'lent';
  const accent = isLent ? '#007AFF' : '#FF9500';

  const isSettled = statusFilter === 'all' ? undefined : statusFilter === 'settled';

  const { data, isLoading } = useDebtors({ type: debtType, isSettled });
  const records = data ?? [];

  const emptyLabel = statusFilter === 'settled'
    ? t('debtors.noSettled')
    : isLent ? t('debtors.noRecordsLent') : t('debtors.noRecordsBorrowed');

  const emptyDesc = statusFilter !== 'settled'
    ? (isLent ? t('debtors.noRecordsLentDesc') : t('debtors.noRecordsBorrowedDesc'))
    : undefined;

  return (
    <>
      {/* List */}
      {isLoading ? (
        <DebtListSkeleton />
      ) : records.length === 0 ? (
        <Animated.View
          entering={FadeInDown.duration(320)}
          style={{
            marginHorizontal: 20,
            marginTop: 16,
            alignItems: 'center',
            borderRadius: 22,
            backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
            paddingHorizontal: 32,
            paddingVertical: 48,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 10,
            elevation: 2,
          }}
        >
          <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <Text style={{ fontSize: 36 }}>{isLent ? '💸' : '🤝'}</Text>
          </View>
          <Text style={{ fontSize: 17, fontWeight: '700', color: isDark ? '#FFFFFF' : '#000000', textAlign: 'center' }}>
            {emptyLabel}
          </Text>
          {emptyDesc ? (
            <Text style={{ marginTop: 8, fontSize: 14, color: '#8E8E93', textAlign: 'center', lineHeight: 20 }}>
              {emptyDesc}
            </Text>
          ) : null}
          <Pressable
            onPress={onAdd}
            style={{ marginTop: 24, paddingHorizontal: 28, paddingVertical: 12, borderRadius: 999, backgroundColor: accent }}
          >
            <Text style={{ fontSize: 15, fontWeight: '700', color: '#fff' }}>+ {t('debtors.addRecord')}</Text>
          </Pressable>
        </Animated.View>
      ) : (
        <View style={{ marginHorizontal: 20, marginTop: 16, gap: 10 }}>
          {records.map((record, index) => (
            <Animated.View key={record.id} entering={FadeInDown.delay(index * 40).duration(300)}>
              <DebtCard record={record} />
            </Animated.View>
          ))}
          {/* Add more button */}
          <Pressable
            onPress={onAdd}
            style={{
              marginTop: 4,
              alignItems: 'center',
              paddingVertical: 14,
              borderRadius: 18,
              borderWidth: 1.5,
              borderColor: isDark ? '#38383A' : '#E5E5EA',
              borderStyle: 'dashed',
            }}
          >
            <Text style={{ fontSize: 15, fontWeight: '600', color: accent }}>+ {t('debtors.addRecord')}</Text>
          </Pressable>
        </View>
      )}
    </>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

function OverviewStats({
  activeTab,
  onTabChange,
}: {
  activeTab: DebtType;
  onTabChange: (t: DebtType) => void;
}) {
  const { t } = useTranslation();
  const isDark = useThemeStore((s) => s.resolved) === 'dark';
  const cardBg = isDark ? '#1C1C1E' : '#FFFFFF';
  const textColor = isDark ? '#FFFFFF' : '#000000';

  const { data: lentData } = useDebtors({ type: 'lent', isSettled: false });
  const { data: borrowedData } = useDebtors({ type: 'borrowed', isSettled: false });

  const calcTotals = (records: DebtRecord[] | undefined) => {
    const totals = (records ?? []).reduce<Record<string, number>>((acc, r) => {
      acc[r.currency] = (acc[r.currency] ?? 0) + r.amount;
      return acc;
    }, {});
    return Object.entries(totals);
  };

  const lentTotals = calcTotals(lentData);
  const borrowedTotals = calcTotals(borrowedData);

  const card = (
    type: DebtType,
    totals: Array<[string, number]>,
    accent: string,
    icon: string,
    label: string,
  ) => {
    const isActive = activeTab === type;
    return (
      <Pressable
        onPress={() => onTabChange(type)}
        style={({ pressed }) => ({
          flex: 1,
          backgroundColor: isActive ? accent : cardBg,
          borderRadius: 18,
          padding: 14,
          opacity: pressed ? 0.85 : 1,
        })}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: isActive ? 'rgba(255,255,255,0.22)' : `${accent}18`,
            }}
          >
            <Text style={{ fontSize: 16 }}>{icon}</Text>
          </View>
          <Text
            style={{
              marginLeft: 8,
              fontSize: 11,
              fontWeight: '800',
              color: isActive ? 'rgba(255,255,255,0.85)' : '#8E8E93',
              textTransform: 'uppercase',
              letterSpacing: 0.6,
            }}
          >
            {label}
          </Text>
        </View>
        {totals.length === 0 ? (
          <Text
            style={{
              fontSize: 22,
              fontWeight: '800',
              color: isActive ? '#fff' : textColor,
              letterSpacing: -0.5,
            }}
          >
            0
          </Text>
        ) : (
          totals.slice(0, 2).map(([cur, amt], i) => (
            <MoneyText
              key={cur}
              amount={amt}
              currency={cur as Currency}
              size={i === 0 ? 22 : 14}
              weight="800"
              color={isActive ? '#fff' : textColor}
              compact
            />
          ))
        )}
        {totals.length > 2 ? (
          <Text
            style={{
              marginTop: 2,
              fontSize: 11,
              color: isActive ? 'rgba(255,255,255,0.7)' : '#8E8E93',
              fontWeight: '600',
            }}
          >
            +{totals.length - 2} more
          </Text>
        ) : null}
      </Pressable>
    );
  };

  return (
    <View style={{ flexDirection: 'row', gap: 10, marginHorizontal: 20, marginTop: 14 }}>
      {card('lent', lentTotals, '#007AFF', '💸', t('debtors.tabLent'))}
      {card('borrowed', borrowedTotals, '#FF9500', '🤝', t('debtors.tabBorrowed'))}
    </View>
  );
}

export default function DebtorsScreen() {
  const { t } = useTranslation();
  const isDark = useThemeStore((s) => s.resolved) === 'dark';
  const [activeTab, setActiveTab] = useState<DebtType>('lent');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending');
  const [addModalOpen, setAddModalOpen] = useState(false);

  const bg = isDark ? '#000000' : '#F2F2F7';
  const textColor = isDark ? '#FFFFFF' : '#000000';
  const subtleText = '#8E8E93';
  const accent = activeTab === 'lent' ? '#007AFF' : '#FF9500';

  const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
    { key: 'pending', label: t('debtors.filterPending') },
    { key: 'settled', label: t('debtors.filterSettled') },
    { key: 'all', label: t('debtors.filterAll') },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }} edges={['top']}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 20,
          paddingTop: 8,
          paddingBottom: 4,
        }}
      >
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 30, fontWeight: '800', color: textColor, letterSpacing: -0.5 }}>
            {t('debtors.title')}
          </Text>
          <Text style={{ fontSize: 13, color: subtleText, marginTop: 2, fontWeight: '500' }}>
            {t('debtors.subtitle')}
          </Text>
        </View>
        <Pressable
          onPress={() => setAddModalOpen(true)}
          style={({ pressed }) => ({
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: accent,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: accent,
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.35,
            shadowRadius: 10,
            elevation: 6,
            opacity: pressed ? 0.85 : 1,
          })}
        >
          <Text style={{ fontSize: 24, color: '#fff', lineHeight: 26, fontWeight: '300' }}>
            +
          </Text>
        </Pressable>
      </View>

      {/* Overview: two side-by-side cards */}
      <OverviewStats activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Status filter pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 14, gap: 8 }}
        style={{ flexGrow: 0 }}
      >
        {STATUS_FILTERS.map((f) => {
          const isActive = statusFilter === f.key;
          return (
            <Pressable
              key={f.key}
              onPress={() => setStatusFilter(f.key)}
              style={({ pressed }) => ({
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 999,
                backgroundColor: isActive ? accent : isDark ? '#1C1C1E' : '#FFFFFF',
                opacity: pressed ? 0.8 : 1,
              })}
            >
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: isActive ? '800' : '600',
                  color: isActive ? '#fff' : subtleText,
                }}
              >
                {f.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
      >
        <DebtList
          debtType={activeTab}
          statusFilter={statusFilter}
          onAdd={() => setAddModalOpen(true)}
        />
      </ScrollView>

      <AddDebtModal
        visible={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        initialType={activeTab}
      />
    </SafeAreaView>
  );
}
