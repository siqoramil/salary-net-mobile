import type { Currency } from '../services/auth/auth.types';

const localeByCurrency: Record<Currency, string> = {
  UZS: 'uz-UZ',
  USD: 'en-US',
  EUR: 'de-DE',
  RUB: 'ru-RU',
};

function formatWithSpaces(n: number, fractionDigits: number): string {
  const fixed = n.toFixed(fractionDigits);
  const [intPart, decPart] = fixed.split('.');
  const spaced = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return decPart ? `${spaced}.${decPart}` : spaced;
}

export function formatMoney(amount: number, currency: Currency): string {
  const decimals = currency === 'UZS' ? 0 : 2;
  return `${formatWithSpaces(amount, decimals)} ${currency}`;
}

export function formatMoneyParts(amount: number, currency: Currency): { amount: string; currency: string } {
  const decimals = currency === 'UZS' ? 0 : 2;
  return { amount: formatWithSpaces(amount, decimals), currency };
}

// Compact form that keeps the number short regardless of magnitude.
// Uses Intl.NumberFormat's "compact" notation so the suffix is localized
// (1.2M in English, 1,2 млн in Russian, etc.). Below 10k we keep the
// full number — the compact suffix kicks in only where it actually helps.
export function formatCompactMoneyParts(
  amount: number,
  currency: Currency,
  locale = 'en',
): { amount: string; currency: string } {
  if (Math.abs(amount) < 10_000) {
    return formatMoneyParts(amount, currency);
  }
  try {
    const formatted = new Intl.NumberFormat(locale, {
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(amount);
    return { amount: formatted, currency };
  } catch {
    return formatMoneyParts(amount, currency);
  }
}

/** Format a raw numeric string with thousand separators as the user types */
export function formatAmountInput(raw: string): string {
  // Strip everything except digits and one decimal point
  let cleaned = raw.replace(/[^0-9.]/g, '');
  // Allow only one decimal point
  const dotIdx = cleaned.indexOf('.');
  if (dotIdx !== -1) {
    cleaned = cleaned.slice(0, dotIdx + 1) + cleaned.slice(dotIdx + 1).replace(/\./g, '');
  }
  // Split into integer and decimal parts
  const [intPart, decPart] = cleaned.split('.');
  if (!intPart) return '';
  // Add thousand separators (spaces)
  const spaced = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return decPart !== undefined ? `${spaced}.${decPart}` : spaced;
}

/** Format date input as dd.mm.yyyy while user types */
export function formatDateInput(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 4)}.${digits.slice(4)}`;
}

/** Parse dd.mm.yyyy string to Date, returns null if invalid */
export function parseDateInput(str: string): Date | null {
  const m = str.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (!m) return null;
  const [, dd, mm, yyyy] = m;
  const d = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
  if (
    d.getFullYear() !== Number(yyyy) ||
    d.getMonth() !== Number(mm) - 1 ||
    d.getDate() !== Number(dd)
  ) return null;
  return d;
}

/** Convert Date to dd.mm.yyyy string */
export function dateToInput(d: Date): string {
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}.${mm}.${d.getFullYear()}`;
}

export function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function formatDayLabel(iso: string, todayLabel = 'Today', yesterdayLabel = 'Yesterday'): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  if (sameDay(d, today)) return todayLabel;
  if (sameDay(d, yesterday)) return yesterdayLabel;
  return d.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
}

export function groupByDay<T extends { expenseDate: string }>(
  items: T[],
  todayLabel = 'Today',
  yesterdayLabel = 'Yesterday',
): Array<{
  day: string;
  label: string;
  items: T[];
}> {
  const map = new Map<string, T[]>();
  for (const it of items) {
    const d = new Date(it.expenseDate);
    const day = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const arr = map.get(day) ?? [];
    arr.push(it);
    map.set(day, arr);
  }
  return Array.from(map.entries())
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .map(([day, list]) => ({
      day,
      label: formatDayLabel(list[0].expenseDate, todayLabel, yesterdayLabel),
      items: list,
    }));
}
