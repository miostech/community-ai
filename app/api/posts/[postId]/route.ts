import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectMongo } from '@/lib/mongoose';
import Post from '@/models/Post';
import Account from '@/models/Account';
import Like from '@/models/Like';
import SavedPost from '@/models/SavedPost';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET - Buscar um post específico
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ postId: string }> }
) {
    try {
        const { postId } = await params;

        await connectMongo();

        const post = await Post.findById(postId)
            .populate('author_id', 'first_name last_name avatar_url role')
            .lean();

        if (!post) {
            return NextResponse.json({ error: 'Post não encontrado' }, { status: 404 });
        }

        // Posts da categoria "atualização" só podem ser vistos por admin, moderator e criador
        if ((post as { category?: string }).category === 'atualizacao') {
            const session = await auth();
            if (!session?.user?.id) {
                return NextResponse.json({ error: 'Post não encontrado' }, { status: 404 });
            }
            const authUserId = (session.user as { id?: string; auth_user_id?: string }).auth_user_id || session.user.id;
            const account = await Account.findOne({ auth_user_id: authUserId }).select('role').lean();
            const role = (account as { role?: string } | null)?.role;
            const canSee = role === 'admin' || role === 'moderator' || role === 'criador';
            if (!canSee) {
                return NextResponse.json({ error: 'Post não encontrado' }, { status: 404 });
            }
        }

        // Formatar post para resposta
        const author = post.author_id as any;
        const formattedPost = {
            id: post._id.toString(),
            author: {
                id: author?._id?.toString() || '',
                name: author ? `${author.first_name || ''} ${author.last_name || ''}`.trim() : 'Usuário',
                avatar_url: author?.avatar_url || null,
                role: author?.role,
            },
            content: post.content || '',
            images: post.images || [],
            video_url: post.video_url || null,
            link_instagram_post: post.link_instagram_post || null,
            category: post.category || 'geral',
            is_pinned: !!post.is_pinned,
            likes_count: post.likes_count || 0,
            comments_count: post.comments_count || 0,
            created_at: post.created_at || post.published_at || new Date(),
            liked: false,
            saved: false,
        };

        // Verificar se usuário logado deu like/salvou
        const session = await auth();
        if (session?.user?.id) {
            const authUserId = (session.user as any).auth_user_id || session.user.id;
            const account = await Account.findOne({ auth_user_id: authUserId });

            if (account) {
                // Verificar like usando o model Like
                const userLike = await Like.findOne({
                    user_id: account._id,
                    target_type: 'post',
                    target_id: post._id,
                });
                formattedPost.liked = !!userLike;

                // Verificar se salvou usando o model SavedPost
                const userSaved = await SavedPost.findOne({
                    account_id: account._id,
                    post_id: post._id,
                });
                formattedPost.saved = !!userSaved;
            }
        }

        return NextResponse.json({ post: formattedPost });
    } catch (error) {
        console.error('Erro ao buscar post:', error);
        return NextResponse.json(
            { error: 'Erro interno do servidor' },
            { status: 500 }
        );
    }
}

// PATCH - Atualizar post (admin: fixar/desfixar)
export async function PATCH(
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

        const account = await Account.findOne({ auth_user_id: authUserId }).select('_id role').lean();
        if (!account) {
            return NextResponse.json({ error: 'Conta não encontrada' }, { status: 404 });
        }

        if ((account as { role?: string }).role !== 'admin') {
            return NextResponse.json({ error: 'Apenas administradores podem fixar ou desfixar posts' }, { status: 403 });
        }

        const post = await Post.findById(postId);
        if (!post) {
            return NextResponse.json({ error: 'Post não encontrado' }, { status: 404 });
        }

        const body = await request.json();
        const is_pinned = body.is_pinned === true;

        post.is_pinned = is_pinned;
        await post.save();

        return NextResponse.json({
            success: true,
            post: {
                id: post._id.toString(),
                is_pinned: post.is_pinned,
            },
        });
    } catch (error) {
        console.error('Erro ao atualizar post:', error);
        return NextResponse.json(
            { error: 'Erro interno do servidor' },
            { status: 500 }
        );
    }
}

// DELETE - Deletar um post
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
        const authUserId = (session.user as any).auth_user_id || session.user.id;

        await connectMongo();

        const account = await Account.findOne({ auth_user_id: authUserId });
        if (!account) {
            return NextResponse.json({ error: 'Conta não encontrada' }, { status: 404 });
        }

        const post = await Post.findById(postId);
        if (!post) {
            return NextResponse.json({ error: 'Post não encontrado' }, { status: 404 });
        }

        // Verificar se o usuário é o autor
        if (post.author_id.toString() !== account._id.toString()) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
        }

        await Post.findByIdAndDelete(postId);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Erro ao deletar post:', error);
        return NextResponse.json(
            { error: 'Erro interno do servidor' },
            { status: 500 }
        );
    }
}
