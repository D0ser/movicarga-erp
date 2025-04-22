"use client";

import React, { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal, Pencil, Trash } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { DataTable } from "@/components/ui/data-table/data-table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Define el tipo para tus datos
interface Cliente {
	id: string;
	nombre: string;
	email: string;
	tipoCliente: string;
	estado: "activo" | "inactivo";
	fechaCreacion: string;
}

export function TableExample() {
	// Datos de ejemplo
	const data: Cliente[] = [
		{
			id: "1",
			nombre: "Empresa XYZ S.A.C.",
			email: "contacto@empresaxyz.com",
			tipoCliente: "empresa",
			estado: "activo",
			fechaCreacion: "2023-01-15",
		},
		{
			id: "2",
			nombre: "Juan Perez",
			email: "juan.perez@mail.com",
			tipoCliente: "persona",
			estado: "activo",
			fechaCreacion: "2023-02-20",
		},
		{
			id: "3",
			nombre: "Distribuidora Central",
			email: "ventas@discentral.com",
			tipoCliente: "distribuidor",
			estado: "inactivo",
			fechaCreacion: "2023-03-10",
		},
		{
			id: "4",
			nombre: "María Gómez",
			email: "maria.gomez@mail.com",
			tipoCliente: "persona",
			estado: "activo",
			fechaCreacion: "2023-04-05",
		},
		{
			id: "5",
			nombre: "Corporación ABC",
			email: "info@corpabc.com",
			tipoCliente: "empresa",
			estado: "inactivo",
			fechaCreacion: "2023-05-12",
		},
	];

	// Función para manejar acciones en las filas
	const handleRowAction = (row: Cliente, action: string) => {
		switch (action) {
			case "edit":
				console.log("Editar cliente:", row);
				// Implementa la lógica para editar
				break;
			case "delete":
				console.log("Eliminar cliente:", row);
				// Implementa la lógica para eliminar
				break;
			default:
				break;
		}
	};

	// Definición de columnas
	const columns: ColumnDef<Cliente>[] = [
		{
			id: "select",
			header: ({ table }) => (
				<Checkbox
					checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
					onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
					aria-label="Seleccionar todo"
					className={cn("data-[state=checked]:bg-primary data-[state=checked]:border-primary")}
				/>
			),
			cell: ({ row }) => (
				<Checkbox
					checked={row.getIsSelected()}
					onCheckedChange={(value) => row.toggleSelected(!!value)}
					aria-label="Seleccionar fila"
					className={cn("data-[state=checked]:bg-primary data-[state=checked]:border-primary")}
				/>
			),
			enableSorting: false,
			enableHiding: false,
		},
		{
			accessorKey: "nombre",
			header: ({ column }) => {
				return (
					<Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className={cn("hover:text-primary hover:bg-primary/10")}>
						Nombre
						<ArrowUpDown className="ml-2 h-4 w-4" />
					</Button>
				);
			},
		},
		{
			accessorKey: "email",
			header: "Email",
		},
		{
			accessorKey: "tipoCliente",
			header: "Tipo",
			cell: ({ row }) => {
				const value = row.getValue("tipoCliente") as string;
				let label = "";
				let className = "";

				switch (value) {
					case "empresa":
						label = "Empresa";
						className = "bg-primary text-white";
						break;
					case "persona":
						label = "Persona";
						className = "bg-secondary text-white";
						break;
					case "distribuidor":
						label = "Distribuidor";
						className = "bg-accent text-white";
						break;
					default:
						label = value;
				}

				return <Badge className={cn(className)}>{label}</Badge>;
			},
		},
		{
			accessorKey: "estado",
			header: "Estado",
			cell: ({ row }) => {
				const estado = row.getValue("estado") as string;
				return <Badge className={cn(estado === "activo" ? "bg-green-500 hover:bg-green-600 text-white" : "bg-destructive text-white")}>{estado === "activo" ? "Activo" : "Inactivo"}</Badge>;
			},
		},
		{
			accessorKey: "fechaCreacion",
			header: "Fecha",
			cell: ({ row }) => {
				// Formatear la fecha si es necesario
				const value = row.getValue("fechaCreacion") as string;
				const date = new Date(value);
				return date.toLocaleDateString("es-ES");
			},
		},
		{
			id: "acciones",
			cell: ({ row }) => {
				const cliente = row.original;

				return (
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="ghost" className={cn("h-8 w-8 p-0 hover:bg-primary/10")}>
								<span className="sr-only">Abrir menú</span>
								<MoreHorizontal className="h-4 w-4" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="border-primary/20">
							<DropdownMenuLabel className="text-primary">Acciones</DropdownMenuLabel>
							<DropdownMenuItem onClick={() => handleRowAction(cliente, "edit")} className={cn("hover:bg-primary/10 cursor-pointer")}>
								<Pencil className="mr-2 h-4 w-4 text-primary" />
								Editar
							</DropdownMenuItem>
							<DropdownMenuSeparator />
							<DropdownMenuItem onClick={() => handleRowAction(cliente, "delete")} className={cn("text-destructive hover:bg-destructive/10 cursor-pointer")}>
								<Trash className="mr-2 h-4 w-4" />
								Eliminar
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				);
			},
		},
	];

	return (
		<div className="container mx-auto py-10">
			<DataTable
				columns={columns}
				data={data}
				title="Gestión de Clientes"
				description="Lista de todos los clientes registrados en el sistema"
				searchKey="nombre"
				searchPlaceholder="Buscar por nombre..."
				onRowAction={handleRowAction}
				filterableColumns={[
					{
						id: "tipoCliente",
						title: "Tipo de Cliente",
						options: [
							{ label: "Empresa", value: "empresa" },
							{ label: "Persona", value: "persona" },
							{ label: "Distribuidor", value: "distribuidor" },
						],
					},
					{
						id: "estado",
						title: "Estado",
						options: [
							{ label: "Activo", value: "activo" },
							{ label: "Inactivo", value: "inactivo" },
						],
					},
				]}
				enableExport={true}
				enablePagination={true}
				enableColumnToggle={true}
			/>
		</div>
	);
}
