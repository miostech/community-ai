import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectMongo } from '@/lib/mongoose';
import Account from '@/models/Account';
import mongoose from 'mongoose';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** GET - Dados públicos de uma conta (nome, avatar, redes) para exibir no perfil da comunidade */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id } = await params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    await connectMongo();

    const account = await Account.findById(id)
      .select('first_name last_name avatar_url link_instagram link_tiktok link_youtube')
      .lean();

    if (!account) {
      return NextResponse.json({ error: 'Conta não encontrada' }, { status: 404 });
    }

    const acc = account as {
      first_name?: string;
      last_name?: string;
      avatar_url?: string | null;
      link_instagram?: string | null;
      link_tiktok?: string | null;
      link_youtube?: string | null;
    };

    return NextResponse.json({
      success: true,
      profile: {
        name: `${acc.first_name || ''} ${acc.last_name || ''}`.trim() || 'Membro da comunidade',
        avatar_url: acc.avatar_url ?? null,
        link_instagram: acc.link_instagram?.trim() || null,
        link_tiktok: acc.link_tiktok?.trim() || null,
        link_youtube: acc.link_youtube?.trim() || null,
      },
    });
  } catch (error) {
    console.error('Erro ao buscar perfil público:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
