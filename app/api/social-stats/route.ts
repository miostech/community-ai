import { NextRequest, NextResponse } from 'next/server';
import { connectMongo } from '@/lib/mongoose';
import Account from '@/models/Account';
import { normalizeInstagramHandle, normalizeTikTokHandle, normalizeYouTubeChannelIdForSearchApi } from '@/lib/normalize-social-handles';

const SEARCHAPI_API_KEY = process.env.SEARCHAPI_API_KEY;
const SEARCHAPI_BASE = 'https://www.searchapi.io/api/v1/search';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface InstagramProfileResponse {
  profile?: {
    followers?: number;
    following?: number;
    posts?: number;
    avatar?: string;
    avatar_hd?: string;
  };
}

interface TikTokProfileResponse {
  profile?: {
    followers?: number;
    following?: number;
    posts?: number;
    hearts?: number;
  };
}

interface YouTubeChannelResponse {
  about?: { subscribers?: number; videos?: number; views?: number };
  channel?: { subscribers?: number; videos?: number };
}

async function fetchInstagramProfile(username: string): Promise<{ followers: number | null; avatar: string | null }> {
  const handle = normalizeInstagramHandle(username);
  if (!SEARCHAPI_API_KEY || !handle) return { followers: null, avatar: null };
  const params = new URLSearchParams({
    engine: 'instagram_profile',
    username: handle,
    api_key: SEARCHAPI_API_KEY,
  });
  const res = await fetch(`${SEARCHAPI_BASE}?${params.toString()}`, { cache: 'no-store' });
  if (!res.ok) return { followers: null, avatar: null };
  const data = (await res.json()) as InstagramProfileResponse;
  const profile = data?.profile;
  const followers = typeof profile?.followers === 'number' ? profile.followers : null;
  const avatar =
    typeof profile?.avatar_hd === 'string' && profile.avatar_hd
      ? profile.avatar_hd
      : typeof profile?.avatar === 'string' && profile.avatar
        ? profile.avatar
        : null;
  return { followers, avatar };
}

async function fetchTikTokFollowers(username: string): Promise<number | null> {
  const handle = normalizeTikTokHandle(username);
  if (!SEARCHAPI_API_KEY || !handle) return null;
  const params = new URLSearchParams({
    engine: 'tiktok_profile',
    username: handle,
    api_key: SEARCHAPI_API_KEY,
  });
  const res = await fetch(`${SEARCHAPI_BASE}?${params.toString()}`, { cache: 'no-store' });
  if (!res.ok) return null;
  const data = (await res.json()) as TikTokProfileResponse;
  const followers = data?.profile?.followers;
  return typeof followers === 'number' ? followers : null;
}

async function fetchYouTubeSubscribers(channelId: string): Promise<number | null> {
  if (!SEARCHAPI_API_KEY || !channelId?.trim()) return null;
  const normalized = normalizeYouTubeChannelIdForSearchApi(channelId);
  if (!normalized) return null;
  const params = new URLSearchParams({
    engine: 'youtube_channel',
    channel_id: normalized,
    api_key: SEARCHAPI_API_KEY,
  });
  const res = await fetch(`${SEARCHAPI_BASE}?${params.toString()}`, { cache: 'no-store' });
  if (!res.ok) return null;
  const data = (await res.json()) as YouTubeChannelResponse;
  const subscribers =
    typeof data?.about?.subscribers === 'number'
      ? data.about.subscribers
      : typeof data?.channel?.subscribers === 'number'
        ? data.channel.subscribers
        : null;
  return typeof subscribers === 'number' ? subscribers : null;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const instagram = searchParams.get('instagram')?.trim() || null;
  const tiktok = searchParams.get('tiktok')?.trim() || null;
  const youtube = searchParams.get('youtube')?.trim() || null;
  const refresh = searchParams.get('refresh') === 'true';

  if (!instagram && !tiktok && !youtube) {
    return NextResponse.json(
      { error: 'Informe pelo menos um parâmetro: instagram, tiktok ou youtube.' },
      { status: 400 }
    );
  }

  try {
    await connectMongo();

    if (!refresh) {
      const query: Record<string, unknown> = {};
      if (instagram) query.link_instagram = { $regex: new RegExp(normalizeInstagramHandle(instagram) || instagram, 'i') };
      else if (tiktok) query.link_tiktok = { $regex: new RegExp(normalizeTikTokHandle(tiktok) || tiktok, 'i') };
      else if (youtube) query.link_youtube = { $regex: new RegExp(youtube, 'i') };

      const cached = await Account.findOne({
        ...query,
        cached_followers_total: { $ne: null },
        cached_followers_updated_at: { $ne: null },
      })
        .select('cached_followers_total cached_followers_updated_at')
        .lean() as { cached_followers_total?: number; cached_followers_updated_at?: Date } | null;

      if (cached && cached.cached_followers_total != null) {
        return NextResponse.json({
          instagram: instagram ? { username: instagram, followers: null, avatar: null } : null,
          tiktok: tiktok ? { username: tiktok, followers: null } : null,
          youtube: youtube ? { channelId: youtube, subscribers: null } : null,
          totalFollowers: cached.cached_followers_total,
          cached: true,
          cachedAt: cached.cached_followers_updated_at,
        });
      }
    }

    if (!SEARCHAPI_API_KEY) {
      return NextResponse.json(
        { error: 'SEARCHAPI_API_KEY não configurada. Configure em .env.local.' },
        { status: 503 }
      );
    }

    const [instagramData, tiktokFollowers, youtubeSubscribers] = await Promise.all([
      instagram ? fetchInstagramProfile(instagram) : Promise.resolve({ followers: null, avatar: null }),
      tiktok ? fetchTikTokFollowers(tiktok) : Promise.resolve(null),
      youtube ? fetchYouTubeSubscribers(youtube) : Promise.resolve(null),
    ]);

    const instagramFollowers = instagramData.followers;
    const totalFollowers =
      (instagramFollowers ?? 0) + (tiktokFollowers ?? 0) + (youtubeSubscribers ?? 0);

    const updateQuery: Record<string, unknown> = {};
    if (instagram) updateQuery.link_instagram = { $regex: new RegExp(normalizeInstagramHandle(instagram) || instagram, 'i') };
    else if (tiktok) updateQuery.link_tiktok = { $regex: new RegExp(normalizeTikTokHandle(tiktok) || tiktok, 'i') };
    else if (youtube) updateQuery.link_youtube = { $regex: new RegExp(youtube, 'i') };

    await Account.updateOne(updateQuery, {
      $set: {
        cached_followers_total: totalFollowers,
        cached_followers_updated_at: new Date(),
      },
    });

    return NextResponse.json({
      instagram: instagram !== null
        ? { username: instagram, followers: instagramFollowers, avatar: instagramData.avatar }
        : null,
      tiktok: tiktok !== null
        ? { username: tiktok, followers: tiktokFollowers }
        : null,
      youtube: youtube !== null
        ? { channelId: youtube, subscribers: youtubeSubscribers }
        : null,
      totalFollowers,
    });
  } catch (err) {
    console.error('[api/social-stats]', err);
    return NextResponse.json(
      { error: 'Não foi possível buscar os seguidores. Tente mais tarde.' },
      { status: 502 }
    );
  }
}
