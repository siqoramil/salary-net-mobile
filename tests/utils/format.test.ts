import { describe, it, expect } from 'vitest';
import {
  formatMoney,
  formatMoneyParts,
  formatCompactMoneyParts,
  formatAmountInput,
  formatDateInput,
  parseDateInput,
  dateToInput,
  groupByDay,
} from '../../src/utils/format';

describe('formatMoney', () => {
  it('UZS has no decimals and space thousand separator', () => {
    expect(formatMoney(1234567, 'UZS')).toBe('1 234 567 UZS');
  });

  it('USD formats with two decimals', () => {
    expect(formatMoney(1234.5, 'USD')).toBe('1 234.50 USD');
  });

  it('handles zero and negative values', () => {
    expect(formatMoney(0, 'USD')).toBe('0.00 USD');
    expect(formatMoney(-5, 'USD')).toBe('-5.00 USD');
  });
});

describe('formatMoneyParts', () => {
  it('splits amount and currency', () => {
    expect(formatMoneyParts(1000, 'UZS')).toEqual({ amount: '1 000', currency: 'UZS' });
    expect(formatMoneyParts(7.1, 'EUR')).toEqual({ amount: '7.10', currency: 'EUR' });
  });
});

describe('formatCompactMoneyParts', () => {
  it('returns full form below 10k', () => {
    expect(formatCompactMoneyParts(9999, 'USD').amount).toBe('9 999.00');
  });

  it('uses compact notation above 10k', () => {
    const { amount } = formatCompactMoneyParts(1_500_000, 'USD', 'en');
    // Intl compact for 1.5M in en-US -> "1.5M"
    expect(amount).toMatch(/M$/);
  });
});

describe('formatAmountInput', () => {
  it('adds space thousand separators to integer part', () => {
    expect(formatAmountInput('1234567')).toBe('1 234 567');
  });

  it('preserves a trailing decimal point', () => {
    expect(formatAmountInput('1234.')).toBe('1 234.');
  });

  it('keeps decimal digits intact', () => {
    expect(formatAmountInput('1234.56')).toBe('1 234.56');
  });

  it('strips non-numeric characters', () => {
    expect(formatAmountInput('abc12abc3')).toBe('123');
  });

  it('collapses multiple dots to the first one', () => {
    expect(formatAmountInput('1.2.3')).toBe('1.23');
  });

  it('returns empty string when there is no integer part', () => {
    expect(formatAmountInput('.5')).toBe('');
    expect(formatAmountInput('')).toBe('');
  });
});

describe('formatDateInput', () => {
  it.each([
    ['', ''],
    ['1', '1'],
    ['12', '12'],
    ['123', '12.3'],
    ['1234', '12.34'],
    ['12345', '12.34.5'],
    ['12342026', '12.34.2026'],
    ['12342026999', '12.34.2026'], // trims past 8 digits
    ['12/34/2026', '12.34.2026'], // non-digits stripped
  ])('formats "%s" -> "%s"', (raw, expected) => {
    expect(formatDateInput(raw)).toBe(expected);
  });
});

describe('parseDateInput', () => {
  it('parses a valid dd.mm.yyyy string', () => {
    const d = parseDateInput('20.04.2026');
    expect(d).toBeInstanceOf(Date);
    expect(d!.getFullYear()).toBe(2026);
    expect(d!.getMonth()).toBe(3); // April
    expect(d!.getDate()).toBe(20);
  });

  it('rejects obviously invalid dates like 31.02.2026', () => {
    expect(parseDateInput('31.02.2026')).toBeNull();
  });

  it('rejects wrong formats', () => {
    expect(parseDateInput('2026-04-20')).toBeNull();
    expect(parseDateInput('20.4.2026')).toBeNull();
    expect(parseDateInput('nope')).toBeNull();
  });
});

describe('dateToInput', () => {
  it('zero-pads day and month', () => {
    expect(dateToInput(new Date(2026, 0, 5))).toBe('05.01.2026');
    expect(dateToInput(new Date(2026, 11, 31))).toBe('31.12.2026');
  });

  it('round-trips via parseDateInput', () => {
    const str = '07.08.2024';
    const parsed = parseDateInput(str);
    expect(parsed).not.toBeNull();
    expect(dateToInput(parsed!)).toBe(str);
  });
});

describe('groupByDay', () => {
  it('groups items by calendar day and sorts newest first', () => {
    const items = [
      { expenseDate: '2026-04-20T10:00:00.000Z', id: 'a' },
      { expenseDate: '2026-04-20T12:00:00.000Z', id: 'b' },
      { expenseDate: '2026-04-19T08:00:00.000Z', id: 'c' },
    ];
    const groups = groupByDay(items);
    expect(groups.length).toBe(2);
    expect(groups[0].items.length).toBe(2);
    expect(groups[1].items.length).toBe(1);
    // Newest day first
    expect(groups[0].day > groups[1].day).toBe(true);
  });

  it('returns empty list when given empty input', () => {
    expect(groupByDay([])).toEqual([]);
  });
});
