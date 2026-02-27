import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectMongo } from '@/lib/mongoose';
import Account from '@/models/Account';
import Post from '@/models/Post';
import Like from '@/models/Like';
import Comment from '@/models/Comment';
import { getSubscriptionsByEmail } from '@/lib/kiwify';
import { CURSOS, courseIdsIncludeCourse } from '@/lib/courses';
import mongoose from 'mongoose';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** GET - Dados públicos de uma conta (nome, avatar, redes, estatísticas) para exibir no perfil da comunidade */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id } = await params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    // skipCourses=true: próprio perfil já busca via check-subscriptions no client
    const skipCourses = request.nextUrl.searchParams.get('skipCourses') === 'true';

    await connectMongo();

    const accountId = new mongoose.Types.ObjectId(id);

    const account = await Account.findById(accountId)
      .select('first_name last_name email avatar_url link_instagram link_tiktok link_youtube created_at followers_at_signup role')
      .lean();

    if (!account) {
      return NextResponse.json({ error: 'Conta não encontrada' }, { status: 404 });
    }

    // Cursos que a pessoa tem acesso (Kiwify) — só para perfis de outros usuários.
    // Converte para slugs canônicos (mesma lógica da página /cursos com courseIdsIncludeCourse)
    // para que getCourseLabel funcione corretamente na exibição.
    let courseIds: string[] = [];
    if (!skipCourses) {
      const email = (account as { email?: string }).email?.trim();
      if (email) {
        try {
          const { courseIds: rawIds } = await getSubscriptionsByEmail(email);
          courseIds = CURSOS
            .filter((curso) => courseIdsIncludeCourse(rawIds ?? [], curso))
            .map((curso) => curso.id);
        } catch {
          // ignora erro Kiwify; perfil segue sem cursos
        }
      }
    }

    // Buscar estatísticas de interação (mesma regra da stories: sem auto-curtida, sem auto-comentário, só likes em posts)
    const [likesGivenResult, likesReceivedResult, postsCountResult, commentsResult] = await Promise.all([
      // Likes dados: só em posts, excluir auto-curtida
      Like.aggregate([
        { $match: { user_id: accountId, target_type: 'post' } },
        { $lookup: { from: 'posts', localField: 'target_id', foreignField: '_id', as: 'postDoc' } },
        { $unwind: '$postDoc' },
        { $match: { $expr: { $ne: ['$postDoc.author_id', '$user_id'] } } },
        { $count: 'total' },
      ]),
      // Likes recebidos: só de outros (em posts do usuário)
      Like.aggregate([
        { $match: { target_type: 'post' } },
        { $lookup: { from: 'posts', localField: 'target_id', foreignField: '_id', as: 'postDoc' } },
        { $unwind: '$postDoc' },
        { $match: { $expr: { $ne: ['$user_id', '$postDoc.author_id'] }, 'postDoc.author_id': accountId, 'postDoc.is_deleted': { $ne: true } } },
        { $count: 'total' },
      ]),
      // Total de posts
      Post.aggregate([
        { $match: { author_id: accountId, is_deleted: { $ne: true } } },
        { $count: 'total' },
      ]),
      // Comentários: só em posts de outros
      Comment.aggregate([
        { $match: { author_id: accountId, is_deleted: { $ne: true } } },
        { $lookup: { from: 'posts', localField: 'post_id', foreignField: '_id', as: 'postDoc' } },
        { $unwind: '$postDoc' },
        { $match: { $expr: { $ne: ['$author_id', '$postDoc.author_id'] } } },
        { $count: 'total' },
      ]),
    ]);

    const likesGiven = likesGivenResult[0]?.total ?? 0;
    const likesReceived = likesReceivedResult[0]?.total ?? 0;
    const postsCount = postsCountResult[0]?.total ?? 0;
    const commentsCount = commentsResult[0]?.total ?? 0;

    // Score = likes dados + likes recebidos (só de outros) + total de posts * 2 + comentários (só em posts de outros)
    const interactionCount = likesGiven + likesReceived + (postsCount * 2) + commentsCount;

    const acc = account as {
      first_name?: string;
      last_name?: string;
      avatar_url?: string | null;
      link_instagram?: string | null;
      link_tiktok?: string | null;
      link_youtube?: string | null;
      created_at?: Date | string;
      followers_at_signup?: number | null;
      role?: 'user' | 'moderator' | 'admin' | 'criador';
    };

    return NextResponse.json({
      success: true,
      profile: {
        name: `${acc.first_name || ''} ${acc.last_name || ''}`.trim() || 'Membro da comunidade',
        avatar_url: acc.avatar_url ?? null,
        link_instagram: acc.link_instagram?.trim() || null,
        link_tiktok: acc.link_tiktok?.trim() || null,
        link_youtube: acc.link_youtube?.trim() || null,
        created_at: acc.created_at ?? null,
        followers_at_signup: acc.followers_at_signup ?? null,
        role: acc.role,
        interactionCount,
        stats: {
          likesGiven,
          likesReceived,
          postsCount,
          commentsCount,
        },
        courseIds,
      },
    });
  } catch (error) {
    console.error('Erro ao buscar perfil público:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
