const INSTAGRAM_HANDLE_RE = /^[A-Za-z0-9._-]{1,30}$/;
const TIKTOK_HANDLE_RE = /^[A-Za-z0-9._-]{1,30}$/;
const YOUTUBE_CHANNEL_ID_RE = /^UC[A-Za-z0-9_-]{20,}$/;
const YOUTUBE_HANDLE_RE = /^[A-Za-z0-9._-]{2,100}$/;

function tryParseUrl(rawInput: string): URL | null {
    const s = rawInput.trim();
    if (!s) return null;

    // Se não tiver protocolo mas parecer domínio, adiciona `https://` para o `new URL` funcionar.
    const hasScheme = /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(s);
    const candidate = hasScheme ? s : `https://${s}`;
    try {
        return new URL(candidate);
    } catch {
        return null;
    }
}

function normalizeHandleCandidate(rawSegment: string, handleRe: RegExp): string | null {
    const cleaned = rawSegment.trim().replace(/^@/, '').replace(/\/+$/g, '');
    if (!cleaned) return null;
    if (!handleRe.test(cleaned)) return null;
    return cleaned;
}

/**
 * Normaliza entradas como:
 * - "user"
 * - "@user"
 * - "https://instagram.com/user"
 * - "instagram.com/user"
 *
 * Retorna "user" (sem @) ou `null` se não conseguir extrair.
 */
export function normalizeInstagramHandle(input: string): string | null {
    const raw = input?.trim();
    if (!raw) return null;

    // Caso seja URL, extrair o primeiro segmento do path.
    if (raw.includes('instagram.com') || raw.includes('instagram.') || raw.includes('/') || raw.includes('http')) {
        const url = tryParseUrl(raw);
        if (url && url.hostname.replace(/^www\./, '').endsWith('instagram.com')) {
            const segments = url.pathname.split('/').filter(Boolean);
            if (segments.length === 0) return null;

            // Post/reels/explore etc não têm formato de "perfil -> username".
            const first = segments[0];
            if (['p', 'reel', 'reels', 'tv', 'explore', 'accounts', 'about', 'stories'].includes(first)) return null;

            return normalizeHandleCandidate(first, INSTAGRAM_HANDLE_RE);
        }
    }

    const cleaned = raw.replace(/^@/, '').replace(/\/+$/g, '');
    return normalizeHandleCandidate(cleaned, INSTAGRAM_HANDLE_RE);
}

/**
 * Normaliza entradas como:
 * - "user"
 * - "@user"
 * - "https://tiktok.com/@user"
 * - "tiktok.com/@user"
 *
 * Retorna "user" (sem @) ou `null` se não conseguir extrair.
 */
export function normalizeTikTokHandle(input: string): string | null {
    const raw = input?.trim();
    if (!raw) return null;

    if (raw.includes('tiktok.com') || raw.includes('tiktok.') || raw.includes('/') || raw.includes('http')) {
        const url = tryParseUrl(raw);
        if (url && url.hostname.replace(/^www\./, '').endsWith('tiktok.com')) {
            const segments = url.pathname.split('/').filter(Boolean);
            if (segments.length === 0) return null;

            // Esperado: /@username/... ou /username/...
            const first = segments[0];
            const handle = first.startsWith('@') ? first.slice(1) : first;
            return normalizeHandleCandidate(handle, TIKTOK_HANDLE_RE);
        }
    }

    const cleaned = raw.replace(/^@/, '').replace(/\/+$/g, '');
    return normalizeHandleCandidate(cleaned, TIKTOK_HANDLE_RE);
}

/**
 * Normaliza para armazenamento no Mongo (ex.: sem "@"):
 * - "@TaylorSwift" -> "TaylorSwift"
 * - "https://www.youtube.com/@TaylorSwift" -> "TaylorSwift"
 * - "https://www.youtube.com/channel/UCxxxx" -> "UCxxxx"
 * - "TaylorSwift" -> "TaylorSwift"
 *
 * Retorna `null` se não conseguir extrair um identificador.
 */
export function normalizeYouTubeStoredInput(input: string): string | null {
    const raw = input?.trim();
    if (!raw) return null;

    // Channel ID
    if (YOUTUBE_CHANNEL_ID_RE.test(raw)) return raw;
    if (raw.startsWith('@')) {
        const handle = raw.slice(1);
        if (YOUTUBE_HANDLE_RE.test(handle)) return handle;
    }

    if (raw.includes('youtube.com') || raw.includes('youtu.be') || raw.includes('http') || raw.includes('/')) {
        const url = tryParseUrl(raw);
        if (url) {
            const host = url.hostname.replace(/^www\./, '');
            const isYouTube = host === 'youtube.com' || host.endsWith('.youtube.com') || host === 'youtu.be';
            if (!isYouTube) return null;

            const segments = url.pathname.split('/').filter(Boolean);
            if (segments.length === 0) return null;

            // /@handle/...
            if (segments[0].startsWith('@')) {
                const handle = segments[0].slice(1);
                if (YOUTUBE_HANDLE_RE.test(handle)) return handle;
            }

            // /channel/UCxxxx/...
            if (segments[0] === 'channel' && segments[1]) {
                const id = segments[1];
                if (YOUTUBE_CHANNEL_ID_RE.test(id)) return id;
            }
        }
    }

    // fallback: assume que é um "handle" simples.
    const cleaned = raw.replace(/^@/, '');
    if (YOUTUBE_HANDLE_RE.test(cleaned)) return cleaned;
    return null;
}

/**
 * Normaliza para uso na SearchAPI (campo `channel_id`).
 * - retorna "@handle" ou "UCxxxx" (sem alteração).
 */
export function normalizeYouTubeChannelIdForSearchApi(input: string): string | null {
    const stored = normalizeYouTubeStoredInput(input);
    if (!stored) return null;
    if (stored.startsWith('UC')) return stored;
    return `@${stored}`;
}

