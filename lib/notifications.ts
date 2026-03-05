import mongoose from 'mongoose';
import Notification, { NotificationType } from '@/models/Notification';

interface CreateNotificationParams {
    recipientId: mongoose.Types.ObjectId | string;
    actorId: mongoose.Types.ObjectId | string;
    type: NotificationType;
    postId?: mongoose.Types.ObjectId | string | null;
    commentId?: mongoose.Types.ObjectId | string | null;
    storyId?: mongoose.Types.ObjectId | string | null;
    contentPreview?: string | null;
}

/**
 * Cria uma notificação no banco de dados
 * Não cria se o actor é o mesmo que o recipient (não notifica a si mesmo)
 * Usa upsert para evitar duplicatas
 */
export async function createNotification({
    recipientId,
    actorId,
    type,
    postId,
    commentId,
    storyId,
    contentPreview,
}: CreateNotificationParams): Promise<void> {
    try {
        console.log('🔔 Criando notificação...');
        console.log('   recipientId:', recipientId?.toString());
        console.log('   actorId:', actorId?.toString());
        console.log('   type:', type);

        // Não notificar a si mesmo
        if (recipientId.toString() === actorId.toString()) {
            console.log('⏭️ Ignorando: actor = recipient');
            return;
        }

        const notificationData = {
            recipient_id: new mongoose.Types.ObjectId(recipientId.toString()),
            actor_id: new mongoose.Types.ObjectId(actorId.toString()),
            type,
            post_id: postId ? new mongoose.Types.ObjectId(postId.toString()) : null,
            comment_id: commentId ? new mongoose.Types.ObjectId(commentId.toString()) : null,
            story_id: storyId ? new mongoose.Types.ObjectId(storyId.toString()) : null,
            content_preview: contentPreview?.slice(0, 150) || null,
            is_read: false,
        };

        console.log('📝 Dados da notificação:', JSON.stringify(notificationData, null, 2));

        // Usa findOneAndUpdate com upsert para evitar duplicatas
        // Se já existe uma notificação igual, apenas atualiza o timestamp e marca como não lida
        const result = await Notification.findOneAndUpdate(
            {
                recipient_id: notificationData.recipient_id,
                actor_id: notificationData.actor_id,
                type: notificationData.type,
                post_id: notificationData.post_id,
                comment_id: notificationData.comment_id,
                story_id: notificationData.story_id,
            },
            {
                $set: {
                    ...notificationData,
                    updated_at: new Date(),
                },
                $setOnInsert: {
                    created_at: new Date(),
                },
            },
            { upsert: true, new: true }
        );

        console.log(`✅ Notificação salva: ${type} para ${recipientId}, _id: ${result?._id}`);
    } catch (error) {
        // Log do erro mas não interrompe o fluxo principal
        console.error('❌ Erro ao criar notificação:', error);
    }
}

/**
 * Remove uma notificação (ex: quando descurte um post)
 */
export async function removeNotification({
    recipientId,
    actorId,
    type,
    postId,
    commentId,
}: Omit<CreateNotificationParams, 'contentPreview'>): Promise<void> {
    try {
        await Notification.deleteOne({
            recipient_id: new mongoose.Types.ObjectId(recipientId.toString()),
            actor_id: new mongoose.Types.ObjectId(actorId.toString()),
            type,
            post_id: postId ? new mongoose.Types.ObjectId(postId.toString()) : null,
            comment_id: commentId ? new mongoose.Types.ObjectId(commentId.toString()) : null,
        });

        console.log(`🔕 Notificação removida: ${type}`);
    } catch (error) {
        console.error('Erro ao remover notificação:', error);
    }
}

/**
 * Marca notificações como lidas
 */
export async function markNotificationsAsRead(
    recipientId: mongoose.Types.ObjectId | string,
    notificationIds?: string[]
): Promise<number> {
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const filter: any = {
            recipient_id: new mongoose.Types.ObjectId(recipientId.toString()),
            is_read: false,
        };

        // Se foram passados IDs específicos, marca apenas esses
        if (notificationIds && notificationIds.length > 0) {
            filter._id = {
                $in: notificationIds.map((id) => new mongoose.Types.ObjectId(id)),
            };
        }

        const result = await Notification.updateMany(filter, { $set: { is_read: true } });

        return result.modifiedCount;
    } catch (error) {
        console.error('Erro ao marcar notificações como lidas:', error);
        return 0;
    }
}

/**
 * Conta notificações não lidas
 */
export async function countUnreadNotifications(
    recipientId: mongoose.Types.ObjectId | string
): Promise<number> {
    try {
        return await Notification.countDocuments({
            recipient_id: new mongoose.Types.ObjectId(recipientId.toString()),
            is_read: false,
        });
    } catch (error) {
        console.error('Erro ao contar notificações:', error);
        return 0;
    }
}
