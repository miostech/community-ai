import { NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { connectMongo } from '@/lib/mongoose';
import Account from '@/models/Account';

const SEARCHAPI_API_KEY = process.env.SEARCHAPI_API_KEY;
const SEARCHAPI_BASE = 'https://www.searchapi.io/api/v1/search';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface InstagramProfileResponse {
  profile?: {
    avatar?: string;
    avatar_hd?: string;
  };
}

/** Baixa a imagem da URL e retorna buffer + contentType. URLs do CDN do Instagram expiram; por isso baixamos na hora. */
async function downloadImage(url: string): Promise<{ buffer: Buffer; contentType: string }> {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; rv:91.0) Gecko/20100101 Firefox/91.0',
      Accept: 'image/*',
    },
  });
  if (!res.ok) {
    throw new Error(`Falha ao baixar imagem: ${res.status}`);
  }
  const buffer = Buffer.from(await res.arrayBuffer());
  const contentType = res.headers.get('content-type') || 'image/jpeg';
  return { buffer, contentType };
}

/** Busca a foto do perfil do Instagram 1 vez, baixa a imagem (para não depender de URL que expira) e salva no Azure ou em base64. */
export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    if (!SEARCHAPI_API_KEY) {
      return NextResponse.json(
        { error: 'SEARCHAPI_API_KEY não configurada. Configure em .env.local.' },
        { status: 503 }
      );
    }

    await connectMongo();
    const authUserId = (session.user as { auth_user_id?: string }).auth_user_id || session.user.id;
    const account = await Account.findOne({ auth_user_id: authUserId });

    if (!account) {
      return NextResponse.json({ error: 'Conta não encontrada' }, { status: 404 });
    }

    const username = account.link_instagram?.trim();
    if (!username) {
      return NextResponse.json(
        { error: 'Preencha o Instagram no seu perfil antes de usar a foto do Instagram.' },
        { status: 400 }
      );
    }

    const params = new URLSearchParams({
      engine: 'instagram_profile',
      username: username.replace(/^@/, ''),
      api_key: SEARCHAPI_API_KEY,
    });
    const res = await fetch(`${SEARCHAPI_BASE}?${params.toString()}`);
    if (!res.ok) {
      return NextResponse.json(
        { error: 'Não foi possível buscar a foto do Instagram. Tente mais tarde.' },
        { status: 502 }
      );
    }

    const data = (await res.json()) as InstagramProfileResponse;
    const profile = data?.profile;
    const avatarUrl =
      typeof profile?.avatar_hd === 'string' && profile.avatar_hd
        ? profile.avatar_hd
        : typeof profile?.avatar === 'string' && profile.avatar
          ? profile.avatar
          : null;

    if (!avatarUrl) {
      return NextResponse.json(
        { error: 'Foto do perfil do Instagram não encontrada.' },
        { status: 404 }
      );
    }

    // Baixar a imagem imediatamente (a URL do CDN do Instagram expira; salvamos como base64 no MongoDB)
    let finalAvatarUrl: string;
    try {
      const { buffer, contentType } = await downloadImage(avatarUrl);
      const mime = contentType.split(';')[0].trim() || 'image/jpeg';
      const base64 = buffer.toString('base64');
      finalAvatarUrl = `data:${mime};base64,${base64}`;
    } catch (downloadErr) {
      console.error('[sync-instagram-avatar] download image', downloadErr);
      return NextResponse.json(
        { error: 'Não foi possível baixar a foto do Instagram. A URL pode ter expirado ou o acesso foi bloqueado.' },
        { status: 502 }
      );
    }

    const now = new Date();
    const updated = await Account.findOneAndUpdate(
      { auth_user_id: authUserId },
      { $set: { avatar_url: finalAvatarUrl, used_instagram_avatar: true, instagram_avatar_used_at: now } },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ error: 'Erro ao salvar a foto' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Foto do Instagram definida como sua foto de perfil.',
      account: {
        id: updated._id.toString(),
        first_name: updated.first_name,
        last_name: updated.last_name,
        email: updated.email,
        phone: updated.phone,
        phone_country_code: updated.phone_country_code,
        link_instagram: updated.link_instagram,
        link_tiktok: updated.link_tiktok,
        link_youtube: updated.link_youtube,
        primary_social_link: updated.primary_social_link,
        avatar_url: updated.avatar_url,
        used_instagram_avatar: updated.used_instagram_avatar,
        instagram_avatar_used_at: (updated as any).instagram_avatar_used_at
          ? new Date((updated as any).instagram_avatar_used_at).toISOString()
          : null,
        background_url: updated.background_url,
        plan: updated.plan,
      },
    });
  } catch (err) {
    console.error('[api/accounts/sync-instagram-avatar]', err);
    return NextResponse.json(
      { error: 'Erro ao buscar foto do Instagram. Tente mais tarde.' },
      { status: 500 }
    );
  }
}
