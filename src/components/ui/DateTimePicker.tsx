import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  Text,
  View,
} from 'react-native';
import { useThemeStore } from '../../stores/themeStore';

const ITEM_HEIGHT = 36;
const VISIBLE_ITEMS = 5;
const WHEEL_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;
const CENTER_OFFSET = Math.floor(VISIBLE_ITEMS / 2);

interface WheelProps {
  data: string[];
  value: number;
  onChange: (index: number) => void;
  textColor: string;
  width: number;
  align?: 'center' | 'flex-start';
}

function Wheel({ data, value, onChange, textColor, width, align = 'center' }: WheelProps) {
  const listRef = useRef<FlatList<string>>(null);
  const lastIndex = useRef(value);

  useEffect(() => {
    if (lastIndex.current !== value) {
      lastIndex.current = value;
      listRef.current?.scrollToOffset({ offset: value * ITEM_HEIGHT, animated: true });
    }
  }, [value]);

  const handleMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.y / ITEM_HEIGHT);
    const clamped = Math.max(0, Math.min(data.length - 1, idx));
    if (clamped !== lastIndex.current) {
      lastIndex.current = clamped;
      onChange(clamped);
    }
  };

  return (
    <View style={{ height: WHEEL_HEIGHT, width }}>
      <FlatList
        ref={listRef}
        data={data}
        keyExtractor={(item, idx) => `${idx}-${item}`}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        initialScrollIndex={value}
        getItemLayout={(_, index) => ({
          length: ITEM_HEIGHT,
          offset: ITEM_HEIGHT * index,
          index,
        })}
        contentContainerStyle={{ paddingVertical: ITEM_HEIGHT * CENTER_OFFSET }}
        onMomentumScrollEnd={handleMomentumEnd}
        renderItem={({ item, index }) => {
          const distance = Math.abs(index - value);
          let opacity = 1;
          if (distance === 1) opacity = 0.45;
          else if (distance === 2) opacity = 0.2;
          else if (distance >= 3) opacity = 0.08;
          const selected = distance === 0;
          return (
            <Pressable
              onPress={() => onChange(index)}
              style={{
                height: ITEM_HEIGHT,
                alignItems: align,
                justifyContent: 'center',
                paddingLeft: align === 'flex-start' ? 8 : 0,
              }}
            >
              <Text
                style={{
                  fontSize: selected ? 24 : 22,
                  fontWeight: selected ? '600' : '400',
                  color: textColor,
                  opacity,
                  fontVariant: ['tabular-nums'],
                }}
              >
                {item}
              </Text>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

function formatTime12(h: number, m: number) {
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
}

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

interface Props {
  visible: boolean;
  value: Date;
  onConfirm: (date: Date) => void;
  onCancel: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  dateOnly?: boolean;
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
  dateOnly = false,
}: Props) {
  const isDark = useThemeStore((s) => s.resolved) === 'dark';
  const [viewYear, setViewYear] = useState(value.getFullYear());
  const [viewMonth, setViewMonth] = useState(value.getMonth());
  const [selectedDay, setSelectedDay] = useState(value.getDate());
  const [hour, setHour] = useState(value.getHours());
  const [minute, setMinute] = useState(value.getMinutes());

  // Reset state when modal opens with new value
  const resetToValue = useCallback((d: Date) => {
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
    setSelectedDay(d.getDate());
    setHour(d.getHours());
    setMinute(d.getMinutes());
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
    const result = dateOnly
      ? new Date(viewYear, viewMonth, selectedDay, 0, 0, 0)
      : new Date(viewYear, viewMonth, selectedDay, hour, minute);
    onConfirm(result);
  };

  const hourItems = useMemo(
    () => Array.from({ length: 12 }, (_, i) => String(i + 1)),
    [],
  );
  const minuteItems = useMemo(
    () => Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0')),
    [],
  );
  const periodItems = useMemo(() => ['AM', 'PM'], []);

  const hour12Index = (hour % 12 === 0 ? 12 : hour % 12) - 1;
  const periodIndex = hour >= 12 ? 1 : 0;

  const setHourFromWheel = (idx: number) => {
    const h12 = idx + 1; // 1..12
    const base = h12 === 12 ? 0 : h12;
    setHour(base + periodIndex * 12);
  };

  const setPeriodFromWheel = (idx: number) => {
    const h12 = hour12Index + 1;
    const base = h12 === 12 ? 0 : h12;
    setHour(base + idx * 12);
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

          {/* Time picker — hidden when dateOnly */}
          {!dateOnly ? (
            <View
              style={{
                paddingTop: 8,
                paddingBottom: 12,
                paddingHorizontal: 16,
                borderTopWidth: 1,
                borderTopColor: isDark ? '#38383A' : '#E5E5EA',
              }}
            >
              {/* Header: "Time" left, value chip right */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 4,
                }}
              >
                <Text style={{ fontSize: 15, color: textColor }}>Time</Text>
                <View
                  style={{
                    backgroundColor: cellBg,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 8,
                  }}
                >
                  <Text style={{ fontSize: 15, fontWeight: '500', color: '#007AFF' }}>
                    {formatTime12(hour, minute)}
                  </Text>
                </View>
              </View>

              {/* Wheels with center highlight band */}
              <View style={{ height: WHEEL_HEIGHT, position: 'relative' }}>
                <View
                  pointerEvents="none"
                  style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    top: (WHEEL_HEIGHT - ITEM_HEIGHT) / 2,
                    height: ITEM_HEIGHT,
                    borderRadius: 10,
                    backgroundColor: cellBg,
                  }}
                />
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: WHEEL_HEIGHT,
                  }}
                >
                  <Wheel
                    data={hourItems}
                    value={hour12Index}
                    onChange={setHourFromWheel}
                    textColor={textColor}
                    width={56}
                  />
                  <Wheel
                    data={minuteItems}
                    value={minute}
                    onChange={setMinute}
                    textColor={textColor}
                    width={56}
                  />
                  <Wheel
                    data={periodItems}
                    value={periodIndex}
                    onChange={setPeriodFromWheel}
                    textColor={textColor}
                    width={60}
                    align="flex-start"
                  />
                </View>
              </View>
            </View>
          ) : null}

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
