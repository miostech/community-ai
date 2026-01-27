import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Removido output: 'standalone' para evitar timeout no Azure Static Web Apps
  // O Azure Static Web Apps gerencia o build automaticamente para Next.js
};

export default nextConfig;
