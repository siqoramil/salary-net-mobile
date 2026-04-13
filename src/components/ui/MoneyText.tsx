import { Text, View, useColorScheme } from 'react-native';
import { formatMoneyParts } from '../../utils/format';
import type { Currency } from '../../types/auth';

interface Props {
  amount: number;
  currency: Currency;
  prefix?: string;
  size?: number;
  color?: string;
  weight?: 'bold' | '800' | '700' | '600' | 'normal';
}

export function MoneyText({
  amount,
  currency,
  prefix,
  size = 16,
  color,
  weight = 'bold',
}: Props) {
  const scheme = useColorScheme();
  const resolvedColor = color ?? (scheme === 'dark' ? '#FFFFFF' : '#000000');
  const parts = formatMoneyParts(amount, currency);

  return (
    <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
      <Text style={{ fontSize: size, fontWeight: weight, color: resolvedColor }}>
        {prefix}{parts.amount}
      </Text>
      <Text style={{ fontSize: size * 0.55, fontWeight: '500', color: resolvedColor, opacity: 0.6, marginLeft: 3 }}>
        {parts.currency}
      </Text>
    </View>
  );
}
