"use client";

import { useEffect, useState } from "react";
import { format, subMonths, parseISO } from "date-fns";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement, RadialLinearScale, Filler } from "chart.js";
import { Line, Bar, Doughnut, Radar } from "react-chartjs-2";
import SupabaseConnectionStatus from "@/components/SupabaseConnectionStatus";
import NotificationDemo from "@/components/notifications/NotificationDemo";

// Registramos los componentes necesarios de Chart.js
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement, RadialLinearScale, Filler);

export default function Dashboard() {
	// En una aplicación real, estos datos vendrían de Supabase
	const [stats, setStats] = useState({
		ingresos: 0,
		egresos: 0,
		vehiculos: 0,
		clientes: 0,
		conductores: 0,
		viajesCompletados: 0,
		viajeProgramados: 0,
		viajesEnRuta: 0,
		facturasPendientes: 0,
		proximosMantenimientos: 0,
		detracciones: {
			pendientes: 0,
			completadas: 0,
		},
		viajes: {
			totalMes: 0,
			cancelados: 0,
		},
	});

	const [financialData, setFinancialData] = useState({
		labels: [] as string[],
		ingresos: [] as number[],
		egresos: [] as number[],
	});

	const [viajesData, setViajesData] = useState({
		labels: [] as string[],
		completados: [] as number[],
		programados: [] as number[],
		cancelados: [] as number[],
	});

	const [vehiculosData, setVehiculosData] = useState({
		activos: 0,
		mantenimiento: 0,
		inactivos: 0,
	});

	const [rutasPopulares, setRutasPopulares] = useState([
		{ ruta: "Lima - Arequipa", viajes: 0 },
		{ ruta: "Lima - Trujillo", viajes: 0 },
		{ ruta: "Lima - Chiclayo", viajes: 0 },
		{ ruta: "Lima - Cusco", viajes: 0 },
		{ ruta: "Lima - Piura", viajes: 0 },
	]);

	useEffect(() => {
		// Simulación de carga de datos
		// En una aplicación real, aquí cargarías los datos desde Supabase
		setTimeout(() => {
			// Datos principales
			setStats({
				ingresos: 125000,
				egresos: 85400,
				vehiculos: 12,
				clientes: 28,
				conductores: 15,
				viajesCompletados: 42,
				viajeProgramados: 8,
				viajesEnRuta: 5,
				facturasPendientes: 3,
				proximosMantenimientos: 2,
				detracciones: {
					pendientes: 5,
					completadas: 18,
				},
				viajes: {
					totalMes: 55,
					cancelados: 3,
				},
			});

			// Datos para el gráfico de finanzas (últimos 6 meses)
			const months = [];
			const ingresos = [];
			const egresos = [];

			// Generar datos de los últimos 6 meses
			for (let i = 5; i >= 0; i--) {
				const date = subMonths(new Date(), i);
				months.push(format(date, "MMM yyyy"));

				// Datos ficticios con tendencia al crecimiento
				const baseIngreso = 80000 + (5 - i) * 10000 + Math.random() * 20000;
				const baseEgreso = 60000 + (5 - i) * 5000 + Math.random() * 15000;

				ingresos.push(Math.round(baseIngreso));
				egresos.push(Math.round(baseEgreso));
			}

			setFinancialData({
				labels: months,
				ingresos: ingresos,
				egresos: egresos,
			});

			// Datos para el gráfico de viajes
			setViajesData({
				labels: months,
				completados: [12, 15, 18, 16, 19, 22],
				programados: [2, 3, 2, 4, 3, 8],
				cancelados: [1, 0, 2, 1, 0, 3],
			});

			// Datos de estado de vehículos
			setVehiculosData({
				activos: 8,
				mantenimiento: 3,
				inactivos: 1,
			});

			// Rutas populares
			setRutasPopulares([
				{ ruta: "Lima - Arequipa", viajes: 18 },
				{ ruta: "Lima - Trujillo", viajes: 12 },
				{ ruta: "Lima - Chiclayo", viajes: 8 },
				{ ruta: "Lima - Cusco", viajes: 7 },
				{ ruta: "Lima - Piura", viajes: 5 },
			]);
		}, 500);
	}, []);

	// Configuraciones para los gráficos
	const lineChartOptions = {
		responsive: true,
		plugins: {
			legend: {
				position: "top" as const,
			},
			title: {
				display: true,
				text: "Ingresos vs Egresos (Últimos 6 meses)",
			},
		},
	};

	const lineChartData = {
		labels: financialData.labels,
		datasets: [
			{
				label: "Ingresos",
				data: financialData.ingresos,
				borderColor: "#f39200",
				backgroundColor: "rgba(243, 146, 0, 0.5)",
				tension: 0.3,
			},
			{
				label: "Egresos",
				data: financialData.egresos,
				borderColor: "#2d2e83",
				backgroundColor: "rgba(45, 46, 131, 0.5)",
				tension: 0.3,
			},
		],
	};

	const barChartOptions = {
		responsive: true,
		plugins: {
			legend: {
				position: "top" as const,
			},
			title: {
				display: true,
				text: "Estado de Viajes (Últimos 6 meses)",
			},
		},
		scales: {
			x: {
				stacked: true,
			},
			y: {
				stacked: true,
			},
		},
	};

	const barChartData = {
		labels: viajesData.labels,
		datasets: [
			{
				label: "Viajes Completados",
				data: viajesData.completados,
				backgroundColor: "rgba(45, 46, 131, 0.7)",
			},
			{
				label: "Viajes Programados",
				data: viajesData.programados,
				backgroundColor: "rgba(243, 146, 0, 0.7)",
			},
			{
				label: "Viajes Cancelados",
				data: viajesData.cancelados,
				backgroundColor: "rgba(239, 68, 68, 0.7)",
			},
		],
	};

	const doughnutChartOptions = {
		responsive: true,
		plugins: {
			legend: {
				position: "right" as const,
			},
			title: {
				display: true,
				text: "Estado de la Flota",
			},
		},
	};

	const doughnutChartData = {
		labels: ["Activos", "En Mantenimiento", "Inactivos"],
		datasets: [
			{
				data: [vehiculosData.activos, vehiculosData.mantenimiento, vehiculosData.inactivos],
				backgroundColor: ["rgba(45, 46, 131, 0.7)", "rgba(243, 146, 0, 0.7)", "rgba(239, 68, 68, 0.7)"],
				borderColor: ["rgba(45, 46, 131, 1)", "rgba(243, 146, 0, 1)", "rgba(239, 68, 68, 1)"],
				borderWidth: 1,
			},
		],
	};

	const radarChartOptions = {
		responsive: true,
		plugins: {
			legend: {
				display: false,
			},
			title: {
				display: true,
				text: "Rutas más frecuentes",
			},
		},
		scales: {
			r: {
				min: 0,
				ticks: {
					stepSize: 5,
				},
			},
		},
	};

	const radarChartData = {
		labels: rutasPopulares.map((item) => item.ruta),
		datasets: [
			{
				data: rutasPopulares.map((item) => item.viajes),
				backgroundColor: "rgba(243, 146, 0, 0.2)",
				borderColor: "rgba(45, 46, 131, 1)",
				borderWidth: 2,
				pointBackgroundColor: "rgba(45, 46, 131, 1)",
				pointBorderColor: "#fff",
				pointHoverBackgroundColor: "#fff",
				pointHoverBorderColor: "rgba(45, 46, 131, 1)",
			},
		],
	};

	return (
		<div className="space-y-6">
			<div className="flex justify-between items-center mb-6">
				<h1 className="text-2xl font-bold">Dashboard</h1>
				<div className="text-sm bg-primary text-white px-3 py-1 rounded-full">{format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy")}</div>
			</div>

			{/* Estado de conexión con Supabase */}
			<SupabaseConnectionStatus />

			{/* Demostración de notificaciones */}
			<NotificationDemo className="mb-6" />

			{/* Tarjetas de estadísticas principales */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
				<StatCard
					title="Total Ingresos"
					value={`S/. ${stats.ingresos.toLocaleString()}`}
					icon={
						<svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
							/>
						</svg>
					}
					color="bg-secondary"
				/>
				<StatCard
					title="Total Egresos"
					value={`S/. ${stats.egresos.toLocaleString()}`}
					icon={
						<svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
					}
					color="bg-red-500"
				/>
				<StatCard
					title="Balance"
					value={`S/. ${(stats.ingresos - stats.egresos).toLocaleString()}`}
					icon={
						<svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
							/>
						</svg>
					}
					color="bg-primary"
				/>
				<StatCard
					title="Vehículos Activos"
					value={vehiculosData.activos}
					icon={
						<svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
						</svg>
					}
					color="bg-secondary"
				/>
			</div>

			{/* Tarjetas de indicadores secundarios */}
			<div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
				<MiniCard title="Viajes Completados" value={stats.viajesCompletados} color="bg-green-100 text-green-800" />
				<MiniCard title="Viajes En Ruta" value={stats.viajesEnRuta} color="bg-primary bg-opacity-10 text-primary" />
				<MiniCard title="Viajes Programados" value={stats.viajeProgramados} color="bg-secondary bg-opacity-10 text-secondary" />
				<MiniCard title="Facturas Pendientes" value={stats.facturasPendientes} color="bg-primary bg-opacity-10 text-primary" />
				<MiniCard title="Detracciones Pendientes" value={stats.detracciones.pendientes} color="bg-secondary bg-opacity-10 text-secondary" />
				<MiniCard title="Próx. Mantenimientos" value={stats.proximosMantenimientos} color="bg-red-100 text-red-800" />
			</div>

			{/* Gráficos principales */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<div className="bg-white p-6 rounded-lg shadow-md">
					<div className="h-80">
						<Line options={lineChartOptions} data={lineChartData} />
					</div>
				</div>

				<div className="bg-white p-6 rounded-lg shadow-md">
					<div className="h-80">
						<Bar options={barChartOptions} data={barChartData} />
					</div>
				</div>
			</div>

			{/* Gráficos secundarios y actividad */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				<div className="bg-white p-6 rounded-lg shadow-md">
					<div className="h-64">
						<Doughnut options={doughnutChartOptions} data={doughnutChartData} />
					</div>
				</div>

				<div className="bg-white p-6 rounded-lg shadow-md">
					<div className="h-64">
						<Radar options={radarChartOptions} data={radarChartData} />
					</div>
				</div>

				<div className="bg-white p-6 rounded-lg shadow-md">
					<h2 className="text-xl font-bold mb-4">Actividad Reciente</h2>
					<div className="space-y-4">
						<ActivityItem title="Nueva factura registrada" description="Factura #F001-2536 por S/. 4,500" time="Hace 2 horas" />
						<ActivityItem title="Nuevo conductor registrado" description="Juan Pérez ha sido añadido" time="Hace 5 horas" />
						<ActivityItem title="Pago registrado" description="Pago de combustible por S/. 780" time="Hace 1 día" />
						<ActivityItem title="Cliente actualizado" description="Datos de Transportes S.A. actualizados" time="Hace 2 días" />
					</div>
				</div>
			</div>

			{/* Resumen financiero y datos adicionales */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				<div className="bg-white p-6 rounded-lg shadow-md">
					<h2 className="text-xl font-bold mb-4">Resumen Operativo</h2>
					<div className="divide-y">
						<div className="py-2 flex justify-between">
							<span>Ratio de viajes completados:</span>
							<span className="font-medium text-primary">{Math.round((stats.viajesCompletados / stats.viajes.totalMes) * 100)}%</span>
						</div>
						<div className="py-2 flex justify-between">
							<span>Ratio de viajes cancelados:</span>
							<span className="font-medium text-red-600">{Math.round((stats.viajes.cancelados / stats.viajes.totalMes) * 100)}%</span>
						</div>
						<div className="py-2 flex justify-between">
							<span>Eficiencia de flota:</span>
							<span className="font-medium text-secondary">{Math.round((vehiculosData.activos / stats.vehiculos) * 100)}%</span>
						</div>
						<div className="py-2 flex justify-between">
							<span>Detracciones completadas:</span>
							<span className="font-medium text-primary">{Math.round((stats.detracciones.completadas / (stats.detracciones.completadas + stats.detracciones.pendientes)) * 100)}%</span>
						</div>
					</div>
				</div>

				<div className="bg-white p-6 rounded-lg shadow-md">
					<h2 className="text-xl font-bold mb-4">Próximos Vencimientos</h2>
					<div className="space-y-3">
						<VencimientoItem tipo="SOAT" vehiculo="ABC-123" fecha="2025-05-10" />
						<VencimientoItem tipo="Revisión Técnica" vehiculo="DEF-456" fecha="2025-04-28" />
						<VencimientoItem tipo="Mantenimiento" vehiculo="GHI-789" fecha="2025-04-20" />
						<VencimientoItem tipo="SOAT" vehiculo="JKL-012" fecha="2025-05-15" />
					</div>
				</div>

				<div className="bg-white p-6 rounded-lg shadow-md">
					<h2 className="text-xl font-bold mb-4">Acciones Pendientes</h2>
					<div className="space-y-2">
						<ActionItem text="Revisar facturas pendientes (3)" priority="high" />
						<ActionItem text="Actualizar permisos de vehículos" priority="medium" />
						<ActionItem text="Programar mantenimiento de flota" priority="medium" />
						<ActionItem text="Revisar detracciones pendientes" priority="high" />
						<ActionItem text="Confirmar viajes de la próxima semana" priority="low" />
					</div>
				</div>
			</div>
		</div>
	);
}

// Componente de tarjeta de estadísticas
function StatCard({ title, value, icon, color }: { title: string; value: string | number; icon: React.ReactNode; color: string }) {
	return (
		<div className="bg-white rounded-lg shadow-md p-6 flex justify-between items-center">
			<div>
				<p className="text-sm font-medium">{title}</p>
				<p className="text-2xl font-bold">{value}</p>
			</div>
			<div className={`${color} p-3 rounded-full text-white`}>{icon}</div>
		</div>
	);
}

// Componente de mini tarjeta de estadísticas
function MiniCard({ title, value, color }: { title: string; value: number; color: string }) {
	return (
		<div className={`rounded-lg p-3 ${color}`}>
			<p className="text-xs font-medium">{title}</p>
			<p className="text-xl font-bold">{value}</p>
		</div>
	);
}

// Componente de item de actividad
function ActivityItem({ title, description, time }: { title: string; description: string; time: string }) {
	return (
		<div className="border-l-4 border-primary pl-3">
			<h3 className="font-semibold">{title}</h3>
			<p className="text-sm">{description}</p>
			<p className="text-xs text-gray-400">{time}</p>
		</div>
	);
}

// Componente de item de vencimiento
function VencimientoItem({ tipo, vehiculo, fecha }: { tipo: string; vehiculo: string; fecha: string }) {
	const fechaVencimiento = new Date(fecha);
	const hoy = new Date();
	const diasRestantes = Math.ceil((fechaVencimiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));

	let colorClass = "text-green-600";
	if (diasRestantes < 15) colorClass = "text-secondary";
	if (diasRestantes < 7) colorClass = "text-orange-600";
	if (diasRestantes < 3) colorClass = "text-red-600";

	return (
		<div className="flex justify-between items-center border-l-4 border-primary pl-3">
			<div>
				<h3 className="font-medium">
					{tipo} - {vehiculo}
				</h3>
				<p className="text-xs">{format(parseISO(fecha), "dd/MM/yyyy")}</p>
			</div>
			<div className={`font-bold ${colorClass}`}>{diasRestantes} días</div>
		</div>
	);
}

// Componente de item de acción
function ActionItem({ text, priority = "medium" }: { text: string; priority: "low" | "medium" | "high" }) {
	let colorClass = "border-gray-300";
	if (priority === "medium") colorClass = "border-secondary";
	if (priority === "high") colorClass = "border-red-500";

	return (
		<div className={`flex items-center border-l-4 ${colorClass} pl-3 py-2`}>
			<div className="flex-1">
				<p>{text}</p>
			</div>
			<div>
				{priority === "high" && <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">Alta</span>}
				{priority === "medium" && <span className="px-2 py-1 bg-secondary bg-opacity-10 text-secondary text-xs rounded-full">Media</span>}
				{priority === "low" && <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Baja</span>}
			</div>
		</div>
	);
}
