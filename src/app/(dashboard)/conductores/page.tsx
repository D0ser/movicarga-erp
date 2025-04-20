"use client";

import { useState, useEffect } from "react";
import DataTable, { DataItem, Column } from "@/components/DataTable";
import { format } from "date-fns";
import { conductorService, Conductor } from "@/lib/supabaseServices";
import notificationService from "@/components/notifications/NotificationService";
import { EditButton, DeleteButton, ActivateButton, DeactivateButton, ActionButtonGroup } from "@/components/ActionIcons";

// Componente para la página de conductores
export default function ConductoresPage() {
	const [loading, setLoading] = useState(true);
	const [conductores, setConductores] = useState<Conductor[]>([]);
	const [showForm, setShowForm] = useState(false);
	const [formData, setFormData] = useState<Partial<Conductor>>({
		nombres: "",
		apellidos: "",
		dni: "",
		licencia: "",
		categoria_licencia: "",
		fecha_vencimiento_licencia: new Date().toISOString().split("T")[0],
		fecha_nacimiento: "",
		fecha_ingreso: new Date().toISOString().split("T")[0],
		estado: true,
	});

	// Cargar datos desde Supabase al iniciar
	useEffect(() => {
		fetchConductores();
	}, []);

	const fetchConductores = async () => {
		try {
			setLoading(true);
			const data = await conductorService.getConductores();
			setConductores(data);
		} catch (error) {
			console.error("Error al cargar conductores:", error);
			notificationService.error("No se pudieron cargar los conductores");
		} finally {
			setLoading(false);
		}
	};

	// Columnas para la tabla de conductores
	const columns: Column<Conductor>[] = [
		{
			header: "Nombres",
			accessor: "nombres",
			cell: (value: unknown, row: Conductor) => {
				// Crear un avatar con las iniciales del nombre
				const nombre = row.nombres || "";
				const apellido = row.apellidos || "";
				const iniciales = (nombre.charAt(0) + (apellido ? apellido.charAt(0) : "")).toUpperCase();

				// Determinar color según estado del conductor
				const colorClass = row.estado ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800";

				return (
					<div className="flex items-center px-2">
						<div className={`flex-shrink-0 h-8 w-8 rounded-full ${colorClass} flex items-center justify-center font-bold mr-3`}>{iniciales}</div>
						<div className="text-sm font-medium text-gray-900">{row.nombres}</div>
					</div>
				);
			},
		},
		{
			header: "Apellidos",
			accessor: "apellidos",
			cell: (value: unknown, row: Conductor) => <div className="text-sm text-gray-900 px-2">{row.apellidos}</div>,
		},
		{
			header: "DNI",
			accessor: "dni",
			cell: (value: unknown, row: Conductor) => (
				<div className="text-center">
					<span className="font-mono bg-gray-50 px-2 py-1 rounded text-gray-700">{row.dni || "-"}</span>
				</div>
			),
		},
		{
			header: "Licencia",
			accessor: "licencia",
			cell: (value: unknown, row: Conductor) => (
				<div className="flex justify-center">
					<span className="font-mono bg-yellow-50 px-2 py-1 rounded text-yellow-700 flex items-center">
						<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={1.5}
								d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2"
							/>
						</svg>
						{row.licencia}
					</span>
				</div>
			),
		},
		{
			header: "Categoría",
			accessor: "categoria_licencia",
			cell: (value: unknown, row: Conductor) => {
				// Definir colores para diferentes categorías
				let colorClass = "bg-gray-100 text-gray-800";

				if (row.categoria_licencia) {
					if (row.categoria_licencia.includes("III")) {
						colorClass = "bg-purple-100 text-purple-800";
					} else if (row.categoria_licencia.includes("II")) {
						colorClass = "bg-blue-100 text-blue-800";
					} else if (row.categoria_licencia.includes("I")) {
						colorClass = "bg-green-100 text-green-800";
					}
				}

				return (
					<div className="flex justify-center">
						<span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>{row.categoria_licencia || "No asignada"}</span>
					</div>
				);
			},
		},
		{
			header: "Venc. Licencia",
			accessor: "fecha_vencimiento_licencia",
			cell: (value: unknown, row: Conductor) => {
				const dateValue = row.fecha_vencimiento_licencia;
				if (!dateValue) return <div className="text-center">No disponible</div>;

				const fechaVencimiento = new Date(dateValue);
				const fechaActual = new Date();

				// Calcular días restantes
				const diferenciaDias = Math.ceil((fechaVencimiento.getTime() - fechaActual.getTime()) / (1000 * 60 * 60 * 24));

				// Aplicar colores según el vencimiento
				let colorClass = "";
				if (diferenciaDias < 0) {
					// Vencido
					colorClass = "bg-red-100 text-red-800";
				} else if (diferenciaDias <= 30) {
					// Por vencer en menos de 30 días
					colorClass = "bg-yellow-100 text-yellow-800";
				} else {
					// Vigente
					colorClass = "bg-green-100 text-green-800";
				}

				return (
					<div className="flex justify-center">
						<span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>{format(fechaVencimiento, "dd/MM/yyyy")}</span>
					</div>
				);
			},
		},
		{
			header: "Estado",
			accessor: "estado",
			cell: (value: unknown, row: Conductor) => (
				<div className="flex justify-center">
					<span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center ${row.estado ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
						{row.estado ? (
							<>
								<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
								</svg>
								Activo
							</>
						) : (
							<>
								<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
								</svg>
								Inactivo
							</>
						)}
					</span>
				</div>
			),
		},
		{
			header: "Acciones",
			accessor: "id",
			cell: (value: unknown, row: Conductor) => (
				<ActionButtonGroup>
					<EditButton onClick={() => handleEdit(row)} />
					<DeleteButton onClick={() => handleDelete(row.id)} />
					{row.estado ? <DeactivateButton onClick={() => handleChangeStatus(row.id, false)} /> : <ActivateButton onClick={() => handleChangeStatus(row.id, true)} />}
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
		} else if (name === "estado") {
			processedValue = value === "true";
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
				// Actualizar conductor existente
				const updatedConductor = await conductorService.updateConductor(formData.id, formData);
				setConductores(conductores.map((c) => (c.id === updatedConductor.id ? updatedConductor : c)));
				notificationService.success("Conductor actualizado correctamente");
			} else {
				// Agregar nuevo conductor
				const newConductor = await conductorService.createConductor(formData as Omit<Conductor, "id">);
				setConductores([...conductores, newConductor]);
				notificationService.success("Conductor creado correctamente");
			}

			// Limpiar formulario
			setFormData({
				nombres: "",
				apellidos: "",
				dni: "",
				licencia: "",
				categoria_licencia: "",
				fecha_vencimiento_licencia: new Date().toISOString().split("T")[0],
				fecha_nacimiento: "",
				fecha_ingreso: new Date().toISOString().split("T")[0],
				estado: true,
			});

			setShowForm(false);
		} catch (error) {
			console.error("Error al guardar conductor:", error);
			notificationService.error("No se pudo guardar el conductor");
		} finally {
			setLoading(false);
		}
	};

	const handleEdit = (conductor: Conductor) => {
		setFormData({
			...conductor,
		});
		setShowForm(true);
	};

	const handleDelete = async (id: string) => {
		if (confirm("¿Está seguro de que desea eliminar este conductor?")) {
			try {
				setLoading(true);
				await conductorService.deleteConductor(id);
				setConductores(conductores.filter((c) => c.id !== id));
				notificationService.success("Conductor eliminado correctamente");
			} catch (error) {
				console.error("Error al eliminar conductor:", error);
				notificationService.error("No se pudo eliminar el conductor");
			} finally {
				setLoading(false);
			}
		}
	};

	const handleChangeStatus = async (id: string, newStatus: boolean) => {
		try {
			setLoading(true);
			const updatedConductor = await conductorService.updateConductor(id, { estado: newStatus });
			setConductores(conductores.map((c) => (c.id === id ? updatedConductor : c)));
			notificationService.success(`Conductor ${newStatus ? "activado" : "desactivado"} correctamente`);
		} catch (error) {
			console.error("Error al cambiar estado del conductor:", error);
			notificationService.error("No se pudo cambiar el estado del conductor");
		} finally {
			setLoading(false);
		}
	};

	// Estadísticas de conductores
	const conductoresActivos = conductores.filter((c) => c.estado).length;
	const conductoresInactivos = conductores.filter((c) => !c.estado).length;
	const licenciasVencidas = conductores.filter((c) => {
		if (!c.fecha_vencimiento_licencia) return false;
		return new Date(c.fecha_vencimiento_licencia) < new Date();
	}).length;

	if (loading && conductores.length === 0) {
		return <div className="flex justify-center items-center h-64">Cargando conductores...</div>;
	}

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
					<h3 className="font-bold text-lg mb-2">Resumen de Conductores</h3>
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
					</div>
				</div>

				<div className="bg-white p-6 rounded-lg shadow-md">
					<h3 className="font-bold text-lg mb-2">Licencias</h3>
					<div className="space-y-1">
						<div className="flex justify-between">
							<span>Licencias vigentes:</span>
							<span className="font-medium">{conductoresActivos - licenciasVencidas}</span>
						</div>
						<div className="flex justify-between">
							<span>Licencias vencidas:</span>
							<span className="font-medium text-red-600">{licenciasVencidas}</span>
						</div>
					</div>
				</div>

				<div className="bg-white p-6 rounded-lg shadow-md">
					<h3 className="font-bold text-lg mb-2">Categorías de Licencia</h3>
					<div className="space-y-1">
						{["A-I", "A-II", "A-III", "A-IIIA", "A-IIIB", "A-IIIC"].map((categoria) => {
							const cantidad = conductores.filter((c) => c.categoria_licencia === categoria).length;
							return (
								<div key={categoria} className="flex justify-between">
									<span>Categoría {categoria}:</span>
									<span className="font-medium">{cantidad}</span>
								</div>
							);
						})}
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
								value={formData.nombres || ""}
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
								value={formData.apellidos || ""}
								onChange={handleInputChange}
								className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
								required
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700">DNI</label>
							<input
								type="text"
								name="dni"
								value={formData.dni || ""}
								onChange={handleInputChange}
								maxLength={8}
								className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
								required
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700">Licencia</label>
							<input
								type="text"
								name="licencia"
								value={formData.licencia || ""}
								onChange={handleInputChange}
								className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
								required
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700">Categoría de Licencia</label>
							<select
								name="categoria_licencia"
								value={formData.categoria_licencia || ""}
								onChange={handleInputChange}
								className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
								required>
								<option value="">Seleccione una categoría</option>
								<option value="A-I">A-I</option>
								<option value="A-II">A-II</option>
								<option value="A-III">A-III</option>
								<option value="A-IIIA">A-IIIA</option>
								<option value="A-IIIB">A-IIIB</option>
								<option value="A-IIIC">A-IIIC</option>
							</select>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700">Fecha Vencimiento Licencia</label>
							<input
								type="date"
								name="fecha_vencimiento_licencia"
								value={formData.fecha_vencimiento_licencia ? formData.fecha_vencimiento_licencia.toString().split("T")[0] : ""}
								onChange={handleInputChange}
								className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
								required
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700">Fecha de Nacimiento</label>
							<input
								type="date"
								name="fecha_nacimiento"
								value={formData.fecha_nacimiento ? formData.fecha_nacimiento.toString().split("T")[0] : ""}
								onChange={handleInputChange}
								className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700">Fecha de Ingreso</label>
							<input
								type="date"
								name="fecha_ingreso"
								value={formData.fecha_ingreso ? formData.fecha_ingreso.toString().split("T")[0] : ""}
								onChange={handleInputChange}
								className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
								required
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700">Estado</label>
							<select
								name="estado"
								value={formData.estado?.toString() || "true"}
								onChange={handleInputChange}
								className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
								required>
								<option value="true">Activo</option>
								<option value="false">Inactivo</option>
							</select>
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
				defaultSort="apellidos"
				filters={{
					searchField: "apellidos",
				}}
				isLoading={loading}
			/>
		</div>
	);
}
