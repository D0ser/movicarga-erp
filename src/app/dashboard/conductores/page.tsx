"use client";

import { useState } from "react";
import DataTable, { DataItem } from "@/components/DataTable";
import { format } from "date-fns";

// Definición de la estructura de datos de Conductores
interface Conductor extends DataItem {
	id: number;
	nombres: string;
	apellidos: string;
	documento: string;
	tipoDocumento: "DNI" | "CE" | "Pasaporte";
	licencia: string;
	categoria: string;
	fechaNacimiento: string;
	telefono: string;
	email: string;
	direccion: string;
	fechaContratacion: string;
	fechaVencimientoLicencia: string;
	fechaVencimientoExamenMedico: string;
	estado: "Activo" | "Inactivo" | "Vacaciones" | "Licencia";
	observaciones: string;
	[key: string]: string | number | Date | boolean | null | undefined;
}

export default function ConductoresPage() {
	// En una aplicación real, estos datos vendrían de Supabase
	const [conductores, setConductores] = useState<Conductor[]>([
		{
			id: 1,
			nombres: "Juan",
			apellidos: "Pérez Gómez",
			documento: "45678912",
			tipoDocumento: "DNI",
			licencia: "Q45678912",
			categoria: "A-IIIb",
			fechaNacimiento: "1985-06-15",
			telefono: "987654321",
			email: "juan.perez@ejemplo.com",
			direccion: "Av. Los Pinos 123, Lima",
			fechaContratacion: "2023-02-10",
			fechaVencimientoLicencia: "2026-02-10",
			fechaVencimientoExamenMedico: "2025-08-15",
			estado: "Activo",
			observaciones: "Conductor con experiencia en rutas largas",
		},
		{
			id: 2,
			nombres: "Luis",
			apellidos: "Torres Mendoza",
			documento: "32165498",
			tipoDocumento: "DNI",
			licencia: "Q32165498",
			categoria: "A-IIIa",
			fechaNacimiento: "1990-03-24",
			telefono: "999888777",
			email: "luis.torres@ejemplo.com",
			direccion: "Jr. Las Flores 456, Trujillo",
			fechaContratacion: "2023-05-15",
			fechaVencimientoLicencia: "2025-05-15",
			fechaVencimientoExamenMedico: "2025-05-20",
			estado: "Activo",
			observaciones: "Especialista en transporte de materiales peligrosos",
		},
		{
			id: 3,
			nombres: "Carlos",
			apellidos: "Rodríguez Luna",
			documento: "78945612",
			tipoDocumento: "DNI",
			licencia: "Q78945612",
			categoria: "A-IIIc",
			fechaNacimiento: "1982-11-08",
			telefono: "951753852",
			email: "carlos.rodriguez@ejemplo.com",
			direccion: "Calle Los Álamos 789, Arequipa",
			fechaContratacion: "2022-08-01",
			fechaVencimientoLicencia: "2027-08-01",
			fechaVencimientoExamenMedico: "2025-07-30",
			estado: "Vacaciones",
			observaciones: "En vacaciones hasta el 30/04/2025",
		},
	]);

	const [showForm, setShowForm] = useState(false);
	const [formData, setFormData] = useState<Partial<Conductor>>({
		nombres: "",
		apellidos: "",
		documento: "",
		tipoDocumento: "DNI",
		licencia: "",
		categoria: "",
		fechaNacimiento: "",
		telefono: "",
		email: "",
		direccion: "",
		fechaContratacion: new Date().toISOString().split("T")[0],
		fechaVencimientoLicencia: "",
		fechaVencimientoExamenMedico: "",
		estado: "Activo",
		observaciones: "",
	});

	// Columnas para la tabla de conductores
	const columns = [
		{
			header: "Nombres y Apellidos",
			accessor: "nombreCompleto",
			cell: (value: unknown, row: Conductor) => `${row.nombres} ${row.apellidos}`,
		},
		{
			header: "Documento",
			accessor: "documento",
			cell: (value: unknown, row: Conductor) => `${row.tipoDocumento}: ${row.documento}`,
		},
		{
			header: "Licencia",
			accessor: "licencia",
		},
		{
			header: "Categoría",
			accessor: "categoria",
		},
		{
			header: "Teléfono",
			accessor: "telefono",
		},
		{
			header: "Venc. Licencia",
			accessor: "fechaVencimientoLicencia",
			cell: (value: unknown, row: Conductor) => format(new Date(row.fechaVencimientoLicencia), "dd/MM/yyyy"),
		},
		{
			header: "Venc. Examen",
			accessor: "fechaVencimientoExamenMedico",
			cell: (value: unknown, row: Conductor) => format(new Date(row.fechaVencimientoExamenMedico), "dd/MM/yyyy"),
		},
		{
			header: "Estado",
			accessor: "estado",
			cell: (value: unknown, row: Conductor) => {
				let colorClass = "";
				switch (row.estado) {
					case "Activo":
						colorClass = "bg-green-100 text-green-800";
						break;
					case "Inactivo":
						colorClass = "bg-red-100 text-red-800";
						break;
					case "Vacaciones":
						colorClass = "bg-blue-100 text-blue-800";
						break;
					case "Licencia":
						colorClass = "bg-yellow-100 text-yellow-800";
						break;
				}
				return <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>{row.estado}</span>;
			},
		},
		{
			header: "Acciones",
			accessor: "id",
			cell: (value: unknown, row: Conductor) => (
				<div className="flex space-x-2">
					<button onClick={() => handleEdit(row)} className="text-blue-600 hover:text-blue-800">
						Editar
					</button>
					<button onClick={() => handleDelete(row.id)} className="text-red-600 hover:text-red-800">
						Eliminar
					</button>
					{row.estado === "Activo" ? (
						<button onClick={() => handleChangeStatus(row.id, "Inactivo")} className="text-yellow-600 hover:text-yellow-800">
							Desactivar
						</button>
					) : row.estado === "Inactivo" ? (
						<button onClick={() => handleChangeStatus(row.id, "Activo")} className="text-green-600 hover:text-green-800">
							Activar
						</button>
					) : (
						<button onClick={() => handleChangeStatus(row.id, "Activo")} className="text-green-600 hover:text-green-800">
							Fin {row.estado}
						</button>
					)}
				</div>
			),
		},
	];

	// Funciones para manejo de formulario
	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
		const { name, value } = e.target;
		setFormData({
			...formData,
			[name]: value,
		});
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		const nuevoConductor: Conductor = {
			id: formData.id || Date.now(),
			nombres: formData.nombres || "",
			apellidos: formData.apellidos || "",
			documento: formData.documento || "",
			tipoDocumento: (formData.tipoDocumento as "DNI" | "CE" | "Pasaporte") || "DNI",
			licencia: formData.licencia || "",
			categoria: formData.categoria || "",
			fechaNacimiento: formData.fechaNacimiento || "",
			telefono: formData.telefono || "",
			email: formData.email || "",
			direccion: formData.direccion || "",
			fechaContratacion: formData.fechaContratacion || new Date().toISOString().split("T")[0],
			fechaVencimientoLicencia: formData.fechaVencimientoLicencia || "",
			fechaVencimientoExamenMedico: formData.fechaVencimientoExamenMedico || "",
			estado: (formData.estado as "Activo" | "Inactivo" | "Vacaciones" | "Licencia") || "Activo",
			observaciones: formData.observaciones || "",
		};

		if (formData.id) {
			// Actualizar conductor existente
			setConductores(conductores.map((c) => (c.id === formData.id ? nuevoConductor : c)));
		} else {
			// Agregar nuevo conductor
			setConductores([...conductores, nuevoConductor]);
		}

		// Limpiar formulario
		setFormData({
			nombres: "",
			apellidos: "",
			documento: "",
			tipoDocumento: "DNI",
			licencia: "",
			categoria: "",
			fechaNacimiento: "",
			telefono: "",
			email: "",
			direccion: "",
			fechaContratacion: new Date().toISOString().split("T")[0],
			fechaVencimientoLicencia: "",
			fechaVencimientoExamenMedico: "",
			estado: "Activo",
			observaciones: "",
		});

		setShowForm(false);
	};

	const handleEdit = (conductor: Conductor) => {
		setFormData({
			...conductor,
		});
		setShowForm(true);
	};

	const handleDelete = (id: number) => {
		if (confirm("¿Está seguro de que desea eliminar este conductor?")) {
			setConductores(conductores.filter((c) => c.id !== id));
		}
	};

	const handleChangeStatus = (id: number, nuevoEstado: "Activo" | "Inactivo" | "Vacaciones" | "Licencia") => {
		setConductores(conductores.map((c) => (c.id === id ? { ...c, estado: nuevoEstado } : c)));
	};

	// Estadísticas de conductores
	const conductoresActivos = conductores.filter((c) => c.estado === "Activo").length;
	const conductoresInactivos = conductores.filter((c) => c.estado === "Inactivo").length;
	const conductoresVacaciones = conductores.filter((c) => c.estado === "Vacaciones").length;
	const conductoresLicencia = conductores.filter((c) => c.estado === "Licencia").length;

	// Verificar documentos próximos a vencer (30 días)
	const hoy = new Date();
	const treintaDiasMs = 30 * 24 * 60 * 60 * 1000;

	const licenciasProximasVencer = conductores.filter((c) => {
		if (!c.fechaVencimientoLicencia) return false;
		const fechaVencimiento = new Date(c.fechaVencimientoLicencia);
		return fechaVencimiento.getTime() - hoy.getTime() <= treintaDiasMs && fechaVencimiento >= hoy;
	});

	const examenesProximosVencer = conductores.filter((c) => {
		if (!c.fechaVencimientoExamenMedico) return false;
		const fechaVencimiento = new Date(c.fechaVencimientoExamenMedico);
		return fechaVencimiento.getTime() - hoy.getTime() <= treintaDiasMs && fechaVencimiento >= hoy;
	});

	// Categorías de licencias de los conductores
	const categorias = conductores.reduce((acc, conductor) => {
		const cat = conductor.categoria;
		acc[cat] = (acc[cat] || 0) + 1;
		return acc;
	}, {} as Record<string, number>);

	return (
		<div className="space-y-6">
			<div className="flex justify-between items-center">
				<h1 className="text-2xl font-bold">Gestión de Conductores</h1>
				<button onClick={() => setShowForm(!showForm)} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
					{showForm ? "Cancelar" : "Nuevo Conductor"}
				</button>
			</div>

			{/* Estadísticas rápidas */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				<div className="bg-white p-6 rounded-lg shadow-md">
					<h3 className="font-bold text-lg mb-2">Resumen de Personal</h3>
					<div className="space-y-1">
						<div className="flex justify-between">
							<span>Total de conductores:</span>
							<span className="font-medium">{conductores.length}</span>
						</div>
						<div className="flex justify-between">
							<span>Conductores activos:</span>
							<span className="font-medium text-green-600">{conductoresActivos}</span>
						</div>
						<div className="flex justify-between">
							<span>Conductores inactivos:</span>
							<span className="font-medium text-red-600">{conductoresInactivos}</span>
						</div>
						<div className="flex justify-between">
							<span>En vacaciones:</span>
							<span className="font-medium text-blue-600">{conductoresVacaciones}</span>
						</div>
						<div className="flex justify-between">
							<span>En licencia:</span>
							<span className="font-medium text-yellow-600">{conductoresLicencia}</span>
						</div>
					</div>
				</div>

				<div className="bg-white p-6 rounded-lg shadow-md">
					<h3 className="font-bold text-lg mb-2">Documentos por Vencer</h3>
					<div className="space-y-1">
						<div className="flex justify-between">
							<span>Licencias (30 días):</span>
							<span className="font-medium text-amber-600">{licenciasProximasVencer.length}</span>
						</div>
						<div className="flex justify-between">
							<span>Exámenes médicos (30 días):</span>
							<span className="font-medium text-amber-600">{examenesProximosVencer.length}</span>
						</div>
					</div>
					{(licenciasProximasVencer.length > 0 || examenesProximosVencer.length > 0) && (
						<div className="mt-2 text-sm">
							<div className="font-medium text-amber-600">Próximos a vencer:</div>
							<ul className="list-disc pl-5 text-amber-700">
								{licenciasProximasVencer.map((c) => (
									<li key={`lic-${c.id}`}>
										{c.nombres} {c.apellidos} - Licencia: {format(new Date(c.fechaVencimientoLicencia), "dd/MM/yyyy")}
									</li>
								))}
								{examenesProximosVencer.map((c) => (
									<li key={`exam-${c.id}`}>
										{c.nombres} {c.apellidos} - Examen: {format(new Date(c.fechaVencimientoExamenMedico), "dd/MM/yyyy")}
									</li>
								))}
							</ul>
						</div>
					)}
				</div>

				<div className="bg-white p-6 rounded-lg shadow-md">
					<h3 className="font-bold text-lg mb-2">Categorías de Licencias</h3>
					<div className="space-y-1">
						{Object.entries(categorias).map(([categoria, cantidad]) => (
							<div key={categoria} className="flex justify-between">
								<span>Categoría {categoria}:</span>
								<span className="font-medium">{cantidad}</span>
							</div>
						))}
					</div>
				</div>
			</div>

			{/* Formulario de conductor */}
			{showForm && (
				<div className="bg-white p-6 rounded-lg shadow-md">
					<h2 className="text-xl font-bold mb-4">{formData.id ? "Editar Conductor" : "Nuevo Conductor"}</h2>
					<form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
						<div>
							<label className="block text-sm font-medium text-gray-700">Nombres</label>
							<input
								type="text"
								name="nombres"
								value={formData.nombres}
								onChange={handleInputChange}
								className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
								required
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700">Apellidos</label>
							<input
								type="text"
								name="apellidos"
								value={formData.apellidos}
								onChange={handleInputChange}
								className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
								required
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700">Tipo de Documento</label>
							<select
								name="tipoDocumento"
								value={formData.tipoDocumento}
								onChange={handleInputChange}
								className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
								required>
								<option value="DNI">DNI</option>
								<option value="CE">Carnet de Extranjería</option>
								<option value="Pasaporte">Pasaporte</option>
							</select>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700">Número de Documento</label>
							<input
								type="text"
								name="documento"
								value={formData.documento}
								onChange={handleInputChange}
								className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
								required
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700">Licencia de Conducir</label>
							<input
								type="text"
								name="licencia"
								value={formData.licencia}
								onChange={handleInputChange}
								className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
								required
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700">Categoría de Licencia</label>
							<input
								type="text"
								name="categoria"
								value={formData.categoria}
								onChange={handleInputChange}
								className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
								required
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700">Fecha de Nacimiento</label>
							<input
								type="date"
								name="fechaNacimiento"
								value={formData.fechaNacimiento}
								onChange={handleInputChange}
								className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
								required
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700">Teléfono</label>
							<input
								type="text"
								name="telefono"
								value={formData.telefono}
								onChange={handleInputChange}
								className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
								required
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700">Email</label>
							<input
								type="email"
								name="email"
								value={formData.email}
								onChange={handleInputChange}
								className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700">Dirección</label>
							<input
								type="text"
								name="direccion"
								value={formData.direccion}
								onChange={handleInputChange}
								className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
								required
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700">Fecha de Contratación</label>
							<input
								type="date"
								name="fechaContratacion"
								value={formData.fechaContratacion}
								onChange={handleInputChange}
								className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
								required
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700">Vencimiento de Licencia</label>
							<input
								type="date"
								name="fechaVencimientoLicencia"
								value={formData.fechaVencimientoLicencia}
								onChange={handleInputChange}
								className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
								required
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700">Vencimiento de Examen Médico</label>
							<input
								type="date"
								name="fechaVencimientoExamenMedico"
								value={formData.fechaVencimientoExamenMedico}
								onChange={handleInputChange}
								className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
								required
							/>
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
								<option value="Inactivo">Inactivo</option>
								<option value="Vacaciones">En Vacaciones</option>
								<option value="Licencia">En Licencia</option>
							</select>
						</div>

						<div className="col-span-full">
							<label className="block text-sm font-medium text-gray-700">Observaciones</label>
							<textarea
								name="observaciones"
								value={formData.observaciones}
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

			{/* Tabla de conductores */}
			<DataTable
				columns={columns}
				data={conductores}
				title="Registro de Conductores"
				defaultSort="nombres"
				filters={{
					searchField: "nombres",
					customFilters: [
						{
							name: "estado",
							label: "Estado",
							options: [
								{ value: "Activo", label: "Activo" },
								{ value: "Inactivo", label: "Inactivo" },
								{ value: "Vacaciones", label: "En Vacaciones" },
								{ value: "Licencia", label: "En Licencia" },
							],
						},
					],
				}}
			/>
		</div>
	);
}
