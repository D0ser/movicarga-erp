'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import SupabaseConnectionStatus from '@/components/SupabaseConnectionStatus';
import { Toaster } from '@/components/ui/toaster';
import { NavItem } from '@/components/ui/nav-item';
import { CustomButton } from '@/components/ui/custom-button';
import { CustomAlert } from '@/components/ui/custom-alert';
import { RouteGuard } from '@/components/route-guard';
import supabase from '@/lib/supabase';
import { UserRole } from '@/types/users';
import Image from 'next/image';

// Componente de menú lateral deslizable
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<UserRole | string>('');
  const [userName, setUserName] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  // Cerrar sidebar automáticamente en pantallas pequeñas
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        // No cerrar automáticamente en dispositivos móviles
        // setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Comprobar al cargar

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Cerrar menú móvil al cambiar de ruta
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Cierra el dropdown cuando se hace clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsUserDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Cierra el dropdown cuando cambia la ruta
  useEffect(() => {
    setIsUserDropdownOpen(false);
  }, [pathname]);

  // Verificar autenticación al cargar el componente
  useEffect(() => {
    // Limpiar la bandera de redirección solo si ya estamos autenticados
    if (isAuthenticated) {
      sessionStorage.removeItem('isRedirecting');
      return;
    }

    // Restaurar el control de navegación si venimos del login
    if (typeof window !== 'undefined') {
      const fromLogin = sessionStorage.getItem('isRedirecting') === 'true';
      if (fromLogin) {
        console.log('Detectada redirección desde login, configurando estado de autenticación');
        // Intentar leer datos de usuario directamente
        const userStr = localStorage.getItem('user');
        if (userStr) {
          try {
            const user = JSON.parse(userStr);
            setIsAuthenticated(true);
            setUserRole(user.role || '');
            setUserName(user.username || '');
            // No borrar isRedirecting aquí, lo hará el dashboard
            return;
          } catch (e) {
            console.error('Error al procesar datos de usuario:', e);
          }
        }
      }
    }

    async function checkAndSetUser() {
      // Evitar que este efecto se ejecute durante la fase de renderizado del servidor
      if (typeof window === 'undefined') return;

      // Prevenir múltiples verificaciones simultáneas
      if (isCheckingAuth) return;
      setIsCheckingAuth(true);

      // Si estamos en proceso de redirección y no autenticados, no verificar nuevamente
      const isRedirecting = sessionStorage.getItem('isRedirecting');
      if (isRedirecting === 'true' && !isAuthenticated) {
        console.log('Esperando redirección...');
        setIsCheckingAuth(false);
        return;
      }

      const userStr = localStorage.getItem('user');

      try {
        if (userStr) {
          const user = JSON.parse(userStr);
          const { username, role } = user;

          // Buscar el usuario en Supabase para verificar y actualizar información
          let nombre = username;
          let apellido = '';

          if (username && username.includes('.')) {
            const parts = username.split('.');
            nombre = parts[0];
            apellido = parts[1] || '';
          }

          try {
            const { data, error } = await supabase
              .from('usuarios')
              .select('*')
              .eq('nombre', nombre)
              .eq('apellido', apellido)
              .eq('estado', true) // Asegurar que el usuario esté activo
              .single();

            if (error) {
              console.error('Error al buscar usuario en Supabase:', error);
              setIsAuthenticated(true);
              setUserRole(role);
              setUserName(username);
            } else if (data) {
              // Usuario encontrado en Supabase, actualizar información
              const fullUsername = `${data.nombre}${data.apellido ? '.' + data.apellido : ''}`;

              // Actualizar el último acceso del usuario
              await supabase
                .from('usuarios')
                .update({ ultimo_acceso: new Date().toISOString() })
                .eq('id', data.id);

              // Actualizar datos en localStorage si hay cambios
              if (role !== data.rol || username !== fullUsername) {
                const updatedUser = {
                  username: fullUsername,
                  role: data.rol,
                };
                localStorage.setItem('user', JSON.stringify(updatedUser));
              }

              setIsAuthenticated(true);
              setUserRole(data.rol);
              setUserName(fullUsername);
            } else {
              // Usuario no encontrado, mantener los datos existentes
              setIsAuthenticated(true);
              setUserRole(role);
              setUserName(username);
            }
          } catch (e) {
            // Error al consultar Supabase, usar los datos del localStorage
            console.error('Error en la consulta a Supabase:', e);
            setIsAuthenticated(true);
            setUserRole(role);
            setUserName(username);
          }
        } else {
          // No hay usuario en localStorage, redirigir al login
          // Prevenir redirecciones en bucle
          if (!sessionStorage.getItem('redirectingToLogin')) {
            sessionStorage.setItem('redirectingToLogin', 'true');
            console.log('Redirigiendo al login desde dashboard layout');
            router.push('/');
          }
        }
      } catch (err: unknown) {
        console.error('Error al verificar autenticación:', err);
        // Si hay un error, intentar usar los datos del localStorage si existen
        if (userStr) {
          try {
            const user = JSON.parse(userStr);
            setIsAuthenticated(true);
            setUserRole(user.role);
            setUserName(user.username);
          } catch (e) {
            // Si hay error al parsear, redirigir al login
            if (!sessionStorage.getItem('redirectingToLogin')) {
              sessionStorage.setItem('redirectingToLogin', 'true');
              router.push('/');
            }
          }
        } else {
          if (!sessionStorage.getItem('redirectingToLogin')) {
            sessionStorage.setItem('redirectingToLogin', 'true');
            router.push('/');
          }
        }
      } finally {
        setIsCheckingAuth(false);
        // Limpiar la bandera de redirección al login después de completar la verificación
        if (isAuthenticated) {
          sessionStorage.removeItem('redirectingToLogin');
          sessionStorage.removeItem('isRedirecting');
        }
      }
    }

    // Sólo ejecutar la verificación si no estamos ya autenticados
    if (!isAuthenticated) {
      checkAndSetUser();
    }
  }, [router, isCheckingAuth, isAuthenticated]);

  // Función para cerrar sesión
  const handleLogout = () => {
    // Limpiar todas las banderas y datos de autenticación
    localStorage.removeItem('user');
    localStorage.removeItem('authToken');
    sessionStorage.removeItem('isRedirecting');
    sessionStorage.removeItem('redirectingToLogin');

    // Establece que no estamos autenticados antes de redirigir
    setIsAuthenticated(false);
    setUserRole('');
    setUserName('');

    // Redirigir al login
    router.push('/');
  };

  // Mostrar un indicador de carga mientras se verifica la autenticación
  if (!isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#2d2e83]"></div>
      </div>
    );
  }

  // Verificar si el usuario es visualizador para mostrar mensaje informativo
  const isViewer = userRole === UserRole.VIEWER;

  return (
    <>
      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }

        /* Nuevas animaciones para el sidebar */
        @keyframes slide-in {
          from {
            transform: translateX(-100%);
          }
          to {
            transform: translateX(0);
          }
        }

        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }

        .nav-item {
          position: relative;
          transition: all 0.2s;
          border-radius: 12px;
          margin: 5px 8px;
        }

        .nav-item-active {
          background-color: rgba(255, 255, 255, 0.1);
        }

        .nav-item:hover {
          background-color: rgba(255, 255, 255, 0.1);
        }

        /* Estilos para grupos de navegación con diferentes colores */
        .nav-item-primary {
          border-left: 3px solid #34d399;
          position: relative;
        }

        .nav-item-primary:before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          width: 0;
          height: 100%;
          background-color: rgba(52, 211, 153, 0.1);
          border-radius: 12px;
          transition: width 0.3s ease;
          z-index: -1;
        }

        .nav-item-primary:hover:before {
          width: 100%;
        }

        .nav-item-primary:hover {
          background-color: transparent;
        }

        .nav-item-primary.nav-item-active {
          background-color: rgba(52, 211, 153, 0.2);
        }

        .nav-item-secondary {
          border-left: 3px solid #1976d2;
          position: relative;
        }

        .nav-item-secondary:before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          width: 0;
          height: 100%;
          background-color: rgba(25, 118, 210, 0.1);
          border-radius: 12px;
          transition: width 0.3s ease;
          z-index: -1;
        }

        .nav-item-secondary:hover:before {
          width: 100%;
        }

        .nav-item-secondary:hover {
          background-color: transparent;
        }

        .nav-item-secondary.nav-item-active {
          background-color: rgba(25, 118, 210, 0.2);
        }

        .nav-item-tertiary {
          border-left: 3px solid #ffa726;
          position: relative;
        }

        .nav-item-tertiary:before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          width: 0;
          height: 100%;
          background-color: rgba(255, 167, 38, 0.1);
          border-radius: 12px;
          transition: width 0.3s ease;
          z-index: -1;
        }

        .nav-item-tertiary:hover:before {
          width: 100%;
        }

        .nav-item-tertiary:hover {
          background-color: transparent;
        }

        .nav-item-tertiary.nav-item-active {
          background-color: rgba(255, 167, 38, 0.2);
        }

        .sidebar-container {
          background: #262475;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
          transition: width 0.3s ease;
        }

        .sidebar-header {
          border-bottom: 1px solid rgba(243, 146, 0, 0.4);
          background-color: #1a1a5c;
        }

        .sidebar-user-area {
          background-color: #1a1a5c;
          border-bottom: 2px solid rgba(243, 146, 0, 0.3);
        }

        .user-avatar {
          background: #f39200;
          box-shadow: 0 2px 10px rgba(243, 146, 0, 0.3);
        }

        /* Ocultar scrollbar pero mantener funcionalidad */
        .sidebar-content {
          -ms-overflow-style: none; /* IE and Edge */
          scrollbar-width: none; /* Firefox */
          overflow-y: auto;
        }
        .sidebar-content::-webkit-scrollbar {
          display: none; /* Chrome, Safari, Opera */
        }

        .nav-icon {
          /* Quitar el background-color según lo solicitado */
          /* background-color: rgba(255, 255, 255, 0.1); */
        }

        .nav-item-active .nav-icon {
          /* Quitar también el background-color para el estado activo */
          /* background-color: rgba(255, 255, 255, 0.2); */
        }

        /* Alineación de elementos del sidebar */
        .sidebar-content .nav-item a,
        .sidebar-content .nav-item button {
          justify-content: center;
        }

        .sidebar-content .nav-item a span.nav-icon {
          margin: 0 auto;
        }

        .sidebar-container[class*='w-64'] .nav-item a,
        .sidebar-container[class*='w-64'] .nav-item button {
          justify-content: flex-start;
        }

        .sidebar-container[class*='w-64'] .nav-item a span.nav-icon {
          margin: 0;
        }

        /* Mejoras para el avatar del usuario */
        .sidebar-container:not([class*='w-64']) .user-avatar {
          margin: 0 auto;
        }

        /* Ajustes para modo móvil */
        @media (max-width: 768px) {
          .sidebar-container {
            width: 100% !important;
            max-width: 256px;
          }

          .sidebar-content .nav-item a,
          .sidebar-content .nav-item button {
            justify-content: flex-start;
          }

          .sidebar-content .nav-item a span.nav-icon {
            margin: 0;
          }
        }

        /* Estilo para el logo */
        .logo-container {
          position: relative;
          padding: 8px;
        }

        .logo-container img {
          filter: drop-shadow(0px 2px 3px rgba(0, 0, 0, 0.3));
        }
      `}</style>

      <RouteGuard>
        <div className="flex h-screen bg-white overflow-hidden">
          {/* Sidebar modernizado */}
          <aside
            id="sidebar"
            aria-label="Menú de navegación principal"
            className={`sidebar-container text-white transition-all duration-300 ease-in-out fixed md:static top-0 bottom-0 left-0 z-40 ${
              isMobileMenuOpen ? 'w-64' : isSidebarOpen ? 'w-64' : 'w-20'
            } ${
              isMobileMenuOpen
                ? 'translate-x-0 animate-slide-in shadow-lg'
                : '-translate-x-full md:translate-x-0'
            }`}
          >
            <div className="sidebar-header py-5 px-4 flex justify-between items-center">
              <div className="flex items-center logo-container">
                <Image
                  src="/images/movicarga-logo.png"
                  alt="MoviCarga Logo"
                  width={isSidebarOpen || isMobileMenuOpen ? 180 : 30}
                  height={40}
                  priority
                  className="object-contain brightness-110"
                />
              </div>
              <CustomButton
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                variant="ghost"
                className="p-2 rounded-md hover:bg-white/10 md:block hidden text-white"
                aria-label={isSidebarOpen ? 'Contraer menú lateral' : 'Expandir menú lateral'}
                aria-expanded={isSidebarOpen}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d={isSidebarOpen ? 'M11 19l-7-7 7-7m8 14l-7-7 7-7' : 'M4 6h16M4 12h16M4 18h16'}
                  />
                </svg>
              </CustomButton>
              <CustomButton
                onClick={() => setIsMobileMenuOpen(false)}
                variant="ghost"
                className="p-2 rounded-md hover:bg-white/10 md:hidden text-white"
                aria-label="Cerrar menú lateral"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </CustomButton>
            </div>

            {/* Usuario actual con diseño mejorado */}
            <div className="px-4 py-4 border-b border-white/10 sidebar-user-area">
              <div
                className={`flex items-center ${!isSidebarOpen && !isMobileMenuOpen ? 'justify-center' : ''}`}
              >
                <div className="flex-shrink-0">
                  <div className="user-avatar w-10 h-10 rounded-xl flex items-center justify-center text-white text-lg font-bold">
                    {userName.charAt(0).toUpperCase()}
                  </div>
                </div>
                {(isSidebarOpen || isMobileMenuOpen) && (
                  <div className="ml-3">
                    <p className="text-sm font-medium text-white">{userName}</p>
                    <p className="text-xs text-gray-300 opacity-75">
                      {userRole === UserRole.ADMIN
                        ? 'Administrador'
                        : userRole === UserRole.MANAGER
                          ? 'Gerente'
                          : userRole === UserRole.OPERATOR
                            ? 'Operador'
                            : 'Visualizador'}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="sidebar-content h-[calc(100%-8rem)] pb-20 mt-4">
              <nav className="px-2" aria-label="Menú principal">
                <ul className="space-y-1">
                  {/* Dashboard */}
                  <li
                    className={`nav-item nav-item-primary ${pathname === '/dashboard' ? 'nav-item-active' : ''}`}
                  >
                    <Link
                      href="/dashboard"
                      className={`flex items-center py-3 px-4 rounded-xl transition-colors duration-200 ${pathname === '/dashboard' ? 'text-white' : 'text-gray-300'}`}
                    >
                      <span className="nav-icon flex items-center justify-center w-8 h-8 rounded-lg">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                          />
                        </svg>
                      </span>
                      {(isSidebarOpen || isMobileMenuOpen) && (
                        <span className="ml-3 transition-opacity duration-200">Dashboard</span>
                      )}
                    </Link>
                  </li>

                  {/* Ingresos */}
                  <li
                    className={`nav-item nav-item-primary ${pathname.includes('/ingresos') ? 'nav-item-active' : ''}`}
                  >
                    <Link
                      href="/ingresos"
                      className={`flex items-center py-3 px-4 rounded-xl transition-colors duration-200 ${pathname.includes('/ingresos') ? 'text-white' : 'text-gray-300'}`}
                    >
                      <span className="nav-icon flex items-center justify-center w-8 h-8 rounded-lg">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                          />
                        </svg>
                      </span>
                      {isSidebarOpen && (
                        <span className="ml-3 transition-opacity duration-200 font-medium">
                          Ingresos
                        </span>
                      )}
                    </Link>
                  </li>

                  {/* Egresos */}
                  <li
                    className={`nav-item nav-item-primary ${pathname.includes('/egresos') && !pathname.includes('/egresos-sin-factura') ? 'nav-item-active' : ''}`}
                  >
                    <Link
                      href="/egresos"
                      className={`flex items-center py-3 px-4 rounded-xl transition-colors duration-200 ${pathname.includes('/egresos') && !pathname.includes('/egresos-sin-factura') ? 'text-white' : 'text-gray-300'}`}
                    >
                      <span className="nav-icon flex items-center justify-center w-8 h-8 rounded-lg">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                          />
                        </svg>
                      </span>
                      {isSidebarOpen && (
                        <span className="ml-3 transition-opacity duration-200 font-medium">
                          Egresos
                        </span>
                      )}
                    </Link>
                  </li>

                  {/* Egresos Sin Factura */}
                  <li
                    className={`nav-item nav-item-primary ${pathname.includes('/egresos-sin-factura') ? 'nav-item-active' : ''}`}
                  >
                    <Link
                      href="/egresos-sin-factura"
                      className={`flex items-center py-3 px-4 rounded-xl transition-colors duration-200 ${pathname.includes('/egresos-sin-factura') ? 'text-white' : 'text-gray-300'}`}
                    >
                      <span className="nav-icon flex items-center justify-center w-8 h-8 rounded-lg">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z"
                          />
                        </svg>
                      </span>
                      {isSidebarOpen && (
                        <span className="ml-3 transition-opacity duration-200 font-medium">
                          Egresos Sin Factura
                        </span>
                      )}
                    </Link>
                  </li>

                  {/* Viajes */}
                  <li
                    className={`nav-item nav-item-primary ${pathname.includes('/viajes') ? 'nav-item-active' : ''}`}
                  >
                    <Link
                      href="/viajes"
                      className={`flex items-center py-3 px-4 rounded-xl transition-colors duration-200 ${pathname.includes('/viajes') ? 'text-white' : 'text-gray-300'}`}
                    >
                      <span className="nav-icon flex items-center justify-center w-8 h-8 rounded-lg">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0"
                          />
                        </svg>
                      </span>
                      {isSidebarOpen && (
                        <span className="ml-3 transition-opacity duration-200 font-medium">
                          Viajes
                        </span>
                      )}
                    </Link>
                  </li>

                  {/* Caja Chica */}
                  <li
                    className={`nav-item nav-item-primary ${pathname.includes('/caja-chica') ? 'nav-item-active' : ''}`}
                  >
                    <Link
                      href="/caja-chica"
                      className={`flex items-center py-3 px-4 rounded-xl transition-colors duration-200 ${pathname.includes('/caja-chica') ? 'text-white' : 'text-gray-300'}`}
                    >
                      <span className="nav-icon flex items-center justify-center w-8 h-8 rounded-lg">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </span>
                      {isSidebarOpen && (
                        <span className="ml-3 transition-opacity duration-200 font-medium">
                          Caja Chica
                        </span>
                      )}
                    </Link>
                  </li>

                  {/* Detracciones */}
                  <li
                    className={`nav-item nav-item-secondary ${pathname.includes('/detracciones') ? 'nav-item-active' : ''}`}
                  >
                    <Link
                      href="/detracciones"
                      className={`flex items-center py-3 px-4 rounded-xl transition-colors duration-200 ${pathname.includes('/detracciones') ? 'text-white' : 'text-gray-300'}`}
                    >
                      <span className="nav-icon flex items-center justify-center w-8 h-8 rounded-lg">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                          />
                        </svg>
                      </span>
                      {isSidebarOpen && (
                        <span className="ml-3 transition-opacity duration-200 font-medium">
                          Detracciones
                        </span>
                      )}
                    </Link>
                  </li>

                  {/* Solo mostrar estas opciones si el usuario no es visualizador */}
                  {userRole !== UserRole.VIEWER && (
                    <>
                      {/* Clientes */}
                      <li
                        className={`nav-item nav-item-secondary ${pathname.includes('/clientes') ? 'nav-item-active' : ''}`}
                      >
                        <Link
                          href="/clientes"
                          className={`flex items-center py-3 px-4 rounded-xl transition-colors duration-200 ${pathname.includes('/clientes') ? 'text-white' : 'text-gray-300'}`}
                        >
                          <span className="nav-icon flex items-center justify-center w-8 h-8 rounded-lg">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                              />
                            </svg>
                          </span>
                          {(isSidebarOpen || isMobileMenuOpen) && (
                            <span className="ml-3 transition-opacity duration-200 font-medium">
                              Clientes
                            </span>
                          )}
                        </Link>
                      </li>

                      {/* Vehículos */}
                      <li
                        className={`nav-item nav-item-secondary ${pathname.includes('/vehiculos') ? 'nav-item-active' : ''}`}
                      >
                        <Link
                          href="/vehiculos"
                          className={`flex items-center py-3 px-4 rounded-xl transition-colors duration-200 ${pathname.includes('/vehiculos') ? 'text-white' : 'text-gray-300'}`}
                        >
                          <span className="nav-icon flex items-center justify-center w-8 h-8 rounded-lg">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                              />
                            </svg>
                          </span>
                          {(isSidebarOpen || isMobileMenuOpen) && (
                            <span className="ml-3 transition-opacity duration-200 font-medium">
                              Vehículos
                            </span>
                          )}
                        </Link>
                      </li>

                      {/* Conductores */}
                      <li
                        className={`nav-item nav-item-secondary ${pathname.includes('/conductores') ? 'nav-item-active' : ''}`}
                      >
                        <Link
                          href="/conductores"
                          className={`flex items-center py-3 px-4 rounded-xl transition-colors duration-200 ${pathname.includes('/conductores') ? 'text-white' : 'text-gray-300'}`}
                        >
                          <span className="nav-icon flex items-center justify-center w-8 h-8 rounded-lg">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                              />
                            </svg>
                          </span>
                          {(isSidebarOpen || isMobileMenuOpen) && (
                            <span className="ml-3 transition-opacity duration-200 font-medium">
                              Conductores
                            </span>
                          )}
                        </Link>
                      </li>

                      {/* Lista de Egresos */}
                      <li
                        className={`nav-item nav-item-tertiary ${pathname.includes('/lista-egresos') ? 'nav-item-active' : ''}`}
                      >
                        <Link
                          href="/lista-egresos"
                          className={`flex items-center py-3 px-4 rounded-xl transition-colors duration-200 ${pathname.includes('/lista-egresos') ? 'text-white' : 'text-gray-300'}`}
                        >
                          <span className="nav-icon flex items-center justify-center w-8 h-8 rounded-lg">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                              />
                            </svg>
                          </span>
                          {(isSidebarOpen || isMobileMenuOpen) && (
                            <span className="ml-3 transition-opacity duration-200 font-medium">
                              Lista de Egresos
                            </span>
                          )}
                        </Link>
                      </li>

                      {/* Otras Listas */}
                      <li
                        className={`nav-item nav-item-tertiary ${pathname.includes('/otras-listas') ? 'nav-item-active' : ''}`}
                      >
                        <Link
                          href="/otras-listas"
                          className={`flex items-center py-3 px-4 rounded-xl transition-colors duration-200 ${pathname.includes('/otras-listas') ? 'text-white' : 'text-gray-300'}`}
                        >
                          <span className="nav-icon flex items-center justify-center w-8 h-8 rounded-lg">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                              />
                            </svg>
                          </span>
                          {(isSidebarOpen || isMobileMenuOpen) && (
                            <span className="ml-3 transition-opacity duration-200 font-medium">
                              Otras Listas
                            </span>
                          )}
                        </Link>
                      </li>
                    </>
                  )}

                  {/* Perfil de Usuario - Ocultado del sidebar */}
                  {/* <li className={`nav-item ${pathname.includes("/usuarios/perfil") ? "nav-item-active" : ""}`}>
										<div className="nav-indicator"></div>
										<Link
											href="/usuarios/perfil"
											className={`flex items-center py-3 px-4 rounded-xl transition-colors duration-200 ${pathname.includes("/usuarios/perfil") ? "text-white" : "text-gray-300"}`}>
											<span className="nav-icon flex items-center justify-center w-8 h-8 rounded-lg">
												<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
													<path
														strokeLinecap="round"
														strokeLinejoin="round"
														strokeWidth={2}
														d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z"
													/>
												</svg>
											</span>
											{isSidebarOpen && <span className="ml-3 transition-opacity duration-200 font-medium">Mi Perfil</span>}
										</Link>
									</li> */}

                  {/* Botón de cerrar sesión dentro del sidebar */}
                  <li className="nav-item mt-6">
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full py-3 px-4 rounded-xl transition-colors duration-200 text-red-300 hover:bg-red-500/20 hover:text-red-200"
                    >
                      <span className="nav-icon flex items-center justify-center w-8 h-8 rounded-lg">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                          />
                        </svg>
                      </span>
                      {(isSidebarOpen || isMobileMenuOpen) && (
                        <span className="ml-3 transition-opacity duration-200 font-medium">
                          Cerrar Sesión
                        </span>
                      )}
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          </aside>

          {/* Overlay mejorado para dispositivos móviles */}
          {isMobileMenuOpen && (
            <div
              className="fixed inset-0 bg-gray-900 bg-opacity-50 z-30 md:hidden animate-fade-in"
              onClick={() => setIsMobileMenuOpen(false)}
              aria-hidden="true"
            ></div>
          )}

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
                  aria-controls="sidebar"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-[#2d2e83]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16m-7 6h7"
                    />
                  </svg>
                </button>

                {/* Título de página mejorado para legibilidad */}
                <h1 className="text-xl md:text-2xl font-bold text-[#2d2e83] truncate">
                  {pathname === '/dashboard'
                    ? 'Dashboard'
                    : pathname.includes('/ingresos')
                      ? 'Ingresos'
                      : pathname.includes('/egresos-sin-factura')
                        ? 'Egresos Sin Factura'
                        : pathname.includes('/egresos')
                          ? 'Egresos'
                          : pathname.includes('/detracciones')
                            ? 'Detracciones'
                            : pathname.includes('/vehiculos')
                              ? 'Vehículos'
                              : pathname.includes('/clientes')
                                ? 'Clientes'
                                : pathname.includes('/conductores')
                                  ? 'Conductores'
                                  : pathname.includes('/viajes')
                                    ? 'Viajes'
                                    : pathname.includes('/otras-listas')
                                      ? 'Otras Listas'
                                      : pathname.includes('/usuarios')
                                        ? 'Usuarios'
                                        : pathname.includes('/usuarios/perfil')
                                          ? 'Mi Perfil'
                                          : ''}
                </h1>

                {/* Información y acciones del lado derecho */}
                <div className="flex items-center space-x-4">
                  {/* Indicador de conexión a la BD (solo mostrar aquí, eliminar otros duplicados) */}
                  <SupabaseConnectionStatus />

                  {/* Información de usuario con dropdown */}
                  <div
                    className="text-[#2d2e83] hidden md:flex items-center space-x-2 relative"
                    ref={dropdownRef}
                  >
                    <div
                      onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                      className="flex items-center space-x-2 bg-gray-50 hover:bg-gray-100 px-3 py-2 rounded-md transition-colors cursor-pointer"
                    >
                      <div className="w-8 h-8 rounded-full bg-[#2d2e83] text-white flex items-center justify-center">
                        {userName.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex flex-col text-left">
                        <span className="font-medium text-sm leading-tight truncate max-w-[120px]">
                          {userName || 'Usuario'}
                        </span>
                        <span className="text-xs text-gray-500 leading-tight">
                          {userRole === UserRole.ADMIN
                            ? 'Administrador'
                            : userRole === UserRole.MANAGER
                              ? 'Gerente'
                              : userRole === UserRole.OPERATOR
                                ? 'Operador'
                                : 'Visualizador'}
                        </span>
                      </div>
                      <svg
                        className={`h-4 w-4 text-gray-500 transition-transform ${isUserDropdownOpen ? 'rotate-180' : ''}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </div>

                    {/* Dropdown menu */}
                    {isUserDropdownOpen && (
                      <div className="absolute right-0 top-12 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50 transition-all duration-200 ease-in-out animate-fadeIn">
                        <div className="py-2 px-2 border-b border-gray-100">
                          <p className="text-sm text-gray-600">Conectado como</p>
                          <p className="text-sm font-medium text-gray-900">{userName}</p>
                        </div>
                        <div className="py-1">
                          {userRole === UserRole.ADMIN && (
                            <Link
                              href="/usuarios"
                              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-[#2d2e83] hover:text-white rounded-md transition-colors"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5 mr-2"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                                />
                              </svg>
                              <span>Gestión de Usuarios</span>
                            </Link>
                          )}
                          <Link
                            href="/usuarios/perfil"
                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-[#2d2e83] hover:text-white rounded-md transition-colors"
                          >
                            <span className="nav-icon flex items-center justify-center w-8 h-8 rounded-lg">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                            </span>
                            {(isSidebarOpen || isMobileMenuOpen) && (
                              <span className="ml-3 transition-opacity duration-200 font-medium">
                                Mi Perfil
                              </span>
                            )}
                          </Link>
                        </div>
                        <div className="py-1 border-t border-gray-100">
                          <button
                            onClick={handleLogout}
                            className="flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          >
                            <span className="nav-icon flex items-center justify-center w-8 h-8 rounded-lg">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                                />
                              </svg>
                            </span>
                            {(isSidebarOpen || isMobileMenuOpen) && (
                              <span className="ml-3 transition-opacity duration-200 font-medium">
                                Cerrar Sesión
                              </span>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Botón de cerrar sesión (solo visible en móvil) */}
                  <CustomButton
                    onClick={handleLogout}
                    variant="destructive"
                    className="text-white bg-red-600 hover:bg-red-700 px-3 py-2 rounded-md text-sm font-medium md:hidden"
                    aria-label="Cerrar sesión"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      />
                    </svg>
                  </CustomButton>
                </div>
              </div>
            </header>

            {/* Mensaje de modo visualizador */}
            {isViewer && (
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 m-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-blue-700">
                      Estás en modo visualizador. Solo puedes ver la información, pero no puedes
                      modificarla ni agregar nuevos registros.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Contenido principal */}
            <main className="flex-1 overflow-auto bg-gray-50">
              {/* Contenido */}
              <div className="p-6">{children}</div>
            </main>

            {/* Footer mejorado */}
            <footer className="bg-white p-2 md:p-3 text-center text-[#2d2e83] text-xs border-t">
              &copy; {new Date().getFullYear()} MoviCarga - Sistema de Gestión de Transporte
            </footer>
          </div>

          {/* Contenedor de notificaciones Toast */}
          <Toaster />
        </div>
      </RouteGuard>
    </>
  );
}
