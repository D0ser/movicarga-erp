"use client";

import { useState } from "react";
import DataTable, { Column, DataItem } from "@/components/DataTable";
import { format } from "date-fns";

// Definición de la estructura de datos de Egresos
interface Egreso extends DataItem {
	id: number;
	fecha: string;
	hora: string;
	factura: string;
	cuentaEgreso: string;
	operacion: string;
	destino: string;
	cuentaAbonada: string;
	tipoEgreso: string;
	moneda: string;
	monto: number;
	observacion: string;
	aprobado: boolean;
}

export default function EgresosPage() {
	// En una aplicación real, estos datos vendrían de Supabase
	const [egresos, setEgresos] = useState<Egreso[]>([
		{
			id: 1,
			fecha: "2025-03-10",
			hora: "09:30",
			factura: "F001-00567",
			cuentaEgreso: "Cuenta Principal",
			operacion: "Transferencia",
			destino: "Proveedor Combustible",
			cuentaAbonada: "BCP-123456789",
			tipoEgreso: "Combustible",
			moneda: "PEN",
			monto: 1200,
			observacion: "Abastecimiento semanal",
			aprobado: true,
		},
		{
			id: 2,
			fecha: "2025-03-15",
			hora: "14:45",
			factura: "F002-00128",
			cuentaEgreso: "Caja Chica",
			operacion: "Efectivo",
			destino: "Taller Mecánico",
			cuentaAbonada: "N/A",
			tipoEgreso: "Mantenimiento",
			moneda: "PEN",
			monto: 850,
			observacion: "Reparación de frenos",
			aprobado: true,
		},
		{
			id: 3,
			fecha: "2025-03-20",
			hora: "11:15",
			factura: "F001-00345",
			cuentaEgreso: "Cuenta Secundaria",
			operacion: "Cheque",
			destino: "Seguros Pacífico",
			cuentaAbonada: "BBVA-987654321",
			tipoEgreso: "Seguros",
			moneda: "PEN",
			monto: 3500,
			observacion: "Seguro vehicular trimestral",
			aprobado: false,
		},
	]);

	const [showForm, setShowForm] = useState(false);
	const [formData, setFormData] = useState<Partial<Egreso>>({
		fecha: new Date().toISOString().split("T")[0],
		hora: new Date().toTimeString().slice(0, 5),
		factura: "",
		cuentaEgreso: "",
		operacion: "",
		destino: "",
		cuentaAbonada: "",
		tipoEgreso: "",
		moneda: "PEN",
		monto: 0,
		observacion: "",
		aprobado: false,
	});

	// Columnas para la tabla de egresos
	const columns: Column<Egreso>[] = [
		{
			header: "Fecha",
			accessor: "fecha",
			cell: (value: unknown) => format(new Date(value as string), "dd/MM/yyyy"),
		},
		{
			header: "Hora",
			accessor: "hora",
		},
		{
			header: "Factura",
			accessor: "factura",
		},
		{
			header: "Cuenta Egreso",
			accessor: "cuentaEgreso",
		},
		{
			header: "Operación",
			accessor: "operacion",
		},
		{
			header: "Destino",
			accessor: "destino",
		},
		{
			header: "Cuenta Abonada",
			accessor: "cuentaAbonada",
		},
		{
			header: "Tipo de Egreso",
			accessor: "tipoEgreso",
		},
		{
			header: "Moneda",
			accessor: "moneda",
		},
		{
			header: "Monto",
			accessor: "monto",
			cell: (value: unknown, row: Egreso) => `${row.moneda === "PEN" ? "S/." : "$"} ${(value as number).toLocaleString("es-PE")}`,
		},
		{
			header: "Observación",
			accessor: "observacion",
		},
		{
			header: "Estado",
			accessor: "aprobado",
			cell: (value: unknown) => (
				<span className={`px-2 py-1 rounded-full text-xs font-medium ${value ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>{value ? "Aprobado" : "Pendiente"}</span>
			),
		},
		{
			header: "Acciones",
			accessor: "id",
			cell: (value: unknown, row: Egreso) => (
				<div className="flex space-x-2">
					<button onClick={() => handleEdit(row)} className="text-blue-600 hover:text-blue-800">
						Editar
					</button>
					<button onClick={() => handleDelete(value as number)} className="text-red-600 hover:text-red-800">
						Eliminar
					</button>
					{!row.aprobado && (
						<button onClick={() => handleApprove(value as number)} className="text-green-600 hover:text-green-800">
							Aprobar
						</button>
					)}
				</div>
			),
		},
	];

	// Funciones para manejo de formulario
	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		const { name, value, type } = e.target as HTMLInputElement;
		setFormData({
			...formData,
			[name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : type === "number" ? parseFloat(value) || 0 : value,
		});
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		const nuevoEgreso: Egreso = {
			id: formData.id || Date.now(),
			fecha: formData.fecha || new Date().toISOString().split("T")[0],
			hora: formData.hora || new Date().toTimeString().slice(0, 5),
			factura: formData.factura || "",
			cuentaEgreso: formData.cuentaEgreso || "",
			operacion: formData.operacion || "",
			destino: formData.destino || "",
			cuentaAbonada: formData.cuentaAbonada || "",
			tipoEgreso: formData.tipoEgreso || "",
			moneda: formData.moneda || "PEN",
			monto: formData.monto || 0,
			observacion: formData.observacion || "",
			aprobado: formData.aprobado || false,
		};

		if (formData.id) {
			// Actualizar egreso existente
			setEgresos(egresos.map((eg) => (eg.id === formData.id ? nuevoEgreso : eg)));
		} else {
			// Agregar nuevo egreso
			setEgresos([...egresos, nuevoEgreso]);
		}

		// Limpiar formulario
		setFormData({
			fecha: new Date().toISOString().split("T")[0],
			hora: new Date().toTimeString().slice(0, 5),
			factura: "",
			cuentaEgreso: "",
			operacion: "",
			destino: "",
			cuentaAbonada: "",
			tipoEgreso: "",
			moneda: "PEN",
			monto: 0,
			observacion: "",
			aprobado: false,
		});

		setShowForm(false);
	};

	const handleEdit = (egreso: Egreso) => {
		setFormData({
			...egreso,
		});
		setShowForm(true);
	};

	const handleDelete = (id: number) => {
		if (confirm("¿Está seguro de que desea eliminar este egreso?")) {
			setEgresos(egresos.filter((eg) => eg.id !== id));
		}
	};

	const handleApprove = (id: number) => {
		setEgresos(egresos.map((eg) => (eg.id === id ? { ...eg, aprobado: true } : eg)));
	};

	// Tipos de egresos predefinidos
	const tiposEgresos = ["Combustible", "Mantenimiento", "Repuestos", "Peajes", "Viáticos", "Seguros", "Salarios", "Impuestos", "Administrativo", "Otro"];

	// Tipos de operaciones (usado en el formulario)
	const tiposOperaciones = ["Transferencia", "Efectivo", "Cheque", "Tarjeta de Crédito", "Tarjeta de Débito", "Depósito"];

	return (
		<div className="space-y-6">
			<div className="flex justify-between items-center">
				<h1 className="text-2xl font-bold">Gestión de Egresos</h1>
				<button onClick={() => setShowForm(!showForm)} className="bg-secondary text-white px-4 py-2 rounded-md hover:bg-secondary-dark">
					{showForm ? "Cancelar" : "Nuevo Egreso"}
				</button>
			</div>

			{showForm && (
				<div className="bg-white p-6 rounded-lg shadow-md">
					<h2 className="text-xl font-bold mb-4 text-primary">{formData.id ? "Editar Egreso" : "Nuevo Egreso"}</h2>
					<form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
						<div>
							<label className="block text-sm font-medium text-gray-700">Fecha</label>
							<input
								type="date"
								name="fecha"
								value={formData.fecha}
								onChange={handleInputChange}
								className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary"
								required
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700">Hora</label>
							<input
								type="time"
								name="hora"
								value={formData.hora}
								onChange={handleInputChange}
								className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary"
								required
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700">Factura</label>
							<input
								type="text"
								name="factura"
								value={formData.factura}
								onChange={handleInputChange}
								className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary"
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700">Cuenta Egreso</label>
							<input
								type="text"
								name="cuentaEgreso"
								value={formData.cuentaEgreso}
								onChange={handleInputChange}
								className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary"
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700">Operación</label>
							<select
								name="operacion"
								value={formData.operacion}
								onChange={handleInputChange}
								className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary">
								<option value="">Seleccione operación</option>
								{tiposOperaciones.map((tipo, index) => (
									<option key={index} value={tipo}>
										{tipo}
									</option>
								))}
							</select>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700">Destino</label>
							<input
								type="text"
								name="destino"
								value={formData.destino}
								onChange={handleInputChange}
								className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary"
								required
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700">Cuenta Abonada</label>
							<input
								type="text"
								name="cuentaAbonada"
								value={formData.cuentaAbonada}
								onChange={handleInputChange}
								className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary"
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700">Tipo de Egreso</label>
							<select
								name="tipoEgreso"
								value={formData.tipoEgreso}
								onChange={handleInputChange}
								className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary"
								required>
								<option value="">Seleccione tipo de egreso</option>
								{tiposEgresos.map((tipo, index) => (
									<option key={index} value={tipo}>
										{tipo}
									</option>
								))}
							</select>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700">Moneda</label>
							<select
								name="moneda"
								value={formData.moneda}
								onChange={handleInputChange}
								className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary"
								required>
								<option value="PEN">Soles (PEN)</option>
								<option value="USD">Dólares (USD)</option>
							</select>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700">Monto</label>
							<input
								type="number"
								step="0.01"
								name="monto"
								value={formData.monto}
								onChange={handleInputChange}
								className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary"
								required
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700">Observación</label>
							<input
								type="text"
								name="observacion"
								value={formData.observacion}
								onChange={handleInputChange}
								className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary"
							/>
						</div>

						<div className="flex items-center mt-6">
							<input
								type="checkbox"
								id="aprobado"
								name="aprobado"
								checked={formData.aprobado}
								onChange={handleInputChange}
								className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
							/>
							<label htmlFor="aprobado" className="ml-2 block text-sm font-medium text-gray-700">
								Aprobado
							</label>
						</div>

						<div className="col-span-full mt-4 flex justify-end">
							<button type="button" onClick={() => setShowForm(false)} className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md mr-2 hover:bg-gray-400">
								Cancelar
							</button>
							<button type="submit" className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-dark">
								{formData.id ? "Actualizar" : "Guardar"}
							</button>
						</div>
					</form>
				</div>
			)}

			<DataTable
				columns={columns}
				data={egresos}
				title="Registro de Egresos"
				defaultSort="fecha"
				filters={{
					year: true,
					month: true,
					searchField: "destino",
				}}
			/>
		</div>
	);
}
