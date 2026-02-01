import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ISavedPost extends Document {
    _id: Types.ObjectId;
    account_id: Types.ObjectId; // Quem salvou
    post_id: Types.ObjectId; // Post salvo
    created_at: Date;
}

const SavedPostSchema = new Schema<ISavedPost>(
    {
        account_id: {
            type: Schema.Types.ObjectId,
            ref: 'Account',
            required: true,
            index: true,
        },
        post_id: {
            type: Schema.Types.ObjectId,
            ref: 'Post',
            required: true,
            index: true,
        },
        created_at: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: false,
    }
);

// Índice composto único - cada usuário só pode salvar um post uma vez
SavedPostSchema.index({ account_id: 1, post_id: 1 }, { unique: true });

// Índice para buscar posts salvos de um usuário ordenados por data
SavedPostSchema.index({ account_id: 1, created_at: -1 });

const SavedPost =
    mongoose.models.SavedPost ||
    mongoose.model<ISavedPost>('SavedPost', SavedPostSchema);

export default SavedPost;
