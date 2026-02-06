import mongoose, { Model, Schema, Types } from 'mongoose';

export interface ChatConversation {
    _id: Types.ObjectId;
    account_id: Types.ObjectId;
    title: string;
    system_prompt?: string;
    model: string;
    summary: string;
    total_tokens_in: number;
    total_tokens_out: number;
    status: 'active' | 'archived';
    created_at: Date;
    updated_at: Date;
}

const ChatConversationSchema = new Schema(
    {
        account_id: {
            type: Schema.Types.ObjectId,
            ref: 'Account',
            required: true,
            index: true,
        },
        title: { type: String, trim: true, default: 'Nova conversa' },
        system_prompt: { type: String, trim: true },
        model: { type: String, trim: true, default: 'gpt-4o-mini' },
        /** Resumo acumulado da conversa, atualizado a cada troca de mensagem */
        summary: { type: String, trim: true, default: '' },
        total_tokens_in: { type: Number, default: 0 },
        total_tokens_out: { type: Number, default: 0 },
        status: {
            type: String,
            enum: ['active', 'archived'],
            default: 'active',
        },
    },
    {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
        versionKey: false,
    }
);

const ChatConversationModel: Model<ChatConversation> =
    mongoose.models.ChatConversation ??
    mongoose.model<ChatConversation>('ChatConversation', ChatConversationSchema);

export default ChatConversationModel;
