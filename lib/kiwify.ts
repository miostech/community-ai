/**
 * Integração com a API pública da Kiwify.
 * Usa OAuth para obter token e "Listar vendas" para verificar compras por email.
 * Documentação: https://docs.kiwify.com.br/api-reference/general
 */

/**
 * Extrai o ID do produto/checkout da URL da Kiwify (ex: pay.kiwify.com.br/ABC123?afid=... → ABC123).
 * Use sempre a kiwifyUrl como fonte da verdade; o ID é derivado dela.
 */
export function getKiwifyIdFromUrl(url: string): string {
  try {
    const path = new URL(url).pathname;
    return path.replace(/^\//, '').split('/')[0]?.trim() ?? '';
  } catch {
    return '';
  }
}

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

/** Formato de data em UTC (YYYY-MM-DD) para alinhar com a API Kiwify. */
function toDateString(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Formato com hora em UTC (doc Kiwify: "2020-07-10 15:00:00.000"). */
function toKiwifyDateTime(d: Date, endOfDay: boolean): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  if (endOfDay) return `${y}-${m}-${day} 23:59:59.999`;
  return `${y}-${m}-${day} 00:00:00.000`;
}

/**
 * IDs de produto (UUIDs da API) para cada curso que verificamos acesso.
 * A API filtra por product_id no servidor → muito menos dados por chamada.
 * Atualizar aqui sempre que novos UUIDs de um curso forem identificados.
 */
const COURSE_PRODUCT_IDS: Record<string, string[]> = {
  mim: [
    'b28b7a90-b4cf-11ef-9456-6daddced3267', // Método Influência Milionária (original)
    '6683aa80-bb2e-11f0-a386-7f084bbfb234', // Método Influencia Milionária Oficial
    '92ff3db0-b1ea-11f0-8ead-2342e472677a', // Formação Milionária Anônima
  ],
  roteiroViral: [
    '080a7190-ae0f-11f0-84ca-83ece070bd1d', // Roteiro Viral
  ],
  hpa: [
    'c6547980-bb2e-11f0-8751-cd4e443e2330', // Haqueando Passagens Aereas
    '97204820-d3e9-11ee-b35b-a7756e800fa3', // Hackeando Passagens Aéreas
    'b1d89730-3533-11ee-84fd-bdb8d3fd9bc7', // Faturando Alto - Passagens Áreas
  ],
  dome: [
    'b16382c0-0e74-11f1-9a8a-a594d751c201', // DOME
  ],
};

/** Todos os UUIDs dos cursos que verificamos, em lista plana. */
const ALL_COURSE_PRODUCT_IDS = Object.values(COURSE_PRODUCT_IDS).flat();

/**
 * Verifica se o email comprou um produto específico em um intervalo (máx. 90 dias).
 * Usa product_id no filtro da API → a Kiwify filtra no servidor, muito menos dados.
 * Retorna o nome do cliente se encontrado.
 */
async function checkProductPurchaseInRange(
  accessToken: string,
  productId: string,
  email: string,
  startDate: string,
  endDate: string
): Promise<{ bought: boolean; customerName?: string }> {
  const normalizedEmail = normalizeEmail(email);
  const startWithTime = `${startDate} 00:00:00.000`;
  const endWithTime = `${endDate} 23:59:59.999`;
  let page = 1;

  while (true) {
    const params = new URLSearchParams({
      product_id: productId,
      start_date: startWithTime,
      end_date: endWithTime,
      page_size: '100',
      page_number: String(page),
    });
    const res = await fetch(`${KIWIFY_BASE}/sales?${params.toString()}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'x-kiwify-account-id': KIWIFY_ACCOUNT_ID!,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[Kiwify] checkProductPurchaseInRange error:', res.status, productId);
      }
      return { bought: false };
    }

    const data = (await res.json()) as {
      data?: KiwifySale[];
      pagination?: { count?: number };
    };
    const sales = data.data ?? [];

    for (const sale of sales) {
      if (normalizeEmail(sale.customer?.email ?? '') !== normalizedEmail) continue;
      if (!PAID_STATUSES.has(sale.status ?? '')) continue;
      return { bought: true, customerName: sale.customer?.name?.trim() };
    }

    const count = data.pagination?.count ?? sales.length;
    if (sales.length < 100 || count < 100) break;
    page += 1;
    if (page > 20) break;
  }
  return { bought: false };
}

/**
 * Busca os IDs de produtos que o email comprou (status pago).
 * Estratégia: verifica apenas os 4 cursos do site usando product_id filter da API.
 * Cada UUID faz 4 chamadas (janelas de 90 dias em 1 ano) → no máximo ~36 chamadas
 * para todos os UUIDs dos 4 cursos. Muito abaixo do rate limit de 100 req/min.
 */
export async function getSubscriptionsByEmail(email: string): Promise<SubscriptionsByEmailResult> {
  if (!email?.trim()) return { courseIds: [] };

  if (!isConfigured()) {
    if (
      process.env.NODE_ENV !== 'production' &&
      (email === 'usuario@email.com' || /teste|test/i.test(email))
    ) {
      return { courseIds: ['yjHjvnY', 'cGQaf5s', '0c193809-a695-4f39-bc7b-b4e2794274a9'] };
    }
    return { courseIds: [] };
  }

  const accessToken = await getAccessToken();
  if (!accessToken) return { courseIds: [] };

  const boughtProductIds: string[] = [];
  let firstCustomerName: string | undefined;

  const end = new Date();
  const start = new Date(end);
  start.setUTCFullYear(start.getUTCFullYear() - 1);

  // Pré-calcula as janelas de 90 dias para reutilizar em cada produto
  const windows: Array<{ startStr: string; endStr: string }> = [];
  let windowStart = new Date(start.getTime());
  while (windowStart.getTime() < end.getTime()) {
    const windowEnd = new Date(windowStart.getTime());
    windowEnd.setUTCDate(windowEnd.getUTCDate() + 90);
    const endDate = windowEnd > end ? end : windowEnd;
    windows.push({ startStr: toDateString(windowStart), endStr: toDateString(endDate) });
    windowStart = new Date(endDate.getTime() + 1);
  }

  // Para cada UUID dos 4 cursos, verifica se o email comprou (para na primeira janela encontrada)
  for (const productId of ALL_COURSE_PRODUCT_IDS) {
    if (boughtProductIds.includes(productId)) continue;
    for (const { startStr, endStr } of windows) {
      const { bought, customerName } = await checkProductPurchaseInRange(
        accessToken,
        productId,
        email,
        startStr,
        endStr
      );
      if (bought) {
        boughtProductIds.push(productId);
        if (!firstCustomerName && customerName) firstCustomerName = customerName;
        break; // Não precisa checar mais janelas para este produto
      }
    }
  }

  if (process.env.NODE_ENV !== 'production' && email) {
    console.log('[Kiwify] getSubscriptionsByEmail:', {
      email: email.slice(0, 5) + '***',
      totalProductIds: boughtProductIds.length,
      ids: boughtProductIds,
    });
  }
  return { courseIds: boughtProductIds, customerName: firstCustomerName };
}

export interface KiwifySubscriptionResult {
  courseIds: string[];
  hasAccess: boolean;
  customerName?: string;
}

/** Lista produtos da conta (para mapear product.id das vendas com os nomes/cursos). */
export async function listKiwifyProducts(): Promise<{ id: string; name: string }[]> {
  if (!isConfigured()) return [];
  const accessToken = await getAccessToken();
  if (!accessToken) return [];
  const out: { id: string; name: string }[] = [];
  let page = 1;
  const pageSize = 100;
  while (true) {
    const params = new URLSearchParams({ page_size: String(pageSize), page_number: String(page) });
    const res = await fetch(`${KIWIFY_BASE}/products?${params.toString()}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'x-kiwify-account-id': KIWIFY_ACCOUNT_ID!,
        'Content-Type': 'application/json',
      },
    });
    if (!res.ok) break;
    const data = (await res.json()) as { data?: { id?: string; name?: string }[]; pagination?: { count?: number } };
    const list = data.data ?? [];
    for (const p of list) {
      if (p.id && p.name) out.push({ id: p.id, name: p.name });
    }
    if (list.length < pageSize) break;
    page += 1;
    if (page > 20) break;
  }
  return out;
}

export async function hasKiwifyPurchase(email: string): Promise<KiwifySubscriptionResult> {
  const { courseIds, customerName } = await getSubscriptionsByEmail(email);
  return {
    courseIds,
    hasAccess: courseIds.length > 0,
    customerName,
  };
}
