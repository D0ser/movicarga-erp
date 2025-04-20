import toast from "react-hot-toast";

interface ToastOptions {
	duration?: number;
	position?: "top-left" | "top-center" | "top-right" | "bottom-left" | "bottom-center" | "bottom-right";
}

const defaultOptions: ToastOptions = {
	duration: 4000,
	position: "top-right",
};

export const showToast = {
	success: (message: string, options?: ToastOptions) => {
		return toast.success(message, { ...defaultOptions, ...options });
	},
	error: (message: string, options?: ToastOptions) => {
		return toast.error(message, { ...defaultOptions, ...options });
	},
	loading: (message: string, options?: ToastOptions) => {
		return toast.loading(message, { ...defaultOptions, ...options });
	},
	dismiss: (toastId?: string) => {
		if (toastId) {
			toast.dismiss(toastId);
		} else {
			toast.dismiss();
		}
	},
	custom: (message: string, options?: ToastOptions) => {
		return toast(message, { ...defaultOptions, ...options });
	},
};

export default showToast;
