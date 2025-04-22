"use client";

import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CustomCard, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/custom-card";
import { CustomButton } from "@/components/ui/custom-button";
import { FormField } from "@/components/ui/form-field";
import { CustomAlert } from "@/components/ui/custom-alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Cliente {
	id: string;
	razon_social: string;
	tipo: string;
}

interface Conductor {
	id: string;
	nombres: string;
	apellidos: string;
}

interface Vehiculo {
	id: string;
	placa: string;
	marca: string;
	modelo: string;
}

interface Viaje {
	id: string;
	cliente_id: string;
	cliente?: Cliente;
	conductor_id: string;
	conductor?: Conductor;
	vehiculo_id: string;
	vehiculo?: Vehiculo;
	origen: string;
	destino: string;
	fecha_salida: string;
	fecha_llegada: string | null;
	estado: string;
	tarifa: number;
	adelanto: number;
	saldo: number;
	detraccion: boolean;
	carga: string;
	peso: number;
	observaciones?: string;
}

interface ViajesTableProps {
	viajes: Viaje[];
	clientes: Cliente[];
	conductores: Conductor[];
	vehiculos: Vehiculo[];
	onViajeCreated?: (viaje: Viaje) => void;
	onViajeEdited?: (viaje: Viaje) => void;
	onViajeDeleted?: (id: string) => void;
	loading?: boolean;
}

export default function ViajesTable({ viajes = [], clientes = [], conductores = [], vehiculos = [], onViajeCreated, onViajeEdited, onViajeDeleted, loading = false }: ViajesTableProps) {
	const { toast } = useToast();
	const [searchTerm, setSearchTerm] = useState("");
	const [filteredViajes, setFilteredViajes] = useState<Viaje[]>(viajes);
	const [selectedViaje, setSelectedViaje] = useState<Viaje | null>(null);
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [formData, setFormData] = useState<Partial<Viaje>>({
		cliente_id: "",
		conductor_id: "",
		vehiculo_id: "",
		origen: "",
		destino: "",
		fecha_salida: new Date().toISOString().split("T")[0],
		estado: "Programado",
		tarifa: 0,
		adelanto: 0,
		saldo: 0,
		carga: "",
		peso: 0,
		detraccion: false,
	});

	// Filtrar viajes según el término de búsqueda
	const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;
		setSearchTerm(value);

		if (!value.trim()) {
			setFilteredViajes(viajes);
			return;
		}

		const term = value.toLowerCase();
		const filtered = viajes.filter(
			(viaje) =>
				(viaje.cliente?.razon_social || "").toLowerCase().includes(term) ||
				(viaje.origen || "").toLowerCase().includes(term) ||
				(viaje.destino || "").toLowerCase().includes(term) ||
				(viaje.conductor?.nombres || "").toLowerCase().includes(term) ||
				(viaje.conductor?.apellidos || "").toLowerCase().includes(term) ||
				(viaje.vehiculo?.placa || "").toLowerCase().includes(term) ||
				(viaje.estado || "").toLowerCase().includes(term)
		);

		setFilteredViajes(filtered);
	};

	// Obtener el nombre del cliente por su ID
	const getClienteNombre = (id: string) => {
		const cliente = clientes.find((c) => c.id === id);
		return cliente ? cliente.razon_social : "Sin cliente";
	};

	// Obtener el nombre del conductor por su ID
	const getConductorNombre = (id: string) => {
		const conductor = conductores.find((c) => c.id === id);
		return conductor ? `${conductor.nombres} ${conductor.apellidos}` : "Sin conductor";
	};

	// Obtener la placa del vehículo por su ID
	const getVehiculoPlaca = (id: string) => {
		const vehiculo = vehiculos.find((v) => v.id === id);
		return vehiculo ? vehiculo.placa : "Sin vehículo";
	};

	// Manejar cambios en el formulario
	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		const { name, value, type } = e.target;

		if (type === "checkbox") {
			const checked = (e.target as HTMLInputElement).checked;
			setFormData((prev) => ({ ...prev, [name]: checked }));
		} else if (type === "number") {
			setFormData((prev) => ({ ...prev, [name]: parseFloat(value) || 0 }));
		} else {
			setFormData((prev) => ({ ...prev, [name]: value }));
		}

		// Calcular saldo automáticamente
		if (name === "tarifa" || name === "adelanto") {
			const tarifa = name === "tarifa" ? parseFloat(value) || 0 : formData.tarifa || 0;

			const adelanto = name === "adelanto" ? parseFloat(value) || 0 : formData.adelanto || 0;

			setFormData((prev) => ({
				...prev,
				saldo: tarifa - adelanto,
			}));
		}
	};

	// Abrir el formulario para crear un nuevo viaje
	const handleNuevoViaje = () => {
		setFormData({
			cliente_id: "",
			conductor_id: "",
			vehiculo_id: "",
			origen: "",
			destino: "",
			fecha_salida: new Date().toISOString().split("T")[0],
			estado: "Programado",
			tarifa: 0,
			adelanto: 0,
			saldo: 0,
			carga: "",
			peso: 0,
			detraccion: false,
		});
		setSelectedViaje(null);
		setIsDialogOpen(true);
	};

	// Abrir el formulario para editar un viaje existente
	const handleEditarViaje = (viaje: Viaje) => {
		setSelectedViaje(viaje);
		setFormData({
			...viaje,
			fecha_salida: viaje.fecha_salida?.split("T")[0] || new Date().toISOString().split("T")[0],
			fecha_llegada: viaje.fecha_llegada?.split("T")[0] || "",
		});
		setIsDialogOpen(true);
	};

	// Eliminar un viaje
	const handleEliminarViaje = (id: string) => {
		if (confirm("¿Está seguro de eliminar este viaje?")) {
			if (onViajeDeleted) {
				onViajeDeleted(id);
				toast({
					title: "Viaje eliminado",
					description: "El viaje ha sido eliminado correctamente",
				});
			}
		}
	};

	// Guardado del formulario
	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		// Validación básica
		if (!formData.cliente_id || !formData.conductor_id || !formData.vehiculo_id) {
			toast({
				title: "Error de validación",
				description: "Debe completar todos los campos requeridos",
				variant: "destructive",
			});
			return;
		}

		// Si estamos editando o creando
		if (selectedViaje) {
			// Editar viaje existente
			if (onViajeEdited) {
				onViajeEdited({
					...selectedViaje,
					...(formData as Viaje),
				});
				toast({
					title: "Viaje actualizado",
					description: "El viaje ha sido actualizado correctamente",
				});
			}
		} else {
			// Crear nuevo viaje
			if (onViajeCreated) {
				// En una aplicación real, se generaría el ID en el backend
				const newViaje: Viaje = {
					...(formData as Viaje),
					id: `temp-${Date.now()}`,
				};
				onViajeCreated(newViaje);
				toast({
					title: "Viaje creado",
					description: "El viaje ha sido creado correctamente",
				});
			}
		}

		setIsDialogOpen(false);
	};

	return (
		<div className="space-y-4">
			{/* Header con búsqueda y botón para nuevo viaje */}
			<div className="flex flex-col md:flex-row items-center justify-between gap-4">
				<div className="w-full md:w-1/3">
					<Input placeholder="Buscar viajes..." value={searchTerm} onChange={handleSearch} className="w-full" />
				</div>
				<CustomButton primary onClick={handleNuevoViaje}>
					Nuevo Viaje
				</CustomButton>
			</div>

			{/* Tabla de viajes */}
			<CustomCard>
				<CardHeader>
					<CardTitle>Viajes</CardTitle>
					<CardDescription>Listado de viajes registrados en el sistema</CardDescription>
				</CardHeader>
				<CardContent>
					{loading ? (
						<div className="flex justify-center items-center p-8">
							<div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
						</div>
					) : filteredViajes.length === 0 ? (
						<CustomAlert variant="info" title="Sin resultados">
							No se encontraron viajes con los criterios de búsqueda.
						</CustomAlert>
					) : (
						<div className="rounded-md border overflow-hidden">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Cliente</TableHead>
										<TableHead>Origen - Destino</TableHead>
										<TableHead>Conductor</TableHead>
										<TableHead>Vehículo</TableHead>
										<TableHead>Fecha</TableHead>
										<TableHead>Estado</TableHead>
										<TableHead className="text-right">Acciones</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{(searchTerm ? filteredViajes : viajes).map((viaje) => (
										<TableRow key={viaje.id}>
											<TableCell className="font-medium">{viaje.cliente?.razon_social || getClienteNombre(viaje.cliente_id)}</TableCell>
											<TableCell>
												{viaje.origen} → {viaje.destino}
											</TableCell>
											<TableCell>{viaje.conductor?.nombres ? `${viaje.conductor.nombres} ${viaje.conductor.apellidos}` : getConductorNombre(viaje.conductor_id)}</TableCell>
											<TableCell>{viaje.vehiculo?.placa || getVehiculoPlaca(viaje.vehiculo_id)}</TableCell>
											<TableCell>{new Date(viaje.fecha_salida).toLocaleDateString()}</TableCell>
											<TableCell>
												<span
													className={`px-2 py-1 rounded-full text-xs font-medium ${
														viaje.estado === "Completado" ? "bg-green-100 text-green-800" : viaje.estado === "En progreso" ? "bg-blue-100 text-blue-800" : "bg-amber-100 text-amber-800"
													}`}>
													{viaje.estado}
												</span>
											</TableCell>
											<TableCell className="text-right">
												<div className="flex justify-end space-x-2">
													<CustomButton size="sm" variant="ghost" onClick={() => handleEditarViaje(viaje)}>
														Editar
													</CustomButton>
													<CustomButton size="sm" variant="ghost" className="text-red-500 hover:text-red-700" onClick={() => handleEliminarViaje(viaje.id)}>
														Eliminar
													</CustomButton>
												</div>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
					)}
				</CardContent>
			</CustomCard>

			{/* Dialog para crear/editar viaje */}
			<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
				<DialogContent className="max-w-2xl">
					<DialogHeader>
						<DialogTitle>{selectedViaje ? "Editar Viaje" : "Nuevo Viaje"}</DialogTitle>
						<DialogDescription>{selectedViaje ? "Actualice los detalles del viaje seleccionado" : "Complete el formulario para registrar un nuevo viaje"}</DialogDescription>
					</DialogHeader>

					<form onSubmit={handleSubmit} className="space-y-4">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							{/* Cliente */}
							<div className="space-y-2">
								<Label htmlFor="cliente_id">Cliente *</Label>
								<select id="cliente_id" name="cliente_id" value={formData.cliente_id} onChange={handleInputChange} className="w-full rounded-md border border-input bg-background px-3 py-2" required>
									<option value="">Seleccione un cliente</option>
									{clientes.map((cliente) => (
										<option key={cliente.id} value={cliente.id}>
											{cliente.razon_social}
										</option>
									))}
								</select>
							</div>

							{/* Conductor */}
							<div className="space-y-2">
								<Label htmlFor="conductor_id">Conductor *</Label>
								<select
									id="conductor_id"
									name="conductor_id"
									value={formData.conductor_id}
									onChange={handleInputChange}
									className="w-full rounded-md border border-input bg-background px-3 py-2"
									required>
									<option value="">Seleccione un conductor</option>
									{conductores.map((conductor) => (
										<option key={conductor.id} value={conductor.id}>
											{conductor.nombres} {conductor.apellidos}
										</option>
									))}
								</select>
							</div>

							{/* Vehículo */}
							<div className="space-y-2">
								<Label htmlFor="vehiculo_id">Vehículo *</Label>
								<select
									id="vehiculo_id"
									name="vehiculo_id"
									value={formData.vehiculo_id}
									onChange={handleInputChange}
									className="w-full rounded-md border border-input bg-background px-3 py-2"
									required>
									<option value="">Seleccione un vehículo</option>
									{vehiculos.map((vehiculo) => (
										<option key={vehiculo.id} value={vehiculo.id}>
											{vehiculo.placa} - {vehiculo.marca} {vehiculo.modelo}
										</option>
									))}
								</select>
							</div>

							{/* Estado */}
							<div className="space-y-2">
								<Label htmlFor="estado">Estado *</Label>
								<select id="estado" name="estado" value={formData.estado} onChange={handleInputChange} className="w-full rounded-md border border-input bg-background px-3 py-2" required>
									<option value="Programado">Programado</option>
									<option value="En progreso">En progreso</option>
									<option value="Completado">Completado</option>
									<option value="Cancelado">Cancelado</option>
								</select>
							</div>

							{/* Origen */}
							<FormField label="Origen *" id="origen" name="origen" value={formData.origen} onChange={handleInputChange as any} required />

							{/* Destino */}
							<FormField label="Destino *" id="destino" name="destino" value={formData.destino} onChange={handleInputChange as any} required />

							{/* Fecha de Salida */}
							<FormField label="Fecha de Salida *" id="fecha_salida" name="fecha_salida" type="date" value={formData.fecha_salida} onChange={handleInputChange as any} required />

							{/* Fecha de Llegada (opcional) */}
							<FormField label="Fecha de Llegada" id="fecha_llegada" name="fecha_llegada" type="date" value={formData.fecha_llegada || ""} onChange={handleInputChange as any} />

							{/* Tarifa */}
							<FormField label="Tarifa *" id="tarifa" name="tarifa" type="number" value={formData.tarifa?.toString()} onChange={handleInputChange as any} required />

							{/* Adelanto */}
							<FormField label="Adelanto" id="adelanto" name="adelanto" type="number" value={formData.adelanto?.toString()} onChange={handleInputChange as any} />

							{/* Saldo (calculado) */}
							<FormField label="Saldo" id="saldo" name="saldo" type="number" value={formData.saldo?.toString()} readOnly disabled />

							{/* Carga */}
							<FormField label="Carga" id="carga" name="carga" value={formData.carga} onChange={handleInputChange as any} />

							{/* Peso */}
							<FormField label="Peso (kg)" id="peso" name="peso" type="number" value={formData.peso?.toString()} onChange={handleInputChange as any} />

							{/* Detracción */}
							<div className="space-y-2 flex items-center">
								<input
									id="detraccion"
									name="detraccion"
									type="checkbox"
									checked={formData.detraccion}
									onChange={handleInputChange}
									className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary mr-2"
								/>
								<Label htmlFor="detraccion">Aplica detracción</Label>
							</div>
						</div>

						{/* Observaciones */}
						<div className="space-y-2">
							<Label htmlFor="observaciones">Observaciones</Label>
							<textarea
								id="observaciones"
								name="observaciones"
								value={formData.observaciones || ""}
								onChange={handleInputChange as any}
								className="w-full rounded-md border border-input bg-background px-3 py-2 min-h-[80px]"
							/>
						</div>

						<DialogFooter>
							<CustomButton variant="outline" onClick={() => setIsDialogOpen(false)} type="button">
								Cancelar
							</CustomButton>
							<CustomButton primary type="submit">
								{selectedViaje ? "Actualizar Viaje" : "Crear Viaje"}
							</CustomButton>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>
		</div>
	);
}
