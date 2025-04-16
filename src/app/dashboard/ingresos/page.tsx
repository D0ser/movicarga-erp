"use client";

import { useState, useEffect } from "react";
import DataTable from "@/components/DataTable";
import { format } from "date-fns";
import type { Column } from "@/components/DataTable";
import { serieService, Serie, clienteService, Cliente, conductorService, Conductor, ingresoService, Ingreso as IngresoType, vehiculoService, Vehiculo } from "@/lib/supabaseServices";
import { EditButton, DeleteButton, ActionButtonGroup } from "@/components/ActionIcons";
import { createClient } from "@supabase/supabase-js";

// Inicialización del cliente Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

// Interfaz que es compatible con DataItem
interface Ingreso {
	[key: string]: string | number | boolean;
	id: number | string;
	fecha: string;
	serie: string;
	numeroFactura: string;
	montoFlete: number;
	primeraCuota: number;
	segundaCuota: number;
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

// Componente para mostrar el total de monto de flete
function TotalFleteCard({ ingresosFiltrados }: { ingresosFiltrados: Ingreso[] }) {
	const total = ingresosFiltrados.reduce((sum, ing) => sum + ing.montoFlete, 0);

	return (
		<div className="bg-blue-50 p-3 rounded-lg">
			<p className="text-sm text-blue-600 font-medium">Total Monto de Flete</p>
			<p className="text-2xl font-bold">S/. {total.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
		</div>
	);
}

// Componente para mostrar el total de detracción
function TotalDetraccionCard({ ingresosFiltrados }: { ingresosFiltrados: Ingreso[] }) {
	const total = ingresosFiltrados.reduce((sum, ing) => sum + ing.detraccion, 0);

	return (
		<div className="bg-green-50 p-3 rounded-lg">
			<p className="text-sm text-green-600 font-medium">Total Detracción</p>
			<p className="text-2xl font-bold">S/. {total.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
		</div>
	);
}

// Componente para mostrar el total del monto
function TotalMontoCard({ ingresosFiltrados }: { ingresosFiltrados: Ingreso[] }) {
	const total = ingresosFiltrados.reduce((sum, ing) => sum + ing.totalMonto, 0);

	return (
		<div className="bg-yellow-50 p-3 rounded-lg">
			<p className="text-sm text-yellow-600 font-medium">Total Monto</p>
			<p className="text-2xl font-bold">S/. {total.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
		</div>
	);
}

// Componente para mostrar el total a deber con formato condicional
function TotalDeberCard({ ingresosFiltrados }: { ingresosFiltrados: Ingreso[] }) {
	const totalDeber = ingresosFiltrados.reduce((sum, ing) => sum + ing.totalDeber, 0);
	const esNegativo = totalDeber < 0;
	const esPositivo = totalDeber > 0;

	// Determinar las clases CSS y el texto basados en el valor
	let bgColor = "bg-gray-50";
	let textColor = "text-gray-600";
	let valueTextColor = "";
	let textoDeber = "Total a Deber";

	if (esNegativo) {
		bgColor = "bg-red-50";
		textColor = "text-red-600";
		valueTextColor = "text-red-600";
		textoDeber = "Total a Deber (te deben)";
	} else if (esPositivo) {
		bgColor = "bg-green-50";
		textColor = "text-green-600";
		valueTextColor = "text-green-600";
		textoDeber = "Total a Deber (exceso)";
	} else {
		bgColor = "bg-purple-50";
		textColor = "text-purple-600";
	}

	return (
		<div className={`${bgColor} p-3 rounded-lg`}>
			<p className={`text-sm ${textColor} font-medium`}>{textoDeber}</p>
			<p className={`text-2xl font-bold ${valueTextColor}`}>S/. {Math.abs(totalDeber).toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
		</div>
	);
}

export default function IngresosPage() {
	// Estado para almacenar los ingresos
	const [ingresos, setIngresos] = useState<Ingreso[]>([]);
	const [loading, setLoading] = useState(true);
	const [showForm, setShowForm] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);

	const [formData, setFormData] = useState<Partial<Ingreso>>({
		fecha: new Date().toISOString().split("T")[0],
		serie: "",
		numeroFactura: "",
		montoFlete: 0,
		primeraCuota: 0,
		segundaCuota: 0,
		detraccion: 0,
		totalDeber: 0,
		totalMonto: 0,
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

	// Obtener las series disponibles
	const [seriesDisponibles, setSeriesDisponibles] = useState<Serie[]>([]);
	const [serieColors, setSerieColors] = useState<Record<string, string>>({});
	const [clientes, setClientes] = useState<Cliente[]>([]);
	const [conductores, setConductores] = useState<Conductor[]>([]);
	const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);

	// Estado para los ingresos filtrados
	const [ingresosFiltrados, setIngresosFiltrados] = useState<Ingreso[]>(ingresos);

	// Cargar datos al montar el componente
	useEffect(() => {
		const cargarDatos = async () => {
			try {
				setLoading(true);
				// Cargar clientes, conductores, vehículos y series
				const [clientesData, conductoresData, seriesData, vehiculosData] = await Promise.all([
					clienteService.getClientes(),
					conductorService.getConductores(),
					serieService.getSeries(),
					vehiculoService.getVehiculos(),
				]);

				setClientes(clientesData);
				setConductores(conductoresData);
				setSeriesDisponibles(seriesData);
				setVehiculos(vehiculosData);

				// Crear un mapa de colores para las series
				const coloresMap: Record<string, string> = {};
				seriesData.forEach((serie) => {
					coloresMap[serie.serie] = serie.color || "#3b82f6";
				});
				setSerieColors(coloresMap);

				// Cargar ingresos desde Supabase
				const ingresosFromSupabase = await cargarIngresos();
				setIngresos(ingresosFromSupabase);
				setIngresosFiltrados(ingresosFromSupabase);
			} catch (error) {
				console.error("Error al cargar datos:", error);
				setError("Error al cargar los datos. Por favor, intente de nuevo.");
			} finally {
				setLoading(false);
			}
		};

		cargarDatos();
	}, []);

	// Función para cargar ingresos desde Supabase
	const cargarIngresos = async () => {
		try {
			const ingresosSupabase = await ingresoService.getIngresos();
			console.log("Ingresos cargados desde Supabase:", ingresosSupabase);

			// Transformar los datos al formato esperado por la interfaz
			const ingresosFormateados = ingresosSupabase.map((ing) => {
				// Buscar el cliente relacionado para obtener la razón social y RUC
				const cliente = ing.cliente || { razon_social: "", ruc: "" };

				// Extraer correctamente la serie del número de factura
				const numeroFactura = ing.numero_factura || "";
				const serie = numeroFactura.includes("-") ? numeroFactura.split("-")[0] : "";

				// Calcular el total a deber correctamente
				const montoFlete = ing.monto || 0;
				const detraccion = ing.detraccion_monto || montoFlete * 0.04; // Usar detraccion_monto si existe, sino calcular 4%

				// Calcular el totalDeber como la diferencia entre lo que se debe y lo que se pagó
				const totalDeber = montoFlete + detraccion - (ing.total_monto || montoFlete);

				// Obtener la información del conductor
				// Preferir usar el nombre explícito, pero caer de vuelta al nombre basado en el ID
				const conductorNombre = ing.conductor_nombre || "";

				// Crear el objeto formateado
				const ingresoFormateado = {
					id: ing.id,
					fecha: ing.fecha,
					serie: serie,
					numeroFactura: ing.numero_factura || "",
					montoFlete: montoFlete,
					primeraCuota: ing.primera_cuota || montoFlete / 2, // Usar primera_cuota si existe
					segundaCuota: ing.segunda_cuota || montoFlete / 2, // Usar segunda_cuota si existe
					detraccion: detraccion,
					totalDeber: totalDeber,
					totalMonto: ing.total_monto || montoFlete, // Usar total_monto si existe
					empresa: cliente.razon_social || "",
					ruc: cliente.ruc || "",
					conductor: conductorNombre,
					placaTracto: ing.placa_tracto || "",
					placaCarreta: ing.placa_carreta || "",
					observacion: ing.observaciones || "",
					documentoGuiaRemit: ing.documento_guia_remit || "",
					guiaTransp: ing.guia_transp || "",
					diasCredito: ing.dias_credito || 0,
					fechaVencimiento: ing.fecha_vencimiento || ing.fecha,
					estado: ing.estado_factura || "Pendiente",
				};

				return ingresoFormateado;
			});

			console.log("Ingresos formateados para UI:", ingresosFormateados);
			return ingresosFormateados;
		} catch (error) {
			console.error("Error al cargar ingresos:", error);
			throw error;
		}
	};

	// Actualizar ingresosFiltrados cuando cambia ingresos, pero solo inicialmente
	useEffect(() => {
		// Solo actualizamos cuando los ingresos cambian, no cuando se filtran
		if (ingresosFiltrados.length === 0 || ingresos.length !== ingresosFiltrados.length || ingresos.some((ing) => !ingresosFiltrados.some((filtered) => filtered.id === ing.id))) {
			setIngresosFiltrados(ingresos);
		}
	}, [ingresos]);

	const handleError = (message: string) => {
		setError(message);
		setTimeout(() => setError(null), 5000);
	};

	const handleSuccess = (message: string) => {
		setSuccess(message);
		setTimeout(() => setSuccess(null), 5000);
	};

	// Columnas para la tabla de ingresos
	const columns: Column<Ingreso>[] = [
		{
			header: "Fecha",
			accessor: "fecha",
			cell: (value) => (
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
			header: "Serie",
			accessor: "serie",
			cell: (value, row) => {
				// Obtener el color de la serie desde serieColors
				const color = serieColors[value as string] || "#6b7280"; // Gris por defecto

				return (
					<div className="flex justify-center">
						<span className="font-mono px-2 py-1 rounded text-white text-xs font-bold" style={{ backgroundColor: color }}>
							{value as string}
						</span>
					</div>
				);
			},
		},
		{
			header: "N° Factura",
			accessor: "numeroFactura",
			cell: (value, row) => {
				// Extraer solo la parte del número sin la serie
				const numeroFactura = value as string;
				let numeroSinSerie = numeroFactura;

				if (numeroFactura && numeroFactura.includes("-") && row.serie) {
					numeroSinSerie = numeroFactura.split("-")[1];
				}

				return (
					<div className="flex justify-center">
						<span className="font-mono bg-purple-50 px-2 py-1 rounded text-purple-700 text-sm flex items-center">
							<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={1.5}
									d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
								/>
							</svg>
							{numeroSinSerie}
						</span>
					</div>
				);
			},
		},
		{
			header: "Empresa",
			accessor: "empresa",
			cell: (value, row) => {
				// Crear un avatar con la primera letra del nombre
				const inicial = (value as string).charAt(0).toUpperCase();

				return (
					<div className="flex items-center px-2 justify-center">
						<div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold mr-3">{inicial}</div>
						<div className="text-sm font-medium text-gray-900 truncate max-w-[150px]">{value as string}</div>
					</div>
				);
			},
		},
		{
			header: "RUC",
			accessor: "ruc",
			cell: (value) => (
				<div className="flex justify-center">
					<span className="font-mono bg-gray-50 px-2 py-1 rounded text-gray-700 flex items-center">
						<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={1.5}
								d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2"
							/>
						</svg>
						{value as string}
					</span>
				</div>
			),
		},
		{
			header: "Monto Flete",
			accessor: "montoFlete",
			cell: (value) => (
				<div className="flex justify-end">
					<span className="font-mono text-green-700 font-medium">S/. {(value as number).toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
				</div>
			),
		},
		{
			header: "Detracción",
			accessor: "detraccion",
			cell: (value) => (
				<div className="flex justify-end">
					<span className="font-mono text-gray-700">S/. {(value as number).toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
				</div>
			),
		},
		{
			header: "Total Monto",
			accessor: "totalMonto",
			cell: (value) => (
				<div className="flex justify-end">
					<span className="font-mono text-blue-700 font-semibold">S/. {(value as number).toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
				</div>
			),
		},
		{
			header: "Conductor",
			accessor: "conductor",
			cell: (value) => (
				<div className="flex justify-center">
					<span className="px-2 py-1 rounded-md text-xs font-medium bg-indigo-50 text-indigo-700 flex items-center">
						<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
						</svg>
						{value as string}
					</span>
				</div>
			),
		},
		{
			header: "Placa Tracto",
			accessor: "placaTracto",
			cell: (value) => (
				<div className="flex justify-center">
					<span className="font-mono bg-blue-50 px-3 py-1.5 rounded-lg text-blue-700 font-semibold flex items-center">
						<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={1.5}
								d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"
							/>
						</svg>
						{value as string}
					</span>
				</div>
			),
		},
		{
			header: "Placa Carreta",
			accessor: "placaCarreta",
			cell: (value) => (
				<div className="flex justify-center">
					<span className="font-mono bg-purple-50 px-3 py-1.5 rounded-lg text-purple-700 font-semibold flex items-center">
						<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 4H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-2m-4-1v8m0 0l-4-4m4 4l4-4" />
						</svg>
						{value as string}
					</span>
				</div>
			),
		},
		{
			header: "Observación",
			accessor: "observacion",
			cell: (value) => (
				<div className="flex justify-center">
					{(value as string) ? (
						<div className="max-w-xs truncate text-sm text-gray-600">
							<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline text-gray-400 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
							</svg>
							{value as string}
						</div>
					) : (
						<span className="text-gray-400">-</span>
					)}
				</div>
			),
		},
		{
			header: "Guía Remitente",
			accessor: "documentoGuiaRemit",
			cell: (value) => (
				<div className="flex justify-center">
					{(value as string) ? <span className="font-mono bg-yellow-50 px-2 py-1 rounded text-yellow-700 text-xs">{value as string}</span> : <span className="text-gray-400">-</span>}
				</div>
			),
		},
		{
			header: "Guía Transportista",
			accessor: "guiaTransp",
			cell: (value) => (
				<div className="flex justify-center">
					{(value as string) ? <span className="font-mono bg-orange-50 px-2 py-1 rounded text-orange-700 text-xs">{value as string}</span> : <span className="text-gray-400">-</span>}
				</div>
			),
		},
		{
			header: "Días Crédito",
			accessor: "diasCredito",
			cell: (value) => {
				const dias = value as number;
				const colorClass = dias === 0 ? "bg-green-100 text-green-800" : dias <= 15 ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800";

				return (
					<div className="flex justify-center">
						<span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
							{dias} {dias === 1 ? "día" : "días"}
						</span>
					</div>
				);
			},
		},
		{
			header: "Fecha Vencimiento",
			accessor: "fechaVencimiento",
			cell: (value) => {
				const fechaVencimiento = new Date(value as string);
				const fechaActual = new Date();

				// Calcular días restantes
				const diferenciaDias = Math.ceil((fechaVencimiento.getTime() - fechaActual.getTime()) / (1000 * 60 * 60 * 24));

				// Aplicar colores según el vencimiento
				let colorClass = "bg-green-100 text-green-800";
				let icon = (
					<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
					</svg>
				);

				if (diferenciaDias < 0) {
					// Vencido
					colorClass = "bg-red-100 text-red-800";
					icon = (
						<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
					);
				} else if (diferenciaDias <= 5) {
					// Por vencer pronto
					colorClass = "bg-yellow-100 text-yellow-800";
					icon = (
						<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
					);
				}

				return (
					<div className="flex justify-center">
						<span className={`px-2 py-1 rounded-md text-xs font-medium flex items-center ${colorClass}`}>
							{icon}
							{format(fechaVencimiento, "dd/MM/yyyy")}
						</span>
					</div>
				);
			},
		},
		{
			header: "Estado",
			accessor: "estado",
			cell: (value) => {
				const estado = value as string;
				const isPagado = estado === "Pagado";
				const isPendiente = estado === "Pendiente";

				let colorClass = "bg-gray-100 text-gray-800";
				let icon = null;

				if (isPagado) {
					colorClass = "bg-green-100 text-green-800";
					icon = (
						<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
						</svg>
					);
				} else if (isPendiente) {
					colorClass = "bg-yellow-100 text-yellow-800";
					icon = (
						<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
					);
				} else {
					colorClass = "bg-red-100 text-red-800";
					icon = (
						<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
						</svg>
					);
				}

				return (
					<div className="flex justify-center">
						<span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center ${colorClass}`}>
							{icon}
							{estado}
						</span>
					</div>
				);
			},
		},
		{
			header: "Acciones",
			accessor: "id",
			cell: (value, row) => (
				<ActionButtonGroup>
					<EditButton onClick={() => handleEdit(row as Ingreso)} />
					<DeleteButton onClick={() => handleDelete(value as number | string)} />
				</ActionButtonGroup>
			),
		},
	];

	// Funciones para manejo de formulario
	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		const { name, value } = e.target;

		// Actualizar el valor del campo
		setFormData((prev) => {
			const newData = {
				...prev,
				[name]:
					name === "montoFlete" || name === "detraccion" || name === "diasCredito" || name === "totalMonto" || name === "primeraCuota" || name === "segundaCuota" ? parseFloat(value) || 0 : value,
			};

			// Si se actualiza primeraCuota o segundaCuota, recalcular montoFlete
			if (name === "primeraCuota" || name === "segundaCuota") {
				const primeraCuota = name === "primeraCuota" ? parseFloat(value) || 0 : prev.primeraCuota || 0;
				const segundaCuota = name === "segundaCuota" ? parseFloat(value) || 0 : prev.segundaCuota || 0;
				newData.montoFlete = primeraCuota + segundaCuota;
			}

			// Calcular totales automáticamente
			if (name === "montoFlete" || name === "detraccion" || name === "totalMonto" || name === "primeraCuota" || name === "segundaCuota") {
				const montoFlete = newData.montoFlete || 0;
				const detraccion = newData.detraccion || 0;
				const totalMonto = newData.totalMonto || 0;

				const diferencia = -totalMonto + montoFlete + detraccion;
				newData.totalDeber = Math.abs(diferencia) < 0.0000001 ? 0 : diferencia;
			}

			// Calcular fecha de vencimiento
			if (name === "fecha" || name === "diasCredito") {
				const fecha = name === "fecha" ? new Date(value) : new Date(prev.fecha || "");
				const diasCredito = name === "diasCredito" ? parseInt(value) || 0 : prev.diasCredito || 0;

				if (fecha && !isNaN(fecha.getTime())) {
					const fechaVencimiento = new Date(fecha);
					fechaVencimiento.setDate(fecha.getDate() + diasCredito);
					newData.fechaVencimiento = fechaVencimiento.toISOString().split("T")[0];
				}
			}

			return newData;
		});
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		// Validate required fields
		if (!formData.serie || !formData.numeroFactura || !formData.empresa || !formData.ruc) {
			handleError("Por favor complete todos los campos requeridos");
			return;
		}

		try {
			setLoading(true);

			// Recalcular el totalDeber para asegurar consistencia con la fórmula
			const montoFlete = formData.montoFlete || 0;
			const detraccion = formData.detraccion || 0;
			const totalMonto = formData.totalMonto || 0;
			const primeraCuota = formData.primeraCuota || 0;
			const segundaCuota = formData.segundaCuota || 0;

			const diferencia = -totalMonto + montoFlete + detraccion;
			const totalDeberFinal = Math.abs(diferencia) < 0.0000001 ? 0 : diferencia;

			// Buscar cliente_id basado en RUC
			const cliente = clientes.find((c) => c.ruc === formData.ruc);

			// Buscar conductor_id basado en el nombre completo
			const conductorNombreCompleto = formData.conductor || "";
			const conductor = conductores.find((c) => `${c.nombres} ${c.apellidos}` === conductorNombreCompleto);

			// Log para depuración
			console.log("Conductor seleccionado:", conductorNombreCompleto);
			console.log("ID del conductor encontrado:", conductor?.id);

			// Asegurarse de que el número de factura no incluya ya la serie
			// y luego formatear correctamente como serie-numero
			let numeroFacturaLimpio = formData.numeroFactura.trim();
			// Si el número ya comienza con la serie (ej: "F001-"), quitársela
			if (numeroFacturaLimpio.startsWith(`${formData.serie}-`)) {
				numeroFacturaLimpio = numeroFacturaLimpio.substring(formData.serie.length + 1);
			}
			// Crear el formato correcto serie-numero
			const numeroFacturaCompleto = `${formData.serie}-${numeroFacturaLimpio}`;

			// Datos para Supabase - añadir todos los campos relacionados con montos
			const ingresoData: Partial<IngresoType> = {
				fecha: formData.fecha || new Date().toISOString().split("T")[0],
				cliente_id: cliente?.id,
				concepto: formData.observacion || "Ingreso por flete",
				monto: montoFlete, // Guardamos el monto de flete
				total_monto: totalMonto, // Guardamos el total monto
				metodo_pago: "Transferencia",
				numero_factura: numeroFacturaCompleto,
				fecha_factura: formData.fecha || new Date().toISOString().split("T")[0],
				estado_factura: formData.estado || "Pendiente",
				observaciones: formData.observacion,
				placa_tracto: formData.placaTracto,
				placa_carreta: formData.placaCarreta,
				documento_guia_remit: formData.documentoGuiaRemit,
				guia_transp: formData.guiaTransp,
				dias_credito: formData.diasCredito,
				fecha_vencimiento: formData.fechaVencimiento,
				total_deber: totalDeberFinal, // Guardamos el total a deber
				detraccion_monto: detraccion, // Guardamos la detracción
				primera_cuota: primeraCuota, // Guardamos primera cuota
				segunda_cuota: segundaCuota, // Guardamos segunda cuota
			};

			// Solo agregar conductor_id y conductor_nombre si hay un conductor seleccionado
			if (conductor?.id) {
				ingresoData.conductor_id = conductor.id;
				ingresoData.conductor_nombre = conductorNombreCompleto;
			} else if (conductorNombreCompleto) {
				// Si tenemos un nombre pero no ID, solo guardar el nombre
				ingresoData.conductor_nombre = conductorNombreCompleto;
			}

			// Log para depuración
			console.log("Datos que se enviarán a Supabase:", ingresoData);

			if (formData.id && typeof formData.id === "string") {
				// Actualizar ingreso existente
				await ingresoService.updateIngreso(formData.id, ingresoData);
				handleSuccess("Ingreso actualizado correctamente");
			} else {
				// Agregar nuevo ingreso
				await ingresoService.createIngreso(ingresoData as Omit<IngresoType, "id" | "cliente" | "viaje">);
				handleSuccess("Nuevo ingreso registrado correctamente");
			}

			// Recargar los ingresos
			const ingresosActualizados = await cargarIngresos();
			setIngresos(ingresosActualizados);

			// Limpiar formulario
			setFormData({
				fecha: new Date().toISOString().split("T")[0],
				serie: "",
				numeroFactura: "",
				montoFlete: 0,
				primeraCuota: 0,
				segundaCuota: 0,
				detraccion: 0,
				totalDeber: 0,
				totalMonto: 0,
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
		} catch (error) {
			console.error("Error al guardar ingreso:", error);
			handleError(`Error al guardar el ingreso: ${error instanceof Error ? error.message : "Error desconocido"}`);
		} finally {
			setLoading(false);
		}
	};

	const handleDelete = async (id: number | string) => {
		if (confirm("¿Está seguro de que desea eliminar este ingreso?")) {
			try {
				setLoading(true);

				if (typeof id === "string") {
					await ingresoService.deleteIngreso(id);

					// Actualizar la lista de ingresos
					const ingresosActualizados = await cargarIngresos();
					setIngresos(ingresosActualizados);

					handleSuccess("Ingreso eliminado correctamente");
				}
			} catch (error) {
				console.error("Error al eliminar ingreso:", error);
				handleError("Error al eliminar el ingreso. Por favor, inténtalo de nuevo.");
			} finally {
				setLoading(false);
			}
		}
	};

	const handleEdit = (ingreso: Ingreso) => {
		// Recalcular el totalDeber para asegurar consistencia con la fórmula
		const diferencia = -ingreso.totalMonto + ingreso.montoFlete + ingreso.detraccion;
		const totalDeberFinal = Math.abs(diferencia) < 0.0000001 ? 0 : diferencia;

		// Extraer solo el número sin la serie del número de factura
		let numeroFacturaSinSerie = ingreso.numeroFactura;
		if (ingreso.numeroFactura.includes("-") && ingreso.serie) {
			numeroFacturaSinSerie = ingreso.numeroFactura.split("-")[1];
		}

		setFormData({
			...ingreso,
			numeroFactura: numeroFacturaSinSerie,
			totalDeber: totalDeberFinal,
		});
		setShowForm(true);
	};

	// Función para manejar cuando cambian los filtros
	const handleDataFiltered = (filteredData: Ingreso[]) => {
		// Evitar actualizaciones innecesarias si los datos son los mismos
		if (JSON.stringify(filteredData) !== JSON.stringify(ingresosFiltrados)) {
			setIngresosFiltrados(filteredData);
		}
	};

	return (
		<div className="space-y-6">
			<div className="flex justify-between items-center">
				<h1 className="text-2xl font-bold">Gestión de Ingresos</h1>
				<button
					onClick={() => {
						// Resetear el formulario para un nuevo ingreso
						if (!showForm) {
							setFormData({
								fecha: new Date().toISOString().split("T")[0],
								serie: "",
								numeroFactura: "",
								montoFlete: 0,
								primeraCuota: 0,
								segundaCuota: 0,
								detraccion: 0,
								totalDeber: 0,
								totalMonto: 0,
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
						}
						setShowForm(!showForm);
					}}
					className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
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
							<select
								name="serie"
								value={formData.serie}
								onChange={handleInputChange}
								className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
								required>
								<option value="">Seleccione una serie</option>
								{seriesDisponibles.map((serie) => (
									<option key={serie.id} value={serie.serie}>
										{serie.serie}
									</option>
								))}
							</select>
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
							<label className="block text-sm font-medium text-gray-700">1era Cuota</label>
							<input
								type="number"
								step="0.01"
								name="primeraCuota"
								value={formData.primeraCuota}
								onChange={handleInputChange}
								className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700">2da Cuota</label>
							<input
								type="number"
								step="0.01"
								name="segundaCuota"
								value={formData.segundaCuota}
								onChange={handleInputChange}
								className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700">Monto de Flete</label>
							<input type="number" step="0.01" name="montoFlete" value={formData.montoFlete} className="mt-1 block w-full border border-gray-300 rounded-md bg-gray-100 shadow-sm py-2 px-3" readOnly />
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
							<input
								type="number"
								step="0.01"
								name="totalDeber"
								value={formData.totalDeber}
								className={`mt-1 block w-full border border-gray-300 rounded-md bg-gray-100 shadow-sm py-2 px-3 ${
									formData.totalDeber && formData.totalDeber < 0 ? "text-red-600" : formData.totalDeber && formData.totalDeber > 0 ? "text-green-600" : ""
								}`}
								readOnly
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700">Total Monto</label>
							<input
								type="number"
								step="0.01"
								name="totalMonto"
								value={formData.totalMonto}
								onChange={handleInputChange}
								className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700">Empresa</label>
							<select
								name="empresa"
								value={formData.empresa}
								onChange={(e) => {
									const clienteSeleccionado = clientes.find((c) => c.razon_social === e.target.value);
									setFormData((prev) => ({
										...prev,
										empresa: e.target.value,
										ruc: clienteSeleccionado?.ruc || "",
										diasCredito: clienteSeleccionado?.dias_credito || 0,
									}));
								}}
								className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
								required>
								<option value="">Seleccione una empresa</option>
								{clientes.map((cliente) => (
									<option key={cliente.id} value={cliente.razon_social}>
										{cliente.razon_social}
									</option>
								))}
							</select>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700">RUC</label>
							<input
								type="text"
								name="ruc"
								value={formData.ruc}
								className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
								readOnly
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700">Conductor</label>
							<select
								name="conductor"
								value={formData.conductor}
								onChange={(e) => {
									const conductorSeleccionado = conductores.find((c) => `${c.nombres} ${c.apellidos}` === e.target.value);
									// Solo asignar la placa del tracto si no hay una seleccionada o si está vacía
									const placaTractoActual = formData.placaTracto || "";
									const placaTractoSugerida = conductorSeleccionado?.vehiculo?.placa || "";

									setFormData((prev) => ({
										...prev,
										conductor: e.target.value,
										// Solo usar la placa del vehículo del conductor si no hay una placa ya seleccionada
										placaTracto: placaTractoActual === "" ? placaTractoSugerida : placaTractoActual,
									}));
								}}
								className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
								required>
								<option value="">Seleccione un conductor</option>
								{conductores.map((conductor) => (
									<option key={conductor.id} value={`${conductor.nombres} ${conductor.apellidos}`}>
										{conductor.nombres} {conductor.apellidos}
									</option>
								))}
							</select>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700">Placa Tracto</label>
							<select
								name="placaTracto"
								value={formData.placaTracto}
								onChange={handleInputChange}
								className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500">
								<option value="">Seleccione una placa de tracto</option>
								{vehiculos
									.filter((v) => v.tipo_vehiculo === "Tracto")
									.map((vehiculo) => (
										<option key={vehiculo.id} value={vehiculo.placa}>
											{vehiculo.placa}
										</option>
									))}
							</select>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700">Placa Carreta</label>
							<select
								name="placaCarreta"
								value={formData.placaCarreta}
								onChange={handleInputChange}
								className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500">
								<option value="">Seleccione una placa de carreta</option>
								{vehiculos
									.filter((v) => v.tipo_vehiculo === "Carreta")
									.map((vehiculo) => (
										<option key={vehiculo.id} value={vehiculo.placa}>
											{vehiculo.placa}
										</option>
									))}
							</select>
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
					searchFields: [
						{ accessor: "empresa", label: "Empresa" },
						{ accessor: "ruc", label: "RUC" },
						{ accessor: "numeroFactura", label: "N° Factura" },
						{ accessor: "conductor", label: "Conductor" },
						{ accessor: "placaTracto", label: "Placa Tracto" },
						{ accessor: "placaCarreta", label: "Placa Carreta" },
						{ accessor: "observacion", label: "Observación" },
						{ accessor: "documentoGuiaRemit", label: "Guía Remitente" },
						{ accessor: "guiaTransp", label: "Guía Transportista" },
					],
				}}
				onDataFiltered={handleDataFiltered}
			/>

			{/* Sección de totales */}
			<div className="bg-white p-4 rounded-lg shadow mt-4">
				<h3 className="text-lg font-semibold mb-3">
					Resumen de Totales
					{ingresosFiltrados.length !== ingresos.length && (
						<span className="ml-2 text-sm font-normal bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
							{ingresosFiltrados.length} registros filtrados de {ingresos.length}
						</span>
					)}
				</h3>
				<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
					<TotalFleteCard ingresosFiltrados={ingresosFiltrados} />
					<TotalDetraccionCard ingresosFiltrados={ingresosFiltrados} />
					<TotalDeberCard ingresosFiltrados={ingresosFiltrados} />
					<TotalMontoCard ingresosFiltrados={ingresosFiltrados} />
				</div>
			</div>
		</div>
	);
}
