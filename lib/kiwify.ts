/**
 * Integração com a API pública da Kiwify.
 * Usa OAuth para obter token e "Listar vendas" para verificar compras por email.
 * Documentação: https://docs.kiwify.com.br/api-reference/general
 */

const KIWIFY_BASE = 'https://public-api.kiwify.com/v1';
const KIWIFY_CLIENT_ID = process.env.KIWIFY_CLIENT_ID?.trim();
const KIWIFY_CLIENT_SECRET = process.env.KIWIFY_CLIENT_SECRET?.trim();
const KIWIFY_ACCOUNT_ID = process.env.KIWIFY_ACCOUNT_ID?.trim();

/** Status de venda considerados "pago" para dar acesso. Só paid e approved (não processing, authorized nem cancelado/refunded). */
const PAID_STATUSES = new Set(['paid', 'approved']);

/** Token OAuth em cache (expira em 24h) */
let cachedToken: { access_token: string; expires_at: number } | null = null;

function isConfigured(): boolean {
  return !!(KIWIFY_CLIENT_ID && KIWIFY_CLIENT_SECRET && KIWIFY_ACCOUNT_ID);
}

async function getAccessToken(): Promise<string | null> {
  if (!KIWIFY_CLIENT_ID || !KIWIFY_CLIENT_SECRET) return null;

  const now = Date.now();
  if (cachedToken && cachedToken.expires_at > now + 60_000) {
    return cachedToken.access_token;
  }

  try {
    const body = new URLSearchParams({
      client_id: KIWIFY_CLIENT_ID,
      client_secret: KIWIFY_CLIENT_SECRET,
    });
    const res = await fetch(`${KIWIFY_BASE}/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });
    if (!res.ok) {
      console.warn('[Kiwify] OAuth token error:', res.status, await res.text());
      return null;
    }
    const data = (await res.json()) as { access_token?: string; expires_in?: number };
    const token = data.access_token;
    const expiresIn = (data.expires_in ?? 86400) * 1000;
    if (token) {
      cachedToken = { access_token: token, expires_at: now + expiresIn };
      return token;
    }
  } catch (err) {
    console.error('[Kiwify] getAccessToken:', err);
  }
  return null;
}

interface KiwifySale {
  id?: string;
  status?: string;
  customer?: { email?: string; name?: string };
  product?: { id?: string; name?: string };
}

export type SubscriptionsByEmailResult = {
  courseIds: string[];
  customerName?: string;
};

/**
 * Normaliza email para comparação (trim, lowercase, NFC).
 */
function normalizeEmail(email: string): string {
  return (email ?? '').trim().toLowerCase().normalize('NFC');
}

/**
 * Lista vendas em um intervalo e retorna productIds + nome do cliente da primeira venda encontrada.
 */
async function listSalesByEmail(
  accessToken: string,
  email: string,
  startDate: string,
  endDate: string
): Promise<{ productIds: string[]; customerName?: string }> {
  const productIds: string[] = [];
  let customerName: string | undefined;
  const normalizedEmail = normalizeEmail(email);
  let page = 1;
  const pageSize = 100;

  while (true) {
    const params = new URLSearchParams({
      start_date: startDate,
      end_date: endDate,
      page_size: String(pageSize),
      page_number: String(page),
    });
    const url = `${KIWIFY_BASE}/sales?${params.toString()}`;
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'x-kiwify-account-id': KIWIFY_ACCOUNT_ID!,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      console.warn('[Kiwify] List sales error:', res.status, await res.text());
      break;
    }

    const data = (await res.json()) as {
      data?: KiwifySale[];
      pagination?: { page_number?: number; count?: number };
    };
    const sales = data.data ?? [];
    const pagination = data.pagination ?? {};

    for (const sale of sales) {
      const customerEmail = normalizeEmail(sale.customer?.email ?? '');
      if (customerEmail !== normalizedEmail) continue;
      if (!PAID_STATUSES.has(sale.status ?? '')) continue;
      if (!customerName && sale.customer?.name?.trim()) {
        customerName = sale.customer.name.trim();
      }
      const productId = sale.product?.id;
      if (productId && !productIds.includes(productId)) productIds.push(productId);
    }

    const count = pagination.count ?? sales.length;
    if (sales.length < pageSize || count < pageSize) break;
    page += 1;
    if (page > 50) break;
  }

  return { productIds, customerName };
}

/**
 * Busca os IDs de produtos que o email comprou (status pago) e o nome do cliente.
 * Janelas de 90 dias; busca da mais recente para a mais antiga para priorizar vendas recentes.
 * Para incluir "hoje" por timezone, na última janela usa end_date = dia seguinte.
 */
export async function getSubscriptionsByEmail(email: string): Promise<SubscriptionsByEmailResult> {
  if (!email?.trim()) return { courseIds: [] };

  if (!isConfigured()) {
    if (
      process.env.NODE_ENV !== 'production' &&
      (email === 'usuario@email.com' || /teste|test/i.test(email))
    ) {
      return { courseIds: ['96dk0GP'] };
    }
    return { courseIds: [] };
  }

  const accessToken = await getAccessToken();
  if (!accessToken) return { courseIds: [] };

  const allProductIds: string[] = [];
  let firstCustomerName: string | undefined;
  const end = new Date();
  let start = new Date(end);
  start.setFullYear(start.getFullYear() - 1);

  while (start < end) {
    const windowEnd = new Date(start);
    windowEnd.setDate(windowEnd.getDate() + 90);
    const endDate = windowEnd > end ? end : windowEnd;
    const startStr = start.toISOString().slice(0, 10);
    const isLastWindow = endDate.getTime() >= end.getTime() - 86400000;
    const endStr = isLastWindow
      ? new Date(end.getTime() + 86400000).toISOString().slice(0, 10)
      : endDate.toISOString().slice(0, 10);

    const { productIds, customerName } = await listSalesByEmail(
      accessToken,
      email,
      startStr,
      endStr
    );
    for (const id of productIds) {
      if (!allProductIds.includes(id)) allProductIds.push(id);
    }
    if (!firstCustomerName && customerName) firstCustomerName = customerName;
    start = new Date(endDate.getTime() + 1);
  }

  return { courseIds: allProductIds, customerName: firstCustomerName };
}

export interface KiwifySubscriptionResult {
  courseIds: string[];
  hasAccess: boolean;
  customerName?: string;
}

export async function hasKiwifyPurchase(email: string): Promise<KiwifySubscriptionResult> {
  const { courseIds, customerName } = await getSubscriptionsByEmail(email);
  return {
    courseIds,
    hasAccess: courseIds.length > 0,
    customerName,
  };
}
