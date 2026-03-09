/**
 * Busca dados completos de Instagram e TikTok (Search API) para um account.
 * Usado pelo cron de cache e pode ser reutilizado pela rota de social-stats.
 */

import { getCombinedEngagementScore, type SocialStatsForEngagement } from './engagement-score';

const SEARCHAPI_KEY = process.env.SEARCHAPI_API_KEY;
const SEARCHAPI_BASE = 'https://www.searchapi.io/api/v1/search';

interface InstagramProfileResponse {
    profile?: {
        username?: string;
        followers?: number;
        following?: number;
        posts?: number;
        is_verified?: boolean;
    };
    posts?: Array<{ likes?: number; comments?: number }>;
}

interface TikTokProfileResponse {
    profile?: {
        username?: string;
        followers?: number;
        following?: number;
        posts?: number;
        hearts?: number;
        is_verified?: boolean;
    };
}

export async function fetchInstagramProfile(username: string): Promise<InstagramProfileResponse | null> {
    if (!SEARCHAPI_KEY || !username?.trim()) return null;
    try {
        const params = new URLSearchParams({
            engine: 'instagram_profile',
            username: username.replace(/^@/, '').trim(),
            api_key: SEARCHAPI_KEY,
        });
        const res = await fetch(`${SEARCHAPI_BASE}?${params}`, { cache: 'no-store' });
        if (!res.ok) return null;
        return (await res.json()) as InstagramProfileResponse;
    } catch {
        return null;
    }
}

export async function fetchTikTokProfile(username: string): Promise<TikTokProfileResponse | null> {
    if (!SEARCHAPI_KEY || !username?.trim()) return null;
    try {
        const params = new URLSearchParams({
            engine: 'tiktok_profile',
            username: username.replace(/^@/, '').trim(),
            api_key: SEARCHAPI_KEY,
        });
        const res = await fetch(`${SEARCHAPI_BASE}?${params}`, { cache: 'no-store' });
        if (!res.ok) return null;
        return (await res.json()) as TikTokProfileResponse;
    } catch {
        return null;
    }
}

function calcAvg(posts: Array<{ likes?: number; comments?: number }>, field: 'likes' | 'comments'): number | null {
    const values = posts.map((p) => p[field]).filter((v): v is number => typeof v === 'number');
    if (values.length === 0) return null;
    return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}

export interface SocialStatsResult {
    totalFollowers: number;
    engagementScore: number | null;
    forEngagement: SocialStatsForEngagement;
}

/**
 * Busca IG + TT, retorna total de seguidores e score de engajamento (0–100).
 */
export async function getSocialStatsForAccount(params: {
    instagram?: string | null;
    tiktok?: string | null;
}): Promise<SocialStatsResult> {
    const { instagram, tiktok } = params;
    const [igData, ttData] = await Promise.all([
        instagram?.trim() ? fetchInstagramProfile(instagram) : null,
        tiktok?.trim() ? fetchTikTokProfile(tiktok) : null,
    ]);

    const igProfile = igData?.profile;
    const igPosts = igData?.posts ?? [];
    const ttProfile = ttData?.profile;

    const totalFollowers = (igProfile?.followers ?? 0) + (ttProfile?.followers ?? 0);

    const forEngagement: SocialStatsForEngagement = {
        instagram: igProfile
            ? {
                  followers: igProfile.followers ?? null,
                  avg_likes: calcAvg(igPosts, 'likes'),
                  avg_comments: calcAvg(igPosts, 'comments'),
              }
            : null,
        tiktok: ttProfile
            ? {
                  followers: ttProfile.followers ?? null,
                  hearts: ttProfile.hearts ?? null,
                  posts_count: ttProfile.posts ?? null,
              }
            : null,
    };

    const engagementScore = getCombinedEngagementScore(forEngagement);

    return { totalFollowers, engagementScore: engagementScore ?? null, forEngagement };
}
