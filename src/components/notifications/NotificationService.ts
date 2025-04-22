import { toast as shadcnToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

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
		shadcnToast({
			title: "Éxito",
			description: message,
			variant: "default",
			className: cn("bg-secondary text-white", options.className),
			duration: options.duration || defaultOptions.duration,
		});
	},

	/**
	 * Muestra una notificación de error
	 * @param message Mensaje a mostrar
	 * @param options Opciones adicionales
	 */
	error: (message: string, options: ToastOptions = {}) => {
		shadcnToast({
			title: "Error",
			description: message,
			variant: "destructive",
			duration: options.duration || defaultOptions.duration,
		});
	},

	/**
	 * Muestra una notificación de advertencia
	 * @param message Mensaje a mostrar
	 * @param options Opciones adicionales
	 */
	warning: (message: string, options: ToastOptions = {}) => {
		shadcnToast({
			title: "Advertencia",
			description: message,
			variant: "default",
			className: cn("bg-accent text-white", options.className),
			duration: options.duration || defaultOptions.duration,
		});
	},

	/**
	 * Muestra una notificación informativa
	 * @param message Mensaje a mostrar
	 * @param options Opciones adicionales
	 */
	info: (message: string, options: ToastOptions = {}) => {
		shadcnToast({
			title: "Información",
			description: message,
			variant: "default",
			className: cn("bg-primary text-white", options.className),
			duration: options.duration || defaultOptions.duration,
		});
	},

	/**
	 * Muestra una notificación personalizada
	 * @param message Mensaje a mostrar
	 * @param options Opciones adicionales
	 */
	custom: (message: string, options: ToastOptions = {}) => {
		shadcnToast({
			description: message,
			className: options.className,
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
