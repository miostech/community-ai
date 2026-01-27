import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configurações otimizadas para Azure Static Web Apps
  // O Azure detecta automaticamente Next.js e gerencia o build
  experimental: {
    // Otimizações para reduzir tempo de inicialização
    optimizePackageImports: ['react', 'react-dom'],
  },
  // Compressão para reduzir tamanho dos assets
  compress: true,
  // Otimizações de produção
  swcMinify: true,
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
