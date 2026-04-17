import { api } from '../../api/api';
import type { CreateDebtPayload, DebtRecord, DebtType, UpdateDebtPayload } from './debtor.types';

export const debtorApi = {
  async list(params: { type?: DebtType; isSettled?: boolean } = {}): Promise<DebtRecord[]> {
    const { data } = await api.get<DebtRecord[]>('/debtors', { params });
    return data;
  },

  async create(payload: CreateDebtPayload): Promise<DebtRecord> {
    const { data } = await api.post<DebtRecord>('/debtors', payload);
    return data;
  },

  async update(id: string, payload: UpdateDebtPayload): Promise<DebtRecord> {
    const { data } = await api.patch<DebtRecord>(`/debtors/${id}`, payload);
    return data;
  },

  async markSettled(id: string): Promise<DebtRecord> {
    const { data } = await api.post<DebtRecord>(`/debtors/${id}/settled`);
    return data;
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/debtors/${id}`);
  },
};
