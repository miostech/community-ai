import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectMongo } from '@/lib/mongoose';
import Campaign from '@/models/Campaign';
import Account from '@/models/Account';
import { createNotification } from '@/lib/notifications';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET - Detalhes de uma campanha
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ campaignId: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const { campaignId } = await params;

        await connectMongo();

        const campaign = await Campaign.findById(campaignId).lean();

        if (!campaign) {
            return NextResponse.json({ error: 'Campanha não encontrada' }, { status: 404 });
        }

        return NextResponse.json({ campaign });
    } catch (error) {
        console.error('Erro ao buscar campanha:', error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
}

// PATCH - Atualizar campanha
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ campaignId: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const { campaignId } = await params;
        const body = await request.json();
        const newStatus = body.status;

        await connectMongo();

        const previousCampaign = await Campaign.findById(campaignId).select('status').lean();
        const isActivating = newStatus === 'active' && previousCampaign?.status !== 'active';

        const allowedFields = [
            'brand_name', 'brand_logo', 'brand_website', 'brand_instagram',
            'title', 'description', 'briefing',
            'content_type', 'content_usage',
            'category', 'niches', 'filters',
            'slots', 'slots_unlimited', 'budget_per_creator', 'payment_type', 'budget_per_1000_views', 'requires_invoice',
            'includes_product', 'product_description',
            'deliverables',
            'application_deadline', 'content_deadline', 'start_date',
            'status', 'images',
        ];

        const updateData: Record<string, unknown> = {};
        for (const field of allowedFields) {
            if (body[field] !== undefined) {
                updateData[field] = body[field];
            }
        }

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json({ error: 'Nenhum campo para atualizar' }, { status: 400 });
        }

        const campaign = await Campaign.findByIdAndUpdate(
            campaignId,
            { $set: updateData },
            { new: true, runValidators: true }
        ).lean();

        if (!campaign) {
            return NextResponse.json({ error: 'Campanha não encontrada' }, { status: 404 });
        }

        if (isActivating && campaign.status === 'active') {
            const authUserId = (session.user as { auth_user_id?: string }).auth_user_id || session.user.id;
            const actorAccount = await Account.findOne({ auth_user_id: authUserId }).select('_id').lean();
            if (actorAccount) {
                const recipients = await Account.find({ _id: { $ne: actorAccount._id } }).select('_id').lean();
                const brandName = (campaign as { brand_name?: string }).brand_name || 'Nova campanha';
                for (const rec of recipients) {
                    await createNotification({
                        recipientId: rec._id,
                        actorId: actorAccount._id,
                        type: 'new_campaign',
                        campaignId: campaign._id,
                        contentPreview: brandName,
                    });
                }
            }
        }

        return NextResponse.json({ success: true, campaign });
    } catch (error) {
        console.error('Erro ao atualizar campanha:', error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
}
