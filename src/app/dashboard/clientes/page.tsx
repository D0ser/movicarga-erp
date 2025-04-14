"use client";

import { useState } from "react";
import DataTable, { DataItem } from "@/components/DataTable";
import { format } from "date-fns";

// Definición de la estructura de datos de Clientes
interface Cliente extends DataItem {
	id: number;
	razonSocial: string;
	ruc: string;
	direccion: string;
	ciudad: string;
	contacto: string;
	telefono: string;
	email: string;
	tipoCliente: string;
	fechaRegistro: string;
	estado: "Activo" | "Inactivo";
	limiteCredito: number;
	diasCredito: number;
	observaciones: string;
	[key: string]: string | number | Date | boolean | null | undefined; // Añadir signatura de índice
}

export default function ClientesPage() {
	// En una aplicación real, estos datos vendrían de Supabase
	const [clientes, setClientes] = useState<Cliente[]>([
		{
			id: 1,
			razonSocial: "Transportes S.A.",
			ruc: "20123456789",
			direccion: "Av. Industrial 123",
			ciudad: "Lima",
			contacto: "Carlos Rodriguez",
			telefono: "987654321",
			email: "contacto@transportes.com",
			tipoCliente: "Empresa",
			fechaRegistro: "2024-01-15",
			estado: "Activo",
			limiteCredito: 15000,
			diasCredito: 30,
			observaciones: "Cliente frecuente de carga pesada",
		},
		{
			id: 2,
			razonSocial: "Industrias XYZ",
			ruc: "20987654321",
			direccion: "Calle Los Olivos 456",
			ciudad: "Arequipa",
			contacto: "María Lopez",
			telefono: "987123456",
			email: "contacto@industriasxyz.com",
			tipoCliente: "Empresa",
			fechaRegistro: "2024-02-20",
			estado: "Activo",
			limiteCredito: 20000,
			diasCredito: 15,
			observaciones: "Cliente con gran volumen de carga mensual",
		},
		{
			id: 3,
			razonSocial: "Comercial ABC",
			ruc: "20456789123",
			direccion: "Av. Los Pinos 789",
			ciudad: "Trujillo",
			contacto: "Jorge Mendez",
			telefono: "999888777",
			email: "contacto@comercialabc.com",
			tipoCliente: "Empresa",
			fechaRegistro: "2024-03-10",
			estado: "Inactivo",
			limiteCredito: 8000,
			diasCredito: 7,
			observaciones: "Cliente con problemas de pago",
		},
	]);

	const [showForm, setShowForm] = useState(false);
	const [formData, setFormData] = useState<Partial<Cliente>>({
		razonSocial: "",
		ruc: "",
		direccion: "",
		ciudad: "",
		contacto: "",
		telefono: "",
		email: "",
		tipoCliente: "Empresa",
		fechaRegistro: new Date().toISOString().split("T")[0],
		estado: "Activo",
		limiteCredito: 0,
		diasCredito: 0,
		observaciones: "",
	});

	// Columnas para la tabla de clientes
	const columns = [
		{
			header: "Razón Social",
			accessor: "razonSocial",
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
			accessor: "tipoCliente",
		},
		{
			header: "Fecha Registro",
			accessor: "fechaRegistro",
			cell: (value: unknown, row: Cliente) => {
				const dateValue = row.fechaRegistro;
				return dateValue ? format(new Date(dateValue), "dd/MM/yyyy") : "";
			},
		},
		{
			header: "Estado",
			accessor: "estado",
			cell: (value: unknown, row: Cliente) => (
				<span className={`px-2 py-1 rounded-full text-xs font-medium ${row.estado === "Activo" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>{row.estado}</span>
			),
		},
		{
			header: "Límite Crédito",
			accessor: "limiteCredito",
			cell: (value: unknown, row: Cliente) => `S/. ${row.limiteCredito.toLocaleString("es-PE")}`,
		},
		{
			header: "Días Crédito",
			accessor: "diasCredito",
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
					{row.estado === "Activo" ? (
						<button onClick={() => handleChangeStatus(row.id, "Inactivo")} className="text-yellow-600 hover:text-yellow-800">
							Desactivar
						</button>
					) : (
						<button onClick={() => handleChangeStatus(row.id, "Activo")} className="text-green-600 hover:text-green-800">
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
		setFormData({
			...formData,
			[name]: type === "number" ? parseFloat(value) || 0 : value,
		});
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		const nuevoCliente: Cliente = {
			id: formData.id || Date.now(),
			razonSocial: formData.razonSocial || "",
			ruc: formData.ruc || "",
			direccion: formData.direccion || "",
			ciudad: formData.ciudad || "",
			contacto: formData.contacto || "",
			telefono: formData.telefono || "",
			email: formData.email || "",
			tipoCliente: (formData.tipoCliente as string) || "Empresa",
			fechaRegistro: formData.fechaRegistro || new Date().toISOString().split("T")[0],
			estado: (formData.estado as "Activo" | "Inactivo") || "Activo",
			limiteCredito: formData.limiteCredito || 0,
			diasCredito: formData.diasCredito || 0,
			observaciones: formData.observaciones || "",
		};

		if (formData.id) {
			// Actualizar cliente existente
			setClientes(clientes.map((c) => (c.id === formData.id ? nuevoCliente : c)));
		} else {
			// Agregar nuevo cliente
			setClientes([...clientes, nuevoCliente]);
		}

		// Limpiar formulario
		setFormData({
			razonSocial: "",
			ruc: "",
			direccion: "",
			ciudad: "",
			contacto: "",
			telefono: "",
			email: "",
			tipoCliente: "Empresa",
			fechaRegistro: new Date().toISOString().split("T")[0],
			estado: "Activo",
			limiteCredito: 0,
			diasCredito: 0,
			observaciones: "",
		});

		setShowForm(false);
	};

	const handleEdit = (cliente: Cliente) => {
		setFormData({
			...cliente,
		});
		setShowForm(true);
	};

	const handleDelete = (id: number) => {
		if (confirm("¿Está seguro de que desea eliminar este cliente?")) {
			setClientes(clientes.filter((c) => c.id !== id));
		}
	};

	const handleChangeStatus = (id: number, nuevoEstado: "Activo" | "Inactivo") => {
		setClientes(clientes.map((c) => (c.id === id ? { ...c, estado: nuevoEstado } : c)));
	};

	// Estadísticas de clientes
	const clientesActivos = clientes.filter((c) => c.estado === "Activo").length;
	const clientesInactivos = clientes.filter((c) => c.estado === "Inactivo").length;
	const totalCredito = clientes.reduce((sum, c) => sum + c.limiteCredito, 0);

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
							<span className="font-medium">{clientes.filter((c) => c.tipoCliente === "Empresa").length}</span>
						</div>
						<div className="flex justify-between">
							<span>Personas:</span>
							<span className="font-medium">{clientes.filter((c) => c.tipoCliente === "Persona").length}</span>
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
								name="razonSocial"
								value={formData.razonSocial}
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
								value={formData.ruc}
								onChange={handleInputChange}
								className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
								required
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700">Tipo de Cliente</label>
							<select
								name="tipoCliente"
								value={formData.tipoCliente}
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
								value={formData.contacto}
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
								required
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700">Ciudad</label>
							<input
								type="text"
								name="ciudad"
								value={formData.ciudad}
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
								value={formData.direccion}
								onChange={handleInputChange}
								className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
								required
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700">Fecha de Registro</label>
							<input
								type="date"
								name="fechaRegistro"
								value={formData.fechaRegistro}
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
								name="limiteCredito"
								value={formData.limiteCredito}
								onChange={handleInputChange}
								className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
								required
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700">Días de Crédito</label>
							<input
								type="number"
								name="diasCredito"
								value={formData.diasCredito}
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

			{/* Tabla de clientes */}
			<DataTable
				columns={columns}
				data={clientes}
				title="Registro de Clientes"
				defaultSort="razonSocial"
				filters={{
					searchField: "razonSocial",
				}}
			/>
		</div>
	);
}
