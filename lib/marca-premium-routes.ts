export { MARCA_PLAN_MONTHLY_BRL as MARCA_PORTAL_SUBSCRIPTION_MONTHLY_BRL } from './marca-plans';

export type MarcaPremiumFeatureId = 'comunidades' | 'criadores' | 'tracking';

const PREFIXES: { prefix: string; feature: MarcaPremiumFeatureId }[] = [
    { prefix: '/marca/comunidades', feature: 'comunidades' },
    { prefix: '/marca/criadores', feature: 'criadores' },
    { prefix: '/marca/tracking', feature: 'tracking' },
];

export function getMarcaPremiumFeatureForPath(pathname: string): MarcaPremiumFeatureId | null {
    const p = pathname || '';
    const hit = PREFIXES.find(({ prefix }) => p === prefix || p.startsWith(`${prefix}/`));
    return hit?.feature ?? null;
}
