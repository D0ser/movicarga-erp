"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import SupabaseConnectionStatus from "@/components/SupabaseConnectionStatus";
import { Toaster } from "@/components/ui/toaster";
import { NavItem } from "@/components/ui/nav-item";
import { CustomButton } from "@/components/ui/custom-button";
import { CustomAlert } from "@/components/ui/custom-alert";
import supabase from "@/lib/supabase";

// Componente de menú lateral deslizable
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
	const [isSidebarOpen, setIsSidebarOpen] = useState(true);
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const [userRole, setUserRole] = useState("");
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
	const router = useRouter();
	const pathname = usePathname();

	// Cerrar sidebar automáticamente en pantallas pequeñas
	useEffect(() => {
		const handleResize = () => {
			if (window.innerWidth < 768) {
				setIsSidebarOpen(false);
			} else {
				setIsSidebarOpen(true);
			}
		};

		window.addEventListener("resize", handleResize);
		handleResize(); // Comprobar al cargar

		return () => window.removeEventListener("resize", handleResize);
	}, []);

	// Cerrar menú móvil al cambiar de ruta
	useEffect(() => {
		setIsMobileMenuOpen(false);
	}, [pathname]);

	// Verificar autenticación al cargar el componente
	useEffect(() => {
		async function checkAndSetUser() {
			const userStr = localStorage.getItem("user");

			try {
				// Intentar obtener el usuario c.llanos de Supabase
				const { data, error } = await supabase.from("usuarios").select("*").eq("username", "c.llanos").single();

				if (error) {
					console.error("Error al buscar usuario en Supabase:", error);
					// Si hay error al buscar en Supabase, usar dato local
					if (!userStr) {
						// Si no hay usuario guardado, establecer c.llanos como usuario por defecto
						const defaultUser = {
							username: "c.llanos",
							role: "admin",
						};
						localStorage.setItem("user", JSON.stringify(defaultUser));
						setIsAuthenticated(true);
						setUserRole(defaultUser.role);
					} else {
						const user = JSON.parse(userStr);
						setIsAuthenticated(true);
						setUserRole(user.role);
					}
					return;
				}

				// Si obtenemos el usuario de Supabase, usarlo
				if (data) {
					const updatedUser = {
						username: data.username,
						role: data.role,
					};

					// Actualizar el último acceso del usuario
					supabase
						.from("usuarios")
						.update({ lastLogin: new Date().toISOString() })
						.eq("id", data.id)
						.then((result) => {
							if (result.error) {
								console.error("Error al actualizar último acceso:", result.error);
								return;
							}
							console.log("Último acceso actualizado");
						});

					// Guardar en localStorage y actualizar el estado
					localStorage.setItem("user", JSON.stringify(updatedUser));
					setIsAuthenticated(true);
					setUserRole(updatedUser.role);
				} else {
					// Si no existe el usuario en Supabase, usar datos locales
					if (!userStr) {
						const defaultUser = {
							username: "c.llanos",
							role: "admin",
						};
						localStorage.setItem("user", JSON.stringify(defaultUser));
						setIsAuthenticated(true);
						setUserRole(defaultUser.role);
					} else {
						const user = JSON.parse(userStr);
						setIsAuthenticated(true);
						setUserRole(user.role);
					}
				}
			} catch (err: unknown) {
				console.error("Error inesperado al verificar usuario:", err);
				// Usar dato local en caso de error
				if (!userStr) {
					const defaultUser = {
						username: "c.llanos",
						role: "admin",
					};
					localStorage.setItem("user", JSON.stringify(defaultUser));
					setIsAuthenticated(true);
					setUserRole(defaultUser.role);
				} else {
					const user = JSON.parse(userStr);
					setIsAuthenticated(true);
					setUserRole(user.role);
				}
			}
		}

		checkAndSetUser();
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
		<div className="flex h-screen bg-white overflow-hidden">
			{/* Sidebar de escritorio y móvil con mejoras de accesibilidad */}
			<aside
				id="sidebar"
				aria-label="Menú de navegación principal"
				className={`bg-[#2d2e83] text-white transition-all duration-300 ease-in-out fixed md:static top-0 bottom-0 left-0 z-40 ${isSidebarOpen ? "w-64" : "w-20"} ${
					isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
				}`}>
				<div className="p-4 flex justify-between items-center border-b border-[#1f1f6f]">
					{isSidebarOpen && (
						<h2 className="text-xl font-bold truncate">
							<Link href="/dashboard" className="focus:outline-none focus:ring-2 focus:ring-white rounded-sm">
								MoviCarga
							</Link>
						</h2>
					)}
					<CustomButton
						onClick={() => setIsSidebarOpen(!isSidebarOpen)}
						variant="ghost"
						className="p-2 rounded-md hover:bg-[#1f1f6f] md:block hidden text-white"
						aria-label={isSidebarOpen ? "Contraer menú lateral" : "Expandir menú lateral"}
						aria-expanded={isSidebarOpen}>
						<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
						</svg>
					</CustomButton>
					<CustomButton onClick={() => setIsMobileMenuOpen(false)} variant="ghost" className="p-2 rounded-md hover:bg-[#1f1f6f] md:hidden text-white" aria-label="Cerrar menú lateral">
						<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
						</svg>
					</CustomButton>
				</div>

				<div className="overflow-y-auto h-[calc(100%-4rem)] pb-20">
					<nav className="mt-6 px-2" aria-label="Menú principal">
						<ul className="space-y-1">
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
								href="/ingresos"
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
								active={pathname.includes("/ingresos")}
							/>

							<NavItem
								href="/egresos"
								icon={
									<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
									</svg>
								}
								label="Egresos"
								isOpen={isSidebarOpen}
								active={pathname.includes("/egresos") && !pathname.includes("/egresos-sin-factura")}
							/>

							<NavItem
								href="/egresos-sin-factura"
								icon={
									<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
									</svg>
								}
								label="Egresos Sin Factura"
								isOpen={isSidebarOpen}
								active={pathname.includes("/egresos-sin-factura")}
							/>

							<NavItem
								href="/detracciones"
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
								active={pathname.includes("/detracciones")}
							/>

							<NavItem
								href="/vehiculos"
								icon={
									<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
									</svg>
								}
								label="Vehículos"
								isOpen={isSidebarOpen}
								active={pathname.includes("/vehiculos")}
							/>

							<NavItem
								href="/clientes"
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
								active={pathname.includes("/clientes")}
							/>

							<NavItem
								href="/usuarios"
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
								active={pathname.includes("/usuarios")}
							/>

							<NavItem
								href="/viajes"
								icon={
									<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
										/>
									</svg>
								}
								label="Viajes"
								isOpen={isSidebarOpen}
								active={pathname.includes("/viajes")}
							/>
						</ul>
					</nav>
				</div>
			</aside>

			{/* Overlay mejorado para dispositivos móviles */}
			{isMobileMenuOpen && <div className="fixed inset-0 bg-gray-900 bg-opacity-50 z-30 md:hidden animate-fade-in" onClick={() => setIsMobileMenuOpen(false)} aria-hidden="true"></div>}

			{/* Contenido principal con mejoras */}
			<div className="flex-1 flex flex-col overflow-hidden w-full">
				<header className="bg-white shadow-sm sticky top-0 z-20">
					<div className="px-4 py-3 flex justify-between items-center">
						{/* Menú móvil toggle mejorado */}
						<button
							className="md:hidden p-2 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[#2d2e83]"
							onClick={() => setIsMobileMenuOpen(true)}
							aria-label="Abrir menú lateral"
							aria-expanded={isMobileMenuOpen}
							aria-controls="sidebar">
							<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#2d2e83]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
							</svg>
						</button>

						{/* Título de página mejorado para legibilidad */}
						<h1 className="text-xl md:text-2xl font-bold text-[#2d2e83] truncate">
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
								: pathname.includes("/viajes")
								? "Viajes"
								: ""}
						</h1>

						{/* Información y acciones del lado derecho */}
						<div className="flex items-center space-x-4">
							{/* Indicador de conexión a la BD (solo mostrar aquí, eliminar otros duplicados) */}
							<SupabaseConnectionStatus />

							{/* Información de usuario con bienvenida */}
							<div className="text-[#2d2e83] hidden md:flex items-center space-x-2 truncate max-w-[200px]">
								<span className="text-sm md:text-base">Bienvenido,</span>
								<Link href="/usuarios/perfil" className="font-medium hover:underline">
									{JSON.parse(localStorage.getItem("user") || "{}").username || "Usuario"}
								</Link>
							</div>

							{/* Botón de cerrar sesión */}
							<CustomButton onClick={handleLogout} variant="destructive" className="text-white bg-red-600 hover:bg-red-700 px-3 py-2 rounded-md text-sm font-medium" aria-label="Cerrar sesión">
								<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
								</svg>
								Cerrar Sesión
							</CustomButton>
						</div>
					</div>
				</header>

				{/* Contenido principal */}
				<main className="flex-1 overflow-auto bg-gray-50">
					{/* Contenido */}
					<div className="p-6">{children}</div>
				</main>

				{/* Footer mejorado */}
				<footer className="bg-white p-2 md:p-3 text-center text-[#2d2e83] text-xs border-t">&copy; {new Date().getFullYear()} MoviCarga - Sistema de Gestión de Transporte</footer>
			</div>

			{/* Contenedor de notificaciones Toast */}
			<Toaster />
		</div>
	);
}
