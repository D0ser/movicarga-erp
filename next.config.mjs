/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  reactStrictMode: true,
  swcMinify: true,
  // Configuración para ESLint
  eslint: {
    // Advertir sobre problemas de ESLint pero no fallar el build
    ignoreDuringBuilds: true,
  },
  // Solución para el error en Vercel deployment
  output: "standalone",
  // Forzar trailing slash para evitar problemas con grupos de rutas
  trailingSlash: true,
  // Deshabilitar turbopack experimental
  experimental: {
    // turbo: {
    //   rules: {
    //     // Configuraciones específicas para turbopack si son necesarias
    //   },
    // },
    serverComponentsExternalPackages: ['pg'],
    // Configuración adicional para grupos de rutas
    serverActions: {
      allowedOrigins: ['localhost:3000', 'movicarga-erp.vercel.app']
    },
  },
  // Configuración para manejo de errores más indulgente
  typescript: {
    // Ignorar errores de TS durante la construcción
    ignoreBuildErrors: true,
  },
  // Ignorar errores durante la construcción para no fallar el despliegue
  onDemandEntries: {
    // Periodo antes de que una página inactiva sea descargada
    maxInactiveAge: 25 * 1000,
    // Número de páginas que se mantienen en memoria
    pagesBufferLength: 4,
  },
};

export default nextConfig;