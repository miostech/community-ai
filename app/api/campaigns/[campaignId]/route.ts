import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { auth } from '@/lib/auth';
import { connectMongo } from '@/lib/mongoose';
import Campaign from '@/models/Campaign';
import Account from '@/models/Account';
import CampaignApplication from '@/models/CampaignApplication';
import { createNotification } from '@/lib/notifications';
import { normalizeBudgetTotalCentsInput } from '@/lib/campaign-budget-total';

/** Mínimo de budget total (centavos) para a marca ativar e reter saldo — alinhado ao wizard (R$ 500). */
const MIN_ACTIVATION_BUDGET_CENTS = 50_000;

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

        const authUserId = (session.user as { auth_user_id?: string }).auth_user_id || session.user.id;
        const account = await Account.findOne({ auth_user_id: authUserId }).select('role _id').lean();
        const role = account?.role || 'user';
        const cBrand = (campaign as { brand_account_id?: { toString(): string } }).brand_account_id;
        const ownerId = cBrand ? cBrand.toString() : null;
        const isOwner = account && ownerId && account._id.toString() === ownerId;
        const isStaff = ['moderator', 'admin'].includes(role);
        const isActive = (campaign as { status?: string }).status === 'active';

        let hasApplication = false;
        if (account && !isStaff && !isOwner && !isActive) {
            const app = await CampaignApplication.findOne({
                campaign_id: campaignId,
                creator_account_id: account._id,
            })
                .select('_id')
                .lean();
            hasApplication = Boolean(app);
        }

        if (!isStaff && !isOwner && !isActive && !hasApplication) {
            return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
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

        const authUserId = (session.user as { auth_user_id?: string }).auth_user_id || session.user.id;
        const account = await Account.findOne({ auth_user_id: authUserId }).select('role _id').lean();
        const role = account?.role || 'user';
        const existing = await Campaign.findById(campaignId)
            .select('brand_account_id status budget_total_cents wallet_reserved_cents')
            .lean();
        if (!existing) {
            return NextResponse.json({ error: 'Campanha não encontrada' }, { status: 404 });
        }
        const exBrand = (existing as { brand_account_id?: { toString(): string } }).brand_account_id;
        const ownerId = exBrand ? exBrand.toString() : null;
        const isOwner = account && ownerId && account._id.toString() === ownerId;
        const isStaff = ['moderator', 'admin'].includes(role);
        if (!isStaff && !isOwner) {
            return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
        }

        const existingStatus = (existing as { status?: string }).status;

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
            'budget_total_cents',
        ];

        const updateData: Record<string, unknown> = {};
        for (const field of allowedFields) {
            if (body[field] === undefined) continue;
            if (field === 'budget_total_cents') {
                const coerced = normalizeBudgetTotalCentsInput(body[field]);
                if (coerced !== undefined) {
                    updateData[field] = coerced;
                }
                continue;
            }
            updateData[field] = body[field];
        }

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json({ error: 'Nenhum campo para atualizar' }, { status: 400 });
        }

        const isActivatingFromDraft =
            updateData.status === 'active' && existingStatus === 'draft';
        const isMarcaWalletHold =
            isActivatingFromDraft && role === 'marca' && isOwner && (existing as { brand_account_id?: unknown }).brand_account_id;

        const mergedBudgetCents =
            updateData.budget_total_cents !== undefined
                ? Math.round(Number(updateData.budget_total_cents))
                : typeof (existing as { budget_total_cents?: number }).budget_total_cents === 'number'
                  ? Math.round((existing as { budget_total_cents: number }).budget_total_cents)
                  : 0;

        let campaign: Record<string, unknown> | null = null;

        if (isMarcaWalletHold) {
            if (mergedBudgetCents < MIN_ACTIVATION_BUDGET_CENTS) {
                return NextResponse.json(
                    {
                        error: 'Defina o budget total da campanha (mínimo R$ 500) antes de ativar.',
                    },
                    { status: 400 }
                );
            }

            const dbSession = await mongoose.startSession();
            try {
                await dbSession.withTransaction(async () => {
                    const brandId = (existing as { brand_account_id: mongoose.Types.ObjectId }).brand_account_id;
                    const acc = await Account.findOneAndUpdate(
                        {
                            _id: brandId,
                            $expr: {
                                $gte: [{ $ifNull: ['$wallet_balance_cents', 0] }, mergedBudgetCents],
                            },
                        },
                        { $inc: { wallet_balance_cents: -mergedBudgetCents } },
                        { new: true, session: dbSession }
                    ).lean();

                    if (!acc) {
                        throw new Error('INSUFFICIENT_WALLET');
                    }

                    const setPayload = { ...updateData, wallet_reserved_cents: mergedBudgetCents };
                    const updated = await Campaign.findByIdAndUpdate(
                        campaignId,
                        { $set: setPayload },
                        { new: true, runValidators: true, session: dbSession }
                    ).lean();
                    campaign = updated as Record<string, unknown> | null;
                });
            } catch (e) {
                if (e instanceof Error && e.message === 'INSUFFICIENT_WALLET') {
                    return NextResponse.json(
                        {
                            error: 'Saldo insuficiente na carteira. Adicione saldo ou reduza o budget total da campanha.',
                        },
                        { status: 400 }
                    );
                }
                throw e;
            } finally {
                void dbSession.endSession();
            }
        } else {
            const updated = await Campaign.findByIdAndUpdate(
                campaignId,
                { $set: updateData },
                { new: true, runValidators: true }
            ).lean();
            campaign = updated as Record<string, unknown> | null;
        }

        if (!campaign) {
            return NextResponse.json({ error: 'Campanha não encontrada' }, { status: 404 });
        }

        const isActivating = newStatus === 'active' && existingStatus !== 'active';

        if (isActivating && (campaign as { status?: string }).status === 'active') {
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
                        campaignId,
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
