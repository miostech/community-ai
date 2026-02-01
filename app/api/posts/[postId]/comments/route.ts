import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectMongo } from '@/lib/mongoose';
import Comment from '@/models/Comment';
import Post from '@/models/Post';
import Account from '@/models/Account';
import mongoose from 'mongoose';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET - Buscar comentários de um post
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ postId: string }> }
) {
    try {
        const { postId } = await params;
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const skip = (page - 1) * limit;

        await connectMongo();

        // Converter postId para ObjectId
        const postObjectId = new mongoose.Types.ObjectId(postId);

        console.log('🔍 Buscando comentários para post_id:', postId);

        // Verificar se o post existe
        const post = await Post.findById(postObjectId);
        if (!post) {
            return NextResponse.json({ error: 'Post não encontrado' }, { status: 404 });
        }

        // Debug: buscar todos os comentários desse post sem filtros
        const allCommentsForPost = await Comment.find({ post_id: postObjectId }).lean();
        console.log('📝 Total de comentários no banco para este post:', allCommentsForPost.length);
        if (allCommentsForPost.length > 0) {
            console.log('📝 Exemplo de comentário:', JSON.stringify(allCommentsForPost[0], null, 2));
        }

        // Buscar comentários (apenas comentários de primeiro nível, não respostas)
        const comments = await Comment.find({
            post_id: postObjectId,
            is_deleted: { $ne: true },
            $or: [
                { parent_id: { $exists: false } },
                { parent_id: null }
            ]
        })
            .sort({ created_at: -1 })
            .skip(skip)
            .limit(limit)
            .populate('author_id', 'first_name last_name avatar_url')
            .lean();

        const total = await Comment.countDocuments({
            post_id: postObjectId,
            is_deleted: { $ne: true },
            $or: [
                { parent_id: { $exists: false } },
                { parent_id: null }
            ]
        });

        // Buscar replies para cada comentário
        const commentIds = comments.map((c: any) => c._id);
        const replies = await Comment.find({
            parent_id: { $in: commentIds },
            is_deleted: { $ne: true },
        })
            .sort({ created_at: 1 })
            .populate('author_id', 'first_name last_name avatar_url')
            .lean();

        // Agrupar replies por parent_id
        const repliesByParent: Record<string, any[]> = {};
        replies.forEach((reply: any) => {
            const parentId = reply.parent_id.toString();
            if (!repliesByParent[parentId]) {
                repliesByParent[parentId] = [];
            }
            repliesByParent[parentId].push(reply);
        });

        // Formatar comentários com replies
        const formattedComments = comments.map((comment: any) => {
            const author = comment.author_id;
            const commentReplies = repliesByParent[comment._id.toString()] || [];

            return {
                _id: comment._id.toString(),
                author: {
                    id: author?._id?.toString() || '',
                    name: author ? `${author.first_name || ''} ${author.last_name || ''}`.trim() : 'Usuário',
                    avatar_url: author?.avatar_url || null,
                },
                content: comment.content,
                likes_count: comment.likes_count || 0,
                replies_count: comment.replies_count || 0,
                created_at: comment.created_at,
                replies: commentReplies.map((reply: any) => {
                    const replyAuthor = reply.author_id;
                    return {
                        _id: reply._id.toString(),
                        author: {
                            id: replyAuthor?._id?.toString() || '',
                            name: replyAuthor ? `${replyAuthor.first_name || ''} ${replyAuthor.last_name || ''}`.trim() : 'Usuário',
                            avatar_url: replyAuthor?.avatar_url || null,
                        },
                        content: reply.content,
                        likes_count: reply.likes_count || 0,
                        created_at: reply.created_at,
                    };
                }),
            };
        });

        return NextResponse.json({
            comments: formattedComments,
            pagination: {
                page,
                limit,
                total,
                hasMore: skip + comments.length < total,
            },
        });
    } catch (error) {
        console.error('Erro ao buscar comentários:', error);
        return NextResponse.json(
            { error: 'Erro interno do servidor' },
            { status: 500 }
        );
    }
}

// POST - Criar um novo comentário
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

        // Verificar se o post existe
        const post = await Post.findById(postId);
        if (!post) {
            return NextResponse.json({ error: 'Post não encontrado' }, { status: 404 });
        }

        // Buscar account do usuário
        const account = await Account.findOne({ auth_user_id: authUserId });
        if (!account) {
            return NextResponse.json({ error: 'Conta não encontrada' }, { status: 404 });
        }

        const body = await request.json();
        const { content, parent_id } = body;

        if (!content?.trim()) {
            return NextResponse.json(
                { error: 'Comentário não pode estar vazio' },
                { status: 400 }
            );
        }

        // Criar comentário
        const comment = new Comment({
            post_id: postId,
            author_id: account._id,
            content: content.trim(),
            parent_id: parent_id || undefined,
        });

        await comment.save();

        // Incrementar contador de comentários no post
        await Post.findByIdAndUpdate(postId, { $inc: { comments_count: 1 } });

        // Se for resposta, incrementar contador de replies no comentário pai
        if (parent_id) {
            await Comment.findByIdAndUpdate(parent_id, { $inc: { replies_count: 1 } });
        }

        // Popular author para retornar
        await comment.populate('author_id', 'first_name last_name avatar_url');

        const author = comment.author_id as any;
        const formattedComment = {
            _id: comment._id.toString(),
            author: {
                id: author?._id?.toString() || '',
                name: author ? `${author.first_name || ''} ${author.last_name || ''}`.trim() : 'Usuário',
                avatar_url: author?.avatar_url || null,
            },
            content: comment.content,
            likes_count: 0,
            replies_count: 0,
            created_at: comment.created_at,
        };

        return NextResponse.json({
            success: true,
            comment: formattedComment,
        }, { status: 201 });
    } catch (error) {
        console.error('Erro ao criar comentário:', error);
        return NextResponse.json(
            { error: 'Erro interno do servidor' },
            { status: 500 }
        );
    }
}

// DELETE - Deletar um comentário
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ postId: string }> }
) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const { postId } = await params;
        const { searchParams } = new URL(request.url);
        const commentId = searchParams.get('commentId');

        if (!commentId) {
            return NextResponse.json({ error: 'ID do comentário é obrigatório' }, { status: 400 });
        }

        const authUserId = (session.user as any).auth_user_id || session.user.id;

        await connectMongo();

        // Buscar account do usuário
        const account = await Account.findOne({ auth_user_id: authUserId });
        if (!account) {
            return NextResponse.json({ error: 'Conta não encontrada' }, { status: 404 });
        }

        // Buscar o comentário
        const comment = await Comment.findById(commentId);
        if (!comment) {
            return NextResponse.json({ error: 'Comentário não encontrado' }, { status: 404 });
        }

        // Verificar se o usuário é o autor do comentário
        if (comment.author_id.toString() !== account._id.toString()) {
            return NextResponse.json({ error: 'Sem permissão para deletar este comentário' }, { status: 403 });
        }

        // Marcar como deletado (soft delete)
        comment.is_deleted = true;
        await comment.save();

        // Decrementar contador de comentários no post
        await Post.findByIdAndUpdate(postId, { $inc: { comments_count: -1 } });

        // Se for uma resposta, decrementar contador de replies no comentário pai
        if (comment.parent_id) {
            await Comment.findByIdAndUpdate(comment.parent_id, { $inc: { replies_count: -1 } });
        }

        return NextResponse.json({
            success: true,
            message: 'Comentário deletado com sucesso',
        });
    } catch (error) {
        console.error('Erro ao deletar comentário:', error);
        return NextResponse.json(
            { error: 'Erro interno do servidor' },
            { status: 500 }
        );
    }
}
