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

// Single expense row skeleton
function ExpenseRowSkeleton({ isLast }: { isLast: boolean }) {
  const isDark = useThemeStore((s) => s.resolved) === 'dark';
  const border = isDark ? '#38383A' : '#F2F2F7';
  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 14,
        },
        !isLast && { borderBottomWidth: 1, borderBottomColor: border },
      ]}
    >
      {/* Icon square */}
      <Skeleton width={44} height={44} borderRadius={14} />
      {/* Text block */}
      <View style={{ marginLeft: 12, flex: 1, gap: 7 }}>
        <Skeleton width="60%" height={14} borderRadius={7} />
        <Skeleton width="35%" height={11} borderRadius={6} />
      </View>
      {/* Amount */}
      <Skeleton width={64} height={14} borderRadius={7} />
    </View>
  );
}

// One group: day label + card with rows
function ExpenseGroupSkeleton({ rows = 3 }: { rows?: number }) {
  const isDark = useThemeStore((s) => s.resolved) === 'dark';
  return (
    <View style={{ marginTop: 16, paddingHorizontal: 20 }}>
      {/* Day label */}
      <Skeleton width={80} height={11} borderRadius={6} style={{ marginBottom: 10, marginLeft: 4 }} />
      {/* Card */}
      <View
        style={[
          { borderRadius: 16, overflow: 'hidden', backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' },
          cardShadow,
        ]}
      >
        {Array.from({ length: rows }).map((_, i) => (
          <ExpenseRowSkeleton key={i} isLast={i === rows - 1} />
        ))}
      </View>
    </View>
  );
}

// Full home screen skeleton (list area only — header stays visible)
export function HomeListSkeleton() {
  return (
    <>
      <ExpenseGroupSkeleton rows={3} />
      <ExpenseGroupSkeleton rows={2} />
      <ExpenseGroupSkeleton rows={4} />
    </>
  );
}

// Balance card amount skeleton (shown inside the blue card)
export function BalanceAmountSkeleton() {
  return (
    <View style={{ marginTop: 10 }}>
      <Skeleton width={180} height={36} borderRadius={10} style={{ backgroundColor: 'rgba(255,255,255,0.3)' }} />
    </View>
  );
}
