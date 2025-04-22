"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

// Definimos el esquema de validación
const formSchema = z.object({
	nombre: z.string().min(2, {
		message: "El nombre debe tener al menos 2 caracteres.",
	}),
	tipoCliente: z.string({
		required_error: "Por favor selecciona un tipo de cliente.",
	}),
	email: z.string().email({
		message: "Por favor ingresa un email válido.",
	}),
	activo: z.boolean(),
});

export function ModalExample() {
	const [open, setOpen] = useState(false);

	// Inicializamos el formulario
	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			nombre: "",
			tipoCliente: "",
			email: "",
			activo: true,
		},
	});

	// Función para manejar el envío del formulario
	function onSubmit(values: z.infer<typeof formSchema>) {
		console.log(values);
		setOpen(false);
		// Aquí es donde enviarías los datos a tu backend
	}

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button variant="default">Nuevo Cliente</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>Crear nuevo cliente</DialogTitle>
					<DialogDescription>Completa la información para agregar un nuevo cliente al sistema.</DialogDescription>
				</DialogHeader>

				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
						<FormField
							control={form.control}
							name="nombre"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Nombre</FormLabel>
									<FormControl>
										<Input placeholder="Nombre del cliente" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="tipoCliente"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Tipo de Cliente</FormLabel>
									<Select onValueChange={field.onChange} defaultValue={field.value}>
										<FormControl>
											<SelectTrigger>
												<SelectValue placeholder="Selecciona un tipo" />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											<SelectItem value="empresa">Empresa</SelectItem>
											<SelectItem value="persona">Persona</SelectItem>
											<SelectItem value="distribuidor">Distribuidor</SelectItem>
										</SelectContent>
									</Select>
									<FormDescription>El tipo de cliente determina las condiciones comerciales.</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="email"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Email</FormLabel>
									<FormControl>
										<Input placeholder="email@ejemplo.com" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="activo"
							render={({ field }) => (
								<FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
									<FormControl>
										<Checkbox checked={field.value} onCheckedChange={field.onChange} />
									</FormControl>
									<div className="space-y-1 leading-none">
										<FormLabel>Cliente Activo</FormLabel>
										<FormDescription>Marca esta casilla para activar el cliente en el sistema.</FormDescription>
									</div>
								</FormItem>
							)}
						/>

						<DialogFooter>
							<Button type="submit">Guardar cliente</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
