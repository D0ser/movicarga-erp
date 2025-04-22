"use client";

import { useState } from "react";
import { CustomCard, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/custom-card";
import { CustomButton } from "@/components/ui/custom-button";
import { CustomAlert } from "@/components/ui/custom-alert";
import { FormField } from "@/components/ui/form-field";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface DashboardItem {
	id: string;
	nombre: string;
	fecha: string;
	monto: number;
	estado: string;
}

export default function DashboardExample() {
	const { toast } = useToast();
	const [items, setItems] = useState<DashboardItem[]>([
		{ id: "001", nombre: "Viaje Lima-Arequipa", fecha: "2023-05-15", monto: 1500, estado: "Completado" },
		{ id: "002", nombre: "Viaje Lima-Trujillo", fecha: "2023-05-18", monto: 1200, estado: "En progreso" },
		{ id: "003", nombre: "Viaje Lima-Chiclayo", fecha: "2023-05-20", monto: 1300, estado: "Pendiente" },
	]);

	const [formData, setFormData] = useState({
		nombre: "",
		fecha: "",
		monto: "",
	});

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		// Simular agregar un nuevo item
		const newItem: DashboardItem = {
			id: `00${items.length + 1}`,
			nombre: formData.nombre,
			fecha: formData.fecha,
			monto: parseFloat(formData.monto),
			estado: "Pendiente",
		};

		setItems((prev) => [...prev, newItem]);
		setFormData({ nombre: "", fecha: "", monto: "" });

		toast({
			title: "Éxito",
			description: "Nuevo registro agregado correctamente",
		});
	};

	return (
		<div className="space-y-6">
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				{/* Tarjeta de estadísticas 1 */}
				<CustomCard>
					<CardHeader>
						<CardTitle>Total Viajes</CardTitle>
						<CardDescription>Viajes registrados</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="text-3xl font-bold">{items.length}</div>
					</CardContent>
				</CustomCard>

				{/* Tarjeta de estadísticas 2 */}
				<CustomCard>
					<CardHeader>
						<CardTitle>Monto Total</CardTitle>
						<CardDescription>Suma de todos los viajes</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="text-3xl font-bold">S/ {items.reduce((acc, item) => acc + item.monto, 0).toFixed(2)}</div>
					</CardContent>
				</CustomCard>

				{/* Tarjeta de estadísticas 3 */}
				<CustomCard>
					<CardHeader>
						<CardTitle>Viajes Completados</CardTitle>
						<CardDescription>Total de viajes completados</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="text-3xl font-bold">{items.filter((item) => item.estado === "Completado").length}</div>
					</CardContent>
				</CustomCard>
			</div>

			{/* Formulario y tabla */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
				<CustomCard className="md:col-span-1">
					<CardHeader>
						<CardTitle>Agregar Viaje</CardTitle>
						<CardDescription>Ingrese los datos del nuevo viaje</CardDescription>
					</CardHeader>
					<CardContent>
						<form onSubmit={handleSubmit} className="space-y-4">
							<FormField label="Nombre" id="nombre" name="nombre" value={formData.nombre} onChange={handleInputChange} placeholder="Ej: Lima-Arequipa" required />

							<FormField label="Fecha" id="fecha" name="fecha" type="date" value={formData.fecha} onChange={handleInputChange} required />

							<FormField label="Monto" id="monto" name="monto" type="number" value={formData.monto} onChange={handleInputChange} placeholder="0.00" required />

							<CustomButton primary type="submit" className="w-full">
								Agregar Viaje
							</CustomButton>
						</form>
					</CardContent>
				</CustomCard>

				<CustomCard className="md:col-span-2">
					<CardHeader>
						<CardTitle>Viajes Recientes</CardTitle>
						<CardDescription>Lista de los últimos viajes registrados</CardDescription>
					</CardHeader>
					<CardContent>
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>ID</TableHead>
									<TableHead>Nombre</TableHead>
									<TableHead>Fecha</TableHead>
									<TableHead>Monto</TableHead>
									<TableHead>Estado</TableHead>
									<TableHead className="text-right">Acciones</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{items.map((item) => (
									<TableRow key={item.id}>
										<TableCell>{item.id}</TableCell>
										<TableCell>{item.nombre}</TableCell>
										<TableCell>{item.fecha}</TableCell>
										<TableCell>S/ {item.monto.toFixed(2)}</TableCell>
										<TableCell>
											<span
												className={`px-2 py-1 rounded-full text-xs font-medium ${
													item.estado === "Completado" ? "bg-green-100 text-green-800" : item.estado === "En progreso" ? "bg-blue-100 text-blue-800" : "bg-amber-100 text-amber-800"
												}`}>
												{item.estado}
											</span>
										</TableCell>
										<TableCell className="text-right">
											<Dialog>
												<DialogTrigger asChild>
													<CustomButton variant="ghost" size="sm">
														Ver
													</CustomButton>
												</DialogTrigger>
												<DialogContent>
													<DialogHeader>
														<DialogTitle>Detalles del Viaje</DialogTitle>
														<DialogDescription>Información completa del viaje seleccionado</DialogDescription>
													</DialogHeader>
													<div className="space-y-4 py-4">
														<div className="grid grid-cols-2 gap-2">
															<div>
																<p className="text-sm font-medium text-gray-500">ID</p>
																<p>{item.id}</p>
															</div>
															<div>
																<p className="text-sm font-medium text-gray-500">Nombre</p>
																<p>{item.nombre}</p>
															</div>
															<div>
																<p className="text-sm font-medium text-gray-500">Fecha</p>
																<p>{item.fecha}</p>
															</div>
															<div>
																<p className="text-sm font-medium text-gray-500">Monto</p>
																<p>S/ {item.monto.toFixed(2)}</p>
															</div>
															<div>
																<p className="text-sm font-medium text-gray-500">Estado</p>
																<p>{item.estado}</p>
															</div>
														</div>
													</div>
													<DialogFooter>
														<CustomButton
															onClick={() =>
																toast({
																	title: "Acción realizada",
																	description: "Operación completada con éxito",
																})
															}
															primary>
															Aceptar
														</CustomButton>
													</DialogFooter>
												</DialogContent>
											</Dialog>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</CardContent>
				</CustomCard>
			</div>

			{/* Mensajes de alerta */}
			<div className="space-y-4">
				<CustomAlert variant="info" title="Información">
					Este es un ejemplo de cómo integrar los componentes de shadcn/ui en el proyecto MoviCarga ERP.
				</CustomAlert>

				<CustomAlert variant="success" title="Sugerencia">
					Para implementar estos componentes en todo el proyecto, reemplace gradualmente los elementos de UI existentes.
				</CustomAlert>
			</div>
		</div>
	);
}
