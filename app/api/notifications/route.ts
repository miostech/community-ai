import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectMongo } from '@/lib/mongoose';
import Notification from '@/models/Notification';
import Account from '@/models/Account';
import Comment from '@/models/Comment';
import { markNotificationsAsRead, countUnreadNotifications } from '@/lib/notifications';
import mongoose from 'mongoose';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export type NotificationType = 'like' | 'comment' | 'reply' | 'follow' | 'mention';

export interface NotificationItem {
  id: string;
  type: NotificationType;
  created_at: string;
  is_read: boolean;
  actor: {
    id: string;
    name: string;
    avatar_url: string | null;
  };
  post_id?: string;
  comment_id?: string;
  content_preview?: string;
  likes_count?: number;
}

function getDisplayName(first?: string, last?: string): string {
  const fullName = [first || '', last || ''].join(' ').trim();
  return fullName || 'Alguém';
}

// GET - Buscar notificações do usuário
export async function GET() {
  try {
    console.log('📬 Buscando notificações...');
    const session = await auth();
    if (!session?.user?.id) {
      console.log('❌ Sem sessão');
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Usar auth_user_id se disponível, senão usar id (igual à API de accounts)
    const authUserId = (session.user as { auth_user_id?: string }).auth_user_id || session.user.id;
    console.log('✅ Session auth_user_id:', authUserId);

    await connectMongo();

    // Buscar a conta do usuário
    const account = await Account.findOne({ auth_user_id: authUserId }).lean();

    if (!account) {
      console.log('❌ Account não encontrada para auth_user_id:', session.user.id);
      return NextResponse.json({ notifications: [], unread_count: 0 });
    }

    const accountId = account._id as mongoose.Types.ObjectId;
    console.log('✅ Account encontrada, _id:', accountId.toString());

    // Buscar notificações do Model
    const notifications = await Notification.find({ recipient_id: accountId })
      .sort({ created_at: -1 })
      .limit(50)
      .populate('actor_id', 'first_name last_name avatar_url')
      .lean();

    console.log('📋 Notificações encontradas no banco:', notifications.length);
    if (notifications.length > 0) {
      console.log('📋 Primeira notificação:', JSON.stringify(notifications[0], null, 2));
    }

    // Debug: buscar todas as notificações sem filtro
    const allNotifications = await Notification.find({}).limit(5).lean();
    console.log('🔍 Total de notificações no banco (sample):', allNotifications.length);
    if (allNotifications.length > 0) {
      console.log('🔍 Recipients das notificações:', allNotifications.map(n => n.recipient_id?.toString()));
    }

    // Contar não lidas
    const unreadCount = await countUnreadNotifications(accountId);

    // Buscar likes_count dos comentários para notificações de like em comentário
    const commentIds = notifications
      .filter((n) => n.type === 'like' && n.comment_id)
      .map((n) => n.comment_id);

    const commentsWithLikes = await Comment.find({
      _id: { $in: commentIds }
    }).select('_id likes_count').lean();

    const commentLikesMap = new Map<string, number>();
    commentsWithLikes.forEach((c: any) => {
      commentLikesMap.set(c._id.toString(), c.likes_count || 0);
    });

    // Formatar para o frontend
    const formattedNotifications: NotificationItem[] = notifications.map((n) => {
      const actor = n.actor_id as unknown as {
        _id: mongoose.Types.ObjectId;
        first_name?: string;
        last_name?: string;
        avatar_url?: string;
      } | null;

      // Buscar likes_count do comentário se for uma notificação de like em comentário
      let likesCount: number | undefined;
      if (n.type === 'like' && n.comment_id) {
        likesCount = commentLikesMap.get(n.comment_id.toString());
      }

      return {
        id: n._id.toString(),
        type: n.type,
        created_at: n.created_at.toISOString(),
        is_read: n.is_read,
        actor: {
          id: actor?._id?.toString() || '',
          name: actor ? getDisplayName(actor.first_name, actor.last_name) : 'Alguém',
          avatar_url: actor?.avatar_url || null,
        },
        post_id: n.post_id?.toString(),
        comment_id: n.comment_id?.toString(),
        content_preview: n.content_preview || undefined,
        likes_count: likesCount,
      };
    });

    console.log(`✅ ${formattedNotifications.length} notificações (${unreadCount} não lidas)`);
    return NextResponse.json({
      notifications: formattedNotifications,
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
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    await connectMongo();

    // Usar auth_user_id (Google ID) que é como o Account é indexado
    const authUserId = (session.user as any).auth_user_id || session.user.id;
    const account = await Account.findOne({ auth_user_id: authUserId }).lean();
    if (!account) {
      return NextResponse.json({ error: 'Conta não encontrada' }, { status: 404 });
    }

    const accountId = account._id as mongoose.Types.ObjectId;

    // Verificar se foram passados IDs específicos no body
    let notificationIds: string[] | undefined;
    try {
      const body = await request.json();
      notificationIds = body.notification_ids;
    } catch {
      // Body vazio = marcar todas como lidas
    }

    const markedCount = await markNotificationsAsRead(accountId, notificationIds);

    console.log(`✅ ${markedCount} notificações marcadas como lidas`);
    return NextResponse.json({
      success: true,
      marked_count: markedCount
    });
  } catch (error) {
    console.error('❌ Erro ao marcar notificações:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
