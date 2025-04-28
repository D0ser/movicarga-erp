import { showToast } from '@/utils/toast';

interface ToastOptions {
  duration?: number;
  className?: string;
}

const notificationService = {
  success: (message: string, options?: ToastOptions) => {
    return showToast.success(message, {
      ...options,
      className: `bg-green-600 text-white font-medium shadow-xl border-0 ${options?.className || ''}`,
    });
  },

  error: (message: string, options?: ToastOptions) => {
    return showToast.error(message, {
      ...options,
      className: `bg-red-600 text-white font-medium shadow-xl border-0 ${options?.className || ''}`,
    });
  },

  loading: (message: string, options?: ToastOptions) => {
    return showToast.loading(message, {
      ...options,
      className: `bg-black/90 text-white font-medium shadow-xl border-0 ${options?.className || ''}`,
    });
  },

  dismiss: (toastId?: string) => {
    showToast.dismiss(toastId);
  },

  custom: (message: string, options?: ToastOptions) => {
    return showToast.custom(message, options);
  },
};

export default notificationService;
