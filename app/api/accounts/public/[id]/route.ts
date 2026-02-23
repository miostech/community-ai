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
      .select('first_name last_name email avatar_url link_instagram link_tiktok link_youtube created_at followers_at_signup')
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

    // Buscar estatísticas de interação
    const [likesGivenResult, postsResult, commentsResult] = await Promise.all([
      // Likes dados pelo usuário
      Like.countDocuments({ user_id: accountId }),
      // Posts e likes recebidos
      Post.aggregate([
        { $match: { author_id: accountId, is_deleted: { $ne: true } } },
        { $group: { _id: null, count: { $sum: 1 }, totalLikes: { $sum: '$likes_count' } } }
      ]),
      // Comentários feitos
      Comment.countDocuments({ author_id: accountId, is_deleted: { $ne: true } }),
    ]);

    const likesGiven = likesGivenResult || 0;
    const postStats = postsResult[0] || { count: 0, totalLikes: 0 };
    const commentsCount = commentsResult || 0;

    // Score = likes dados + likes recebidos nos posts + total de posts * 2 + total de comentários
    const interactionCount = likesGiven + (postStats.totalLikes || 0) + (postStats.count * 2) + commentsCount;

    const acc = account as {
      first_name?: string;
      last_name?: string;
      avatar_url?: string | null;
      link_instagram?: string | null;
      link_tiktok?: string | null;
      link_youtube?: string | null;
      created_at?: Date | string;
      followers_at_signup?: number | null;
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
        interactionCount,
        stats: {
          likesGiven,
          likesReceived: postStats.totalLikes || 0,
          postsCount: postStats.count || 0,
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
