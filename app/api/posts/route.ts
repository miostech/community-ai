import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectMongo } from '@/lib/mongoose';
import Post from '@/models/Post';
import Account from '@/models/Account';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// POST - Criar um novo post
export async function POST(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const authUserId = (session.user as any).auth_user_id || session.user.id;

        await connectMongo();

        // Buscar o account do usuário
        const account = await Account.findOne({ auth_user_id: authUserId });
        if (!account) {
            return NextResponse.json({ error: 'Conta não encontrada' }, { status: 404 });
        }

        const body = await request.json();
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

        const post = new Post({
            author_id: account._id,
            content: content?.trim() || '',
            images: images || [],
            video_url: video_url?.trim() || undefined,
            link_instagram_post: link_instagram_post?.trim() || undefined,
            link_tiktok_post: link_tiktok_post?.trim() || undefined,
            link_youtube_post: link_youtube_post?.trim() || undefined,
            category: category || 'geral',
            media_type,
            tags: tags || [],
            visibility: visibility || 'members',
            status: 'published',
            published_at: new Date(),
        });

        await post.save();

        // Popular author para retornar dados completos
        await post.populate('author_id', 'first_name last_name avatar_url');

        return NextResponse.json({
            success: true,
            post: {
                id: post._id.toString(),
                author: {
                    id: account._id.toString(),
                    name: `${account.first_name} ${account.last_name}`.trim(),
                    avatar_url: account.avatar_url,
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
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
}

// GET - Listar posts (feed)
export async function GET(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const category = searchParams.get('category'); // filtro opcional
        const authorId = searchParams.get('author_id'); // posts de um usuário

        await connectMongo();

        // Construir query
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

        // Buscar posts com paginação
        const [posts, total] = await Promise.all([
            Post.find(query)
                .sort({ is_pinned: -1, created_at: -1 })
                .skip(skip)
                .limit(limit)
                .populate('author_id', 'first_name last_name avatar_url link_instagram link_tiktok link_youtube')
                .lean(),
            Post.countDocuments(query),
        ]);

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
