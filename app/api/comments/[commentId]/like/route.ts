import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectMongo } from '@/lib/mongoose';
import Account from '@/models/Account';
import Comment from '@/models/Comment';
import Like from '@/models/Like';
import { createNotification, removeNotification } from '@/lib/notifications';
import mongoose from 'mongoose';

// POST - Toggle like em comentário
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ commentId: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const { commentId } = await params;

        if (!commentId || !mongoose.Types.ObjectId.isValid(commentId)) {
            return NextResponse.json({ error: 'Comment ID inválido' }, { status: 400 });
        }

        await connectMongo();

        // Buscar conta do usuário usando auth_user_id
        const authUserId = (session.user as any).auth_user_id || session.user.id;
        const account = await Account.findOne({ auth_user_id: authUserId }).lean();

        if (!account) {
            return NextResponse.json({ error: 'Conta não encontrada' }, { status: 404 });
        }

        const accountId = account._id as mongoose.Types.ObjectId;
        const commentObjectId = new mongoose.Types.ObjectId(commentId);

        // Verificar se o comentário existe
        const comment = await Comment.findById(commentObjectId).lean() as any;
        if (!comment) {
            return NextResponse.json({ error: 'Comentário não encontrado' }, { status: 404 });
        }

        // Verificar se já existe like
        const existingLike = await Like.findOne({
            user_id: accountId,
            target_type: 'comment',
            target_id: commentObjectId,
        }).lean();

        let liked: boolean;
        let newLikesCount: number;

        if (existingLike) {
            // Já existe like - remover (unlike)
            await Like.deleteOne({
                user_id: accountId,
                target_type: 'comment',
                target_id: commentObjectId,
            });

            // Decrementar contador
            const updatedComment = await Comment.findByIdAndUpdate(
                commentObjectId,
                { $inc: { likes_count: -1 } },
                { returnDocument: 'after' }
            );

            liked = false;
            newLikesCount = Math.max(0, updatedComment?.likes_count || 0);

            // Remover notificação (se não for o próprio autor)
            // postId é necessário para encontrar a notificação correta (foi incluído na criação)
            if (comment.author_id.toString() !== accountId.toString()) {
                await removeNotification({
                    recipientId: comment.author_id,
                    actorId: accountId,
                    type: 'like',
                    postId: comment.post_id,
                    commentId: commentObjectId,
                });
            }

            console.log(`💔 Unlike no comentário ${commentId} por ${accountId}`);
        } else {
            // Não existe like - criar
            await Like.create({
                user_id: accountId,
                target_type: 'comment',
                target_id: commentObjectId,
            });

            // Incrementar contador
            const updatedComment = await Comment.findByIdAndUpdate(
                commentObjectId,
                { $inc: { likes_count: 1 } },
                { returnDocument: 'after' }
            );

            liked = true;
            newLikesCount = updatedComment?.likes_count || 1;

            // Criar notificação (se não for o próprio autor)
            if (comment.author_id.toString() !== accountId.toString()) {
                await createNotification({
                    recipientId: comment.author_id,
                    actorId: accountId,
                    type: 'like',
                    postId: comment.post_id,
                    commentId: commentObjectId,
                    contentPreview: comment.content?.substring(0, 50) || '',
                });
            }

            console.log(`❤️ Like no comentário ${commentId} por ${accountId}`);
        }

        return NextResponse.json({
            success: true,
            liked,
            likes_count: newLikesCount,
        });
    } catch (error) {
        console.error('❌ Erro ao dar like no comentário:', error);
        return NextResponse.json(
            { error: 'Erro interno do servidor' },
            { status: 500 }
        );
    }
}
