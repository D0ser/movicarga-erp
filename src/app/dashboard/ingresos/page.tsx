"use client";

import { useState } from "react";
import DataTable from "@/components/DataTable";
import { format } from "date-fns";
import type { Column } from "@/components/DataTable";

// Interfaz que es compatible con DataItem
interface Ingreso {
	[key: string]: string | number | boolean;
	id: number;
	fecha: string;
	serie: string;
	numeroFactura: string;
	montoFlete: number;
	detraccion: number;
	totalDeber: number;
	totalMonto: number;
	empresa: string;
	ruc: string;
	conductor: string;
	placaTracto: string;
	placaCarreta: string;
	observacion: string;
	documentoGuiaRemit: string;
	guiaTransp: string;
	diasCredito: number;
	fechaVencimiento: string;
	estado: string;
}

export default function IngresosPage() {
	// En una aplicación real, estos datos vendrían de Supabase
	const [ingresos, setIngresos] = useState<Ingreso[]>([
		{
			id: 1,
			fecha: "2025-03-15",
			serie: "F001",
			numeroFactura: "00123",
			montoFlete: 2500,
			detraccion: 100,
			totalDeber: 2400,
			totalMonto: 2500,
			empresa: "Transportes S.A.",
			ruc: "20123456789",
			conductor: "Juan Pérez",
			placaTracto: "ABC-123",
			placaCarreta: "XYZ-789",
			observacion: "Entrega completada",
			documentoGuiaRemit: "GR-001-123456",
			guiaTransp: "GT-001-789012",
			diasCredito: 30,
			fechaVencimiento: "2025-04-14",
			estado: "Pagado",
		},
		{
			id: 2,
			fecha: "2025-03-20",
			serie: "F001",
			numeroFactura: "00124",
			montoFlete: 3200,
			detraccion: 128,
			totalDeber: 3072,
			totalMonto: 3200,
			empresa: "Industrias XYZ",
			ruc: "20987654321",
			conductor: "Pedro Gómez",
			placaTracto: "DEF-456",
			placaCarreta: "UVW-456",
			observacion: "Entrega con retraso",
			documentoGuiaRemit: "GR-001-123457",
			guiaTransp: "GT-001-789013",
			diasCredito: 15,
			fechaVencimiento: "2025-04-04",
			estado: "Pendiente",
		},
		{
			id: 3,
			fecha: "2025-04-05",
			serie: "F001",
			numeroFactura: "00125",
			montoFlete: 1800,
			detraccion: 72,
			totalDeber: 1728,
			totalMonto: 1800,
			empresa: "Comercial ABC",
			ruc: "20456789123",
			conductor: "Luis Torres",
			placaTracto: "GHI-789",
			placaCarreta: "RST-123",
			observacion: "Entrega parcial",
			documentoGuiaRemit: "GR-001-123458",
			guiaTransp: "GT-001-789014",
			diasCredito: 0,
			fechaVencimiento: "2025-04-05",
			estado: "Pagado",
		},
	]);

	const [showForm, setShowForm] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);

	const [formData, setFormData] = useState<Partial<Ingreso>>({
		fecha: new Date().toISOString().split("T")[0],
		serie: "",
		numeroFactura: "",
		montoFlete: 0,
		detraccion: 0,
		empresa: "",
		ruc: "",
		conductor: "",
		placaTracto: "",
		placaCarreta: "",
		observacion: "",
		documentoGuiaRemit: "",
		guiaTransp: "",
		diasCredito: 0,
		estado: "Pendiente",
	});

	// Function to handle errors
	const handleError = (message: string) => {
		setError(message);
		setTimeout(() => setError(null), 5000); // Clear error after 5 seconds
	};

	// Function to handle success messages
	const handleSuccess = (message: string) => {
		setSuccess(message);
		setTimeout(() => setSuccess(null), 5000); // Clear success after 5 seconds
	};

	// Columnas para la tabla de ingresos
	const columns: Column<Ingreso>[] = [
		{
			header: "Fecha",
			accessor: "fecha",
			cell: (value) => format(new Date(value as string), "dd/MM/yyyy"),
		},
		{
			header: "Serie",
			accessor: "serie",
		},
		{
			header: "N° Factura",
			accessor: "numeroFactura",
		},
		{
			header: "Monto de Flete",
			accessor: "montoFlete",
			cell: (value) => `S/. ${(value as number).toLocaleString("es-PE")}`,
		},
		{
			header: "Detracción",
			accessor: "detraccion",
			cell: (value) => `S/. ${(value as number).toLocaleString("es-PE")}`,
		},
		{
			header: "Total a Deber",
			accessor: "totalDeber",
			cell: (value) => `S/. ${(value as number).toLocaleString("es-PE")}`,
		},
		{
			header: "Total Monto",
			accessor: "totalMonto",
			cell: (value) => `S/. ${(value as number).toLocaleString("es-PE")}`,
		},
		{
			header: "Empresa",
			accessor: "empresa",
		},
		{
			header: "RUC",
			accessor: "ruc",
		},
		{
			header: "Conductor",
			accessor: "conductor",
		},
		{
			header: "Placa Tracto",
			accessor: "placaTracto",
		},
		{
			header: "Placa Carreta",
			accessor: "placaCarreta",
		},
		{
			header: "Observación",
			accessor: "observacion",
		},
		{
			header: "Guía Remitente",
			accessor: "documentoGuiaRemit",
		},
		{
			header: "Guía Transportista",
			accessor: "guiaTransp",
		},
		{
			header: "Días Crédito",
			accessor: "diasCredito",
		},
		{
			header: "Fecha Vencimiento",
			accessor: "fechaVencimiento",
			cell: (value) => format(new Date(value as string), "dd/MM/yyyy"),
		},
		{
			header: "Estado",
			accessor: "estado",
			cell: (value) => (
				<span
					className={`px-2 py-1 rounded-full text-xs font-medium ${
						(value as string) === "Pagado" ? "bg-green-100 text-green-800" : (value as string) === "Pendiente" ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"
					}`}>
					{value as string}
				</span>
			),
		},
		{
			header: "Acciones",
			accessor: "id",
			cell: (value, row) => (
				<div className="flex space-x-2">
					<button onClick={() => handleEdit(row as Ingreso)} className="text-blue-600 hover:text-blue-800">
						Editar
					</button>
					<button onClick={() => handleDelete(value as number)} className="text-red-600 hover:text-red-800">
						Eliminar
					</button>
				</div>
			),
		},
	];

	// Funciones para manejo de formulario
	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		const { name, value } = e.target;
		setFormData({
			...formData,
			[name]: name === "montoFlete" || name === "detraccion" || name === "diasCredito" ? parseFloat(value) || 0 : value,
		});

		// Calcular totales automáticamente
		if (name === "montoFlete" || name === "detraccion") {
			const montoFlete = name === "montoFlete" ? parseFloat(value) || 0 : formData.montoFlete || 0;
			const detraccion = name === "detraccion" ? parseFloat(value) || 0 : formData.detraccion || 0;

			setFormData((prev) => ({
				...prev,
				totalDeber: montoFlete - detraccion,
				totalMonto: montoFlete,
			}));
		}

		// Calcular fecha de vencimiento
		if (name === "fecha" || name === "diasCredito") {
			const fecha = name === "fecha" ? new Date(value) : new Date(formData.fecha || "");
			const diasCredito = name === "diasCredito" ? parseInt(value) || 0 : formData.diasCredito || 0;

			if (fecha && !isNaN(fecha.getTime())) {
				const fechaVencimiento = new Date(fecha);
				fechaVencimiento.setDate(fecha.getDate() + diasCredito);

				setFormData((prev) => ({
					...prev,
					fechaVencimiento: fechaVencimiento.toISOString().split("T")[0],
				}));
			}
		}
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		// Validate required fields
		if (!formData.serie || !formData.numeroFactura || !formData.empresa || !formData.ruc) {
			handleError("Por favor complete todos los campos requeridos");
			return;
		}

		const nuevoIngreso: Ingreso = {
			id: formData.id || Date.now(),
			fecha: formData.fecha || new Date().toISOString().split("T")[0],
			serie: formData.serie || "",
			numeroFactura: formData.numeroFactura || "",
			montoFlete: formData.montoFlete || 0,
			detraccion: formData.detraccion || 0,
			totalDeber: formData.totalDeber || 0,
			totalMonto: formData.totalMonto || 0,
			empresa: formData.empresa || "",
			ruc: formData.ruc || "",
			conductor: formData.conductor || "",
			placaTracto: formData.placaTracto || "",
			placaCarreta: formData.placaCarreta || "",
			observacion: formData.observacion || "",
			documentoGuiaRemit: formData.documentoGuiaRemit || "",
			guiaTransp: formData.guiaTransp || "",
			diasCredito: formData.diasCredito || 0,
			fechaVencimiento: formData.fechaVencimiento || formData.fecha || new Date().toISOString().split("T")[0],
			estado: formData.estado || "Pendiente",
		};

		if (formData.id) {
			// Actualizar ingreso existente
			setIngresos(ingresos.map((ing) => (ing.id === formData.id ? nuevoIngreso : ing)));
			handleSuccess("Ingreso actualizado correctamente");
		} else {
			// Agregar nuevo ingreso
			setIngresos([...ingresos, nuevoIngreso]);
			handleSuccess("Nuevo ingreso registrado correctamente");
		}

		// Limpiar formulario
		setFormData({
			fecha: new Date().toISOString().split("T")[0],
			serie: "",
			numeroFactura: "",
			montoFlete: 0,
			detraccion: 0,
			empresa: "",
			ruc: "",
			conductor: "",
			placaTracto: "",
			placaCarreta: "",
			observacion: "",
			documentoGuiaRemit: "",
			guiaTransp: "",
			diasCredito: 0,
			estado: "Pendiente",
		});

		setShowForm(false);
	};

	const handleDelete = (id: number) => {
		if (confirm("¿Está seguro de que desea eliminar este ingreso?")) {
			setIngresos(ingresos.filter((ing) => ing.id !== id));
			handleSuccess("Ingreso eliminado correctamente");
		}
	};

	const handleEdit = (ingreso: Ingreso) => {
		setFormData(ingreso);
		setShowForm(true);
	};

	return (
		<div className="space-y-6">
			<div className="flex justify-between items-center">
				<h1 className="text-2xl font-bold">Gestión de Ingresos</h1>
				<button onClick={() => setShowForm(!showForm)} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
					{showForm ? "Cancelar" : "Nuevo Ingreso"}
				</button>
			</div>

			{error && (
				<div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
					<p>{error}</p>
				</div>
			)}

			{success && (
				<div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4">
					<p>{success}</p>
				</div>
			)}

			{showForm && (
				<div className="bg-white p-6 rounded-lg shadow-md">
					<h2 className="text-xl font-bold mb-4">{formData.id ? "Editar Ingreso" : "Nuevo Ingreso"}</h2>
					<form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
						<div>
							<label className="block text-sm font-medium text-gray-700">Fecha</label>
							<input
								type="date"
								name="fecha"
								value={formData.fecha}
								onChange={handleInputChange}
								className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
								required
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700">Serie</label>
							<input
								type="text"
								name="serie"
								value={formData.serie}
								onChange={handleInputChange}
								className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
								required
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700">N° Factura</label>
							<input
								type="text"
								name="numeroFactura"
								value={formData.numeroFactura}
								onChange={handleInputChange}
								className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
								required
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700">Monto de Flete</label>
							<input
								type="number"
								step="0.01"
								name="montoFlete"
								value={formData.montoFlete}
								onChange={handleInputChange}
								className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
								required
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700">Detracción</label>
							<input
								type="number"
								step="0.01"
								name="detraccion"
								value={formData.detraccion}
								onChange={handleInputChange}
								className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700">Total a Deber</label>
							<input type="number" step="0.01" name="totalDeber" value={formData.totalDeber} className="mt-1 block w-full border border-gray-300 rounded-md bg-gray-100 shadow-sm py-2 px-3" readOnly />
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700">Total Monto</label>
							<input type="number" step="0.01" name="totalMonto" value={formData.totalMonto} className="mt-1 block w-full border border-gray-300 rounded-md bg-gray-100 shadow-sm py-2 px-3" readOnly />
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700">Empresa</label>
							<input
								type="text"
								name="empresa"
								value={formData.empresa}
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
								value={formData.ruc}
								onChange={handleInputChange}
								className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
								required
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700">Conductor</label>
							<input
								type="text"
								name="conductor"
								value={formData.conductor}
								onChange={handleInputChange}
								className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700">Placa Tracto</label>
							<input
								type="text"
								name="placaTracto"
								value={formData.placaTracto}
								onChange={handleInputChange}
								className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700">Placa Carreta</label>
							<input
								type="text"
								name="placaCarreta"
								value={formData.placaCarreta}
								onChange={handleInputChange}
								className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700">Observación</label>
							<input
								type="text"
								name="observacion"
								value={formData.observacion}
								onChange={handleInputChange}
								className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700">Guía Remitente</label>
							<input
								type="text"
								name="documentoGuiaRemit"
								value={formData.documentoGuiaRemit}
								onChange={handleInputChange}
								className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700">Guía Transportista</label>
							<input
								type="text"
								name="guiaTransp"
								value={formData.guiaTransp}
								onChange={handleInputChange}
								className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700">Días Crédito</label>
							<input
								type="number"
								name="diasCredito"
								value={formData.diasCredito}
								onChange={handleInputChange}
								className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700">Fecha Vencimiento</label>
							<input type="date" name="fechaVencimiento" value={formData.fechaVencimiento} className="mt-1 block w-full border border-gray-300 rounded-md bg-gray-100 shadow-sm py-2 px-3" readOnly />
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700">Estado</label>
							<select
								name="estado"
								value={formData.estado}
								onChange={handleInputChange}
								className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500">
								<option value="Pendiente">Pendiente</option>
								<option value="Pagado">Pagado</option>
								<option value="Anulado">Anulado</option>
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

			<DataTable
				columns={columns}
				data={ingresos}
				title="Registro de Ingresos"
				defaultSort="fecha"
				filters={{
					year: true,
					month: true,
					searchField: "empresa",
				}}
			/>
		</div>
	);
}
