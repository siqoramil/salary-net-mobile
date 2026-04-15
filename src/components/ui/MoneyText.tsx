import { Text, View, useColorScheme } from 'react-native';
import { useTranslation } from 'react-i18next';
import { formatCompactMoneyParts, formatMoneyParts } from '../../utils/format';
import type { Currency } from '../../types/auth';

interface Props {
  amount: number;
  currency: Currency;
  prefix?: string;
  size?: number;
  color?: string;
  weight?: 'bold' | '800' | '700' | '600' | 'normal';
  // When true, format as "1.2M" / "1,2 млн" instead of the full number.
  // Use for summary stats where rows can't grow to fit huge values.
  compact?: boolean;
}

export function MoneyText({
  amount,
  currency,
  prefix,
  size = 16,
  color,
  weight = 'bold',
  compact = false,
}: Props) {
  const scheme = useColorScheme();
  const { i18n } = useTranslation();
  const resolvedColor = color ?? (scheme === 'dark' ? '#FFFFFF' : '#000000');
  const parts = compact
    ? formatCompactMoneyParts(amount, currency, i18n.language)
    : formatMoneyParts(amount, currency);

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
