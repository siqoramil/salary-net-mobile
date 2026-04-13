import { useCallback, useMemo, useState } from 'react';
import { Modal, Pressable, Text, TextInput, View, useColorScheme } from 'react-native';

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

interface Props {
  visible: boolean;
  value: Date;
  onConfirm: (date: Date) => void;
  onCancel: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number) {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1; // Monday = 0
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function DateTimePicker({
  visible,
  value,
  onConfirm,
  onCancel,
  confirmLabel = 'Done',
  cancelLabel = 'Cancel',
}: Props) {
  const isDark = useColorScheme() === 'dark';
  const [viewYear, setViewYear] = useState(value.getFullYear());
  const [viewMonth, setViewMonth] = useState(value.getMonth());
  const [selectedDay, setSelectedDay] = useState(value.getDate());
  const [hour, setHour] = useState(String(value.getHours()).padStart(2, '0'));
  const [minute, setMinute] = useState(String(value.getMinutes()).padStart(2, '0'));

  // Reset state when modal opens with new value
  const resetToValue = useCallback((d: Date) => {
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
    setSelectedDay(d.getDate());
    setHour(String(d.getHours()).padStart(2, '0'));
    setMinute(String(d.getMinutes()).padStart(2, '0'));
  }, []);

  // When visible changes, sync state
  useMemo(() => {
    if (visible) resetToValue(value);
  }, [visible, value, resetToValue]);

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfWeek(viewYear, viewMonth);

  const today = new Date();
  const isToday = (day: number) =>
    viewYear === today.getFullYear() &&
    viewMonth === today.getMonth() &&
    day === today.getDate();

  const isSelected = (day: number) =>
    day === selectedDay &&
    viewYear === value.getFullYear() &&
    viewMonth === value.getMonth();

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const handleConfirm = () => {
    const h = Math.min(23, Math.max(0, parseInt(hour, 10) || 0));
    const m = Math.min(59, Math.max(0, parseInt(minute, 10) || 0));
    const result = new Date(viewYear, viewMonth, selectedDay, h, m);
    onConfirm(result);
  };

  const handleHour = (v: string) => {
    const clean = v.replace(/\D/g, '').slice(0, 2);
    setHour(clean);
  };

  const handleMinute = (v: string) => {
    const clean = v.replace(/\D/g, '').slice(0, 2);
    setMinute(clean);
  };

  const bg = isDark ? '#1C1C1E' : '#FFFFFF';
  const textColor = isDark ? '#FFFFFF' : '#000000';
  const mutedColor = '#8E8E93';
  const cellBg = isDark ? '#2C2C2E' : '#F2F2F7';

  // Build calendar grid
  const cells: Array<number | null> = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable
        className="flex-1 items-center justify-center bg-black/50"
        onPress={onCancel}
      >
        <Pressable
          onPress={() => {}}
          style={{
            width: 320,
            backgroundColor: bg,
            borderRadius: 20,
            overflow: 'hidden',
          }}
        >
          {/* Month navigation */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 }}>
            <Pressable onPress={prevMonth} hitSlop={12} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: cellBg, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 18, color: textColor }}>{'<'}</Text>
            </Pressable>
            <Text style={{ fontSize: 16, fontWeight: '700', color: textColor }}>
              {MONTH_NAMES[viewMonth]} {viewYear}
            </Text>
            <Pressable onPress={nextMonth} hitSlop={12} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: cellBg, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 18, color: textColor }}>{'>'}</Text>
            </Pressable>
          </View>

          {/* Weekday headers */}
          <View style={{ flexDirection: 'row', paddingHorizontal: 12, marginBottom: 4 }}>
            {WEEKDAYS.map((wd) => (
              <View key={wd} style={{ flex: 1, alignItems: 'center' }}>
                <Text style={{ fontSize: 12, fontWeight: '600', color: mutedColor }}>{wd}</Text>
              </View>
            ))}
          </View>

          {/* Calendar grid */}
          <View style={{ paddingHorizontal: 12, paddingBottom: 12 }}>
            {Array.from({ length: cells.length / 7 }).map((_, rowIdx) => (
              <View key={rowIdx} style={{ flexDirection: 'row', marginTop: 4 }}>
                {cells.slice(rowIdx * 7, rowIdx * 7 + 7).map((day, colIdx) => {
                  const selected = day !== null && isSelected(day);
                  const todayMark = day !== null && isToday(day) && !selected;
                  return (
                    <View key={colIdx} style={{ flex: 1, alignItems: 'center', paddingVertical: 2 }}>
                      {day !== null ? (
                        <Pressable
                          onPress={() => setSelectedDay(day)}
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 18,
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: selected ? '#007AFF' : 'transparent',
                            borderWidth: todayMark ? 1.5 : 0,
                            borderColor: '#007AFF',
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 15,
                              fontWeight: selected || todayMark ? '700' : '400',
                              color: selected ? '#fff' : textColor,
                            }}
                          >
                            {day}
                          </Text>
                        </Pressable>
                      ) : (
                        <View style={{ width: 36, height: 36 }} />
                      )}
                    </View>
                  );
                })}
              </View>
            ))}
          </View>

          {/* Time picker */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingBottom: 16, gap: 4 }}>
            <Text style={{ fontSize: 13, color: mutedColor, marginRight: 8 }}>Time</Text>
            <View style={{ backgroundColor: cellBg, borderRadius: 10, width: 48, height: 40, alignItems: 'center', justifyContent: 'center' }}>
              <TextInput
                value={hour}
                onChangeText={handleHour}
                keyboardType="number-pad"
                maxLength={2}
                style={{ fontSize: 17, fontWeight: '600', color: textColor, textAlign: 'center', width: 48, height: 40 }}
                selectTextOnFocus
              />
            </View>
            <Text style={{ fontSize: 20, fontWeight: '700', color: textColor }}>:</Text>
            <View style={{ backgroundColor: cellBg, borderRadius: 10, width: 48, height: 40, alignItems: 'center', justifyContent: 'center' }}>
              <TextInput
                value={minute}
                onChangeText={handleMinute}
                keyboardType="number-pad"
                maxLength={2}
                style={{ fontSize: 17, fontWeight: '600', color: textColor, textAlign: 'center', width: 48, height: 40 }}
                selectTextOnFocus
              />
            </View>
          </View>

          {/* Actions */}
          <View style={{ flexDirection: 'row', borderTopWidth: 1, borderTopColor: isDark ? '#38383A' : '#E5E5EA' }}>
            <Pressable
              onPress={onCancel}
              style={{ flex: 1, paddingVertical: 14, alignItems: 'center', borderRightWidth: 0.5, borderRightColor: isDark ? '#38383A' : '#E5E5EA' }}
            >
              <Text style={{ fontSize: 16, color: mutedColor }}>{cancelLabel}</Text>
            </Pressable>
            <Pressable
              onPress={handleConfirm}
              style={{ flex: 1, paddingVertical: 14, alignItems: 'center' }}
            >
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#007AFF' }}>{confirmLabel}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
