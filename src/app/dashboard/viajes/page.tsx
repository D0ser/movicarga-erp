"use client";

import { useState, useEffect } from "react";
import DataTable, { DataItem, Column } from "@/components/DataTable";
import { format } from "date-fns";
import { viajeService, clienteService, conductorService, vehiculoService, Viaje, Cliente, Conductor, Vehiculo } from "@/lib/supabaseServices";
import notificationService from "@/components/notifications/NotificationService";

// Componente para la página de viajes
export default function ViajesPage() {
	const [loading, setLoading] = useState(true);
	const [viajes, setViajes] = useState<Viaje[]>([]);
	const [clientes, setClientes] = useState<Cliente[]>([]);
	const [conductores, setConductores] = useState<Conductor[]>([]);
	const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
	const [showForm, setShowForm] = useState(false);
	const [formData, setFormData] = useState<Partial<Viaje>>({
		cliente_id: "",
		conductor_id: "",
		vehiculo_id: "",
		origen: "",
		destino: "",
		fecha_salida: new Date().toISOString(),
		fecha_llegada: null,
		carga: "",
		peso: 0,
		estado: "Programado",
		tarifa: 0,
		adelanto: 0,
		saldo: 0,
		detraccion: false,
		observaciones: "",
	});

	// Cargar datos desde Supabase al iniciar
	useEffect(() => {
		fetchViajes();
		fetchClientes();
		fetchConductores();
		fetchVehiculos();
	}, []);

	// Cuando cambia la tarifa o el adelanto, calcular el saldo
	useEffect(() => {
		if (formData.tarifa !== undefined) {
			const adelanto = formData.adelanto || 0;
			const saldo = formData.tarifa - adelanto;
			setFormData((prev) => ({
				...prev,
				saldo: saldo,
			}));
		}
	}, [formData.tarifa, formData.adelanto]);

	const fetchViajes = async () => {
		try {
			setLoading(true);
			const data = await viajeService.getViajes();
			setViajes(data);
		} catch (error) {
			console.error("Error al cargar viajes:", error);
			notificationService.error("No se pudieron cargar los viajes");
		} finally {
			setLoading(false);
		}
	};

	const fetchClientes = async () => {
		try {
			const data = await clienteService.getClientes();
			setClientes(data);
		} catch (error) {
			console.error("Error al cargar clientes:", error);
			notificationService.error("No se pudieron cargar los clientes");
		}
	};

	const fetchConductores = async () => {
		try {
			const data = await conductorService.getConductores();
			setConductores(data);
		} catch (error) {
			console.error("Error al cargar conductores:", error);
			notificationService.error("No se pudieron cargar los conductores");
		}
	};

	const fetchVehiculos = async () => {
		try {
			const data = await vehiculoService.getVehiculos();
			setVehiculos(data);
		} catch (error) {
			console.error("Error al cargar vehículos:", error);
			notificationService.error("No se pudieron cargar los vehículos");
		}
	};

	// Columnas para la tabla de viajes
	const columns: Column<Viaje>[] = [
		{
			header: "Cliente",
			accessor: "cliente.razon_social",
		},
		{
			header: "Origen",
			accessor: "origen",
		},
		{
			header: "Destino",
			accessor: "destino",
		},
		{
			header: "Fecha Salida",
			accessor: "fecha_salida",
			cell: (value: unknown, row: Viaje) => {
				const dateValue = row.fecha_salida;
				return dateValue ? format(new Date(dateValue), "dd/MM/yyyy HH:mm") : "";
			},
		},
		{
			header: "Conductor",
			accessor: "conductor",
			cell: (value: unknown, row: Viaje) => {
				return row.conductor ? `${row.conductor.nombres} ${row.conductor.apellidos}` : "";
			},
		},
		{
			header: "Vehículo",
			accessor: "vehiculo.placa",
		},
		{
			header: "Tarifa",
			accessor: "tarifa",
			cell: (value: unknown, row: Viaje) => `S/. ${row.tarifa.toLocaleString("es-PE")}`,
		},
		{
			header: "Estado",
			accessor: "estado",
			cell: (value: unknown, row: Viaje) => {
				let colorClass = "bg-gray-100 text-gray-800";
				if (row.estado === "Programado") {
					colorClass = "bg-blue-100 text-blue-800";
				} else if (row.estado === "En Ruta") {
					colorClass = "bg-yellow-100 text-yellow-800";
				} else if (row.estado === "Completado") {
					colorClass = "bg-green-100 text-green-800";
				} else if (row.estado === "Cancelado") {
					colorClass = "bg-red-100 text-red-800";
				}
				return <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>{row.estado}</span>;
			},
		},
		{
			header: "Acciones",
			accessor: "id",
			cell: (value: unknown, row: Viaje) => (
				<div className="flex space-x-2">
					<button onClick={() => handleEdit(row)} className="text-blue-600 hover:text-blue-800">
						Editar
					</button>
					<button onClick={() => handleDelete(row.id)} className="text-red-600 hover:text-red-800">
						Eliminar
					</button>
					<button onClick={() => handleChangeStatus(row.id)} className="text-purple-600 hover:text-purple-800">
						Cambiar Estado
					</button>
				</div>
			),
		},
	];

	// Funciones para manejo de formulario
	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
		const { name, value, type } = e.target;
		let processedValue: any = value;

		// Convertir valores según su tipo
		if (type === "number") {
			processedValue = parseFloat(value) || 0;
		} else if (type === "checkbox") {
			processedValue = (e.target as HTMLInputElement).checked;
		}

		setFormData({
			...formData,
			[name]: processedValue,
		});
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		try {
			setLoading(true);

			if (formData.id) {
				// Actualizar viaje existente
				const updatedViaje = await viajeService.updateViaje(formData.id, formData);
				setViajes(viajes.map((v) => (v.id === updatedViaje.id ? { ...updatedViaje, cliente: v.cliente, conductor: v.conductor, vehiculo: v.vehiculo } : v)));
				notificationService.success("Viaje actualizado correctamente");
			} else {
				// Agregar nuevo viaje
				const newViaje = await viajeService.createViaje(formData as Omit<Viaje, "id" | "cliente" | "conductor" | "vehiculo">);

				// Obtener datos completos para las relaciones
				const clienteData = clientes.find((c) => c.id === formData.cliente_id);
				const conductorData = conductores.find((c) => c.id === formData.conductor_id);
				const vehiculoData = vehiculos.find((v) => v.id === formData.vehiculo_id);

				// Agregar el viaje con sus relaciones a la lista
				setViajes([
					...viajes,
					{
						...newViaje,
						cliente: clienteData,
						conductor: conductorData,
						vehiculo: vehiculoData,
					},
				]);

				notificationService.success("Viaje creado correctamente");
			}

			// Limpiar formulario
			setFormData({
				cliente_id: "",
				conductor_id: "",
				vehiculo_id: "",
				origen: "",
				destino: "",
				fecha_salida: new Date().toISOString(),
				fecha_llegada: null,
				carga: "",
				peso: 0,
				estado: "Programado",
				tarifa: 0,
				adelanto: 0,
				saldo: 0,
				detraccion: false,
				observaciones: "",
			});

			setShowForm(false);
		} catch (error) {
			console.error("Error al guardar viaje:", error);
			notificationService.error("No se pudo guardar el viaje");
		} finally {
			setLoading(false);
		}
	};

	const handleEdit = (viaje: Viaje) => {
		setFormData({
			...viaje,
			cliente_id: viaje.cliente?.id || "",
			conductor_id: viaje.conductor?.id || "",
			vehiculo_id: viaje.vehiculo?.id || "",
		});
		setShowForm(true);
	};

	const handleDelete = async (id: string) => {
		if (confirm("¿Está seguro de que desea eliminar este viaje?")) {
			try {
				setLoading(true);
				await viajeService.deleteViaje(id);
				setViajes(viajes.filter((v) => v.id !== id));
				notificationService.success("Viaje eliminado correctamente");
			} catch (error) {
				console.error("Error al eliminar viaje:", error);
				notificationService.error("No se pudo eliminar el viaje");
			} finally {
				setLoading(false);
			}
		}
	};

	const handleChangeStatus = async (id: string) => {
		// Obtener el viaje actual
		const viaje = viajes.find((v) => v.id === id);
		if (!viaje) return;

		// Determinar el siguiente estado
		let nextStatus: string;
		switch (viaje.estado) {
			case "Programado":
				nextStatus = "En Ruta";
				break;
			case "En Ruta":
				nextStatus = "Completado";
				break;
			case "Completado":
				nextStatus = "Programado";
				break;
			case "Cancelado":
				nextStatus = "Programado";
				break;
			default:
				nextStatus = "Programado";
		}

		try {
			setLoading(true);
			const updatedViaje = await viajeService.updateViaje(id, {
				estado: nextStatus,
				// Si el estado es Completado y no tiene fecha de llegada, establecerla
				fecha_llegada: nextStatus === "Completado" && !viaje.fecha_llegada ? new Date().toISOString() : viaje.fecha_llegada,
			});
			setViajes(viajes.map((v) => (v.id === id ? { ...updatedViaje, cliente: v.cliente, conductor: v.conductor, vehiculo: v.vehiculo } : v)));
			notificationService.success(`Viaje cambiado a estado: ${nextStatus}`);
		} catch (error) {
			console.error("Error al cambiar estado del viaje:", error);
			notificationService.error("No se pudo cambiar el estado del viaje");
		} finally {
			setLoading(false);
		}
	};

	// Estadísticas de viajes
	const viajesProgramados = viajes.filter((v) => v.estado === "Programado").length;
	const viajesEnRuta = viajes.filter((v) => v.estado === "En Ruta").length;
	const viajesCompletados = viajes.filter((v) => v.estado === "Completado").length;
	const viajesCancelados = viajes.filter((v) => v.estado === "Cancelado").length;
	const totalTarifas = viajes.reduce((sum, v) => sum + v.tarifa, 0);
	const totalAdelantos = viajes.reduce((sum, v) => sum + v.adelanto, 0);
	const totalSaldos = viajes.reduce((sum, v) => sum + v.saldo, 0);

	if (loading && viajes.length === 0) {
		return <div className="flex justify-center items-center h-64">Cargando viajes...</div>;
	}

	return (
		<div className="space-y-6">
			<div className="flex justify-between items-center">
				<h1 className="text-2xl font-bold">Gestión de Viajes</h1>
				<button onClick={() => setShowForm(!showForm)} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
					{showForm ? "Cancelar" : "Nuevo Viaje"}
				</button>
			</div>

			{/* Estadísticas rápidas */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				<div className="bg-white p-6 rounded-lg shadow-md">
					<h3 className="font-bold text-lg mb-2">Estado de Viajes</h3>
					<div className="space-y-1">
						<div className="flex justify-between">
							<span>Total de viajes:</span>
							<span className="font-medium">{viajes.length}</span>
						</div>
						<div className="flex justify-between">
							<span>Programados:</span>
							<span className="font-medium text-blue-600">{viajesProgramados}</span>
						</div>
						<div className="flex justify-between">
							<span>En ruta:</span>
							<span className="font-medium text-yellow-600">{viajesEnRuta}</span>
						</div>
						<div className="flex justify-between">
							<span>Completados:</span>
							<span className="font-medium text-green-600">{viajesCompletados}</span>
						</div>
						<div className="flex justify-between">
							<span>Cancelados:</span>
							<span className="font-medium text-red-600">{viajesCancelados}</span>
						</div>
					</div>
				</div>

				<div className="bg-white p-6 rounded-lg shadow-md">
					<h3 className="font-bold text-lg mb-2">Finanzas</h3>
					<div className="space-y-1">
						<div className="flex justify-between">
							<span>Total de tarifas:</span>
							<span className="font-medium">S/. {totalTarifas.toLocaleString("es-PE")}</span>
						</div>
						<div className="flex justify-between">
							<span>Total de adelantos:</span>
							<span className="font-medium">S/. {totalAdelantos.toLocaleString("es-PE")}</span>
						</div>
						<div className="flex justify-between">
							<span>Total de saldos:</span>
							<span className="font-medium">S/. {totalSaldos.toLocaleString("es-PE")}</span>
						</div>
					</div>
				</div>

				<div className="bg-white p-6 rounded-lg shadow-md">
					<h3 className="font-bold text-lg mb-2">Detracciones</h3>
					<div className="space-y-1">
						<div className="flex justify-between">
							<span>Viajes con detracción:</span>
							<span className="font-medium">{viajes.filter((v) => v.detraccion).length}</span>
						</div>
						<div className="flex justify-between">
							<span>Monto estimado:</span>
							<span className="font-medium">S/. {(totalTarifas * 0.04).toLocaleString("es-PE")}</span>
						</div>
					</div>
				</div>
			</div>

			{/* Formulario de viaje */}
			{showForm && (
				<div className="bg-white p-6 rounded-lg shadow-md">
					<h2 className="text-xl font-bold mb-4">{formData.id ? "Editar Viaje" : "Nuevo Viaje"}</h2>
					<form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
						<div>
							<label className="block text-sm font-medium text-gray-700">Cliente</label>
							<select
								name="cliente_id"
								value={formData.cliente_id || ""}
								onChange={handleInputChange}
								className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
								required>
								<option value="">Seleccione un cliente</option>
								{clientes
									.filter((c) => c.estado)
									.map((cliente) => (
										<option key={cliente.id} value={cliente.id}>
											{cliente.razon_social} - {cliente.ruc}
										</option>
									))}
							</select>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700">Conductor</label>
							<select
								name="conductor_id"
								value={formData.conductor_id || ""}
								onChange={handleInputChange}
								className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
								required>
								<option value="">Seleccione un conductor</option>
								{conductores
									.filter((c) => c.estado)
									.map((conductor) => (
										<option key={conductor.id} value={conductor.id}>
											{conductor.nombres} {conductor.apellidos} - {conductor.licencia}
										</option>
									))}
							</select>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700">Vehículo</label>
							<select
								name="vehiculo_id"
								value={formData.vehiculo_id || ""}
								onChange={handleInputChange}
								className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
								required>
								<option value="">Seleccione un vehículo</option>
								{vehiculos
									.filter((v) => v.estado === "Operativo")
									.map((vehiculo) => (
										<option key={vehiculo.id} value={vehiculo.id}>
											{vehiculo.placa} - {vehiculo.marca} {vehiculo.modelo}
										</option>
									))}
							</select>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700">Origen</label>
							<input
								type="text"
								name="origen"
								value={formData.origen || ""}
								onChange={handleInputChange}
								className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
								required
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700">Destino</label>
							<input
								type="text"
								name="destino"
								value={formData.destino || ""}
								onChange={handleInputChange}
								className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
								required
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700">Fecha de Salida</label>
							<input
								type="datetime-local"
								name="fecha_salida"
								value={formData.fecha_salida ? new Date(formData.fecha_salida).toISOString().slice(0, 16) : ""}
								onChange={handleInputChange}
								className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
								required
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700">Fecha de Llegada</label>
							<input
								type="datetime-local"
								name="fecha_llegada"
								value={formData.fecha_llegada ? new Date(formData.fecha_llegada).toISOString().slice(0, 16) : ""}
								onChange={handleInputChange}
								className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700">Descripción de la Carga</label>
							<input
								type="text"
								name="carga"
								value={formData.carga || ""}
								onChange={handleInputChange}
								className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
								required
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700">Peso (kg)</label>
							<input
								type="number"
								name="peso"
								value={formData.peso || ""}
								onChange={handleInputChange}
								min="0"
								step="0.01"
								className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
								required
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700">Estado</label>
							<select
								name="estado"
								value={formData.estado || "Programado"}
								onChange={handleInputChange}
								className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
								required>
								<option value="Programado">Programado</option>
								<option value="En Ruta">En Ruta</option>
								<option value="Completado">Completado</option>
								<option value="Cancelado">Cancelado</option>
							</select>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700">Tarifa (S/.)</label>
							<input
								type="number"
								name="tarifa"
								value={formData.tarifa || ""}
								onChange={handleInputChange}
								min="0"
								step="0.01"
								className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
								required
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700">Adelanto (S/.)</label>
							<input
								type="number"
								name="adelanto"
								value={formData.adelanto || ""}
								onChange={handleInputChange}
								min="0"
								step="0.01"
								className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
								required
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700">Saldo (S/.)</label>
							<input
								type="number"
								name="saldo"
								value={formData.saldo || ""}
								className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-gray-100"
								readOnly
							/>
						</div>

						<div className="flex items-center">
							<input type="checkbox" name="detraccion" checked={formData.detraccion} onChange={handleInputChange} className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
							<label className="ml-2 block text-sm text-gray-700">Aplica Detracción (4%)</label>
						</div>

						<div className="col-span-full">
							<label className="block text-sm font-medium text-gray-700">Observaciones</label>
							<textarea
								name="observaciones"
								value={formData.observaciones || ""}
								onChange={handleInputChange}
								rows={3}
								className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
							/>
						</div>

						<div className="col-span-full mt-4 flex justify-end">
							<button type="button" onClick={() => setShowForm(false)} className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md mr-2 hover:bg-gray-400">
								Cancelar
							</button>
							<button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
								{formData.id ? "Actualizar" : "Guardar"}
							</button>
						</div>
					</form>
				</div>
			)}

			{/* Tabla de viajes */}
			<DataTable
				columns={columns}
				data={viajes}
				title="Registro de Viajes"
				defaultSort="fecha_salida"
				filters={{
					searchField: "origen",
				}}
				isLoading={loading}
			/>
		</div>
	);
}
