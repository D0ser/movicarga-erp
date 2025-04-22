"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
	label: string;
	error?: string;
	containerClassName?: string;
	labelClassName?: string;
	errorClassName?: string;
}

export function FormField({ label, error, id, containerClassName, labelClassName, errorClassName, className, ...props }: FormFieldProps) {
	return (
		<div className={cn("space-y-2", containerClassName)}>
			<Label htmlFor={id} className={cn("text-sm font-medium text-gray-700", error && "text-destructive", labelClassName)}>
				{label}
			</Label>
			<Input id={id} className={cn(error && "border-destructive", className)} {...props} />
			{error && <p className={cn("text-sm text-destructive", errorClassName)}>{error}</p>}
		</div>
	);
}
