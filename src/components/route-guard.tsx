"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { usePermissions } from "@/hooks/use-permissions";

interface RouteGuardProps {
	children: React.ReactNode;
}

export function RouteGuard({ children }: RouteGuardProps) {
	const { hasRouteAccess, isLoading } = usePermissions();
	const router = useRouter();
	const pathname = usePathname();
	const [isAuthorized, setIsAuthorized] = useState(true); // Por defecto permitimos acceso hasta determinar lo contrario

	useEffect(() => {
		// Si está cargando, no hacer nada todavía
		if (isLoading) return;

		// Ignorar si ya estamos en la página de acceso denegado
		if (pathname === "/acceso-denegado") {
			setIsAuthorized(true);
			return;
		}

		// Verificar acceso a la ruta actual
		const isPathAllowed = hasRouteAccess(pathname);

		// Actualizar el estado de autorización
		setIsAuthorized(isPathAllowed);

		if (!isPathAllowed) {
			console.warn(`Acceso denegado a la ruta ${pathname}`);
			// Redirigir a la página de acceso denegado
			router.push("/acceso-denegado");
		}
	}, [isLoading, hasRouteAccess, pathname, router]);

	// Si está cargando, mostrar nada o un indicador de carga
	if (isLoading) {
		return null;
	}

	// Si está autorizado, mostrar el contenido
	return isAuthorized ? <>{children}</> : null;
}
