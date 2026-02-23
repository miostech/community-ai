import { ImageResponse } from 'next/og';

export const runtime = 'edge';

/** Ícone colorido (gradiente + D) para atalhos e "Adicionar à tela inicial". */
export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 35%, #ec4899 100%)',
          borderRadius: 24,
        }}
      >
        <span
          style={{
            fontSize: 100,
            fontWeight: 700,
            color: 'white',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          D
        </span>
      </div>
    ),
    {
      width: 180,
      height: 180,
    }
  );
}
