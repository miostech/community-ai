import { NextRequest, NextResponse } from 'next/server';
import { getSubscriptionsByEmail } from '@/lib/kiwify';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Rota de teste da integração Kiwify (só em desenvolvimento).
 * GET /api/kiwify/test?email=seu@email.com
 * Retorna se a API está configurada e quais produtos esse email comprou.
 */
export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Rota de teste desabilitada em produção' }, { status: 404 });
  }

  const email = request.nextUrl.searchParams.get('email')?.trim();
  if (!email) {
    return NextResponse.json(
      {
        error: 'Passe o email na URL: /api/kiwify/test?email=email@quecomprou.com',
        exemplo: '/api/kiwify/test?email=seu@email.com',
      },
      { status: 400 }
    );
  }

  try {
    const { courseIds, customerName } = await getSubscriptionsByEmail(email);
    return NextResponse.json({
      ok: true,
      email,
      courseIds,
      customerName: customerName ?? null,
      mensagem:
        courseIds.length > 0
          ? `Este email tem ${courseIds.length} compra(s) na Kiwify. Pode usar no login.`
          : 'Nenhuma compra encontrada para este email nos últimos 12 meses.',
    });
  } catch (err) {
    console.error('[Kiwify test]', err);
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : 'Erro ao consultar Kiwify',
      },
      { status: 500 }
    );
  }
}
