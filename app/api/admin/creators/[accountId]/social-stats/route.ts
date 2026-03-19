import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectMongo } from '@/lib/mongoose';
import Account from '@/models/Account';
import { normalizeInstagramHandle, normalizeTikTokHandle } from '@/lib/normalize-social-handles';
import mongoose from 'mongoose';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SEARCHAPI_KEY = process.env.SEARCHAPI_API_KEY;
const SEARCHAPI_BASE = 'https://www.searchapi.io/api/v1/search';

interface InstagramProfileResponse {
    profile?: {
        username?: string;
        followers?: number;
        following?: number;
        posts?: number;
        is_verified?: boolean;
        bio?: string;
        avatar?: string;
        avatar_hd?: string;
    };
    posts?: Array<{
        likes?: number;
        comments?: number;
        type?: string;
    }>;
}

interface TikTokProfileResponse {
    profile?: {
        username?: string;
        followers?: number;
        following?: number;
        posts?: number;
        hearts?: number; // total de likes acumulados
        is_verified?: boolean;
        bio?: string;
        avatar?: string;
    };
}

async function fetchInstagram(username: string): Promise<InstagramProfileResponse | null> {
    const handle = normalizeInstagramHandle(username);
    if (!SEARCHAPI_KEY || !handle) return null;
    try {
        const params = new URLSearchParams({
            engine: 'instagram_profile',
            username: handle,
            api_key: SEARCHAPI_KEY,
        });
        const res = await fetch(`${SEARCHAPI_BASE}?${params}`, {
            next: { revalidate: 3600 }, // cache 1h
        });
        if (!res.ok) return null;
        return await res.json() as InstagramProfileResponse;
    } catch {
        return null;
    }
}

async function fetchTikTok(username: string): Promise<TikTokProfileResponse | null> {
    const handle = normalizeTikTokHandle(username);
    if (!SEARCHAPI_KEY || !handle) return null;
    try {
        const params = new URLSearchParams({
            engine: 'tiktok_profile',
            username: handle,
            api_key: SEARCHAPI_KEY,
        });
        const res = await fetch(`${SEARCHAPI_BASE}?${params}`, {
            next: { revalidate: 3600 },
        });
        if (!res.ok) return null;
        return await res.json() as TikTokProfileResponse;
    } catch {
        return null;
    }
}

function calcAvg(posts: Array<{ likes?: number; comments?: number }>, field: 'likes' | 'comments'): number | null {
    const values = posts.map((p) => p[field]).filter((v): v is number => typeof v === 'number');
    if (values.length === 0) return null;
    return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ accountId: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        await connectMongo();

        const authUserId = (session.user as { auth_user_id?: string }).auth_user_id || session.user.id;
        const moderator = await Account.findOne({ auth_user_id: authUserId }).select('role').lean();
        const role = (moderator as { role?: string } | null)?.role;
        if (!moderator || !['moderator', 'admin', 'criador'].includes(role || '')) {
            return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
        }

        const { accountId } = await params;
        if (!mongoose.Types.ObjectId.isValid(accountId)) {
            return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
        }

        if (!SEARCHAPI_KEY) {
            return NextResponse.json({ error: 'SEARCHAPI_API_KEY não configurada' }, { status: 503 });
        }

        const creator = await Account.findById(accountId)
            .select('link_instagram link_tiktok')
            .lean() as { link_instagram?: string; link_tiktok?: string } | null;

        if (!creator) {
            return NextResponse.json({ error: 'Creator não encontrado' }, { status: 404 });
        }

        const [igData, ttData] = await Promise.all([
            creator.link_instagram ? fetchInstagram(creator.link_instagram) : null,
            creator.link_tiktok ? fetchTikTok(creator.link_tiktok) : null,
        ]);

        const igProfile = igData?.profile;
        const igPosts = igData?.posts ?? [];
        const ttProfile = ttData?.profile;

        return NextResponse.json({
            instagram: igProfile ? {
                username: igProfile.username,
                followers: igProfile.followers ?? null,
                following: igProfile.following ?? null,
                posts_count: igProfile.posts ?? null,
                is_verified: igProfile.is_verified ?? false,
                avg_likes: calcAvg(igPosts, 'likes'),
                avg_comments: calcAvg(igPosts, 'comments'),
                recent_posts_sample: igPosts.length,
            } : null,
            tiktok: ttProfile ? {
                username: ttProfile.username,
                followers: ttProfile.followers ?? null,
                following: ttProfile.following ?? null,
                posts_count: ttProfile.posts ?? null,
                hearts: ttProfile.hearts ?? null,
                is_verified: ttProfile.is_verified ?? false,
            } : null,
        });
    } catch (error) {
        console.error('[social-stats]', error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
}
