import { UserRole } from './users';

// Tipo para las rutas protegidas
export type ProtectedRoute = {
  path: string;
  allowedRoles: UserRole[];
};

// Mapa de rutas protegidas por rol
export const ROLE_ROUTE_MAP: Record<UserRole, string[]> = {
  [UserRole.ADMIN]: [], // Admin tiene acceso a todas las rutas
  [UserRole.MANAGER]: [
    '/dashboard',
    '/viajes',
    '/caja-chica',
    '/ingresos',
    '/egresos',
    '/egresos-sin-factura',
    '/clientes',
    '/conductores',
    '/vehiculos',
    '/detracciones',
    '/reportes',
    '/usuarios/perfil',
    '/acceso-denegado',
  ],
  [UserRole.OPERATOR]: [
    '/dashboard',
    '/viajes',
    '/caja-chica',
    '/ingresos',
    '/egresos',
    '/egresos-sin-factura',
    '/clientes',
    '/conductores',
    '/vehiculos',
    '/reportes',
    '/usuarios/perfil',
    '/acceso-denegado',
  ],
  [UserRole.VIEWER]: [
    '/dashboard',
    '/viajes',
    '/caja-chica',
    '/ingresos',
    '/egresos',
    '/egresos-sin-factura',
    '/detracciones',
    '/reportes',
    '/usuarios/perfil',
    '/acceso-denegado',
  ],
};

// Lista completa de todas las rutas de la aplicación
export const ALL_ROUTES = [
  '/dashboard',
  '/viajes',
  '/caja-chica',
  '/ingresos',
  '/egresos',
  '/egresos-sin-factura',
  '/clientes',
  '/conductores',
  '/vehiculos',
  '/detracciones',
  '/reportes',
  '/usuarios',
  '/usuarios/perfil',
  '/configuracion',
  '/ayuda',
  '/acceso-denegado',
];
