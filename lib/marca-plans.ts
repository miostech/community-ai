/**
 * Planos de assinatura do **portal da marca** (diferentes dos planos de criadores de conteúdo).
 * Checkout Kiwify (Dome - Marcas). Opcional: sobrescreva com NEXT_PUBLIC_MARCA_PLAN_CHECKOUT_MONTHLY / YEARLY.
 */
export const MARCA_PLAN_CHECKOUT_URL_MONTHLY_DEFAULT = 'https://pay.kiwify.com.br/PilnBBi';
export const MARCA_PLAN_CHECKOUT_URL_YEARLY_DEFAULT = 'https://pay.kiwify.com.br/PbgknMa';

export const MARCA_PLAN_MONTHLY_BRL = 200;
export const MARCA_PLAN_YEARLY_BRL = 1560;
/** Desconto do anual em relação a 12 × mensal (35%). */
export const MARCA_PLAN_YEARLY_DISCOUNT_PERCENT = 35;

export const MARCA_PLAN_YEARLY_IF_PAID_MONTHLY_BRL = MARCA_PLAN_MONTHLY_BRL * 12;
