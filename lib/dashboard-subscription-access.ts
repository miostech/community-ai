import type { Account } from '@/contexts/AccountContext';

const STAFF_ROLES: Array<NonNullable<Account['role']>> = ['moderator', 'admin', 'criador'];

function normalizeDashboardPath(href: string): string {
    const pathOnly = href.startsWith('http')
        ? new URL(href).pathname
        : href.split('?')[0].split('#')[0];
    if (pathOnly.length > 1 && pathOnly.endsWith('/')) {
        return pathOnly.replace(/\/+$/, '') || '/dashboard';
    }
    return pathOnly;
}

/** Rotas de ferramentas internas — staff acessa sem assinatura à comunidade. */
function isStaffBypassRoute(normalizedPath: string): boolean {
    return (
        normalizedPath.startsWith('/dashboard/admin') ||
        normalizedPath.startsWith('/dashboard/influenciadores') ||
        normalizedPath.startsWith('/dashboard/mensagens')
    );
}

function hasStaffRole(account: Pick<Account, 'role'> | null): boolean {
    const r = account?.role;
    return r != null && STAFF_ROLES.includes(r as NonNullable<Account['role']>);
}

/**
 * Hub, perfil, assinatura e (para staff) admin/DM/influenciadores ficam sem exigência de plano da comunidade.
 */
export function isDashboardRouteAccessibleWithoutSubscription(
    hrefOrPathname: string | null | undefined,
    account: Pick<Account, 'role'> | null
): boolean {
    if (!hrefOrPathname) return false;
    const p = normalizeDashboardPath(hrefOrPathname);
    if (!p.startsWith('/dashboard')) return true;

    if (p === '/dashboard') return true;
    if (p === '/dashboard/perfil' || p.startsWith('/dashboard/perfil/')) return true;
    if (p === '/dashboard/assinatura' || p.startsWith('/dashboard/assinatura/')) return true;

    if (hasStaffRole(account) && isStaffBypassRoute(p)) return true;

    return false;
}

export function destinationPathFromHref(href: string): string {
    return normalizeDashboardPath(href);
}
