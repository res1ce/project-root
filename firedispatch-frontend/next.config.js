/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Отключаем проверку ESLint при сборке
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Отключаем проверку типов TypeScript при сборке
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;
