"use client";

import { useState, useEffect } from "react";
import DataTable, { DataItem, Column } from "@/components/DataTable";
import { format } from "date-fns";
import { conductorService, Conductor } from "@/lib/supabaseServices";
import notificationService from "@/components/notifications/NotificationService";

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
		direccion: "",
		telefono: "",
		email: "",
		fecha_nacimiento: "",
		fecha_ingreso: new Date().toISOString().split("T")[0],
		estado: true,
		observaciones: "",
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
		},
		{
			header: "Apellidos",
			accessor: "apellidos",
		},
		{
			header: "DNI",
			accessor: "dni",
		},
		{
			header: "Licencia",
			accessor: "licencia",
		},
		{
			header: "Categoría",
			accessor: "categoria_licencia",
		},
		{
			header: "Venc. Licencia",
			accessor: "fecha_vencimiento_licencia",
			cell: (value: unknown, row: Conductor) => {
				const dateValue = row.fecha_vencimiento_licencia;
				return dateValue ? format(new Date(dateValue), "dd/MM/yyyy") : "";
			},
		},
		{
			header: "Teléfono",
			accessor: "telefono",
		},
		{
			header: "Estado",
			accessor: "estado",
			cell: (value: unknown, row: Conductor) => (
				<span className={`px-2 py-1 rounded-full text-xs font-medium ${row.estado ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>{row.estado ? "Activo" : "Inactivo"}</span>
			),
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
					{row.estado ? (
						<button onClick={() => handleChangeStatus(row.id, false)} className="text-yellow-600 hover:text-yellow-800">
							Desactivar
						</button>
					) : (
						<button onClick={() => handleChangeStatus(row.id, true)} className="text-green-600 hover:text-green-800">
							Activar
						</button>
					)}
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
				direccion: "",
				telefono: "",
				email: "",
				fecha_nacimiento: "",
				fecha_ingreso: new Date().toISOString().split("T")[0],
				estado: true,
				observaciones: "",
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
							<label className="block text-sm font-medium text-gray-700">Dirección</label>
							<input
								type="text"
								name="direccion"
								value={formData.direccion || ""}
								onChange={handleInputChange}
								className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700">Teléfono</label>
							<input
								type="text"
								name="telefono"
								value={formData.telefono || ""}
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
								value={formData.email || ""}
								onChange={handleInputChange}
								className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
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
