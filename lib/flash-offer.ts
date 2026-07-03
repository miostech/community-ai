/**
 * Estado compartilhado da "oferta relâmpago" (CampaignPromoModal), persistido em localStorage.
 * Permite que outros componentes (ex.: FreeUpgradeBanner) saibam se há uma oferta em andamento
 * e reajam quando ela começa/termina, via evento de janela.
 */

export type FlashPhase = 'trial' | 'trialLastDay' | 'free';

/** Evento disparado quando o deadline de alguma oferta muda. */
export const FLASH_OFFER_EVENT = 'flashoffer:change';

function keyFor(phase: FlashPhase): string {
    return `flash_offer_deadline_v1_${phase}`;
}

export function readFlashDeadline(phase: FlashPhase): number | null {
    try {
        const raw = localStorage.getItem(keyFor(phase));
        if (!raw) return null;
        const ms = new Date(raw).getTime();
        return Number.isNaN(ms) ? null : ms;
    } catch {
        return null;
    }
}

export function writeFlashDeadline(phase: FlashPhase, ms: number): void {
    try {
        localStorage.setItem(keyFor(phase), new Date(ms).toISOString());
    } catch {
        /* noop */
    }
    try {
        window.dispatchEvent(new Event(FLASH_OFFER_EVENT));
    } catch {
        /* noop */
    }
}

/** Deadline (ms) da oferta do segmento free, ou null se não existe. */
export function getFreeFlashDeadline(): number | null {
    return readFlashDeadline('free');
}

/** Há uma oferta relâmpago do segmento free em andamento (ainda dentro do tempo)? */
export function isFreeFlashActive(): boolean {
    const deadline = readFlashDeadline('free');
    return deadline !== null && Date.now() < deadline;
}
