import { NextResponse } from 'next/server';
import { connectMongo } from '@/lib/mongoose';
import AccountModel from '@/models/Account';
import AccountPayment from '@/models/AccountPayment';
import Post from '@/models/Post';
import Like from '@/models/Like';
import Comment from '@/models/Comment';
import WeeklyRankingModel from '@/models/WeeklyRanking';
import mongoose from 'mongoose';
import { getPreviousWeekBounds } from '@/lib/week-helpers';

export async function GET(request: Request) {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        await connectMongo();

        const { weekStart, weekEnd } = getPreviousWeekBounds();
        const weekDateFilter = { $gte: weekStart, $lte: weekEnd };

        const existing = await WeeklyRankingModel.findOne({ week_start: weekStart }).lean();
        if (existing) {
            return NextResponse.json({ message: 'Snapshot already exists for this week', weekStart });
        }

        const accounts = await AccountModel.find({})
            .select('_id first_name last_name email avatar_url')
            .lean();

        const accountIds = accounts.map((a) => a._id);

        const likesGivenAgg = await Like.aggregate([
            { $match: { user_id: { $in: accountIds }, target_type: 'post', created_at: weekDateFilter } },
            { $lookup: { from: 'posts', localField: 'target_id', foreignField: '_id', as: 'postDoc' } },
            { $unwind: '$postDoc' },
            { $match: { $expr: { $ne: ['$postDoc.author_id', '$user_id'] } } },
            { $group: { _id: '$user_id', count: { $sum: 1 } } },
        ]);
        const likesGivenMap = new Map<string, number>();
        likesGivenAgg.forEach((item: { _id: mongoose.Types.ObjectId; count: number }) => {
            likesGivenMap.set(item._id.toString(), item.count);
        });

        const likesReceivedAgg = await Like.aggregate([
            { $match: { target_type: 'post', created_at: weekDateFilter } },
            { $lookup: { from: 'posts', localField: 'target_id', foreignField: '_id', as: 'postDoc' } },
            { $unwind: '$postDoc' },
            { $match: { $expr: { $ne: ['$user_id', '$postDoc.author_id'] }, 'postDoc.author_id': { $in: accountIds }, 'postDoc.is_deleted': { $ne: true } } },
            { $group: { _id: '$postDoc.author_id', count: { $sum: 1 } } },
        ]);
        const likesReceivedMap = new Map<string, number>();
        likesReceivedAgg.forEach((item: { _id: mongoose.Types.ObjectId; count: number }) => {
            likesReceivedMap.set(item._id.toString(), item.count);
        });

        const postsCountAgg = await Post.aggregate([
            { $match: { author_id: { $in: accountIds }, is_deleted: { $ne: true }, created_at: weekDateFilter } },
            { $group: { _id: '$author_id', count: { $sum: 1 } } },
        ]);
        const postsMap = new Map<string, number>();
        postsCountAgg.forEach((item: { _id: mongoose.Types.ObjectId; count: number }) => {
            postsMap.set(item._id.toString(), item.count);
        });

        const commentsCountAgg = await Comment.aggregate([
            { $match: { author_id: { $in: accountIds }, is_deleted: { $ne: true }, created_at: weekDateFilter } },
            { $lookup: { from: 'posts', localField: 'post_id', foreignField: '_id', as: 'postDoc' } },
            { $unwind: '$postDoc' },
            { $match: { $expr: { $ne: ['$author_id', '$postDoc.author_id'] } } },
            { $group: { _id: '$author_id', count: { $sum: 1 } } },
        ]);
        const commentsMap = new Map<string, number>();
        commentsCountAgg.forEach((item: { _id: mongoose.Types.ObjectId; count: number }) => {
            commentsMap.set(item._id.toString(), item.count);
        });

        const accountEmails = accounts
            .map((a) => (a as any).email?.toLowerCase?.().trim())
            .filter(Boolean) as string[];
        const refundedAgg = await AccountPayment.aggregate([
            { $match: { email: { $in: accountEmails } } },
            { $sort: { createdAt: -1 } },
            { $group: { _id: '$email', lastStatus: { $first: '$order_status' } } },
            { $match: { lastStatus: 'refunded' } },
        ]);
        const refundedEmails = new Set<string>(refundedAgg.map((r: { _id: string }) => r._id));
        const refundedAccountIds = new Set<string>();
        accounts.forEach((a) => {
            const email = (a as any).email?.toLowerCase?.().trim();
            if (email && refundedEmails.has(email)) {
                refundedAccountIds.add(a._id.toString());
            }
        });

        const scored = accounts.map((account) => {
            const id = account._id.toString();
            const likesGiven = likesGivenMap.get(id) || 0;
            const likesReceived = likesReceivedMap.get(id) || 0;
            const postsCount = postsMap.get(id) || 0;
            const commentsCount = commentsMap.get(id) || 0;
            const score = refundedAccountIds.has(id)
                ? 0
                : likesGiven + likesReceived + (postsCount * 2) + commentsCount;

            const fullName = account.last_name
                ? `${account.first_name} ${account.last_name}`.trim()
                : account.first_name;

            return {
                account_id: account._id,
                account_name: fullName,
                account_avatar: account.avatar_url || undefined,
                score,
                stats: { likesGiven, likesReceived, postsCount, commentsCount },
            };
        });

        scored.sort((a, b) => b.score - a.score);
        const top10 = scored.slice(0, 10).filter((u) => u.score > 0);

        if (top10.length === 0) {
            return NextResponse.json({ message: 'No users with score > 0 for this week', weekStart });
        }

        const docs = top10.map((user, index) => ({
            account_id: user.account_id,
            account_name: user.account_name,
            account_avatar: user.account_avatar,
            position: index + 1,
            score: user.score,
            week_start: weekStart,
            week_end: weekEnd,
            stats: user.stats,
        }));

        await WeeklyRankingModel.insertMany(docs, { ordered: false }).catch((err) => {
            if (err.code !== 11000) throw err;
        });

        return NextResponse.json({
            message: 'Weekly ranking snapshot saved',
            weekStart,
            weekEnd,
            winner: top10[0]?.account_name,
            entriesSaved: top10.length,
        });
    } catch (error) {
        console.error('Erro no cron weekly-ranking:', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
