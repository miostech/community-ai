import { NextResponse } from 'next/server';
import { connectMongo } from '@/lib/mongoose';
import AccountModel from '@/models/Account';
import Post from '@/models/Post';
import Like from '@/models/Like';
import Comment from '@/models/Comment';
import StoryModel, { STORY_EXPIRY_HOURS } from '@/models/Story';
import mongoose from 'mongoose';

export async function GET() {
    try {
        await connectMongo();

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

        // Quem tem stories sempre aparece na faixa; preenchemos o resto por last_access
        const topByAccess = await AccountModel.find({})
            .select('_id')
            .sort({ last_access_at: -1 })
            .limit(200)
            .lean();
        const topIds = new Set(topByAccess.map((a) => a._id.toString()));
        accountIdsWithStories.forEach((id) => topIds.add(id.toString()));
        const accountIds = Array.from(topIds).map((id) => new mongoose.Types.ObjectId(id));

        const accounts = await AccountModel.find({ _id: { $in: accountIds } })
            .select('_id first_name last_name avatar_url link_instagram link_tiktok link_youtube primary_social_link last_access_at')
            .lean();

        // Buscar estatísticas de interação (sem auto-curtida, sem auto-comentário, só likes em posts)

        // 1. Likes dados: só em posts, excluir quando o autor do post é o próprio usuário
        const likesGivenAgg = await Like.aggregate([
            { $match: { user_id: { $in: accountIds }, target_type: 'post' } },
            { $lookup: { from: 'posts', localField: 'target_id', foreignField: '_id', as: 'postDoc' } },
            { $unwind: '$postDoc' },
            { $match: { $expr: { $ne: ['$postDoc.author_id', '$user_id'] } } },
            { $group: { _id: '$user_id', count: { $sum: 1 } } },
        ]);
        const likesGivenMap = new Map<string, number>();
        likesGivenAgg.forEach((item: { _id: mongoose.Types.ObjectId; count: number }) => {
            likesGivenMap.set(item._id.toString(), item.count);
        });

        // 2. Likes recebidos: só likes em posts cujo autor é o usuário e quem curtiu é outro
        const likesReceivedAgg = await Like.aggregate([
            { $match: { target_type: 'post' } },
            { $lookup: { from: 'posts', localField: 'target_id', foreignField: '_id', as: 'postDoc' } },
            { $unwind: '$postDoc' },
            { $match: { $expr: { $ne: ['$user_id', '$postDoc.author_id'] }, 'postDoc.author_id': { $in: accountIds }, 'postDoc.is_deleted': { $ne: true } } },
            { $group: { _id: '$postDoc.author_id', count: { $sum: 1 } } },
        ]);
        const likesReceivedMap = new Map<string, number>();
        likesReceivedAgg.forEach((item: { _id: mongoose.Types.ObjectId; count: number }) => {
            likesReceivedMap.set(item._id.toString(), item.count);
        });

        // 3. Total de posts por usuário (só count; likes recebidos vêm de likesReceivedMap)
        const postsCountAgg = await Post.aggregate([
            { $match: { author_id: { $in: accountIds }, is_deleted: { $ne: true } } },
            { $group: { _id: '$author_id', count: { $sum: 1 } } },
        ]);
        const postsMap = new Map<string, { count: number }>();
        postsCountAgg.forEach((item: { _id: mongoose.Types.ObjectId; count: number }) => {
            postsMap.set(item._id.toString(), { count: item.count });
        });

        // 4. Comentários: só em posts de outros (excluir quando autor do comentário = autor do post)
        const commentsCountAgg = await Comment.aggregate([
            { $match: { author_id: { $in: accountIds }, is_deleted: { $ne: true } } },
            { $lookup: { from: 'posts', localField: 'post_id', foreignField: '_id', as: 'postDoc' } },
            { $unwind: '$postDoc' },
            { $match: { $expr: { $ne: ['$author_id', '$postDoc.author_id'] } } },
            { $group: { _id: '$author_id', count: { $sum: 1 } } },
        ]);
        const commentsMap = new Map<string, number>();
        commentsCountAgg.forEach((item: { _id: mongoose.Types.ObjectId; count: number }) => {
            commentsMap.set(item._id.toString(), item.count);
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

            // Calcular score de interação
            const likesGiven = likesGivenMap.get(accountIdStr) || 0;
            const likesReceived = likesReceivedMap.get(accountIdStr) || 0;
            const postStats = postsMap.get(accountIdStr) || { count: 0 };
            const commentsCount = commentsMap.get(accountIdStr) || 0;

            // Score = likes dados + likes recebidos (só de outros) + total de posts * 2 + comentários (só em posts de outros)
            const interactionScore = likesGiven + likesReceived + (postStats.count * 2) + commentsCount;

            const latestStoryAt = latestStoryAtMap.get(accountIdStr);

            return {
                id: accountIdStr,
                name: fullName,
                avatar: account.avatar_url || null,
                initials,
                interactionCount: interactionScore,
                latestStoryAt: latestStoryAt ? new Date(latestStoryAt).getTime() : undefined,
                stats: {
                    likesGiven,
                    likesReceived,
                    postsCount: postStats.count,
                    commentsCount,
                },
                instagramProfile: account.link_instagram || undefined,
                tiktokProfile: account.link_tiktok || undefined,
                youtubeProfile: account.link_youtube || undefined,
                primarySocialLink: account.primary_social_link || null,
            };
        });

        // Ordenar por score de interação (maior primeiro); todos aparecem (bolinhas), com ou sem stories
        storyUsers.sort((a, b) => b.interactionCount - a.interactionCount);

        return NextResponse.json(storyUsers);
    } catch (error) {
        console.error('Erro ao buscar accounts para stories:', error);
        return NextResponse.json(
            { error: 'Erro ao buscar usuários' },
            { status: 500 }
        );
    }
}
