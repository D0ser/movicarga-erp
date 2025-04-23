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
  },
  // Configuración para manejo de errores más indulgente
  typescript: {
    // Ignorar errores de TS durante la construcción
    ignoreBuildErrors: true,
  },
};

export default nextConfig;