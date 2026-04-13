import type { ExpenseCategoryId } from '../types/expense';

export interface CategoryDef {
  id: ExpenseCategoryId;
  icon: string;
  color: string;
  labelKey: string;
}

export const EXPENSE_CATEGORIES: CategoryDef[] = [
  { id: 'food', icon: '🍔', color: '#007AFF', labelKey: 'categories.food' },
  { id: 'transport', icon: '🚕', color: '#5856D6', labelKey: 'categories.transport' },
  { id: 'grocery', icon: '🛒', color: '#34C759', labelKey: 'categories.grocery' },
  { id: 'health', icon: '💊', color: '#FF2D55', labelKey: 'categories.health' },
  { id: 'entertainment', icon: '🎮', color: '#AF52DE', labelKey: 'categories.entertainment' },
  { id: 'education', icon: '📚', color: '#5AC8FA', labelKey: 'categories.education' },
  { id: 'clothing', icon: '👕', color: '#FF9500', labelKey: 'categories.clothing' },
  { id: 'housing', icon: '🏠', color: '#30B0C7', labelKey: 'categories.housing' },
  { id: 'utilities', icon: '💡', color: '#FFCC00', labelKey: 'categories.utilities' },
  { id: 'phone', icon: '📱', color: '#64D2FF', labelKey: 'categories.phone' },
  { id: 'subscriptions', icon: '💳', color: '#BDB76B', labelKey: 'categories.subscriptions' },
  { id: 'other', icon: '📦', color: '#8E8E93', labelKey: 'categories.other' },
];

export const CATEGORY_BY_ID: Record<ExpenseCategoryId, CategoryDef> = EXPENSE_CATEGORIES.reduce(
  (acc, c) => {
    acc[c.id] = c;
    return acc;
  },
  {} as Record<ExpenseCategoryId, CategoryDef>,
);

export const CURRENCIES = ['UZS', 'USD', 'EUR', 'RUB'] as const;
