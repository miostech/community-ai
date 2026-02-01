import { NextResponse } from 'next/server';
import { connectMongo } from '@/lib/mongoose';
import AccountModel from '@/models/Account';
import Post from '@/models/Post';
import Like from '@/models/Like';
import Comment from '@/models/Comment';
import mongoose from 'mongoose';

export async function GET() {
    try {
        await connectMongo();

        // Buscar accounts ordenados pelo último acesso (mais recentes primeiro)
        const accounts = await AccountModel.find({})
            .select('_id first_name last_name avatar_url link_instagram link_tiktok link_youtube primary_social_link last_access_at')
            .sort({ last_access_at: -1 })
            .limit(20)
            .lean();

        const accountIds = accounts.map((a) => a._id);

        // Buscar estatísticas de interação para todos os usuários de uma vez

        // 1. Likes dados por cada usuário
        const likesGivenAgg = await Like.aggregate([
            { $match: { user_id: { $in: accountIds } } },
            { $group: { _id: '$user_id', count: { $sum: 1 } } }
        ]);
        const likesGivenMap = new Map<string, number>();
        likesGivenAgg.forEach((item: any) => {
            likesGivenMap.set(item._id.toString(), item.count);
        });

        // 2. Total de posts por usuário
        const postsCountAgg = await Post.aggregate([
            { $match: { author_id: { $in: accountIds }, is_deleted: { $ne: true } } },
            { $group: { _id: '$author_id', count: { $sum: 1 }, totalLikes: { $sum: '$likes_count' } } }
        ]);
        const postsMap = new Map<string, { count: number; totalLikes: number }>();
        postsCountAgg.forEach((item: any) => {
            postsMap.set(item._id.toString(), { count: item.count, totalLikes: item.totalLikes || 0 });
        });

        // 3. Total de comentários por usuário
        const commentsCountAgg = await Comment.aggregate([
            { $match: { author_id: { $in: accountIds }, is_deleted: { $ne: true } } },
            { $group: { _id: '$author_id', count: { $sum: 1 } } }
        ]);
        const commentsMap = new Map<string, number>();
        commentsCountAgg.forEach((item: any) => {
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
            const postStats = postsMap.get(accountIdStr) || { count: 0, totalLikes: 0 };
            const commentsCount = commentsMap.get(accountIdStr) || 0;

            // Score = likes dados + likes recebidos nos posts + total de posts + total de comentários
            const interactionScore = likesGiven + postStats.totalLikes + (postStats.count * 2) + commentsCount;

            return {
                id: accountIdStr,
                name: fullName,
                avatar: account.avatar_url || null,
                initials,
                interactionCount: interactionScore,
                // Detalhes do score para debug/display futuro
                stats: {
                    likesGiven,
                    likesReceived: postStats.totalLikes,
                    postsCount: postStats.count,
                    commentsCount,
                },
                instagramProfile: account.link_instagram || undefined,
                tiktokProfile: account.link_tiktok || undefined,
                youtubeProfile: account.link_youtube || undefined,
                primarySocialLink: account.primary_social_link || null,
            };
        });

        // Ordenar por score de interação (maior primeiro)
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
