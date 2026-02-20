import { NextRequest, NextResponse } from 'next/server';
import { getSubscriptionsByEmail, listKiwifyProducts } from '@/lib/kiwify';

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

    const { courseIds, customerName } = await getSubscriptionsByEmail(email);

    const body: { courseIds: string[]; customerName?: string; _debug?: Record<string, unknown> } = {
      courseIds,
      ...(customerName && { customerName }),
    };

    if (process.env.NODE_ENV !== 'production') {
      const hasKiwify =
        !!process.env.KIWIFY_CLIENT_ID &&
        !!process.env.KIWIFY_CLIENT_SECRET &&
        !!process.env.KIWIFY_ACCOUNT_ID;
      const produtosDaConta = hasKiwify ? await listKiwifyProducts() : [];
      body._debug = {
        emailRecebido: email?.trim() ? `${String(email).slice(0, 5)}***` : '(vazio)',
        totalIds: courseIds.length,
        ids: courseIds,
        kiwifyConfigurado: hasKiwify,
        produtosDaConta: produtosDaConta.map((p) => ({ id: p.id, name: p.name })),
        dica:
          'Os ids em "ids" são os product_id que este email comprou. Em lib/courses.ts cada curso deve ter kiwifyProductId igual ao id do produto (veja produtosDaConta).',
      };
    }

    return NextResponse.json(body);
  } catch (error) {
    console.error('Erro ao verificar assinaturas Kiwify:', error);
    return NextResponse.json(
      { error: 'Erro ao verificar assinaturas' },
      { status: 500 }
    );
  }
}
