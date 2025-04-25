import { useEffect, useState } from "react";
import { UserRole } from "@/types/users";

export enum PermissionType {
	VIEW = "view",
	CREATE = "create",
	EDIT = "edit",
	DELETE = "delete",
}

interface UsePermissionsReturn {
	hasPermission: (permission: PermissionType) => boolean;
	userRole: UserRole | null;
	isLoading: boolean;
}

export function usePermissions(): UsePermissionsReturn {
	const [userRole, setUserRole] = useState<UserRole | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		// Cargar el rol del usuario desde localStorage
		const userStr = localStorage.getItem("user");
		if (userStr) {
			try {
				const user = JSON.parse(userStr);
				setUserRole(user.role as UserRole);
			} catch (error) {
				console.error("Error al parsear información del usuario:", error);
			}
		}
		setIsLoading(false);
	}, []);

	const hasPermission = (permission: PermissionType): boolean => {
		if (!userRole) return false;

		// Reglas de permisos basadas en roles:
		switch (userRole) {
			case UserRole.ADMIN:
				// Los administradores tienen todos los permisos
				return true;
			case UserRole.MANAGER:
				// Los gerentes tienen todos los permisos excepto borrar
				return permission !== PermissionType.DELETE;
			case UserRole.OPERATOR:
				// Los operadores pueden ver, crear y editar, pero no borrar
				return permission !== PermissionType.DELETE;
			case UserRole.VIEWER:
				// Los visualizadores solo pueden ver
				return permission === PermissionType.VIEW;
			default:
				return false;
		}
	};

	return { hasPermission, userRole, isLoading };
}
