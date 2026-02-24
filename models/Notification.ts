import mongoose, { Schema, Document, Model } from 'mongoose';

export type NotificationType = 'like' | 'comment' | 'reply' | 'follow' | 'mention' | 'moderation';

export interface INotification extends Document {
    _id: mongoose.Types.ObjectId;
    recipient_id: mongoose.Types.ObjectId; // Quem recebe a notificação
    actor_id: mongoose.Types.ObjectId; // Quem fez a ação
    type: NotificationType;
    post_id?: mongoose.Types.ObjectId; // Post relacionado (se houver)
    comment_id?: mongoose.Types.ObjectId; // Comentário relacionado (se houver)
    content_preview?: string; // Preview do conteúdo (comentário, post, etc)
    is_read: boolean;
    created_at: Date;
    updated_at: Date;
}

const NotificationSchema = new Schema<INotification>(
    {
        recipient_id: {
            type: Schema.Types.ObjectId,
            ref: 'Account',
            required: true,
            index: true,
        },
        actor_id: {
            type: Schema.Types.ObjectId,
            ref: 'Account',
            required: true,
        },
        type: {
            type: String,
            enum: ['like', 'comment', 'reply', 'follow', 'mention', 'moderation'],
            required: true,
        },
        post_id: {
            type: Schema.Types.ObjectId,
            ref: 'Post',
            default: null,
        },
        comment_id: {
            type: Schema.Types.ObjectId,
            ref: 'Comment',
            default: null,
        },
        content_preview: {
            type: String,
            default: null,
            maxlength: 150,
        },
        is_read: {
            type: Boolean,
            default: false,
            index: true,
        },
    },
    {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    }
);

// Índice composto para buscar notificações não lidas de um usuário
NotificationSchema.index({ recipient_id: 1, is_read: 1, created_at: -1 });

// Índice para evitar notificações duplicadas
NotificationSchema.index(
    { recipient_id: 1, actor_id: 1, type: 1, post_id: 1, comment_id: 1 },
    { unique: true, sparse: true }
);

// Evitar que o modelo seja recompilado em hot reload
const Notification: Model<INotification> =
    mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema);

export default Notification;
