import mongoose, { InferSchemaType, Model, Schema } from 'mongoose';

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

export type ChatConversation = InferSchemaType<typeof ChatConversationSchema>;

const ChatConversationModel: Model<ChatConversation> =
    mongoose.models.ChatConversation ??
    mongoose.model<ChatConversation>('ChatConversation', ChatConversationSchema);

export default ChatConversationModel;
