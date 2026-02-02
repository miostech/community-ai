import { NextRequest, NextResponse } from 'next/server';
import { getSubscriptionsByEmail } from '@/lib/kiwify';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email é obrigatório' },
        { status: 400 }
      );
    }

    const { courseIds } = await getSubscriptionsByEmail(email);
    return NextResponse.json({ courseIds });
  } catch (error) {
    console.error('Erro ao verificar assinaturas Kiwify:', error);
    return NextResponse.json(
      { error: 'Erro ao verificar assinaturas' },
      { status: 500 }
    );
  }
}
