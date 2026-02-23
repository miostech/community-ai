const SEARCHAPI_API_KEY = process.env.SEARCHAPI_API_KEY;
const SEARCHAPI_BASE = 'https://www.searchapi.io/api/v1/search';

interface InstagramProfileResponse {
  profile?: { followers?: number; avatar?: string; avatar_hd?: string };
}
interface TikTokProfileResponse {
  profile?: { followers?: number };
}
interface YouTubeChannelResponse {
  about?: { subscribers?: number };
  channel?: { subscribers?: number };
}

async function fetchInstagramFollowers(username: string): Promise<number | null> {
  if (!SEARCHAPI_API_KEY || !username?.trim()) return null;
  const params = new URLSearchParams({
    engine: 'instagram_profile',
    username: username.replace(/^@/, '').trim(),
    api_key: SEARCHAPI_API_KEY,
  });
  const res = await fetch(`${SEARCHAPI_BASE}?${params.toString()}`, {
    next: { revalidate: 604800 },
  });
  if (!res.ok) return null;
  const data = (await res.json()) as InstagramProfileResponse;
  const followers = data?.profile?.followers;
  return typeof followers === 'number' ? followers : null;
}

async function fetchTikTokFollowers(username: string): Promise<number | null> {
  if (!SEARCHAPI_API_KEY || !username?.trim()) return null;
  const params = new URLSearchParams({
    engine: 'tiktok_profile',
    username: username.replace(/^@/, '').trim(),
    api_key: SEARCHAPI_API_KEY,
  });
  const res = await fetch(`${SEARCHAPI_BASE}?${params.toString()}`, {
    next: { revalidate: 604800 },
  });
  if (!res.ok) return null;
  const data = (await res.json()) as TikTokProfileResponse;
  const followers = data?.profile?.followers;
  return typeof followers === 'number' ? followers : null;
}

async function fetchYouTubeSubscribers(channelId: string): Promise<number | null> {
  if (!SEARCHAPI_API_KEY || !channelId?.trim()) return null;
  const normalized = channelId.trim().startsWith('@') ? channelId.trim() : `@${channelId.trim()}`;
  const params = new URLSearchParams({
    engine: 'youtube_channel',
    channel_id: normalized,
    api_key: SEARCHAPI_API_KEY,
  });
  const res = await fetch(`${SEARCHAPI_BASE}?${params.toString()}`, {
    next: { revalidate: 604800 },
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

/**
 * Retorna o total de seguidores (Instagram + TikTok + YouTube) para os usernames informados.
 * Usado para registrar followers_at_signup na primeira vez que o usuário tem redes cadastradas.
 */
export async function getTotalFollowers(params: {
  instagram?: string | null;
  tiktok?: string | null;
  youtube?: string | null;
}): Promise<number> {
  const { instagram, tiktok, youtube } = params;
  if (!instagram && !tiktok && !youtube) return 0;
  const [ig, tt, yt] = await Promise.all([
    instagram?.trim() ? fetchInstagramFollowers(instagram) : Promise.resolve(null),
    tiktok?.trim() ? fetchTikTokFollowers(tiktok) : Promise.resolve(null),
    youtube?.trim() ? fetchYouTubeSubscribers(youtube) : Promise.resolve(null),
  ]);
  return (ig ?? 0) + (tt ?? 0) + (yt ?? 0);
}
