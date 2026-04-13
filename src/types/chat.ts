import type { Currency } from './auth';
import type { ExpenseCategoryId } from './expense';

export interface Conversation {
  id: string;
  title: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant';
  content: string;
  metadata: ChatMetadata | null;
  createdAt: string;
}

export interface CreateExpenseAction {
  action: 'create_expense';
  data: {
    amount: number;
    currency: Currency;
    category: ExpenseCategoryId;
    description: string;
    date: string;
  };
}

export type ChatMetadata = CreateExpenseAction | Record<string, unknown>;
