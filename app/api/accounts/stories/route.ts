import { NextResponse } from 'next/server';
import { connectMongo } from '@/lib/mongoose';
import AccountModel from '@/models/Account';
import AccountPayment from '@/models/AccountPayment';
import Post from '@/models/Post';
import Like from '@/models/Like';
import Comment from '@/models/Comment';
import StoryModel, { STORY_EXPIRY_HOURS } from '@/models/Story';
import WeeklyRankingModel from '@/models/WeeklyRanking';
import mongoose from 'mongoose';
import { getCurrentWeekBounds, formatWeekRange } from '@/lib/week-helpers';

export async function GET() {
    try {
        await connectMongo();

        const { weekStart, weekEnd } = getCurrentWeekBounds();
        const weekDateFilter = { $gte: weekStart, $lte: weekEnd };

        const since = new Date(Date.now() - STORY_EXPIRY_HOURS * 60 * 60 * 1000);
        const storyAgg = await StoryModel.aggregate([
            { $match: { created_at: { $gte: since } } },
            { $group: { _id: '$account_id', latestStoryAt: { $max: '$created_at' } } },
        ]).exec();
        const latestStoryAtMap = new Map<string, Date>();
        const accountIdsWithStories: mongoose.Types.ObjectId[] = [];
        storyAgg.forEach((r: { _id: mongoose.Types.ObjectId; latestStoryAt: Date }) => {
            latestStoryAtMap.set(r._id.toString(), r.latestStoryAt);
            accountIdsWithStories.push(r._id);
        });

        const topByAccess = await AccountModel.find({})
            .select('_id')
            .sort({ last_access_at: -1 })
            .limit(200)
            .lean();
        const topIds = new Set(topByAccess.map((a) => a._id.toString()));
        accountIdsWithStories.forEach((id) => topIds.add(id.toString()));
        const accountIds = Array.from(topIds).map((id) => new mongoose.Types.ObjectId(id));

        const accounts = await AccountModel.find({ _id: { $in: accountIds } })
            .select('_id first_name last_name email avatar_url link_instagram link_tiktok link_youtube primary_social_link last_access_at')
            .lean();

        // 1. Likes dados na semana: só em posts, excluir auto-curtida
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

        // 2. Likes recebidos na semana: só em posts do usuário, curtidos por outro
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

        // 3. Posts criados na semana
        const postsCountAgg = await Post.aggregate([
            { $match: { author_id: { $in: accountIds }, is_deleted: { $ne: true }, created_at: weekDateFilter } },
            { $group: { _id: '$author_id', count: { $sum: 1 } } },
        ]);
        const postsMap = new Map<string, number>();
        postsCountAgg.forEach((item: { _id: mongoose.Types.ObjectId; count: number }) => {
            postsMap.set(item._id.toString(), item.count);
        });

        // 4. Comentários na semana: só em posts de outros
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

        // Buscar quantas vezes o #1 atual já venceu (position === 1)
        const winsAgg = await WeeklyRankingModel.aggregate([
            { $match: { position: 1 } },
            { $group: { _id: '$account_id', totalWins: { $sum: 1 } } },
        ]);
        const winsMap = new Map<string, number>();
        winsAgg.forEach((item: { _id: mongoose.Types.ObjectId; totalWins: number }) => {
            winsMap.set(item._id.toString(), item.totalWins);
        });

        // Verificar quais contas têm o último pagamento com status "refunded" (busca por email, pois o webhook não preenche account_id)
        const accountEmails = accounts
            .map((a) => (a as any).email?.toLowerCase?.().trim())
            .filter(Boolean) as string[];

        const refundedAgg = await AccountPayment.aggregate([
            { $match: { email: { $in: accountEmails } } },
            { $sort: { createdAt: -1 } },
            { $group: { _id: '$email', lastStatus: { $first: '$order_status' } } },
            { $match: { lastStatus: 'refunded' } },
        ]);
        const refundedEmails = new Set<string>(
            refundedAgg.map((r: { _id: string }) => r._id)
        );
        const refundedAccountIds = new Set<string>();
        accounts.forEach((a) => {
            const email = (a as any).email?.toLowerCase?.().trim();
            if (email && refundedEmails.has(email)) {
                refundedAccountIds.add(a._id.toString());
            }
        });

        // Transformar para o formato esperado pelo Stories
        const storyUsers = accounts.map((account) => {
            const fullName = account.last_name
                ? `${account.first_name} ${account.last_name}`.trim()
                : account.first_name;

            const nameParts = fullName.split(' ');
            const initials = nameParts.length >= 2
                ? (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase()
                : fullName.slice(0, 2).toUpperCase();

            const accountIdStr = account._id.toString();

            const likesGiven = likesGivenMap.get(accountIdStr) || 0;
            const likesReceived = likesReceivedMap.get(accountIdStr) || 0;
            const postsCount = postsMap.get(accountIdStr) || 0;
            const commentsCount = commentsMap.get(accountIdStr) || 0;

            const interactionScore = refundedAccountIds.has(accountIdStr)
                ? 0
                : likesGiven + likesReceived + (postsCount * 2) + commentsCount;

            const latestStoryAt = latestStoryAtMap.get(accountIdStr);

            return {
                id: accountIdStr,
                name: fullName,
                avatar: account.avatar_url || null,
                initials,
                interactionCount: interactionScore,
                rankingWins: winsMap.get(accountIdStr) || 0,
                latestStoryAt: latestStoryAt ? new Date(latestStoryAt).getTime() : undefined,
                stats: {
                    likesGiven,
                    likesReceived,
                    postsCount,
                    commentsCount,
                },
                instagramProfile: account.link_instagram || undefined,
                tiktokProfile: account.link_tiktok || undefined,
                youtubeProfile: account.link_youtube || undefined,
                primarySocialLink: account.primary_social_link || null,
            };
        });

        storyUsers.sort((a, b) => b.interactionCount - a.interactionCount);

        return NextResponse.json({
            users: storyUsers,
            week: {
                start: weekStart.toISOString(),
                end: weekEnd.toISOString(),
                label: formatWeekRange(weekStart, weekEnd),
            },
        });
    } catch (error) {
        console.error('Erro ao buscar accounts para stories:', error);
        return NextResponse.json(
            { error: 'Erro ao buscar usuários' },
            { status: 500 }
        );
    }
}
