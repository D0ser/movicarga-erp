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

// Variable para almacenar la referencia al último toast creado
let lastToastRef: { id: string; dismiss: () => void } | undefined;
// Variable para rastrear si hay una notificación de carga activa
let loadingActive = false;

// Servicio de notificaciones usando shadcn/ui
const notificationService = {
  /**
   * Muestra una notificación de éxito
   * @param message Mensaje a mostrar
   * @param options Opciones adicionales
   */
  success: (message: string, options: ToastOptions = {}) => {
    // Si hay una notificación de carga activa, cerrarla primero
    if (loadingActive) {
      notificationService.dismiss();
    }

    const result = shadcnToast({
      title: 'Éxito',
      description: message,
      variant: 'default',
      className: cn('bg-green-600 text-white font-medium shadow-xl border-0', options.className),
      duration: options.duration || defaultOptions.duration,
    });
    lastToastRef = result;
    loadingActive = false;
    return result;
  },

  /**
   * Muestra una notificación de error
   * @param message Mensaje a mostrar
   * @param options Opciones adicionales
   */
  error: (message: string, options: ToastOptions = {}) => {
    // Si hay una notificación de carga activa, cerrarla primero
    if (loadingActive) {
      notificationService.dismiss();
    }

    const result = shadcnToast({
      title: 'Error',
      description: message,
      variant: 'destructive',
      className: cn('bg-red-600 text-white font-medium shadow-xl border-0', options.className),
      duration: options.duration || defaultOptions.duration,
    });
    lastToastRef = result;
    loadingActive = false;
    return result;
  },

  /**
   * Muestra una notificación de advertencia
   * @param message Mensaje a mostrar
   * @param options Opciones adicionales
   */
  warning: (message: string, options: ToastOptions = {}) => {
    // Si hay una notificación de carga activa, cerrarla primero
    if (loadingActive) {
      notificationService.dismiss();
    }

    const result = shadcnToast({
      title: 'Advertencia',
      description: message,
      variant: 'default',
      className: cn('bg-amber-500 text-white font-medium shadow-xl border-0', options.className),
      duration: options.duration || defaultOptions.duration,
    });
    lastToastRef = result;
    loadingActive = false;
    return result;
  },

  /**
   * Muestra una notificación informativa
   * @param message Mensaje a mostrar
   * @param options Opciones adicionales
   */
  info: (message: string, options: ToastOptions = {}) => {
    // Si hay una notificación de carga activa, cerrarla primero
    if (loadingActive) {
      notificationService.dismiss();
    }

    const result = shadcnToast({
      title: 'Información',
      description: message,
      variant: 'default',
      className: cn('bg-blue-600 text-white font-medium shadow-xl border-0', options.className),
      duration: options.duration || defaultOptions.duration,
    });
    lastToastRef = result;
    loadingActive = false;
    return result;
  },

  /**
   * Muestra una notificación de carga
   * @param message Mensaje a mostrar
   * @param options Opciones adicionales
   */
  loading: (message: string, options: ToastOptions = {}) => {
    // Si ya hay una notificación de carga, cerrarla primero
    if (loadingActive) {
      notificationService.dismiss();
    }

    const result = shadcnToast({
      title: 'Cargando',
      description: message,
      className: cn('bg-black/90 text-white font-medium shadow-xl border-0', options.className),
      duration: 100000, // Duración larga para que no desaparezca automáticamente
    });
    lastToastRef = result;
    loadingActive = true;
    return result;
  },

  /**
   * Cierra las notificaciones activas
   * Utiliza dismiss del propio toast para cerrar la última notificación
   */
  dismiss: () => {
    // Primero intentamos cerrar la notificación específica
    if (lastToastRef) {
      try {
        console.log('Cerrando notificación con ID:', lastToastRef.id);
        lastToastRef.dismiss();
      } catch (e) {
        console.error('Error al cerrar notificación específica:', e);
        // Si falla, usar el método dismiss global
        try {
          shadcnToast.dismiss();
        } catch (e2) {
          console.error('Error al cerrar todas las notificaciones:', e2);
        }
      }
      lastToastRef = undefined;
    } else {
      // Como alternativa, cerramos todas las notificaciones
      try {
        console.log('Cerrando todas las notificaciones');
        shadcnToast.dismiss();
      } catch (e) {
        console.error('Error al cerrar todas las notificaciones:', e);
      }
    }

    // Resetear el estado de carga
    loadingActive = false;
  },

  /**
   * Muestra una notificación personalizada
   * @param message Mensaje a mostrar
   * @param options Opciones adicionales
   */
  custom: (message: string, options: ToastOptions = {}) => {
    // Si hay una notificación de carga activa, cerrarla primero
    if (loadingActive) {
      notificationService.dismiss();
    }

    const result = shadcnToast({
      description: message,
      className: cn('bg-white shadow-xl border-gray-200', options.className),
      duration: options.duration || defaultOptions.duration,
    });
    lastToastRef = result;
    loadingActive = false;
    return result;
  },

  /**
   * Cierra todas las notificaciones
   */
  closeAll: () => {
    // Utiliza el método dismiss global
    try {
      shadcnToast.dismiss();
    } catch (e) {
      console.error('Error al cerrar todas las notificaciones:', e);
    }
    lastToastRef = undefined;
    loadingActive = false;
  },
};

export default notificationService;
