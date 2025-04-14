"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

// Componente de menú lateral deslizable
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
	const [isSidebarOpen, setIsSidebarOpen] = useState(true);
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const [userRole, setUserRole] = useState("");
	const router = useRouter();
	const pathname = usePathname();

	// Verificar autenticación al cargar el componente
	useEffect(() => {
		const userStr = localStorage.getItem("user");
		if (!userStr) {
			router.push("/");
			return;
		}

		const user = JSON.parse(userStr);
		setIsAuthenticated(true);
		setUserRole(user.role);
	}, [router]);

	// Función para cerrar sesión
	const handleLogout = () => {
		localStorage.removeItem("user");
		router.push("/");
	};

	if (!isAuthenticated) {
		return null; // No renderizar nada mientras se verifica la autenticación
	}

	return (
		<div className="flex h-screen bg-gray-100">
			{/* Sidebar */}
			<div className={`bg-primary text-white transition-all duration-300 ease-in-out ${isSidebarOpen ? "w-64" : "w-20"}`}>
				<div className="p-4 flex justify-between items-center">
					{isSidebarOpen && <h2 className="text-xl font-bold">MoviCarga</h2>}
					<button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 rounded-md hover:bg-primary-dark">
						<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
						</svg>
					</button>
				</div>

				<nav className="mt-6">
					<NavItem
						href="/dashboard"
						icon={
							<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
								/>
							</svg>
						}
						label="Dashboard"
						isOpen={isSidebarOpen}
						active={pathname === "/dashboard"}
					/>

					<NavItem
						href="/dashboard/ingresos"
						icon={
							<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
								/>
							</svg>
						}
						label="Ingresos"
						isOpen={isSidebarOpen}
						active={pathname.includes("/dashboard/ingresos")}
					/>

					<NavItem
						href="/dashboard/egresos"
						icon={
							<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
							</svg>
						}
						label="Egresos"
						isOpen={isSidebarOpen}
						active={pathname.includes("/dashboard/egresos")}
					/>

					<NavItem
						href="/dashboard/egresos-sin-factura"
						icon={
							<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
							</svg>
						}
						label="Egresos Sin Factura"
						isOpen={isSidebarOpen}
						active={pathname.includes("/dashboard/egresos-sin-factura")}
					/>

					<NavItem
						href="/dashboard/detracciones"
						icon={
							<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
								/>
							</svg>
						}
						label="Detracciones"
						isOpen={isSidebarOpen}
						active={pathname.includes("/dashboard/detracciones")}
					/>

					<NavItem
						href="/dashboard/vehiculos"
						icon={
							<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
							</svg>
						}
						label="Vehículos"
						isOpen={isSidebarOpen}
						active={pathname.includes("/dashboard/vehiculos")}
					/>

					<NavItem
						href="/dashboard/clientes"
						icon={
							<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
								/>
							</svg>
						}
						label="Clientes"
						isOpen={isSidebarOpen}
						active={pathname.includes("/dashboard/clientes")}
					/>

					<NavItem
						href="/dashboard/conductores"
						icon={
							<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
							</svg>
						}
						label="Conductores"
						isOpen={isSidebarOpen}
						active={pathname.includes("/dashboard/conductores")}
					/>

					<NavItem
						href="/dashboard/reportes-financieros"
						icon={
							<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
								/>
							</svg>
						}
						label="Reportes Financieros"
						isOpen={isSidebarOpen}
						active={pathname.includes("/dashboard/reportes-financieros")}
					/>

					{userRole === "admin" && (
						<NavItem
							href="/dashboard/usuarios"
							icon={
								<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
									/>
								</svg>
							}
							label="Usuarios"
							isOpen={isSidebarOpen}
							active={pathname.includes("/dashboard/usuarios")}
						/>
					)}
				</nav>

				<div className="absolute bottom-0 p-4 w-full">
					<button
						onClick={handleLogout}
						className={`flex items-center p-2 rounded-md hover:bg-red-700 bg-red-600 transition-all duration-200 ${isSidebarOpen ? "w-full justify-between" : "justify-center"}`}>
						<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
						</svg>
						{isSidebarOpen && <span>Cerrar Sesión</span>}
					</button>
				</div>
			</div>

			{/* Main content */}
			<div className="flex-1 overflow-auto">
				<header className="bg-white shadow-sm p-4">
					<div className="flex justify-between items-center">
						<h1 className="text-2xl font-bold text-primary">
							{pathname === "/dashboard"
								? "Dashboard"
								: pathname.includes("/ingresos")
								? "Ingresos"
								: pathname.includes("/egresos-sin-factura")
								? "Egresos Sin Factura"
								: pathname.includes("/egresos")
								? "Egresos"
								: pathname.includes("/detracciones")
								? "Detracciones"
								: pathname.includes("/vehiculos")
								? "Vehículos"
								: pathname.includes("/clientes")
								? "Clientes"
								: pathname.includes("/conductores")
								? "Conductores"
								: pathname.includes("/usuarios")
								? "Usuarios"
								: pathname.includes("/reportes-financieros")
								? "Reportes Financieros"
								: ""}
						</h1>
						<div className="text-primary">Bienvenido, {JSON.parse(localStorage.getItem("user") || "{}").username || "Usuario"}</div>
					</div>
				</header>

				<main className="p-6">{children}</main>

				<footer className="bg-white p-4 text-center text-primary text-sm mt-auto">&copy; 2025 MoviCarga - Sistema de Gestión de Transporte</footer>
			</div>
		</div>
	);
}

// Componente de item de navegación
function NavItem({ href, icon, label, isOpen, active }: { href: string; icon: React.ReactNode; label: string; isOpen: boolean; active: boolean }) {
	return (
		<Link
			href={href}
			className={`flex items-center py-3 px-4 ${isOpen ? "justify-start" : "justify-center"} ${
				active ? "bg-secondary text-white" : "text-gray-200 hover:bg-secondary hover:text-white"
			} transition-all duration-200`}>
			<div className="mr-3">{icon}</div>
			{isOpen && <span>{label}</span>}
		</Link>
	);
}
