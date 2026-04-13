import type { Currency } from './auth';

export type ExpenseCategoryId =
  | 'food'
  | 'transport'
  | 'grocery'
  | 'health'
  | 'entertainment'
  | 'education'
  | 'clothing'
  | 'housing'
  | 'utilities'
  | 'phone'
  | 'subscriptions'
  | 'other';

export interface Expense {
  id: string;
  amount: number;
  currency: Currency;
  category: ExpenseCategoryId;
  description: string;
  receiptUrl: string | null;
  expenseDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseListResponse {
  items: Expense[];
  nextCursor: string | null;
}

export interface CreateExpensePayload {
  amount: number;
  currency: Currency;
  category: ExpenseCategoryId;
  description?: string;
  receiptUrl?: string | null;
  expenseDate: string; // ISO
}

export interface ExpenseSummary {
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  from: string;
  to: string;
  byCurrency: Array<{ currency: Currency; total: number; count: number }>;
}
