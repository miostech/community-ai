import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Dome - Cúpula de criadores de conteúdo',
    short_name: 'Dome',
    description: 'Comunidade exclusiva para criadores que querem crescer com estratégia, consistência e autoridade nas redes.',
    start_url: '/',
    display: 'standalone',
    background_color: '#000000',
    theme_color: '#3b82f6',
    icons: [
      {
        src: '/apple-touch-icon',
        sizes: '180x180',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  };
}
