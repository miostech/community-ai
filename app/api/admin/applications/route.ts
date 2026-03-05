import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectMongo } from '@/lib/mongoose';
import Account from '@/models/Account';
import CampaignApplication from '@/models/CampaignApplication';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET - Listar todas as candidaturas (admin/moderador), com filtro opcional por campanha
export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        await connectMongo();

        const authUserId = (session.user as { auth_user_id?: string }).auth_user_id || session.user.id;
        const account = await Account.findOne({ auth_user_id: authUserId }).select('role').lean();
        const role = (account as { role?: string } | null)?.role;

        if (!account || !['moderator', 'admin'].includes(role || '')) {
            return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const campaignId = searchParams.get('campaign_id');
        const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)));

        const filter: Record<string, unknown> = {};
        if (campaignId) filter.campaign_id = campaignId;

        const applications = await CampaignApplication.find(filter)
            .sort({ created_at: -1 })
            .limit(limit)
            .populate('creator_account_id', 'first_name last_name avatar_url link_instagram link_tiktok niches category address_city address_state')
            .populate('campaign_id', 'title brand_name status')
            .lean();

        return NextResponse.json({ applications });
    } catch (error) {
        console.error('Erro ao listar candidaturas (admin):', error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
}
