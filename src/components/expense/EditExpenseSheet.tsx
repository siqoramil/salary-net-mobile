import { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import * as ImagePicker from 'expo-image-picker';

import { Button } from '../ui/Button';
import { DateTimePicker } from '../ui/DateTimePicker';
import { CURRENCIES, EXPENSE_CATEGORIES } from '../../constants/categories';
import { useUpdateExpense } from '../../hooks/useExpenses';
import { uploadApi } from '../../services/upload.service';
import { formatAmountInput } from '../../utils/format';
import type { Currency } from '../../types/auth';
import type { Expense, ExpenseCategoryId } from '../../types/expense';

interface Props {
  expense: Expense | null;
  visible: boolean;
  onClose: () => void;
}

export function EditExpenseSheet({ expense, visible, onClose }: Props) {
  const { t } = useTranslation();

  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<Currency>('UZS');
  const [category, setCategory] = useState<ExpenseCategoryId>('food');
  const [description, setDescription] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date());
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [receiptUri, setReceiptUri] = useState<string | null>(null);
  const [existingReceiptUrl, setExistingReceiptUrl] = useState<string | null>(null);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);

  const update = useUpdateExpense();

  useEffect(() => {
    if (expense) {
      setAmount(formatAmountInput(String(expense.amount)));
      setCurrency(expense.currency);
      setCategory(expense.category);
      setDescription(expense.description ?? '');
      setExpenseDate(new Date(expense.expenseDate));
      setExistingReceiptUrl(expense.receiptUrl);
      setReceiptUri(null);
    }
  }, [expense]);

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(t('common.permissionDenied'), t('common.allowPhotoAccess'));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      setReceiptUri(result.assets[0].uri);
      setExistingReceiptUrl(null);
    }
  };

  const submit = async () => {
    if (!expense) return;
    const num = Number(amount.replace(/[^0-9.]/g, ''));
    if (!num || num <= 0) {
      Alert.alert(t('common.error'), t('addExpense.enterValidAmount'));
      return;
    }

    let finalReceiptUrl: string | null = existingReceiptUrl;
    if (receiptUri) {
      try {
        setUploadingReceipt(true);
        finalReceiptUrl = await uploadApi.uploadReceipt(receiptUri);
      } catch {
        Alert.alert(t('addExpense.uploadFailed'), t('addExpense.uploadFailedDesc'));
        return;
      } finally {
        setUploadingReceipt(false);
      }
    }

    update.mutate(
      {
        id: expense.id,
        payload: {
          amount: num,
          currency,
          category,
          description: description.trim(),
          receiptUrl: finalReceiptUrl,
          expenseDate: expenseDate.toISOString(),
        },
      },
      {
        onSuccess: () => onClose(),
        onError: (e) => {
          const msg =
            (e as { response?: { data?: { message?: string } } }).response?.data?.message ??
            t('addExpense.saveFailed');
          Alert.alert(t('common.error'), msg);
        },
      },
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/40" onPress={onClose}>
        <View className="mt-auto" />
      </Pressable>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="absolute bottom-0 left-0 right-0"
      >
        <View className="rounded-t-[24px] bg-white dark:bg-[#1C1C1E] p-5 pb-8">
          <View className="mb-4 self-center h-1 w-10 rounded-full bg-[#D1D1D6] dark:bg-[#48484A]" />
          <Text className="text-center text-[20px] font-bold text-black dark:text-white">{t('common.edit')}</Text>

          <ScrollView keyboardShouldPersistTaps="handled" style={{ maxHeight: 480 }}>
            {/* Amount */}
            <Text className="mt-4 text-[13px] font-medium text-[#3C3C43] dark:text-[#EBEBF5]">{t('addExpense.amount')}</Text>
            <View className="mt-1 flex-row items-center rounded-[12px] bg-[#F2F2F7] dark:bg-[#2C2C2E] px-4 h-12">
              <TextInput
                value={amount}
                onChangeText={(v) => setAmount(formatAmountInput(v))}
                keyboardType="decimal-pad"
                placeholder="0"
                placeholderTextColor="#8E8E93"
                className="flex-1 text-[17px] font-semibold text-black dark:text-white"
              />
              <View className="ml-2 flex-row gap-1">
                {CURRENCIES.map((c) => (
                  <Pressable
                    key={c}
                    onPress={() => setCurrency(c)}
                    className={`rounded-full px-2 py-1 ${
                      currency === c ? 'bg-[#007AFF]' : 'bg-[#E5E5EA] dark:bg-[#38383A]'
                    }`}
                  >
                    <Text
                      className={`text-[11px] ${
                        currency === c ? 'font-semibold text-white' : 'text-black dark:text-white'
                      }`}
                    >
                      {c}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Category */}
            <Text className="mt-4 text-[13px] font-medium text-[#3C3C43] dark:text-[#EBEBF5]">{t('addExpense.category')}</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingVertical: 8, gap: 8 }}
            >
              {EXPENSE_CATEGORIES.map((c) => {
                const selected = category === c.id;
                return (
                  <Pressable
                    key={c.id}
                    onPress={() => setCategory(c.id)}
                    className="items-center"
                    style={{ width: 64 }}
                  >
                    <View
                      className="h-12 w-12 items-center justify-center rounded-full"
                      style={{
                        backgroundColor: selected ? c.color : `${c.color}33`,
                        borderWidth: selected ? 2 : 0,
                        borderColor: '#007AFF',
                      }}
                    >
                      <Text className="text-[24px]">{c.icon}</Text>
                    </View>
                    <Text className="mt-1 text-center text-[10px] text-[#3C3C43] dark:text-[#EBEBF5]" numberOfLines={1}>
                      {c.id}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* Description */}
            <Text className="mt-2 text-[13px] font-medium text-[#3C3C43] dark:text-[#EBEBF5]">{t('addExpense.description')}</Text>
            <View className="mt-1 rounded-[12px] bg-[#F2F2F7] dark:bg-[#2C2C2E] px-4 h-12 justify-center">
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder={t('addExpense.descriptionPlaceholder')}
                placeholderTextColor="#8E8E93"
                className="text-[15px] text-black dark:text-white"
              />
            </View>

            {/* Date */}
            <Text className="mt-3 text-[13px] font-medium text-[#3C3C43] dark:text-[#EBEBF5]">{t('addExpense.date')}</Text>
            <Pressable
              onPress={() => setCalendarOpen(true)}
              className="mt-1 flex-row items-center rounded-[12px] bg-[#F2F2F7] dark:bg-[#2C2C2E] px-4 h-12"
            >
              <Text className="flex-1 text-[15px] text-black dark:text-white">
                {expenseDate.toLocaleDateString([], { day: '2-digit', month: '2-digit', year: 'numeric' })}
              </Text>
              <Text className="text-[13px] text-[#8E8E93]">
                {expenseDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </Pressable>

            {/* Receipt */}
            <Text className="mt-3 text-[13px] font-medium text-[#3C3C43] dark:text-[#EBEBF5]">{t('addExpense.receipt')}</Text>
            <Pressable
              onPress={pickImage}
              className="mt-1 flex-row items-center rounded-[12px] bg-[#F2F2F7] dark:bg-[#2C2C2E] px-4 py-3"
            >
              {receiptUri || existingReceiptUrl ? (
                <>
                  <Image
                    source={{ uri: receiptUri ?? existingReceiptUrl! }}
                    style={{ width: 40, height: 40, borderRadius: 6 }}
                  />
                  <Text className="ml-3 flex-1 text-[15px] text-black dark:text-white">{t('addExpense.receiptAttached')}</Text>
                  <Pressable
                    onPress={() => { setReceiptUri(null); setExistingReceiptUrl(null); }}
                    hitSlop={10}
                  >
                    <Text className="text-[15px] text-[#007AFF]">{t('common.remove')}</Text>
                  </Pressable>
                </>
              ) : (
                <Text className="text-[15px] text-[#007AFF]">{t('addExpense.addPhoto')}</Text>
              )}
            </Pressable>
          </ScrollView>

          <View className="mt-5 flex-row gap-3">
            <Button
              title={t('common.cancel')}
              variant="secondary"
              className="flex-1"
              onPress={onClose}
            />
            <Button
              title={t('common.save')}
              className="flex-1"
              loading={update.isPending || uploadingReceipt}
              onPress={submit}
            />
          </View>
        </View>
      </KeyboardAvoidingView>

      <DateTimePicker
        visible={calendarOpen}
        value={expenseDate}
        onConfirm={(d) => { setExpenseDate(d); setCalendarOpen(false); }}
        onCancel={() => setCalendarOpen(false)}
        confirmLabel={t('common.confirm')}
        cancelLabel={t('common.cancel')}
      />
    </Modal>
  );
}
