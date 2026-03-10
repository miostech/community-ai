import webpush from 'web-push';
import mongoose from 'mongoose';
import { connectMongo } from '@/lib/mongoose';
import PushSubscription from '@/models/PushSubscription';
import Account from '@/models/Account';
import Story from '@/models/Story';
import { NotificationType } from '@/models/Notification';

/**
 * Eventos que disparam notificação in-app (e push quando o usuário está inscrito):
 * - like (post, comment, story)
 * - comment, reply, mention (post/comments)
 * - story_comment
 * - follow
 * - new_campaign, new_post (para seguidores)
 * - subscription_cancel_request (admin)
 * - moderation (moderadores)
 */

const VAPID_PUBLIC = process.env.VAPID_PUBLIC_KEY?.trim();
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY?.trim();
const CONTACT_MAILTO = process.env.VAPID_MAILTO?.trim() || 'mailto:support@example.com';

let vapidConfigured = false;

function ensureVapid() {
  if (!VAPID_PUBLIC || !VAPID_PRIVATE) {
    return false;
  }
  if (!vapidConfigured) {
    webpush.setVapidDetails(CONTACT_MAILTO, VAPID_PUBLIC, VAPID_PRIVATE);
    vapidConfigured = true;
  }
  return true;
}

export function getVapidPublicKey(): string | null {
  return VAPID_PUBLIC || null;
}

export interface PushPayload {
  title: string;
  body?: string;
  url?: string;
  tag?: string;
}

/**
 * Envia notificação push para todas as subscriptions de um usuário (account_id).
 * Remove subscriptions que falharem (expiradas/inválidas).
 */
export async function sendPushToUser(
  accountId: mongoose.Types.ObjectId | string,
  payload: PushPayload
): Promise<{ sent: number; failed: number }> {
  if (!ensureVapid()) {
    return { sent: 0, failed: 0 };
  }

  await connectMongo();
  const subs = await PushSubscription.find({
    account_id: new mongoose.Types.ObjectId(accountId.toString()),
  }).lean();

  if (subs.length === 0) return { sent: 0, failed: 0 };

  const pushPayload = JSON.stringify({
    title: payload.title,
    body: payload.body ?? '',
    url: payload.url ?? '/dashboard/comunidade',
    tag: payload.tag ?? 'notification',
  });

  let sent = 0;
  let failed = 0;
  const toDelete: mongoose.Types.ObjectId[] = [];

  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.keys.p256dh,
            auth: sub.keys.auth,
          },
          expirationTime: sub.expiration_time ?? undefined,
        },
        pushPayload,
        {
          TTL: 60 * 60 * 24, // 24h
        }
      );
      sent++;
    } catch (err) {
      failed++;
      const status = (err as { statusCode?: number })?.statusCode;
      if (status === 410 || status === 404 || status === 403) {
        toDelete.push(sub._id as mongoose.Types.ObjectId);
      }
    }
  }

  if (toDelete.length > 0) {
    await PushSubscription.deleteMany({ _id: { $in: toDelete } });
  }

  return { sent, failed };
}

export interface SendPushForNotificationParams {
  recipientId: mongoose.Types.ObjectId | string;
  actorId: mongoose.Types.ObjectId | string;
  type: NotificationType;
  contentPreview?: string | null;
  postId?: mongoose.Types.ObjectId | string | null;
  commentId?: mongoose.Types.ObjectId | string | null;
  storyId?: mongoose.Types.ObjectId | string | null;
  /** Para story_comment: dono do story (opcional; se não passado, será carregado pelo storyId). */
  storyOwnerId?: mongoose.Types.ObjectId | string | null;
  campaignId?: mongoose.Types.ObjectId | string | null;
}

/**
 * Monta título/corpo/url a partir do tipo de notificação e envia push.
 * Chamado após createNotification() para enviar push ao mesmo destinatário.
 */
export async function sendPushForNotification(
  params: SendPushForNotificationParams
): Promise<void> {
  const {
    recipientId,
    actorId,
    type,
    contentPreview,
    postId,
    storyId,
    storyOwnerId: storyOwnerIdParam,
    campaignId,
  } = params;

  await connectMongo();
  const [actor, recipient, storyDoc] = await Promise.all([
    Account.findById(actorId).select('first_name last_name').lean(),
    Account.findById(recipientId).select('_id').lean(),
    type === 'story_comment' && storyId
      ? Story.findById(storyId).select('account_id').lean()
      : Promise.resolve(null),
  ]);

  const storyOwnerId = storyOwnerIdParam ?? (storyDoc as { account_id?: mongoose.Types.ObjectId } | null)?.account_id ?? null;

  if (!recipient) return;

  const a = actor as { first_name?: string; last_name?: string } | null;
  const actorName = a
    ? [a.first_name, a.last_name].filter(Boolean).join(' ').trim() || 'Alguém'
    : 'Alguém';

  let title: string;
  let body: string;
  let url = '/dashboard/comunidade';
  let tag: string = type;

  switch (type) {
    case 'like':
      title = 'Nova curtida';
      body = `${actorName} curtiu seu conteúdo`;
      if (postId) url = `/dashboard/comunidade/${postId}`;
      tag = postId ? `like-post-${postId}` : 'like';
      break;
    case 'comment':
      title = 'Novo comentário';
      body = contentPreview ? `${actorName}: ${contentPreview.slice(0, 80)}${contentPreview.length > 80 ? '…' : ''}` : `${actorName} comentou no seu post`;
      if (postId) url = `/dashboard/comunidade/${postId}`;
      break;
    case 'reply':
      title = 'Nova resposta';
      body = contentPreview ? `${actorName}: ${contentPreview.slice(0, 80)}…` : `${actorName} respondeu seu comentário`;
      if (postId) url = `/dashboard/comunidade/${postId}`;
      break;
    case 'mention':
      title = 'Você foi mencionado(a)';
      body = contentPreview ? `${actorName}: ${contentPreview.slice(0, 80)}…` : `${actorName} te mencionou`;
      if (postId) url = `/dashboard/comunidade/${postId}`;
      break;
    case 'follow':
      title = 'Novo seguidor';
      body = `${actorName} começou a te seguir`;
      url = '/dashboard/comunidade';
      break;
    case 'story_comment':
      title = 'Comentário no story';
      body = contentPreview ? `${actorName}: ${contentPreview.slice(0, 80)}…` : `${actorName} comentou no seu story`;
      if (storyOwnerId) url = `/dashboard/comunidade/perfil/${storyOwnerId}`;
      break;
    case 'new_campaign':
      title = 'Nova campanha';
      body = `${actorName} ativou uma nova campanha`;
      if (campaignId) url = `/dashboard/campanhas/${campaignId}`;
      break;
    case 'new_post':
      title = 'Novo post na comunidade';
      body = contentPreview ? `${contentPreview.slice(0, 80)}…` : `${actorName} publicou na comunidade`;
      if (postId) url = `/dashboard/comunidade/${postId}`;
      break;
    case 'subscription_cancel_request':
      title = 'Solicitação de cancelamento';
      body = 'Um usuário solicitou cancelamento da assinatura';
      url = '/dashboard';
      break;
    case 'moderation':
      title = 'Comentário para moderação';
      body = contentPreview ? contentPreview.slice(0, 80) + '…' : 'Novo comentário aguardando aprovação';
      if (postId) url = `/dashboard/comunidade/${postId}`;
      break;
    default:
      title = 'Nova notificação';
      body = contentPreview?.slice(0, 100) ?? 'Você tem uma nova notificação';
  }

  if (storyId && !url.includes('/perfil/')) {
    url = '/dashboard/comunidade';
  }

  await sendPushToUser(recipientId, { title, body, url, tag });
}
