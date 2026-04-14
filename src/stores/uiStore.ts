import { create } from 'zustand';
import type { ToastType } from '../components/ui/Toast';

interface ToastState {
  visible: boolean;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface UIState {
  addExpenseOpen: boolean;
  openAddExpense: () => void;
  closeAddExpense: () => void;

  toast: ToastState;
  showToast: (t: {
    type?: ToastType;
    title: string;
    message?: string;
    duration?: number;
  }) => void;
  hideToast: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  addExpenseOpen: false,
  openAddExpense: () => set({ addExpenseOpen: true }),
  closeAddExpense: () => set({ addExpenseOpen: false }),

  toast: { visible: false, type: 'info', title: '' },
  showToast: ({ type = 'info', title, message, duration }) =>
    set({ toast: { visible: true, type, title, message, duration } }),
  hideToast: () =>
    set((s) => ({ toast: { ...s.toast, visible: false } })),
}));
