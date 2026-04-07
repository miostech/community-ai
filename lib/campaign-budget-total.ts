/** Normaliza `budget_total_cents` vindo do JSON (número ou string). */
export function normalizeBudgetTotalCentsInput(v: unknown): number | undefined {
    if (v === undefined || v === null) return undefined;
    if (typeof v === 'number' && Number.isFinite(v)) {
        const r = Math.round(v);
        return r >= 0 ? r : undefined;
    }
    if (typeof v === 'string' && v.trim() !== '') {
        const n = Number(v.trim().replace(/\s/g, ''));
        if (Number.isFinite(n)) {
            const r = Math.round(n);
            return r >= 0 ? r : undefined;
        }
    }
    return undefined;
}
