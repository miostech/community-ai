import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectMongo } from '@/lib/mongoose';
import Account from '@/models/Account';
import mongoose from 'mongoose';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const TOP_N = 20;

// GET - Top creators para portfólio marcas + métricas agregadas
export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        await connectMongo();

        const authUserId = (session.user as { auth_user_id?: string }).auth_user_id || session.user.id;
        const adminAccount = await Account.findOne({ auth_user_id: authUserId }).select('role').lean();
        const role = (adminAccount as { role?: string } | null)?.role;

        if (!adminAccount || role !== 'moderator') {
            return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
        }

        const filter = {
            $or: [
                { link_instagram: { $exists: true, $nin: [null, ''], $type: 'string', $regex: /\S/ } },
                { link_tiktok: { $exists: true, $nin: [null, ''], $type: 'string', $regex: /\S/ } },
            ],
        };

        const effectiveFollowersExpr = {
            $ifNull: [
                { $ifNull: ['$cached_followers_total', '$followers_at_signup'] },
                0,
            ],
        };

        const [topPipelineResult, aggResult] = await Promise.all([
            Account.aggregate([
                { $match: filter },
                { $addFields: { effectiveFollowers: effectiveFollowersExpr } },
                { $sort: { effectiveFollowers: -1 } },
                { $limit: TOP_N },
                {
                    $project: {
                        _id: 1,
                        first_name: 1,
                        last_name: 1,
                        avatar_url: 1,
                        link_instagram: 1,
                        link_tiktok: 1,
                        followers_at_signup: 1,
                        cached_followers_total: 1,
                        cached_followers_updated_at: 1,
                        cached_engagement_score: 1,
                        category: 1,
                    },
                },
            ]).exec(),
            Account.aggregate([
                { $match: filter },
                {
                    $project: {
                        total: effectiveFollowersExpr,
                    },
                },
                {
                    $group: {
                        _id: null,
                        totalCreators: { $sum: 1 },
                        totalFollowers: { $sum: '$total' },
                    },
                },
            ]),
        ]);

        const topAccounts = topPipelineResult;

        const latestUpdated = topAccounts.reduce((acc: Date | null, a) => {
            const at = (a as { cached_followers_updated_at?: Date }).cached_followers_updated_at;
            if (!at) return acc;
            const d = new Date(at);
            return !acc || d > acc ? d : acc;
        }, null as Date | null);

        const stats = aggResult[0]
            ? {
                  totalCreators: aggResult[0].totalCreators,
                  totalFollowers: aggResult[0].totalFollowers,
                  followersUpdatedAt: latestUpdated ? latestUpdated.toISOString() : null,
              }
            : { totalCreators: 0, totalFollowers: 0, followersUpdatedAt: null };

        const creators = topAccounts.map((a) => {
            const cached = (a as { cached_followers_total?: number }).cached_followers_total;
            const atSignup = (a as { followers_at_signup?: number }).followers_at_signup;
            return {
                _id: (a as { _id: mongoose.Types.ObjectId })._id.toString(),
                first_name: (a as { first_name: string }).first_name,
                last_name: (a as { last_name: string }).last_name,
                avatar_url: (a as { avatar_url?: string }).avatar_url ?? null,
                link_instagram: (a as { link_instagram?: string }).link_instagram ?? null,
                link_tiktok: (a as { link_tiktok?: string }).link_tiktok ?? null,
                followers: cached ?? atSignup ?? null,
                engagementScore: (a as { cached_engagement_score?: number }).cached_engagement_score ?? null,
                category: (a as { category?: string }).category ?? null,
            };
        });

        return NextResponse.json({
            creators,
            stats,
        });
    } catch (error) {
        console.error('Erro ao buscar apresentação:', error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
}
