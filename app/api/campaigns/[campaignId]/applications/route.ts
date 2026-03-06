import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectMongo } from '@/lib/mongoose';
import Account from '@/models/Account';
import Campaign from '@/models/Campaign';
import CampaignApplication from '@/models/CampaignApplication';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function isMidiaKitComplete(account: Record<string, unknown>): boolean {
    return Boolean(
        account.birth_date &&
        account.gender &&
        account.category &&
        Array.isArray(account.niches) && (account.niches as string[]).length > 0 &&
        (account.address_country as string)?.trim() &&
        (account.link_instagram as string)?.trim() &&
        (account.link_tiktok as string)?.trim() &&
        Array.isArray(account.portfolio_videos) && (account.portfolio_videos as string[]).length >= 3
    );
}

// GET - Listar candidaturas de uma campanha (para marca/admin) ou do creator logado
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
        const { searchParams } = new URL(request.url);
        const view = searchParams.get('view');

        await connectMongo();

        const authUserId = (session.user as any).auth_user_id || session.user.id;
        const account = await Account.findOne({ auth_user_id: authUserId }).lean();
        if (!account) {
            return NextResponse.json({ error: 'Conta não encontrada' }, { status: 404 });
        }

        if (view === 'mine') {
            const application = await CampaignApplication.findOne({
                campaign_id: campaignId,
                creator_account_id: account._id,
            }).lean();

            return NextResponse.json({ application: application || null });
        }

        const applications = await CampaignApplication.find({ campaign_id: campaignId })
            .sort({ created_at: -1 })
            .populate('creator_account_id', 'first_name last_name avatar_url link_instagram link_tiktok niches category address_city address_state')
            .lean();

        return NextResponse.json({ applications });
    } catch (error) {
        console.error('Erro ao listar candidaturas:', error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
}

// POST - Creator se candidata a uma campanha
export async function POST(
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

        const authUserId = (session.user as any).auth_user_id || session.user.id;
        const account = await Account.findOne({ auth_user_id: authUserId }).lean();
        if (!account) {
            return NextResponse.json({ error: 'Conta não encontrada' }, { status: 404 });
        }

        const acc = account as { portfolio_terms_accepted_at?: Date | null };
        if (!acc.portfolio_terms_accepted_at) {
            return NextResponse.json(
                { error: 'É necessário aceitar os termos do portfólio (termos de uso e privacidade) para participar de campanhas. Salve seu portfólio e aceite os termos na primeira vez.' },
                { status: 403 }
            );
        }

        if (!isMidiaKitComplete(account as unknown as Record<string, unknown>)) {
            return NextResponse.json(
                { error: 'Complete seu Portfólio antes de se candidatar a campanhas.' },
                { status: 400 }
            );
        }

        const campaign = await Campaign.findById(campaignId);
        if (!campaign) {
            return NextResponse.json({ error: 'Campanha não encontrada' }, { status: 404 });
        }
        if (campaign.status !== 'active') {
            return NextResponse.json({ error: 'Esta campanha não está aceitando candidaturas.' }, { status: 400 });
        }
        const slotsUnlimited = campaign.slots_unlimited === true;
        if (!slotsUnlimited && campaign.slots_filled >= campaign.slots) {
            return NextResponse.json({ error: 'Todas as vagas já foram preenchidas.' }, { status: 400 });
        }
        if (campaign.application_deadline && new Date() > campaign.application_deadline) {
            return NextResponse.json({ error: 'O prazo para candidaturas já encerrou.' }, { status: 400 });
        }

        const existing = await CampaignApplication.findOne({
            campaign_id: campaignId,
            creator_account_id: account._id,
        });
        if (existing) {
            return NextResponse.json({ error: 'Você já se candidatou a esta campanha.' }, { status: 409 });
        }

        const body = await request.json();

        if (!body.pitch?.trim()) {
            return NextResponse.json({ error: 'O campo pitch é obrigatório.' }, { status: 400 });
        }

        const application = await CampaignApplication.create({
            campaign_id: campaignId,
            creator_account_id: account._id,
            pitch: body.pitch,
            content_proposal: body.content_proposal || '',
            is_customer: body.is_customer || false,
        });

        await Campaign.findByIdAndUpdate(campaignId, {
            $inc: { applications_count: 1 },
        });

        return NextResponse.json({ success: true, application }, { status: 201 });
    } catch (error: any) {
        if (error?.code === 11000) {
            return NextResponse.json({ error: 'Você já se candidatou a esta campanha.' }, { status: 409 });
        }
        console.error('Erro ao criar candidatura:', error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
}
