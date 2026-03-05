import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectMongo } from '@/lib/mongoose';
import Account from '@/models/Account';
import CampaignApplication from '@/models/CampaignApplication';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function isValidUrl(str: string): boolean {
    try {
        const u = new URL(str);
        return u.protocol === 'http:' || u.protocol === 'https:';
    } catch {
        return false;
    }
}

// POST - Creator adiciona uma entrega (delivery) à sua candidatura aprovada
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ campaignId: string; applicationId: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        await connectMongo();

        const authUserId = (session.user as { auth_user_id?: string }).auth_user_id || session.user.id;
        const account = await Account.findOne({ auth_user_id: authUserId }).lean();
        if (!account) {
            return NextResponse.json({ error: 'Conta não encontrada' }, { status: 404 });
        }

        const { campaignId, applicationId } = await params;
        const body = await request.json();
        const { type, url } = body;

        if (!url || typeof url !== 'string' || !url.trim()) {
            return NextResponse.json({ error: 'O campo URL é obrigatório.' }, { status: 400 });
        }
        if (!isValidUrl(url.trim())) {
            return NextResponse.json({ error: 'Informe uma URL válida (http ou https).' }, { status: 400 });
        }
        const typeStr = (type != null && String(type).trim()) ? String(type).trim() : 'content';

        const application = await CampaignApplication.findOne({
            _id: applicationId,
            campaign_id: campaignId,
            creator_account_id: account._id,
        }).lean();

        if (!application) {
            return NextResponse.json({ error: 'Candidatura não encontrada ou você não tem permissão.' }, { status: 404 });
        }

        if (application.status !== 'approved' && application.status !== 'completed') {
            return NextResponse.json({ error: 'Só é possível enviar conteúdo para campanhas em que você foi aprovado.' }, { status: 403 });
        }

        const newDelivery = {
            type: typeStr,
            url: url.trim(),
            submitted_at: new Date(),
            status: 'pending_review',
        };

        const updated = await CampaignApplication.findByIdAndUpdate(
            applicationId,
            { $push: { deliveries: newDelivery } },
            { new: true }
        ).lean();

        return NextResponse.json({ success: true, application: updated });
    } catch (error) {
        console.error('Erro ao criar entrega:', error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
}
