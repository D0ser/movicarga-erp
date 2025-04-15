"use client";

import { useState, useEffect } from "react";
import DataTable, { DataItem, Column } from "@/components/DataTable";
import { format } from "date-fns";
import { clienteService, Cliente } from "@/lib/supabaseServices";
import notificationService from "@/components/notifications/NotificationService";

// Componente para la página de clientes
export default function ClientesPage() {
	const [loading, setLoading] = useState(true);
	const [clientes, setClientes] = useState<Cliente[]>([]);
	const [showForm, setShowForm] = useState(false);
	const [formData, setFormData] = useState<Partial<Cliente>>({
		razon_social: "",
		ruc: "",
		direccion: "",
		ciudad: "",
		contacto: "",
		telefono: "",
		email: "",
		tipo_cliente: "Empresa",
		fecha_registro: new Date().toISOString().split("T")[0],
		estado: true,
		limite_credito: 0,
		dias_credito: 0,
		observaciones: "",
	});

	// Cargar datos desde Supabase al iniciar
	useEffect(() => {
		fetchClientes();
	}, []);

	const fetchClientes = async () => {
		try {
			setLoading(true);
			const data = await clienteService.getClientes();
			setClientes(data);
		} catch (error) {
			console.error("Error al cargar clientes:", error);
			notificationService.error("No se pudieron cargar los clientes");
		} finally {
			setLoading(false);
		}
	};

	// Columnas para la tabla de clientes
	const columns: Column<Cliente>[] = [
		{
			header: "Razón Social",
			accessor: "razon_social",
		},
		{
			header: "RUC",
			accessor: "ruc",
		},
		{
			header: "Contacto",
			accessor: "contacto",
		},
		{
			header: "Teléfono",
			accessor: "telefono",
		},
		{
			header: "Email",
			accessor: "email",
		},
		{
			header: "Ciudad",
			accessor: "ciudad",
		},
		{
			header: "Tipo",
			accessor: "tipo_cliente",
		},
		{
			header: "Fecha Registro",
			accessor: "fecha_registro",
			cell: (value: unknown, row: Cliente) => {
				const dateValue = row.fecha_registro;
				return dateValue ? format(new Date(dateValue), "dd/MM/yyyy") : "";
			},
		},
		{
			header: "Estado",
			accessor: "estado",
			cell: (value: unknown, row: Cliente) => (
				<span className={`px-2 py-1 rounded-full text-xs font-medium ${row.estado ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>{row.estado ? "Activo" : "Inactivo"}</span>
			),
		},
		{
			header: "Límite Crédito",
			accessor: "limite_credito",
			cell: (value: unknown, row: Cliente) => `S/. ${row.limite_credito.toLocaleString("es-PE")}`,
		},
		{
			header: "Días Crédito",
			accessor: "dias_credito",
		},
		{
			header: "Acciones",
			accessor: "id",
			cell: (value: unknown, row: Cliente) => (
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
				// Actualizar cliente existente
				const updatedCliente = await clienteService.updateCliente(formData.id, formData);
				setClientes(clientes.map((c) => (c.id === updatedCliente.id ? updatedCliente : c)));
				notificationService.success("Cliente actualizado correctamente");
			} else {
				// Agregar nuevo cliente
				const newCliente = await clienteService.createCliente(formData as Omit<Cliente, "id">);
				setClientes([...clientes, newCliente]);
				notificationService.success("Cliente creado correctamente");
			}

			// Limpiar formulario
			setFormData({
				razon_social: "",
				ruc: "",
				direccion: "",
				ciudad: "",
				contacto: "",
				telefono: "",
				email: "",
				tipo_cliente: "Empresa",
				fecha_registro: new Date().toISOString().split("T")[0],
				estado: true,
				limite_credito: 0,
				dias_credito: 0,
				observaciones: "",
			});

			setShowForm(false);
		} catch (error) {
			console.error("Error al guardar cliente:", error);
			notificationService.error("No se pudo guardar el cliente");
		} finally {
			setLoading(false);
		}
	};

	const handleEdit = (cliente: Cliente) => {
		setFormData({
			...cliente,
		});
		setShowForm(true);
	};

	const handleDelete = async (id: string) => {
		if (confirm("¿Está seguro de que desea eliminar este cliente?")) {
			try {
				setLoading(true);
				await clienteService.deleteCliente(id);
				setClientes(clientes.filter((c) => c.id !== id));
				notificationService.success("Cliente eliminado correctamente");
			} catch (error) {
				console.error("Error al eliminar cliente:", error);
				notificationService.error("No se pudo eliminar el cliente");
			} finally {
				setLoading(false);
			}
		}
	};

	const handleChangeStatus = async (id: string, newStatus: boolean) => {
		try {
			setLoading(true);
			const updatedCliente = await clienteService.updateCliente(id, { estado: newStatus });
			setClientes(clientes.map((c) => (c.id === id ? updatedCliente : c)));
			notificationService.success(`Cliente ${newStatus ? "activado" : "desactivado"} correctamente`);
		} catch (error) {
			console.error("Error al cambiar estado del cliente:", error);
			notificationService.error("No se pudo cambiar el estado del cliente");
		} finally {
			setLoading(false);
		}
	};

	// Estadísticas de clientes
	const clientesActivos = clientes.filter((c) => c.estado).length;
	const clientesInactivos = clientes.filter((c) => !c.estado).length;
	const totalCredito = clientes.reduce((sum, c) => sum + c.limite_credito, 0);

	if (loading && clientes.length === 0) {
		return <div className="flex justify-center items-center h-64">Cargando clientes...</div>;
	}

	return (
		<div className="space-y-6">
			<div className="flex justify-between items-center">
				<h1 className="text-2xl font-bold">Gestión de Clientes</h1>
				<button onClick={() => setShowForm(!showForm)} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
					{showForm ? "Cancelar" : "Nuevo Cliente"}
				</button>
			</div>

			{/* Estadísticas rápidas */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				<div className="bg-white p-6 rounded-lg shadow-md">
					<h3 className="font-bold text-lg mb-2">Resumen de Clientes</h3>
					<div className="space-y-1">
						<div className="flex justify-between">
							<span>Total de clientes:</span>
							<span className="font-medium">{clientes.length}</span>
						</div>
						<div className="flex justify-between">
							<span>Clientes activos:</span>
							<span className="font-medium text-green-600">{clientesActivos}</span>
						</div>
						<div className="flex justify-between">
							<span>Clientes inactivos:</span>
							<span className="font-medium text-red-600">{clientesInactivos}</span>
						</div>
					</div>
				</div>

				<div className="bg-white p-6 rounded-lg shadow-md">
					<h3 className="font-bold text-lg mb-2">Crédito</h3>
					<div className="space-y-1">
						<div className="flex justify-between">
							<span>Total de crédito otorgado:</span>
							<span className="font-medium">S/. {totalCredito.toLocaleString("es-PE")}</span>
						</div>
						<div className="flex justify-between">
							<span>Crédito promedio:</span>
							<span className="font-medium">S/. {clientes.length > 0 ? (totalCredito / clientes.length).toLocaleString("es-PE") : 0}</span>
						</div>
					</div>
				</div>

				<div className="bg-white p-6 rounded-lg shadow-md">
					<h3 className="font-bold text-lg mb-2">Distribución</h3>
					<div className="space-y-1">
						<div className="flex justify-between">
							<span>Empresas:</span>
							<span className="font-medium">{clientes.filter((c) => c.tipo_cliente === "Empresa").length}</span>
						</div>
						<div className="flex justify-between">
							<span>Personas:</span>
							<span className="font-medium">{clientes.filter((c) => c.tipo_cliente === "Persona").length}</span>
						</div>
					</div>
				</div>
			</div>

			{/* Formulario de cliente */}
			{showForm && (
				<div className="bg-white p-6 rounded-lg shadow-md">
					<h2 className="text-xl font-bold mb-4">{formData.id ? "Editar Cliente" : "Nuevo Cliente"}</h2>
					<form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
						<div>
							<label className="block text-sm font-medium text-gray-700">Razón Social / Nombre</label>
							<input
								type="text"
								name="razon_social"
								value={formData.razon_social || ""}
								onChange={handleInputChange}
								className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
								required
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700">RUC / DNI</label>
							<input
								type="text"
								name="ruc"
								value={formData.ruc || ""}
								onChange={handleInputChange}
								className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
								required
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700">Tipo de Cliente</label>
							<select
								name="tipo_cliente"
								value={formData.tipo_cliente || "Empresa"}
								onChange={handleInputChange}
								className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
								required>
								<option value="Empresa">Empresa</option>
								<option value="Persona">Persona</option>
							</select>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700">Nombre de Contacto</label>
							<input
								type="text"
								name="contacto"
								value={formData.contacto || ""}
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
								required
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700">Ciudad</label>
							<input
								type="text"
								name="ciudad"
								value={formData.ciudad || ""}
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
								required
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700">Fecha de Registro</label>
							<input
								type="date"
								name="fecha_registro"
								value={formData.fecha_registro ? formData.fecha_registro.toString().split("T")[0] : ""}
								onChange={handleInputChange}
								className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
								required
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700">Límite de Crédito</label>
							<input
								type="number"
								step="0.01"
								name="limite_credito"
								value={formData.limite_credito || 0}
								onChange={handleInputChange}
								className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
								required
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700">Días de Crédito</label>
							<input
								type="number"
								name="dias_credito"
								value={formData.dias_credito || 0}
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

			{/* Tabla de clientes */}
			<DataTable
				columns={columns}
				data={clientes}
				title="Registro de Clientes"
				defaultSort="razon_social"
				filters={{
					searchField: "razon_social",
				}}
				isLoading={loading}
			/>
		</div>
	);
}
