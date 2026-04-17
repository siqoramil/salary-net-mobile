import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { debtorApi } from '../services/debtor/debtor.service';
import type { CreateDebtPayload, DebtRecord, DebtType, UpdateDebtPayload } from '../services/debtor/debtor.types';

export const debtorKeys = {
  all: ['debtors'] as const,
  list: (params: { type?: DebtType; isSettled?: boolean } = {}) =>
    ['debtors', 'list', params] as const,
};

export function useDebtors(params: { type?: DebtType; isSettled?: boolean } = {}) {
  return useQuery({
    queryKey: debtorKeys.list(params),
    queryFn: () => debtorApi.list(params),
  });
}

export function useCreateDebt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateDebtPayload) => debtorApi.create(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: debtorKeys.all });
    },
  });
}

export function useUpdateDebt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateDebtPayload }) =>
      debtorApi.update(id, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: debtorKeys.all });
    },
  });
}

export function useMarkSettled() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => debtorApi.markSettled(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: debtorKeys.all });
      const snapshots = qc.getQueriesData<DebtRecord[]>({ queryKey: ['debtors', 'list'] });
      snapshots.forEach(([key, data]) => {
        if (!data) return;
        qc.setQueryData(key, data.map((d) => (d.id === id ? { ...d, isSettled: true } : d)));
      });
      return { snapshots };
    },
    onError: (_err, _id, ctx) => {
      ctx?.snapshots.forEach(([key, data]) => qc.setQueryData(key, data));
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: debtorKeys.all });
    },
  });
}

export function useDeleteDebt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => debtorApi.remove(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: debtorKeys.all });
      const snapshots = qc.getQueriesData<DebtRecord[]>({ queryKey: ['debtors', 'list'] });
      snapshots.forEach(([key, data]) => {
        if (!data) return;
        qc.setQueryData(key, data.filter((d) => d.id !== id));
      });
      return { snapshots };
    },
    onError: (_err, _id, ctx) => {
      ctx?.snapshots.forEach(([key, data]) => qc.setQueryData(key, data));
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: debtorKeys.all });
    },
  });
}
