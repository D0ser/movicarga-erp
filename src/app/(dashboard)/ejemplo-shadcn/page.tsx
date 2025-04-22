"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ModalExample } from "@/components/ModalExample";
import { TableExample } from "@/components/TableExample";
import { FormExample } from "@/components/FormExample";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

export default function EjemploShadcnPage() {
	return (
		<div className="container mx-auto py-10 space-y-6">
			<div className="flex justify-between">
				<h1 className={cn("text-3xl font-bold text-primary")}>Componentes Shadcn UI</h1>
			</div>

			<Alert className={cn("border-primary/30 bg-primary/5")}>
				<Info className="h-4 w-4 text-primary" />
				<AlertTitle className="text-primary">Información</AlertTitle>
				<AlertDescription>Esta página muestra ejemplos de los componentes de UI basados en shadcn/ui implementados en el proyecto.</AlertDescription>
			</Alert>

			<Tabs defaultValue="modal">
				<TabsList className={cn("grid w-full grid-cols-3 bg-primary/10")}>
					<TabsTrigger value="modal" className={cn("data-[state=active]:bg-primary data-[state=active]:text-white")}>
						Modal con Form
					</TabsTrigger>
					<TabsTrigger value="table" className={cn("data-[state=active]:bg-primary data-[state=active]:text-white")}>
						DataTable
					</TabsTrigger>
					<TabsTrigger value="form" className={cn("data-[state=active]:bg-primary data-[state=active]:text-white")}>
						Form
					</TabsTrigger>
				</TabsList>

				<TabsContent value="modal" className="mt-6">
					<Card className={cn("border-primary/20")}>
						<CardHeader className="bg-primary/5">
							<CardTitle className="text-primary">Modal con Formulario</CardTitle>
							<CardDescription>Ejemplo de un modal que contiene un formulario con validación.</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="flex justify-center p-4">
								<ModalExample />
							</div>
						</CardContent>
						<CardFooter className="flex justify-between bg-muted/20">
							<p className="text-sm text-muted-foreground">Implementado con Dialog, Form y React Hook Form + Zod para validación.</p>
						</CardFooter>
					</Card>
				</TabsContent>

				<TabsContent value="table" className="mt-6">
					<Card className={cn("border-primary/20")}>
						<CardHeader className="bg-primary/5">
							<CardTitle className="text-primary">DataTable Avanzada</CardTitle>
							<CardDescription>Tabla con funcionalidades avanzadas como ordenación, filtrado, paginación y acciones por fila.</CardDescription>
						</CardHeader>
						<CardContent>
							<TableExample />
						</CardContent>
						<CardFooter className="flex justify-between bg-muted/20">
							<p className="text-sm text-muted-foreground">Implementado con TanStack Table (react-table v8) y componentes de UI shadcn.</p>
						</CardFooter>
					</Card>
				</TabsContent>

				<TabsContent value="form" className="mt-6">
					<Card className={cn("border-primary/20")}>
						<CardHeader className="bg-primary/5">
							<CardTitle className="text-primary">Formulario con Validación</CardTitle>
							<CardDescription>Ejemplo de formulario con distintos tipos de campos y validación.</CardDescription>
						</CardHeader>
						<CardContent className="space-y-6">
							<FormExample />
						</CardContent>
						<CardFooter className="flex justify-between bg-muted/20">
							<p className="text-sm text-muted-foreground">Implementado con React Hook Form y Zod para validación de esquemas.</p>
						</CardFooter>
					</Card>
				</TabsContent>
			</Tabs>

			<Alert variant="destructive" className={cn("border-secondary/30 bg-secondary/5")}>
				<AlertTriangle className="h-4 w-4 text-secondary" />
				<AlertTitle className="text-secondary-dark">Aviso Importante</AlertTitle>
				<AlertDescription>Estos componentes están diseñados para ser utilizados en todo el proyecto, reemplazando las implementaciones anteriores.</AlertDescription>
			</Alert>
		</div>
	);
}
