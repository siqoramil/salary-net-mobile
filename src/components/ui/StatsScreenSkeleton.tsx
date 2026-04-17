import { View } from 'react-native';
import { Skeleton } from './Skeleton';
import { useThemeStore } from '../../stores/themeStore';

const cardShadow = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.06,
  shadowRadius: 14,
  elevation: 3,
};

// Skeleton for a single StatRow value area
export function StatValueSkeleton() {
  return <Skeleton width={80} height={14} borderRadius={7} />;
}

// Skeleton for the trend bar chart
export function ChartSkeleton() {
  const isDark = useThemeStore((s) => s.resolved) === 'dark';
  const barBg = isDark ? '#2C2C2E' : '#E5E5EA';

  const bars = [55, 80, 45, 95, 60, 70, 40, 85, 50, 75, 65, 90];

  return (
    <View
      style={[
        {
          marginHorizontal: 20,
          marginTop: 16,
          borderRadius: 22,
          backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
          padding: 20,
        },
        cardShadow,
      ]}
    >
      {/* Title + legend placeholder */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <Skeleton width={60} height={16} borderRadius={8} />
        <Skeleton width={50} height={11} borderRadius={6} />
      </View>

      {/* Bars */}
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 140, gap: 6 }}>
        {bars.map((pct, i) => (
          <View
            key={i}
            style={{
              flex: 1,
              height: `${pct}%`,
              borderRadius: 6,
              backgroundColor: barBg,
              opacity: 0.6 + (i % 3) * 0.15,
            }}
          />
        ))}
      </View>
    </View>
  );
}

// Skeleton for the "by category" donut + legend block
export function CategorySkeleton() {
  const isDark = useThemeStore((s) => s.resolved) === 'dark';

  return (
    <View
      style={[
        {
          marginHorizontal: 20,
          marginTop: 16,
          borderRadius: 22,
          backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
          padding: 20,
          gap: 16,
        },
        cardShadow,
      ]}
    >
      {/* Title */}
      <Skeleton width={110} height={16} borderRadius={8} />
      {/* Bar */}
      <Skeleton width="100%" height={14} borderRadius={7} />
      {/* Legend 2x2 */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        {[65, 55, 70, 45].map((w, i) => (
          <View key={i} style={{ width: '47%', flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Skeleton width={8} height={8} borderRadius={4} />
            <Skeleton width={16} height={16} borderRadius={4} />
            <Skeleton width={`${w}%`} height={12} borderRadius={6} />
          </View>
        ))}
      </View>
    </View>
  );
}

// Skeleton for the category breakdown list
export function BreakdownSkeleton() {
  const isDark = useThemeStore((s) => s.resolved) === 'dark';

  return (
    <View
      style={[
        {
          marginHorizontal: 20,
          marginTop: 16,
          borderRadius: 22,
          backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
          padding: 20,
          gap: 16,
        },
        cardShadow,
      ]}
    >
      <Skeleton width={90} height={16} borderRadius={8} />
      {[100, 75, 55, 40].map((pct, i) => (
        <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: i === 0 ? 4 : 0 }}>
          <Skeleton width={40} height={40} borderRadius={12} />
          <View style={{ flex: 1, gap: 8 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Skeleton width="45%" height={13} borderRadius={6} />
              <Skeleton width={50} height={13} borderRadius={6} />
            </View>
            <Skeleton width={`${pct}%`} height={5} borderRadius={3} />
          </View>
        </View>
      ))}
    </View>
  );
}
