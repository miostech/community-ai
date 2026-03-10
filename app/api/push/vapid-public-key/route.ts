import { NextResponse } from 'next/server';
import { getVapidPublicKey } from '@/lib/push-notifications';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const publicKey = getVapidPublicKey();
  if (!publicKey) {
    const hasPublic = !!process.env.VAPID_PUBLIC_KEY?.trim();
    const hasPrivate = !!process.env.VAPID_PRIVATE_KEY?.trim();
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        '[push] VAPID não configurado. VAPID_PUBLIC_KEY:', hasPublic ? 'ok' : 'faltando',
        '| VAPID_PRIVATE_KEY:', hasPrivate ? 'ok' : 'faltando',
        '| .env.local na raiz do projeto? Reinicie o servidor (npm run dev).'
      );
    }
    return NextResponse.json(
      {
        error: 'Push não configurado',
        hint: 'Adicione VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY e VAPID_MAILTO no .env.local (na raiz do projeto) e reinicie o servidor (Ctrl+C e npm run dev).',
      },
      { status: 503 }
    );
  }
  return NextResponse.json({ publicKey });
}
