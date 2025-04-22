"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { Pencil, Trash, Check, X, MoreVertical, Copy, Eye } from "lucide-react";

// Re-exportar iconos Lucide para uso consistente
export { Pencil, Trash, Check, X, MoreVertical, Copy, Eye };

interface ActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: "edit" | "delete" | "activate" | "deactivate" | "view" | "copy" | "custom";
	size?: "sm" | "md" | "icon";
	title?: string;
	icon?: React.ReactNode;
}

export function ActionButton({ variant = "custom", size = "icon", title, icon, className, children, ...props }: ActionButtonProps) {
	// Configuración por defecto según el tipo de acción
	const getVariantConfig = () => {
		switch (variant) {
			case "edit":
				return {
					buttonVariant: "outline",
					buttonClassName: "hover:bg-blue-50 hover:text-blue-600 border-blue-200",
					icon: <Pencil className="h-4 w-4" />,
					title: "Editar",
				};
			case "delete":
				return {
					buttonVariant: "outline",
					buttonClassName: "hover:bg-red-50 hover:text-red-600 border-red-200",
					icon: <Trash className="h-4 w-4" />,
					title: "Eliminar",
				};
			case "activate":
				return {
					buttonVariant: "outline",
					buttonClassName: "hover:bg-green-50 hover:text-green-600 border-green-200",
					icon: <Check className="h-4 w-4" />,
					title: "Activar",
				};
			case "deactivate":
				return {
					buttonVariant: "outline",
					buttonClassName: "hover:bg-amber-50 hover:text-amber-600 border-amber-200",
					icon: <X className="h-4 w-4" />,
					title: "Desactivar",
				};
			case "view":
				return {
					buttonVariant: "outline",
					buttonClassName: "hover:bg-indigo-50 hover:text-indigo-600 border-indigo-200",
					icon: <Eye className="h-4 w-4" />,
					title: "Ver detalles",
				};
			case "copy":
				return {
					buttonVariant: "outline",
					buttonClassName: "hover:bg-purple-50 hover:text-purple-600 border-purple-200",
					icon: <Copy className="h-4 w-4" />,
					title: "Duplicar",
				};
			default:
				return {
					buttonVariant: "outline",
					buttonClassName: "",
					icon: icon,
					title: title,
				};
		}
	};

	const config = getVariantConfig();
	const buttonTitle = title || config.title;
	const buttonIcon = icon || config.icon;

	return (
		<Button variant={config.buttonVariant as any} size={size === "icon" ? "icon" : size === "sm" ? "sm" : "default"} className={cn(config.buttonClassName, className)} title={buttonTitle} {...props}>
			{buttonIcon}
			{children && <span className={`${size === "icon" ? "sr-only" : ""}`}>{children}</span>}
		</Button>
	);
}

export function ActionButtonGroup({ children, className }: { children: React.ReactNode; className?: string }) {
	return <div className={cn("flex items-center gap-2", className)}>{children}</div>;
}
