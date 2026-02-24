import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { auth } from '@/lib/auth';
import { connectMongo } from '@/lib/mongoose';
import Post from '@/models/Post';
import Account from '@/models/Account';
import Like from '@/models/Like';
import SavedPost from '@/models/SavedPost';

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
        const account = await Account.findOne({ auth_user_id: authUserId }).select('_id first_name last_name avatar_url role').lean();
        if (!account) {
            return NextResponse.json({ error: 'Conta não encontrada' }, { status: 404 });
        }

        let body: Record<string, unknown>;
        try {
            body = await request.json();
        } catch {
            return NextResponse.json({ error: 'Corpo da requisição inválido' }, { status: 400 });
        }
        const {
            content,
            images,
            video_url,
            link_instagram_post,
            link_tiktok_post,
            link_youtube_post,
            category,
            tags,
            visibility,
        } = body;

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

        // Validação básica
        if (!content?.trim() && (!images || images.length === 0) && !video_url?.trim()) {
            return NextResponse.json(
                { error: 'Post deve ter conteúdo, imagens ou vídeo' },
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
        });

        await post.save();

        // Popular author para retornar dados completos
        await post.populate('author_id', 'first_name last_name avatar_url role');

        const authorPop = post.author_id as { _id: { toString: () => string }; first_name?: string; last_name?: string; avatar_url?: string; role?: string };
        return NextResponse.json({
            success: true,
            post: {
                id: post._id.toString(),
                author: {
                    id: authorPop?._id?.toString() ?? (account as { _id: { toString: () => string } })._id.toString(),
                    name: authorPop ? `${authorPop.first_name || ''} ${authorPop.last_name || ''}`.trim() : `${(account as { first_name?: string; last_name?: string }).first_name || ''} ${(account as { first_name?: string; last_name?: string }).last_name || ''}`.trim(),
                    avatar_url: authorPop?.avatar_url ?? (account as { avatar_url?: string }).avatar_url,
                    role: authorPop?.role,
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

        // Buscar account do usuário atual (com role para restringir categoria atualização)
        const currentAccount = await Account.findOne({ auth_user_id: authUserId }).select('_id role').lean();
        const userRole = (currentAccount as { role?: string } | null)?.role;
        const canSeeAtualizacao = userRole === 'admin' || userRole === 'moderator' || userRole === 'criador';

        // Construir query
        const query: Record<string, unknown> = {
            status: 'published',
        };

        if (category && category !== 'all') {
            query.category = category;
        }

        // Usuários sem role privilegiado não veem posts da categoria "atualização"
        if (!canSeeAtualizacao) {
            if (category === 'atualizacao') {
                return NextResponse.json({
                    success: true,
                    posts: [],
                    pagination: { page: 1, limit, total: 0, totalPages: 0, hasMore: false },
                });
            }
            query.category = query.category || { $ne: 'atualizacao' };
        }

        if (authorId) {
            query.author_id = authorId;
        }

        const skip = (page - 1) * limit;

        // Buscar posts com paginação
        const [posts, total] = await Promise.all([
            Post.find(query)
                .sort({ is_pinned: -1, created_at: -1 })
                .skip(skip)
                .limit(limit)
                .populate('author_id', 'first_name last_name avatar_url link_instagram link_tiktok link_youtube role')
                .lean(),
            Post.countDocuments(query),
        ]);

        // Buscar likes e salvos do usuário atual para esses posts
        let userLikes: Set<string> = new Set();
        let userSaved: Set<string> = new Set();
        if (currentAccount) {
            const postIds = posts.map((p: any) => p._id);

            const [likes, savedPosts] = await Promise.all([
                Like.find({
                    user_id: currentAccount._id,
                    target_type: 'post',
                    target_id: { $in: postIds },
                }).lean(),
                SavedPost.find({
                    account_id: currentAccount._id,
                    post_id: { $in: postIds },
                }).lean(),
            ]);

            userLikes = new Set(likes.map((l: any) => l.target_id.toString()));
            userSaved = new Set(savedPosts.map((s: any) => s.post_id.toString()));
        }

        // Formatar posts para resposta
        const formattedPosts = posts.map((post: any) => ({
            id: post._id.toString(),
            author: {
                id: post.author_id?._id?.toString(),
                name: post.author_id ? `${post.author_id.first_name} ${post.author_id.last_name}`.trim() : 'Usuário',
                avatar_url: post.author_id?.avatar_url,
                link_instagram: post.author_id?.link_instagram,
                link_tiktok: post.author_id?.link_tiktok,
                link_youtube: post.author_id?.link_youtube,
                role: post.author_id?.role,
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
