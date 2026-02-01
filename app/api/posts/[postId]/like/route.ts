import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectMongo } from '@/lib/mongoose';
import Like from '@/models/Like';
import Post from '@/models/Post';
import Account from '@/models/Account';
import { createNotification, removeNotification } from '@/lib/notifications';
import mongoose from 'mongoose';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// POST - Toggle like em um post
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ postId: string }> }
) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const { postId } = await params;
        const authUserId = (session.user as any).auth_user_id || session.user.id;

        await connectMongo();

        // Converter para ObjectId
        const postObjectId = new mongoose.Types.ObjectId(postId);

        // Verificar se o post existe
        const post = await Post.findById(postObjectId);
        if (!post) {
            return NextResponse.json({ error: 'Post não encontrado' }, { status: 404 });
        }

        // Buscar account do usuário
        const account = await Account.findOne({ auth_user_id: authUserId });
        if (!account) {
            return NextResponse.json({ error: 'Conta não encontrada' }, { status: 404 });
        }

        // Verificar se já existe um like
        const existingLike = await Like.findOne({
            user_id: account._id,
            target_type: 'post',
            target_id: postObjectId,
        });

        let liked: boolean;
        let likesCount: number;

        if (existingLike) {
            // Remover like
            await Like.findByIdAndDelete(existingLike._id);
            await Post.findByIdAndUpdate(postObjectId, { $inc: { likes_count: -1 } });
            liked = false;
            likesCount = Math.max(0, (post.likes_count || 1) - 1);

            // Remover notificação
            await removeNotification({
                recipientId: post.author_id,
                actorId: account._id,
                type: 'like',
                postId: postObjectId,
            });
        } else {
            // Adicionar like
            const newLike = new Like({
                user_id: account._id,
                target_type: 'post',
                target_id: postObjectId,
            });
            await newLike.save();
            await Post.findByIdAndUpdate(postObjectId, { $inc: { likes_count: 1 } });
            liked = true;
            likesCount = (post.likes_count || 0) + 1;

            // Criar notificação para o autor do post
            await createNotification({
                recipientId: post.author_id,
                actorId: account._id,
                type: 'like',
                postId: postObjectId,
                contentPreview: post.content?.slice(0, 100),
            });
        }

        return NextResponse.json({
            success: true,
            liked,
            likes_count: likesCount,
        });
    } catch (error) {
        console.error('Erro ao processar like:', error);
        return NextResponse.json(
            { error: 'Erro interno do servidor' },
            { status: 500 }
        );
    }
}

// GET - Verificar se o usuário deu like em um post
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ postId: string }> }
) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ liked: false });
        }

        const { postId } = await params;
        const authUserId = (session.user as any).auth_user_id || session.user.id;

        await connectMongo();

        const postObjectId = new mongoose.Types.ObjectId(postId);

        // Buscar account do usuário
        const account = await Account.findOne({ auth_user_id: authUserId });
        if (!account) {
            return NextResponse.json({ liked: false });
        }

        // Verificar se existe like
        const existingLike = await Like.findOne({
            user_id: account._id,
            target_type: 'post',
            target_id: postObjectId,
        });

        return NextResponse.json({
            liked: !!existingLike,
        });
    } catch (error) {
        console.error('Erro ao verificar like:', error);
        return NextResponse.json({ liked: false });
    }
}
