import { NextResponse } from 'next/server';
import { connectMongo } from '@/lib/mongoose';
import Account from '@/models/Account';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        await connectMongo();

        const effectiveFollowersExpr = {
            $ifNull: [{ $ifNull: ['$cached_followers_total', '$followers_at_signup'] }, 0],
        };

        const [totalAccounts, agg] = await Promise.all([
            Account.countDocuments(),
            Account.aggregate([
                {
                    $match: {
                        $or: [
                            { link_instagram: { $exists: true, $nin: [null, ''], $type: 'string', $regex: /\S/ } },
                            { link_tiktok: { $exists: true, $nin: [null, ''], $type: 'string', $regex: /\S/ } },
                            { link_youtube: { $exists: true, $nin: [null, ''], $type: 'string', $regex: /\S/ } },
                        ],
                    },
                },
                {
                    $project: {
                        total: effectiveFollowersExpr,
                        views: { $ifNull: ['$cached_total_views', 0] },
                    },
                },
                {
                    $group: {
                        _id: null,
                        totalFollowers: { $sum: '$total' },
                        totalViews: { $sum: '$views' },
                    },
                },
            ]).exec(),
        ]);

        const row = agg[0] || { totalFollowers: 0, totalViews: 0 };

        return NextResponse.json({
            totalCreators: totalAccounts,
            totalFollowers: row.totalFollowers,
            totalViews: row.totalViews,
        });
    } catch (error) {
        console.error('[api/community-stats GET]', error);
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
    }
}
