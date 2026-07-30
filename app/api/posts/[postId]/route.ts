import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectMongo } from '@/lib/mongoose';
import Post from '@/models/Post';
import Account from '@/models/Account';
import Like from '@/models/Like';
import SavedPost from '@/models/SavedPost';
import PollVote from '@/models/PollVote';
import LiveEvent from '@/models/LiveEvent';

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
            .populate('author_id', 'first_name last_name avatar_url role is_founding_member subscription_active')
            .lean();

        if (!post) {
            return NextResponse.json({ error: 'Post não encontrado' }, { status: 404 });
        }

        // Formatar post para resposta (todos podem ver posts de qualquer categoria)
        const author = post.author_id as any;
        const formattedPost = {
            id: post._id.toString(),
            author: {
                id: author?._id?.toString() || '',
                name: author ? `${author.first_name || ''} ${author.last_name || ''}`.trim() : 'Usuário',
                avatar_url: author?.avatar_url || null,
                role: author?.role,
                is_founding_member: author?.is_founding_member === true,
                subscription_active: author?.subscription_active === true,
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
            poll_question: (post as { poll_question?: string }).poll_question ?? null,
            poll_options: (post as { poll_options?: { text: string; votes_count: number }[] }).poll_options ?? null,
            poll_vote_index: null as number | null,
            live_event_id: (post as any).live_event_id?.toString() || null,
            live_event: null as { status: string; reservations_count: number; user_reserved: boolean; scheduled_at?: string } | null,
        };

        // Buscar dados da live vinculada
        if ((post as any).live_event_id) {
            const le = await LiveEvent.findById((post as any).live_event_id).select('status reservations scheduled_at').lean() as any;
            if (le) {
                const reservations: any[] = le.reservations || [];
                formattedPost.live_event = {
                    status: le.status,
                    reservations_count: reservations.length,
                    user_reserved: false,
                    scheduled_at: le.scheduled_at?.toISOString?.() || undefined,
                };
            }
        }

        // Verificar se usuário logado deu like/salvou e votou na enquete
        const session = await auth();
        if (session?.user?.id) {
            const authUserId = (session.user as any).auth_user_id || session.user.id;
            const account = await Account.findOne({ auth_user_id: authUserId });

            if (account) {
                const [userLike, userSaved, userPollVote] = await Promise.all([
                    Like.findOne({
                        user_id: account._id,
                        target_type: 'post',
                        target_id: post._id,
                    }),
                    SavedPost.findOne({
                        account_id: account._id,
                        post_id: post._id,
                    }),
                    formattedPost.poll_question
                        ? PollVote.findOne({
                              post_id: post._id,
                              account_id: account._id,
                          }).lean()
                        : null,
                ]);
                formattedPost.liked = !!userLike;
                formattedPost.saved = !!userSaved;
                if (userPollVote && typeof (userPollVote as { option_index: number }).option_index === 'number') {
                    formattedPost.poll_vote_index = (userPollVote as { option_index: number }).option_index;
                }
                if (formattedPost.live_event) {
                    const le = await LiveEvent.findById((post as any).live_event_id).select('reservations').lean() as any;
                    if (le) {
                        formattedPost.live_event.user_reserved = (le.reservations || []).some((r: any) => r.toString() === account._id.toString());
                    }
                }
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

// PATCH - Atualizar post (admin ou moderator: fixar/desfixar)
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

        const role = (account as { role?: string }).role;
        const canPin = role === 'admin' || role === 'moderator';
        if (!canPin) {
            return NextResponse.json({ error: 'Apenas administradores e moderadores podem fixar ou desfixar posts' }, { status: 403 });
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
