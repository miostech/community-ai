import mongoose, { Model, Schema, Types } from 'mongoose';

export interface ChatMessage {
    _id: Types.ObjectId;
    conversation_id: Types.ObjectId;
    account_id: Types.ObjectId;
    role: 'user' | 'assistant' | 'system';
    content: string;
    tokens_in: number;
    tokens_out: number;
    created_at: Date;
}

const ChatMessageSchema = new Schema(
    {
        conversation_id: {
            type: Schema.Types.ObjectId,
            ref: 'ChatConversation',
            required: true,
            index: true,
        },
        account_id: {
            type: Schema.Types.ObjectId,
            ref: 'Account',
            required: true,
            index: true,
        },
        role: {
            type: String,
            enum: ['user', 'assistant', 'system'],
            required: true,
        },
        content: { type: String, required: true },
        tokens_in: { type: Number, default: 0 },
        tokens_out: { type: Number, default: 0 },
    },
    {
        timestamps: { createdAt: 'created_at', updatedAt: false },
        versionKey: false,
    }
);

/** Índice composto para buscar mensagens de uma conversa em ordem */
ChatMessageSchema.index({ conversation_id: 1, created_at: 1 });

const ChatMessageModel: Model<ChatMessage> =
    mongoose.models.ChatMessage ??
    mongoose.model<ChatMessage>('ChatMessage', ChatMessageSchema);

export default ChatMessageModel;
