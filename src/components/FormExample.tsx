"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { format } from "date-fns";

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// Definir el esquema de validación con Zod
const formSchema = z.object({
	nombre: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
	email: z.string().email("Correo electrónico inválido"),
	tipo: z.string().min(1, "Debes seleccionar un tipo"),
	fecha: z.date({
		required_error: "Selecciona una fecha",
	}),
	descripcion: z.string().optional(),
	activo: z.boolean(),
});

// Tipo inferido del esquema
type FormValues = z.infer<typeof formSchema>;

export function FormExample() {
	// Inicializa el formulario con React Hook Form y Zod
	const form = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			nombre: "",
			email: "",
			tipo: "",
			descripcion: "",
			activo: false,
			fecha: new Date(),
		},
	});

	// Función para manejar el envío del formulario
	function onSubmit(values: FormValues) {
		console.log(values);
		// Aquí procesarías los datos, por ejemplo enviándolos a una API
	}

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
				<FormField
					control={form.control}
					name="nombre"
					render={({ field }) => (
						<FormItem>
							<FormLabel className="text-primary">Nombre</FormLabel>
							<FormControl>
								<Input placeholder="Ingresa tu nombre" {...field} className={cn("focus-visible:ring-primary")} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="email"
					render={({ field }) => (
						<FormItem>
							<FormLabel className="text-primary">Correo electrónico</FormLabel>
							<FormControl>
								<Input placeholder="correo@ejemplo.com" {...field} className={cn("focus-visible:ring-primary")} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="tipo"
					render={({ field }) => (
						<FormItem>
							<FormLabel className="text-primary">Tipo</FormLabel>
							<Select onValueChange={field.onChange} defaultValue={field.value}>
								<FormControl>
									<SelectTrigger className={cn("focus-visible:ring-primary")}>
										<SelectValue placeholder="Selecciona un tipo" />
									</SelectTrigger>
								</FormControl>
								<SelectContent>
									<SelectItem value="personal">Personal</SelectItem>
									<SelectItem value="empresa">Empresa</SelectItem>
									<SelectItem value="otro">Otro</SelectItem>
								</SelectContent>
							</Select>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="fecha"
					render={({ field }) => (
						<FormItem className="flex flex-col">
							<FormLabel className="text-primary">Fecha</FormLabel>
							<Popover>
								<PopoverTrigger asChild>
									<FormControl>
										<Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal border-input focus-visible:ring-primary", !field.value && "text-muted-foreground")}>
											{field.value ? format(field.value, "PPP") : <span>Selecciona una fecha</span>}
											<CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
										</Button>
									</FormControl>
								</PopoverTrigger>
								<PopoverContent className="w-auto p-0" align="start">
									<Calendar
										mode="single"
										selected={field.value}
										onSelect={field.onChange}
										initialFocus
										className={cn("rounded-md border border-input")}
										classNames={{
											day_selected: "bg-primary text-primary-foreground",
											day_today: "bg-accent text-accent-foreground",
										}}
									/>
								</PopoverContent>
							</Popover>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="descripcion"
					render={({ field }) => (
						<FormItem>
							<FormLabel className="text-primary">Descripción</FormLabel>
							<FormControl>
								<Textarea placeholder="Ingresa una descripción (opcional)" className={cn("min-h-[100px] focus-visible:ring-primary")} {...field} />
							</FormControl>
							<FormDescription>Puedes incluir detalles adicionales aquí.</FormDescription>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="activo"
					render={({ field }) => (
						<FormItem className={cn("flex flex-row items-start space-x-3 space-y-0 rounded-md border border-primary/20 p-4")}>
							<FormControl>
								<Checkbox checked={field.value} onCheckedChange={field.onChange} className={cn("data-[state=checked]:bg-primary data-[state=checked]:border-primary")} />
							</FormControl>
							<div className="space-y-1 leading-none">
								<FormLabel className="text-primary">Activo</FormLabel>
								<FormDescription>Marca esta casilla para activar el elemento.</FormDescription>
							</div>
						</FormItem>
					)}
				/>

				<Button type="submit" className={cn("bg-secondary hover:bg-secondary-dark text-white")}>
					Enviar
				</Button>
			</form>
		</Form>
	);
}
