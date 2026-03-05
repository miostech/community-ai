/** BRT offset: UTC-3 */
const BRT_OFFSET_MS = -3 * 60 * 60 * 1000;

function toBRT(date: Date): Date {
    return new Date(date.getTime() + BRT_OFFSET_MS);
}

function fromBRT(brtDate: Date): Date {
    return new Date(brtDate.getTime() - BRT_OFFSET_MS);
}

/**
 * Returns { weekStart, weekEnd } for the week containing `now` in BRT.
 * Week starts Monday 00:00 BRT and ends Sunday 23:59:59.999 BRT.
 */
export function getCurrentWeekBounds(now: Date = new Date()): { weekStart: Date; weekEnd: Date } {
    const brt = toBRT(now);
    const day = brt.getUTCDay(); // 0=Sun .. 6=Sat
    const diffToMonday = day === 0 ? -6 : 1 - day;

    const monday = new Date(brt);
    monday.setUTCDate(monday.getUTCDate() + diffToMonday);
    monday.setUTCHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setUTCDate(sunday.getUTCDate() + 6);
    sunday.setUTCHours(23, 59, 59, 999);

    return {
        weekStart: fromBRT(monday),
        weekEnd: fromBRT(sunday),
    };
}

/**
 * Returns bounds for the previous week (the one that just ended).
 */
export function getPreviousWeekBounds(now: Date = new Date()): { weekStart: Date; weekEnd: Date } {
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return getCurrentWeekBounds(oneWeekAgo);
}

/**
 * Formats a date range as "DD/MM - DD/MM" for display.
 */
export function formatWeekRange(weekStart: Date, weekEnd: Date): string {
    const s = toBRT(weekStart);
    const e = toBRT(weekEnd);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(s.getUTCDate())}/${pad(s.getUTCMonth() + 1)} - ${pad(e.getUTCDate())}/${pad(e.getUTCMonth() + 1)}`;
}
