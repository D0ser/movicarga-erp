"use client";

import { cn } from "@/lib/utils";

interface CustomAlertProps {
	title?: string;
	children: React.ReactNode;
	variant?: "success" | "error" | "warning" | "info";
	className?: string;
	icon?: React.ReactNode;
}

export function CustomAlert({ title, children, variant = "info", className, icon }: CustomAlertProps) {
	// Definir colores basados en el tema personalizado
	const variantStyles = {
		success: "bg-green-50 border-green-500 text-green-700",
		error: "bg-red-50 border-red-500 text-red-700",
		warning: "bg-amber-50 border-amber-500 text-amber-700",
		info: "bg-blue-50 border-blue-500 text-blue-700",
	};

	// Iconos por defecto según el tipo de alerta
	const defaultIcons = {
		success: (
			<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
				<path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
			</svg>
		),
		error: (
			<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
				<path
					fillRule="evenodd"
					d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
					clipRule="evenodd"
				/>
			</svg>
		),
		warning: (
			<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
				<path
					fillRule="evenodd"
					d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
					clipRule="evenodd"
				/>
			</svg>
		),
		info: (
			<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
				<path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z" clipRule="evenodd" />
			</svg>
		),
	};

	const renderIcon = icon || defaultIcons[variant];

	return (
		<div className={cn("border-l-4 p-4 rounded-md flex", variantStyles[variant], className)} role="alert">
			<div className="flex-shrink-0 mr-3">{renderIcon}</div>
			<div>
				{title && <p className="font-bold mb-1">{title}</p>}
				<div>{children}</div>
			</div>
		</div>
	);
}
