import { NextRequest, NextResponse } from 'next/server';

/**
 * Diagnóstico da API Kiwify (só em desenvolvimento).
 * GET /api/kiwify/diagnostico
 * GET /api/kiwify/diagnostico?email=seu@email.com
 *
 * Testa: 1) OAuth token, 2) GET /products, 3) vendas recentes (7 dias),
 * 4) compras do email pelos 4 cursos usando a mesma lógica de produção.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const KIWIFY_BASE = 'https://public-api.kiwify.com/v1';

/** Mesmos IDs que lib/kiwify.ts usa em produção. */
const COURSE_PRODUCT_IDS: Record<string, string[]> = {
  mim: [
    'b28b7a90-b4cf-11ef-9456-6daddced3267',
    '6683aa80-bb2e-11f0-a386-7f084bbfb234',
    '92ff3db0-b1ea-11f0-8ead-2342e472677a',
  ],
  roteiroViral: ['080a7190-ae0f-11f0-84ca-83ece070bd1d'],
  hpa: [
    'c6547980-bb2e-11f0-8751-cd4e443e2330',
    '97204820-d3e9-11ee-b35b-a7756e800fa3',
    'b1d89730-3533-11ee-84fd-bdb8d3fd9bc7',
  ],
  dome: ['b16382c0-0e74-11f1-9a8a-a594d751c201'],
};

const COURSE_NAMES: Record<string, string> = {
  mim: 'Método Influência Milionária',
  roteiroViral: 'Roteiro Viral',
  hpa: 'Hackeando Passagens Aéreas',
  dome: 'DOME',
};

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Rota desabilitada em produção' }, { status: 404 });
  }

  const email = request.nextUrl.searchParams.get('email')?.trim() ?? null;
  const clientId = process.env.KIWIFY_CLIENT_ID?.trim();
  const clientSecret = process.env.KIWIFY_CLIENT_SECRET?.trim();
  const accountId = process.env.KIWIFY_ACCOUNT_ID?.trim();

  const steps: Record<string, unknown> = {};

  // ── 1. Config ──────────────────────────────────────────────────────────────
  steps.config = {
    temClientId: !!clientId,
    temClientSecret: !!clientSecret,
    temAccountId: !!accountId,
    accountIdPrimeirosChars: accountId ? `${accountId.slice(0, 6)}...` : null,
  };

  if (!clientId || !clientSecret || !accountId) {
    return NextResponse.json({
      ok: false,
      mensagem: 'Faltam variáveis no .env.local: KIWIFY_CLIENT_ID, KIWIFY_CLIENT_SECRET, KIWIFY_ACCOUNT_ID',
      steps,
    });
  }

  // ── 2. OAuth token ─────────────────────────────────────────────────────────
  let token: string | null = null;
  try {
    const tokenRes = await fetch(`${KIWIFY_BASE}/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret }).toString(),
    });
    const tokenText = await tokenRes.text();
    steps.oauth = {
      status: tokenRes.status,
      ok: tokenRes.ok,
      body: tokenRes.ok
        ? { tokenLength: (JSON.parse(tokenText) as { access_token?: string }).access_token?.length }
        : tokenText.slice(0, 500),
    };
    if (!tokenRes.ok) {
      return NextResponse.json({
        ok: false,
        mensagem: 'Falha no OAuth. Verifique CLIENT_ID e CLIENT_SECRET.',
        steps,
      });
    }
    token = (JSON.parse(tokenText) as { access_token?: string }).access_token ?? null;
  } catch (e) {
    steps.oauth = { error: String(e) };
    return NextResponse.json({ ok: false, mensagem: 'Erro ao obter token OAuth.', steps }, { status: 500 });
  }

  if (!token) {
    return NextResponse.json({ ok: false, mensagem: 'Resposta OAuth sem access_token.', steps });
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    'x-kiwify-account-id': accountId,
    'Content-Type': 'application/json',
  };

  // ── 3. Produtos da conta ───────────────────────────────────────────────────
  try {
    const productsRes = await fetch(`${KIWIFY_BASE}/products?page_size=10&page_number=1`, { headers });
    const productsText = await productsRes.text();
    const productsData = productsRes.ok ? (JSON.parse(productsText) as { data?: { id?: string; name?: string }[] }) : null;
    const list = productsData?.data ?? [];
    steps.products = {
      status: productsRes.status,
      ok: productsRes.ok,
      totalProdutos: list.length,
      produtos: list.slice(0, 5).map((p) => ({ id: p.id, name: p.name })),
      rawSeErro: !productsRes.ok ? productsText.slice(0, 400) : undefined,
    };
  } catch (e) {
    steps.products = { error: String(e) };
  }

  // ── 4. Vendas dos últimos 7 dias (sanity check da conta) ──────────────────
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const startRecent = `${toDateStr(sevenDaysAgo)} 00:00:00.000`;
  const endRecent = `${toDateStr(now)} 23:59:59.999`;
  try {
    const recentRes = await fetch(
      `${KIWIFY_BASE}/sales?start_date=${encodeURIComponent(startRecent)}&end_date=${encodeURIComponent(endRecent)}&page_size=50&page_number=1`,
      { headers }
    );
    const recentText = await recentRes.text();
    type SaleItem = { customer?: { email?: string }; product?: { id?: string; name?: string }; status?: string; created_at?: string };
    const recentStep: Record<string, unknown> = {
      status: recentRes.status,
      ok: recentRes.ok,
      start_date: startRecent,
      end_date: endRecent,
    };
    if (recentRes.ok) {
      const list = ((JSON.parse(recentText) as { data?: SaleItem[] }).data ?? []);
      recentStep.totalVendas = list.length;
      recentStep.amostraVendas = list.slice(0, 10).map((s) => ({
        created_at: s.created_at,
        status: s.status,
        productName: s.product?.name,
        productId: s.product?.id,
        email: s.customer?.email
          ? (s.customer.email as string).replace(/(.{2})(.*)(@.*)/, '$1***$3')
          : undefined,
      }));
      if (list.length === 0) {
        recentStep.aviso = 'A API devolveu 0 vendas nos últimos 7 dias. Verifique se o KIWIFY_ACCOUNT_ID e a API Key são da conta que recebe as vendas.';
      }
    } else {
      recentStep.rawErro = recentText.slice(0, 500);
    }
    steps.vendasUltimos7Dias = recentStep;
  } catch (e) {
    steps.vendasUltimos7Dias = { error: String(e) };
  }

  // ── 5. Compras do email pelos 4 cursos (mesma lógica de produção) ──────────
  if (email) {
    const emailNorm = email.trim().toLowerCase().normalize('NFC');
    const end = new Date();
    const start = new Date(end);
    start.setUTCFullYear(start.getUTCFullYear() - 1);

    // Pré-calcula janelas de 90 dias do último ano
    const windows: { startStr: string; endStr: string }[] = [];
    let ws = new Date(start.getTime());
    while (ws.getTime() < end.getTime()) {
      const we = new Date(ws.getTime());
      we.setUTCDate(we.getUTCDate() + 90);
      const wd = we > end ? end : we;
      windows.push({ startStr: toDateStr(ws), endStr: toDateStr(wd) });
      ws = new Date(wd.getTime() + 1);
    }

    const cursosEncontrados: Record<string, { productId: string; productName: string; status: string; created_at?: string }[]> = {};

    for (const [cursoKey, productIds] of Object.entries(COURSE_PRODUCT_IDS)) {
      for (const productId of productIds) {
        let found = false;
        for (const { startStr, endStr } of windows) {
          const params = new URLSearchParams({
            product_id: productId,
            start_date: `${startStr} 00:00:00.000`,
            end_date: `${endStr} 23:59:59.999`,
            page_size: '100',
            page_number: '1',
          });
          try {
            const res = await fetch(`${KIWIFY_BASE}/sales?${params.toString()}`, { headers });
            if (!res.ok) continue;
            const data = (await res.json()) as { data?: { customer?: { email?: string }; product?: { id?: string; name?: string }; status?: string; created_at?: string }[] };
            const sales = data.data ?? [];
            for (const sale of sales) {
              const sEmail = (sale.customer?.email ?? '').trim().toLowerCase().normalize('NFC');
              if (sEmail !== emailNorm) continue;
              const paidStatuses = new Set(['paid', 'approved']);
              if (!cursosEncontrados[cursoKey]) cursosEncontrados[cursoKey] = [];
              cursosEncontrados[cursoKey].push({
                productId: sale.product?.id ?? productId,
                productName: sale.product?.name ?? COURSE_NAMES[cursoKey],
                status: sale.status ?? '',
                created_at: sale.created_at,
              });
              if (paidStatuses.has(sale.status ?? '')) { found = true; break; }
            }
          } catch { /* continua */ }
          if (found) break;
        }
        if (found) break; // Não precisa checar outros UUIDs deste curso
      }
    }

    const cursosComprados = Object.entries(cursosEncontrados)
      .filter(([, vendas]) => vendas.some((v) => ['paid', 'approved'].includes(v.status)))
      .map(([cursoKey, vendas]) => ({ curso: COURSE_NAMES[cursoKey], vendas }));

    steps.comprasDoEmail = {
      email,
      periodo: 'último 1 ano (janelas de 90 dias, filtro por product_id)',
      cursosComprados,
      totalCursosComprados: cursosComprados.length,
      dica: cursosComprados.length === 0
        ? 'Nenhum dos 4 cursos encontrado como pago para este email no último ano. Confirme o email exato da compra na Kiwify.'
        : `✅ ${cursosComprados.length} curso(s) encontrado(s) como pago(s).`,
    };
  }

  return NextResponse.json({
    ok: true,
    mensagem: 'Diagnóstico concluído.',
    email: email ?? '(não passado)',
    steps,
  });
}
