/**
 * Busca dados completos de Instagram e TikTok (Search API) para um account.
 * Usado pelo cron de cache e pode ser reutilizado pela rota de social-stats.
 */

import { getCombinedEngagementScore, type SocialStatsForEngagement } from './engagement-score';
import {
    normalizeInstagramHandle,
    normalizeTikTokHandle,
    normalizeYouTubeChannelIdForSearchApi,
} from './normalize-social-handles';

const SEARCHAPI_KEY = process.env.SEARCHAPI_API_KEY;
const SEARCHAPI_BASE = 'https://www.searchapi.io/api/v1/search';

interface InstagramPostWithViews {
    likes?: number;
    comments?: number;
    video_view_count?: number;
    views?: number;
    play_count?: number;
    carousel_items?: InstagramPostWithViews[];
}

interface InstagramProfileResponse {
    profile?: {
        username?: string;
        followers?: number;
        following?: number;
        posts?: number;
        is_verified?: boolean;
        /** Se a SearchAPI expuser total de views do perfil */
        video_views?: number;
    };
    posts?: InstagramPostWithViews[];
}

interface TikTokProfileResponse {
    profile?: {
        username?: string;
        followers?: number;
        following?: number;
        posts?: number;
        hearts?: number;
        is_verified?: boolean;
        /** Algumas respostas da SearchAPI expõem totais de views no perfil */
        video_views?: number;
        total_video_views?: number;
        views?: number;
    };
    videos?: Array<{ play_count?: number; views?: number }>;
}

interface YouTubeChannelViewsResponse {
    about?: { subscribers?: number; videos?: number; views?: number };
    channel?: { subscribers?: number; videos?: number };
}

export async function fetchInstagramProfile(username: string): Promise<InstagramProfileResponse | null> {
    const handle = normalizeInstagramHandle(username);
    if (!SEARCHAPI_KEY || !handle) return null;
    try {
        const params = new URLSearchParams({
            engine: 'instagram_profile',
            username: handle,
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
    const handle = normalizeTikTokHandle(username);
    if (!SEARCHAPI_KEY || !handle) return null;
    try {
        const params = new URLSearchParams({
            engine: 'tiktok_profile',
            username: handle,
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

function sumViewsFromIgPost(p: InstagramPostWithViews): number {
    const direct = p.video_view_count ?? p.views ?? p.play_count;
    let v = typeof direct === 'number' ? direct : 0;
    if (Array.isArray(p.carousel_items)) {
        for (const c of p.carousel_items) {
            v += sumViewsFromIgPost(c);
        }
    }
    return v;
}

function sumInstagramPostsViews(posts: InstagramPostWithViews[]): { sum: number; hasViewFields: boolean } {
    let sum = 0;
    let hasViewFields = false;
    for (const p of posts) {
        if (p.video_view_count != null || p.views != null || p.play_count != null) hasViewFields = true;
        sum += sumViewsFromIgPost(p);
    }
    return { sum, hasViewFields };
}

function extractTikTokTotalViews(data: TikTokProfileResponse | null): { sum: number; hasData: boolean } {
    if (!data) return { sum: 0, hasData: false };
    const prof = data.profile;
    if (prof) {
        const n = prof.video_views ?? prof.total_video_views ?? prof.views;
        if (typeof n === 'number') {
            return { sum: n, hasData: true };
        }
    }
    const videos = data.videos;
    if (Array.isArray(videos) && videos.length > 0) {
        let s = 0;
        let any = false;
        for (const vid of videos) {
            const c = vid.play_count ?? vid.views;
            if (typeof c === 'number') {
                s += c;
                any = true;
            }
        }
        if (any) return { sum: s, hasData: true };
    }
    return { sum: 0, hasData: false };
}

/** Uma chamada ao youtube_channel — inscritos + views do canal (evita duplicar request). */
async function fetchYouTubeChannelMetrics(channelInput: string): Promise<{
    subscribers: number | null;
    views: number | null;
}> {
    const normalized = normalizeYouTubeChannelIdForSearchApi(channelInput);
    if (!SEARCHAPI_KEY || !normalized) return { subscribers: null, views: null };
    try {
        const params = new URLSearchParams({
            engine: 'youtube_channel',
            channel_id: normalized,
            api_key: SEARCHAPI_KEY,
        });
        const res = await fetch(`${SEARCHAPI_BASE}?${params}`, { cache: 'no-store' });
        if (!res.ok) return { subscribers: null, views: null };
        const data = (await res.json()) as YouTubeChannelViewsResponse;
        const subscribers =
            typeof data?.about?.subscribers === 'number'
                ? data.about.subscribers
                : typeof data?.channel?.subscribers === 'number'
                  ? data.channel.subscribers
                  : null;
        const views = typeof data?.about?.views === 'number' ? data.about.views : null;
        return { subscribers, views };
    } catch {
        return { subscribers: null, views: null };
    }
}

export interface SocialStatsResult {
    totalFollowers: number;
    engagementScore: number | null;
    forEngagement: SocialStatsForEngagement;
    /** Soma de visualizações quando a API expõe métricas (posts IG, TikTok, canal YouTube). */
    totalViews: number | null;
}

/**
 * Busca IG + TT, retorna total de seguidores e score de engajamento (0–100).
 */
export async function getSocialStatsForAccount(params: {
    instagram?: string | null;
    tiktok?: string | null;
    youtube?: string | null;
}): Promise<SocialStatsResult> {
    const { instagram, tiktok, youtube } = params;
    const [igData, ttData, ytMetrics] = await Promise.all([
        instagram?.trim() ? fetchInstagramProfile(instagram) : Promise.resolve(null),
        tiktok?.trim() ? fetchTikTokProfile(tiktok) : Promise.resolve(null),
        youtube?.trim() ? fetchYouTubeChannelMetrics(youtube) : Promise.resolve({ subscribers: null, views: null }),
    ]);

    const igProfile = igData?.profile;
    const igPosts = (igData?.posts ?? []) as InstagramPostWithViews[];
    const ttProfile = ttData?.profile;

    const ytSubscribers = ytMetrics?.subscribers ?? null;
    const ytChannelViews = ytMetrics?.views ?? null;
    const totalFollowers =
        (igProfile?.followers ?? 0) + (ttProfile?.followers ?? 0) + (ytSubscribers ?? 0);

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

    const igViews = sumInstagramPostsViews(igPosts);
    const ttViews = extractTikTokTotalViews(ttData);
    let totalViewsSum = 0;
    let hasAnyViews = false;
    const igProfileVideoViews = igProfile?.video_views;
    if (typeof igProfileVideoViews === 'number') {
        totalViewsSum += igProfileVideoViews;
        hasAnyViews = true;
    } else if (igViews.hasViewFields) {
        totalViewsSum += igViews.sum;
        hasAnyViews = true;
    }
    if (ttViews.hasData) {
        totalViewsSum += ttViews.sum;
        hasAnyViews = true;
    }
    if (ytChannelViews != null) {
        totalViewsSum += ytChannelViews;
        hasAnyViews = true;
    }

    return {
        totalFollowers,
        engagementScore: engagementScore ?? null,
        forEngagement,
        totalViews: hasAnyViews ? totalViewsSum : null,
    };
}
