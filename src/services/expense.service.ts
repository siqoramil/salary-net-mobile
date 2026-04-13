import { api } from './api';
import type {
  CreateExpensePayload,
  Expense,
  ExpenseListResponse,
  ExpenseSummary,
} from '../types/expense';

export interface ListExpensesParams {
  limit?: number;
  cursor?: string;
  from?: string;
  to?: string;
  category?: string;
}

export const expenseApi = {
  async list(params: ListExpensesParams = {}): Promise<ExpenseListResponse> {
    const { data } = await api.get<ExpenseListResponse>('/expenses', { params });
    return data;
  },

  async create(payload: CreateExpensePayload): Promise<Expense> {
    const { data } = await api.post<Expense>('/expenses', payload);
    return data;
  },

  async update(id: string, payload: Partial<CreateExpensePayload>): Promise<Expense> {
    const { data } = await api.patch<Expense>(`/expenses/${id}`, payload);
    return data;
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/expenses/${id}`);
  },

  async summary(period: 'daily' | 'weekly' | 'monthly' | 'yearly'): Promise<ExpenseSummary> {
    const { data } = await api.get<ExpenseSummary>('/expenses/summary', { params: { period } });
    return data;
  },

  async byCategory(from: string, to: string) {
    const { data } = await api.get<
      Array<{ category: string; currency: string; total: number; count: number }>
    >('/expenses/by-category', { params: { from, to } });
    return data;
  },
};
