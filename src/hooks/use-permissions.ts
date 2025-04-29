import { useEffect, useState } from 'react';
import { UserRole } from '@/types/users';
import { ROLE_ROUTE_MAP } from '@/types/permissions';

export enum PermissionType {
  VIEW = 'view',
  CREATE = 'create',
  EDIT = 'edit',
  DELETE = 'delete',
}

interface UsePermissionsReturn {
  hasPermission: (permission: PermissionType) => boolean;
  hasRouteAccess: (path: string) => boolean;
  userRole: UserRole | null;
  isLoading: boolean;
}

export function usePermissions(): UsePermissionsReturn {
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Cargar el rol del usuario desde localStorage
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setUserRole(user.role as UserRole);
      } catch (error) {
        console.error('Error al parsear información del usuario:', error);
      }
    }
    setIsLoading(false);
  }, []);

  // Verifica si el usuario tiene un permiso específico (view, create, edit, delete)
  const hasPermission = (permission: PermissionType, modulePath?: string): boolean => {
    if (!userRole) return false;

    // Módulos restringidos para el rol VIEWER
    const restrictedModulesForViewer = [
      '/ingresos',
      '/egresos',
      '/egresos-sin-factura',
      '/detracciones',
      '/viajes',
    ];

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
        // Verificar si estamos en un módulo restringido para viewers
        const currentPath = window.location.pathname;
        const isRestrictedModule = restrictedModulesForViewer.some((module) =>
          currentPath.startsWith(module)
        );

        // Los visualizadores solo pueden ver, y no pueden modificar módulos restringidos
        if (isRestrictedModule) {
          return permission === PermissionType.VIEW;
        } else {
          // En otros módulos, mantener comportamiento anterior
          return permission === PermissionType.VIEW;
        }
      default:
        return false;
    }
  };

  // Verifica si el usuario tiene acceso a una ruta específica
  const hasRouteAccess = (path: string): boolean => {
    if (!userRole) return false;

    // Los administradores tienen acceso a todas las rutas
    if (userRole === UserRole.ADMIN) return true;

    // La página de acceso denegado siempre es accesible
    if (path === '/acceso-denegado') return true;

    // Verificar rutas permitidas
    const allowedRoutes = ROLE_ROUTE_MAP[userRole];
    return allowedRoutes.some((route) => path === route || path.startsWith(`${route}/`));
  };

  return { hasPermission, hasRouteAccess, userRole, isLoading };
}
