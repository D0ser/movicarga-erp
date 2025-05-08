import { NextRequest, NextResponse } from 'next/server';

// Función para verificar si una ruta debe estar protegida
function isProtectedRoute(pathname: string): boolean {
  // Lista de rutas que no necesitan autenticación
  const publicRoutes = ['/', '/login', '/api/auth/login'];

  // Si es una ruta pública, no necesita protección
  if (publicRoutes.includes(pathname)) {
    return false;
  }

  // Si es una ruta de archivos estáticos, no necesita protección
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/images/') ||
    pathname.includes('favicon.ico')
  ) {
    return false;
  }

  // Si es una ruta de API, podría tener su propia autenticación
  if (pathname.startsWith('/api/')) {
    // Algunas API públicas pueden estar excluidas
    const publicApis = ['/api/auth/login'];
    if (publicApis.includes(pathname)) {
      return false;
    }
    return true;
  }

  // Por defecto, todas las demás rutas están protegidas
  return true;
}

// Función simple para verificar token JWT en el middleware (compatible con Edge Runtime)
function verifyTokenForMiddleware(token: string): boolean {
  if (!token) return false;

  try {
    // Para tokens personalizados que usamos como fallback
    if (
      token.startsWith('DEV_CLIENT_TOKEN.') ||
      token.startsWith('FALLBACK.') ||
      token.startsWith('EMERGENCY_FALLBACK_TOKEN.')
    ) {
      const parts = token.split('.');
      if (parts.length >= 2) {
        // Intentar decodificar el payload
        const payloadBase64 = parts[1];
        const payload = JSON.parse(atob(payloadBase64));

        // Verificar expiración
        if (payload.exp) {
          const now = Date.now() / 1000;
          if (typeof payload.exp === 'number' && payload.exp < now) {
            return false; // Token expirado
          }
          // Si la expiración está como ISO string
          if (typeof payload.exp === 'string') {
            const expDate = new Date(payload.exp).getTime() / 1000;
            if (expDate < now) {
              return false; // Token expirado
            }
          }
        }
        return true; // Token válido
      }
    }

    // Para los tokens JWT estándar, solo verificamos su existencia
    // La verificación completa se hará en el servidor
    return true;
  } catch (error) {
    console.error('Error verificando token en middleware:', error);
    return false;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Verificar si la ruta necesita estar protegida
  if (!isProtectedRoute(pathname)) {
    return NextResponse.next();
  }

  // Comprobar si existe un token de autenticación
  const authToken =
    request.cookies.get('authToken')?.value || request.headers.get('authorization')?.split(' ')[1];

  // Si no hay token, redirigir al login
  if (!authToken) {
    const url = new URL('/', request.url);
    return NextResponse.redirect(url);
  }

  // Verificar si el token es válido usando nuestra función compatible con Edge
  const isValidToken = verifyTokenForMiddleware(authToken);
  if (!isValidToken) {
    // Token inválido o expirado, redirigir al login
    const url = new URL('/', request.url);
    return NextResponse.redirect(url);
  }

  // Si hay token válido, permitir el acceso
  return NextResponse.next();
}

// Configurar qué rutas deben ser procesadas por el middleware
export const config = {
  matcher: [
    // Excluir archivos estáticos y rutas API específicas que no requieren autenticación
    '/((?!_next|images|favicon.ico|api/auth/login).*)',
  ],
};
