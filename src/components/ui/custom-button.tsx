"use client";

import { Button } from "@/components/ui/button";
import { ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CustomButtonProps extends ButtonProps {
	primary?: boolean;
	secondary?: boolean;
}

export function CustomButton({ children, className, primary, secondary, variant, ...props }: CustomButtonProps) {
	return (
		<Button
			className={cn(
				// Colores personalizados según el tema de MoviCarga
				primary && "bg-[#2d2e83] hover:bg-[#1f1f6f] text-white",
				secondary && "bg-[#ff5722] hover:bg-[#e64a19] text-white",
				className
			)}
			variant={variant || (primary || secondary ? "default" : variant)}
			{...props}>
			{children}
		</Button>
	);
}
