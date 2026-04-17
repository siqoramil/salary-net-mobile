import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { expenseApi, type ListExpensesParams } from '../services/expense/expense.service';
import type { CreateExpensePayload, Expense } from '../services/expense/expense.types';

export const expenseKeys = {
  all: ['expenses'] as const,
  list: (params: ListExpensesParams = {}) => ['expenses', 'list', params] as const,
  summary: (period: string) => ['expenses', 'summary', period] as const,
  byCategory: (from: string, to: string) => ['expenses', 'byCategory', from, to] as const,
};

export function useExpensesByCategory(from: string, to: string) {
  return useQuery({
    queryKey: expenseKeys.byCategory(from, to),
    queryFn: () => expenseApi.byCategory(from, to),
  });
}

export function useExpenses(params: Omit<ListExpensesParams, 'cursor'> = {}) {
  return useInfiniteQuery({
    queryKey: expenseKeys.list(params),
    queryFn: ({ pageParam }) => expenseApi.list({ ...params, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });
}

export function useExpenseSummary(period: 'daily' | 'weekly' | 'monthly' | 'yearly' = 'monthly') {
  return useQuery({
    queryKey: expenseKeys.summary(period),
    queryFn: () => expenseApi.summary(period),
  });
}

export function useCreateExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateExpensePayload) => expenseApi.create(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: expenseKeys.all });
    },
  });
}

export function useUpdateExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<CreateExpensePayload> }) =>
      expenseApi.update(id, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: expenseKeys.all });
    },
  });
}

export function useDeleteExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => expenseApi.remove(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: expenseKeys.all });
      const snapshots = qc.getQueriesData<{ pages: Array<{ items: Expense[] }> }>({
        queryKey: ['expenses', 'list'],
      });
      snapshots.forEach(([key, data]) => {
        if (!data) return;
        qc.setQueryData(key, {
          ...data,
          pages: data.pages.map((p) => ({
            ...p,
            items: p.items.filter((e) => e.id !== id),
          })),
        });
      });
      return { snapshots };
    },
    onError: (_err, _id, ctx) => {
      ctx?.snapshots.forEach(([key, data]) => qc.setQueryData(key, data));
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: expenseKeys.all });
    },
  });
}
