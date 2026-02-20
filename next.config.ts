import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone output para deploy no Azure Web App
  // Produz um servidor auto-contido sem precisar de node_modules completo
  output: 'standalone',
  experimental: {
    optimizePackageImports: ['react', 'react-dom'],
  },
  // Compressão para reduzir tamanho dos assets
  compress: true,
  // Configuração de imagens otimizada
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  // Configurações para Azure Static Web Apps
  // Garantir que as rotas de API sejam tratadas corretamente
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, max-age=0',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
