"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function ExampleShadcn() {
	const { toast } = useToast();

	const showToast = () => {
		toast({
			title: "Notificación",
			description: "Esta es una notificación de ejemplo usando shadcn/ui",
			className: "bg-secondary text-white",
		});
	};

	return (
		<div className="container mx-auto py-8">
			<h1 className={cn("text-3xl font-bold mb-6 text-primary")}>Ejemplos de componentes shadcn/ui</h1>

			<div className="space-y-8">
				{/* Ejemplo de Card */}
				<Card className={cn("max-w-md border-primary/20")}>
					<CardHeader className="bg-primary/5">
						<CardTitle className="text-primary">Tarjeta de ejemplo</CardTitle>
						<CardDescription>Una tarjeta usando shadcn/ui para demostración</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor="name">Nombre</Label>
								<Input id="name" placeholder="Ingrese su nombre" className="focus-visible:ring-primary" />
							</div>
							<div className="space-y-2">
								<Label htmlFor="email">Email</Label>
								<Input id="email" type="email" placeholder="ejemplo@correo.com" className="focus-visible:ring-primary" />
							</div>
						</div>
					</CardContent>
					<CardFooter className="flex justify-between">
						<Button variant="outline" className="border-primary text-primary hover:bg-primary/10">
							Cancelar
						</Button>
						<Button className="bg-secondary hover:bg-secondary-dark text-white">Guardar</Button>
					</CardFooter>
				</Card>

				{/* Ejemplo de Table */}
				<Card className={cn("max-w-3xl border-primary/20")}>
					<CardHeader className="bg-primary/5">
						<CardTitle className="text-primary">Tabla de datos</CardTitle>
						<CardDescription>Una tabla con estilos de shadcn/ui</CardDescription>
					</CardHeader>
					<CardContent>
						<Table>
							<TableCaption>Lista de clientes</TableCaption>
							<TableHeader>
								<TableRow className="bg-primary/5">
									<TableHead>ID</TableHead>
									<TableHead>Nombre</TableHead>
									<TableHead>Email</TableHead>
									<TableHead className="text-right">Acciones</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								<TableRow>
									<TableCell>001</TableCell>
									<TableCell>Juan Pérez</TableCell>
									<TableCell>juan@ejemplo.com</TableCell>
									<TableCell className="text-right">
										<Button variant="outline" size="sm" className="border-primary text-primary hover:bg-primary/10">
											Ver
										</Button>
									</TableCell>
								</TableRow>
								<TableRow>
									<TableCell>002</TableCell>
									<TableCell>María López</TableCell>
									<TableCell>maria@ejemplo.com</TableCell>
									<TableCell className="text-right">
										<Button variant="outline" size="sm" className="border-primary text-primary hover:bg-primary/10">
											Ver
										</Button>
									</TableCell>
								</TableRow>
							</TableBody>
						</Table>
					</CardContent>
				</Card>

				{/* Ejemplo de Dialog */}
				<div className="flex space-x-4">
					<Dialog>
						<DialogTrigger asChild>
							<Button className="bg-primary hover:bg-primary-dark text-white">Abrir diálogo</Button>
						</DialogTrigger>
						<DialogContent className="border-primary/20">
							<DialogHeader>
								<DialogTitle className="text-primary">Diálogo de confirmación</DialogTitle>
								<DialogDescription>Este es un diálogo de ejemplo usando shadcn/ui.</DialogDescription>
							</DialogHeader>
							<div className="py-4">¿Está seguro de realizar esta acción?</div>
							<DialogFooter>
								<Button variant="outline" className="border-primary text-primary hover:bg-primary/10">
									Cancelar
								</Button>
								<Button className="bg-secondary hover:bg-secondary-dark text-white">Confirmar</Button>
							</DialogFooter>
						</DialogContent>
					</Dialog>

					{/* Ejemplo de Toast */}
					<Button onClick={showToast} className="bg-accent hover:bg-secondary-dark text-white">
						Mostrar notificación
					</Button>
				</div>
			</div>
		</div>
	);
}
