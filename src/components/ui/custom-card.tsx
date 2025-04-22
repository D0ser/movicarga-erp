"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// Exportamos nuevamente los componentes originales para usarlos directamente
export { CardContent, CardDescription, CardFooter, CardHeader, CardTitle };

interface CustomCardProps extends React.HTMLAttributes<HTMLDivElement> {
	withShadow?: boolean;
	bordered?: boolean;
}

export function CustomCard({ children, className, withShadow = true, bordered = false, ...props }: CustomCardProps) {
	return (
		<Card
			className={cn(
				// Aplicamos sombras y bordes personalizados
				withShadow && "shadow-md hover:shadow-lg transition-shadow duration-200",
				bordered && "border-[#2d2e83]/10",
				"bg-card",
				className
			)}
			{...props}>
			{children}
		</Card>
	);
}
