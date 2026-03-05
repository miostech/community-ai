import { NextRequest, NextResponse } from 'next/server';
import { connectMongo } from '@/lib/mongoose';
import WeeklyRankingModel from '@/models/WeeklyRanking';
import mongoose from 'mongoose';

export async function GET(request: NextRequest) {
    try {
        await connectMongo();

        const accountId = request.nextUrl.searchParams.get('accountId');

        if (accountId) {
            const wins = await WeeklyRankingModel.find({
                account_id: new mongoose.Types.ObjectId(accountId),
                position: 1,
            })
                .sort({ week_start: -1 })
                .lean();

            return NextResponse.json({
                accountId,
                totalWins: wins.length,
                weeks: wins.map((w) => ({
                    weekStart: w.week_start,
                    weekEnd: w.week_end,
                    score: w.score,
                    stats: w.stats,
                })),
            });
        }

        const winnersAgg = await WeeklyRankingModel.aggregate([
            { $match: { position: 1 } },
            { $sort: { week_start: -1 } },
            {
                $group: {
                    _id: '$account_id',
                    totalWins: { $sum: 1 },
                    lastWinName: { $first: '$account_name' },
                    lastWinAvatar: { $first: '$account_avatar' },
                    lastWinAt: { $first: '$week_start' },
                    weeks: {
                        $push: {
                            weekStart: '$week_start',
                            weekEnd: '$week_end',
                            score: '$score',
                        },
                    },
                },
            },
            { $sort: { totalWins: -1, lastWinAt: -1 } },
        ]);

        return NextResponse.json(
            winnersAgg.map((w) => ({
                accountId: w._id.toString(),
                name: w.lastWinName,
                avatar: w.lastWinAvatar || null,
                totalWins: w.totalWins,
                weeks: w.weeks,
            }))
        );
    } catch (error) {
        console.error('Erro ao buscar ranking wins:', error);
        return NextResponse.json({ error: 'Erro ao buscar histórico' }, { status: 500 });
    }
}
