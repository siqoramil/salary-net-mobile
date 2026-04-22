import { describe, it, expect, beforeEach } from 'vitest';
import { useUIStore } from '../../src/stores/uiStore';

describe('useUIStore', () => {
  beforeEach(() => {
    // Reset to initial state between tests so they do not leak through
    // the shared zustand singleton.
    useUIStore.setState({
      addExpenseOpen: false,
      toast: { visible: false, type: 'info', title: '' },
      confirm: { visible: false, variant: 'default', title: '' },
    });
  });

  it('opens and closes the add-expense sheet', () => {
    useUIStore.getState().openAddExpense();
    expect(useUIStore.getState().addExpenseOpen).toBe(true);
    useUIStore.getState().closeAddExpense();
    expect(useUIStore.getState().addExpenseOpen).toBe(false);
  });

  it('shows a toast with defaults and hides it', () => {
    useUIStore.getState().showToast({ title: 'Saved' });
    const t1 = useUIStore.getState().toast;
    expect(t1).toMatchObject({ visible: true, type: 'info', title: 'Saved' });

    useUIStore.getState().hideToast();
    expect(useUIStore.getState().toast.visible).toBe(false);
    // Title and type remain, only `visible` flips — matches the UX where
    // the toast fades out without losing its content.
    expect(useUIStore.getState().toast.title).toBe('Saved');
  });

  it('forwards custom toast options through', () => {
    useUIStore.getState().showToast({
      type: 'error',
      title: 'Nope',
      message: 'something went wrong',
      duration: 1000,
    });
    expect(useUIStore.getState().toast).toMatchObject({
      visible: true,
      type: 'error',
      title: 'Nope',
      message: 'something went wrong',
      duration: 1000,
    });
  });

  it('shows a confirm dialog with variant and callbacks', () => {
    const onConfirm = (): void => undefined;
    useUIStore.getState().showConfirm({
      variant: 'destructive',
      title: 'Delete?',
      confirmLabel: 'Delete',
      onConfirm,
    });
    const c = useUIStore.getState().confirm;
    expect(c.visible).toBe(true);
    expect(c.variant).toBe('destructive');
    expect(c.onConfirm).toBe(onConfirm);
  });

  it('hideConfirm flips visible to false without dropping content', () => {
    useUIStore.getState().showConfirm({ title: 'Are you sure?' });
    useUIStore.getState().hideConfirm();
    expect(useUIStore.getState().confirm.visible).toBe(false);
    expect(useUIStore.getState().confirm.title).toBe('Are you sure?');
  });
});
