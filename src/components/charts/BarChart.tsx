import { View, Text } from 'react-native';

export interface BarDatum {
  label: string;
  value: number;
}

interface Props {
  data: BarDatum[];
  height?: number;
  color?: string;
  noDataText?: string;
}

export function BarChart({ data, height = 160, color = '#FF3B30', noDataText = 'No data' }: Props) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const avg = data.length ? data.reduce((s, d) => s + d.value, 0) / data.length : 0;
  const avgPct = (avg / max) * 100;

  if (data.length === 0) {
    return (
      <View style={{ height }} className="items-center justify-center">
        <Text className="text-[15px] text-[#8E8E93]">{noDataText}</Text>
      </View>
    );
  }

  return (
    <View>
      <View style={{ height, position: 'relative' }} className="flex-row items-end gap-1">
        {/* avg dashed line */}
        <View
          className="absolute left-0 right-0"
          style={{
            bottom: `${avgPct}%`,
            borderTopWidth: 1,
            borderColor: 'rgba(255,59,48,0.4)',
            borderStyle: 'dashed',
          }}
        />
        {data.map((d, i) => {
          const h = max > 0 ? (d.value / max) * height : 0;
          return (
            <View key={`${d.label}-${i}`} className="flex-1 items-center">
              <View
                style={{
                  height: Math.max(2, h),
                  width: '70%',
                  backgroundColor: color,
                  borderRadius: 4,
                }}
              />
            </View>
          );
        })}
      </View>
      <View className="mt-1 flex-row gap-1">
        {data.map((d, i) => (
          <View key={i} className="flex-1 items-center">
            <Text className="text-[10px] text-[#8E8E93]" numberOfLines={1}>
              {d.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
