import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectMongo } from '@/lib/mongoose';
import Account from '@/models/Account';
import Campaign from '@/models/Campaign';
import CampaignApplication from '@/models/CampaignApplication';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// PATCH - Moderador/admin aprova ou rejeita uma candidatura
export async function PATCH(
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
        const account = await Account.findOne({ auth_user_id: authUserId }).select('role').lean();

        if (!account || !['moderator', 'admin'].includes((account as { role?: string }).role || '')) {
            return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
        }

        const { campaignId, applicationId } = await params;
        const body = await request.json();
        const { status, rejection_reason } = body;

        if (!['approved', 'rejected'].includes(status)) {
            return NextResponse.json({ error: 'Status inválido. Use "approved" ou "rejected".' }, { status: 400 });
        }

        const application = await CampaignApplication.findOne({
            _id: applicationId,
            campaign_id: campaignId,
        });

        if (!application) {
            return NextResponse.json({ error: 'Candidatura não encontrada' }, { status: 404 });
        }

        if (application.status !== 'pending') {
            return NextResponse.json({ error: 'Esta candidatura já foi processada.' }, { status: 409 });
        }

        const updateFields: Record<string, unknown> = { status };

        if (status === 'approved') {
            updateFields.approved_at = new Date();
        } else {
            updateFields.rejected_at = new Date();
            if (rejection_reason?.trim()) {
                updateFields.rejection_reason = rejection_reason.trim();
            }
        }

        const updated = await CampaignApplication.findByIdAndUpdate(
            applicationId,
            { $set: updateFields },
            { new: true }
        ).lean();

        if (status === 'approved') {
            await Campaign.findByIdAndUpdate(campaignId, {
                $inc: { slots_filled: 1 },
            });
        }

        return NextResponse.json({ success: true, application: updated });
    } catch (error) {
        console.error('Erro ao atualizar candidatura:', error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
}
