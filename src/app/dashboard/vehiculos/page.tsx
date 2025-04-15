"use client";

import { useState, useEffect } from "react";
import DataTable, { Column, DataItem } from "@/components/DataTable";
import { format } from "date-fns";
import { vehiculoService, Vehiculo } from "@/lib/supabaseServices";
import notificationService from "@/components/notifications/NotificationService";

// Componente para la página de vehículos
export default function VehiculosPage() {
	const [loading, setLoading] = useState(true);
	const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
	const [showForm, setShowForm] = useState(false);
	const [formData, setFormData] = useState<Partial<Vehiculo>>({
		placa: "",
		marca: "",
		modelo: "",
		anio: new Date().getFullYear(),
		color: "",
		num_ejes: 3,
		capacidad_carga: 0,
		kilometraje: 0,
		fecha_adquisicion: new Date().toISOString().split("T")[0],
		fecha_soat: "",
		fecha_revision_tecnica: "",
		estado: "Operativo",
		propietario: "Empresa",
		observaciones: "",
	});

	// Cargar datos desde Supabase al iniciar
	useEffect(() => {
		fetchVehiculos();
	}, []);

	const fetchVehiculos = async () => {
		try {
			setLoading(true);
			const data = await vehiculoService.getVehiculos();
			setVehiculos(data);
		} catch (error) {
			console.error("Error al cargar vehículos:", error);
			notificationService.error("No se pudieron cargar los vehículos. Intente nuevamente en unos momentos.");
			// Si no hay datos, usar un array vacío
			setVehiculos([]);
		} finally {
			setLoading(false);
		}
	};

	// Función para calcular los vencimientos y alertas
	const calcularVencimientos = () => {
		const fechaActual = new Date();
		const fechaProximos30Dias = new Date();
		fechaProximos30Dias.setDate(fechaActual.getDate() + 30);

		const soatsVencidos = vehiculos.filter((v) => {
			if (!v.fecha_soat) return false;
			return new Date(v.fecha_soat) < fechaActual;
		}).length;

		const revisionesVencidas = vehiculos.filter((v) => {
			if (!v.fecha_revision_tecnica) return false;
			return new Date(v.fecha_revision_tecnica) < fechaActual;
		}).length;

		const soatsPorVencer = vehiculos.filter((v) => {
			if (!v.fecha_soat) return false;
			const fechaSoat = new Date(v.fecha_soat);
			return fechaSoat >= fechaActual && fechaSoat <= fechaProximos30Dias;
		}).length;

		const revisionesPorVencer = vehiculos.filter((v) => {
			if (!v.fecha_revision_tecnica) return false;
			const fechaRevision = new Date(v.fecha_revision_tecnica);
			return fechaRevision >= fechaActual && fechaRevision <= fechaProximos30Dias;
		}).length;

		return {
			soatsVencidos,
			revisionesVencidas,
			soatsPorVencer,
			revisionesPorVencer,
		};
	};

	// Extender Vehiculo para que cumpla con DataItem (índice de string)
	type VehiculoDataItem = Vehiculo & DataItem;

	// Columnas para la tabla de vehículos
	const columns: Column<VehiculoDataItem>[] = [
		{
			header: "Placa",
			accessor: "placa",
		},
		{
			header: "Marca",
			accessor: "marca",
		},
		{
			header: "Modelo",
			accessor: "modelo",
		},
		{
			header: "Año",
			accessor: "anio",
		},
		{
			header: "Capacidad (kg)",
			accessor: "capacidad_carga",
			cell: (value: unknown, row: VehiculoDataItem) => row.capacidad_carga.toLocaleString("es-PE"),
		},
		{
			header: "Kilometraje",
			accessor: "kilometraje",
			cell: (value: unknown, row: VehiculoDataItem) => row.kilometraje.toLocaleString("es-PE") + " km",
		},
		{
			header: "SOAT Hasta",
			accessor: "fecha_soat",
			cell: (value: unknown, row: VehiculoDataItem) => {
				const dateValue = row.fecha_soat;
				return dateValue ? format(new Date(dateValue), "dd/MM/yyyy") : "";
			},
		},
		{
			header: "Estado",
			accessor: "estado",
			cell: (value: unknown, row: VehiculoDataItem) => {
				let colorClass = "bg-gray-100 text-gray-800";
				if (row.estado === "Operativo") {
					colorClass = "bg-green-100 text-green-800";
				} else if (row.estado === "Mantenimiento") {
					colorClass = "bg-yellow-100 text-yellow-800";
				} else if (row.estado === "Fuera de Servicio") {
					colorClass = "bg-red-100 text-red-800";
				}
				return <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>{row.estado}</span>;
			},
		},
		{
			header: "Acciones",
			accessor: "id",
			cell: (value: unknown, row: VehiculoDataItem) => (
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
		let processedValue: string | number | Date = value;

		// Convertir valores según su tipo
		if (type === "number") {
			processedValue = parseFloat(value) || 0;
		} else if (type === "date" && value) {
			// Asegurar que la fecha tiene el formato correcto para enviar a la base de datos
			try {
				// Convertir a formato ISO y luego tomar solo la parte de la fecha
				processedValue = new Date(value).toISOString().split("T")[0];
			} catch (error) {
				console.error("Error al procesar fecha:", error);
			}
		}

		setFormData({
			...formData,
			[name]: processedValue,
		});
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		// Validación de campos
		if (!formData.placa || formData.placa.trim() === "") {
			notificationService.error("La placa del vehículo es obligatoria");
			return;
		}

		if (!formData.fecha_soat) {
			notificationService.error("La fecha de vencimiento del SOAT es obligatoria");
			return;
		}

		if (!formData.fecha_revision_tecnica) {
			notificationService.error("La fecha de revisión técnica es obligatoria");
			return;
		}

		// Validar formato de placa (por ejemplo ABC-123)
		const placaRegex = /^[A-Z0-9]{3}-[A-Z0-9]{3}$/;
		if (!placaRegex.test(formData.placa)) {
			notificationService.error("El formato de la placa debe ser XXX-XXX (ejemplo: ABC-123)");
			return;
		}

		try {
			setLoading(true);

			if (formData.id) {
				// Actualizar vehículo existente
				const updatedVehiculo = await vehiculoService.updateVehiculo(formData.id, formData);
				setVehiculos(vehiculos.map((v) => (v.id === updatedVehiculo.id ? updatedVehiculo : v)));
				notificationService.success("Vehículo actualizado correctamente");
			} else {
				// Verificar si ya existe un vehículo con la misma placa
				const existingVehiculo = vehiculos.find((v) => v.placa.toUpperCase() === formData.placa?.toUpperCase());
				if (existingVehiculo) {
					notificationService.error("Ya existe un vehículo con esta placa");
					setLoading(false);
					return;
				}

				// Agregar nuevo vehículo
				const newVehiculo = await vehiculoService.createVehiculo(formData as Omit<Vehiculo, "id">);
				setVehiculos([...vehiculos, newVehiculo]);
				notificationService.success("Vehículo creado correctamente");
			}

			// Limpiar formulario
			setFormData({
				placa: "",
				marca: "",
				modelo: "",
				anio: new Date().getFullYear(),
				color: "",
				num_ejes: 3,
				capacidad_carga: 0,
				kilometraje: 0,
				fecha_adquisicion: new Date().toISOString().split("T")[0],
				fecha_soat: "",
				fecha_revision_tecnica: "",
				estado: "Operativo",
				propietario: "Empresa",
				observaciones: "",
			});

			setShowForm(false);
		} catch (error) {
			console.error("Error al guardar vehículo:", error);
			notificationService.error("No se pudo guardar el vehículo. Por favor, intente nuevamente.");
		} finally {
			setLoading(false);
		}
	};

	const handleEdit = (vehiculo: Vehiculo) => {
		setFormData({
			...vehiculo,
		});
		setShowForm(true);
	};

	const handleDelete = async (id: string) => {
		if (confirm("¿Está seguro de que desea eliminar este vehículo?")) {
			try {
				setLoading(true);
				await vehiculoService.deleteVehiculo(id);
				setVehiculos(vehiculos.filter((v) => v.id !== id));
				notificationService.success("Vehículo eliminado correctamente");
			} catch (error) {
				console.error("Error al eliminar vehículo:", error);
				notificationService.error("No se pudo eliminar el vehículo");
			} finally {
				setLoading(false);
			}
		}
	};

	const handleChangeStatus = async (id: string) => {
		// Obtener el vehículo actual
		const vehiculo = vehiculos.find((v) => v.id === id);
		if (!vehiculo) {
			notificationService.error("No se encontró el vehículo");
			return;
		}

		try {
			setLoading(true);

			// Determinar el siguiente estado de forma segura
			let nextStatus: string;
			switch (vehiculo.estado) {
				case "Operativo":
					nextStatus = "Mantenimiento";
					break;
				case "Mantenimiento":
					nextStatus = "Fuera de Servicio";
					break;
				case "Fuera de Servicio":
					nextStatus = "Operativo";
					break;
				default:
					nextStatus = "Operativo";
			}

			// Intenta actualizar en Supabase con manejo de errores
			try {
				const updatedVehiculo = await vehiculoService.updateVehiculo(id, { estado: nextStatus });

				// Actualizar el estado local sólo si la actualización en Supabase fue exitosa
				setVehiculos(vehiculos.map((v) => (v.id === id ? updatedVehiculo : v)));
				notificationService.success(`Vehículo cambiado a estado: ${nextStatus}`);
			} catch (error) {
				console.error("Error específico al cambiar estado del vehículo:", error);
				throw error; // Re-lanzar para el manejo externo
			}
		} catch (error) {
			console.error("Error general al cambiar estado del vehículo:", error);
			notificationService.error("No se pudo cambiar el estado del vehículo. Intente nuevamente.");
		} finally {
			setLoading(false);
		}
	};

	// Estadísticas de vehículos
	const { soatsVencidos, revisionesVencidas, soatsPorVencer, revisionesPorVencer } = calcularVencimientos();

	if (loading && vehiculos.length === 0) {
		return <div className="flex justify-center items-center h-64">Cargando vehículos...</div>;
	}

	return (
		<div className="space-y-6">
			<div className="flex justify-between items-center">
				<h1 className="text-2xl font-bold">Gestión de Vehículos</h1>
				<button onClick={() => setShowForm(!showForm)} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
					{showForm ? "Cancelar" : "Nuevo Vehículo"}
				</button>
			</div>

			{/* Estadísticas rápidas */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				<div className="bg-white p-6 rounded-lg shadow-md">
					<h3 className="font-bold text-lg mb-2">Estado de la Flota</h3>
					<div className="space-y-1">
						<div className="flex justify-between">
							<span>Total de vehículos:</span>
							<span className="font-medium">{vehiculos.length}</span>
						</div>
						<div className="flex justify-between">
							<span>Operativos:</span>
							<span className="font-medium text-green-600">{vehiculos.filter((v) => v.estado === "Operativo").length}</span>
						</div>
						<div className="flex justify-between">
							<span>En mantenimiento:</span>
							<span className="font-medium text-yellow-600">{vehiculos.filter((v) => v.estado === "Mantenimiento").length}</span>
						</div>
						<div className="flex justify-between">
							<span>Fuera de servicio:</span>
							<span className="font-medium text-red-600">{vehiculos.filter((v) => v.estado === "Fuera de Servicio").length}</span>
						</div>
					</div>
				</div>

				<div className="bg-white p-6 rounded-lg shadow-md">
					<h3 className="font-bold text-lg mb-2">Documentación</h3>
					<div className="space-y-1">
						<div className="flex justify-between">
							<span>SOAT vencidos:</span>
							<span className="font-medium text-red-600">{soatsVencidos}</span>
						</div>
						<div className="flex justify-between">
							<span>Revisiones vencidas:</span>
							<span className="font-medium text-red-600">{revisionesVencidas}</span>
						</div>
						<div className="flex justify-between">
							<span>SOAT por vencer (30 días):</span>
							<span className="font-medium text-yellow-600">{soatsPorVencer}</span>
						</div>
						<div className="flex justify-between">
							<span>Revisiones por vencer (30 días):</span>
							<span className="font-medium text-yellow-600">{revisionesPorVencer}</span>
						</div>
					</div>
				</div>

				<div className="bg-white p-6 rounded-lg shadow-md">
					<h3 className="font-bold text-lg mb-2">Propiedad</h3>
					<div className="space-y-1">
						<div className="flex justify-between">
							<span>Propios:</span>
							<span className="font-medium">{vehiculos.filter((v) => v.propietario === "Empresa").length}</span>
						</div>
						<div className="flex justify-between">
							<span>Terceros:</span>
							<span className="font-medium">{vehiculos.filter((v) => v.propietario === "Tercero").length}</span>
						</div>
					</div>
				</div>
			</div>

			{/* Alertas de documentación */}
			{(soatsVencidos > 0 || revisionesVencidas > 0) && (
				<div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
					<div className="flex items-center">
						<div className="flex-shrink-0">
							<svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
								<path
									fillRule="evenodd"
									d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
									clipRule="evenodd"
								/>
							</svg>
						</div>
						<div className="ml-3">
							<h3 className="text-sm font-medium text-red-800">Documentos vencidos</h3>
							<div className="mt-1 text-sm text-red-700">
								{soatsVencidos > 0 && <p>Hay {soatsVencidos} vehículo(s) con SOAT vencido que requieren atención inmediata.</p>}
								{revisionesVencidas > 0 && <p>Hay {revisionesVencidas} vehículo(s) con revisión técnica vencida que requieren atención inmediata.</p>}
							</div>
						</div>
					</div>
				</div>
			)}

			{/* Alertas de próximos vencimientos */}
			{(soatsPorVencer > 0 || revisionesPorVencer > 0) && (
				<div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-md">
					<div className="flex items-center">
						<div className="flex-shrink-0">
							<svg className="h-5 w-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
								<path
									fillRule="evenodd"
									d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
									clipRule="evenodd"
								/>
							</svg>
						</div>
						<div className="ml-3">
							<h3 className="text-sm font-medium text-yellow-800">Próximos vencimientos (30 días)</h3>
							<div className="mt-1 text-sm text-yellow-700">
								{soatsPorVencer > 0 && <p>Hay {soatsPorVencer} vehículo(s) con SOAT que vencerá en los próximos 30 días.</p>}
								{revisionesPorVencer > 0 && <p>Hay {revisionesPorVencer} vehículo(s) con revisión técnica que vencerá en los próximos 30 días.</p>}
							</div>
						</div>
					</div>
				</div>
			)}

			{/* Formulario de vehículo */}
			{showForm && (
				<div className="bg-white p-6 rounded-lg shadow-md">
					<h2 className="text-xl font-bold mb-4">{formData.id ? "Editar Vehículo" : "Nuevo Vehículo"}</h2>
					<form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
						<div>
							<label className="block text-sm font-medium text-gray-700">Placa</label>
							<input
								type="text"
								name="placa"
								value={formData.placa || ""}
								onChange={handleInputChange}
								className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
								required
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700">Marca</label>
							<input
								type="text"
								name="marca"
								value={formData.marca || ""}
								onChange={handleInputChange}
								className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
								required
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700">Modelo</label>
							<input
								type="text"
								name="modelo"
								value={formData.modelo || ""}
								onChange={handleInputChange}
								className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
								required
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700">Año</label>
							<input
								type="number"
								name="anio"
								value={formData.anio || ""}
								onChange={handleInputChange}
								min="1990"
								max={new Date().getFullYear() + 1}
								className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
								required
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700">Color</label>
							<input
								type="text"
								name="color"
								value={formData.color || ""}
								onChange={handleInputChange}
								className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
								required
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700">Número de Ejes</label>
							<input
								type="number"
								name="num_ejes"
								value={formData.num_ejes || ""}
								onChange={handleInputChange}
								min="2"
								max="6"
								className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
								required
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700">Capacidad de Carga (kg)</label>
							<input
								type="number"
								name="capacidad_carga"
								value={formData.capacidad_carga || ""}
								onChange={handleInputChange}
								min="0"
								step="0.01"
								className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
								required
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700">Kilometraje</label>
							<input
								type="number"
								name="kilometraje"
								value={formData.kilometraje || ""}
								onChange={handleInputChange}
								min="0"
								className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
								required
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700">Fecha de Adquisición</label>
							<input
								type="date"
								name="fecha_adquisicion"
								value={formData.fecha_adquisicion ? formData.fecha_adquisicion.toString().split("T")[0] : ""}
								onChange={handleInputChange}
								className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
								required
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700">Vencimiento SOAT</label>
							<input
								type="date"
								name="fecha_soat"
								value={formData.fecha_soat ? formData.fecha_soat.toString().split("T")[0] : ""}
								onChange={handleInputChange}
								className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
								required
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700">Vencimiento Revisión Técnica</label>
							<input
								type="date"
								name="fecha_revision_tecnica"
								value={formData.fecha_revision_tecnica ? formData.fecha_revision_tecnica.toString().split("T")[0] : ""}
								onChange={handleInputChange}
								className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
								required
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700">Estado</label>
							<select
								name="estado"
								value={formData.estado || "Operativo"}
								onChange={handleInputChange}
								className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
								required>
								<option value="Operativo">Operativo</option>
								<option value="Mantenimiento">Mantenimiento</option>
								<option value="Fuera de Servicio">Fuera de Servicio</option>
							</select>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700">Propietario</label>
							<select
								name="propietario"
								value={formData.propietario || "Empresa"}
								onChange={handleInputChange}
								className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
								required>
								<option value="Empresa">Empresa</option>
								<option value="Tercero">Tercero</option>
							</select>
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

			{/* Tabla de vehículos */}
			<DataTable columns={columns} data={vehiculos as VehiculoDataItem[]} title="Registro de Vehículos" defaultSort="placa" isLoading={loading} />
		</div>
	);
}
