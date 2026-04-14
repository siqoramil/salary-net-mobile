import { useUIStore } from '../../stores/uiStore';
import { Toast } from './Toast';

export function ToastHost() {
  const toast = useUIStore((s) => s.toast);
  const hideToast = useUIStore((s) => s.hideToast);

  return (
    <Toast
      visible={toast.visible}
      type={toast.type}
      title={toast.title}
      message={toast.message}
      duration={toast.duration}
      onDismiss={hideToast}
    />
  );
}
