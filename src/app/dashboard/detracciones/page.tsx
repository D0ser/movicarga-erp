"use client";

import { useState, useRef } from "react";
import DataTable, { DataItem, Column } from "@/components/DataTable";
import { format } from "date-fns";
import { EditButton, DeleteButton, ActivateButton, ActionButtonGroup, ActionButton, ActivateIcon } from "@/components/ActionIcons";

// Definición de la estructura de datos de Detracciones
interface Detraccion extends DataItem {
	id: number | string;
	cliente_id: string;
	viaje_id?: string | null;
	ingreso_id?: string | null;
	factura_id?: string | null;
	fecha_deposito: string;
	monto: number;
	porcentaje: number;
	numero_constancia: string;
	fecha_constancia: string;
	estado: string;
	observaciones: string;
	created_at?: string;
	updated_at?: string;
	// Propiedades relacionadas
	cliente?: {
		razon_social: string;
		ruc: string;
	};
}

export default function DetraccionesPage() {
	// En una aplicación real, estos datos vendrían de Supabase
	const [detracciones, setDetracciones] = useState<Detraccion[]>([
		{
			id: 1,
			cliente_id: "1",
			fecha_deposito: "2025-03-05",
			numero_constancia: "DET-001-2025",
			fecha_constancia: "2025-03-05",
			monto: 250.5,
			porcentaje: 4.0,
			estado: "Pendiente",
			observaciones: "Detracción por servicio de transporte",
			cliente: {
				razon_social: "Transportes S.A.",
				ruc: "20123456789",
			},
		},
		{
			id: 2,
			cliente_id: "2",
			fecha_deposito: "2025-03-12",
			numero_constancia: "DET-002-2025",
			fecha_constancia: "2025-03-12",
			monto: 320.0,
			porcentaje: 4.0,
			estado: "Pendiente",
			observaciones: "Detracción por flete Lima-Arequipa",
			cliente: {
				razon_social: "Logística Express",
				ruc: "20987654321",
			},
		},
		{
			id: 3,
			cliente_id: "3",
			fecha_deposito: "2025-03-18",
			numero_constancia: "DET-003-2025",
			fecha_constancia: "2025-03-18",
			monto: 180.75,
			porcentaje: 4.0,
			estado: "Pagado",
			observaciones: "Detracción por servicio especial",
			cliente: {
				razon_social: "Carga Rápida EIRL",
				ruc: "20456789012",
			},
		},
	]);

	const [showForm, setShowForm] = useState(false);
	const [showImportForm, setShowImportForm] = useState(false);
	const [csvData, setCsvData] = useState<string>("");
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [importError, setImportError] = useState<string>("");

	const [formData, setFormData] = useState<Partial<Detraccion>>({
		fecha_deposito: new Date().toISOString().split("T")[0],
		numero_constancia: "",
		fecha_constancia: new Date().toISOString().split("T")[0],
		monto: 0,
		porcentaje: 4.0,
		estado: "Pendiente",
		observaciones: "",
	});

	// Columnas para la tabla de detracciones
	const columns: Column<Detraccion>[] = [
		{
			header: "Fecha",
			accessor: "fecha_deposito",
			cell: (value: unknown) => (
				<div className="flex justify-center">
					<span className="text-sm font-medium flex items-center text-gray-700">
						<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-500 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
						</svg>
						{format(new Date(value as string), "dd/MM/yyyy")}
					</span>
				</div>
			),
		},
		{
			header: "N° Constancia",
			accessor: "numero_constancia",
			cell: (value: unknown) => (
				<div className="flex justify-center">
					<span className="font-mono bg-purple-50 px-2 py-1 rounded text-purple-700 text-sm">{value as string}</span>
				</div>
			),
		},
		{
			header: "RUC Proveedor",
			accessor: "cliente.ruc",
			cell: (value: unknown) => (
				<div className="flex justify-center">
					<span className="font-mono bg-gray-50 px-2 py-1 rounded text-gray-700 flex items-center">
						<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={1.5}
								d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h3m-6-4h.01M9 16h.01"
							/>
						</svg>
						{value as string}
					</span>
				</div>
			),
		},
		{
			header: "Proveedor",
			accessor: "cliente.razon_social",
			cell: (value: unknown, row: Detraccion) => {
				// Crear un avatar con la primera letra del nombre
				const inicial = (value as string).charAt(0).toUpperCase();

				return (
					<div className="flex items-center px-2 justify-center">
						<div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold mr-3">{inicial}</div>
						<div className="text-sm font-medium text-gray-900 truncate">{value as string}</div>
					</div>
				);
			},
		},
		{
			header: "Moneda",
			accessor: "monto",
			cell: (value: unknown, row: Detraccion) => {
				const moneda = row.cliente?.razon_social || "PEN";
				const bgColor = moneda === "PEN" ? "bg-green-100" : "bg-blue-100";
				const textColor = moneda === "PEN" ? "text-green-800" : "text-blue-800";
				const symbol = moneda === "PEN" ? "S/." : "$";

				return (
					<div className="flex justify-center">
						<span className={`px-2 py-1 rounded-full text-xs font-medium ${bgColor} ${textColor}`}>
							{symbol} {value as number}
						</span>
					</div>
				);
			},
		},
		{
			header: "Importe",
			accessor: "monto",
			cell: (value: unknown, row: Detraccion) => (
				<div className="flex justify-end">
					<span className="font-mono text-gray-700 font-medium">
						{row.cliente?.razon_social === "PEN" ? "S/." : "$"} {(value as number).toLocaleString("es-PE", { minimumFractionDigits: 2 })}
					</span>
				</div>
			),
		},
		{
			header: "Tipo Operación",
			accessor: "porcentaje",
			cell: (value: unknown) => {
				return (
					<div className="flex justify-center">
						<span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 flex items-center">
							<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={1.5}
									d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
								/>
							</svg>
							{value as number}%
						</span>
					</div>
				);
			},
		},
		{
			header: "Tipo Comprobante",
			accessor: "numero_constancia",
			cell: (value: unknown) => (
				<div className="flex justify-center">
					<span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{value as string}</span>
				</div>
			),
		},
		{
			header: "Serie",
			accessor: "numero_constancia",
			cell: (value: unknown) => (
				<div className="flex justify-center">
					<span className="font-mono bg-yellow-50 px-2 py-1 rounded text-yellow-700 text-sm">{value as string}</span>
				</div>
			),
		},
		{
			header: "Número",
			accessor: "numero_constancia",
			cell: (value: unknown) => (
				<div className="flex justify-center">
					<span className="font-mono">{value as string}</span>
				</div>
			),
		},
		{
			header: "Periodo",
			accessor: "fecha_constancia",
			cell: (value: unknown) => {
				const periodo = value as string;
				const [year, month] = periodo.split("-");

				const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

				const monthName = monthNames[parseInt(month) - 1];

				return (
					<div className="flex justify-center">
						<span className="px-2 py-1 rounded-md text-xs font-medium bg-indigo-50 text-indigo-700">
							{monthName} {year}
						</span>
					</div>
				);
			},
		},
		{
			header: "Estado",
			accessor: "estado",
			cell: (value: unknown) => {
				const estado = value as string;
				const isPagado = estado === "Pagado";

				return (
					<div className="flex justify-center">
						<span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center ${isPagado ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>
							{isPagado ? (
								<>
									<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
									</svg>
									Pagado
								</>
							) : (
								<>
									<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
									</svg>
									Pendiente
								</>
							)}
						</span>
					</div>
				);
			},
		},
		{
			header: "Acciones",
			accessor: "id",
			cell: (value: unknown, row: Detraccion) => (
				<ActionButtonGroup>
					<EditButton onClick={() => handleEdit(row)} />
					<DeleteButton onClick={() => handleDelete(value as number | string)} />
					{row.estado === "Pendiente" && (
						<ActionButton onClick={() => handlePagar(value as number | string)} title="Pagar" bgColor="bg-green-100" textColor="text-green-700" hoverColor="bg-green-200">
							<ActivateIcon />
						</ActionButton>
					)}
				</ActionButtonGroup>
			),
		},
	];

	// Funciones para manejo de formulario
	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		const { name, value, type } = e.target;

		if (name.startsWith("cliente.")) {
			// Para propiedades anidadas como cliente.ruc o cliente.razon_social
			const prop = name.split(".")[1];
			setFormData({
				...formData,
				cliente: {
					...(formData.cliente || { razon_social: "", ruc: "" }),
					[prop]: value,
				},
			});
		} else {
			setFormData({
				...formData,
				[name]: type === "number" ? parseFloat(value) || 0 : value,
			});
		}
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		const nuevaDetraccion: Detraccion = {
			id: formData.id || Date.now(),
			cliente_id: formData.cliente_id || "",
			fecha_deposito: formData.fecha_deposito || new Date().toISOString().split("T")[0],
			numero_constancia: formData.numero_constancia || "",
			fecha_constancia: formData.fecha_constancia || new Date().toISOString().split("T")[0],
			monto: formData.monto || 0,
			porcentaje: formData.porcentaje || 4.0,
			estado: formData.estado || "Pendiente",
			observaciones: formData.observaciones || "",
			cliente: {
				razon_social: formData.cliente?.razon_social || "",
				ruc: formData.cliente?.ruc || "",
			},
		};

		if (formData.id) {
			// Actualizar detracción existente
			setDetracciones((dets) => dets.map((det) => (det.id === formData.id ? nuevaDetraccion : det)));
		} else {
			// Agregar nueva detracción
			setDetracciones([...detracciones, nuevaDetraccion]);
		}

		// Limpiar formulario
		setFormData({
			fecha_deposito: new Date().toISOString().split("T")[0],
			numero_constancia: "",
			fecha_constancia: new Date().toISOString().split("T")[0],
			monto: 0,
			porcentaje: 4.0,
			estado: "Pendiente",
			observaciones: "",
		});

		setShowForm(false);
	};

	const handleEdit = (detraccion: Detraccion) => {
		setFormData({
			...detraccion,
		});
		setShowForm(true);
	};

	const handleDelete = (id: number | string) => {
		if (confirm("¿Está seguro de que desea eliminar esta detracción?")) {
			setDetracciones(detracciones.filter((det) => det.id !== id));
		}
	};

	const handlePagar = (id: number | string) => {
		setDetracciones(detracciones.map((det) => (det.id === id ? { ...det, estado: "Pagado" } : det)));
	};

	// Manejo de importación CSV
	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) {
			return;
		}

		const reader = new FileReader();
		reader.onload = (event) => {
			const csvContent = event.target?.result as string;
			setCsvData(csvContent);
		};
		reader.readAsText(file);
	};

	const processCSV = () => {
		try {
			// Eliminar errores previos
			setImportError("");

			// Procesar CSV
			const lines = csvData.split("\n");
			const headers = lines[0].split(",");

			// Validar estructura del CSV
			const requiredHeaders = ["fecha_deposito", "numero_constancia", "cliente_id", "monto"];
			const missingHeaders = requiredHeaders.filter((header) => !headers.includes(header));

			if (missingHeaders.length > 0) {
				setImportError(`Faltan columnas obligatorias en el CSV: ${missingHeaders.join(", ")}`);
				return;
			}

			const importedDetracciones: Detraccion[] = [];

			// Comenzar desde la segunda línea (índice 1) para omitir los encabezados
			for (let i = 1; i < lines.length; i++) {
				if (!lines[i].trim()) continue; // Saltar líneas vacías

				const values = lines[i].split(",");
				if (values.length !== headers.length) {
					setImportError(`Error en la línea ${i + 1}: número incorrecto de valores`);
					return;
				}

				// Crear un objeto que cumpla con la interfaz Detraccion
				const detraccion: Detraccion = {
					id: Date.now() + i, // Generar ID único
					cliente_id: values[2].trim(),
					fecha_deposito: values[0].trim(),
					numero_constancia: values[1].trim(),
					fecha_constancia: new Date().toISOString().split("T")[0],
					monto: parseFloat(values[3].trim()) || 0,
					porcentaje: 4.0,
					estado: "Pendiente",
					observaciones: "",
					cliente: {
						razon_social: values[4]?.trim() || "Cliente sin nombre",
						ruc: values[2].trim() || "",
					},
				};

				// Mapear valores del CSV a propiedades de detracción
				headers.forEach((header, index) => {
					const value = values[index].trim();
					if (header === "fecha_deposito") {
						detraccion.fecha_deposito = value;
					} else if (header === "numero_constancia") {
						detraccion.numero_constancia = value;
					} else if (header === "cliente_id") {
						detraccion.cliente_id = value;
					} else if (header === "monto") {
						detraccion.monto = parseFloat(value) || 0;
					} else if (header === "porcentaje") {
						detraccion.porcentaje = parseFloat(value) || 4.0;
					} else if (header === "estado") {
						detraccion.estado = value;
					} else if (header === "observaciones") {
						detraccion.observaciones = value;
					} else if (header === "cliente.razon_social") {
						detraccion.cliente = {
							razon_social: value || "Cliente sin nombre",
							ruc: detraccion.cliente?.ruc || "",
						};
					} else if (header === "cliente.ruc") {
						detraccion.cliente = {
							razon_social: detraccion.cliente?.razon_social || "Cliente sin nombre",
							ruc: value || "",
						};
					}
				});

				importedDetracciones.push(detraccion);
			}

			// Agregar detracciones importadas
			setDetracciones([...detracciones, ...importedDetracciones]);

			// Limpiar
			setCsvData("");
			if (fileInputRef.current) {
				fileInputRef.current.value = "";
			}
			setShowImportForm(false);

			// Mostrar mensaje de éxito
			alert(`Se importaron ${importedDetracciones.length} detracciones con éxito`);
		} catch (error) {
			setImportError("Error al procesar el archivo CSV. Verifique su formato.");
			console.error("Error al procesar CSV:", error);
		}
	};

	const tiposOperacion = ["Transporte", "Servicios", "Otros"];
	const tiposComprobante = ["Factura", "Boleta", "Recibo", "Otro"];

	return (
		<div className="space-y-6">
			<div className="flex justify-between items-center">
				<h1 className="text-2xl font-bold">Gestión de Detracciones</h1>
				<div className="flex space-x-2">
					<button
						onClick={() => {
							setShowForm(!showForm);
							setShowImportForm(false);
						}}
						className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
						{showForm ? "Cancelar" : "Nueva Detracción"}
					</button>
					<button
						onClick={() => {
							setShowImportForm(!showImportForm);
							setShowForm(false);
						}}
						className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">
						{showImportForm ? "Cancelar" : "Importar CSV"}
					</button>
				</div>
			</div>

			{/* Formulario de nueva detracción */}
			{showForm && (
				<div className="bg-white p-6 rounded-lg shadow-md">
					<h2 className="text-xl font-bold mb-4">{formData.id ? "Editar Detracción" : "Nueva Detracción"}</h2>
					<form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
						<div>
							<label className="block text-sm font-medium text-gray-700">Fecha</label>
							<input
								type="date"
								name="fecha_deposito"
								value={formData.fecha_deposito}
								onChange={handleInputChange}
								className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
								required
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700">Número de Constancia</label>
							<input
								type="text"
								name="numero_constancia"
								value={formData.numero_constancia}
								onChange={handleInputChange}
								className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
								required
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700">RUC Proveedor</label>
							<input
								type="text"
								name="cliente.ruc"
								value={formData.cliente?.ruc}
								onChange={handleInputChange}
								className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
								required
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700">Nombre Proveedor</label>
							<input
								type="text"
								name="cliente.razon_social"
								value={formData.cliente?.razon_social}
								onChange={handleInputChange}
								className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
								required
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700">Moneda</label>
							<select
								name="monto"
								value={formData.monto}
								onChange={handleInputChange}
								className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
								required>
								<option value="PEN">Soles (PEN)</option>
								<option value="USD">Dólares (USD)</option>
							</select>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700">Importe</label>
							<input
								type="number"
								step="0.01"
								name="monto"
								value={formData.monto}
								onChange={handleInputChange}
								className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
								required
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700">Tipo Operación</label>
							<select
								name="porcentaje"
								value={formData.porcentaje}
								onChange={handleInputChange}
								className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
								required>
								{tiposOperacion.map((tipo, index) => (
									<option key={index} value={index * 4}>
										{tipo}
									</option>
								))}
							</select>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700">Tipo Comprobante</label>
							<select
								name="numero_constancia"
								value={formData.numero_constancia}
								onChange={handleInputChange}
								className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
								required>
								{tiposComprobante.map((tipo, index) => (
									<option key={index} value={tipo}>
										{tipo}
									</option>
								))}
							</select>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700">Serie Comprobante</label>
							<input
								type="text"
								name="numero_constancia"
								value={formData.numero_constancia}
								onChange={handleInputChange}
								className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
								required
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700">Número Comprobante</label>
							<input
								type="text"
								name="numero_constancia"
								value={formData.numero_constancia}
								onChange={handleInputChange}
								className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
								required
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700">Periodo</label>
							<input
								type="date"
								name="fecha_constancia"
								value={formData.fecha_constancia}
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
								<option value="Pendiente">Pendiente</option>
								<option value="Pagado">Pagado</option>
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

			{/* Formulario de importación CSV */}
			{showImportForm && (
				<div className="bg-white p-6 rounded-lg shadow-md">
					<h2 className="text-xl font-bold mb-4">Importar Detracciones desde CSV</h2>

					{importError && (
						<div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
							<p>{importError}</p>
						</div>
					)}

					<div className="mb-4">
						<p className="text-sm text-gray-600 mb-2">El archivo CSV debe tener los siguientes encabezados: fecha_deposito, numero_constancia, cliente_id, monto</p>

						<div className="bg-gray-100 p-3 rounded text-xs font-mono mb-4 overflow-x-auto">
							fecha_deposito,numero_constancia,cliente_id,monto
							<br />
							2025-04-10,DET-001,1,250.50
							<br />
							2025-04-11,DET-002,2,320.00
						</div>
					</div>

					<div className="mb-4">
						<label className="block text-sm font-medium text-gray-700 mb-2">Seleccionar archivo CSV</label>
						<input
							type="file"
							accept=".csv"
							onChange={handleFileChange}
							ref={fileInputRef}
							className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100"
						/>
					</div>

					{csvData && (
						<div className="mb-4">
							<h3 className="text-md font-medium mb-2">Vista previa:</h3>
							<div className="bg-gray-50 p-3 rounded border max-h-40 overflow-y-auto">
								<pre className="text-xs">{csvData}</pre>
							</div>
						</div>
					)}

					<div className="flex justify-end">
						<button
							type="button"
							onClick={() => {
								setShowImportForm(false);
								setCsvData("");
								setImportError("");
								if (fileInputRef.current) {
									fileInputRef.current.value = "";
								}
							}}
							className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md mr-2 hover:bg-gray-400">
							Cancelar
						</button>
						<button
							type="button"
							onClick={processCSV}
							disabled={!csvData}
							className={`px-4 py-2 rounded-md ${csvData ? "bg-green-600 text-white hover:bg-green-700" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}>
							Importar
						</button>
					</div>
				</div>
			)}

			<DataTable
				columns={columns}
				data={detracciones}
				title="Registro de Detracciones"
				defaultSort="fecha_deposito"
				filters={{
					year: true,
					month: true,
					searchField: "cliente.razon_social",
				}}
			/>
		</div>
	);
}
