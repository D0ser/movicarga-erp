import { toast, ToastOptions } from "react-toastify";

// Configuración predeterminada de las notificaciones
const defaultOptions: ToastOptions = {
	position: "top-right",
	autoClose: 3000,
	hideProgressBar: false,
	closeOnClick: true,
	pauseOnHover: true,
	draggable: true,
};

// Servicio de notificaciones
const notificationService = {
	/**
	 * Muestra una notificación de éxito
	 * @param message Mensaje a mostrar
	 * @param options Opciones adicionales
	 */
	success: (message: string, options: ToastOptions = {}) => {
		toast.success(message, { ...defaultOptions, ...options });
	},

	/**
	 * Muestra una notificación de error
	 * @param message Mensaje a mostrar
	 * @param options Opciones adicionales
	 */
	error: (message: string, options: ToastOptions = {}) => {
		toast.error(message, { ...defaultOptions, ...options });
	},

	/**
	 * Muestra una notificación de advertencia
	 * @param message Mensaje a mostrar
	 * @param options Opciones adicionales
	 */
	warning: (message: string, options: ToastOptions = {}) => {
		toast.warning(message, { ...defaultOptions, ...options });
	},

	/**
	 * Muestra una notificación informativa
	 * @param message Mensaje a mostrar
	 * @param options Opciones adicionales
	 */
	info: (message: string, options: ToastOptions = {}) => {
		toast.info(message, { ...defaultOptions, ...options });
	},

	/**
	 * Muestra una notificación personalizada
	 * @param message Mensaje a mostrar
	 * @param options Opciones adicionales
	 */
	custom: (message: string, options: ToastOptions = {}) => {
		toast(message, { ...defaultOptions, ...options });
	},

	/**
	 * Cierra todas las notificaciones
	 */
	closeAll: () => {
		toast.dismiss();
	},
};

export default notificationService;
