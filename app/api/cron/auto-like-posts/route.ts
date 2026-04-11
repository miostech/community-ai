import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectMongo } from '@/lib/mongoose';
import Post from '@/models/Post';
import Like from '@/models/Like';
import Account from '@/models/Account';
import { createNotification } from '@/lib/notifications';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

/** Conta que recebe os likes automáticos (pode sobrescrever com AUTO_LIKE_ACCOUNT_ID). */
const DEFAULT_AUTO_LIKE_ACCOUNT_ID = '69987abacb117cb563133c47';

const BATCH_LIMIT = 150;

/** Idade mínima do post (minutos) antes do auto-like, quando `POST_AUTO_LIKE_MIN_AGE_MINUTES` não está definida ou é inválida. */
const DEFAULT_POST_MIN_AGE_MINUTES = 30;

function resolveMinAgeMinutes(): number {
    const raw = process.env.POST_AUTO_LIKE_MIN_AGE_MINUTES;
    if (raw === undefined || raw === '') {
        return DEFAULT_POST_MIN_AGE_MINUTES;
    }
    const n = Number(raw);
    if (!Number.isFinite(n) || n < 0) {
        return DEFAULT_POST_MIN_AGE_MINUTES;
    }
    return n;
}

function ageCutoff(): { cutoff: Date; minAgeMinutes: number } {
    const minAgeMinutes = resolveMinAgeMinutes();
    const minAgeMs = minAgeMinutes * 60 * 1000;
    return {
        cutoff: new Date(Date.now() - minAgeMs),
        minAgeMinutes,
    };
}

/**
 * Garante um like do bot em posts publicados já “velhos” o suficiente.
 * Cria notificação de like para o autor (igual ao like manual), com falha isolada se o push falhar.
 * Protegido por CRON_SECRET (igual aos outros crons).
 */
export async function GET(request: Request) {
    const secret = process.env.CRON_SECRET;
    const authHeader = request.headers.get('authorization');
    if (!secret) {
        return NextResponse.json(
            {
                error: 'CRON_SECRET não configurado no servidor.',
            },
            { status: 503 }
        );
    }
    if (authHeader !== `Bearer ${secret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const botIdStr = process.env.AUTO_LIKE_ACCOUNT_ID || DEFAULT_AUTO_LIKE_ACCOUNT_ID;
    if (!mongoose.Types.ObjectId.isValid(botIdStr)) {
        return NextResponse.json({ error: 'AUTO_LIKE_ACCOUNT_ID inválido' }, { status: 500 });
    }
    const botObjectId = new mongoose.Types.ObjectId(botIdStr);

    try {
        await connectMongo();

        const accountExists = await Account.exists({ _id: botObjectId });
        if (!accountExists) {
            return NextResponse.json(
                { error: 'Conta de auto-like não encontrada (Account._id)' },
                { status: 404 }
            );
        }

        const { cutoff, minAgeMinutes } = ageCutoff();

        const likesCollection = Like.collection.collectionName;

        type PostRow = {
            _id: mongoose.Types.ObjectId;
            author_id: mongoose.Types.ObjectId;
            content?: string;
        };

        const postsToLike = await Post.aggregate<PostRow>([
            {
                $match: {
                    status: 'published',
                    author_id: { $ne: botObjectId },
                    created_at: { $lte: cutoff },
                },
            },
            {
                $lookup: {
                    from: likesCollection,
                    let: { pid: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$target_id', '$$pid'] },
                                        { $eq: ['$target_type', 'post'] },
                                        { $eq: ['$user_id', botObjectId] },
                                    ],
                                },
                            },
                        },
                        { $limit: 1 },
                    ],
                    as: 'botLike',
                },
            },
            { $match: { botLike: { $size: 0 } } },
            { $limit: BATCH_LIMIT },
            { $project: { _id: 1, author_id: 1, content: 1 } },
        ]);

        if (postsToLike.length === 0) {
            return NextResponse.json({
                message: 'Nenhum post elegível sem like do bot',
                cutoff: cutoff.toISOString(),
                minAgeMinutes,
                likesCollection,
                likesAdded: 0,
            });
        }

        let likesAdded = 0;
        for (const row of postsToLike) {
            const postId = row._id;
            try {
                await Like.create({
                    user_id: botObjectId,
                    target_type: 'post',
                    target_id: postId,
                });
                await Post.updateOne({ _id: postId }, { $inc: { likes_count: 1 } });
                likesAdded += 1;

                try {
                    await createNotification({
                        recipientId: row.author_id,
                        actorId: botObjectId,
                        type: 'like',
                        postId,
                        contentPreview:
                            typeof row.content === 'string' ? row.content.slice(0, 100) : null,
                    });
                } catch (notifErr) {
                    console.error('auto-like-posts: notificação falhou (like salvo):', notifErr);
                }
            } catch (err: unknown) {
                const code = err && typeof err === 'object' && 'code' in err ? (err as { code?: number }).code : undefined;
                if (code === 11000) {
                    continue;
                }
                throw err;
            }
        }

        return NextResponse.json({
            message: 'Auto-like concluído',
            cutoff: cutoff.toISOString(),
            minAgeMinutes,
            likesCollection,
            candidates: postsToLike.length,
            likesAdded,
            botAccountId: botObjectId.toString(),
        });
    } catch (error) {
        console.error('cron/auto-like-posts:', error);
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
    }
}
