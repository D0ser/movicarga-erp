'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { usePermissions } from '@/hooks/use-permissions';

interface RouteGuardProps {
  children: React.ReactNode;
}

export function RouteGuard({ children }: RouteGuardProps) {
  const { hasRouteAccess, isLoading } = usePermissions();
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState(false); // Por defecto denegamos acceso hasta verificar permisos
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    // Si estamos en proceso de redirección desde el login, permitir acceso inmediato
    if (typeof window !== 'undefined' && sessionStorage.getItem('isRedirecting') === 'true') {
      console.log('RouteGuard: Permitiendo acceso durante redirección desde login');
      setIsAuthorized(true);
      return;
    }

    // Evitar múltiples verificaciones
    if (isChecking) return;
    setIsChecking(true);

    // Si está cargando, no hacer nada todavía
    if (isLoading) {
      setIsChecking(false);
      return;
    }

    // Si estamos en proceso de redirección, no interferir
    if (
      typeof window !== 'undefined' &&
      (sessionStorage.getItem('isRedirecting') === 'true' ||
        sessionStorage.getItem('redirectingToLogin') === 'true')
    ) {
      console.log('RouteGuard: Ruta en proceso de redirección, no verificando permisos');
      setIsChecking(false);
      setIsAuthorized(true);
      return;
    }

    // Ignorar si ya estamos en la página de acceso denegado
    if (pathname === '/acceso-denegado') {
      setIsAuthorized(true);
      setIsChecking(false);
      return;
    }

    // Verificar acceso a la ruta actual
    const isPathAllowed = hasRouteAccess(pathname);

    // Actualizar el estado de autorización
    setIsAuthorized(isPathAllowed);

    if (!isPathAllowed) {
      console.warn(`Acceso denegado a la ruta ${pathname}`);
      // Redirigir a la página de acceso denegado
      sessionStorage.setItem('redirectingToAccessDenied', 'true');
      router.push('/acceso-denegado');
    }

    setIsChecking(false);
  }, [isLoading, hasRouteAccess, pathname, router, isChecking]);

  // Si está cargando, mostrar nada o un indicador de carga
  if (isLoading) {
    return null;
  }

  // Si está autorizado, mostrar el contenido
  return isAuthorized ? <>{children}</> : null;
}
