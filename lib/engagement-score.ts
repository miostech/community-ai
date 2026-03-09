/**
 * Cálculo de score de engajamento (0–100) a partir dos dados das redes (Search API).
 * Usado no perfil de criador em campanhas e no top engagement de influenciadores.
 */

export interface SocialStatsForEngagement {
    instagram?: {
        followers: number | null;
        avg_likes: number | null;
        avg_comments: number | null;
    } | null;
    tiktok?: {
        followers: number | null;
        hearts: number | null;
        posts_count: number | null;
    } | null;
}

export function calcIgEngagementScore(socialStats: SocialStatsForEngagement | null): number | null {
    const ig = socialStats?.instagram;
    if (!ig || !ig.followers || ig.followers <= 0) return null;
    if (ig.avg_likes == null && ig.avg_comments == null) return null;
    const rate = (((ig.avg_likes ?? 0) + (ig.avg_comments ?? 0)) / ig.followers) * 100;
    return Math.min(Math.round((rate / 6) * 100), 100);
}

export function calcTtEngagementScore(socialStats: SocialStatsForEngagement | null): number | null {
    const tt = socialStats?.tiktok;
    if (!tt || !tt.followers || tt.followers <= 0 || tt.hearts == null || !tt.posts_count || tt.posts_count <= 0) return null;
    const avgHeartsPerPost = tt.hearts / tt.posts_count;
    const rate = (avgHeartsPerPost / tt.followers) * 100;
    return Math.min(Math.round((rate / 10) * 100), 100);
}

/** Retorna o score combinado (média de IG e TT quando ambos existem), ou null se nenhum. */
export function getCombinedEngagementScore(socialStats: SocialStatsForEngagement | null): number | null {
    const ig = calcIgEngagementScore(socialStats);
    const tt = calcTtEngagementScore(socialStats);
    const scores = [ig, tt].filter((s): s is number => s !== null);
    if (scores.length === 0) return null;
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}
