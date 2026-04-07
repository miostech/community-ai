import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectMongo } from '@/lib/mongoose';
import Account from '@/models/Account';
import mongoose from 'mongoose';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MARCA_ROLES = new Set(['marca', 'moderator', 'admin']);

/** Perfil público resumido do creator para o portal da marca (sem email nem dados sensíveis). */
export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ accountId: string }> }
) {
    try {
        const session = await auth();
        const authUserId =
            (session?.user as { auth_user_id?: string } | undefined)?.auth_user_id || session?.user?.id;
        if (!authUserId) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        await connectMongo();
        const viewer = await Account.findOne({ auth_user_id: authUserId }).select('role').lean();
        if (!viewer) {
            return NextResponse.json({ error: 'Conta não encontrada' }, { status: 404 });
        }
        if (!MARCA_ROLES.has(viewer.role || 'user')) {
            return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
        }

        const { accountId } = await params;
        if (!mongoose.Types.ObjectId.isValid(accountId)) {
            return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
        }

        const creator = await Account.findById(accountId)
            .select(
                'first_name last_name avatar_url link_instagram link_tiktok link_youtube ' +
                    'category niches address_country address_state address_city ' +
                    'cached_followers_total followers_at_signup cached_followers_updated_at ' +
                    'cached_engagement_score cached_total_views link_media_kit'
            )
            .lean();

        if (!creator) {
            return NextResponse.json({ error: 'Creator não encontrado' }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            creator,
        });
    } catch (error) {
        console.error('GET /api/marca/creators/[accountId]:', error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
}
