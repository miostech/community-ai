/**
 * Regra do badge de "Assinante Dome" (plano pago ativo).
 * Para evitar poluição visual, o badge de assinante NÃO é exibido para quem já tem
 * um badge próprio (staff: moderator/admin/criador) ou de membro fundador.
 */

export type BadgeRole = 'user' | 'moderator' | 'admin' | 'criador' | 'marca' | null | undefined;

export function isStaffBadgeRole(role: BadgeRole): boolean {
    return role === 'moderator' || role === 'admin' || role === 'criador';
}

export function showSubscriberBadge(author: {
    subscription_active?: boolean;
    role?: BadgeRole;
    is_founding_member?: boolean;
}): boolean {
    return (
        author.subscription_active === true &&
        !isStaffBadgeRole(author.role) &&
        author.is_founding_member !== true
    );
}

export const SUBSCRIBER_BADGE_LABEL = 'Membro Premium';
export const SUBSCRIBER_BADGE_ICON = '/images/cursos/premium-account.png';
