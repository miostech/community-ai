import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectMongo } from '@/lib/mongoose';
import Post from '@/models/Post';
import Account from '@/models/Account';

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
            .populate('author_id', 'first_name last_name avatar_url')
            .lean();

        if (!post) {
            return NextResponse.json({ error: 'Post não encontrado' }, { status: 404 });
        }

        // Formatar post para resposta
        const author = post.author_id as any;
        const formattedPost = {
            id: post._id.toString(),
            author: {
                id: author?._id?.toString() || '',
                name: author ? `${author.first_name || ''} ${author.last_name || ''}`.trim() : 'Usuário',
                avatar_url: author?.avatar_url || null,
            },
            content: post.content || '',
            images: post.images || [],
            video_url: post.video_url || null,
            link_instagram_post: post.link_instagram_post || null,
            category: post.category || 'geral',
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
                formattedPost.liked = post.liked_by?.some((id: any) => id.toString() === account._id.toString()) || false;
                formattedPost.saved = post.saved_by?.some((id: any) => id.toString() === account._id.toString()) || false;
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
