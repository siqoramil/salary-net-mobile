import type { Currency } from '../auth/auth.types';

export type DebtType = 'lent' | 'borrowed';

export interface DebtRecord {
  id: string;
  type: DebtType;
  personName: string;
  amount: number;
  currency: Currency;
  date: string; // ISO
  description: string;
  isSettled: boolean;
  settledAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDebtPayload {
  type: DebtType;
  personName: string;
  amount: number;
  currency: Currency;
  date: string; // ISO
  description?: string;
}

export interface UpdateDebtPayload {
  personName?: string;
  amount?: number;
  currency?: Currency;
  date?: string;
  description?: string;
  isSettled?: boolean;
  settledAt?: string | null;
}
