"use client";

import { useState, useEffect } from "react";
import DataTable, { DataItem, Column } from "@/components/DataTable";
import { format } from "date-fns";
import { clienteService, Cliente } from "@/lib/supabaseServices";
import notificationService from "@/components/notifications/NotificationService";
import supabase from "@/lib/supabase";
import { EditButton, DeleteButton, ActivateButton, DeactivateButton, ActionButtonGroup } from "@/components/ActionIcons";
import Modal from "@/components/Modal";

// Interfaz para tipo de cliente
interface TipoCliente {
	id: string;
	nombre: string;
	descripcion?: string;
}

// Componente para la página de clientes
export default function ClientesPage() {
	const [loading, setLoading] = useState(true);
	const [clientes, setClientes] = useState<Cliente[]>([]);
	const [tiposCliente, setTiposCliente] = useState<TipoCliente[]>([]);
	const [showForm, setShowForm] = useState(false);
	const [formData, setFormData] = useState<Partial<Cliente>>({
		razon_social: "",
		ruc: "",
		tipo_cliente_id: "",
		estado: true,
	});

	// Cargar datos desde Supabase al iniciar
	useEffect(() => {
		fetchClientes();
		fetchTiposCliente();
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

	// Función para cargar tipos de cliente
	const fetchTiposCliente = async () => {
		try {
			const { data, error } = await supabase.from("tipo_cliente").select("*").order("nombre");
			if (error) throw error;
			setTiposCliente(data || []);

			// Si no hay tipos de cliente, crear los predeterminados
			if (data && data.length === 0) {
				await crearTiposClientePredeterminados();
			}
		} catch (error) {
			console.error("Error al cargar tipos de cliente:", error);
			notificationService.error("No se pudieron cargar los tipos de cliente");
		}
	};

	// Función para crear tipos de cliente predeterminados
	const crearTiposClientePredeterminados = async () => {
		try {
			// Datos predeterminados
			const tiposPredeterminados = [
				{ nombre: "Empresa", descripcion: "Cliente empresarial o jurídico" },
				{ nombre: "Persona", descripcion: "Cliente natural o persona física" },
				{ nombre: "Ocasional", descripcion: "Cliente de una sola vez" },
			];

			// Insertar datos
			const { data, error } = await supabase.from("tipo_cliente").insert(tiposPredeterminados).select();

			if (error) throw error;

			// Actualizar el estado
			if (data) {
				setTiposCliente(data);
				notificationService.info("Se han creado los tipos de cliente predeterminados");
			}
		} catch (error) {
			console.error("Error al crear tipos de cliente predeterminados:", error);
		}
	};

	// Columnas para la tabla de clientes
	const columns: Column<Cliente>[] = [
		{
			header: "Razón Social",
			accessor: "razon_social",
			cell: (value: unknown, row: Cliente) => {
				// Determinar icono según el tipo de cliente
				const tipoCliente = tiposCliente.find((tipo) => tipo.id === row.tipo_cliente_id);
				const tipoNombre = tipoCliente ? tipoCliente.nombre.toLowerCase() : "";

				let inicialClass = "bg-blue-100 text-blue-800";
				if (tipoNombre.includes("persona")) {
					inicialClass = "bg-green-100 text-green-800";
				} else if (tipoNombre.includes("ocasional")) {
					inicialClass = "bg-yellow-100 text-yellow-800";
				}

				// Obtener la primera letra para el avatar
				const inicial = row.razon_social ? row.razon_social.charAt(0).toUpperCase() : "?";

				return (
					<div className="flex items-center px-2">
						<div className={`flex-shrink-0 h-8 w-8 rounded-full ${inicialClass} flex items-center justify-center font-bold mr-3`}>{inicial}</div>
						<div className="text-sm font-medium text-gray-900 truncate">{row.razon_social}</div>
					</div>
				);
			},
		},
		{
			header: "RUC",
			accessor: "ruc",
			cell: (value: unknown, row: Cliente) => (
				<div className="text-center">
					<span className="font-mono bg-gray-50 px-2 py-1 rounded text-gray-700">{row.ruc || "-"}</span>
				</div>
			),
		},
		{
			header: "Tipo",
			accessor: "tipo_cliente_id",
			cell: (value: unknown, row: Cliente) => {
				const tipoCliente = tiposCliente.find((tipo) => tipo.id === row.tipo_cliente_id);
				const nombre = tipoCliente ? tipoCliente.nombre : "No asignado";

				let bgColor = "bg-gray-100";
				let textColor = "text-gray-800";
				let icono = null;

				if (nombre.toLowerCase().includes("empresa")) {
					bgColor = "bg-blue-100";
					textColor = "text-blue-800";
					icono = (
						<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={1.5}
								d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
							/>
						</svg>
					);
				} else if (nombre.toLowerCase().includes("persona")) {
					bgColor = "bg-green-100";
					textColor = "text-green-800";
					icono = (
						<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
						</svg>
					);
				} else if (nombre.toLowerCase().includes("ocasional")) {
					bgColor = "bg-yellow-100";
					textColor = "text-yellow-800";
					icono = (
						<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
					);
				}

				return (
					<div className="flex justify-center">
						<span className={`px-2 py-1 rounded-full text-xs font-medium ${bgColor} ${textColor} flex items-center`}>
							{icono}
							{nombre}
						</span>
					</div>
				);
			},
		},
		{
			header: "Estado",
			accessor: "estado",
			cell: (value: unknown, row: Cliente) => (
				<div className="flex justify-center">
					<span className={`px-2 py-1 rounded-full text-xs font-medium ${row.estado ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>{row.estado ? "Activo" : "Inactivo"}</span>
				</div>
			),
		},
		{
			header: "Acciones",
			accessor: "id",
			cell: (value: unknown, row: Cliente) => (
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

			// Verificar que tiene un tipo de cliente seleccionado
			if (!formData.tipo_cliente_id) {
				notificationService.error("Debe seleccionar un tipo de cliente");
				setLoading(false);
				return;
			}

			if (formData.id) {
				// Actualizar cliente existente
				await clienteService.updateCliente(formData.id, formData);
				await fetchClientes();
				notificationService.success("Cliente actualizado correctamente");
			} else {
				// Agregar nuevo cliente
				await clienteService.createCliente(formData as Omit<Cliente, "id">);
				await fetchClientes();
				notificationService.success("Cliente creado correctamente");
			}

			// Limpiar formulario
			setFormData({
				razon_social: "",
				ruc: "",
				tipo_cliente_id: tiposCliente.length > 0 ? tiposCliente[0].id : "",
				estado: true,
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
				await fetchClientes();
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
			await clienteService.updateCliente(id, { estado: newStatus });
			await fetchClientes();
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

	if (loading && clientes.length === 0) {
		return <div className="flex justify-center items-center h-64">Cargando clientes...</div>;
	}

	return (
		<div className="space-y-6">
			<div className="flex justify-between items-center">
				<h1 className="text-2xl font-bold">Gestión de Clientes</h1>
				<button
					onClick={() => {
						setFormData({
							razon_social: "",
							ruc: "",
							tipo_cliente_id: "",
							estado: true,
						});
						setShowForm(true);
					}}
					className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
					Nuevo Cliente
				</button>
			</div>

			{/* Usar el componente Modal para el formulario */}
			<Modal isOpen={showForm} onClose={() => setShowForm(false)} title={formData.id ? "Editar Cliente" : "Nuevo Cliente"} size="md">
				<form onSubmit={handleSubmit} className="space-y-4">
					<div>
						<label className="block text-sm font-medium text-gray-700">Razón Social</label>
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
						<label className="block text-sm font-medium text-gray-700">RUC</label>
						<input
							type="text"
							name="ruc"
							value={formData.ruc || ""}
							onChange={handleInputChange}
							className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
							pattern="[0-9]{11}"
							title="El RUC debe contener 11 dígitos"
							required
						/>
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-700">Tipo de Cliente</label>
						<select
							name="tipo_cliente_id"
							value={formData.tipo_cliente_id || ""}
							onChange={handleInputChange}
							className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
							required>
							<option value="">Seleccione tipo</option>
							{tiposCliente.map((tipo) => (
								<option key={tipo.id} value={tipo.id}>
									{tipo.nombre} {tipo.descripcion ? `- ${tipo.descripcion}` : ""}
								</option>
							))}
						</select>
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-700">Estado</label>
						<div className="mt-2">
							<div className="flex items-center">
								<input
									id="estado-activo"
									name="estado"
									type="radio"
									checked={formData.estado === true}
									onChange={() => setFormData({ ...formData, estado: true })}
									className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
								/>
								<label htmlFor="estado-activo" className="ml-2 block text-sm text-gray-700">
									Activo
								</label>
							</div>
							<div className="flex items-center mt-2">
								<input
									id="estado-inactivo"
									name="estado"
									type="radio"
									checked={formData.estado === false}
									onChange={() => setFormData({ ...formData, estado: false })}
									className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300"
								/>
								<label htmlFor="estado-inactivo" className="ml-2 block text-sm text-gray-700">
									Inactivo
								</label>
							</div>
						</div>
					</div>

					<div className="mt-4 flex justify-end">
						<button type="button" onClick={() => setShowForm(false)} className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md mr-2 hover:bg-gray-400">
							Cancelar
						</button>
						<button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
							{formData.id ? "Actualizar" : "Guardar"}
						</button>
					</div>
				</form>
			</Modal>

			{/* Tabla de clientes */}
			<DataTable columns={columns} data={clientes} title="Registro de Clientes" defaultSort="razon_social" isLoading={loading} />
		</div>
	);
}
