"use client";

import { useState, useMemo } from "react";
import { format, subMonths, parseISO, isWithinInterval } from "date-fns";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement } from "chart.js";
import { Bar, Pie } from "react-chartjs-2";
import DataTable, { DataItem, Column as DataTableColumn } from "@/components/DataTable";

// Registrar componentes de ChartJS
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement);

// Definición de interfaces para los tipos de datos
interface Ingreso extends DataItem {
	id: number;
	fecha: string;
	montoFlete: number;
	detraccion: number;
	totalDeber: number;
	empresa: string;
	estado: string;
}

interface Egreso extends DataItem {
	id: number;
	fecha: string;
	tipoEgreso: string;
	monto: number;
}

interface Viaje extends DataItem {
	id: number;
	codigoViaje: string;
	cliente: string;
	fechaSalida: string;
	precioFlete: number;
	estado: string;
	gastos: number;
	rentabilidad?: number;
	porcentajeRentabilidad?: string;
}

interface Detraccion extends DataItem {
	id: number;
	fecha: string;
	importe: number;
	estado: string;
}

interface FlujoCaja extends DataItem {
	id: string;
	fecha: string;
	concepto: string;
	tipo: string;
	monto: number;
}

export default function ReportesFinancierosPage() {
	// Estados para filtros de fechas
	const [periodoSeleccionado, setPeriodoSeleccionado] = useState("ultimo-mes");
	const [fechaInicio, setFechaInicio] = useState(format(subMonths(new Date(), 1), "yyyy-MM-dd"));
	const [fechaFin, setFechaFin] = useState(format(new Date(), "yyyy-MM-dd"));
	const [tipoReporte, setTipoReporte] = useState("balance");

	// Datos de ejemplo (en una aplicación real, estos vendrían de Supabase)
	const ingresos = useMemo<Ingreso[]>(
		() => [
			{ id: 1, fecha: "2025-03-15", montoFlete: 2500, detraccion: 100, totalDeber: 2400, empresa: "Transportes S.A.", estado: "Pagado" },
			{ id: 2, fecha: "2025-03-20", montoFlete: 3200, detraccion: 128, totalDeber: 3072, empresa: "Industrias XYZ", estado: "Pagado" },
			{ id: 3, fecha: "2025-04-05", montoFlete: 1800, detraccion: 72, totalDeber: 1728, empresa: "Comercial ABC", estado: "Pagado" },
			{ id: 4, fecha: "2025-04-10", montoFlete: 2800, detraccion: 112, totalDeber: 2688, empresa: "Distribuidora XYZ", estado: "Pendiente" },
			{ id: 5, fecha: "2025-04-12", montoFlete: 3500, detraccion: 140, totalDeber: 3360, empresa: "Logística ABC", estado: "Pendiente" },
		],
		[]
	);

	const egresos = useMemo<Egreso[]>(
		() => [
			{ id: 1, fecha: "2025-03-10", tipoEgreso: "Combustible", monto: 1200 },
			{ id: 2, fecha: "2025-03-15", tipoEgreso: "Mantenimiento", monto: 850 },
			{ id: 3, fecha: "2025-03-20", tipoEgreso: "Seguros", monto: 3500 },
			{ id: 4, fecha: "2025-04-05", tipoEgreso: "Combustible", monto: 1350 },
			{ id: 5, fecha: "2025-04-10", tipoEgreso: "Peajes", monto: 500 },
			{ id: 6, fecha: "2025-04-12", tipoEgreso: "Viáticos", monto: 650 },
		],
		[]
	);

	const viajes = useMemo<Viaje[]>(
		() => [
			{ id: 1, codigoViaje: "V-2025-001", cliente: "Transportes S.A.", fechaSalida: "2025-03-15", precioFlete: 2500, estado: "Completado", gastos: 1800 },
			{ id: 2, codigoViaje: "V-2025-002", cliente: "Agrícola San Isidro", fechaSalida: "2025-04-10", precioFlete: 2800, estado: "En ruta", gastos: 1700 },
			{ id: 3, codigoViaje: "V-2025-003", cliente: "Constructora Nivel", fechaSalida: "2025-04-15", precioFlete: 2200, estado: "Programado", gastos: 1500 },
		],
		[]
	);

	const detracciones = useMemo<Detraccion[]>(
		() => [
			{ id: 1, fecha: "2025-03-05", importe: 250.5, estado: "Pagado" },
			{ id: 2, fecha: "2025-03-12", importe: 320.0, estado: "Pagado" },
			{ id: 3, fecha: "2025-03-18", importe: 180.75, estado: "Pagado" },
			{ id: 4, fecha: "2025-04-07", importe: 280.5, estado: "Pendiente" },
			{ id: 5, fecha: "2025-04-14", importe: 310.25, estado: "Pendiente" },
		],
		[]
	);

	// Filtrar datos por rango de fechas
	const filtrarPorFecha = useMemo(() => {
		return <T extends DataItem>(datos: T[]): T[] => {
			const inicio = parseISO(fechaInicio);
			const fin = parseISO(fechaFin);
			return datos.filter((item) => {
				let fechaItem: Date;
				if ("fechaSalida" in item && typeof item.fechaSalida === "string") {
					fechaItem = parseISO(item.fechaSalida);
				} else if ("fecha" in item) {
					const fecha = item.fecha;
					if (typeof fecha === "string") {
						fechaItem = parseISO(fecha);
					} else if (fecha instanceof Date) {
						fechaItem = fecha;
					} else {
						return false;
					}
				} else {
					return false;
				}
				return isWithinInterval(fechaItem, { start: inicio, end: fin });
			});
		};
	}, [fechaInicio, fechaFin]);

	// Actualizar rango de fechas basado en el periodo seleccionado
	const actualizarRangoFechas = (periodo: string) => {
		const fechaActual = new Date();
		let nuevaFechaInicio: Date;

		switch (periodo) {
			case "ultimo-mes":
				nuevaFechaInicio = subMonths(fechaActual, 1);
				break;
			case "ultimos-3-meses":
				nuevaFechaInicio = subMonths(fechaActual, 3);
				break;
			case "ultimos-6-meses":
				nuevaFechaInicio = subMonths(fechaActual, 6);
				break;
			case "ultimo-año":
				nuevaFechaInicio = subMonths(fechaActual, 12);
				break;
			default:
				nuevaFechaInicio = subMonths(fechaActual, 1);
		}

		setFechaInicio(format(nuevaFechaInicio, "yyyy-MM-dd"));
		setFechaFin(format(fechaActual, "yyyy-MM-dd"));
		setPeriodoSeleccionado(periodo);
	};

	// Datos filtrados
	const ingresosFiltrados = useMemo(() => filtrarPorFecha(ingresos), [ingresos, filtrarPorFecha]);
	const egresosFiltrados = useMemo(() => filtrarPorFecha(egresos), [egresos, filtrarPorFecha]);
	const viajesFiltrados = useMemo(() => filtrarPorFecha(viajes), [viajes, filtrarPorFecha]);
	const detraccionesFiltradas = useMemo(() => filtrarPorFecha(detracciones), [detracciones, filtrarPorFecha]);

	// Totales
	const totalIngresos = useMemo(() => ingresosFiltrados.reduce((sum, ing) => sum + ing.montoFlete, 0), [ingresosFiltrados]);
	const totalEgresos = useMemo(() => egresosFiltrados.reduce((sum, eg) => sum + eg.monto, 0), [egresosFiltrados]);
	const balance = totalIngresos - totalEgresos;

	// Agrupar egresos por tipo
	const egresosPorTipo = useMemo(() => {
		return egresosFiltrados.reduce((acc, egreso) => {
			if (!acc[egreso.tipoEgreso]) {
				acc[egreso.tipoEgreso] = 0;
			}
			acc[egreso.tipoEgreso] += egreso.monto;
			return acc;
		}, {} as Record<string, number>);
	}, [egresosFiltrados]);

	// Rentabilidad por viaje
	const rentabilidadViajes = useMemo<Viaje[]>(() => {
		return viajesFiltrados.map((viaje) => {
			const precioFlete = viaje.precioFlete || 0;
			const gastos = viaje.gastos || 0;
			const rentabilidad = gastos ? precioFlete - gastos : precioFlete * 0.7; // Estimado si no hay gastos
			const porcentaje = gastos ? (rentabilidad / precioFlete) * 100 : 30;
			return {
				...viaje,
				rentabilidad,
				porcentajeRentabilidad: porcentaje.toFixed(2) + "%",
			};
		});
	}, [viajesFiltrados]);

	// Datos para gráficos
	const datosBalanceGeneral = {
		labels: ["Ingresos", "Egresos", "Balance"],
		datasets: [
			{
				label: "Monto (S/.)",
				data: [totalIngresos, totalEgresos, balance],
				backgroundColor: ["rgba(34, 197, 94, 0.6)", "rgba(239, 68, 68, 0.6)", balance >= 0 ? "rgba(59, 130, 246, 0.6)" : "rgba(249, 115, 22, 0.6)"],
				borderColor: ["rgb(34, 197, 94)", "rgb(239, 68, 68)", balance >= 0 ? "rgb(59, 130, 246)" : "rgb(249, 115, 22)"],
				borderWidth: 1,
			},
		],
	};

	const datosEgresosPorTipo = {
		labels: Object.keys(egresosPorTipo),
		datasets: [
			{
				label: "Monto (S/.)",
				data: Object.values(egresosPorTipo),
				backgroundColor: ["rgba(239, 68, 68, 0.6)", "rgba(249, 115, 22, 0.6)", "rgba(234, 179, 8, 0.6)", "rgba(34, 197, 94, 0.6)", "rgba(59, 130, 246, 0.6)", "rgba(168, 85, 247, 0.6)"],
				borderColor: ["rgb(239, 68, 68)", "rgb(249, 115, 22)", "rgb(234, 179, 8)", "rgb(34, 197, 94)", "rgb(59, 130, 246)", "rgb(168, 85, 247)"],
				borderWidth: 1,
			},
		],
	};

	// Columnas para tablas
	const columnasRentabilidad: DataTableColumn<Viaje>[] = [
		{
			header: "Código Viaje",
			accessor: "codigoViaje",
		},
		{
			header: "Cliente",
			accessor: "cliente",
		},
		{
			header: "Fecha",
			accessor: "fechaSalida",
			cell: (value) => format(new Date(value as string), "dd/MM/yyyy"),
		},
		{
			header: "Flete (S/.)",
			accessor: "precioFlete",
			cell: (value) => `S/. ${(value as number).toLocaleString("es-PE")}`,
		},
		{
			header: "Gastos (S/.)",
			accessor: "gastos",
			cell: (value) => `S/. ${(value as number).toLocaleString("es-PE")}`,
		},
		{
			header: "Rentabilidad (S/.)",
			accessor: "rentabilidad",
			cell: (value) => `S/. ${(value as number).toLocaleString("es-PE")}`,
		},
		{
			header: "%",
			accessor: "porcentajeRentabilidad",
		},
	];

	const columnasDetracciones: DataTableColumn<Detraccion>[] = [
		{
			header: "Fecha",
			accessor: "fecha",
			cell: (value) => format(new Date(value as string), "dd/MM/yyyy"),
		},
		{
			header: "Importe (S/.)",
			accessor: "importe",
			cell: (value) => `S/. ${(value as number).toLocaleString("es-PE")}`,
		},
		{
			header: "Estado",
			accessor: "estado",
			cell: (value) => (
				<span className={`px-2 py-1 rounded-full text-xs font-medium ${(value as string) === "Pagado" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>{value as string}</span>
			),
		},
	];

	const columnasFlujoCaja: DataTableColumn<FlujoCaja>[] = [
		{
			header: "Fecha",
			accessor: "fecha",
			cell: (value) => format(new Date(value as string), "dd/MM/yyyy"),
		},
		{
			header: "Concepto",
			accessor: "concepto",
		},
		{
			header: "Tipo",
			accessor: "tipo",
			cell: (value) => (
				<span className={`px-2 py-1 rounded-full text-xs font-medium ${(value as string) === "Ingreso" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>{value as string}</span>
			),
		},
		{
			header: "Monto (S/.)",
			accessor: "monto",
			cell: (value) => `S/. ${(value as number).toLocaleString("es-PE")}`,
		},
	];

	// Datos para el flujo de caja combinando ingresos y egresos
	const datosFlujoCaja = useMemo<FlujoCaja[]>(() => {
		const ingresosMapeados: FlujoCaja[] = ingresosFiltrados.map((ing) => ({
			id: `ing-${ing.id}`,
			fecha: ing.fecha,
			concepto: `Ingreso - ${ing.empresa}`,
			tipo: "Ingreso",
			monto: ing.montoFlete,
		}));

		const egresosMapeados: FlujoCaja[] = egresosFiltrados.map((eg) => ({
			id: `eg-${eg.id}`,
			fecha: eg.fecha,
			concepto: `Egreso - ${eg.tipoEgreso}`,
			tipo: "Egreso",
			monto: eg.monto,
		}));

		return [...ingresosMapeados, ...egresosMapeados].sort((a, b) => {
			return new Date(a.fecha).getTime() - new Date(b.fecha).getTime();
		});
	}, [ingresosFiltrados, egresosFiltrados]);

	// Renderizar reporte específico basado en el tipo seleccionado
	const renderReporteSeleccionado = () => {
		switch (tipoReporte) {
			case "balance":
				return (
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
						<div className="bg-white p-6 rounded-lg shadow-md">
							<h3 className="text-lg font-semibold mb-4">Balance General</h3>
							<Bar
								data={datosBalanceGeneral}
								options={{
									responsive: true,
									plugins: {
										legend: {
											position: "top",
										},
										title: {
											display: true,
											text: "Ingresos vs Egresos",
										},
									},
								}}
							/>
						</div>

						<div className="bg-white p-6 rounded-lg shadow-md">
							<h3 className="text-lg font-semibold mb-4">Distribución de Egresos</h3>
							<Pie
								data={datosEgresosPorTipo}
								options={{
									responsive: true,
									plugins: {
										legend: {
											position: "top",
										},
										title: {
											display: true,
											text: "Egresos por Categoría",
										},
									},
								}}
							/>
						</div>

						<div className="bg-white p-6 rounded-lg shadow-md col-span-2">
							<h3 className="text-lg font-semibold mb-2">Resumen Financiero</h3>
							<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
								<div className="bg-green-50 p-4 rounded-lg border border-green-200">
									<span className="text-sm text-green-600 font-medium">Total Ingresos</span>
									<p className="text-2xl font-bold text-green-700">S/. {totalIngresos.toLocaleString("es-PE")}</p>
								</div>
								<div className="bg-red-50 p-4 rounded-lg border border-red-200">
									<span className="text-sm text-red-600 font-medium">Total Egresos</span>
									<p className="text-2xl font-bold text-red-700">S/. {totalEgresos.toLocaleString("es-PE")}</p>
								</div>
								<div className={`${balance >= 0 ? "bg-blue-50 border-blue-200" : "bg-orange-50 border-orange-200"} p-4 rounded-lg border`}>
									<span className={`text-sm font-medium ${balance >= 0 ? "text-blue-600" : "text-orange-600"}`}>Balance</span>
									<p className={`text-2xl font-bold ${balance >= 0 ? "text-blue-700" : "text-orange-700"}`}>S/. {balance.toLocaleString("es-PE")}</p>
								</div>
							</div>
						</div>
					</div>
				);
			case "rentabilidad":
				return (
					<div className="space-y-6">
						<div className="bg-white p-6 rounded-lg shadow-md">
							<h3 className="text-lg font-semibold mb-4">Rentabilidad por Viaje</h3>
							<DataTable
								columns={columnasRentabilidad}
								data={rentabilidadViajes}
								title="Análisis de Rentabilidad"
								filters={{
									searchField: "cliente",
								}}
							/>
						</div>
					</div>
				);
			case "detracciones":
				return (
					<div className="space-y-6">
						<div className="bg-white p-6 rounded-lg shadow-md">
							<h3 className="text-lg font-semibold mb-4">Reporte de Detracciones</h3>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
								<div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
									<span className="text-sm text-blue-600 font-medium">Detracciones Generadas</span>
									<p className="text-2xl font-bold text-blue-700">S/. {detraccionesFiltradas.reduce((sum, det) => sum + det.importe, 0).toLocaleString("es-PE")}</p>
								</div>
								<div className="bg-green-50 p-4 rounded-lg border border-green-200">
									<span className="text-sm text-green-600 font-medium">Detracciones Pagadas</span>
									<p className="text-2xl font-bold text-green-700">
										S/.{" "}
										{detraccionesFiltradas
											.filter((det) => det.estado === "Pagado")
											.reduce((sum, det) => sum + det.importe, 0)
											.toLocaleString("es-PE")}
									</p>
								</div>
							</div>
							<DataTable
								columns={columnasDetracciones}
								data={detraccionesFiltradas}
								title="Detalle de Detracciones"
								filters={{
									searchField: "estado",
								}}
							/>
						</div>
					</div>
				);
			case "flujo-caja":
				return (
					<div className="space-y-6">
						<div className="bg-white p-6 rounded-lg shadow-md">
							<h3 className="text-lg font-semibold mb-4">Flujo de Caja</h3>
							<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
								<div className="bg-green-50 p-4 rounded-lg border border-green-200">
									<span className="text-sm text-green-600 font-medium">Ingresos</span>
									<p className="text-2xl font-bold text-green-700">
										S/.{" "}
										{datosFlujoCaja
											.filter((item) => item.tipo === "Ingreso")
											.reduce((sum, item) => sum + item.monto, 0)
											.toLocaleString("es-PE")}
									</p>
								</div>
								<div className="bg-red-50 p-4 rounded-lg border border-red-200">
									<span className="text-sm text-red-600 font-medium">Salidas</span>
									<p className="text-2xl font-bold text-red-700">
										S/.{" "}
										{datosFlujoCaja
											.filter((item) => item.tipo === "Egreso")
											.reduce((sum, item) => sum + item.monto, 0)
											.toLocaleString("es-PE")}
									</p>
								</div>
								<div className={`${balance >= 0 ? "bg-blue-50 border-blue-200" : "bg-orange-50 border-orange-200"} p-4 rounded-lg border`}>
									<span className={`text-sm font-medium ${balance >= 0 ? "text-blue-600" : "text-orange-600"}`}>Saldo</span>
									<p className={`text-2xl font-bold ${balance >= 0 ? "text-blue-700" : "text-orange-700"}`}>S/. {balance.toLocaleString("es-PE")}</p>
								</div>
							</div>
							<DataTable
								columns={columnasFlujoCaja}
								data={datosFlujoCaja}
								title="Movimientos de Caja"
								filters={{
									searchField: "concepto",
								}}
							/>
						</div>
					</div>
				);
			default:
				return <div>Seleccione un tipo de reporte</div>;
		}
	};

	return (
		<div className="space-y-6">
			<h1 className="text-2xl font-bold">Reportes Financieros</h1>

			<div className="bg-white p-6 rounded-lg shadow-md">
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
					{/* Selector de tipo de reporte */}
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Reporte</label>
						<select
							value={tipoReporte}
							onChange={(e) => setTipoReporte(e.target.value)}
							className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500">
							<option value="balance">Balance de Ingresos y Egresos</option>
							<option value="rentabilidad">Rentabilidad por Viaje</option>
							<option value="detracciones">Reporte de Detracciones</option>
							<option value="flujo-caja">Análisis de Flujo de Caja</option>
						</select>
					</div>

					{/* Selector de periodo */}
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">Periodo</label>
						<select
							value={periodoSeleccionado}
							onChange={(e) => actualizarRangoFechas(e.target.value)}
							className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500">
							<option value="ultimo-mes">Último mes</option>
							<option value="ultimos-3-meses">Últimos 3 meses</option>
							<option value="ultimos-6-meses">Últimos 6 meses</option>
							<option value="ultimo-año">Último año</option>
							<option value="personalizado">Personalizado</option>
						</select>
					</div>

					{/* Fecha Inicio */}
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">Fecha Inicio</label>
						<input
							type="date"
							value={fechaInicio}
							onChange={(e) => {
								setFechaInicio(e.target.value);
								setPeriodoSeleccionado("personalizado");
							}}
							className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
						/>
					</div>

					{/* Fecha Fin */}
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">Fecha Fin</label>
						<input
							type="date"
							value={fechaFin}
							onChange={(e) => {
								setFechaFin(e.target.value);
								setPeriodoSeleccionado("personalizado");
							}}
							className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
						/>
					</div>
				</div>
			</div>

			{/* Contenido del reporte */}
			{renderReporteSeleccionado()}
		</div>
	);
}
