import React from "react";
import { PermissionType, usePermissions } from "@/hooks/use-permissions";

interface PermissionGuardProps {
	permission: PermissionType;
	children: React.ReactNode;
	fallback?: React.ReactNode;
}

/**
 * Componente para controlar la visualización de elementos según los permisos del usuario.
 * @param permission - El tipo de permiso requerido para mostrar el contenido
 * @param children - El contenido a mostrar si se tiene el permiso
 * @param fallback - (Opcional) Contenido alternativo a mostrar si no se tiene el permiso
 */
export function PermissionGuard({ permission, children, fallback = null }: PermissionGuardProps) {
	const { hasPermission, isLoading } = usePermissions();

	// Si aún está cargando, no mostrar nada
	if (isLoading) return null;

	// Verificar si el usuario tiene el permiso requerido
	if (hasPermission(permission)) {
		return <>{children}</>;
	}

	// Si no tiene el permiso, mostrar el fallback (si existe)
	return <>{fallback}</>;
}

/**
 * Versión del PermissionGuard para acciones de solo visualización.
 * Use este componente para envolver elementos de la UI que cualquier usuario debería poder ver.
 */
export function ViewPermission({ children }: { children: React.ReactNode }) {
	return <PermissionGuard permission={PermissionType.VIEW}>{children}</PermissionGuard>;
}

/**
 * Versión del PermissionGuard para acciones de creación.
 * Use este componente para envolver botones de "Agregar nuevo", "Crear", etc.
 */
export function CreatePermission({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
	return (
		<PermissionGuard permission={PermissionType.CREATE} fallback={fallback}>
			{children}
		</PermissionGuard>
	);
}

/**
 * Versión del PermissionGuard para acciones de edición.
 * Use este componente para envolver botones de "Editar", "Actualizar", etc.
 */
export function EditPermission({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
	return (
		<PermissionGuard permission={PermissionType.EDIT} fallback={fallback}>
			{children}
		</PermissionGuard>
	);
}

/**
 * Versión del PermissionGuard para acciones de eliminación.
 * Use este componente para envolver botones de "Eliminar", "Borrar", etc.
 */
export function DeletePermission({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
	return (
		<PermissionGuard permission={PermissionType.DELETE} fallback={fallback}>
			{children}
		</PermissionGuard>
	);
}
