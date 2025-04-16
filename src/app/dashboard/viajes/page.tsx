"use client";

import { useState, useEffect } from "react";
import DataTable, { DataItem, Column } from "@/components/DataTable";
import { format } from "date-fns";
import { viajeService, clienteService, conductorService, vehiculoService, Viaje, Cliente, Conductor, Vehiculo } from "@/lib/supabaseServices";
import notificationService from "@/components/notifications/NotificationService";
import { ActionButtonGroup, EditButton, DeleteButton, ActionButton } from "@/components/ActionIcons";

// Componente para la página de viajes
export default function ViajesPage() {
	const [loading, setLoading] = useState(true);
	const [viajes, setViajes] = useState<Viaje[]>([]);
	const [filteredViajes, setFilteredViajes] = useState<Viaje[]>([]);
	const [clientes, setClientes] = useState<Cliente[]>([]);
	const [conductores, setConductores] = useState<Conductor[]>([]);
	const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
	const [showForm, setShowForm] = useState(false);
	const [showFilters, setShowFilters] = useState(false);
	const [searchTerm, setSearchTerm] = useState("");
	const [filters, setFilters] = useState({
		cliente_id: "",
		conductor_id: "",
		vehiculo_id: "",
		estado: "",
		fecha_desde: "",
		fecha_hasta: "",
	});
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

	// Efecto para filtrar viajes según criterios de búsqueda
	useEffect(() => {
		filterViajes();
	}, [viajes, searchTerm, filters]);

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

	// Filtrar viajes según términos de búsqueda y filtros avanzados
	const filterViajes = () => {
		let results = [...viajes];

		// Filtrar por término de búsqueda (búsqueda general)
		if (searchTerm) {
			const term = searchTerm.toLowerCase();
			results = results.filter(
				(viaje) =>
					(viaje.cliente?.razon_social || "").toLowerCase().includes(term) ||
					(viaje.origen || "").toLowerCase().includes(term) ||
					(viaje.destino || "").toLowerCase().includes(term) ||
					(viaje.carga || "").toLowerCase().includes(term) ||
					(viaje.conductor?.nombres || "").toLowerCase().includes(term) ||
					(viaje.conductor?.apellidos || "").toLowerCase().includes(term) ||
					(viaje.vehiculo?.placa || "").toLowerCase().includes(term) ||
					(viaje.estado || "").toLowerCase().includes(term)
			);
		}

		// Aplicar filtros avanzados
		if (filters.cliente_id) {
			results = results.filter((viaje) => viaje.cliente_id === filters.cliente_id);
		}

		if (filters.conductor_id) {
			results = results.filter((viaje) => viaje.conductor_id === filters.conductor_id);
		}

		if (filters.vehiculo_id) {
			results = results.filter((viaje) => viaje.vehiculo_id === filters.vehiculo_id);
		}

		if (filters.estado) {
			results = results.filter((viaje) => viaje.estado === filters.estado);
		}

		if (filters.fecha_desde) {
			const fechaDesde = new Date(filters.fecha_desde);
			results = results.filter((viaje) => new Date(viaje.fecha_salida) >= fechaDesde);
		}

		if (filters.fecha_hasta) {
			const fechaHasta = new Date(filters.fecha_hasta);
			fechaHasta.setHours(23, 59, 59, 999); // Final del día
			results = results.filter((viaje) => new Date(viaje.fecha_salida) <= fechaHasta);
		}

		setFilteredViajes(results);
	};

	// Manejar cambios en los filtros
	const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		const { name, value } = e.target;
		setFilters({
			...filters,
			[name]: value,
		});
	};

	// Resetear todos los filtros
	const resetFilters = () => {
		setFilters({
			cliente_id: "",
			conductor_id: "",
			vehiculo_id: "",
			estado: "",
			fecha_desde: "",
			fecha_hasta: "",
		});
		setSearchTerm("");
		setShowFilters(false);
	};

	// Columnas para la tabla de viajes
	const columns: Column<Viaje>[] = [
		{
			header: "Cliente",
			accessor: "cliente.razon_social",
			cell: (value: unknown, row: Viaje) => (
				<div className="flex justify-center">
					<div className="flex items-center">
						<div
							className={`flex-shrink-0 h-8 w-8 rounded-full ${
								row.cliente?.tipo === "Empresa" ? "bg-blue-100" : row.cliente?.tipo === "Individual" ? "bg-green-100" : "bg-yellow-100"
							} flex items-center justify-center mr-3`}>
							<span className={`text-sm font-medium ${row.cliente?.tipo === "Empresa" ? "text-blue-800" : row.cliente?.tipo === "Individual" ? "text-green-800" : "text-yellow-800"}`}>
								{row.cliente?.razon_social?.charAt(0) || "?"}
							</span>
						</div>
						<div className="text-sm font-medium text-gray-900">{row.cliente?.razon_social || ""}</div>
					</div>
				</div>
			),
		},
		{
			header: "Origen",
			accessor: "origen",
			cell: (value: unknown, row: Viaje) => (
				<div className="flex justify-center">
					<div className="flex items-center">
						<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
						</svg>
						<span className="text-sm font-medium text-gray-700">{row.origen}</span>
					</div>
				</div>
			),
		},
		{
			header: "Destino",
			accessor: "destino",
			cell: (value: unknown, row: Viaje) => (
				<div className="flex justify-center">
					<div className="flex items-center">
						<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-500 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
						</svg>
						<span className="text-sm font-medium text-gray-700">{row.destino}</span>
					</div>
				</div>
			),
		},
		{
			header: "Fecha Salida",
			accessor: "fecha_salida",
			cell: (value: unknown, row: Viaje) => {
				const dateValue = row.fecha_salida;
				return (
					<div className="flex justify-center">
						<span className="text-sm font-medium flex items-center text-gray-700">
							<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-500 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
							</svg>
							{dateValue ? format(new Date(dateValue), "dd/MM/yyyy HH:mm") : ""}
						</span>
					</div>
				);
			},
		},
		{
			header: "Conductor",
			accessor: "conductor",
			cell: (value: unknown, row: Viaje) => {
				return (
					<div className="flex justify-center">
						<div className="flex items-center">
							<div className={`flex-shrink-0 h-8 w-8 rounded-full ${row.conductor?.estado ? "bg-green-100" : "bg-red-100"} flex items-center justify-center mr-3`}>
								<span className={`text-sm font-medium ${row.conductor?.estado ? "text-green-800" : "text-red-800"}`}>{row.conductor?.nombres?.charAt(0) || "?"}</span>
							</div>
							<div className="text-sm font-medium text-gray-900">{row.conductor ? `${row.conductor.nombres} ${row.conductor.apellidos}` : ""}</div>
						</div>
					</div>
				);
			},
		},
		{
			header: "Vehículo",
			accessor: "vehiculo.placa",
			cell: (value: unknown, row: Viaje) => (
				<div className="flex justify-center">
					<span className="font-mono bg-blue-50 px-3 py-1.5 rounded-lg text-blue-700 font-semibold flex items-center">
						<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={1.5}
								d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"
							/>
						</svg>
						{row.vehiculo ? row.vehiculo.placa : ""}
					</span>
				</div>
			),
		},
		{
			header: "Tarifa",
			accessor: "tarifa",
			cell: (value: unknown, row: Viaje) => (
				<div className="flex justify-end">
					<span className="font-mono text-green-700 font-medium">{`S/. ${row.tarifa.toLocaleString("es-PE")}`}</span>
				</div>
			),
		},
		{
			header: "Estado",
			accessor: "estado",
			cell: (value: unknown, row: Viaje) => {
				let colorClass = "bg-gray-100 text-gray-800";
				let icon = null;

				if (row.estado === "Programado") {
					colorClass = "bg-blue-100 text-blue-800";
					icon = (
						<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
					);
				} else if (row.estado === "En Ruta") {
					colorClass = "bg-yellow-100 text-yellow-800";
					icon = (
						<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
							/>
						</svg>
					);
				} else if (row.estado === "Completado") {
					colorClass = "bg-green-100 text-green-800";
					icon = (
						<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
						</svg>
					);
				} else if (row.estado === "Cancelado") {
					colorClass = "bg-red-100 text-red-800";
					icon = (
						<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
						</svg>
					);
				}

				return (
					<div className="flex justify-center">
						<span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center ${colorClass}`}>
							{icon}
							{row.estado}
						</span>
					</div>
				);
			},
		},
		{
			header: "Acciones",
			accessor: "id",
			cell: (value: unknown, row: Viaje) => (
				<ActionButtonGroup>
					<EditButton onClick={() => handleEdit(row)} />
					<DeleteButton onClick={() => handleDelete(row.id)} />
					<ActionButton onClick={() => handleChangeStatus(row.id)} title="Cambiar estado" bgColor="bg-purple-100" textColor="text-purple-700" hoverColor="bg-purple-200">
						<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
						</svg>
					</ActionButton>
				</ActionButtonGroup>
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

	// Estadísticas basadas en viajes filtrados en lugar de todos los viajes
	const viajesProgramadosFiltrados = filteredViajes.filter((v) => v.estado === "Programado").length;
	const viajesEnRutaFiltrados = filteredViajes.filter((v) => v.estado === "En Ruta").length;
	const viajesCompletadosFiltrados = filteredViajes.filter((v) => v.estado === "Completado").length;
	const viajesCanceladosFiltrados = filteredViajes.filter((v) => v.estado === "Cancelado").length;
	const totalTarifasFiltrados = filteredViajes.reduce((sum, v) => sum + v.tarifa, 0);
	const totalAdelantosFiltrados = filteredViajes.reduce((sum, v) => sum + v.adelanto, 0);
	const totalSaldosFiltrados = filteredViajes.reduce((sum, v) => sum + v.saldo, 0);

	if (loading && viajes.length === 0) {
		return <div className="flex justify-center items-center h-64">Cargando viajes...</div>;
	}

	return (
		<div className="space-y-6">
			<div className="flex justify-between items-center">
				<h1 className="text-2xl font-bold">Gestión de Viajes</h1>
				<div className="space-x-2">
					<button onClick={() => setShowFilters(!showFilters)} className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200">
						{showFilters ? "Ocultar Filtros" : "Filtros Avanzados"}
					</button>
					<button onClick={() => setShowForm(!showForm)} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
						{showForm ? "Cancelar" : "Nuevo Viaje"}
					</button>
				</div>
			</div>

			{/* Barra de búsqueda principal */}
			<div className="flex items-center bg-white rounded-lg shadow-sm p-2 border border-gray-200">
				<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 mx-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
				</svg>
				<input
					type="text"
					value={searchTerm}
					onChange={(e) => setSearchTerm(e.target.value)}
					placeholder="Buscar por cliente, origen, destino, conductor, vehículo..."
					className="flex-grow py-2 px-2 focus:outline-none"
				/>
				{searchTerm && (
					<button onClick={() => setSearchTerm("")} className="mx-1 text-gray-400 hover:text-gray-600">
						<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				)}
			</div>

			{/* Filtros avanzados */}
			{showFilters && (
				<div className="bg-white p-6 rounded-lg shadow-md">
					<div className="flex justify-between items-center mb-4">
						<h3 className="font-bold text-lg">Filtros Avanzados</h3>
						<button onClick={resetFilters} className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center">
							<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
							</svg>
							Resetear filtros
						</button>
					</div>
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
							<select
								name="cliente_id"
								value={filters.cliente_id}
								onChange={handleFilterChange}
								className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm">
								<option value="">Todos los clientes</option>
								{clientes.map((cliente) => (
									<option key={cliente.id} value={cliente.id}>
										{cliente.razon_social}
									</option>
								))}
							</select>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">Conductor</label>
							<select
								name="conductor_id"
								value={filters.conductor_id}
								onChange={handleFilterChange}
								className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm">
								<option value="">Todos los conductores</option>
								{conductores.map((conductor) => (
									<option key={conductor.id} value={conductor.id}>
										{conductor.nombres} {conductor.apellidos}
									</option>
								))}
							</select>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">Vehículo</label>
							<select
								name="vehiculo_id"
								value={filters.vehiculo_id}
								onChange={handleFilterChange}
								className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm">
								<option value="">Todos los vehículos</option>
								{vehiculos.map((vehiculo) => (
									<option key={vehiculo.id} value={vehiculo.id}>
										{vehiculo.placa}
									</option>
								))}
							</select>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
							<select
								name="estado"
								value={filters.estado}
								onChange={handleFilterChange}
								className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm">
								<option value="">Todos los estados</option>
								<option value="Programado">Programado</option>
								<option value="En Ruta">En Ruta</option>
								<option value="Completado">Completado</option>
								<option value="Cancelado">Cancelado</option>
							</select>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">Fecha desde</label>
							<input
								type="date"
								name="fecha_desde"
								value={filters.fecha_desde}
								onChange={handleFilterChange}
								className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">Fecha hasta</label>
							<input
								type="date"
								name="fecha_hasta"
								value={filters.fecha_hasta}
								onChange={handleFilterChange}
								className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
							/>
						</div>
					</div>
				</div>
			)}

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
			<div className="bg-white rounded-lg shadow-md overflow-hidden">
				<div className="p-4 border-b border-gray-200">
					<h2 className="text-lg font-semibold">Listado de Viajes</h2>
					<p className="text-sm text-gray-600 mt-1">
						{filteredViajes.length} {filteredViajes.length === 1 ? "viaje encontrado" : "viajes encontrados"}
						{filteredViajes.length < viajes.length && ` (de ${viajes.length} totales)`}
					</p>
				</div>
				<DataTable data={filteredViajes as unknown as DataItem[]} columns={columns as unknown as Column<DataItem>[]} title="Lista de Viajes" />
			</div>
		</div>
	);
}
