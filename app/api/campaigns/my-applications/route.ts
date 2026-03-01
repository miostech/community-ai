import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectMongo } from '@/lib/mongoose';
import Account from '@/models/Account';
import CampaignApplication from '@/models/CampaignApplication';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET - Listar todas as candidaturas do creator logado
export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        await connectMongo();

        const authUserId = (session.user as any).auth_user_id || session.user.id;
        const account = await Account.findOne({ auth_user_id: authUserId }).lean();
        if (!account) {
            return NextResponse.json({ error: 'Conta não encontrada' }, { status: 404 });
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');

        const filter: Record<string, unknown> = { creator_account_id: account._id };
        if (status) filter.status = status;

        const applications = await CampaignApplication.find(filter)
            .sort({ created_at: -1 })
            .populate('campaign_id', 'title brand_name brand_logo status content_type slots slots_filled application_deadline content_deadline budget_per_creator includes_product')
            .lean();

        return NextResponse.json({ applications });
    } catch (error) {
        console.error('Erro ao listar candidaturas:', error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
}
