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

function DebtCardSkeleton() {
  const isDark = useThemeStore((s) => s.resolved) === 'dark';
  return (
    <View
      style={[
        {
          borderRadius: 20,
          backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
          padding: 16,
          gap: 12,
        },
        cardShadow,
      ]}
    >
      {/* Top row: avatar + name/date + badge */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Skeleton width={44} height={44} borderRadius={22} />
        <View style={{ flex: 1, gap: 7 }}>
          <Skeleton width="55%" height={15} borderRadius={7} />
          <Skeleton width="38%" height={11} borderRadius={6} />
        </View>
        <Skeleton width={60} height={22} borderRadius={11} />
      </View>
      {/* Amount */}
      <Skeleton width={120} height={22} borderRadius={8} />
      {/* Action buttons */}
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 2 }}>
        <Skeleton width="70%" height={38} borderRadius={12} />
        <Skeleton width="26%" height={38} borderRadius={12} />
      </View>
    </View>
  );
}

// Summary card skeleton (matches the colored total card)
function SummaryCardSkeleton() {
  const isDark = useThemeStore((s) => s.resolved) === 'dark';
  const bg = isDark ? '#2C2C2E' : '#E5E5EA';
  return (
    <View
      style={{
        marginHorizontal: 20,
        marginTop: 16,
        borderRadius: 20,
        backgroundColor: bg,
        padding: 20,
        gap: 8,
        opacity: 0.7,
      }}
    >
      <Skeleton width={100} height={12} borderRadius={6} style={{ backgroundColor: 'rgba(0,0,0,0.1)' }} />
      <Skeleton width={150} height={28} borderRadius={10} style={{ backgroundColor: 'rgba(0,0,0,0.1)' }} />
    </View>
  );
}

export function DebtListSkeleton() {
  return (
    <>
      <SummaryCardSkeleton />
      <View style={{ marginHorizontal: 20, marginTop: 16, gap: 12 }}>
        <DebtCardSkeleton />
        <DebtCardSkeleton />
        <DebtCardSkeleton />
      </View>
    </>
  );
}
