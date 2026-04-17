import { debtorApi } from './debtor.api';
import type { CreateDebtPayload, DebtRecord, DebtType, UpdateDebtPayload } from './debtor.types';

export const debtorService = {
  list(params: { type?: DebtType; isSettled?: boolean } = {}): Promise<DebtRecord[]> {
    return debtorApi.list(params);
  },
  create(payload: CreateDebtPayload): Promise<DebtRecord> {
    return debtorApi.create(payload);
  },
  update(id: string, payload: UpdateDebtPayload): Promise<DebtRecord> {
    return debtorApi.update(id, payload);
  },
  markSettled(id: string): Promise<DebtRecord> {
    return debtorApi.markSettled(id);
  },
  remove(id: string): Promise<void> {
    return debtorApi.remove(id);
  },
};

export { debtorApi };
