import { NextRequest, NextResponse } from 'next/server';

const SEARCHAPI_API_KEY = process.env.SEARCHAPI_API_KEY;
const SEARCHAPI_BASE = 'https://www.searchapi.io/api/v1/search';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Resposta da SearchAPI para instagram_profile */
interface InstagramProfileResponse {
  profile?: {
    followers?: number;
    following?: number;
    posts?: number;
    avatar?: string;
    avatar_hd?: string;
  };
}

/** Resposta da SearchAPI para tiktok_profile */
interface TikTokProfileResponse {
  profile?: {
    followers?: number;
    following?: number;
    posts?: number;
    hearts?: number;
  };
}

/** Resposta da SearchAPI para youtube_channel (about ou channel) */
interface YouTubeChannelResponse {
  about?: { subscribers?: number; videos?: number; views?: number };
  channel?: { subscribers?: number; videos?: number };
}

async function fetchInstagramProfile(username: string): Promise<{ followers: number | null; avatar: string | null }> {
  if (!SEARCHAPI_API_KEY || !username?.trim()) return { followers: null, avatar: null };
  const params = new URLSearchParams({
    engine: 'instagram_profile',
    username: username.replace(/^@/, '').trim(),
    api_key: SEARCHAPI_API_KEY,
  });
  const res = await fetch(`${SEARCHAPI_BASE}?${params.toString()}`, {
    next: { revalidate: 86400 }, // 24h cache
  });
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
  if (!SEARCHAPI_API_KEY || !username?.trim()) return null;
  const params = new URLSearchParams({
    engine: 'tiktok_profile',
    username: username.replace(/^@/, '').trim(),
    api_key: SEARCHAPI_API_KEY,
  });
  const res = await fetch(`${SEARCHAPI_BASE}?${params.toString()}`, {
    next: { revalidate: 86400 }, // 24h cache
  });
  if (!res.ok) return null;
  const data = (await res.json()) as TikTokProfileResponse;
  const followers = data?.profile?.followers;
  return typeof followers === 'number' ? followers : null;
}

/** channelId: @handle (ex: @TaylorSwift) ou ID do canal */
async function fetchYouTubeSubscribers(channelId: string): Promise<number | null> {
  if (!SEARCHAPI_API_KEY || !channelId?.trim()) return null;
  const normalized = channelId.trim().startsWith('@') ? channelId.trim() : `@${channelId.trim()}`;
  const params = new URLSearchParams({
    engine: 'youtube_channel',
    channel_id: normalized,
    api_key: SEARCHAPI_API_KEY,
  });
  const res = await fetch(`${SEARCHAPI_BASE}?${params.toString()}`, {
    next: { revalidate: 86400 }, // 24h cache
  });
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

  if (!instagram && !tiktok && !youtube) {
    return NextResponse.json(
      { error: 'Informe pelo menos um parâmetro: instagram, tiktok ou youtube.' },
      { status: 400 }
    );
  }

  if (!SEARCHAPI_API_KEY) {
    return NextResponse.json(
      { error: 'SEARCHAPI_API_KEY não configurada. Configure em .env.local.' },
      { status: 503 }
    );
  }

  try {
    const [instagramData, tiktokFollowers, youtubeSubscribers] = await Promise.all([
      instagram ? fetchInstagramProfile(instagram) : Promise.resolve({ followers: null, avatar: null }),
      tiktok ? fetchTikTokFollowers(tiktok) : Promise.resolve(null),
      youtube ? fetchYouTubeSubscribers(youtube) : Promise.resolve(null),
    ]);

    const instagramFollowers = instagramData.followers;
    const totalFollowers =
      (instagramFollowers ?? 0) + (tiktokFollowers ?? 0) + (youtubeSubscribers ?? 0);

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
