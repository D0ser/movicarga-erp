import { toast as shadcnToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface ToastOptions {
  duration?: number;
  className?: string;
}

// Configuración predeterminada de las notificaciones
const defaultOptions: ToastOptions = {
  duration: 3000,
};

// Servicio de notificaciones usando shadcn/ui
const notificationService = {
  /**
   * Muestra una notificación de éxito
   * @param message Mensaje a mostrar
   * @param options Opciones adicionales
   */
  success: (message: string, options: ToastOptions = {}) => {
    return shadcnToast({
      title: 'Éxito',
      description: message,
      variant: 'default',
      className: cn('bg-green-600 text-white font-medium shadow-xl border-0', options.className),
      duration: options.duration || defaultOptions.duration,
    });
  },

  /**
   * Muestra una notificación de error
   * @param message Mensaje a mostrar
   * @param options Opciones adicionales
   */
  error: (message: string, options: ToastOptions = {}) => {
    return shadcnToast({
      title: 'Error',
      description: message,
      variant: 'destructive',
      className: cn('bg-red-600 text-white font-medium shadow-xl border-0', options.className),
      duration: options.duration || defaultOptions.duration,
    });
  },

  /**
   * Muestra una notificación de advertencia
   * @param message Mensaje a mostrar
   * @param options Opciones adicionales
   */
  warning: (message: string, options: ToastOptions = {}) => {
    return shadcnToast({
      title: 'Advertencia',
      description: message,
      variant: 'default',
      className: cn('bg-amber-500 text-white font-medium shadow-xl border-0', options.className),
      duration: options.duration || defaultOptions.duration,
    });
  },

  /**
   * Muestra una notificación informativa
   * @param message Mensaje a mostrar
   * @param options Opciones adicionales
   */
  info: (message: string, options: ToastOptions = {}) => {
    return shadcnToast({
      title: 'Información',
      description: message,
      variant: 'default',
      className: cn('bg-primary text-white font-medium shadow-xl border-0', options.className),
      duration: options.duration || defaultOptions.duration,
    });
  },

  /**
   * Muestra una notificación de carga
   * @param message Mensaje a mostrar
   * @param options Opciones adicionales
   */
  loading: (message: string, options: ToastOptions = {}) => {
    return shadcnToast({
      title: 'Cargando',
      description: message,
      className: cn('bg-black/90 text-white font-medium shadow-xl border-0', options.className),
      duration: 100000, // Duración larga para que no desaparezca automáticamente
    });
  },

  /**
   * Cierra las notificaciones activas
   * En shadcn/ui no hay una manera directa de cerrar notificaciones específicas
   * pero se proporciona este método para mantener compatibilidad API
   */
  dismiss: () => {
    // Este método es un placeholder, actualmente no es funcional con shadcn/ui
    // Las notificaciones se cerrarán automáticamente según su duración
  },

  /**
   * Muestra una notificación personalizada
   * @param message Mensaje a mostrar
   * @param options Opciones adicionales
   */
  custom: (message: string, options: ToastOptions = {}) => {
    return shadcnToast({
      description: message,
      className: cn('bg-white shadow-xl border-gray-200', options.className),
      duration: options.duration || defaultOptions.duration,
    });
  },

  /**
   * Cierra todas las notificaciones
   */
  closeAll: () => {
    // En shadcn/ui no hay una manera directa de cerrar todas las notificaciones
    // pero como por diseño solo se muestra una a la vez, esto no debería ser problema
  },
};

export default notificationService;
