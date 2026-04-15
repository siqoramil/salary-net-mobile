import { create } from 'zustand';
import type { ToastType } from '../components/ui/Toast';

interface ToastState {
  visible: boolean;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

export type ConfirmVariant = 'default' | 'destructive';

interface ConfirmState {
  visible: boolean;
  variant: ConfirmVariant;
  icon?: string;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
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

  confirm: ConfirmState;
  showConfirm: (opts: {
    variant?: ConfirmVariant;
    icon?: string;
    title: string;
    message?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm?: () => void;
    onCancel?: () => void;
  }) => void;
  hideConfirm: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  addExpenseOpen: false,
  openAddExpense: () => set({ addExpenseOpen: true }),
  closeAddExpense: () => set({ addExpenseOpen: false }),

  toast: { visible: false, type: 'info', title: '' },
  showToast: ({ type = 'info', title, message, duration }) =>
    set({ toast: { visible: true, type, title, message, duration } }),
  hideToast: () => set((s) => ({ toast: { ...s.toast, visible: false } })),

  confirm: { visible: false, variant: 'default', title: '' },
  showConfirm: ({
    variant = 'default',
    icon,
    title,
    message,
    confirmLabel,
    cancelLabel,
    onConfirm,
    onCancel,
  }) =>
    set({
      confirm: {
        visible: true,
        variant,
        icon,
        title,
        message,
        confirmLabel,
        cancelLabel,
        onConfirm,
        onCancel,
      },
    }),
  hideConfirm: () => set((s) => ({ confirm: { ...s.confirm, visible: false } })),
}));
