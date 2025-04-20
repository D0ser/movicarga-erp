"use client";

import { useEffect, useState } from "react";
import supabase from "@/lib/supabase";
import Link from "next/link";
import showToast from "@/utils/toast";

// Definir interfaces para la tipificación
interface Cliente {
	monto: string;
}

interface EstadisticasDashboard {
	clientesTotal: number;
	vehiculosTotal: number;
	viajesTotal: number;
	ingresosHoy: number;
	ingresosTotal: number;
	egresosTotal: number;
}

// Componente de tarjeta para mostrar resúmenes en el dashboard
function DashboardCard({ title, value, icon, linkTo }: { title: string; value: string | number; icon: React.ReactNode; linkTo: string }) {
	return (
		<Link href={linkTo} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow duration-200">
			<div className="flex items-center justify-between">
				<div>
					<h3 className="text-sm font-medium text-gray-500">{title}</h3>
					<p className="text-2xl font-bold mt-1">{value}</p>
				</div>
				<div className="p-3 bg-indigo-50 rounded-full">{icon}</div>
			</div>
		</Link>
	);
}

export default async function DashboardPage() {
	const [stats, setStats] = useState<EstadisticasDashboard>({
		clientesTotal: 0,
		vehiculosTotal: 0,
		viajesTotal: 0,
		ingresosHoy: 0,
		ingresosTotal: 0,
		egresosTotal: 0,
	});
	const [loading, setLoading] = useState(true);

	// Cargar estadísticas al montar el componente
	useEffect(() => {
		async function loadStats() {
			try {
				// Obtener conteo de clientes
				const { count: clientesCount } = await supabase.from("clientes").select("*", { count: "exact", head: true });

				// Obtener conteo de vehículos
				const { count: vehiculosCount } = await supabase.from("vehiculos").select("*", { count: "exact", head: true });

				// Obtener conteo de viajes
				const { count: viajesCount } = await supabase.from("viajes").select("*", { count: "exact", head: true });

				// Obtener ingresos de hoy
				const today = new Date();
				today.setHours(0, 0, 0, 0);
				const { data: ingresosHoy } = await supabase.from("ingresos").select("monto").gte("fecha", today.toISOString());

				// Calcular suma de ingresos de hoy
				const totalIngresosHoy = ingresosHoy?.reduce((sum: number, item: { monto: string }) => sum + (parseFloat(item.monto) || 0), 0) || 0;

				// Obtener total de ingresos
				const { data: ingresos } = await supabase.from("ingresos").select("monto");
				const totalIngresos = ingresos?.reduce((sum: number, item: { monto: string }) => sum + (parseFloat(item.monto) || 0), 0) || 0;

				// Obtener total de egresos
				const { data: egresos } = await supabase.from("egresos").select("monto");
				const totalEgresos = egresos?.reduce((sum: number, item: { monto: string }) => sum + (parseFloat(item.monto) || 0), 0) || 0;

				setStats({
					clientesTotal: clientesCount || 0,
					vehiculosTotal: vehiculosCount || 0,
					viajesTotal: viajesCount || 0,
					ingresosHoy: totalIngresosHoy,
					ingresosTotal: totalIngresos,
					egresosTotal: totalEgresos,
				});
			} catch (error) {
				console.error("Error al cargar estadísticas:", error);
			} finally {
				setLoading(false);
			}
		}

		loadStats();
	}, []);

	// Función para mostrar notificaciones usando showToast
	const showNotification = (type: "success" | "error" | "warning" | "info", message: string) => {
		switch (type) {
			case "success":
				showToast.success(message);
				break;
			case "error":
				showToast.error(message);
				break;
			case "warning":
				showToast.custom(message);
				break;
			case "info":
				showToast.custom(message);
				break;
			default:
				showToast.custom(message);
		}
	};

	return (
		<div>
			<h1 className="text-2xl font-bold mb-6">Dashboard</h1>

			{loading ? (
				<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
					{[...Array(6)].map((_, index) => (
						<div key={index} className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
							<div className="flex items-center justify-between">
								<div className="w-full">
									<div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
									<div className="h-8 bg-gray-200 rounded w-1/3"></div>
								</div>
								<div className="p-3 bg-gray-200 rounded-full h-12 w-12"></div>
							</div>
						</div>
					))}
				</div>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
					<DashboardCard
						title="Clientes"
						value={stats.clientesTotal}
						icon={
							<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
								/>
							</svg>
						}
						linkTo="/clientes"
					/>

					<DashboardCard
						title="Vehículos"
						value={stats.vehiculosTotal}
						icon={
							<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0"
								/>
							</svg>
						}
						linkTo="/vehiculos"
					/>

					<DashboardCard
						title="Viajes"
						value={stats.viajesTotal}
						icon={
							<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
							</svg>
						}
						linkTo="/viajes"
					/>

					<DashboardCard
						title="Ingresos de Hoy"
						value={`S/ ${stats.ingresosHoy.toFixed(2)}`}
						icon={
							<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
								/>
							</svg>
						}
						linkTo="/ingresos"
					/>

					<DashboardCard
						title="Ingresos Totales"
						value={`S/ ${stats.ingresosTotal.toFixed(2)}`}
						icon={
							<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z"
								/>
							</svg>
						}
						linkTo="/ingresos"
					/>

					<DashboardCard
						title="Egresos Totales"
						value={`S/ ${stats.egresosTotal.toFixed(2)}`}
						icon={
							<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
							</svg>
						}
						linkTo="/egresos"
					/>
				</div>
			)}
		</div>
	);
}
