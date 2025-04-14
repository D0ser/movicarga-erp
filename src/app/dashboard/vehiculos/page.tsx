"use client";

import { useState } from "react";
import DataTable from "@/components/DataTable";
import { format } from "date-fns";

// Definición de la estructura de datos de Vehículos
interface Vehiculo {
	id: number;
	tipo: "Tracto" | "Carreta";
	placa: string;
	marca: string;
	modelo: string;
	año: number;
	soat: string;
	vencimientoSoat: string;
	revisionTecnica: string;
	vencimientoRevision: string;
	capacidadCarga: number;
	unidadMedida: string;
	estado: "Activo" | "En mantenimiento" | "Inactivo";
	conductorAsignado: string;
	observacion: string;
	fechaAdquisicion: string;
	proximoMantenimiento: string;
}

export default function VehiculosPage() {
	// En una aplicación real, estos datos vendrían de Supabase
	const [vehiculos, setVehiculos] = useState<Vehiculo[]>([
		{
			id: 1,
			tipo: "Tracto",
			placa: "ABC-123",
			marca: "Volvo",
			modelo: "FH16",
			año: 2022,
			soat: "SOAT-001-2025",
			vencimientoSoat: "2025-12-31",
			revisionTecnica: "RT-001-2025",
			vencimientoRevision: "2025-06-30",
			capacidadCarga: 30,
			unidadMedida: "Toneladas",
			estado: "Activo",
			conductorAsignado: "Juan Pérez",
			observacion: "Excelente estado",
			fechaAdquisicion: "2022-05-15",
			proximoMantenimiento: "2025-05-15",
		},
		{
			id: 2,
			tipo: "Carreta",
			placa: "XYZ-789",
			marca: "Randon",
			modelo: "R-345",
			año: 2021,
			soat: "N/A",
			vencimientoSoat: "",
			revisionTecnica: "RT-002-2025",
			vencimientoRevision: "2025-07-15",
			capacidadCarga: 35,
			unidadMedida: "Toneladas",
			estado: "En mantenimiento",
			conductorAsignado: "N/A",
			observacion: "En mantenimiento preventivo",
			fechaAdquisicion: "2021-08-20",
			proximoMantenimiento: "2025-04-25",
		},
		{
			id: 3,
			tipo: "Tracto",
			placa: "DEF-456",
			marca: "Scania",
			modelo: "R500",
			año: 2023,
			soat: "SOAT-002-2025",
			vencimientoSoat: "2025-11-15",
			revisionTecnica: "RT-003-2025",
			vencimientoRevision: "2025-08-10",
			capacidadCarga: 32,
			unidadMedida: "Toneladas",
			estado: "Activo",
			conductorAsignado: "Luis Torres",
			observacion: "Nuevo, adquirido recientemente",
			fechaAdquisicion: "2023-02-10",
			proximoMantenimiento: "2025-06-10",
		},
	]);

	const [showForm, setShowForm] = useState(false);
	const [formData, setFormData] = useState<Partial<Vehiculo>>({
		tipo: "Tracto",
		placa: "",
		marca: "",
		modelo: "",
		año: new Date().getFullYear(),
		soat: "",
		vencimientoSoat: "",
		revisionTecnica: "",
		vencimientoRevision: "",
		capacidadCarga: 0,
		unidadMedida: "Toneladas",
		estado: "Activo",
		conductorAsignado: "",
		observacion: "",
		fechaAdquisicion: new Date().toISOString().split("T")[0],
		proximoMantenimiento: "",
	});

	// Columnas para la tabla de vehículos
	const columns = [
		{
			header: "Tipo",
			accessor: "tipo",
		},
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
			accessor: "año",
		},
		{
			header: "SOAT",
			accessor: "soat",
		},
		{
			header: "Venc. SOAT",
			accessor: "vencimientoSoat",
			cell: (value: string) => (value ? format(new Date(value), "dd/MM/yyyy") : "N/A"),
		},
		{
			header: "Revisión",
			accessor: "revisionTecnica",
		},
		{
			header: "Venc. Revisión",
			accessor: "vencimientoRevision",
			cell: (value: string) => (value ? format(new Date(value), "dd/MM/yyyy") : "N/A"),
		},
		{
			header: "Capacidad",
			accessor: "capacidadCarga",
			cell: (value: number, row: Vehiculo) => `${value} ${row.unidadMedida}`,
		},
		{
			header: "Estado",
			accessor: "estado",
			cell: (value: string) => (
				<span
					className={`px-2 py-1 rounded-full text-xs font-medium ${
						value === "Activo" ? "bg-green-100 text-green-800" : value === "En mantenimiento" ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"
					}`}>
					{value}
				</span>
			),
		},
		{
			header: "Conductor",
			accessor: "conductorAsignado",
		},
		{
			header: "Próx. Mantenimiento",
			accessor: "proximoMantenimiento",
			cell: (value: string) => (value ? format(new Date(value), "dd/MM/yyyy") : "No programado"),
		},
		{
			header: "Acciones",
			accessor: "id",
			cell: (value: number, row: Vehiculo) => (
				<div className="flex space-x-2">
					<button onClick={() => handleEdit(row)} className="text-blue-600 hover:text-blue-800">
						Editar
					</button>
					<button onClick={() => handleDelete(value)} className="text-red-600 hover:text-red-800">
						Eliminar
					</button>
					{row.estado !== "En mantenimiento" ? (
						<button onClick={() => handleSetMantenimiento(value)} className="text-yellow-600 hover:text-yellow-800">
							Mantenimiento
						</button>
					) : (
						<button onClick={() => handleSetActivo(value)} className="text-green-600 hover:text-green-800">
							Activar
						</button>
					)}
				</div>
			),
		},
	];

	// Funciones para manejo de formulario
	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		const { name, value, type } = e.target;
		setFormData({
			...formData,
			[name]: type === "number" ? parseInt(value) || 0 : value,
		});
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		const nuevoVehiculo: Vehiculo = {
			id: formData.id || Date.now(),
			tipo: formData.tipo as "Tracto" | "Carreta",
			placa: formData.placa || "",
			marca: formData.marca || "",
			modelo: formData.modelo || "",
			año: formData.año || new Date().getFullYear(),
			soat: formData.soat || "",
			vencimientoSoat: formData.vencimientoSoat || "",
			revisionTecnica: formData.revisionTecnica || "",
			vencimientoRevision: formData.vencimientoRevision || "",
			capacidadCarga: formData.capacidadCarga || 0,
			unidadMedida: formData.unidadMedida || "Toneladas",
			estado: formData.estado as "Activo" | "En mantenimiento" | "Inactivo",
			conductorAsignado: formData.conductorAsignado || "",
			observacion: formData.observacion || "",
			fechaAdquisicion: formData.fechaAdquisicion || new Date().toISOString().split("T")[0],
			proximoMantenimiento: formData.proximoMantenimiento || "",
		};

		if (formData.id) {
			// Actualizar vehículo existente
			setVehiculos(vehiculos.map((v) => (v.id === formData.id ? nuevoVehiculo : v)));
		} else {
			// Agregar nuevo vehículo
			setVehiculos([...vehiculos, nuevoVehiculo]);
		}

		// Limpiar formulario
		setFormData({
			tipo: "Tracto",
			placa: "",
			marca: "",
			modelo: "",
			año: new Date().getFullYear(),
			soat: "",
			vencimientoSoat: "",
			revisionTecnica: "",
			vencimientoRevision: "",
			capacidadCarga: 0,
			unidadMedida: "Toneladas",
			estado: "Activo",
			conductorAsignado: "",
			observacion: "",
			fechaAdquisicion: new Date().toISOString().split("T")[0],
			proximoMantenimiento: "",
		});

		setShowForm(false);
	};

	const handleEdit = (vehiculo: Vehiculo) => {
		setFormData({
			...vehiculo,
		});
		setShowForm(true);
	};

	const handleDelete = (id: number) => {
		if (confirm("¿Está seguro de que desea eliminar este vehículo?")) {
			setVehiculos(vehiculos.filter((v) => v.id !== id));
		}
	};

	const handleSetMantenimiento = (id: number) => {
		setVehiculos(vehiculos.map((v) => (v.id === id ? { ...v, estado: "En mantenimiento" } : v)));
	};

	const handleSetActivo = (id: number) => {
		setVehiculos(vehiculos.map((v) => (v.id === id ? { ...v, estado: "Activo" } : v)));
	};

	// Para alertas de vencimientos próximos
	const hoy = new Date();
	const treintaDiasMs = 30 * 24 * 60 * 60 * 1000;
	const vencimientosSoatProximos = vehiculos.filter((v) => {
		if (!v.vencimientoSoat) return false;
		const fechaVencimiento = new Date(v.vencimientoSoat);
		return fechaVencimiento.getTime() - hoy.getTime() <= treintaDiasMs;
	});

	const vencimientosRevisionProximos = vehiculos.filter((v) => {
		if (!v.vencimientoRevision) return false;
		const fechaVencimiento = new Date(v.vencimientoRevision);
		return fechaVencimiento.getTime() - hoy.getTime() <= treintaDiasMs;
	});

	const mantenimientosProximos = vehiculos.filter((v) => {
		if (!v.proximoMantenimiento) return false;
		const fechaMantenimiento = new Date(v.proximoMantenimiento);
		return fechaMantenimiento.getTime() - hoy.getTime() <= treintaDiasMs;
	});

	return (
		<div className="space-y-6">
			<div className="flex justify-between items-center">
				<h1 className="text-2xl font-bold">Gestión de Vehículos</h1>
				<button onClick={() => setShowForm(!showForm)} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
					{showForm ? "Cancelar" : "Nuevo Vehículo"}
				</button>
			</div>

			{/* Alertas de vencimientos */}
			{(vencimientosSoatProximos.length > 0 || vencimientosRevisionProximos.length > 0 || mantenimientosProximos.length > 0) && (
				<div className="bg-orange-50 border-l-4 border-orange-400 p-4 rounded-md">
					<div className="flex">
						<div className="flex-shrink-0">
							<svg className="h-5 w-5 text-orange-400" viewBox="0 0 20 20" fill="currentColor">
								<path
									fillRule="evenodd"
									d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
									clipRule="evenodd"
								/>
							</svg>
						</div>
						<div className="ml-3">
							<h3 className="text-sm font-medium text-orange-800">Alertas de vencimientos próximos (30 días)</h3>
							<div className="mt-2 text-sm text-orange-700">
								<ul className="list-disc pl-5 space-y-1">
									{vencimientosSoatProximos.length > 0 && <li>SOAT: {vencimientosSoatProximos.map((v) => v.placa).join(", ")}</li>}
									{vencimientosRevisionProximos.length > 0 && <li>Revisión técnica: {vencimientosRevisionProximos.map((v) => v.placa).join(", ")}</li>}
									{mantenimientosProximos.length > 0 && <li>Mantenimiento: {mantenimientosProximos.map((v) => v.placa).join(", ")}</li>}
								</ul>
							</div>
						</div>
					</div>
				</div>
			)}

			{showForm && (
				<div className="bg-white p-6 rounded-lg shadow-md">
					<h2 className="text-xl font-bold mb-4">{formData.id ? "Editar Vehículo" : "Nuevo Vehículo"}</h2>
					<form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
						<div>
							<label className="block text-sm font-medium text-gray-700">Tipo</label>
							<select
								name="tipo"
								value={formData.tipo}
								onChange={handleInputChange}
								className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
								required>
								<option value="Tracto">Tracto</option>
								<option value="Carreta">Carreta</option>
							</select>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700">Placa</label>
							<input
								type="text"
								name="placa"
								value={formData.placa}
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
								value={formData.marca}
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
								value={formData.modelo}
								onChange={handleInputChange}
								className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
								required
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700">Año</label>
							<input
								type="number"
								name="año"
								value={formData.año}
								onChange={handleInputChange}
								className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
								required
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700">SOAT</label>
							<input
								type="text"
								name="soat"
								value={formData.soat}
								onChange={handleInputChange}
								className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700">Vencimiento SOAT</label>
							<input
								type="date"
								name="vencimientoSoat"
								value={formData.vencimientoSoat}
								onChange={handleInputChange}
								className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700">Revisión Técnica</label>
							<input
								type="text"
								name="revisionTecnica"
								value={formData.revisionTecnica}
								onChange={handleInputChange}
								className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
								required
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700">Vencimiento Revisión</label>
							<input
								type="date"
								name="vencimientoRevision"
								value={formData.vencimientoRevision}
								onChange={handleInputChange}
								className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
								required
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700">Capacidad de Carga</label>
							<input
								type="number"
								name="capacidadCarga"
								value={formData.capacidadCarga}
								onChange={handleInputChange}
								className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
								required
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700">Unidad de Medida</label>
							<select
								name="unidadMedida"
								value={formData.unidadMedida}
								onChange={handleInputChange}
								className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
								required>
								<option value="Toneladas">Toneladas</option>
								<option value="Kilogramos">Kilogramos</option>
								<option value="Metros cúbicos">Metros cúbicos</option>
							</select>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700">Estado</label>
							<select
								name="estado"
								value={formData.estado}
								onChange={handleInputChange}
								className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
								required>
								<option value="Activo">Activo</option>
								<option value="En mantenimiento">En mantenimiento</option>
								<option value="Inactivo">Inactivo</option>
							</select>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700">Conductor Asignado</label>
							<input
								type="text"
								name="conductorAsignado"
								value={formData.conductorAsignado}
								onChange={handleInputChange}
								className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700">Fecha de Adquisición</label>
							<input
								type="date"
								name="fechaAdquisicion"
								value={formData.fechaAdquisicion}
								onChange={handleInputChange}
								className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
								required
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700">Próximo Mantenimiento</label>
							<input
								type="date"
								name="proximoMantenimiento"
								value={formData.proximoMantenimiento}
								onChange={handleInputChange}
								className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
							/>
						</div>

						<div className="col-span-full">
							<label className="block text-sm font-medium text-gray-700">Observaciones</label>
							<textarea
								name="observacion"
								value={formData.observacion}
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

			<DataTable
				columns={columns}
				data={vehiculos}
				title="Flota de Vehículos"
				defaultSort="placa"
				filters={{
					searchField: "placa",
				}}
			/>

			{/* Resumen estadístico */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				<div className="bg-white p-4 rounded-lg shadow-md">
					<h3 className="font-bold text-lg mb-2">Resumen de Flota</h3>
					<div className="space-y-1">
						<div className="flex justify-between">
							<span>Total de vehículos:</span>
							<span className="font-medium">{vehiculos.length}</span>
						</div>
						<div className="flex justify-between">
							<span>Tractos:</span>
							<span className="font-medium">{vehiculos.filter((v) => v.tipo === "Tracto").length}</span>
						</div>
						<div className="flex justify-between">
							<span>Carretas:</span>
							<span className="font-medium">{vehiculos.filter((v) => v.tipo === "Carreta").length}</span>
						</div>
						<div className="flex justify-between">
							<span>Activos:</span>
							<span className="font-medium">{vehiculos.filter((v) => v.estado === "Activo").length}</span>
						</div>
						<div className="flex justify-between">
							<span>En mantenimiento:</span>
							<span className="font-medium">{vehiculos.filter((v) => v.estado === "En mantenimiento").length}</span>
						</div>
						<div className="flex justify-between">
							<span>Inactivos:</span>
							<span className="font-medium">{vehiculos.filter((v) => v.estado === "Inactivo").length}</span>
						</div>
					</div>
				</div>

				<div className="bg-white p-4 rounded-lg shadow-md">
					<h3 className="font-bold text-lg mb-2">Documentación</h3>
					<div className="space-y-1">
						<div className="flex justify-between">
							<span>SOAT vigentes:</span>
							<span className="font-medium">
								{
									vehiculos.filter((v) => {
										if (!v.vencimientoSoat) return false;
										return new Date(v.vencimientoSoat) > new Date();
									}).length
								}
							</span>
						</div>
						<div className="flex justify-between">
							<span>SOAT vencidos:</span>
							<span className="font-medium">
								{
									vehiculos.filter((v) => {
										if (!v.vencimientoSoat) return false;
										return new Date(v.vencimientoSoat) <= new Date();
									}).length
								}
							</span>
						</div>
						<div className="flex justify-between">
							<span>Revisiones vigentes:</span>
							<span className="font-medium">
								{
									vehiculos.filter((v) => {
										if (!v.vencimientoRevision) return false;
										return new Date(v.vencimientoRevision) > new Date();
									}).length
								}
							</span>
						</div>
						<div className="flex justify-between">
							<span>Revisiones vencidas:</span>
							<span className="font-medium">
								{
									vehiculos.filter((v) => {
										if (!v.vencimientoRevision) return false;
										return new Date(v.vencimientoRevision) <= new Date();
									}).length
								}
							</span>
						</div>
					</div>
				</div>

				<div className="bg-white p-4 rounded-lg shadow-md">
					<h3 className="font-bold text-lg mb-2">Mantenimientos</h3>
					<div className="space-y-1">
						<div className="flex justify-between">
							<span>Programados (30 días):</span>
							<span className="font-medium">{mantenimientosProximos.length}</span>
						</div>
						<div className="flex justify-between">
							<span>Vehículos sin mantenimiento programado:</span>
							<span className="font-medium">{vehiculos.filter((v) => !v.proximoMantenimiento).length}</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
