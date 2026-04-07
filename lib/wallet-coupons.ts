/** Recarga mínima permitida na carteira da marca (centavos BRL). R$ 500,00 */
export const MIN_WALLET_RECHARGE_CENTS = 50_000;

/** Cupons de bônus na recarga da carteira (marca). IDs estáveis para metadata Stripe. */
export type WalletTopUpCoupon = {
    id: string;
    title: string;
    /** Valor pago mínimo (centavos) para o cupom valer */
    minDepositCents: number;
    bonusCents: number;
};

/** Ordem: menor depósito mínimo primeiro. */
export const WALLET_TOP_UP_COUPONS: WalletTopUpCoupon[] = [
    { id: 'first_deposit_50', title: 'Cupom de primeiro depósito', minDepositCents: 60_000, bonusCents: 5_000 },
    { id: 'bonus_150_min_3k', title: 'Bônus de R$150', minDepositCents: 300_000, bonusCents: 15_000 },
    { id: 'bonus_250_min_5k', title: 'Bônus de R$250', minDepositCents: 500_000, bonusCents: 25_000 },
];

export function getWalletTopUpCouponById(id: string | undefined | null): WalletTopUpCoupon | undefined {
    if (!id || typeof id !== 'string') return undefined;
    return WALLET_TOP_UP_COUPONS.find((c) => c.id === id);
}
