import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectMongo } from '@/lib/mongoose';
import Post from '@/models/Post';
import Comment from '@/models/Comment';
import Like from '@/models/Like';
import mongoose from 'mongoose';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export type NotificationType = 'like' | 'comment' | 'reply';

export interface NotificationItem {
  id: string;
  type: NotificationType;
  created_at: string;
  actor: {
    id: string;
    name: string;
    avatar_url: string | null;
  };
  post_id: string;
  post_preview?: string;
  comment_preview?: string;
}

function getDisplayName(first?: string, last?: string): string {
  const fullName = [first || '', last || ''].join(' ').trim();
  return fullName || 'Alguem';
}

export async function GET() {
  try {
    console.log('📬 Buscando notificações...');
    const session = await auth();
    if (!session?.user?.id) {
      console.log('❌ Sem sessão');
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    console.log('✅ Sessão encontrada, user.id:', session.user.id);
    const accountId = new mongoose.Types.ObjectId(session.user.id as string);
    await connectMongo();
    console.log('✅ MongoDB conectado');

    // Buscar quando foi a última vez que viu notificações
    const Account = (await import('@/models/Account')).default;
    const account = await Account.findById(accountId).select('last_notifications_read_at').lean();
    const lastReadAt = account?.last_notifications_read_at || new Date(0); // Se nunca leu, pega todas
    console.log('📅 Última leitura:', lastReadAt);

    const myPosts = await Post.find({ author_id: accountId }).select('_id content').lean();
    const myPostIds = myPosts.map((p) => p._id);
    const postPreviewById: Record<string, string> = {};
    myPosts.forEach((p) => {
      postPreviewById[p._id.toString()] = (p.content || '').slice(0, 80);
    });

    if (myPostIds.length === 0) {
      return NextResponse.json({ notifications: [], unread_count: 0 });
    }

    const myComments = await Comment.find({ author_id: accountId }).select('_id').lean();
    const myCommentIds = myComments.map((c) => c._id);

    const notifications: NotificationItem[] = [];

    const likes = await Like.find({
      target_type: 'post',
      target_id: { $in: myPostIds },
      user_id: { $ne: accountId },
    })
      .sort({ created_at: -1 })
      .limit(50)
      .populate('user_id', 'first_name last_name avatar_url')
      .lean();

    for (const like of likes) {
      const user = like.user_id as { _id: mongoose.Types.ObjectId; first_name?: string; last_name?: string; avatar_url?: string } | null;
      const userName = user ? getDisplayName(user.first_name, user.last_name) : 'Alguem';
      notifications.push({
        id: `like-${like._id}`,
        type: 'like',
        created_at: (like as { created_at: Date }).created_at?.toISOString() || new Date().toISOString(),
        actor: {
          id: user?._id?.toString() || '',
          name: userName,
          avatar_url: user?.avatar_url || null,
        },
        post_id: (like.target_id as mongoose.Types.ObjectId).toString(),
        post_preview: postPreviewById[(like.target_id as mongoose.Types.ObjectId).toString()],
      });
    }

    const commentsOnMyPosts = await Comment.find({
      post_id: { $in: myPostIds },
      author_id: { $ne: accountId },
      $or: [{ parent_id: { $exists: false } }, { parent_id: null }],
      is_deleted: { $ne: true },
    })
      .sort({ created_at: -1 })
      .limit(50)
      .populate('author_id', 'first_name last_name avatar_url')
      .lean();

    for (const comment of commentsOnMyPosts) {
      const author = comment.author_id as { _id: mongoose.Types.ObjectId; first_name?: string; last_name?: string; avatar_url?: string } | null;
      const authorName = author ? getDisplayName(author.first_name, author.last_name) : 'Alguem';
      notifications.push({
        id: `comment-${comment._id}`,
        type: 'comment',
        created_at: (comment as { created_at: Date }).created_at?.toISOString() || new Date().toISOString(),
        actor: {
          id: author?._id?.toString() || '',
          name: authorName,
          avatar_url: author?.avatar_url || null,
        },
        post_id: (comment.post_id as mongoose.Types.ObjectId).toString(),
        post_preview: postPreviewById[(comment.post_id as mongoose.Types.ObjectId).toString()],
        comment_preview: (comment.content || '').slice(0, 100),
      });
    }

    if (myCommentIds.length > 0) {
      const repliesToMe = await Comment.find({
        parent_id: { $in: myCommentIds },
        author_id: { $ne: accountId },
        is_deleted: { $ne: true },
      })
        .sort({ created_at: -1 })
        .limit(50)
        .populate('author_id', 'first_name last_name avatar_url')
        .lean();

      for (const reply of repliesToMe) {
        const author = reply.author_id as { _id: mongoose.Types.ObjectId; first_name?: string; last_name?: string; avatar_url?: string } | null;
        const authorName = author ? getDisplayName(author.first_name, author.last_name) : 'Alguem';
        notifications.push({
          id: `reply-${reply._id}`,
          type: 'reply',
          created_at: (reply as { created_at: Date }).created_at?.toISOString() || new Date().toISOString(),
          actor: {
            id: author?._id?.toString() || '',
            name: authorName,
            avatar_url: author?.avatar_url || null,
          },
          post_id: (reply.post_id as mongoose.Types.ObjectId).toString(),
          post_preview: postPreviewById[(reply.post_id as mongoose.Types.ObjectId).toString()],
          comment_preview: (reply.content || '').slice(0, 100),
        });
      }
    }

    notifications.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    const limited = notifications.slice(0, 30);

    // Contar apenas as não lidas (criadas depois do last_notifications_read_at)
    const unreadCount = limited.filter(n => new Date(n.created_at) > lastReadAt).length;

    console.log(`✅ Retornando ${limited.length} notificações (${unreadCount} não lidas)`);
    return NextResponse.json({
      notifications: limited,
      unread_count: unreadCount,
    });
  } catch (error) {
    console.error('❌ Erro ao buscar notificações:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST - Marcar notificações como lidas
export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const accountId = new mongoose.Types.ObjectId(session.user.id as string);
    await connectMongo();

    const Account = (await import('@/models/Account')).default;
    await Account.findByIdAndUpdate(accountId, {
      $set: { last_notifications_read_at: new Date() },
    });

    console.log('✅ Notificações marcadas como lidas');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ Erro ao marcar notificações como lidas:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
