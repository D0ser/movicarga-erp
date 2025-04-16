"use client";

import { useState, useRef, useEffect } from "react";
import DataTable, { DataItem, Column } from "@/components/DataTable";
import { format } from "date-fns";
import { EditButton, DeleteButton, ActivateButton, ActionButtonGroup, ActionButton, ActivateIcon } from "@/components/ActionIcons";
import { detraccionService, Detraccion as DetraccionType } from "@/lib/supabaseServices";

// Definición de la estructura de datos de Detracciones actualizada
interface Detraccion extends DataItem {
	id: string;
	cliente_id: string;
	viaje_id?: string | null;
	ingreso_id?: string | null;
	factura_id?: string | null;

	// Campos básicos y principales
	fecha_deposito: string;
	monto: number;
	porcentaje: number;
	estado: string;
	observaciones: string;

	// Campos para CSV (nuevos campos solicitados)
	tipo_cuenta?: string;
	numero_cuenta?: string;
	numero_constancia: string;
	periodo_tributario?: string;
	ruc_proveedor?: string;
	nombre_proveedor?: string;
	tipo_documento_adquiriente?: string;
	numero_documento_adquiriente?: string;
	nombre_razon_social_adquiriente?: string;
	fecha_pago?: string;
	tipo_bien?: string;
	tipo_operacion?: string;
	tipo_comprobante?: string;
	serie_comprobante?: string;
	numero_comprobante?: string;
	numero_pago_detracciones?: string;

	// Metadatos
	created_at?: string;
	updated_at?: string;

	// Propiedades relacionadas
	cliente?: {
		razon_social: string;
		ruc: string;
	};
	viaje?: {
		origen: string;
		destino: string;
		fecha_salida: string;
	};
	ingreso?: {
		concepto: string;
		monto: number;
		numero_factura: string;
	};
}

export default function DetraccionesPage() {
	// Usar datos de Supabase
	const [detracciones, setDetracciones] = useState<Detraccion[]>([]);
	const [loading, setLoading] = useState<boolean>(true);
	const [error, setError] = useState<string | null>(null);
	const [csvOrigenes, setCsvOrigenes] = useState<string[]>([]);
	const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
	const [selectedCsvOrigen, setSelectedCsvOrigen] = useState<string>("");

	// Estado para el formulario de importación CSV
	const [showImportForm, setShowImportForm] = useState(false);
	const [csvData, setCsvData] = useState<string>("");
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [importError, setImportError] = useState<string>("");
	const [nombreArchivoCsv, setNombreArchivoCsv] = useState<string>("");
	const [debugMode, setDebugMode] = useState<boolean>(false);
	const [forceImport, setForceImport] = useState<boolean>(false);
	const [testConnectionResult, setTestConnectionResult] = useState<{ success: boolean; message: string } | null>(null);

	// Comprobar el entorno al cargar el componente
	useEffect(() => {
		console.log("Entorno actual:", {
			NODE_ENV: process.env.NODE_ENV,
			OFFLINE_MODE: process.env.NEXT_PUBLIC_OFFLINE_MODE,
			SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? "Configurado" : "No configurado",
			SUPABASE_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "Configurado" : "No configurado",
		});
	}, []);

	// Cargar datos de detracciones desde Supabase
	useEffect(() => {
		const fetchDetracciones = async () => {
			try {
				setLoading(true);
				const data = await detraccionService.getDetracciones();
				setDetracciones(data);
				setError(null);
			} catch (err) {
				console.error("Error al cargar detracciones:", err);
				setError("Error al cargar las detracciones. Por favor, inténtelo de nuevo.");
				// Datos de respaldo en caso de error
				setDetracciones([
					{
						id: "1",
						cliente_id: "1",
						fecha_deposito: "2025-03-05",
						numero_constancia: "DET-001-2025",
						monto: 250.5,
						porcentaje: 4.0,
						estado: "Pendiente",
						observaciones: "Detracción por servicio de transporte",
						ruc_proveedor: "20123456789",
						nombre_proveedor: "Transportes S.A.",
						tipo_comprobante: "Factura",
						cliente: {
							razon_social: "Transportes S.A.",
							ruc: "20123456789",
						},
					},
					{
						id: "2",
						cliente_id: "2",
						fecha_deposito: "2025-03-12",
						numero_constancia: "DET-002-2025",
						monto: 320.0,
						porcentaje: 4.0,
						estado: "Pendiente",
						observaciones: "Detracción por flete Lima-Arequipa",
						ruc_proveedor: "20987654321",
						nombre_proveedor: "Logística Express",
						tipo_comprobante: "Factura",
						cliente: {
							razon_social: "Logística Express",
							ruc: "20987654321",
						},
					},
				]);
			} finally {
				setLoading(false);
			}
		};

		fetchDetracciones();
	}, []);

	// Columnas para la tabla de detracciones
	const columns: Column<Detraccion>[] = [
		{
			header: "Fecha Depósito",
			accessor: "fecha_deposito",
			cell: (value: unknown) => {
				// Verificar que el valor existe y es una fecha válida
				if (!value) {
					return <div className="flex justify-center">-</div>;
				}

				try {
					const date = new Date(value as string);
					if (isNaN(date.getTime())) {
						return <div className="flex justify-center">Fecha inválida</div>;
					}

					return (
						<div className="flex justify-center">
							<span className="text-sm font-medium flex items-center text-gray-700">
								<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-500 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
								</svg>
								{format(date, "dd/MM/yyyy")}
							</span>
						</div>
					);
				} catch (error) {
					return <div className="flex justify-center">Error de formato</div>;
				}
			},
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
			header: "Tipo Cuenta",
			accessor: "tipo_cuenta",
			cell: (value: unknown) => (
				<div className="flex justify-center">
					<span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">{(value as string) || "-"}</span>
				</div>
			),
		},
		{
			header: "Número Cuenta",
			accessor: "numero_cuenta",
			cell: (value: unknown) => (
				<div className="flex justify-center">
					<span className="font-mono text-sm">{(value as string) || "-"}</span>
				</div>
			),
		},
		{
			header: "Periodo Tributario",
			accessor: "periodo_tributario",
			cell: (value: unknown) => (
				<div className="flex justify-center">
					<span className="font-mono bg-indigo-50 px-2 py-1 rounded text-indigo-700 text-sm">{(value as string) || "-"}</span>
				</div>
			),
		},
		{
			header: "RUC Proveedor",
			accessor: "ruc_proveedor",
			cell: (value: unknown) => {
				// Verificar que el valor existe
				const ruc = (value as string) || "";

				return (
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
							{ruc || "Sin RUC"}
						</span>
					</div>
				);
			},
		},
		{
			header: "Proveedor",
			accessor: "nombre_proveedor",
			cell: (value: unknown, row: Detraccion) => {
				// Verificar que el valor existe antes de usar charAt
				const nombre = (value as string) || "";
				const inicial = nombre.length > 0 ? nombre.charAt(0).toUpperCase() : "?";

				return (
					<div className="flex items-center px-2 justify-center">
						<div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold mr-3">{inicial}</div>
						<div className="text-sm font-medium text-gray-900 truncate">{nombre || "Sin nombre"}</div>
					</div>
				);
			},
		},
		{
			header: "Tipo Doc. Adq.",
			accessor: "tipo_documento_adquiriente",
			cell: (value: unknown) => (
				<div className="flex justify-center">
					<span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{(value as string) || "-"}</span>
				</div>
			),
		},
		{
			header: "Número Doc. Adq.",
			accessor: "numero_documento_adquiriente",
			cell: (value: unknown) => (
				<div className="flex justify-center">
					<span className="font-mono text-sm">{(value as string) || "-"}</span>
				</div>
			),
		},
		{
			header: "Razón Social Adq.",
			accessor: "nombre_razon_social_adquiriente",
			cell: (value: unknown) => (
				<div className="flex justify-start">
					<span className="text-sm truncate">{(value as string) || "-"}</span>
				</div>
			),
		},
		{
			header: "Fecha Pago",
			accessor: "fecha_pago",
			cell: (value: unknown) => {
				if (!value) {
					return <div className="flex justify-center">-</div>;
				}

				try {
					const date = new Date(value as string);
					if (isNaN(date.getTime())) {
						return <div className="flex justify-center">-</div>;
					}

					return (
						<div className="flex justify-center">
							<span className="text-sm">{format(date, "dd/MM/yyyy")}</span>
						</div>
					);
				} catch (error) {
					return <div className="flex justify-center">-</div>;
				}
			},
		},
		{
			header: "Importe",
			accessor: "monto",
			cell: (value: unknown, row: Detraccion) => (
				<div className="flex justify-end">
					<span className="font-mono text-gray-700 font-medium">S/. {(value as number).toLocaleString("es-PE", { minimumFractionDigits: 2 })}</span>
				</div>
			),
		},
		{
			header: "Tipo Bien",
			accessor: "tipo_bien",
			cell: (value: unknown) => (
				<div className="flex justify-center">
					<span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 flex items-center">{(value as string) || "-"}</span>
				</div>
			),
		},
		{
			header: "Tipo Operación",
			accessor: "tipo_operacion",
			cell: (value: unknown) => (
				<div className="flex justify-center">
					<span className="px-2 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700">{(value as string) || "-"}</span>
				</div>
			),
		},
		{
			header: "Tipo Comprobante",
			accessor: "tipo_comprobante",
			cell: (value: unknown) => (
				<div className="flex justify-center">
					<span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{(value as string) || "-"}</span>
				</div>
			),
		},
		{
			header: "Serie",
			accessor: "serie_comprobante",
			cell: (value: unknown) => (
				<div className="flex justify-center">
					<span className="font-mono bg-yellow-50 px-2 py-1 rounded text-yellow-700 text-sm">{(value as string) || "-"}</span>
				</div>
			),
		},
		{
			header: "Número",
			accessor: "numero_comprobante",
			cell: (value: unknown) => (
				<div className="flex justify-center">
					<span className="font-mono">{(value as string) || "-"}</span>
				</div>
			),
		},
		{
			header: "N° Pago Detracciones",
			accessor: "numero_pago_detracciones",
			cell: (value: unknown) => (
				<div className="flex justify-center">
					<span className="font-mono">{(value as string) || "-"}</span>
				</div>
			),
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
			header: "Origen",
			accessor: "origen_csv",
			cell: (value: unknown) => (
				<div className="flex justify-center">
					<span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">{(value as string) || "Manual"}</span>
				</div>
			),
		},
		{
			header: "Acciones",
			accessor: "id",
			cell: (value: unknown, row: Detraccion) => (
				<ActionButtonGroup>
					<DeleteButton onClick={() => handleDelete(value as string)} />
					{row.estado === "Pendiente" && (
						<ActionButton onClick={() => handlePagar(value as string)} title="Pagar" bgColor="bg-green-100" textColor="text-green-700" hoverColor="bg-green-200">
							<ActivateIcon />
						</ActionButton>
					)}
				</ActionButtonGroup>
			),
		},
	];

	// Función para actualizar la lista de orígenes CSV según las detracciones existentes
	const actualizarOrigenesCsv = (listaDetracciones: Detraccion[]) => {
		const origenes = [...new Set(listaDetracciones.map((d) => d.origen_csv).filter(Boolean))];
		setCsvOrigenes(origenes);
	};

	// Eliminar todas las detracciones de un origen CSV específico
	const handleDeleteByCsv = async (origen: string) => {
		if (!origen) return;

		try {
			const detracionesAEliminar = detracciones.filter((d) => d.origen_csv === origen);

			if (detracionesAEliminar.length === 0) {
				alert("No hay detracciones para eliminar con este origen.");
				return;
			}

			if (confirm(`¿Está seguro de que desea eliminar las ${detracionesAEliminar.length} detracciones del archivo "${origen}"?`)) {
				// En modo development, solo actualizamos el estado local
				const isOfflineMode = (process.env.NODE_ENV === "development" || process.env.NEXT_PUBLIC_OFFLINE_MODE === "true") && !debugMode;

				if (isOfflineMode) {
					const nuevasDetracciones = detracciones.filter((d) => d.origen_csv !== origen);
					setDetracciones(nuevasDetracciones);
					actualizarOrigenesCsv(nuevasDetracciones);
				} else {
					// En producción, eliminamos de Supabase
					for (const det of detracionesAEliminar) {
						await detraccionService.deleteDetraccion(det.id);
					}

					// Actualizar estado local
					const nuevasDetracciones = detracciones.filter((d) => d.origen_csv !== origen);
					setDetracciones(nuevasDetracciones);
					actualizarOrigenesCsv(nuevasDetracciones);
				}

				setShowDeleteModal(false);
				setSelectedCsvOrigen("");
				alert(`Se eliminaron las detracciones del archivo "${origen}" con éxito.`);
			}
		} catch (error) {
			console.error("Error al eliminar detracciones por CSV:", error);
			alert("Error al eliminar las detracciones");
		}
	};

	const handleDelete = async (id: string) => {
		if (confirm("¿Está seguro de que desea eliminar esta detracción?")) {
			try {
				// Eliminar de Supabase
				await detraccionService.deleteDetraccion(id);
				// Actualizar estado local
				const nuevasDetracciones = detracciones.filter((det) => det.id !== id);
				setDetracciones(nuevasDetracciones);

				// Actualizar orígenes CSV
				actualizarOrigenesCsv(nuevasDetracciones);
			} catch (error) {
				console.error("Error al eliminar detracción:", error);
				alert("Error al eliminar la detracción");
			}
		}
	};

	const handlePagar = async (id: string) => {
		try {
			// Actualizar en Supabase
			await detraccionService.updateDetraccion(id, { estado: "Pagado" });
			// Actualizar estado local
			setDetracciones(detracciones.map((det) => (det.id === id ? { ...det, estado: "Pagado" } : det)));
		} catch (error) {
			console.error("Error al actualizar estado de detracción:", error);
			alert("Error al actualizar el estado de la detracción");
		}
	};

	// Manejo de importación CSV
	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) {
			return;
		}

		setNombreArchivoCsv(file.name);

		const reader = new FileReader();
		reader.onload = (event) => {
			const csvContent = event.target?.result as string;
			setCsvData(csvContent);
		};
		reader.onerror = (error) => {
			console.error("Error al leer el archivo CSV:", error);
			setImportError("Error al leer el archivo CSV. Por favor, inténtelo de nuevo.");
		};

		// Leer como texto con codificación Windows-1252 (Europeo occidental Windows)
		reader.readAsText(file, "windows-1252");
	};

	const processCSV = async () => {
		try {
			// Eliminar errores previos
			setImportError("");

			// Procesar CSV - Usando delimitador adaptativo
			const lines = csvData.split("\n");
			if (lines.length <= 1) {
				setImportError("El archivo CSV está vacío o no tiene datos válidos");
				return;
			}

			// Detectar delimitador - probar primero coma, luego punto y coma, luego tab
			let delimiter = ",";
			const firstLine = lines[0];

			// Contar ocurrencias de posibles delimitadores
			const countCommas = (firstLine.match(/,/g) || []).length;
			const countSemicolons = (firstLine.match(/;/g) || []).length;
			const countTabs = (firstLine.match(/\t/g) || []).length;

			if (countSemicolons > countCommas && countSemicolons > countTabs) {
				delimiter = ";";
				console.log("Delimitador detectado: punto y coma (;)");
			} else if (countTabs > countCommas && countTabs > countSemicolons) {
				delimiter = "\t";
				console.log("Delimitador detectado: tabulador (\\t)");
			} else {
				console.log("Delimitador detectado: coma (,)");
			}

			// Orden obligatorio de campos con nombres completos
			const nombresCamposEsperados = [
				"Tipo de Cuenta",
				"Numero de Cuenta",
				"Numero Constancia",
				"Periodo Tributario",
				"RUC Proveedor",
				"Nombre Proveedor",
				"Tipo de Documento Adquiriente",
				"Numero de Documento Adquiriente",
				"Nombre/Razon Social del Adquiriente",
				"Fecha Pago",
				"Monto Deposito",
				"Tipo Bien",
				"Tipo Operacion",
				"Tipo de Comprobante",
				"Serie de Comprobante",
				"Numero de Comprobante",
				"Numero de pago de Detracciones",
			];

			// Mapeo de nombres completos a nombres de campo en el sistema
			const mapeoNombresCampos: Record<string, string> = {
				"Tipo de Cuenta": "tipo_cuenta",
				"Numero de Cuenta": "numero_cuenta",
				"Numero Constancia": "numero_constancia",
				"Periodo Tributario": "periodo_tributario",
				"RUC Proveedor": "ruc_proveedor",
				"Nombre Proveedor": "nombre_proveedor",
				"Tipo de Documento Adquiriente": "tipo_documento_adquiriente",
				"Numero de Documento Adquiriente": "numero_documento_adquiriente",
				"Nombre/Razon Social del Adquiriente": "nombre_razon_social_adquiriente",
				"Fecha Pago": "fecha_pago",
				"Monto Deposito": "monto",
				"Tipo Bien": "tipo_bien",
				"Tipo Operacion": "tipo_operacion",
				"Tipo de Comprobante": "tipo_comprobante",
				"Serie de Comprobante": "serie_comprobante",
				"Numero de Comprobante": "numero_comprobante",
				"Numero de pago de Detracciones": "numero_pago_detracciones",
			};

			// Obtener encabezados del CSV
			let headers: string[] = [];
			try {
				headers = firstLine.split(delimiter).map((header) => header.trim());
				console.log("Encabezados encontrados en el CSV:", headers);
				console.log("Delimitador utilizado:", delimiter);
			} catch (e) {
				console.error("Error al procesar encabezados:", e);
				setImportError("Error al procesar los encabezados del CSV. Verifique el formato.");
				return;
			}

			// Validar que los encabezados coincidan con el orden esperado
			const headersMismatches: { expected: string; found: string }[] = [];
			const headersValidos = nombresCamposEsperados.every((campo, index) => {
				const headerFound = headers[index]?.toLowerCase() || "";
				const headerExpected = campo.toLowerCase();
				const isValid = headerFound === headerExpected;

				if (!isValid) {
					headersMismatches.push({ expected: headerExpected, found: headerFound });
				}

				return isValid;
			});

			// Si hay diferencias, mostrarlas en la consola para depuración
			if (headersMismatches.length > 0) {
				console.error("Discrepancias en encabezados:", headersMismatches);
				console.log(
					"Encabezados esperados:",
					nombresCamposEsperados.map((h) => h.toLowerCase())
				);
				console.log(
					"Encabezados encontrados:",
					headers.map((h) => h.toLowerCase())
				);
			}

			if (!headersValidos) {
				// Si está activado el modo forzar importación, continuamos aunque los encabezados no coincidan
				if (forceImport && debugMode) {
					console.warn("IMPORTANTE: Forzando importación a pesar de discrepancias en encabezados.");
					console.log("Usando los encabezados encontrados como están, ignorando validación.");
				} else {
					// Comportamiento normal: mostrar error y detener importación
					setImportError("El orden de los campos en el CSV no coincide con el orden requerido. Por favor, verifique la estructura del archivo.");
					return;
				}
			}

			const importedDetracciones: Detraccion[] = [];

			// Comenzar desde la segunda línea (índice 1) para omitir los encabezados
			for (let i = 1; i < lines.length; i++) {
				if (!lines[i].trim()) continue; // Saltar líneas vacías

				let values: string[] = [];
				try {
					values = lines[i].split(delimiter).map((val) => val.trim());
				} catch (e) {
					console.error(`Error al procesar la línea ${i + 1}:`, e);
					setImportError(`Error al procesar la línea ${i + 1}. Verifique el formato.`);
					continue; // Continuar con la siguiente línea en lugar de detener todo el proceso
				}

				if (values.length !== headers.length) {
					console.warn(`Advertencia: La línea ${i + 1} tiene ${values.length} valores pero se esperaban ${headers.length}`);
					// Ajustar el tamaño de values para que coincida con headers
					while (values.length < headers.length) values.push("");
					if (values.length > headers.length) values = values.slice(0, headers.length);
				}

				// Crear un objeto con los valores en el orden correcto
				const detraccionData: Record<string, any> = {};

				// Mapear valores según el orden correcto, convirtiendo los nombres completos a nombres de campo interno
				if (forceImport && debugMode && !headersValidos) {
					// Si estamos forzando la importación, mapeamos directamente por posición
					// Asumimos que las posiciones más importantes son las primeras y las mapeamos a los campos correspondientes
					console.log("Mapeo de emergencia usado con encabezados encontrados");

					// Mapeo básico (asumiendo que al menos algunas columnas están en posiciones cercanas a las esperadas)
					headers.forEach((header, index) => {
						// Buscar el nombre de campo más similar
						const normalizedHeader = header.toLowerCase().replace(/\s+/g, "");
						let bestMatch = "";

						// Intentamos encontrar la mejor coincidencia entre los campos esperados
						for (const nombreCampo of Object.keys(mapeoNombresCampos)) {
							const normalizedNombreCampo = nombreCampo.toLowerCase().replace(/\s+/g, "");

							if (normalizedHeader.includes(normalizedNombreCampo) || normalizedNombreCampo.includes(normalizedHeader)) {
								bestMatch = mapeoNombresCampos[nombreCampo];
								break;
							}
						}

						// Si no encontramos coincidencia, usamos un mapeo por posición para los campos más críticos
						if (!bestMatch) {
							// Mapeo de emergencia por posición para los campos más importantes
							const camposEnOrden = ["tipo_cuenta", "numero_cuenta", "numero_constancia", "periodo_tributario", "ruc_proveedor", "nombre_proveedor", "monto", "fecha_pago"];

							if (index < camposEnOrden.length) {
								bestMatch = camposEnOrden[index];
							} else {
								// Si todo falla, usamos el encabezado tal cual
								bestMatch = header.toLowerCase().replace(/\s+/g, "_");
							}
						}

						// Asignar el valor
						detraccionData[bestMatch] = values[index] || "";
						console.log(`Mapeado: ${header} -> ${bestMatch} = ${values[index]}`);
					});
				} else {
					// Mapeo normal usando el orden esperado
					nombresCamposEsperados.forEach((nombreCampo, index) => {
						const nombreCampoInterno = mapeoNombresCampos[nombreCampo];
						detraccionData[nombreCampoInterno] = values[index] || "";
					});
				}

				// Generar ID único temporal (será reemplazado por Supabase en producción)
				const uniqueId = `temp_${new Date().getTime()}_${i}`;

				// Crear un objeto que cumpla con la interfaz Detraccion
				const detraccion: Partial<Detraccion> = {
					cliente_id: detraccionData.ruc_proveedor || "",
					fecha_deposito: detraccionData.fecha_deposito || new Date().toISOString().split("T")[0],
					numero_constancia: detraccionData.numero_constancia || "",
					monto: parseFloat(detraccionData.monto) || 0,
					porcentaje: 4.0, // Valor por defecto para porcentaje
					estado: "Pendiente",
					observaciones: "",

					// Campos CSV específicos
					tipo_cuenta: detraccionData.tipo_cuenta || "",
					numero_cuenta: detraccionData.numero_cuenta || "",
					periodo_tributario: detraccionData.periodo_tributario || "",
					ruc_proveedor: detraccionData.ruc_proveedor || "",
					nombre_proveedor: detraccionData.nombre_proveedor || "",
					tipo_documento_adquiriente: detraccionData.tipo_documento_adquiriente || "",
					numero_documento_adquiriente: detraccionData.numero_documento_adquiriente || "",
					nombre_razon_social_adquiriente: detraccionData.nombre_razon_social_adquiriente || "",
					fecha_pago: detraccionData.fecha_pago || "",
					tipo_bien: detraccionData.tipo_bien || "",
					tipo_operacion: detraccionData.tipo_operacion || "",
					tipo_comprobante: detraccionData.tipo_comprobante || "",
					serie_comprobante: detraccionData.serie_comprobante || "",
					numero_comprobante: detraccionData.numero_comprobante || "",
					numero_pago_detracciones: detraccionData.numero_pago_detracciones || "",

					// Identificador del archivo CSV
					origen_csv: nombreArchivoCsv,
				};

				// Limpiar datos para Supabase: convertir strings vacíos a null para relaciones
				// Supabase requiere que las claves foráneas sean null en lugar de string vacío
				if (detraccion.cliente_id === "") detraccion.cliente_id = null as any;
				if (detraccion.viaje_id === "") detraccion.viaje_id = null;
				if (detraccion.ingreso_id === "") detraccion.ingreso_id = null;
				if (detraccion.factura_id === "") detraccion.factura_id = null;

				// Asegurar formato de fechas correcto para Supabase (YYYY-MM-DD)
				if (detraccion.fecha_pago && !detraccion.fecha_pago.match(/^\d{4}-\d{2}-\d{2}$/)) {
					// Intentar parsear la fecha si no está en formato ISO
					try {
						const fechaPago = new Date(detraccion.fecha_pago);
						if (!isNaN(fechaPago.getTime())) {
							detraccion.fecha_pago = fechaPago.toISOString().split("T")[0];
						} else {
							// Si no se puede parsear, dejar vacío para evitar errores en Supabase
							console.warn(`Fecha de pago inválida en línea ${i}: ${detraccion.fecha_pago}`);
							detraccion.fecha_pago = null as any; // Usar null en lugar de string vacío
						}
					} catch (e) {
						console.warn(`Error al parsear fecha_pago en línea ${i}: ${e}`);
						detraccion.fecha_pago = null as any;
					}
				} else if (detraccion.fecha_pago === "") {
					detraccion.fecha_pago = null as any;
				}

				// También formatear fecha_deposito
				if (detraccion.fecha_deposito && !detraccion.fecha_deposito.match(/^\d{4}-\d{2}-\d{2}$/)) {
					try {
						const fechaDeposito = new Date(detraccion.fecha_deposito);
						if (!isNaN(fechaDeposito.getTime())) {
							detraccion.fecha_deposito = fechaDeposito.toISOString().split("T")[0];
						} else {
							detraccion.fecha_deposito = new Date().toISOString().split("T")[0];
						}
					} catch (e) {
						console.warn(`Error al parsear fecha_deposito en línea ${i}: ${e}`);
						detraccion.fecha_deposito = new Date().toISOString().split("T")[0];
					}
				}

				// Asegurar que cliente_id sea un UUID válido
				if (detraccion.cliente_id && !detraccion.cliente_id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
					// Si no es un UUID válido, lo dejamos en blanco - Supabase buscará o creará el cliente por RUC
					console.log(`Cliente ID no es un UUID válido en línea ${i}: ${detraccion.cliente_id}`);
					detraccion.cliente_id = null as any; // Usar null en lugar de string vacío
				}

				try {
					// Para modo offline o pruebas, agregar sin llamar a Supabase
					const isOfflineMode = (process.env.NODE_ENV === "development" || process.env.NEXT_PUBLIC_OFFLINE_MODE === "true") && !debugMode;

					if (isOfflineMode) {
						console.log("Modo offline/desarrollo: guardando datos localmente");
						// Modo offline: solo guardar en estado local con ID temporal
						importedDetracciones.push({
							...detraccion,
							id: uniqueId,
							cliente: {
								razon_social: detraccionData.nombre_proveedor || "Sin especificar",
								ruc: detraccionData.ruc_proveedor || "",
							},
						} as Detraccion);
					} else {
						// Modo online: guardar en Supabase
						console.log("Modo online: intentando guardar en Supabase", JSON.stringify(detraccion));

						try {
							// Verificar que los datos obligatorios estén presentes
							if (!detraccion.numero_constancia) {
								console.warn("Advertencia: Falta número de constancia en la línea", i);
							}
							if (!detraccion.monto || detraccion.monto <= 0) {
								console.warn("Advertencia: Monto inválido en la línea", i);
								detraccion.monto = 0; // Asignar 0 para evitar errores de tipo
							}
							if (!detraccion.cliente_id) {
								console.warn("Advertencia: cliente_id vacío en la línea", i);
								// Para evitar error de clave foránea, usar un ID de cliente válido o null
								// Si no hay id de cliente, usaremos el primer cliente (normalmente el de la empresa)
								detraccion.cliente_id = "00000000-0000-0000-0000-000000000000"; // ID genérico que será reemplazado
							}

							// Añadir fecha_deposito si está ausente
							if (!detraccion.fecha_deposito) {
								detraccion.fecha_deposito = new Date().toISOString().split("T")[0];
								console.log("Fecha depósito asignada automáticamente:", detraccion.fecha_deposito);
							}

							// Remover propiedades que podrían causar problemas en Supabase
							const detraccionLimpia = { ...detraccion };

							// Solo intentamos insertar si tenemos los datos mínimos necesarios
							if (debugMode) {
								console.log("Objeto final a insertar:", JSON.stringify(detraccionLimpia, null, 2));
							}

							// Crear en Supabase (omitiendo campos cliente y otros relacionados)
							const createdDetraccion = await detraccionService.createDetraccion(detraccionLimpia as Omit<DetraccionType, "id" | "cliente" | "viaje" | "ingreso">);
							console.log("Detracción creada exitosamente en Supabase:", createdDetraccion);

							// Agregar el registro creado en Supabase con su ID real
							importedDetracciones.push({
								...createdDetraccion,
								cliente: {
									razon_social: detraccionData.nombre_proveedor || "Sin especificar",
									ruc: detraccionData.ruc_proveedor || "",
								},
							} as Detraccion);
						} catch (supabaseError) {
							console.error("Error específico de Supabase:", supabaseError);
							console.error("Detalles del objeto que falló:", JSON.stringify(detraccion));

							// Analizar tipo de error para dar mensaje más claro
							let errorMessage = "Error desconocido";

							if (supabaseError instanceof Error) {
								errorMessage = supabaseError.message;

								// Detectar errores comunes
								if (errorMessage.includes("foreign key constraint")) {
									errorMessage = "Error de clave foránea - Asegúrese de que los IDs referenciados existan en la base de datos";
								} else if (errorMessage.includes("duplicate key")) {
									errorMessage = "Error de clave duplicada - Ya existe una detracción con ese ID o número de constancia";
								} else if (errorMessage.includes("not-null constraint")) {
									errorMessage = "Error de campo requerido - Hay campos obligatorios que están vacíos";
								}
							}

							setImportError(`Error al guardar detracción en la línea ${i + 1}: ${errorMessage}`);

							// Dependiendo del error, podríamos intentar continuar o detener todo el proceso
							if (forceImport && debugMode) {
								console.warn("Continuando importación a pesar del error (modo forzado)");
								continue;
							} else {
								return; // Detener todo el proceso en caso de error grave
							}
						}
					}
				} catch (error) {
					console.error("Error al guardar detracción:", error);
					console.error("Objeto que causó el error:", JSON.stringify(detraccion));
					setImportError(`Error al guardar detracción en la línea ${i + 1}: ${error instanceof Error ? error.message : "Error desconocido"}`);
					// Continuar con el siguiente registro si hay error
				}
			}

			if (importedDetracciones.length === 0) {
				setImportError("No se pudieron importar detracciones. Verifique el formato del archivo CSV y los datos.");
				return;
			}

			// Agregar detracciones importadas al estado local
			setDetracciones((prev) => [...prev, ...importedDetracciones]);

			// Actualizar la lista de orígenes CSV
			if (nombreArchivoCsv && !csvOrigenes.includes(nombreArchivoCsv)) {
				setCsvOrigenes([...csvOrigenes, nombreArchivoCsv]);
			}

			// Limpiar
			setCsvData("");
			setNombreArchivoCsv("");
			if (fileInputRef.current) {
				fileInputRef.current.value = "";
			}
			setShowImportForm(false);

			// Mostrar mensaje de éxito
			alert(`Se importaron ${importedDetracciones.length} detracciones con éxito`);
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : "Error desconocido";
			setImportError(`Error al procesar el archivo CSV: ${errorMessage}`);
			console.error("Error al procesar CSV:", error);
		}
	};

	// Función para probar la conexión con Supabase
	const testSupabaseConnection = async () => {
		try {
			setTestConnectionResult({ success: false, message: "Probando conexión..." });

			// Intentar una operación simple en Supabase
			const { data, error } = await detraccionService.testConnection();

			if (error) {
				console.error("Error en prueba de conexión:", error);
				setTestConnectionResult({
					success: false,
					message: `Error de conexión: ${error.message || "Error desconocido"}`,
				});
			} else {
				console.log("Conexión exitosa:", data);
				setTestConnectionResult({
					success: true,
					message: "Conexión exitosa a Supabase",
				});
			}
		} catch (error) {
			console.error("Excepción en prueba de conexión:", error);
			setTestConnectionResult({
				success: false,
				message: `Error inesperado: ${error instanceof Error ? error.message : "Error desconocido"}`,
			});
		}
	};

	return (
		<div className="p-4 space-y-6">
			{error && (
				<div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
					<p>{error}</p>
				</div>
			)}

			<div className="flex justify-between items-center">
				<h1 className="text-2xl font-bold">Gestión de Detracciones</h1>
				<div className="flex space-x-2">
					<button
						onClick={() => setDebugMode(!debugMode)}
						className={`px-4 py-2 rounded-md ${debugMode ? "bg-orange-600 text-white" : "bg-gray-300 text-gray-700"}`}
						title="Activar/desactivar modo depuración">
						{debugMode ? "Debug ON" : "Debug OFF"}
					</button>
					<button
						onClick={() => {
							setShowImportForm(!showImportForm);
						}}
						className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">
						{showImportForm ? "Cancelar" : "Importar CSV"}
					</button>

					<button onClick={() => setShowDeleteModal(true)} className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700">
						Eliminar por CSV
					</button>
				</div>
			</div>

			{debugMode && (
				<div className="bg-orange-100 border-l-4 border-orange-500 text-orange-700 p-4 mb-4">
					<div className="font-bold">Modo Depuración</div>
					<p className="mb-2">Información del entorno:</p>
					<ul className="list-disc pl-5">
						<li>NODE_ENV: {process.env.NODE_ENV}</li>
						<li>OFFLINE_MODE: {process.env.NEXT_PUBLIC_OFFLINE_MODE}</li>
						<li>SUPABASE_URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? "Configurado" : "No configurado"}</li>
						<li>SUPABASE_KEY: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "Configurado" : "No configurado"}</li>
					</ul>
					<div className="mt-3 flex items-center">
						<input type="checkbox" id="force-import" checked={forceImport} onChange={() => setForceImport(!forceImport)} className="mr-2" />
						<label htmlFor="force-import">Forzar importación (ignorar validación de encabezados)</label>
					</div>
					<div className="mt-3">
						<button onClick={testSupabaseConnection} className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 text-sm">
							Probar conexión a Supabase
						</button>

						{testConnectionResult && <div className={`mt-2 ${testConnectionResult.success ? "text-green-600" : "text-red-600"}`}>{testConnectionResult.message}</div>}
					</div>
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
						<p className="text-sm text-gray-600 mb-2">El archivo CSV debe incluir los siguientes campos con este orden específico (delimitados por comas):</p>
						<div className="bg-gray-100 p-3 rounded text-xs font-mono mb-4 overflow-x-auto">
							Tipo de Cuenta,Numero de Cuenta,Numero Constancia,Periodo Tributario,RUC Proveedor,Nombre Proveedor,Tipo de Documento Adquiriente,Numero de Documento Adquiriente,Nombre/Razon Social del
							Adquiriente,Fecha Pago,Monto Deposito,Tipo Bien,Tipo Operacion,Tipo de Comprobante,Serie de Comprobante,Numero de Comprobante,Numero de pago de Detracciones
						</div>

						<div className="text-sm text-gray-600 mb-2">
							<p className="mb-1">
								<span className="font-semibold">Importante:</span>
							</p>
							<ul className="list-disc pl-5 space-y-1">
								<li>El delimitador debe ser la coma (,)</li>
								<li>La codificación del archivo debe ser "1252: Europeo occidental Windows"</li>
								<li>La primera línea debe contener los nombres de los campos exactamente como se muestra arriba</li>
								<li>El orden de los campos debe respetarse estrictamente</li>
							</ul>
						</div>

						<p className="text-sm text-gray-600 mt-4 mb-2">Ejemplo:</p>
						<div className="bg-gray-100 p-3 rounded text-xs font-mono mb-4 overflow-x-auto">
							Tipo de Cuenta,Numero de Cuenta,Numero Constancia,Periodo Tributario,RUC Proveedor,Nombre Proveedor,Tipo de Documento Adquiriente,Numero de Documento Adquiriente,Nombre/Razon Social del
							Adquiriente,Fecha Pago,Monto Deposito,Tipo Bien,Tipo Operacion,Tipo de Comprobante,Serie de Comprobante,Numero de Comprobante,Numero de pago de Detracciones
							<br />
							D,00-741-171268,15-00005467,202401,20123456789,TRANSPORTES ABC S.A.C.,6,20987654321,IMPORTADORA XYZ S.A.C.,2025-01-15,1500.00,037,01,01,F001,000123,987654321
							<br />
							D,00-741-171269,15-00005468,202401,20123456789,TRANSPORTES ABC S.A.C.,6,20987654321,IMPORTADORA XYZ S.A.C.,2025-01-16,2300.50,037,01,01,F001,000124,987654322
						</div>
					</div>

					<div className="mb-4">
						<label className="block text-sm font-medium text-gray-700 mb-2">Seleccionar archivo CSV (Codificación Windows-1252)</label>
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
								setNombreArchivoCsv("");
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

			{/* Modal para eliminar por CSV */}
			{showDeleteModal && (
				<div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
					<div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md">
						<h3 className="text-xl font-bold mb-4">Eliminar Detracciones por CSV</h3>

						{csvOrigenes.length > 0 ? (
							<>
								<p className="text-sm text-gray-600 mb-4">Seleccione el archivo CSV del que desea eliminar todas las detracciones:</p>

								<div className="mb-4">
									<select
										value={selectedCsvOrigen}
										onChange={(e) => setSelectedCsvOrigen(e.target.value)}
										className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500">
										<option value="">Seleccione un archivo</option>
										{csvOrigenes.map((origen) => (
											<option key={origen} value={origen}>
												{origen}
											</option>
										))}
									</select>
								</div>

								<div className="flex justify-end">
									<button
										type="button"
										onClick={() => {
											setShowDeleteModal(false);
											setSelectedCsvOrigen("");
										}}
										className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md mr-2 hover:bg-gray-400">
										Cancelar
									</button>
									<button
										type="button"
										onClick={() => handleDeleteByCsv(selectedCsvOrigen)}
										disabled={!selectedCsvOrigen}
										className={`px-4 py-2 rounded-md ${selectedCsvOrigen ? "bg-red-600 text-white hover:bg-red-700" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}>
										Eliminar
									</button>
								</div>
							</>
						) : (
							<>
								<p className="text-sm text-gray-600 mb-4">No hay archivos CSV registrados en el sistema.</p>
								<div className="flex justify-end">
									<button type="button" onClick={() => setShowDeleteModal(false)} className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400">
										Cerrar
									</button>
								</div>
							</>
						)}
					</div>
				</div>
			)}

			<DataTable
				columns={columns}
				data={detracciones}
				title="Registro de Detracciones"
				defaultSort="fecha_deposito"
				isLoading={loading}
				filters={{
					year: false,
					month: false,
					searchFields: [
						{ accessor: "nombre_proveedor", label: "Proveedor" },
						{ accessor: "ruc_proveedor", label: "RUC" },
						{ accessor: "numero_constancia", label: "N° Constancia" },
						{ accessor: "periodo_tributario", label: "Periodo Tributario" },
						{ accessor: "tipo_bien", label: "Tipo Bien" },
						{ accessor: "tipo_comprobante", label: "Tipo Comprobante" },
						{ accessor: "serie_comprobante", label: "Serie" },
						{ accessor: "numero_comprobante", label: "Número" },
						{ accessor: "numero_pago_detracciones", label: "N° Pago" },
						{ accessor: "nombre_razon_social_adquiriente", label: "Razón Social Adq." },
						{ accessor: "origen_csv", label: "Archivo CSV" },
					],
				}}
			/>
		</div>
	);
}
