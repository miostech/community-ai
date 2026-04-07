import mongoose from 'mongoose';
import Account from '@/models/Account';

export const DOME_CREATORS_PORTFOLIO_TOP_N = 30;

export type DomeCreatorsSortBy = 'engagement' | 'followers';

export interface DomeCreatorPortfolioRow {
    _id: string;
    first_name: string;
    last_name: string;
    avatar_url: string | null;
    link_instagram: string | null;
    link_tiktok: string | null;
    followers: number | null;
    engagementScore: number | null;
    category: string | null;
}

export interface DomeCreatorsPortfolioStats {
    totalCreators: number;
    totalFollowers: number;
    totalViews: number;
    followersUpdatedAt: string | null;
}

export async function getDomeCreatorsPortfolio(sortBy: DomeCreatorsSortBy): Promise<{
    creators: DomeCreatorPortfolioRow[];
    stats: DomeCreatorsPortfolioStats;
    sortBy: DomeCreatorsSortBy;
}> {
    const filter = {
        $or: [
            { link_instagram: { $exists: true, $nin: [null, ''], $type: 'string', $regex: /\S/ } },
            { link_tiktok: { $exists: true, $nin: [null, ''], $type: 'string', $regex: /\S/ } },
            { link_youtube: { $exists: true, $nin: [null, ''], $type: 'string', $regex: /\S/ } },
        ],
    };

    const effectiveFollowersExpr = {
        $ifNull: [{ $ifNull: ['$cached_followers_total', '$followers_at_signup'] }, 0],
    };

    const sortStage =
        sortBy === 'followers'
            ? { $sort: { effectiveFollowers: -1 as const, cached_engagement_score: -1 as const } }
            : { $sort: { cached_engagement_score: -1 as const, effectiveFollowers: -1 as const } };

    const [topPipelineResult, aggResult] = await Promise.all([
        Account.aggregate([
            { $match: filter },
            { $addFields: { effectiveFollowers: effectiveFollowersExpr } },
            sortStage,
            { $limit: DOME_CREATORS_PORTFOLIO_TOP_N },
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
                    views: { $ifNull: ['$cached_total_views', 0] },
                },
            },
            {
                $group: {
                    _id: null,
                    totalCreators: { $sum: 1 },
                    totalFollowers: { $sum: '$total' },
                    totalViews: { $sum: '$views' },
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

    const stats: DomeCreatorsPortfolioStats = aggResult[0]
        ? {
              totalCreators: aggResult[0].totalCreators,
              totalFollowers: aggResult[0].totalFollowers,
              totalViews: aggResult[0].totalViews as number,
              followersUpdatedAt: latestUpdated ? latestUpdated.toISOString() : null,
          }
        : { totalCreators: 0, totalFollowers: 0, totalViews: 0, followersUpdatedAt: null };

    const creators: DomeCreatorPortfolioRow[] = topAccounts.map((a) => {
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

    return { creators, stats, sortBy };
}
