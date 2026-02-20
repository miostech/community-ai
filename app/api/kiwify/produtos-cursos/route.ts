import { NextResponse } from 'next/server';
import { listKiwifyProducts } from '@/lib/kiwify';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/kiwify/produtos-cursos
 * Lista todos os produtos da conta e devolve os que correspondem a
 * Roteiro Viral, HPA e MIM (por nome), para usar em kiwifyProductIds.
 * Só em desenvolvimento.
 */
export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Rota desabilitada em produção' }, { status: 404 });
  }

  const products = await listKiwifyProducts();
  const norm = (s: string) => (s ?? '').toLowerCase().normalize('NFC');

  const roteiroViral = products.filter(
    (p) =>
      norm(p.name).includes('roteiro') ||
      norm(p.name).includes('viral')
  );
  const hpa = products.filter(
    (p) =>
      norm(p.name).includes('hpa') ||
      norm(p.name).includes('hackeando') ||
      norm(p.name).includes('passagens')
  );
  const mim = products.filter(
    (p) =>
      norm(p.name).includes('método influência') ||
      norm(p.name).includes('milionária') ||
      norm(p.name).includes('milionaria')
  );

  return NextResponse.json({
    ok: true,
    totalProdutos: products.length,
    roteiroViral: roteiroViral.map((p) => ({ id: p.id, name: p.name })),
    hpa: hpa.map((p) => ({ id: p.id, name: p.name })),
    mim: mim.map((p) => ({ id: p.id, name: p.name })),
    todos: products.map((p) => ({ id: p.id, name: p.name })),
  });
}
