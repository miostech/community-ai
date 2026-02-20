import { NextRequest, NextResponse } from 'next/server';
import { getSubscriptionsByEmail, listKiwifyProducts } from '@/lib/kiwify';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Rota de teste da integração Kiwify (só em desenvolvimento).
 * GET /api/kiwify/test?email=seu@email.com
 * Retorna compras do email e a lista de produtos da conta (para conferir IDs).
 * GET /api/kiwify/test?email=seu@email.com&products=1  — inclui lista de produtos.
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
        products: 'Adicione &products=1 para listar os produtos da conta (id + nome) e conferir os IDs.',
      },
      { status: 400 }
    );
  }

  try {
    const includeProducts = request.nextUrl.searchParams.get('products') === '1';
    const [result, products] = await Promise.all([
      getSubscriptionsByEmail(email),
      includeProducts ? listKiwifyProducts() : Promise.resolve([]),
    ]);
    const { courseIds, customerName } = result;
    const body: Record<string, unknown> = {
      ok: true,
      email,
      courseIds,
      customerName: customerName ?? null,
      mensagem:
        courseIds.length > 0
          ? `Este email tem ${courseIds.length} compra(s) na Kiwify.`
          : 'Nenhuma compra encontrada para este email nos últimos 12 meses. Use o mesmo email da compra na Kiwify.',
    };
    if (includeProducts && products.length > 0) {
      body.produtosDaConta = products;
      body.dica = 'Confira se os courseIds acima batem com o id dos produtos. No app, cada curso tem kiwifyProductId em lib/courses.ts e nas páginas de cursos.';
    }
    return NextResponse.json(body);
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
