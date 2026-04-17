import { expenseApi, type ListExpensesParams } from './expense.api';
import type {
  CreateExpensePayload,
  Expense,
  ExpenseListResponse,
  ExpenseSummary,
} from './expense.types';

export type { ListExpensesParams };

export const expenseService = {
  list(params: ListExpensesParams = {}): Promise<ExpenseListResponse> {
    return expenseApi.list(params);
  },
  create(payload: CreateExpensePayload): Promise<Expense> {
    return expenseApi.create(payload);
  },
  update(id: string, payload: Partial<CreateExpensePayload>): Promise<Expense> {
    return expenseApi.update(id, payload);
  },
  remove(id: string): Promise<void> {
    return expenseApi.remove(id);
  },
  summary(period: 'daily' | 'weekly' | 'monthly' | 'yearly'): Promise<ExpenseSummary> {
    return expenseApi.summary(period);
  },
  byCategory(from: string, to: string) {
    return expenseApi.byCategory(from, to);
  },
};

export { expenseApi };
