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
  // Configuración para turbopack si es necesario
  experimental: {
    turbo: {
      rules: {
        // Configuraciones específicas para turbopack si son necesarias
      },
    },
  },
};

export default nextConfig;