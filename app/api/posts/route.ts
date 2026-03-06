import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { auth } from '@/lib/auth';
import { connectMongo } from '@/lib/mongoose';
import Post from '@/models/Post';
import Account from '@/models/Account';
import Like from '@/models/Like';
import SavedPost from '@/models/SavedPost';
import PollVote from '@/models/PollVote';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const isDev = process.env.NODE_ENV === 'development';

// POST - Criar um novo post
export async function POST(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const authUserId = (session.user as any).auth_user_id || session.user.id;

        await connectMongo();

        // Buscar o account do usuário (com role para validar categoria atualização)
        const account = await Account.findOne({ auth_user_id: authUserId }).select('_id first_name last_name avatar_url role is_founding_member').lean();
        if (!account) {
            return NextResponse.json({ error: 'Conta não encontrada' }, { status: 404 });
        }

        let body: Record<string, unknown>;
        try {
            body = await request.json();
        } catch {
            return NextResponse.json({ error: 'Corpo da requisição inválido' }, { status: 400 });
        }
        const content = typeof body.content === 'string' ? body.content : '';
        const images = Array.isArray(body.images) ? body.images : [];
        const video_url = typeof body.video_url === 'string' ? body.video_url : undefined;
        const link_instagram_post = typeof body.link_instagram_post === 'string' ? body.link_instagram_post : undefined;
        const link_tiktok_post = typeof body.link_tiktok_post === 'string' ? body.link_tiktok_post : undefined;
        const link_youtube_post = typeof body.link_youtube_post === 'string' ? body.link_youtube_post : undefined;
        const category = body.category;
        const tags = Array.isArray(body.tags) ? body.tags : [];
        const visibility = body.visibility;
        const poll_question = typeof body.poll_question === 'string' ? body.poll_question.trim() : undefined;
        const poll_options_raw = Array.isArray(body.poll_options) ? body.poll_options : [];
        const poll_options_strings = poll_options_raw
            .filter((o): o is string => typeof o === 'string')
            .map((o) => String(o).trim())
            .filter((o) => o.length > 0);

        // Categoria é obrigatória — normalizar para aceitar com acento ou maiúsculas (ex: "Atualização", "Suporte")
        const validCategories = ['ideia', 'resultado', 'duvida', 'roteiro', 'geral', 'atualizacao', 'suporte'];
        const normalizeCategory = (s: string) =>
            s.trim().toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
        const rawCategory = typeof category === 'string' ? category : '';
        const categoryValue = rawCategory ? normalizeCategory(rawCategory) : '';
        if (!categoryValue || !validCategories.includes(categoryValue)) {
            return NextResponse.json(
                { error: 'O tipo de post é obrigatório. Escolha uma categoria (Ideia, Resultado, Dúvida, Roteiro, Geral, Atualização ou Suporte).' },
                { status: 400 }
            );
        }

        // Apenas admin, moderator e criador podem publicar com categoria "atualização"
        const accRole = (account as { role?: string }).role;
        const canUseAtualizacao = accRole === 'admin' || accRole === 'moderator' || accRole === 'criador';
        if (categoryValue === 'atualizacao' && !canUseAtualizacao) {
            return NextResponse.json(
                { error: 'Apenas administradores, moderadores e criadores podem publicar atualizações' },
                { status: 403 }
            );
        }

        // Validação enquete: se tem pergunta, precisa de 2–6 opções
        if (poll_question) {
            if (poll_options_strings.length < 2 || poll_options_strings.length > 6) {
                return NextResponse.json(
                    { error: 'Enquete deve ter entre 2 e 6 opções' },
                    { status: 400 }
                );
            }
        } else if (poll_options_strings.length > 0) {
            return NextResponse.json(
                { error: 'Adicione a pergunta da enquete' },
                { status: 400 }
            );
        }

        // Validação básica
        if (!content?.trim() && (!images || images.length === 0) && !video_url?.trim() && !poll_question) {
            return NextResponse.json(
                { error: 'Post deve ter conteúdo, imagens, vídeo ou enquete' },
                { status: 400 }
            );
        }

        // Determinar media_type
        let media_type: 'text' | 'image' | 'video' = 'text';
        if (video_url?.trim()) {
            media_type = 'video';
        } else if (images && images.length > 0) {
            media_type = 'image';
        }

        const rawAccountId = (account as { _id: unknown })._id;
        const accountId = rawAccountId instanceof mongoose.Types.ObjectId
            ? rawAccountId
            : new mongoose.Types.ObjectId(String(rawAccountId));
        const pollOptionsForSave =
            poll_question && poll_options_strings.length >= 2
                ? poll_options_strings.map((text) => ({ text, votes_count: 0 }))
                : undefined;

        const post = new Post({
            author_id: accountId,
            content: content?.trim() || '',
            images: images || [],
            video_url: video_url?.trim() || undefined,
            link_instagram_post: link_instagram_post?.trim() || undefined,
            link_tiktok_post: link_tiktok_post?.trim() || undefined,
            link_youtube_post: link_youtube_post?.trim() || undefined,
            category: categoryValue,
            media_type,
            tags: tags || [],
            visibility: visibility || 'members',
            status: 'published',
            published_at: new Date(),
            ...(poll_question && pollOptionsForSave && {
                poll_question,
                poll_options: pollOptionsForSave,
            }),
        });

        await post.save();

        // Popular author para retornar dados completos
        await post.populate('author_id', 'first_name last_name avatar_url role is_founding_member');

        const authorPop = post.author_id as { _id: { toString: () => string }; first_name?: string; last_name?: string; avatar_url?: string; role?: string; is_founding_member?: boolean };
        return NextResponse.json({
            success: true,
            post: {
                id: post._id.toString(),
                author: {
                    id: authorPop?._id?.toString() ?? (account as { _id: { toString: () => string } })._id.toString(),
                    name: authorPop ? `${authorPop.first_name || ''} ${authorPop.last_name || ''}`.trim() : `${(account as { first_name?: string; last_name?: string }).first_name || ''} ${(account as { first_name?: string; last_name?: string }).last_name || ''}`.trim(),
                    avatar_url: authorPop?.avatar_url ?? (account as { avatar_url?: string }).avatar_url,
                    role: authorPop?.role,
                    is_founding_member: authorPop?.is_founding_member === true,
                },
                content: post.content,
                images: post.images,
                video_url: post.video_url,
                link_instagram_post: post.link_instagram_post,
                link_tiktok_post: post.link_tiktok_post,
                link_youtube_post: post.link_youtube_post,
                category: post.category,
                media_type: post.media_type,
                tags: post.tags,
                likes_count: post.likes_count,
                comments_count: post.comments_count,
                visibility: post.visibility,
                status: post.status,
                created_at: post.created_at,
                published_at: post.published_at,
                poll_question: post.poll_question,
                poll_options: post.poll_options,
            },
        }, { status: 201 });
    } catch (error) {
        console.error('Erro ao criar post:', error);
        const message = error instanceof Error ? error.message : 'Erro interno do servidor';
        const details = error instanceof Error && error.cause ? String(error.cause) : undefined;
        return NextResponse.json(
            {
                error: isDev ? message : 'Erro interno do servidor',
                ...(isDev && details && { details }),
            },
            { status: 500 }
        );
    }
}

// GET - Listar posts (feed)
export async function GET(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const authUserId = (session.user as any).auth_user_id || session.user.id;

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const category = searchParams.get('category'); // filtro opcional
        const authorId = searchParams.get('author_id'); // posts de um usuário

        await connectMongo();

        // Buscar account do usuário atual (para likes, salvos, votos em enquete)
        const currentAccount = await Account.findOne({ auth_user_id: authUserId }).select('_id role').lean();

        // Construir query — todos veem todos os posts no feed (Atualização e Suporte só não aparecem como opção ao criar)
        const query: Record<string, unknown> = {
            status: 'published',
        };

        if (category && category !== 'all') {
            query.category = category;
        }

        if (authorId) {
            query.author_id = authorId;
        }

        const skip = (page - 1) * limit;

        // Buscar posts: fixados primeiro (mais antigo no topo), depois não fixados (mais recente primeiro)
        const posts = await Post.aggregate([
            { $match: query },
            {
                $addFields: {
                    _feed_sort: {
                        $cond: [
                            { $eq: ['$is_pinned', true] },
                            '$created_at',
                            { $subtract: [new Date('9999-01-01'), '$created_at'] },
                        ],
                    },
                },
            },
            { $sort: { is_pinned: -1, _feed_sort: 1 } },
            { $skip: skip },
            { $limit: limit },
            {
                $lookup: {
                    from: 'accounts',
                    localField: 'author_id',
                    foreignField: '_id',
                    as: 'author_doc',
                    pipeline: [{ $project: { first_name: 1, last_name: 1, avatar_url: 1, link_instagram: 1, link_tiktok: 1, link_youtube: 1, role: 1, is_founding_member: 1 } }],
                },
            },
            { $unwind: { path: '$author_doc', preserveNullAndEmptyArrays: true } },
            // Incluir explicitamente todos os campos usados no feed (incl. enquete)
            {
                $project: {
                    _id: 1,
                    content: 1,
                    images: 1,
                    video_url: 1,
                    link_instagram_post: 1,
                    link_tiktok_post: 1,
                    link_youtube_post: 1,
                    category: 1,
                    media_type: 1,
                    tags: 1,
                    is_pinned: 1,
                    likes_count: 1,
                    comments_count: 1,
                    visibility: 1,
                    created_at: 1,
                    published_at: 1,
                    poll_question: 1,
                    poll_options: 1,
                    author_doc: 1,
                },
            },
        ]);
        const total = await Post.countDocuments(query);

        // Buscar likes, salvos e votos em enquete do usuário atual para esses posts
        let userLikes: Set<string> = new Set();
        let userSaved: Set<string> = new Set();
        const userPollVotes: Record<string, number> = {}; // postId -> option_index
        if (currentAccount) {
            const postIds = posts.map((p: any) => p._id);
            const pollPostIds = posts.filter((p: any) => p.poll_question).map((p: any) => p._id);

            const [likes, savedPosts, pollVotes] = await Promise.all([
                Like.find({
                    user_id: currentAccount._id,
                    target_type: 'post',
                    target_id: { $in: postIds },
                }).lean(),
                SavedPost.find({
                    account_id: currentAccount._id,
                    post_id: { $in: postIds },
                }).lean(),
                pollPostIds.length > 0
                    ? PollVote.find({
                          post_id: { $in: pollPostIds },
                          account_id: currentAccount._id,
                      }).lean()
                    : Promise.resolve([]),
            ]);

            userLikes = new Set(likes.map((l: any) => l.target_id.toString()));
            userSaved = new Set(savedPosts.map((s: any) => s.post_id.toString()));
            for (const pv of pollVotes as { post_id: { toString: () => string }; option_index: number }[]) {
                userPollVotes[pv.post_id.toString()] = pv.option_index;
            }
        }

        // Formatar posts para resposta (author_doc vem da agregação)
        const authorDoc = (post: any) => post.author_doc || post.author_id;
        const formattedPosts = posts.map((post: any) => ({
            id: post._id.toString(),
            author: {
                id: authorDoc(post)?._id?.toString(),
                name: authorDoc(post) ? `${authorDoc(post).first_name} ${authorDoc(post).last_name}`.trim() : 'Usuário',
                avatar_url: authorDoc(post)?.avatar_url,
                link_instagram: authorDoc(post)?.link_instagram,
                link_tiktok: authorDoc(post)?.link_tiktok,
                link_youtube: authorDoc(post)?.link_youtube,
                role: authorDoc(post)?.role,
                is_founding_member: authorDoc(post)?.is_founding_member === true,
            },
            content: post.content,
            images: post.images,
            video_url: post.video_url,
            link_instagram_post: post.link_instagram_post,
            link_tiktok_post: post.link_tiktok_post,
            link_youtube_post: post.link_youtube_post,
            category: post.category,
            media_type: post.media_type,
            tags: post.tags,
            is_pinned: post.is_pinned,
            likes_count: post.likes_count,
            comments_count: post.comments_count,
            liked: userLikes.has(post._id.toString()),
            saved: userSaved.has(post._id.toString()),
            visibility: post.visibility,
            created_at: post.created_at,
            published_at: post.published_at,
            poll_question: post.poll_question ?? null,
            poll_options: Array.isArray(post.poll_options) ? post.poll_options : null,
            poll_vote_index: post.poll_question ? (userPollVotes[post._id.toString()] ?? null) : null,
        }));

        return NextResponse.json({
            success: true,
            posts: formattedPosts,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
                hasMore: skip + posts.length < total,
            },
        });
    } catch (error) {
        console.error('Erro ao listar posts:', error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
}
