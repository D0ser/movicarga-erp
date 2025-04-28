import { toast as shadcnToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface ToastOptions {
  duration?: number;
  className?: string;
}

const defaultOptions: ToastOptions = {
  duration: 4000,
};

export const showToast = {
  success: (message: string, options?: ToastOptions) => {
    return shadcnToast({
      title: 'Éxito',
      description: message,
      variant: 'default',
      className: cn('bg-green-600 text-white font-medium shadow-xl border-0', options?.className),
      duration: options?.duration || defaultOptions.duration,
    });
  },
  error: (message: string, options?: ToastOptions) => {
    return shadcnToast({
      title: 'Error',
      description: message,
      variant: 'destructive',
      className: cn('bg-red-600 text-white font-medium shadow-xl border-0', options?.className),
      duration: options?.duration || defaultOptions.duration,
    });
  },
  loading: (message: string, options?: ToastOptions) => {
    return shadcnToast({
      title: 'Cargando',
      description: message,
      className: cn('bg-primary text-white font-medium shadow-xl border-0', options?.className),
      duration: 100000, // Mantenemos visible hasta dismiss
    });
  },
  dismiss: (toastId?: string) => {
    // En los toasts de shadcn, podemos usar la función dismiss del hook useToast
    // pero como estamos fuera de un componente, no podemos usar el hook
    // Por lo tanto, los toasts se cierran automáticamente según su duración configurada
  },
  custom: (message: string, options?: ToastOptions) => {
    return shadcnToast({
      description: message,
      className: cn('bg-white border-gray-200 shadow-xl', options?.className),
      duration: options?.duration || defaultOptions.duration,
    });
  },
};

export default showToast;
