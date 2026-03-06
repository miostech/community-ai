/**
 * Mapeamento de product_id Kiwify para slug do plano Dome.
 * Preencher os IDs a partir do dashboard Kiwify ou listKiwifyProducts().
 * Ordem de prioridade: anual > semestral > mensal (maior benefício primeiro).
 */

export type DomePlanSlug = 'dome-mensal' | 'dome-semestral' | 'dome-anual';

/** product_id(s) da Kiwify por plano. Atualizar quando os IDs reais forem conhecidos. */
export const PLAN_PRODUCT_IDS: Record<DomePlanSlug, string[]> = {
  'dome-anual': [],
  'dome-semestral': [],
  'dome-mensal': [
    'b16382c0-0e74-11f1-9a8a-a594d751c201', // DOME (legado / genérico)
  ],
};

/** Ordem de prioridade para escolher o plano quando há múltiplas compras. */
const PLAN_PRIORITY: DomePlanSlug[] = ['dome-anual', 'dome-semestral', 'dome-mensal'];

/** Mapa product_id → planSlug para lookup rápido. */
const PRODUCT_ID_TO_PLAN = ((): Record<string, DomePlanSlug> => {
  const map: Record<string, DomePlanSlug> = {};
  for (const slug of PLAN_PRIORITY) {
    for (const id of PLAN_PRODUCT_IDS[slug]) {
      if (id) map[id.toLowerCase().trim()] = slug;
    }
  }
  return map;
})();

/**
 * Dado uma lista de product_ids comprados (ex.: retorno de getSubscriptionsByEmail
 * ou AccountPayment), retorna o slug do plano Dome de maior prioridade, ou null.
 */
export function getPlanSlugFromProductIds(productIds: string[]): DomePlanSlug | null {
  if (!productIds?.length) return null;
  const normalized = productIds.map((id) => id.toLowerCase().trim());
  for (const slug of PLAN_PRIORITY) {
    if (PLAN_PRODUCT_IDS[slug].some((id) => normalized.includes(id.toLowerCase().trim()))) {
      return slug;
    }
  }
  return null;
}

/**
 * Dado um product_id único (ex.: de AccountPayment), retorna o slug do plano ou null.
 */
export function getPlanSlugFromProductId(productId: string): DomePlanSlug | null {
  if (!productId?.trim()) return null;
  return PRODUCT_ID_TO_PLAN[productId.toLowerCase().trim()] ?? null;
}

/**
 * Tenta inferir plano a partir de product_name (webhook/AccountPayment).
 * Útil quando product_id não está no mapeamento mas o nome contém "anual", "semestral", "mensal".
 */
export function getPlanSlugFromProductName(productName: string): DomePlanSlug | null {
  if (!productName?.trim()) return null;
  const name = productName.toLowerCase();
  if (/\banual\b/.test(name)) return 'dome-anual';
  if (/\bsemestral\b/.test(name)) return 'dome-semestral';
  if (/\bmensal\b/.test(name)) return 'dome-mensal';
  if (/dome/i.test(name)) return 'dome-mensal'; // fallback genérico
  return null;
}
