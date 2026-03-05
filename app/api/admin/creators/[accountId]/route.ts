import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectMongo } from '@/lib/mongoose';
import Account from '@/models/Account';
import Campaign from '@/models/Campaign';
import CampaignApplication from '@/models/CampaignApplication';
import Post from '@/models/Post';
import Comment from '@/models/Comment';
import mongoose from 'mongoose';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET - Dados completos de um creator para moderadores/admins
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ accountId: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        await connectMongo();

        const authUserId = (session.user as { auth_user_id?: string }).auth_user_id || session.user.id;
        const moderator = await Account.findOne({ auth_user_id: authUserId }).select('role').lean();
        const role = (moderator as { role?: string } | null)?.role;

        if (!moderator || !['moderator', 'admin'].includes(role || '')) {
            return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
        }

        const { accountId } = await params;
        if (!mongoose.Types.ObjectId.isValid(accountId)) {
            return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
        }

        const account = await Account.findById(accountId)
            .select(
                'first_name last_name email avatar_url link_instagram link_tiktok link_youtube ' +
                'birth_date gender category niches address_country address_state address_city ' +
                'link_media_kit portfolio_videos role is_founding_member followers_at_signup ' +
                'plan created_at'
            )
            .lean();

        if (!account) {
            return NextResponse.json({ error: 'Creator não encontrado' }, { status: 404 });
        }

        // Buscar métricas de interação na Dome
        const [postsCount, commentsCount, likesReceivedAgg] = await Promise.all([
            Post.countDocuments({ author_id: accountId }),
            Comment.countDocuments({ author_id: accountId }),
            Post.aggregate([
                { $match: { author_id: new mongoose.Types.ObjectId(accountId) } },
                { $group: { _id: null, total: { $sum: '$likes_count' } } },
            ]),
        ]);
        const likesReceived = likesReceivedAgg[0]?.total ?? 0;

        // Buscar histórico de candidaturas do creator
        const applications = await CampaignApplication.find({ creator_account_id: accountId })
            .sort({ created_at: -1 })
            .lean();

        // Enriquecer com dados da campanha
        const campaignIds = applications.map((a) => a.campaign_id);
        const campaigns = await Campaign.find({ _id: { $in: campaignIds } })
            .select('title brand_name brand_logo status')
            .lean();

        const campaignMap: Record<string, { title: string; brand_name: string; brand_logo?: string; status: string }> = {};
        for (const c of campaigns) {
            campaignMap[c._id.toString()] = {
                title: c.title,
                brand_name: c.brand_name,
                brand_logo: c.brand_logo,
                status: c.status,
            };
        }

        const enrichedApplications = applications.map((a) => ({
            _id: a._id,
            campaign_id: a.campaign_id,
            campaign: campaignMap[a.campaign_id.toString()] || null,
            pitch: a.pitch,
            status: a.status,
            rejection_reason: a.rejection_reason,
            created_at: a.created_at,
        }));

        return NextResponse.json({
            success: true,
            creator: account,
            applications: enrichedApplications,
            stats: {
                posts_count: postsCount,
                comments_count: commentsCount,
                likes_received: likesReceived,
            },
        });
    } catch (error) {
        console.error('Erro ao buscar creator:', error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
}
